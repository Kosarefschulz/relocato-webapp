#!/usr/bin/env node

/**
 * Vercel Status Check
 * Überprüft die Verbindung zu allen Vercel Storage Services
 */

const { Pool } = require('pg');
const { list } = require('@vercel/blob');
const { kv } = require('@vercel/kv');
require('dotenv').config({ path: '.env.local' });

async function checkStatus() {
  console.log('🔍 Vercel Storage Status Check');
  console.log('==============================\n');
  
  const results = {
    postgres: false,
    blob: false,
    kv: false
  };
  
  // 1. Check PostgreSQL
  console.log('📊 PostgreSQL Status:');
  if (process.env.POSTGRES_URL) {
    try {
      const pool = new Pool({
        connectionString: process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
      });
      
      const result = await pool.query('SELECT version()');
      console.log('✅ Verbunden');
      console.log(`   Version: ${result.rows[0].version.split(',')[0]}`);
      
      // Check tables
      const tables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      console.log(`   Tabellen: ${tables.rows.map(r => r.table_name).join(', ')}`);
      
      // Count records
      for (const table of ['customers', 'quotes', 'invoices']) {
        try {
          const count = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
          console.log(`   ${table}: ${count.rows[0].count} Einträge`);
        } catch (e) {
          // Table might not exist yet
        }
      }
      
      await pool.end();
      results.postgres = true;
    } catch (error) {
      console.log('❌ Fehler:', error.message);
    }
  } else {
    console.log('⚠️  POSTGRES_URL nicht konfiguriert');
  }
  
  // 2. Check Blob Storage
  console.log('\n📦 Blob Storage Status:');
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { blobs } = await list({ limit: 1 });
      console.log('✅ Verbunden');
      console.log(`   Erste Datei: ${blobs[0]?.pathname || 'Keine Dateien'}`);
      results.blob = true;
    } catch (error) {
      console.log('❌ Fehler:', error.message);
    }
  } else {
    console.log('⚠️  BLOB_READ_WRITE_TOKEN nicht konfiguriert');
  }
  
  // 3. Check KV Store
  console.log('\n🔑 KV Store Status:');
  if (process.env.KV_REST_API_URL) {
    try {
      await kv.set('test:connection', 'ok', { ex: 60 });
      const value = await kv.get('test:connection');
      if (value === 'ok') {
        console.log('✅ Verbunden');
        results.kv = true;
      }
    } catch (error) {
      console.log('❌ Fehler:', error.message);
    }
  } else {
    console.log('⚠️  KV_REST_API_URL nicht konfiguriert');
  }
  
  // 4. Summary
  console.log('\n📋 Zusammenfassung:');
  console.log('===================');
  const configured = Object.values(results).filter(v => v).length;
  console.log(`✅ ${configured}/3 Services konfiguriert und erreichbar`);
  
  if (configured < 3) {
    console.log('\n💡 Tipp: Führen Sie "vercel env pull" aus, um alle Umgebungsvariablen zu laden');
  }
  
  // 5. Migration readiness
  console.log('\n🚀 Migrations-Bereitschaft:');
  if (results.postgres) {
    console.log('✅ Bereit für Datenbank-Migration');
  } else {
    console.log('❌ PostgreSQL muss konfiguriert sein');
  }
  
  if (results.blob) {
    console.log('✅ Bereit für Foto-Migration');
  } else {
    console.log('⚠️  Blob Storage optional (Fotos bleiben vorerst in Google Drive)');
  }
  
  process.exit(configured === 3 ? 0 : 1);
}

// Run check
checkStatus().catch(console.error);