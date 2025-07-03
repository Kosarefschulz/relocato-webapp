const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://kmxipuaqierjqaikuimi.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteGlwdWFxaWVyanFhaWt1aW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MjU2NDUsImV4cCI6MjA2NjAwMTY0NX0.2S3cAnBh4zDFFQNpJ-VN17YrSJXyclyFjywN2izuPaU';

async function testConnection() {
  console.log('🧪 Testing Supabase connection...');
  console.log('📍 URL:', supabaseUrl);
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // First, let's check if we can connect at all
    const { data: testData, error: testError } = await supabase.rpc('version');
    
    if (testError && testError.message.includes('function')) {
      // If the version function doesn't exist, try a simple query
      const { data, error } = await supabase.from('customers').select('count').limit(1);
      
      if (error) {
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
          console.log('⚠️  Tables not yet created. Please run the schema creation step.');
          console.log('📋 You need to execute the SQL schema in Supabase dashboard.');
          process.exit(0);
        } else {
          console.error('❌ Supabase connection test failed:', error.message);
          process.exit(1);
        }
      } else {
        console.log('✅ Supabase connection successful!');
        process.exit(0);
      }
    } else if (testError) {
      console.error('❌ Supabase connection test failed:', testError.message);
      process.exit(1);
    } else {
      console.log('✅ Supabase connection successful!');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error.message || error);
    process.exit(1);
  }
}

testConnection();