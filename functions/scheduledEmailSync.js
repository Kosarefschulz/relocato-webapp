const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Imap = require('imap');
const { simpleParser } = require('mailparser');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * Scheduled function that runs every 5 minutes to sync emails from IONOS to Firestore
 * This avoids all CORS issues and provides offline capability
 */
exports.scheduledEmailSync = functions
  .region('europe-west1')
  .pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    console.log('🔄 Starting scheduled email sync to Firestore...');
    
    try {
      // First get all available folders from IONOS
      const availableFolders = await getAllFolders();
      console.log('📁 Available folders:', availableFolders);
      
      const syncResults = [];
      
      // Sync all folders
      for (const folder of availableFolders) {
        try {
          const result = await syncFolderToFirestore(folder, 100);
          syncResults.push(result);
        } catch (error) {
          console.error(`❌ Error syncing folder ${folder}:`, error);
          syncResults.push({ folder, success: false, error: error.message });
        }
      }
      
      // Update sync status
      await db.collection('emailSyncStatus').doc('latest').set({
        lastSync: admin.firestore.FieldValue.serverTimestamp(),
        results: syncResults,
        success: syncResults.some(r => r.success)
      });
      
      console.log('✅ Email sync completed:', syncResults);
      return syncResults;
    } catch (error) {
      console.error('❌ Fatal error in email sync:', error);
      throw error;
    }
  });

/**
 * Get all available folders from IONOS IMAP
 */
async function getAllFolders() {
  const config = {
    user: 'bielefeld@relocato.de',
    password: 'Bicm1308',
    host: 'imap.ionos.de',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    connTimeout: 30000,
    authTimeout: 30000
  };
  
  const imap = new Imap(config);
  
  return new Promise((resolve, reject) => {
    const folders = [];
    
    imap.once('ready', () => {
      console.log('✅ Connected to IONOS to get folders');
      
      imap.getBoxes((err, boxes) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Recursive function to extract all folder names
        function extractFolders(boxTree, prefix = '') {
          for (const boxName in boxTree) {
            const fullName = prefix ? `${prefix}${boxTree[boxName].delimiter}${boxName}` : boxName;
            folders.push(fullName);
            
            // If this folder has children, process them recursively
            if (boxTree[boxName].children) {
              extractFolders(boxTree[boxName].children, fullName);
            }
          }
        }
        
        extractFolders(boxes);
        console.log(`📁 Found ${folders.length} folders:`, folders);
        
        imap.end();
        resolve(folders);
      });
    });
    
    imap.once('error', (err) => {
      console.error('❌ IMAP error:', err);
      reject(err);
    });
    
    imap.once('end', () => {
      console.log('📪 IMAP connection closed');
    });
    
    imap.connect();
  });
}

/**
 * Manual trigger for email sync (can be called via HTTP)
 */
exports.triggerEmailSync = functions
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
    
    console.log('🔄 Manual email sync triggered...');
    
    try {
      const folder = req.query.folder;
      const limit = parseInt(req.query.limit) || 50;
      const syncAll = req.query.all === 'true';
      
      if (syncAll) {
        // Sync all folders
        const availableFolders = await getAllFolders();
        const syncResults = [];
        
        for (const folderName of availableFolders) {
          try {
            const result = await syncFolderToFirestore(folderName, limit);
            syncResults.push(result);
          } catch (error) {
            console.error(`❌ Error syncing folder ${folderName}:`, error);
            syncResults.push({ folder: folderName, success: false, error: error.message });
          }
        }
        
        res.json({
          success: true,
          folders: availableFolders,
          results: syncResults
        });
      } else {
        // Sync single folder
        const folderToSync = folder || 'INBOX';
        const result = await syncFolderToFirestore(folderToSync, limit);
        
        res.json({
          success: true,
          ...result
        });
      }
    } catch (error) {
      console.error('❌ Error in manual sync:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

/**
 * Sync a specific folder to Firestore
 */
async function syncFolderToFirestore(folderName, limit = 50) {
  const config = {
    user: 'bielefeld@relocato.de',
    password: 'Bicm1308',
    host: 'imap.ionos.de',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    connTimeout: 30000,
    authTimeout: 30000
  };
  
  const imap = new Imap(config);
  
  return new Promise((resolve, reject) => {
    let syncedCount = 0;
    let totalEmails = 0;
    
    imap.once('ready', () => {
      console.log(`✅ Connected to IONOS for folder: ${folderName}`);
      
      imap.openBox(folderName, false, async (err, box) => {
        if (err) {
          reject(err);
          return;
        }
        
        totalEmails = box.messages.total;
        console.log(`📬 ${totalEmails} emails in ${folderName}`);
        
        if (totalEmails === 0) {
          imap.end();
          resolve({ folder: folderName, synced: 0, total: 0, success: true });
          return;
        }
        
        // Get last sync info from Firestore (sanitize folder name for Firestore doc ID)
        const sanitizedFolderName = folderName.replace(/\//g, '_');
        const lastSyncDoc = await db.collection('emailSyncStatus').doc(`folder_${sanitizedFolderName}`).get();
        const lastSyncData = lastSyncDoc.data();
        const lastSyncUID = lastSyncData?.lastUID || 0;
        
        // Search for emails newer than last sync
        const searchCriteria = lastSyncUID > 0 ? 
          [['UID', `${lastSyncUID + 1}:*`]] : 
          ['ALL'];
        
        imap.search(searchCriteria, async (err, results) => {
          if (err) {
            reject(err);
            return;
          }
          
          console.log(`📧 Found ${results.length} emails to sync in ${folderName}`);
          
          if (results.length === 0) {
            imap.end();
            resolve({ folder: folderName, synced: 0, total: totalEmails, success: true });
            return;
          }
          
          // Limit the number of emails to sync
          const emailsToSync = results.slice(-limit);
          console.log(`🔄 Syncing ${emailsToSync.length} emails...`);
          
          const fetch = imap.fetch(emailsToSync, {
            bodies: '',
            struct: true,
            envelope: true
          });
          
          const batch = db.batch();
          let batchCount = 0;
          let lastUID = lastSyncUID;
          
          fetch.on('message', (msg, seqno) => {
            let uid;
            let emailData = {};
            
            msg.on('attributes', (attrs) => {
              uid = attrs.uid;
              emailData.uid = uid;
              emailData.flags = attrs.flags || [];
              emailData.date = attrs.date;
              
              if (uid > lastUID) {
                lastUID = uid;
              }
            });
            
            msg.on('body', (stream, info) => {
              simpleParser(stream, async (err, parsed) => {
                if (err) {
                  console.error('Parse error:', err);
                  return;
                }
                
                // Prepare email data for Firestore
                const firestoreEmail = {
                  uid: emailData.uid,
                  folder: folderName,
                  seqno: seqno,
                  flags: emailData.flags,
                  date: emailData.date || parsed.date,
                  from: parsed.from?.text || '',
                  to: parsed.to?.text || '',
                  subject: parsed.subject || '',
                  messageId: parsed.messageId || '',
                  inReplyTo: parsed.inReplyTo || '',
                  references: parsed.references || [],
                  preview: (parsed.text || '').substring(0, 200),
                  textContent: parsed.text || '',
                  htmlContent: parsed.html || '',
                  attachments: (parsed.attachments || []).map(att => ({
                    filename: att.filename || '',
                    contentType: att.contentType || '',
                    size: att.size || 0,
                    ...(att.contentId && { contentId: att.contentId })
                  })),
                  headers: parsed.headers ? Object.fromEntries(parsed.headers) : {},
                  syncedAt: admin.firestore.FieldValue.serverTimestamp(),
                  isRead: emailData.flags.includes('\\Seen'),
                  isFlagged: emailData.flags.includes('\\Flagged'),
                  isDraft: emailData.flags.includes('\\Draft'),
                  isDeleted: emailData.flags.includes('\\Deleted')
                };
                
                // Store in Firestore with composite key (sanitized)
                const docId = `${sanitizedFolderName}_${uid}`;
                const docRef = db.collection('emailClient').doc(docId);
                batch.set(docRef, firestoreEmail, { merge: true });
                
                batchCount++;
                syncedCount++;
                
                // Commit batch every 100 emails
                if (batchCount >= 100) {
                  await batch.commit();
                  console.log(`💾 Committed batch of ${batchCount} emails`);
                  batchCount = 0;
                }
              });
            });
          });
          
          fetch.once('end', async () => {
            // Commit remaining emails
            if (batchCount > 0) {
              await batch.commit();
              console.log(`💾 Committed final batch of ${batchCount} emails`);
            }
            
            // Update last sync info
            await db.collection('emailSyncStatus').doc(`folder_${sanitizedFolderName}`).set({
              folder: folderName,
              lastSync: admin.firestore.FieldValue.serverTimestamp(),
              lastUID: lastUID,
              totalEmails: totalEmails,
              syncedCount: syncedCount
            });
            
            console.log(`✅ Synced ${syncedCount} emails from ${folderName}`);
            imap.end();
            resolve({
              folder: folderName,
              synced: syncedCount,
              total: totalEmails,
              success: true
            });
          });
          
          fetch.once('error', (err) => {
            console.error('Fetch error:', err);
            reject(err);
          });
        });
      });
    });
    
    imap.once('error', (err) => {
      console.error('IMAP error:', err);
      reject(err);
    });
    
    imap.once('end', () => {
      console.log('📪 IMAP connection closed');
    });
    
    imap.connect();
  });
}

/**
 * Clean up old emails (optional - run less frequently)
 */
exports.cleanupOldEmails = functions
  .region('europe-west1')
  .pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    console.log('🧹 Starting email cleanup...');
    
    try {
      // Delete emails older than 90 days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);
      
      const oldEmailsQuery = db.collection('emailClient')
        .where('date', '<', cutoffDate)
        .limit(500); // Process in batches
      
      const snapshot = await oldEmailsQuery.get();
      
      if (snapshot.empty) {
        console.log('✅ No old emails to clean up');
        return;
      }
      
      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`✅ Deleted ${snapshot.size} old emails`);
      
      return { deleted: snapshot.size };
    } catch (error) {
      console.error('❌ Error in cleanup:', error);
      throw error;
    }
  });