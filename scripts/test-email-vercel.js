#!/usr/bin/env node

// Automated email system test script for Vercel deployment
// Usage: node scripts/test-email-vercel.js [vercel-url]

const https = require('https');
const http = require('http');

const DEFAULT_URL = process.env.VERCEL_URL || 'localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@relocato.de';

async function makeRequest(url, path, data = {}) {
  const isHttps = url.startsWith('https');
  const protocol = isHttps ? https : http;
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: url.replace(/^https?:\/\//, '').split(':')[0],
      port: url.includes(':') ? url.split(':').pop() : (isHttps ? 443 : 80),
      path: path,
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
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

async function runTests(baseUrl) {
  console.log('🚀 Starting Email System Tests on:', baseUrl);
  console.log('📧 Test email:', TEST_EMAIL);
  console.log('─'.repeat(50));

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Check API endpoint
  console.log('\n📌 Test 1: Check API endpoint');
  try {
    const response = await makeRequest(baseUrl, '/api/test-email-system');
    console.log('✅ API endpoint is accessible');
    results.passed++;
    results.tests.push({ name: 'API Endpoint', status: 'passed' });
  } catch (error) {
    console.error('❌ API endpoint error:', error.message);
    results.failed++;
    results.tests.push({ name: 'API Endpoint', status: 'failed', error: error.message });
  }

  // Test 2: Test SMTP Connection
  console.log('\n📌 Test 2: SMTP Connection');
  try {
    const response = await makeRequest(baseUrl, '/api/test-email-system', { testSMTP: true });
    const smtpTest = response.results.tests.find(t => t.name === 'SMTP Connection');
    if (smtpTest && smtpTest.status === 'success') {
      console.log('✅ SMTP connection successful');
      results.passed++;
      results.tests.push({ name: 'SMTP Connection', status: 'passed' });
    } else {
      console.error('❌ SMTP connection failed:', smtpTest?.message);
      results.failed++;
      results.tests.push({ name: 'SMTP Connection', status: 'failed', error: smtpTest?.message });
    }
  } catch (error) {
    console.error('❌ SMTP test error:', error.message);
    results.failed++;
    results.tests.push({ name: 'SMTP Connection', status: 'failed', error: error.message });
  }

  // Test 3: Send Test Email
  console.log('\n📌 Test 3: Send Test Email');
  try {
    const response = await makeRequest(baseUrl, '/api/test-email-system', { 
      sendTestEmail: true,
      testEmail: TEST_EMAIL 
    });
    const emailTest = response.results.tests.find(t => t.name === 'Send Test Email');
    if (emailTest && emailTest.status === 'success') {
      console.log('✅ Test email sent successfully');
      console.log('   Message ID:', emailTest.details?.messageId);
      results.passed++;
      results.tests.push({ name: 'Send Test Email', status: 'passed' });
    } else {
      console.error('❌ Send email failed:', emailTest?.message);
      results.failed++;
      results.tests.push({ name: 'Send Test Email', status: 'failed', error: emailTest?.message });
    }
  } catch (error) {
    console.error('❌ Send email test error:', error.message);
    results.failed++;
    results.tests.push({ name: 'Send Test Email', status: 'failed', error: error.message });
  }

  // Test 4: Supabase Connection
  console.log('\n📌 Test 4: Supabase Connection');
  try {
    const response = await makeRequest(baseUrl, '/api/test-email-system', { testSupabase: true });
    const supabaseTest = response.results.tests.find(t => t.name === 'Supabase Connection');
    if (supabaseTest && supabaseTest.status === 'success') {
      console.log('✅ Supabase connection successful');
      console.log('   Email count:', supabaseTest.details?.emailCount);
      results.passed++;
      results.tests.push({ name: 'Supabase Connection', status: 'passed' });
    } else {
      console.error('❌ Supabase connection failed:', supabaseTest?.message);
      results.failed++;
      results.tests.push({ name: 'Supabase Connection', status: 'failed', error: supabaseTest?.message });
    }
  } catch (error) {
    console.error('❌ Supabase test error:', error.message);
    results.failed++;
    results.tests.push({ name: 'Supabase Connection', status: 'failed', error: error.message });
  }

  // Test 5: Check Email Client UI
  console.log('\n📌 Test 5: Email Client UI');
  try {
    const response = await makeRequest(baseUrl, '/email');
    if (response.includes('<!DOCTYPE html>') || response.includes('<html')) {
      console.log('✅ Email client page loads');
      results.passed++;
      results.tests.push({ name: 'Email Client UI', status: 'passed' });
    } else {
      console.error('❌ Email client page error');
      results.failed++;
      results.tests.push({ name: 'Email Client UI', status: 'failed' });
    }
  } catch (error) {
    console.error('❌ Email client UI error:', error.message);
    results.failed++;
    results.tests.push({ name: 'Email Client UI', status: 'failed', error: error.message });
  }

  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log('📊 TEST SUMMARY:');
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   📋 Total:  ${results.passed + results.failed}`);
  console.log('═'.repeat(50));

  // Exit with error code if any tests failed
  if (results.failed > 0) {
    process.exit(1);
  }
}

// Main execution
const args = process.argv.slice(2);
const targetUrl = args[0] || DEFAULT_URL;

// Ensure URL has protocol
const url = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;

runTests(url).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});