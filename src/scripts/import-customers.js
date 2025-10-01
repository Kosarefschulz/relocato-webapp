const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parse/sync');
const { v4: uuidv4 } = require('uuid');

// Supabase configuration
const supabaseUrl = 'https://kmxipuaqierjqaikuimi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteGlwdWFxaWVyanFhaWt1aW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MjU2NDUsImV4cCI6MjA2NjAwMTY0NX0.2S3cAnBh4zDFFQNpJ-VN17YrSJXyclyFjywN2izuPaU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Generate customer number
function generateCustomerNumber() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `RS-${timestamp}-${random}`;
}

// Clean and prepare customer data
function prepareCustomerData(row) {
  const firstName = row['First Name'] || '';
  const lastName = row['Last Name'] || '';
  const fullName = `${firstName} ${lastName}`.trim() || row['Account Name'] || 'Unbekannt';

  const email = row['Email'] || '';
  const phone = row['Phone'] || '';
  const description = row['Description'] || '';

  // Extract address info from description if available
  let fromAddress = '';
  let toAddress = '';
  let movingDate = null;

  // Try to extract moving information from description
  const descParts = description.split(';');
  if (descParts.length > 0) {
    const meetingInfo = descParts[0];
    // Look for patterns like "UT:" or "BT:" which might indicate moving info
    if (meetingInfo.includes('€')) {
      // Price mentioned, likely a move
      const priceMatch = meetingInfo.match(/(\d+(?:\.\d+)?(?:,\d+)?)\s*€/);
      if (priceMatch) {
        // Found price, this is likely a customer
      }
    }
  }

  return {
    id: uuidv4(),
    customer_number: generateCustomerNumber(),
    name: fullName,
    email: email.toLowerCase(),
    phone: phone,
    from_address: fromAddress || 'Noch nicht angegeben',
    to_address: toAddress || 'Noch nicht angegeben',
    moving_date: movingDate,
    apartment: 0,
    services: ['Umzug'],
    sales_status: 'lead',
    status: 'active',
    is_deleted: false,
    notes: description,
    source: 'CSV Import - Zoho CRM',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

async function testConnection() {
  try {
    console.log('🔗 Testing Supabase connection...');
    const { data, error } = await supabase
      .from('customers')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
    console.log('✅ Connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Connection test error:', error);
    return false;
  }
}

async function importCustomers() {
  try {
    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      console.log('⚠️  Please check your Supabase configuration');
      return;
    }

    console.log('📂 Reading CSV file...');
    const csvContent = fs.readFileSync('/Users/sergejschulz/Downloads/zoho_crm_contacts_import.csv', 'utf-8');

    console.log('📊 Parsing CSV data...');
    const records = csv.parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`Found ${records.length} records to import`);

    // Prepare all customers
    const customers = records.map(prepareCustomerData);

    console.log('🚀 Starting import to Supabase...');

    // Import one by one for better error tracking
    let imported = 0;
    let failed = 0;
    const failedRecords = [];

    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];

      try {
        const { data, error } = await supabase
          .from('customers')
          .insert([customer])
          .select();

        if (error) {
          console.error(`❌ Failed to import ${customer.name}:`, error.message);
          failed++;
          failedRecords.push({ name: customer.name, error: error.message });
        } else {
          imported++;
          console.log(`✅ [${imported}/${customers.length}] Imported: ${customer.name}`);
        }
      } catch (err) {
        console.error(`❌ Exception importing ${customer.name}:`, err.message);
        failed++;
        failedRecords.push({ name: customer.name, error: err.message });
      }

      // Add small delay to avoid rate limiting
      if (i > 0 && i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('\n📈 Import Summary:');
    console.log(`✅ Successfully imported: ${imported} customers`);
    console.log(`❌ Failed: ${failed} customers`);
    console.log(`📊 Total processed: ${customers.length} customers`);

    if (failedRecords.length > 0) {
      console.log('\n❌ Failed records:');
      failedRecords.forEach(record => {
        console.log(`  - ${record.name}: ${record.error}`);
      });
    }

  } catch (error) {
    console.error('❌ Import failed:', error);
  }
}

// Run the import
importCustomers();