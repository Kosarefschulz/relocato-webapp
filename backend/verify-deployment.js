#!/usr/bin/env node

const axios = require('axios');

async function verifyDeployment(baseUrl) {
  console.log(`\n🔍 Verifying deployment at: ${baseUrl}\n`);

  const endpoints = [
    { method: 'GET', path: '/api/health', name: 'Health Check' },
    { method: 'POST', path: '/api/email/folders', name: 'Email Folders' }
  ];

  let allPassed = true;

  for (const endpoint of endpoints) {
    try {
      const url = `${baseUrl}${endpoint.path}`;
      console.log(`Testing ${endpoint.name} (${endpoint.method} ${endpoint.path})...`);
      
      const config = {
        method: endpoint.method,
        url: url,
        timeout: 10000
      };

      const response = await axios(config);
      
      if (response.data.success !== false) {
        console.log(`✅ ${endpoint.name}: OK`);
      } else {
        console.log(`⚠️  ${endpoint.name}: Response indicates failure`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Failed - ${error.message}`);
      allPassed = false;
    }
  }

  console.log(`\n${allPassed ? '✅ All tests passed!' : '❌ Some tests failed!'}\n`);
  process.exit(allPassed ? 0 : 1);
}

// Get URL from command line or use default
const url = process.argv[2] || 'https://your-backend.vercel.app';

if (process.argv[2]) {
  verifyDeployment(url);
} else {
  console.log('Usage: node verify-deployment.js <deployment-url>');
  console.log('Example: node verify-deployment.js https://my-backend.vercel.app');
}