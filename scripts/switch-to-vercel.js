#!/usr/bin/env node

/**
 * Switch to Vercel Platform
 * Updates all configurations to use Vercel instead of Firebase
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Switching to Vercel Platform...\n');

// Update .env.local
const envPath = path.join(process.cwd(), '.env.local');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

// Add or update Vercel flag
if (envContent.includes('REACT_APP_USE_VERCEL=')) {
  envContent = envContent.replace(/REACT_APP_USE_VERCEL=.*/g, 'REACT_APP_USE_VERCEL=true');
} else {
  envContent += '\n# Platform Configuration\nREACT_APP_USE_VERCEL=true\n';
}

// Add API URL if not present
if (!envContent.includes('REACT_APP_API_URL=')) {
  envContent += 'REACT_APP_API_URL=/api\n';
}

fs.writeFileSync(envPath, envContent);
console.log('✅ Updated .env.local');

// Create platform config if not exists
const configPath = path.join(process.cwd(), 'src/config/platform.config.ts');
const configContent = `// Platform Configuration
// This file determines which services to use (Firebase or Vercel)

export const USE_VERCEL = process.env.REACT_APP_USE_VERCEL === 'true';
export const API_URL = process.env.REACT_APP_API_URL || '/api';

// Service Selection
export const services = {
  database: USE_VERCEL ? 'vercel' : 'firebase',
  auth: USE_VERCEL ? 'vercel' : 'firebase',
  storage: USE_VERCEL ? 'vercel' : 'googleDrive',
  email: 'vercel' // Always use Vercel for email
};

console.log('🔧 Platform Configuration:', {
  useVercel: USE_VERCEL,
  apiUrl: API_URL,
  services
});
`;

fs.writeFileSync(configPath, configContent);
console.log('✅ Created platform config');

// Update database service wrapper
const dbWrapperPath = path.join(process.cwd(), 'src/services/database.ts');
const dbWrapperContent = `// Database Service Wrapper
// Automatically selects between Firebase and Vercel based on configuration

import { USE_VERCEL } from '../config/platform.config';
import { databaseService as firebaseDB } from './unifiedDatabaseService';
import { databaseService as vercelDB } from './databaseServiceVercel';

export const databaseService = USE_VERCEL ? vercelDB : firebaseDB;

// Re-export types
export * from './unifiedDatabaseService';
`;

fs.writeFileSync(dbWrapperPath, dbWrapperContent);
console.log('✅ Updated database service wrapper');

// Update auth service wrapper
const authWrapperPath = path.join(process.cwd(), 'src/services/auth.ts');
const authWrapperContent = `// Auth Service Wrapper
// Automatically selects between Firebase and Vercel based on configuration

import { USE_VERCEL } from '../config/platform.config';
import { authService as firebaseAuth } from './authService';
import { authService as vercelAuth } from './authServiceVercel';

export const authService = USE_VERCEL ? vercelAuth : firebaseAuth;
`;

fs.writeFileSync(authWrapperPath, authWrapperContent);
console.log('✅ Updated auth service wrapper');

console.log('\n✨ Successfully switched to Vercel platform!');
console.log('\nNext steps:');
console.log('1. Run: npm start');
console.log('2. Test the application');
console.log('3. Deploy: vercel --prod');