const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * One-time cleanup function to remove unnecessary email data
 * This can be triggered manually to clean up the database
 */
exports.cleanupEmailData = functions
  .region('europe-west1')
  .https.onRequest(async (req, res) => {
    // CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    
    console.log('🧹 Starting email data cleanup...');
    
    try {
      const stats = {
        emailClient: 0,
        emailHistory: 0,
        failedEmails: 0,
        failedImports: 0,
        emailSyncStatus: 0,
        total: 0
      };
      
      // 1. Clean up emailClient collection (remove all - we don't need full emails)
      if (req.query.cleanEmailClient !== 'false') {
        console.log('🗑️  Cleaning emailClient collection...');
        const emailClientSnapshot = await db.collection('emailClient').limit(500).get();
        
        while (!emailClientSnapshot.empty) {
          const batch = db.batch();
          emailClientSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
            stats.emailClient++;
          });
          await batch.commit();
          
          // Get next batch
          const nextSnapshot = await db.collection('emailClient').limit(500).get();
          if (nextSnapshot.empty) break;
        }
      }
      
      // 2. Clean up old emailHistory entries (older than 90 days)
      if (req.query.cleanEmailHistory !== 'false') {
        console.log('📧 Cleaning old emailHistory entries...');
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        
        const oldEmailsQuery = db.collection('emailHistory')
          .where('sentAt', '<', ninetyDaysAgo)
          .limit(500);
        
        const oldEmailsSnapshot = await oldEmailsQuery.get();
        
        if (!oldEmailsSnapshot.empty) {
          const batch = db.batch();
          oldEmailsSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
            stats.emailHistory++;
          });
          await batch.commit();
        }
      }
      
      // 3. Clean up failedEmails with full content
      if (req.query.cleanFailedEmails !== 'false') {
        console.log('❌ Cleaning failedEmails with full content...');
        const failedEmailsSnapshot = await db.collection('failedEmails').limit(500).get();
        
        const batch = db.batch();
        failedEmailsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          // If it has full text/html content, update to remove it
          if (data.fullText || data.fullHtml || data.text) {
            batch.update(doc.ref, {
              fullText: admin.firestore.FieldValue.delete(),
              fullHtml: admin.firestore.FieldValue.delete(),
              text: admin.firestore.FieldValue.delete(),
              html: admin.firestore.FieldValue.delete()
            });
            stats.failedEmails++;
          }
        });
        
        if (stats.failedEmails > 0) {
          await batch.commit();
        }
      }
      
      // 4. Clean up failed_imports with full email data
      if (req.query.cleanFailedImports !== 'false') {
        console.log('📝 Cleaning failed_imports with full email data...');
        const failedImportsSnapshot = await db.collection('failed_imports').limit(500).get();
        
        const batch = db.batch();
        failedImportsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          // If emailData has full content, update to keep only minimal data
          if (data.emailData && (data.emailData.text || data.emailData.html)) {
            batch.update(doc.ref, {
              'emailData.text': admin.firestore.FieldValue.delete(),
              'emailData.html': admin.firestore.FieldValue.delete()
            });
            stats.failedImports++;
          }
        });
        
        if (stats.failedImports > 0) {
          await batch.commit();
        }
      }
      
      // 5. Clean up emailSyncStatus collection
      if (req.query.cleanSyncStatus !== 'false') {
        console.log('🔄 Cleaning emailSyncStatus collection...');
        const syncStatusSnapshot = await db.collection('emailSyncStatus').get();
        
        const batch = db.batch();
        syncStatusSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
          stats.emailSyncStatus++;
        });
        
        if (stats.emailSyncStatus > 0) {
          await batch.commit();
        }
      }
      
      stats.total = stats.emailClient + stats.emailHistory + stats.failedEmails + 
                    stats.failedImports + stats.emailSyncStatus;
      
      console.log('✅ Cleanup completed:', stats);
      
      res.json({
        success: true,
        message: 'Email data cleanup completed',
        stats: stats,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Cleanup error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

/**
 * Get statistics about email data in Firebase
 */
exports.getEmailDataStats = functions
  .region('europe-west1')
  .https.onRequest(async (req, res) => {
    // CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    
    try {
      const stats = {};
      
      // Count documents in each collection
      const collections = [
        'emailClient',
        'emailHistory',
        'failedEmails',
        'failed_imports',
        'emailSyncStatus',
        'customers',
        'quotes'
      ];
      
      for (const collection of collections) {
        const snapshot = await db.collection(collection).count().get();
        stats[collection] = snapshot.data().count;
      }
      
      // Get size estimates
      const emailClientSample = await db.collection('emailClient').limit(10).get();
      let avgEmailSize = 0;
      if (!emailClientSample.empty) {
        emailClientSample.docs.forEach(doc => {
          const data = doc.data();
          avgEmailSize += JSON.stringify(data).length;
        });
        avgEmailSize = Math.round(avgEmailSize / emailClientSample.size);
      }
      
      stats.estimates = {
        emailClientAvgSize: avgEmailSize,
        emailClientTotalSizeMB: Math.round((avgEmailSize * stats.emailClient) / 1024 / 1024)
      };
      
      res.json({
        success: true,
        stats: stats,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });