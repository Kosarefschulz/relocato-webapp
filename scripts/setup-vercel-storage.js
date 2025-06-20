#!/usr/bin/env node

/**
 * Setup Script für Vercel Storage Services
 * 
 * Dieses Script hilft bei der Einrichtung von:
 * - Vercel Postgres
 * - Vercel Blob Storage
 * - Vercel KV Store
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Vercel Storage Setup');
console.log('======================\n');

// Check if Vercel CLI is installed
try {
  execSync('vercel --version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Vercel CLI nicht installiert!');
  console.log('Bitte installieren Sie es mit: npm i -g vercel');
  process.exit(1);
}

// Create .env.local template
const envTemplate = `# Vercel Storage Configuration
# Diese Werte werden automatisch von Vercel gesetzt

# PostgreSQL Database
POSTGRES_URL=
POSTGRES_URL_NON_POOLING=
POSTGRES_USER=
POSTGRES_HOST=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=

# Blob Storage
BLOB_READ_WRITE_TOKEN=

# KV Store (Redis)
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=

# Application Settings
REACT_APP_USE_VERCEL=true
REACT_APP_API_URL=/api

# JWT Secret (für Auth)
JWT_SECRET=your-secret-key-here

# Email Settings (IONOS)
IONOS_EMAIL=bielefeld@relocato.de
IONOS_PASSWORD=Bicm1308!
IONOS_IMAP_HOST=imap.ionos.de
IONOS_SMTP_HOST=smtp.ionos.de
`;

if (!fs.existsSync('.env.local')) {
  fs.writeFileSync('.env.local', envTemplate);
  console.log('✅ .env.local Template erstellt');
} else {
  console.log('ℹ️  .env.local existiert bereits');
}

// Instructions
console.log('\n📋 Nächste Schritte:');
console.log('====================\n');

console.log('1. Vercel Dashboard öffnen:');
console.log('   https://vercel.com/dashboard\n');

console.log('2. Storage Tab auswählen und erstellen:');
console.log('   - Postgres Database');
console.log('   - Blob Store');
console.log('   - KV Database\n');

console.log('3. Umgebungsvariablen verknüpfen:');
console.log('   vercel env pull .env.local\n');

console.log('4. Datenbank-Schema ausführen:');
console.log('   psql $POSTGRES_URL -f migration/vercel-schema.sql\n');

console.log('5. Test-Migration durchführen:');
console.log('   npm run migrate:test\n');

// Create migration directory if not exists
const migrationDir = path.join(process.cwd(), 'migration', 'vercel');
if (!fs.existsSync(migrationDir)) {
  fs.mkdirSync(migrationDir, { recursive: true });
  console.log('✅ Migration Verzeichnis erstellt:', migrationDir);
}

// Create package.json scripts
const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

if (!packageJson.scripts['migrate:test']) {
  packageJson.scripts = {
    ...packageJson.scripts,
    'migrate:test': 'node migration/vercel/test-migration.js',
    'migrate:customers': 'node migration/vercel/migrate-customers.js',
    'migrate:all': 'node migration/vercel/migrate-all.js',
    'vercel:setup': 'node scripts/setup-vercel-storage.js',
    'vercel:status': 'node scripts/check-vercel-status.js'
  };
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ NPM Scripts hinzugefügt');
}

console.log('\n✨ Setup abgeschlossen!');