const { createClient } = require('@supabase/supabase-js');

// Supabase configuration - gleiche wie im MCP Server
const supabaseUrl = 'https://kmxipuaqierjqaikuimi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteGlwdWFxaWVyanFhaWt1aW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MjU2NDUsImV4cCI6MjA2NjAwMTY0NX0.2S3cAnBh4zDFFQNpJ-VN17YrSJXyclyFjywN2izuPaU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔗 Testing Supabase connection...');
  console.log('URL:', supabaseUrl);

  try {
    // Test 1: Basic connection
    const { data: testData, error: testError } = await supabase
      .from('customers')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('❌ Connection test failed:', testError);
      return false;
    }

    console.log('✅ Connection successful!');

    // Test 2: Count customers
    const { count, error: countError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Count failed:', countError);
    } else {
      console.log(`📊 Total customers in database: ${count || 0}`);
    }

    // Test 3: Get first 5 customers
    const { data: customers, error: listError } = await supabase
      .from('customers')
      .select('id, customer_number, name, email')
      .limit(5)
      .order('created_at', { ascending: false });

    if (listError) {
      console.error('❌ List failed:', listError);
    } else {
      console.log(`\n📋 Latest ${customers?.length || 0} customers:`);
      customers?.forEach(c => {
        console.log(`  - ${c.customer_number}: ${c.name} (${c.email})`);
      });
    }

    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Run the test
testConnection().then(success => {
  if (success) {
    console.log('\n✨ All tests passed! Supabase is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the errors above.');
  }
  process.exit(success ? 0 : 1);
});