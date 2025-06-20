#!/usr/bin/env node

/**
 * Test-Migration Script
 * Migriert 10 Test-Kunden von Firebase zu Vercel
 */

const admin = require('firebase-admin');
const { Pool } = require('pg');
const { put } = require('@vercel/blob');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('../serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Initialize PostgreSQL
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

// Test-Migration durchführen
async function testMigration() {
  console.log('🚀 Starte Test-Migration...\n');
  
  try {
    // 1. Verbindung testen
    console.log('📡 Teste Datenbankverbindung...');
    await pool.query('SELECT NOW()');
    console.log('✅ PostgreSQL verbunden\n');
    
    // 2. Hole 10 Test-Kunden aus Firestore
    console.log('📥 Hole 10 Kunden aus Firestore...');
    const customersSnapshot = await db.collection('customers')
      .limit(10)
      .get();
    
    console.log(`✅ ${customersSnapshot.size} Kunden gefunden\n`);
    
    // 3. Migriere jeden Kunden
    let migrated = 0;
    for (const doc of customersSnapshot.docs) {
      const customer = doc.data();
      console.log(`🔄 Migriere Kunde: ${customer.name} (${doc.id})`);
      
      try {
        // Bereite Daten vor
        const customerData = {
          id: doc.id,
          customer_number: customer.customerNumber || customer.customerId || doc.id,
          name: customer.name || 'Unbekannt',
          email: customer.email || null,
          phone: customer.phone || customer.phoneNumber || null,
          from_address: JSON.stringify({
            street: customer.fromAddress?.street || customer.pickupAddress?.street,
            city: customer.fromAddress?.city || customer.pickupAddress?.city,
            zip: customer.fromAddress?.zip || customer.pickupAddress?.postalCode,
            country: customer.fromAddress?.country || 'Deutschland'
          }),
          to_address: JSON.stringify({
            street: customer.toAddress?.street || customer.deliveryAddress?.street,
            city: customer.toAddress?.city || customer.deliveryAddress?.city,
            zip: customer.toAddress?.zip || customer.deliveryAddress?.postalCode,
            country: customer.toAddress?.country || 'Deutschland'
          }),
          move_date: customer.moveDate ? new Date(customer.moveDate) : null,
          notes: customer.notes || customer.comment || null,
          source: customer.source || 'manual',
          status: customer.status || 'active',
          metadata: JSON.stringify({
            original_id: doc.id,
            migrated_from: 'firebase',
            migrated_at: new Date().toISOString(),
            ...customer.metadata
          }),
          created_at: customer.createdAt?.toDate ? customer.createdAt.toDate() : new Date(),
          updated_at: customer.updatedAt?.toDate ? customer.updatedAt.toDate() : new Date()
        };
        
        // Insert in PostgreSQL
        const query = `
          INSERT INTO customers (
            id, customer_number, name, email, phone,
            from_address, to_address, move_date, notes,
            source, status, metadata, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
          )
          ON CONFLICT (id) DO UPDATE SET
            updated_at = EXCLUDED.updated_at,
            metadata = EXCLUDED.metadata
        `;
        
        await pool.query(query, [
          customerData.id,
          customerData.customer_number,
          customerData.name,
          customerData.email,
          customerData.phone,
          customerData.from_address,
          customerData.to_address,
          customerData.move_date,
          customerData.notes,
          customerData.source,
          customerData.status,
          customerData.metadata,
          customerData.created_at,
          customerData.updated_at
        ]);
        
        console.log(`✅ Kunde migriert: ${customer.name}`);
        
        // 4. Migriere zugehörige Angebote
        const quotesSnapshot = await db.collection('quotes')
          .where('customerId', '==', doc.id)
          .limit(5)
          .get();
        
        if (quotesSnapshot.size > 0) {
          console.log(`   📋 Migriere ${quotesSnapshot.size} Angebote...`);
          
          for (const quoteDoc of quotesSnapshot.docs) {
            const quote = quoteDoc.data();
            
            const quoteQuery = `
              INSERT INTO quotes (
                id, customer_id, customer_name, price, volume,
                distance, move_date, status, from_address, to_address,
                services, items, comment, metadata, created_at, updated_at
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
              )
              ON CONFLICT (id) DO UPDATE SET
                updated_at = EXCLUDED.updated_at
            `;
            
            await pool.query(quoteQuery, [
              quoteDoc.id,
              doc.id,
              quote.customerName || customer.name,
              quote.price || 0,
              quote.volume || 0,
              quote.distance || 0,
              quote.moveDate ? new Date(quote.moveDate) : null,
              quote.status || 'draft',
              JSON.stringify(quote.fromAddress || {}),
              JSON.stringify(quote.toAddress || {}),
              JSON.stringify(quote.services || []),
              JSON.stringify(quote.items || []),
              quote.comment || null,
              JSON.stringify({ ...quote.metadata, migrated_from: 'firebase' }),
              quote.createdAt?.toDate ? quote.createdAt.toDate() : new Date(),
              quote.updatedAt?.toDate ? quote.updatedAt.toDate() : new Date()
            ]);
          }
          
          console.log(`   ✅ ${quotesSnapshot.size} Angebote migriert`);
        }
        
        migrated++;
        console.log('');
        
      } catch (error) {
        console.error(`❌ Fehler bei Kunde ${customer.name}:`, error.message);
      }
    }
    
    // 5. Zusammenfassung
    console.log('\n📊 Migration abgeschlossen:');
    console.log(`✅ ${migrated} von ${customersSnapshot.size} Kunden erfolgreich migriert`);
    
    // 6. Verifizierung
    console.log('\n🔍 Verifiziere Migration...');
    const result = await pool.query('SELECT COUNT(*) as count FROM customers');
    console.log(`📊 Kunden in PostgreSQL: ${result.rows[0].count}`);
    
    const quoteResult = await pool.query('SELECT COUNT(*) as count FROM quotes');
    console.log(`📊 Angebote in PostgreSQL: ${quoteResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Migrations-Fehler:', error);
  } finally {
    await pool.end();
    console.log('\n✨ Test-Migration beendet');
  }
}

// Hilfsfunktion für Foto-Migration (Beispiel)
async function migratePhoto(customerId, photoData) {
  try {
    // Simuliere Blob-Upload
    const blob = await put(
      `customers/${customerId}/photos/${photoData.fileName}`,
      photoData.content,
      { access: 'public' }
    );
    
    return {
      blob_url: blob.url,
      blob_pathname: blob.pathname,
      blob_content_type: blob.contentType
    };
  } catch (error) {
    console.error('Foto-Upload Fehler:', error);
    return null;
  }
}

// Script ausführen
testMigration().catch(console.error);