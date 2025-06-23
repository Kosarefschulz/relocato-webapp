const admin = require('firebase-admin');
const functions = require('firebase-functions');

/**
 * Cloud Function to delete ALL customers from Firebase
 * WARNING: This will permanently delete all customer data!
 */
exports.deleteAllCustomers = functions
  .region('europe-west1')
  .runWith({
    timeoutSeconds: 540, // 9 minutes timeout
    memory: '2GB'
  })
  .https.onRequest(async (req, res) => {
    try {
      const db = admin.firestore();
      let deletedCount = 0;
      let deletedQuotes = 0;
      let deletedInvoices = 0;
      
      console.log('🗑️ Starting to delete all customers...');
      
      // Get all customers
      const customersSnapshot = await db.collection('customers').get();
      console.log(`Found ${customersSnapshot.size} customers to delete`);
      
      // Delete in batches of 100
      const batchSize = 100;
      const batches = [];
      let batch = db.batch();
      let operationCount = 0;
      
      for (const doc of customersSnapshot.docs) {
        const customerId = doc.id;
        
        // Delete customer
        batch.delete(doc.ref);
        deletedCount++;
        operationCount++;
        
        // Also delete related quotes
        const quotesSnapshot = await db.collection('quotes')
          .where('customerId', '==', customerId)
          .get();
        
        for (const quoteDoc of quotesSnapshot.docs) {
          if (operationCount < 500) {
            batch.delete(quoteDoc.ref);
            deletedQuotes++;
            operationCount++;
          }
        }
        
        // Also delete related invoices
        const invoicesSnapshot = await db.collection('invoices')
          .where('customerId', '==', customerId)
          .get();
        
        for (const invoiceDoc of invoicesSnapshot.docs) {
          if (operationCount < 500) {
            batch.delete(invoiceDoc.ref);
            deletedInvoices++;
            operationCount++;
          }
        }
        
        // Commit batch when it reaches 500 operations (Firestore limit)
        if (operationCount >= 500 || deletedCount % batchSize === 0) {
          batches.push(batch.commit());
          batch = db.batch();
          operationCount = 0;
        }
      }
      
      // Commit remaining operations
      if (operationCount > 0) {
        batches.push(batch.commit());
      }
      
      // Execute all batches
      await Promise.all(batches);
      
      console.log(`✅ Deleted ${deletedCount} customers`);
      console.log(`✅ Deleted ${deletedQuotes} quotes`);
      console.log(`✅ Deleted ${deletedInvoices} invoices`);
      
      // Also clean up email collections
      console.log('🗑️ Cleaning up email collections...');
      
      const emailCollections = [
        'emailClient',
        'emailHistory',
        'emailFolders',
        'emailImportStatus',
        'emailSyncStatus',
        'emailParserLogs',
        'emailCustomerLinks',
        'failed_imports',
        'failedEmails',
        'import_history'
      ];
      
      for (const collectionName of emailCollections) {
        try {
          const snapshot = await db.collection(collectionName).limit(100).get();
          if (!snapshot.empty) {
            const deleteBatch = db.batch();
            snapshot.docs.forEach(doc => {
              deleteBatch.delete(doc.ref);
            });
            await deleteBatch.commit();
            console.log(`✅ Cleaned ${collectionName}`);
          }
        } catch (error) {
          console.log(`⚠️ Could not clean ${collectionName}:`, error.message);
        }
      }
      
      // Reset import metadata
      await db.collection('system').doc('import_metadata').set({
        lastImport: null,
        totalImported: 0,
        lastCleanup: admin.firestore.FieldValue.serverTimestamp()
      });
      
      res.json({
        success: true,
        message: 'All customers and related data deleted',
        stats: {
          customersDeleted: deletedCount,
          quotesDeleted: deletedQuotes,
          invoicesDeleted: deletedInvoices,
          emailCollectionsCleaned: emailCollections.length
        }
      });
      
    } catch (error) {
      console.error('❌ Error deleting customers:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });