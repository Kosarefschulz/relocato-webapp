// Test script for Supabase email functionality
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kmxipuaqierjqaikuimi.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteGlwdWFxaWVyanFhaWt1aW1pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQyNTY0NSwiZXhwIjoyMDY2MDAxNjQ1fQ.VTT4d5nndvGQxJxlR6t0YyVHcZfFStqbI1KRbcIOH0c';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSupabaseEmail() {
  console.log('🧪 Testing Supabase email functionality...');
  
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: 'bielefeld@relocato.de',
        subject: 'Test E-Mail von Supabase',
        content: '<h1>Test erfolgreich!</h1><p>Diese E-Mail wurde über Supabase Edge Function versendet.</p>',
        // Config now comes from Supabase secrets
      }
    });

    if (error) {
      console.error('❌ Supabase email test failed:', error);
      return false;
    }

    console.log('✅ Supabase email test successful:', data);
    return true;
  } catch (error) {
    console.error('❌ Supabase email test error:', error);
    return false;
  }
}

// Test email history
async function testEmailHistory() {
  console.log('🧪 Testing email history...');
  
  try {
    const { data, error } = await supabase
      .from('email_history')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Email history test failed:', error);
      return false;
    }

    console.log('✅ Email history test successful:', data?.length || 0, 'records found');
    return true;
  } catch (error) {
    console.error('❌ Email history test error:', error);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Supabase email tests...\n');
  
  const emailTest = await testSupabaseEmail();
  const historyTest = await testEmailHistory();
  
  console.log('\n📊 Test Results:');
  console.log(`E-Mail Function: ${emailTest ? '✅' : '❌'}`);
  console.log(`E-Mail History: ${historyTest ? '✅' : '❌'}`);
  
  if (emailTest && historyTest) {
    console.log('\n🎉 All Supabase email functionality is working!');
  } else {
    console.log('\n⚠️ Some Supabase email functionality needs configuration.');
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { testSupabaseEmail, testEmailHistory };