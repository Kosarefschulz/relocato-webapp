const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const admin = require('firebase-admin');

// Get Firestore instance
const db = admin.firestore();

// IONOS Email configuration
const IMAP_CONFIG = {
  user: 'bielefeld@relocato.de',
  password: 'Bicm1308!',
  host: 'mail.ionos.de',
  port: 993,
  tls: true,
  tlsOptions: { 
    rejectUnauthorized: false,
    servername: 'mail.ionos.de'
  },
  connTimeout: 10000,
  authTimeout: 10000
};

// Store emails in Firestore for caching
async function cacheEmailsToFirestore(emails, folder) {
  const batch = db.batch();
  
  emails.forEach(email => {
    const docRef = db.collection('emailCache').doc(`${folder}_${email.uid}`);
    batch.set(docRef, {
      ...email,
      folder,
      cachedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
  
  await batch.commit();
  console.log(`✅ Cached ${emails.length} emails to Firestore`);
}

// Get cached emails from Firestore
async function getCachedEmails(folder, limit) {
  const snapshot = await db.collection('emailCache')
    .where('folder', '==', folder)
    .orderBy('date', 'desc')
    .limit(limit)
    .get();
  
  const emails = [];
  snapshot.forEach(doc => {
    emails.push(doc.data());
  });
  
  return emails;
}

// Fetch emails from IONOS with better error handling
async function fetchEmailsFromIONOS(folder = 'INBOX', limit = 50) {
  return new Promise((resolve, reject) => {
    const emails = [];
    const imap = new Imap(IMAP_CONFIG);
    
    // Set a timeout for the entire operation
    const timeout = setTimeout(() => {
      imap.end();
      reject(new Error('IMAP operation timeout'));
    }, 25000); // 25 seconds timeout
    
    imap.once('ready', () => {
      console.log('📧 Connected to IONOS IMAP server');
      
      imap.openBox(folder, true, (err, box) => {
        if (err) {
          clearTimeout(timeout);
          imap.end();
          return reject(err);
        }
        
        console.log(`📂 Opened folder: ${folder} (${box.messages.total} messages)`);
        
        if (box.messages.total === 0) {
          clearTimeout(timeout);
          imap.end();
          return resolve([]);
        }
        
        // Fetch recent emails
        const fetchRange = Math.max(1, box.messages.total - limit + 1) + ':*';
        const f = imap.seq.fetch(fetchRange, {
          bodies: ['HEADER', 'TEXT'],
          struct: true
        });
        
        let messageCount = 0;
        const expectedMessages = Math.min(limit, box.messages.total);
        
        f.on('message', (msg, seqno) => {
          let email = {
            seqno: seqno,
            uid: null,
            flags: [],
            header: null,
            text: '',
            html: '',
            attachments: []
          };
          
          let headerParsed = false;
          let bodyParsed = false;
          
          msg.on('body', (stream, info) => {
            let buffer = '';
            
            stream.on('data', chunk => {
              buffer += chunk.toString('utf8');
            });
            
            stream.once('end', () => {
              if (info.which === 'HEADER') {
                simpleParser(buffer, (err, parsed) => {
                  if (!err && parsed) {
                    email.header = {
                      from: parsed.from?.text || '',
                      to: parsed.to?.text || '',
                      subject: parsed.subject || '(Kein Betreff)',
                      date: parsed.date || new Date(),
                      messageId: parsed.messageId
                    };
                    headerParsed = true;
                    checkComplete();
                  }
                });
              } else if (info.which === 'TEXT') {
                email.text = buffer;
                bodyParsed = true;
                checkComplete();
              }
            });
          });
          
          msg.once('attributes', attrs => {
            email.uid = attrs.uid;
            email.flags = attrs.flags;
          });
          
          const checkComplete = () => {
            if (headerParsed && bodyParsed) {
              emails.push(email);
              messageCount++;
              
              // If we've received all expected messages, end the connection
              if (messageCount >= expectedMessages) {
                clearTimeout(timeout);
                imap.end();
              }
            }
          };
        });
        
        f.once('error', err => {
          clearTimeout(timeout);
          console.error('Fetch error:', err);
          imap.end();
        });
        
        f.once('end', () => {
          console.log(`✅ Fetch completed, got ${emails.length} emails`);
          // Don't end here, wait for all messages to be parsed
        });
      });
    });
    
    imap.once('error', err => {
      clearTimeout(timeout);
      console.error('IMAP error:', err);
      reject(err);
    });
    
    imap.once('end', () => {
      clearTimeout(timeout);
      console.log('📪 IMAP connection ended');
      
      // Format emails for the client
      const formattedEmails = emails
        .filter(email => email.header)
        .map(email => ({
          uid: email.uid,
          seqno: email.seqno,
          flags: email.flags,
          from: email.header.from,
          to: email.header.to,
          subject: email.header.subject,
          date: email.header.date,
          preview: email.text ? email.text.substring(0, 200) + '...' : '',
          body: email.text,
          html: email.html,
          attachments: email.attachments,
          messageId: email.header.messageId
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      
      resolve(formattedEmails);
    });
    
    console.log('🔌 Connecting to IONOS...');
    imap.connect();
  });
}

// Save emails to Firestore emailClient collection
async function saveEmailsToFirestore(emails, folder) {
  const batch = db.batch();
  
  for (const email of emails) {
    // Create a unique ID based on messageId or uid
    const emailId = email.messageId ? 
      email.messageId.replace(/[<>]/g, '').replace(/[@.]/g, '_') : 
      `${folder}_${email.uid}_${Date.now()}`;
    
    const docRef = db.collection('emailClient').doc(emailId);
    
    const emailData = {
      uid: email.uid,
      from: email.from,
      to: email.to,
      subject: email.subject,
      text: email.body || '',
      html: email.html || '',
      date: admin.firestore.Timestamp.fromDate(new Date(email.date)),
      folder: folder.toLowerCase(),
      isRead: email.flags?.includes('\\Seen') || false,
      isStarred: email.flags?.includes('\\Flagged') || false,
      isImported: false,
      attachments: email.attachments || [],
      messageId: email.messageId,
      syncedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    batch.set(docRef, emailData, { merge: true });
  }
  
  await batch.commit();
  console.log(`✅ Saved ${emails.length} emails to Firestore`);
}

// Main email sync function
exports.emailSyncReal = functions
  .region('europe-west3')
  .runWith({ timeoutSeconds: 60, memory: '512MB' })
  .https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { folder = 'INBOX', limit = '50' } = req.query;
      
      console.log(`📨 Real email sync: ${folder} (limit: ${limit})`);
      
      try {
        // Try to fetch real emails
        const emails = await fetchEmailsFromIONOS(folder, parseInt(limit));
        
        // Save to Firestore for the email client
        if (emails.length > 0) {
          await saveEmailsToFirestore(emails, folder);
        }
        
        res.json({
          emails: emails,
          folder: folder,
          count: emails.length,
          timestamp: new Date().toISOString(),
          source: 'ionos-real'
        });
      } catch (imapError) {
        console.error('IMAP Error:', imapError);
        
        // Try to get cached emails from Firestore
        console.log('📦 Falling back to cached emails...');
        const cachedEmails = await getCachedEmails(folder, parseInt(limit));
        
        if (cachedEmails.length > 0) {
          res.json({
            emails: cachedEmails,
            folder: folder,
            count: cachedEmails.length,
            timestamp: new Date().toISOString(),
            source: 'firestore-cache'
          });
        } else {
          throw imapError; // Re-throw if no cache available
        }
      }
    } catch (error) {
      console.error('Error in email sync:', error);
      res.status(500).json({
        error: 'Failed to sync emails',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
});