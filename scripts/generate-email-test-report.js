#!/usr/bin/env node

// Generate comprehensive email system test report
// Usage: node scripts/generate-email-test-report.js

const https = require('https');
const fs = require('fs');

const PROD_URL = 'https://relocato-webapp-fzwo.vercel.app';

async function makeRequest(path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'relocato-webapp-fzwo.vercel.app',
      port: 443,
      path: path,
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    url: PROD_URL,
    tests: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0
    }
  };

  console.log('🔍 Starting Email System Test Report Generation...\n');

  // Test 1: Email Folders
  try {
    console.log('📁 Testing email folders...');
    const res = await makeRequest('/api/email-gateway', { operation: 'folders' });
    const test = {
      name: 'Email Folders',
      endpoint: '/api/email-gateway',
      status: res.status === 200 ? 'PASS' : 'FAIL',
      details: res.data
    };
    report.tests.push(test);
    console.log(`   ${test.status === 'PASS' ? '✅' : '❌'} ${test.name}`);
  } catch (error) {
    report.tests.push({ name: 'Email Folders', status: 'ERROR', error: error.message });
    console.log(`   ❌ Email Folders - ${error.message}`);
  }

  // Test 2: Email List
  try {
    console.log('📧 Testing email list...');
    const res = await makeRequest('/api/email-gateway', { 
      operation: 'list', 
      folder: 'INBOX', 
      page: 1, 
      limit: 5 
    });
    const test = {
      name: 'Email List',
      endpoint: '/api/email-gateway',
      status: res.status === 200 ? 'PASS' : 'FAIL',
      emailCount: res.data.emails?.length || 0,
      totalEmails: res.data.total || 0
    };
    report.tests.push(test);
    console.log(`   ${test.status === 'PASS' ? '✅' : '❌'} ${test.name} - ${test.emailCount} emails loaded`);
  } catch (error) {
    report.tests.push({ name: 'Email List', status: 'ERROR', error: error.message });
    console.log(`   ❌ Email List - ${error.message}`);
  }

  // Test 3: Email Sending
  try {
    console.log('📤 Testing email sending...');
    const res = await makeRequest('/api/test-email-system', {
      sendTestEmail: true,
      testEmail: 'test@relocato.de'
    });
    const test = {
      name: 'Email Sending',
      endpoint: '/api/test-email-system',
      status: res.status === 200 && res.data.results?.tests?.find(t => t.name === 'Send Test Email')?.status === 'success' ? 'PASS' : 'FAIL',
      messageId: res.data.results?.tests?.find(t => t.name === 'Send Test Email')?.details?.messageId
    };
    report.tests.push(test);
    console.log(`   ${test.status === 'PASS' ? '✅' : '❌'} ${test.name}`);
  } catch (error) {
    report.tests.push({ name: 'Email Sending', status: 'ERROR', error: error.message });
    console.log(`   ❌ Email Sending - ${error.message}`);
  }

  // Test 4: SMTP Connection
  try {
    console.log('🔌 Testing SMTP connection...');
    const res = await makeRequest('/api/test-email-system', { testSMTP: true });
    const test = {
      name: 'SMTP Connection',
      endpoint: '/api/test-email-system',
      status: res.status === 200 && res.data.results?.tests?.find(t => t.name === 'SMTP Connection')?.status === 'success' ? 'PASS' : 'FAIL'
    };
    report.tests.push(test);
    console.log(`   ${test.status === 'PASS' ? '✅' : '❌'} ${test.name}`);
  } catch (error) {
    report.tests.push({ name: 'SMTP Connection', status: 'ERROR', error: error.message });
    console.log(`   ❌ SMTP Connection - ${error.message}`);
  }

  // Test 5: Character Encoding
  try {
    console.log('🔤 Testing character encoding...');
    const res = await makeRequest('/api/email-gateway', { 
      operation: 'list', 
      folder: 'INBOX', 
      page: 1, 
      limit: 1 
    });
    const email = res.data.emails?.[0];
    const hasEncodingIssue = email?.subject?.includes('Ã¼') || email?.subject?.includes('Ã¤');
    const test = {
      name: 'Character Encoding',
      status: !hasEncodingIssue ? 'PASS' : 'WARN',
      sample: email?.subject
    };
    report.tests.push(test);
    console.log(`   ${test.status === 'PASS' ? '✅' : test.status === 'WARN' ? '⚠️' : '❌'} ${test.name}`);
  } catch (error) {
    report.tests.push({ name: 'Character Encoding', status: 'ERROR', error: error.message });
    console.log(`   ❌ Character Encoding - ${error.message}`);
  }

  // Calculate summary
  report.summary.total = report.tests.length;
  report.summary.passed = report.tests.filter(t => t.status === 'PASS').length;
  report.summary.failed = report.tests.filter(t => t.status === 'FAIL' || t.status === 'ERROR').length;
  report.summary.warnings = report.tests.filter(t => t.status === 'WARN').length;

  // Generate report file
  const reportContent = `# Email System Test Report

Generated: ${new Date().toLocaleString()}
URL: ${PROD_URL}

## Summary
- Total Tests: ${report.summary.total}
- Passed: ${report.summary.passed} ✅
- Failed: ${report.summary.failed} ❌
- Warnings: ${report.summary.warnings || 0} ⚠️

## Test Results

${report.tests.map(test => `
### ${test.name}
- Status: ${test.status}
${test.endpoint ? `- Endpoint: ${test.endpoint}` : ''}
${test.emailCount !== undefined ? `- Emails Found: ${test.emailCount}/${test.totalEmails}` : ''}
${test.messageId ? `- Message ID: ${test.messageId}` : ''}
${test.sample ? `- Sample: ${test.sample}` : ''}
${test.error ? `- Error: ${test.error}` : ''}
`).join('\n')}

## Recommendations

${report.summary.failed > 0 ? '1. Fix failing tests before production use' : ''}
${report.tests.find(t => t.status === 'WARN') ? '2. Address character encoding warnings' : ''}
${!report.tests.find(t => t.name === 'Email Sending' && t.status === 'PASS') ? '3. Ensure email sending is properly configured' : ''}

## Full Report Data

\`\`\`json
${JSON.stringify(report, null, 2)}
\`\`\`
`;

  // Save report
  const filename = `email-test-report-${Date.now()}.md`;
  fs.writeFileSync(filename, reportContent);
  
  console.log('\n📊 Report Summary:');
  console.log(`   Total: ${report.summary.total}`);
  console.log(`   ✅ Passed: ${report.summary.passed}`);
  console.log(`   ❌ Failed: ${report.summary.failed}`);
  console.log(`   ⚠️  Warnings: ${report.summary.warnings || 0}`);
  console.log(`\n📄 Report saved to: ${filename}`);
  
  // Exit with error code if tests failed
  if (report.summary.failed > 0) {
    process.exit(1);
  }
}

// Run report generation
generateReport().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});