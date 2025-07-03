const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const { createClient } = require('@supabase/supabase-js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDCeOBZw96klWFkolRQMnhr5DG4Ol2eMjY",
  authDomain: "umzugsapp.firebaseapp.com",
  projectId: "umzugsapp",
  storageBucket: "umzugsapp.firebasestorage.app",
  messagingSenderId: "130199132038",
  appId: "1:130199132038:web:3be72ffeb2b1f55be93e07",
  measurementId: "G-MQWV0M47PN"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp);

// Initialize Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://kmxipuaqierjqaikuimi.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteGlwdWFxaWVyanFhaWt1aW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MjU2NDUsImV4cCI6MjA2NjAwMTY0NX0.2S3cAnBh4zDFFQNpJ-VN17YrSJXyclyFjywN2izuPaU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Migration status tracking
let migrationStatus = {
  customers: { total: 0, migrated: 0, errors: [] },
  quotes: { total: 0, migrated: 0, errors: [] },
  shareTokens: { total: 0, migrated: 0, errors: [] }
};

// Helper function to convert Firebase timestamp to ISO string
function convertTimestamp(value) {
  if (!value) return null;
  
  // Handle Firestore Timestamp
  if (value && typeof value === 'object' && value.seconds) {
    return new Date(value.seconds * 1000).toISOString();
  }
  
  // Handle date string
  if (typeof value === 'string') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  
  // Handle Date object
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString();
  }
  
  return null;
}

// Helper function to log progress
function logProgress(collection, current, total) {
  const percentage = Math.round((current / total) * 100);
  console.log(`📊 ${collection}: ${current}/${total} (${percentage}%)`);
}

// Helper function to batch insert data
async function batchInsert(table, data, batchSize = 50) {
  let successCount = 0;
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    try {
      const { error } = await supabase.from(table).insert(batch);
      if (error) {
        console.error(`❌ Error inserting batch ${i}-${i + batch.length} into ${table}:`, error);
        // Continue with next batch instead of throwing
      } else {
        successCount += batch.length;
      }
    } catch (err) {
      console.error(`❌ Unexpected error in batch ${i}-${i + batch.length}:`, err);
    }
    logProgress(table, Math.min(i + batchSize, data.length), data.length);
  }
  
  return successCount;
}

// Migrate customers
async function migrateCustomers() {
  console.log('\n🚀 Migrating customers...');
  
  try {
    const customersSnapshot = await getDocs(collection(firestore, 'customers'));
    const customers = [];
    let skippedCount = 0;
    
    customersSnapshot.forEach((doc) => {
      try {
        const data = doc.data();
        customers.push({
          firebase_id: doc.id,
          customer_number: data.customerNumber || `CUST-${doc.id.substring(0, 8)}`,
          name: data.name || 'Unknown',
          email: data.email || '',
          phone: data.phone || '',
          from_address: data.fromAddress || '',
          to_address: data.toAddress || '',
          moving_date: data.movingDate || null,
          apartment: {
            rooms: data.apartment?.rooms || 0,
            area: data.apartment?.area || 0,
            floor: data.apartment?.floor || 0,
            hasElevator: data.apartment?.hasElevator || false
          },
          services: data.services || [],
          sales_status: data.salesStatus || null,
          status: data.status || null,
          cancelled_at: convertTimestamp(data.cancelledAt),
          notes: data.notes || '',
          volume: data.volume || null,
          distance: data.distance || null,
          furniture_assembly_price: data.furnitureAssemblyPrice || 0,
          packing_service_price: data.packingServicePrice || 0,
          storage_service_price: data.storageServicePrice || 0,
          disposal_service_price: data.disposalServicePrice || 0,
          cleaning_service_price: data.cleaningServicePrice || 0,
          bore_service_price: data.boreServicePrice || 0,
          heavy_item_price: data.heavyItemPrice || 0,
          subtotal: data.subtotal || 0,
          tax: data.tax || 0,
          total: data.total || 0,
          created_at: convertTimestamp(data.createdAt) || new Date().toISOString(),
          updated_at: convertTimestamp(data.updatedAt) || new Date().toISOString()
        });
      } catch (error) {
        console.warn(`⚠️  Skipping customer ${doc.id} due to error:`, error.message);
        skippedCount++;
      }
    });
    
    migrationStatus.customers.total = customersSnapshot.size;
    console.log(`📦 Found ${customersSnapshot.size} customers (${customers.length} valid, ${skippedCount} skipped)`);
    
    if (customers.length > 0) {
      const migrated = await batchInsert('customers', customers);
      migrationStatus.customers.migrated = migrated;
    }
    
    console.log(`✅ Customers migration completed: ${migrationStatus.customers.migrated}/${migrationStatus.customers.total} migrated`);
  } catch (error) {
    console.error('❌ Error migrating customers:', error);
    migrationStatus.customers.errors.push(error);
  }
}

// Migrate quotes
async function migrateQuotes() {
  console.log('\n🚀 Migrating quotes...');
  
  try {
    const quotesSnapshot = await getDocs(collection(firestore, 'quotes'));
    const quotes = [];
    let skippedCount = 0;
    
    // Get customer ID mapping
    const { data: customerMapping } = await supabase
      .from('customers')
      .select('id, firebase_id');
    
    const customerMap = new Map(
      customerMapping?.map(c => [c.firebase_id, c.id]) || []
    );
    
    console.log(`📊 Found ${customerMap.size} customers in Supabase for mapping`);
    
    quotesSnapshot.forEach((doc) => {
      try {
        const data = doc.data();
        const customerId = customerMap.get(data.customerId);
        
        if (!customerId) {
          console.warn(`⚠️  No customer found for quote ${doc.id} (customer: ${data.customerId})`);
          skippedCount++;
          return;
        }
        
        quotes.push({
          firebase_id: doc.id,
          customer_id: customerId,
          customer_name: data.customerName || 'Unknown',
          status: data.status || 'draft',
          price: data.price || 0,
          volume: data.volume || null,
          distance: data.distance || null,
          move_date: data.moveDate || null,
          move_from: data.moveFrom || '',
          move_to: data.moveTo || '',
          confirmation_token: data.confirmationToken || null,
          confirmed_at: convertTimestamp(data.confirmedAt),
          confirmed_by: data.confirmedBy || null,
          comment: data.comment || '',
          created_by: data.createdBy || 'system',
          services: data.services || {},
          created_at: convertTimestamp(data.createdAt) || new Date().toISOString(),
          updated_at: convertTimestamp(data.updatedAt) || new Date().toISOString()
        });
      } catch (error) {
        console.warn(`⚠️  Skipping quote ${doc.id} due to error:`, error.message);
        skippedCount++;
      }
    });
    
    migrationStatus.quotes.total = quotesSnapshot.size;
    console.log(`📦 Found ${quotesSnapshot.size} quotes (${quotes.length} valid, ${skippedCount} skipped)`);
    
    if (quotes.length > 0) {
      const migrated = await batchInsert('quotes', quotes);
      migrationStatus.quotes.migrated = migrated;
    }
    
    console.log(`✅ Quotes migration completed: ${migrationStatus.quotes.migrated}/${migrationStatus.quotes.total} migrated`);
  } catch (error) {
    console.error('❌ Error migrating quotes:', error);
    migrationStatus.quotes.errors.push(error);
  }
}

// Migrate share tokens
async function migrateShareTokens() {
  console.log('\n🚀 Migrating share tokens...');
  
  try {
    const shareTokensSnapshot = await getDocs(collection(firestore, 'shareTokens'));
    const shareTokens = [];
    let skippedCount = 0;
    
    // Get customer ID mapping
    const { data: customerMapping } = await supabase
      .from('customers')
      .select('id, firebase_id');
    
    const customerMap = new Map(
      customerMapping?.map(c => [c.firebase_id, c.id]) || []
    );
    
    shareTokensSnapshot.forEach((doc) => {
      try {
        const data = doc.data();
        const customerId = customerMap.get(data.customerId);
        
        if (!customerId) {
          console.warn(`⚠️  No customer found for share token ${doc.id}`);
          skippedCount++;
          return;
        }
        
        // Calculate expiry date if not set
        let expiresAt = convertTimestamp(data.expiresAt);
        if (!expiresAt) {
          const createdDate = convertTimestamp(data.createdAt) || new Date().toISOString();
          const expiry = new Date(createdDate);
          expiry.setDate(expiry.getDate() + 30);
          expiresAt = expiry.toISOString();
        }
        
        shareTokens.push({
          id: doc.id, // Use Firebase ID as Supabase ID for share tokens
          firebase_id: doc.id,
          customer_id: customerId,
          customer_name: data.customerName || 'Unknown',
          expires_at: expiresAt,
          created_by: data.createdBy || 'system',
          permissions: data.permissions || {
            viewCustomer: true,
            viewQuote: true,
            viewInvoice: false,
            viewPhotos: true
          },
          access_count: data.accessCount || 0,
          last_accessed_at: convertTimestamp(data.lastAccessedAt),
          created_at: convertTimestamp(data.createdAt) || new Date().toISOString()
        });
      } catch (error) {
        console.warn(`⚠️  Skipping share token ${doc.id} due to error:`, error.message);
        skippedCount++;
      }
    });
    
    migrationStatus.shareTokens.total = shareTokensSnapshot.size;
    console.log(`📦 Found ${shareTokensSnapshot.size} share tokens (${shareTokens.length} valid, ${skippedCount} skipped)`);
    
    if (shareTokens.length > 0) {
      const migrated = await batchInsert('share_tokens', shareTokens);
      migrationStatus.shareTokens.migrated = migrated;
    }
    
    console.log(`✅ Share tokens migration completed: ${migrationStatus.shareTokens.migrated}/${migrationStatus.shareTokens.total} migrated`);
  } catch (error) {
    console.error('❌ Error migrating share tokens:', error);
    migrationStatus.shareTokens.errors.push(error);
  }
}

// Main migration function
async function runMigration() {
  console.log('🚀 Starting Firebase to Supabase migration...\n');
  
  const startTime = Date.now();
  
  try {
    // Test connections
    console.log('🔌 Testing connections...');
    const { error: supabaseError } = await supabase.from('customers').select('count').limit(1);
    if (supabaseError) {
      throw new Error(`Supabase connection failed: ${supabaseError.message}`);
    }
    console.log('✅ Connections established\n');
    
    // Run migrations in order (respecting foreign key constraints)
    await migrateCustomers();
    await migrateQuotes();
    await migrateShareTokens();
    
    // Update migration status
    console.log('\n📊 Updating migration status...');
    const updates = Object.entries(migrationStatus).map(([table, status]) => ({
      table_name: table,
      records_migrated: status.migrated,
      status: status.errors.length > 0 ? 'partial' : status.migrated > 0 ? 'completed' : 'pending',
      error_message: status.errors.length > 0 ? JSON.stringify(status.errors) : null,
      last_migrated_at: new Date().toISOString()
    }));
    
    for (const update of updates) {
      await supabase
        .from('migration_status')
        .update(update)
        .eq('table_name', update.table_name);
    }
    
    // Print summary
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log('\n📊 Migration Summary:');
    console.log('====================');
    
    let totalMigrated = 0;
    let totalRecords = 0;
    
    Object.entries(migrationStatus).forEach(([table, status]) => {
      totalMigrated += status.migrated;
      totalRecords += status.total;
      
      if (status.total > 0) {
        const success = status.migrated === status.total && status.errors.length === 0;
        const emoji = success ? '✅' : status.migrated > 0 ? '⚠️' : '❌';
        console.log(`${emoji} ${table}: ${status.migrated}/${status.total} migrated`);
        if (status.errors.length > 0) {
          console.log(`   ⚠️  ${status.errors.length} errors occurred`);
        }
      }
    });
    
    console.log(`\n📊 Total: ${totalMigrated}/${totalRecords} records migrated`);
    console.log(`⏱️  Total time: ${duration} seconds`);
    console.log('\n🎉 Migration completed!');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration().catch(console.error);