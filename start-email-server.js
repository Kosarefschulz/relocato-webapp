#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Professional Email Server...\n');

// Start the email backend server
const emailBackend = spawn('npm', ['start'], {
  cwd: path.join(__dirname, 'email-backend'),
  stdio: 'inherit',
  shell: true
});

emailBackend.on('error', (error) => {
  console.error('❌ Failed to start email backend:', error);
  process.exit(1);
});

emailBackend.on('close', (code) => {
  if (code !== 0) {
    console.error(`❌ Email backend exited with code ${code}`);
    process.exit(code);
  }
});

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down email server...');
  emailBackend.kill('SIGINT');
  process.exit(0);
});

console.log('📧 Email server is running on http://localhost:5005');
console.log('🔌 WebSocket server is running on ws://localhost:5006');
console.log('\n💡 To use the email client:');
console.log('   1. In a new terminal: npm start');
console.log('   2. Navigate to: http://localhost:3001/email');
console.log('\nPress Ctrl+C to stop the server.');