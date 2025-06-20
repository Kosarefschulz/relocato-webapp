const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// PostgreSQL connection configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'umzugsapp',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Helper function to convert Firestore timestamp to PostgreSQL timestamp
function convertTimestamp(firestoreTimestamp) {
  if (!firestoreTimestamp) return null;
  
  // Handle Firestore timestamp format
  if (firestoreTimestamp._seconds) {
    return new Date(firestoreTimestamp._seconds * 1000).toISOString();
  }
  
  // Handle ISO string
  if (typeof firestoreTimestamp === 'string') {
    return new Date(firestoreTimestamp).toISOString();
  }
  
  return null;
}

// Migrate users
async function migrateUsers(users) {
  console.log('Migrating users...');
  
  for (const doc of users) {
    const { id, data } = doc;
    
    try {
      await pool.query(`
        INSERT INTO users (firebase_uid, email, name, role, email_access, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (firebase_uid) DO UPDATE SET
          email = EXCLUDED.email,
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          email_access = EXCLUDED.email_access
      `, [
        id,
        data.email,
        data.name || data.displayName,
        data.role || 'consultant',
        data.emailAccess || false,
        convertTimestamp(data.createdAt) || new Date().toISOString()
      ]);
    } catch (error) {
      console.error(`Error migrating user ${id}:`, error.message);
    }
  }
}

// Migrate customers
async function migrateCustomers(customers) {
  console.log('Migrating customers...');
  
  for (const doc of customers) {
    const { id, data } = doc;
    
    try {
      const result = await pool.query(`
        INSERT INTO customers (
          firebase_id, customer_number, name, email, phone,
          moving_date, from_address, to_address,
          apartment_rooms, apartment_area, apartment_floor, apartment_has_elevator,
          services, notes, viewing_scheduled, viewing_date, contacted,
          tags, priority, source, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16, $17, $18, $19, $20, $21
        )
        ON CONFLICT (firebase_id) DO UPDATE SET
          customer_number = EXCLUDED.customer_number,
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone
        RETURNING id
      `, [
        id,
        data.customerNumber,
        data.name,
        data.email,
        data.phone,
        data.movingDate,
        data.fromAddress,
        data.toAddress,
        data.apartment?.rooms,
        data.apartment?.area,
        data.apartment?.floor,
        data.apartment?.hasElevator,
        data.services || [],
        data.notes,
        data.viewingScheduled || false,
        convertTimestamp(data.viewingDate),
        data.contacted || false,
        data.tags || [],
        data.priority || 'medium',
        data.source,
        convertTimestamp(data.createdAt) || new Date().toISOString()
      ]);
      
      // Migrate customer notes if they exist
      if (data.extendedNotes && Array.isArray(data.extendedNotes)) {
        const customerId = result.rows[0].id;
        
        for (const note of data.extendedNotes) {
          await pool.query(`
            INSERT INTO customer_notes (
              customer_id, content, category, is_internal, created_at
            ) VALUES ($1, $2, $3, $4, $5)
          `, [
            customerId,
            note.content,
            note.category || 'general',
            note.isInternal || false,
            convertTimestamp(note.createdAt) || new Date().toISOString()
          ]);
        }
      }
    } catch (error) {
      console.error(`Error migrating customer ${id}:`, error.message);
    }
  }
}

// Migrate quotes
async function migrateQuotes(quotes) {
  console.log('Migrating quotes...');
  
  for (const doc of quotes) {
    const { id, data } = doc;
    
    try {
      // Get customer ID from firebase_id
      const customerResult = await pool.query(
        'SELECT id FROM customers WHERE firebase_id = $1',
        [data.customerId]
      );
      
      if (customerResult.rows.length === 0) {
        console.warn(`Customer not found for quote ${id}, skipping...`);
        continue;
      }
      
      const customerId = customerResult.rows[0].id;
      
      const result = await pool.query(`
        INSERT INTO quotes (
          firebase_id, customer_id, customer_name, price, comment,
          status, volume, distance, version, is_latest_version,
          template_id, template_name, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
        )
        ON CONFLICT (firebase_id) DO UPDATE SET
          price = EXCLUDED.price,
          status = EXCLUDED.status
        RETURNING id
      `, [
        id,
        customerId,
        data.customerName,
        data.price,
        data.comment,
        data.status || 'draft',
        data.volume,
        data.distance,
        data.version || 1,
        data.isLatestVersion !== false,
        data.templateId,
        data.templateName,
        convertTimestamp(data.createdAt) || new Date().toISOString()
      ]);
      
      // Migrate quote version history
      if (data.versionHistory && Array.isArray(data.versionHistory)) {
        const quoteId = result.rows[0].id;
        
        for (const version of data.versionHistory) {
          await pool.query(`
            INSERT INTO quote_versions (
              quote_id, version, price, changes, status, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            quoteId,
            version.version,
            version.price,
            version.changes,
            version.status,
            convertTimestamp(version.createdAt) || new Date().toISOString()
          ]);
        }
      }
    } catch (error) {
      console.error(`Error migrating quote ${id}:`, error.message);
    }
  }
}

// Migrate invoices
async function migrateInvoices(invoices) {
  console.log('Migrating invoices...');
  
  for (const doc of invoices) {
    const { id, data } = doc;
    
    try {
      // Get customer and quote IDs
      const customerResult = await pool.query(
        'SELECT id FROM customers WHERE firebase_id = $1',
        [data.customerId]
      );
      
      if (customerResult.rows.length === 0) {
        console.warn(`Customer not found for invoice ${id}, skipping...`);
        continue;
      }
      
      const customerId = customerResult.rows[0].id;
      
      let quoteId = null;
      if (data.quoteId) {
        const quoteResult = await pool.query(
          'SELECT id FROM quotes WHERE firebase_id = $1',
          [data.quoteId]
        );
        if (quoteResult.rows.length > 0) {
          quoteId = quoteResult.rows[0].id;
        }
      }
      
      const result = await pool.query(`
        INSERT INTO invoices (
          firebase_id, quote_id, customer_id, customer_name,
          invoice_number, price, tax_amount, total_price,
          due_date, paid_date, status, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        )
        ON CONFLICT (firebase_id) DO UPDATE SET
          status = EXCLUDED.status,
          paid_date = EXCLUDED.paid_date
        RETURNING id
      `, [
        id,
        quoteId,
        customerId,
        data.customerName,
        data.invoiceNumber,
        data.price,
        data.taxAmount || 0,
        data.totalPrice,
        convertTimestamp(data.dueDate),
        convertTimestamp(data.paidDate),
        data.status || 'draft',
        convertTimestamp(data.createdAt) || new Date().toISOString()
      ]);
      
      // Migrate invoice items
      if (data.items && Array.isArray(data.items)) {
        const invoiceId = result.rows[0].id;
        
        for (const item of data.items) {
          await pool.query(`
            INSERT INTO invoice_items (
              invoice_id, description, quantity, unit_price, total_price
            ) VALUES ($1, $2, $3, $4, $5)
          `, [
            invoiceId,
            item.description,
            item.quantity,
            item.unitPrice,
            item.totalPrice
          ]);
        }
      }
    } catch (error) {
      console.error(`Error migrating invoice ${id}:`, error.message);
    }
  }
}

// Migrate email history
async function migrateEmailHistory(emails) {
  console.log('Migrating email history...');
  
  for (const doc of emails) {
    const { id, data } = doc;
    
    try {
      let customerId = null;
      if (data.customerId) {
        const customerResult = await pool.query(
          'SELECT id FROM customers WHERE firebase_id = $1',
          [data.customerId]
        );
        if (customerResult.rows.length > 0) {
          customerId = customerResult.rows[0].id;
        }
      }
      
      await pool.query(`
        INSERT INTO email_history (
          firebase_id, customer_id, subject, body,
          from_email, to_email, type, status, sent_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (firebase_id) DO NOTHING
      `, [
        id,
        customerId,
        data.subject,
        data.body,
        data.from || data.fromEmail,
        data.to || data.toEmail,
        data.type,
        data.status,
        convertTimestamp(data.sentAt || data.createdAt) || new Date().toISOString()
      ]);
    } catch (error) {
      console.error(`Error migrating email ${id}:`, error.message);
    }
  }
}

// Main migration function
async function migrate() {
  try {
    console.log('Starting migration...\n');
    
    const exportDir = path.join(__dirname, 'firestore-export');
    
    // Load exported data
    const users = JSON.parse(await fs.readFile(path.join(exportDir, 'users.json'), 'utf8'));
    const customers = JSON.parse(await fs.readFile(path.join(exportDir, 'customers.json'), 'utf8'));
    const quotes = JSON.parse(await fs.readFile(path.join(exportDir, 'quotes.json'), 'utf8'));
    const invoices = JSON.parse(await fs.readFile(path.join(exportDir, 'invoices.json'), 'utf8'));
    const emailHistory = JSON.parse(await fs.readFile(path.join(exportDir, 'emailHistory.json'), 'utf8'));
    
    // Run migrations in order
    await migrateUsers(users);
    await migrateCustomers(customers);
    await migrateQuotes(quotes);
    await migrateInvoices(invoices);
    await migrateEmailHistory(emailHistory);
    
    console.log('\nMigration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

// Run migration
migrate();