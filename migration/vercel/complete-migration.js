#!/usr/bin/env node

/**
 * Komplette Migration von Firebase zu Vercel
 * Führt alle Migrationsschritte automatisch aus
 */

const admin = require('firebase-admin');
const { Pool } = require('pg');
const { put } = require('@vercel/blob');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Progress tracking
let progress = {
  customers: { total: 0, migrated: 0 },
  quotes: { total: 0, migrated: 0 },
  invoices: { total: 0, migrated: 0 },
  emailHistory: { total: 0, migrated: 0 },
  users: { total: 0, migrated: 0 },
  templates: { total: 0, migrated: 0 }
};

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccount = require('../serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
    console.log('⚠️  Make sure serviceAccountKey.json is in migration/ folder');
    process.exit(1);
  }
}

const db = admin.firestore();

// Initialize PostgreSQL
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

// Main migration function
async function migrate() {
  console.log('🚀 Starting Complete Firebase to Vercel Migration');
  console.log('=================================================\n');
  
  try {
    // Test connections
    await testConnections();
    
    // Export all data from Firestore
    console.log('\n📥 Phase 1: Exporting from Firestore...');
    await exportFirestore();
    
    // Migrate to PostgreSQL
    console.log('\n📤 Phase 2: Importing to PostgreSQL...');
    await migrateToPostgres();
    
    // Verify migration
    console.log('\n✅ Phase 3: Verifying migration...');
    await verifyMigration();
    
    // Summary
    console.log('\n📊 Migration Summary:');
    console.log('====================');
    Object.entries(progress).forEach(([collection, stats]) => {
      console.log(`${collection}: ${stats.migrated}/${stats.total} migrated`);
    });
    
    console.log('\n✨ Migration completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Test connections
async function testConnections() {
  console.log('🔍 Testing connections...');
  
  // Test PostgreSQL
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ PostgreSQL connected');
  } catch (error) {
    throw new Error(`PostgreSQL connection failed: ${error.message}`);
  }
  
  // Test Firestore
  try {
    const test = await db.collection('_test').doc('test').set({ test: true });
    await db.collection('_test').doc('test').delete();
    console.log('✅ Firestore connected');
  } catch (error) {
    throw new Error(`Firestore connection failed: ${error.message}`);
  }
}

// Export all Firestore data
async function exportFirestore() {
  const collections = ['users', 'customers', 'quotes', 'invoices', 'emailHistory', 'emailTemplates', 'quoteTemplates'];
  const exportDir = path.join(__dirname, '../exports');
  
  // Create export directory
  await fs.mkdir(exportDir, { recursive: true });
  
  for (const collection of collections) {
    console.log(`📁 Exporting ${collection}...`);
    
    try {
      const snapshot = await db.collection(collection).get();
      const data = [];
      
      snapshot.forEach(doc => {
        data.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      progress[collection] = { total: data.length, migrated: 0 };
      
      // Save to file
      await fs.writeFile(
        path.join(exportDir, `${collection}.json`),
        JSON.stringify(data, null, 2)
      );
      
      console.log(`✅ Exported ${data.length} ${collection}`);
    } catch (error) {
      console.error(`❌ Failed to export ${collection}:`, error.message);
    }
  }
}

// Migrate all data to PostgreSQL
async function migrateToPostgres() {
  // Create schema if not exists
  console.log('📊 Creating database schema...');
  try {
    const schemaPath = path.join(__dirname, 'vercel-schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    await pool.query(schema);
    console.log('✅ Schema created/updated');
  } catch (error) {
    console.log('⚠️  Schema might already exist:', error.message);
  }
  
  // Migrate each collection
  await migrateUsers();
  await migrateCustomers();
  await migrateQuotes();
  await migrateInvoices();
  await migrateEmailHistory();
  await migrateTemplates();
}

// Migrate users
async function migrateUsers() {
  console.log('\n👥 Migrating users...');
  const data = JSON.parse(await fs.readFile(path.join(__dirname, '../exports/users.json'), 'utf8'));
  
  for (const user of data) {
    try {
      await pool.query(`
        INSERT INTO users (
          id, email, display_name, photo_url, role, email_access,
          created_at, updated_at, last_login, auth_provider, is_active, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          updated_at = EXCLUDED.updated_at,
          last_login = EXCLUDED.last_login
      `, [
        user.id || user.uid,
        user.email,
        user.displayName || user.display_name,
        user.photoURL || user.photo_url,
        user.role || 'user',
        user.emailAccess !== false,
        user.createdAt?._seconds ? new Date(user.createdAt._seconds * 1000) : new Date(),
        user.updatedAt?._seconds ? new Date(user.updatedAt._seconds * 1000) : new Date(),
        user.lastLogin?._seconds ? new Date(user.lastLogin._seconds * 1000) : null,
        user.authProvider || 'password',
        user.isActive !== false,
        JSON.stringify(user.metadata || {})
      ]);
      
      progress.users.migrated++;
    } catch (error) {
      console.error(`Failed to migrate user ${user.email}:`, error.message);
    }
  }
  
  console.log(`✅ Migrated ${progress.users.migrated}/${progress.users.total} users`);
}

// Migrate customers
async function migrateCustomers() {
  console.log('\n🏢 Migrating customers...');
  const data = JSON.parse(await fs.readFile(path.join(__dirname, '../exports/customers.json'), 'utf8'));
  
  for (const customer of data) {
    try {
      await pool.query(`
        INSERT INTO customers (
          id, customer_number, name, email, phone,
          from_address, to_address, move_date, notes,
          source, status, metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (id) DO UPDATE SET
          updated_at = EXCLUDED.updated_at,
          metadata = EXCLUDED.metadata
      `, [
        customer.id,
        customer.customerNumber || customer.customerId || customer.id,
        customer.name || 'Unbekannt',
        customer.email,
        customer.phone || customer.phoneNumber,
        JSON.stringify({
          street: customer.fromAddress?.street || customer.pickupAddress?.street || '',
          city: customer.fromAddress?.city || customer.pickupAddress?.city || '',
          zip: customer.fromAddress?.zip || customer.pickupAddress?.postalCode || '',
          country: customer.fromAddress?.country || 'Deutschland'
        }),
        JSON.stringify({
          street: customer.toAddress?.street || customer.deliveryAddress?.street || '',
          city: customer.toAddress?.city || customer.deliveryAddress?.city || '',
          zip: customer.toAddress?.zip || customer.deliveryAddress?.postalCode || '',
          country: customer.toAddress?.country || 'Deutschland'
        }),
        customer.moveDate ? new Date(customer.moveDate) : null,
        customer.notes || customer.comment,
        customer.source || 'manual',
        customer.status || 'active',
        JSON.stringify({ ...customer.metadata, migrated_at: new Date() }),
        customer.createdAt?._seconds ? new Date(customer.createdAt._seconds * 1000) : new Date(),
        customer.updatedAt?._seconds ? new Date(customer.updatedAt._seconds * 1000) : new Date()
      ]);
      
      progress.customers.migrated++;
      
      if (progress.customers.migrated % 100 === 0) {
        console.log(`  Progress: ${progress.customers.migrated}/${progress.customers.total}`);
      }
    } catch (error) {
      console.error(`Failed to migrate customer ${customer.name}:`, error.message);
    }
  }
  
  console.log(`✅ Migrated ${progress.customers.migrated}/${progress.customers.total} customers`);
}

// Migrate quotes
async function migrateQuotes() {
  console.log('\n📋 Migrating quotes...');
  const data = JSON.parse(await fs.readFile(path.join(__dirname, '../exports/quotes.json'), 'utf8'));
  
  for (const quote of data) {
    try {
      await pool.query(`
        INSERT INTO quotes (
          id, customer_id, customer_name, price, volume,
          distance, move_date, status, from_address, to_address,
          services, items, comment, metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO UPDATE SET
          updated_at = EXCLUDED.updated_at,
          status = EXCLUDED.status
      `, [
        quote.id,
        quote.customerId,
        quote.customerName,
        parseFloat(quote.price || 0),
        parseInt(quote.volume || 0),
        parseFloat(quote.distance || 0),
        quote.moveDate ? new Date(quote.moveDate) : null,
        quote.status || 'draft',
        JSON.stringify(quote.fromAddress || {}),
        JSON.stringify(quote.toAddress || {}),
        JSON.stringify(quote.services || []),
        JSON.stringify(quote.items || []),
        quote.comment,
        JSON.stringify({ ...quote.metadata, migrated_at: new Date() }),
        quote.createdAt?._seconds ? new Date(quote.createdAt._seconds * 1000) : new Date(),
        quote.updatedAt?._seconds ? new Date(quote.updatedAt._seconds * 1000) : new Date()
      ]);
      
      progress.quotes.migrated++;
      
      if (progress.quotes.migrated % 100 === 0) {
        console.log(`  Progress: ${progress.quotes.migrated}/${progress.quotes.total}`);
      }
    } catch (error) {
      console.error(`Failed to migrate quote ${quote.id}:`, error.message);
    }
  }
  
  console.log(`✅ Migrated ${progress.quotes.migrated}/${progress.quotes.total} quotes`);
}

// Migrate invoices
async function migrateInvoices() {
  console.log('\n💰 Migrating invoices...');
  const data = JSON.parse(await fs.readFile(path.join(__dirname, '../exports/invoices.json'), 'utf8'));
  
  for (const invoice of data) {
    try {
      await pool.query(`
        INSERT INTO invoices (
          id, invoice_number, customer_id, quote_id,
          amount, tax_amount, total_amount, status,
          sent_date, paid_date, due_date, items,
          notes, metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO UPDATE SET
          updated_at = EXCLUDED.updated_at,
          status = EXCLUDED.status,
          paid_date = EXCLUDED.paid_date
      `, [
        invoice.id,
        invoice.invoiceNumber || invoice.id,
        invoice.customerId,
        invoice.quoteId,
        parseFloat(invoice.amount || 0),
        parseFloat(invoice.taxAmount || invoice.tax || 0),
        parseFloat(invoice.totalAmount || invoice.total || 0),
        invoice.status || 'draft',
        invoice.sentDate?._seconds ? new Date(invoice.sentDate._seconds * 1000) : null,
        invoice.paidDate?._seconds ? new Date(invoice.paidDate._seconds * 1000) : null,
        invoice.dueDate ? new Date(invoice.dueDate) : null,
        JSON.stringify(invoice.items || []),
        invoice.notes,
        JSON.stringify({ ...invoice.metadata, migrated_at: new Date() }),
        invoice.createdAt?._seconds ? new Date(invoice.createdAt._seconds * 1000) : new Date(),
        invoice.updatedAt?._seconds ? new Date(invoice.updatedAt._seconds * 1000) : new Date()
      ]);
      
      progress.invoices.migrated++;
    } catch (error) {
      console.error(`Failed to migrate invoice ${invoice.invoiceNumber}:`, error.message);
    }
  }
  
  console.log(`✅ Migrated ${progress.invoices.migrated}/${progress.invoices.total} invoices`);
}

// Migrate email history
async function migrateEmailHistory() {
  console.log('\n📧 Migrating email history...');
  const data = JSON.parse(await fs.readFile(path.join(__dirname, '../exports/emailHistory.json'), 'utf8'));
  
  for (const email of data) {
    try {
      await pool.query(`
        INSERT INTO email_history (
          customer_id, to_email, from_email, subject,
          content, status, sent_at, message_id,
          template_type, quote_id, invoice_id,
          metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        email.customerId,
        email.to || email.toEmail,
        email.from || email.fromEmail || 'bielefeld@relocato.de',
        email.subject,
        email.content || email.body,
        email.status || 'sent',
        email.sentAt?._seconds ? new Date(email.sentAt._seconds * 1000) : new Date(),
        email.messageId,
        email.templateType || email.template,
        email.quoteId,
        email.invoiceId,
        JSON.stringify({ ...email.metadata, migrated_at: new Date() }),
        email.createdAt?._seconds ? new Date(email.createdAt._seconds * 1000) : new Date()
      ]);
      
      progress.emailHistory.migrated++;
      
      if (progress.emailHistory.migrated % 500 === 0) {
        console.log(`  Progress: ${progress.emailHistory.migrated}/${progress.emailHistory.total}`);
      }
    } catch (error) {
      // Email history might have duplicates, ignore
    }
  }
  
  console.log(`✅ Migrated ${progress.emailHistory.migrated}/${progress.emailHistory.total} emails`);
}

// Migrate templates
async function migrateTemplates() {
  console.log('\n📄 Migrating templates...');
  
  // Email templates
  try {
    const emailTemplates = JSON.parse(await fs.readFile(path.join(__dirname, '../exports/emailTemplates.json'), 'utf8'));
    
    for (const template of emailTemplates) {
      await pool.query(`
        INSERT INTO email_templates (
          id, name, subject, content, variables,
          category, is_active, metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          updated_at = EXCLUDED.updated_at,
          content = EXCLUDED.content
      `, [
        template.id,
        template.name,
        template.subject,
        template.content || template.body,
        JSON.stringify(template.variables || []),
        template.category,
        template.isActive !== false,
        JSON.stringify(template.metadata || {}),
        template.createdAt?._seconds ? new Date(template.createdAt._seconds * 1000) : new Date(),
        template.updatedAt?._seconds ? new Date(template.updatedAt._seconds * 1000) : new Date()
      ]);
      
      progress.templates.migrated++;
    }
  } catch (error) {
    console.error('Failed to migrate email templates:', error.message);
  }
  
  // Quote templates
  try {
    const quoteTemplates = JSON.parse(await fs.readFile(path.join(__dirname, '../exports/quoteTemplates.json'), 'utf8'));
    
    for (const template of quoteTemplates) {
      await pool.query(`
        INSERT INTO quote_templates (
          id, name, description, base_price,
          price_per_cbm, price_per_km, services,
          is_active, is_default, metadata,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          updated_at = EXCLUDED.updated_at
      `, [
        template.id,
        template.name,
        template.description,
        parseFloat(template.basePrice || 0),
        parseFloat(template.pricePerCbm || 0),
        parseFloat(template.pricePerKm || 0),
        JSON.stringify(template.services || []),
        template.isActive !== false,
        template.isDefault === true,
        JSON.stringify(template.metadata || {}),
        template.createdAt?._seconds ? new Date(template.createdAt._seconds * 1000) : new Date(),
        template.updatedAt?._seconds ? new Date(template.updatedAt._seconds * 1000) : new Date()
      ]);
      
      progress.templates.migrated++;
    }
  } catch (error) {
    console.error('Failed to migrate quote templates:', error.message);
  }
  
  console.log(`✅ Migrated ${progress.templates.migrated} templates`);
}

// Verify migration
async function verifyMigration() {
  const checks = {
    users: await pool.query('SELECT COUNT(*) FROM users'),
    customers: await pool.query('SELECT COUNT(*) FROM customers'),
    quotes: await pool.query('SELECT COUNT(*) FROM quotes'),
    invoices: await pool.query('SELECT COUNT(*) FROM invoices'),
    emailHistory: await pool.query('SELECT COUNT(*) FROM email_history'),
    emailTemplates: await pool.query('SELECT COUNT(*) FROM email_templates'),
    quoteTemplates: await pool.query('SELECT COUNT(*) FROM quote_templates')
  };
  
  console.log('\n📊 Database contents:');
  Object.entries(checks).forEach(([table, result]) => {
    console.log(`  ${table}: ${result.rows[0].count} records`);
  });
  
  // Check data integrity
  console.log('\n🔍 Checking data integrity...');
  
  // Check quotes have valid customers
  const orphanQuotes = await pool.query(`
    SELECT COUNT(*) FROM quotes q
    LEFT JOIN customers c ON q.customer_id = c.id
    WHERE c.id IS NULL
  `);
  
  if (orphanQuotes.rows[0].count > 0) {
    console.log(`⚠️  Found ${orphanQuotes.rows[0].count} quotes without customers`);
  } else {
    console.log('✅ All quotes have valid customers');
  }
  
  // Check invoices have valid customers
  const orphanInvoices = await pool.query(`
    SELECT COUNT(*) FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id
    WHERE c.id IS NULL
  `);
  
  if (orphanInvoices.rows[0].count > 0) {
    console.log(`⚠️  Found ${orphanInvoices.rows[0].count} invoices without customers`);
  } else {
    console.log('✅ All invoices have valid customers');
  }
}

// Run migration
migrate().catch(console.error);