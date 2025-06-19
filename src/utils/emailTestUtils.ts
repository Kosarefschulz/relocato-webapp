// Email Test Utilities

export async function testEmailSystem() {
  console.log('🧪 Testing Email System...\n');
  
  const tests = [
    {
      name: 'Environment Check',
      url: '/api/test-email-simple?check=env'
    },
    {
      name: 'V2 Email Sync',
      url: '/api/email-sync-v2?folder=INBOX&limit=5'
    },
    {
      name: 'SMTP Port Test',
      url: '/api/test-email-simple?action=test-smtp'
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      console.log(`🔍 Testing: ${test.name}`);
      const response = await fetch(test.url);
      const data = await response.json();
      
      results.push({
        test: test.name,
        success: response.ok,
        status: response.status,
        data: data
      });
      
      console.log(`✅ ${test.name}: ${response.ok ? 'PASSED' : 'FAILED'}`);
      console.log('Response:', data);
      console.log('---');
    } catch (error: any) {
      results.push({
        test: test.name,
        success: false,
        error: error.message
      });
      
      console.log(`❌ ${test.name}: ERROR`);
      console.log('Error:', error.message);
      console.log('---');
    }
  }
  
  // Summary
  console.log('\n📊 TEST SUMMARY:');
  results.forEach(r => {
    console.log(`${r.success ? '✅' : '❌'} ${r.test}`);
  });
  
  return results;
}

// Add to window for easy testing in console
if (typeof window !== 'undefined') {
  (window as any).testEmailSystem = testEmailSystem;
}