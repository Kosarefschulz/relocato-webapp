const admin = require('firebase-admin');
const fs = require('fs').promises;
const path = require('path');

// Initialize Firebase Admin with service account
// You'll need to download your service account key from Firebase Console
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Collections to export
const COLLECTIONS = [
  'users',
  'customers',
  'quotes',
  'invoices',
  'emailHistory',
  'emails',
  'emailClient',
  'emailFolders',
  'shareLinks',
  'failed_imports',
  'counters',
  'system',
  'emailImportStatus',
  'emailSyncStatus',
  'emailParserLogs'
];

async function exportCollection(collectionName) {
  console.log(`Exporting collection: ${collectionName}`);
  
  const snapshot = await db.collection(collectionName).get();
  const documents = [];
  
  snapshot.forEach(doc => {
    documents.push({
      id: doc.id,
      data: doc.data()
    });
  });
  
  console.log(`  Found ${documents.length} documents`);
  return documents;
}

async function exportAllCollections() {
  const exportData = {};
  const exportDir = path.join(__dirname, 'firestore-export');
  
  // Create export directory
  await fs.mkdir(exportDir, { recursive: true });
  
  // Export each collection
  for (const collection of COLLECTIONS) {
    try {
      exportData[collection] = await exportCollection(collection);
      
      // Save to individual files for easier handling
      await fs.writeFile(
        path.join(exportDir, `${collection}.json`),
        JSON.stringify(exportData[collection], null, 2)
      );
    } catch (error) {
      console.error(`Error exporting ${collection}:`, error);
    }
  }
  
  // Save complete export
  await fs.writeFile(
    path.join(exportDir, 'complete-export.json'),
    JSON.stringify(exportData, null, 2)
  );
  
  // Create export metadata
  const metadata = {
    exportDate: new Date().toISOString(),
    collections: Object.keys(exportData).map(name => ({
      name,
      documentCount: exportData[name].length
    })),
    totalDocuments: Object.values(exportData).reduce((sum, docs) => sum + docs.length, 0)
  };
  
  await fs.writeFile(
    path.join(exportDir, 'export-metadata.json'),
    JSON.stringify(metadata, null, 2)
  );
  
  console.log('\nExport Summary:');
  console.log(`Total collections: ${metadata.collections.length}`);
  console.log(`Total documents: ${metadata.totalDocuments}`);
  console.log(`Export saved to: ${exportDir}`);
}

// Run export
exportAllCollections()
  .then(() => {
    console.log('\nExport completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\nExport failed:', error);
    process.exit(1);
  });