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

// Helper function to parse German date format
function parseGermanDate(dateStr) {
  if (!dateStr) return null;
  
  // Handle date ranges (e.g., "01.07.2025 - 04.07.2025")
  if (dateStr.includes(' - ')) {
    dateStr = dateStr.split(' - ')[0];
  }
  
  // Handle Excel serial dates (e.g., "45869")
  if (/^\d{5}$/.test(dateStr)) {
    const excelDate = parseInt(dateStr);
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  
  // Handle DD.MM.YYYY format
  const parts = dateStr.split('.');
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const year = parseInt(parts[2]);
    
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      // Create date in UTC to avoid timezone issues
      const date = new Date(Date.UTC(year, month - 1, day));
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
  }
  
  // Try parsing as standard date
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  return null;
}

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

// Migrate only essential customer data
async function migrateEssentialCustomers() {
  console.log('\n🚀 Migrating essential customer data...');
  
  try {
    const customersSnapshot = await getDocs(collection(firestore, 'customers'));
    const customers = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (const doc of customersSnapshot.docs) {
      try {
        const data = doc.data();
        
        // Migrate one by one to catch individual errors
        const customer = {
          firebase_id: doc.id,
          customer_number: data.customerNumber || `CUST-${doc.id.substring(0, 8)}`,
          name: data.name || 'Unknown',
          email: data.email || '',
          phone: data.phone || '',
          from_address: data.fromAddress || '',
          to_address: data.toAddress || '',
          moving_date: parseGermanDate(data.movingDate),
          apartment: {
            rooms: parseInt(data.apartment?.rooms) || 0,
            area: parseInt(data.apartment?.area) || 0,
            floor: parseInt(data.apartment?.floor) || 0,
            hasElevator: Boolean(data.apartment?.hasElevator)
          },
          services: Array.isArray(data.services) ? data.services : [],
          sales_status: data.salesStatus || null,
          status: data.status || null,
          notes: data.notes || ''
        };
        
        const { error } = await supabase.from('customers').insert(customer);
        
        if (error) {
          console.error(`❌ Error migrating customer ${doc.id}:`, error.message);
          errorCount++;
        } else {
          successCount++;
          if (successCount % 10 === 0) {
            console.log(`✅ Migrated ${successCount} customers...`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing customer ${doc.id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n✅ Customer migration completed: ${successCount} successful, ${errorCount} errors`);
    return { total: customersSnapshot.size, migrated: successCount, errors: errorCount };
  } catch (error) {
    console.error('❌ Error in customer migration:', error);
    return { total: 0, migrated: 0, errors: 1 };
  }
}

// Migrate share tokens
async function migrateShareTokens() {
  console.log('\n🚀 Migrating share tokens...');
  
  try {
    // Get customer mapping
    const { data: customerMapping } = await supabase
      .from('customers')
      .select('id, firebase_id');
    
    const customerMap = new Map(
      customerMapping?.map(c => [c.firebase_id, c.id]) || []
    );
    
    console.log(`📊 Found ${customerMap.size} customers for token mapping`);
    
    const shareTokensSnapshot = await getDocs(collection(firestore, 'shareTokens'));
    let successCount = 0;
    let errorCount = 0;
    
    for (const doc of shareTokensSnapshot.docs) {
      try {
        const data = doc.data();
        const customerId = customerMap.get(data.customerId);
        
        if (!customerId) {
          console.warn(`⚠️  No customer found for share token ${doc.id}`);
          errorCount++;
          continue;
        }
        
        const shareToken = {
          id: doc.id,
          firebase_id: doc.id,
          customer_id: customerId,
          customer_name: data.customerName || 'Unknown',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: data.createdBy || 'system',
          permissions: data.permissions || {
            viewCustomer: true,
            viewQuote: true,
            viewInvoice: false,
            viewPhotos: true
          },
          access_count: parseInt(data.accessCount) || 0
        };
        
        const { error } = await supabase.from('share_tokens').insert(shareToken);
        
        if (error) {
          console.error(`❌ Error migrating share token ${doc.id}:`, error.message);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing share token ${doc.id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n✅ Share token migration completed: ${successCount} successful, ${errorCount} errors`);
    return { total: shareTokensSnapshot.size, migrated: successCount, errors: errorCount };
  } catch (error) {
    console.error('❌ Error in share token migration:', error);
    return { total: 0, migrated: 0, errors: 1 };
  }
}

// Main migration function
async function runMigration() {
  console.log('🚀 Starting essential data migration from Firebase to Supabase...\n');
  
  const startTime = Date.now();
  
  try {
    // Test connection
    console.log('🔌 Testing Supabase connection...');
    const { error: supabaseError } = await supabase.from('customers').select('count').limit(1);
    if (supabaseError) {
      throw new Error(`Supabase connection failed: ${supabaseError.message}`);
    }
    console.log('✅ Connection established\n');
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await supabase.from('share_tokens').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ Existing data cleared\n');
    
    // Run migrations
    const customerResult = await migrateEssentialCustomers();
    const tokenResult = await migrateShareTokens();
    
    // Print summary
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log('\n📊 Migration Summary:');
    console.log('====================');
    console.log(`Customers: ${customerResult.migrated}/${customerResult.total} migrated (${customerResult.errors} errors)`);
    console.log(`Share Tokens: ${tokenResult.migrated}/${tokenResult.total} migrated (${tokenResult.errors} errors)`);
    console.log(`\n⏱️  Total time: ${duration} seconds`);
    
    if (customerResult.migrated > 0) {
      console.log('\n🎉 Essential data migration completed successfully!');
      console.log('\n📝 Next steps:');
      console.log('1. Test the application with Supabase');
      console.log('2. Update environment variables in Vercel');
      console.log('3. Deploy to production');
    } else {
      console.log('\n⚠️  No data was migrated. Please check the errors above.');
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration().catch(console.error);