#!/usr/bin/env node

/**
 * Simple Firestore Export
 * Exports all data from Firestore to JSON files
 */

const admin = require('firebase-admin');
const fs = require('fs').promises;
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function exportCollection(collectionName) {
  console.log(`📁 Exporting ${collectionName}...`);
  
  try {
    const snapshot = await db.collection(collectionName).get();
    const data = [];
    
    snapshot.forEach(doc => {
      const docData = doc.data();
      // Convert Firestore timestamps to ISO strings
      Object.keys(docData).forEach(key => {
        if (docData[key] && docData[key]._seconds) {
          docData[key] = new Date(docData[key]._seconds * 1000).toISOString();
        }
      });
      
      data.push({
        id: doc.id,
        ...docData
      });
    });
    
    // Save to file
    const exportDir = path.join(__dirname, 'exports');
    await fs.mkdir(exportDir, { recursive: true });
    
    await fs.writeFile(
      path.join(exportDir, `${collectionName}.json`),
      JSON.stringify(data, null, 2)
    );
    
    console.log(`✅ Exported ${data.length} documents from ${collectionName}`);
    return data.length;
    
  } catch (error) {
    console.error(`❌ Error exporting ${collectionName}:`, error.message);
    return 0;
  }
}

async function main() {
  console.log('🚀 Starting Firestore Export');
  console.log('============================\n');
  
  const collections = [
    'users',
    'customers', 
    'quotes',
    'invoices',
    'emailHistory',
    'emailTemplates',
    'quoteTemplates',
    'followUps',
    'emailImportHistory'
  ];
  
  let totalDocs = 0;
  
  for (const collection of collections) {
    const count = await exportCollection(collection);
    totalDocs += count;
  }
  
  console.log(`\n✨ Export complete! Total documents: ${totalDocs}`);
  process.exit(0);
}

main().catch(console.error);