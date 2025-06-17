const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Imap = require('imap');
const { simpleParser } = require('mailparser');

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * Sync emails from IONOS to Firestore for the email client
 */
exports.syncEmailsForClient = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { folder = 'INBOX', limit = 50, forceSync = false } = data;
    
    try {
      console.log(`📧 Syncing emails from folder: ${folder}, limit: ${limit}`);
      const emails = await fetchEmailsFromIONOS(folder, limit);
      
      // Store emails in Firestore
      const batch = db.batch();
      const emailsRef = db.collection('emailClient');
      
      for (const email of emails) {
        const docRef = emailsRef.doc(email.uid.toString());
        batch.set(docRef, {
          ...email,
          userId: context.auth.uid,
          syncedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: !forceSync });
      }
      
      await batch.commit();
      
      console.log(`✅ Synced ${emails.length} emails successfully`);
      return {
        success: true,
        count: emails.length,
        folder: folder
      };
    } catch (error) {
      console.error('❌ Error syncing emails:', error);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });

/**
 * Get email folders from IONOS
 */
exports.getEmailFolders = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
      const folders = await fetchFoldersFromIONOS();
      return {
        success: true,
        folders: folders
      };
    } catch (error) {
      console.error('❌ Error fetching folders:', error);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });

/**
 * Send email via IONOS SMTP
 */
exports.sendEmailFromClient = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { to, subject, html, cc, bcc, replyTo, attachments } = data;

    if (!to || !subject || !html) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    try {
      // Use the existing send-email API endpoint
      const response = await fetch(`${process.env.API_URL}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          subject,
          html,
          cc,
          bcc,
          replyTo,
          attachments
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Store sent email in Firestore
        await db.collection('emailClient').add({
          folder: 'Sent',
          from: 'bielefeld@relocato.de',
          to,
          subject,
          html,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          userId: context.auth.uid,
          messageId: result.messageId
        });
      }

      return result;
    } catch (error) {
      console.error('❌ Error sending email:', error);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });

/**
 * Fetch emails from IONOS IMAP
 */
async function fetchEmailsFromIONOS(folderName, maxEmails) {
  return new Promise((resolve, reject) => {
    const emails = [];
    
    const imap = new Imap({
      user: process.env.EMAIL_USER || 'bielefeld@relocato.de',
      password: process.env.EMAIL_PASS || 'Bicm1308',
      host: 'imap.ionos.de',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });

    imap.once('ready', () => {
      imap.openBox(folderName, true, (err, box) => {
        if (err) {
          console.error('Error opening folder:', err);
          imap.end();
          reject(err);
          return;
        }

        // Fetch the latest emails
        const fetch = imap.seq.fetch(`${Math.max(1, box.messages.total - maxEmails + 1)}:*`, {
          bodies: '',
          envelope: true,
          struct: true
        });

        fetch.on('message', (msg, seqno) => {
          const emailData = {
            uid: seqno,
            folder: folderName
          };

          msg.on('body', (stream) => {
            simpleParser(stream, async (err, parsed) => {
              if (err) {
                console.error('Parse error:', err);
                return;
              }

              emailData.messageId = parsed.messageId;
              emailData.from = parsed.from?.text || '';
              emailData.to = parsed.to?.text || '';
              emailData.subject = parsed.subject || '(Kein Betreff)';
              emailData.date = parsed.date || new Date();
              emailData.text = parsed.text || '';
              emailData.html = parsed.html || parsed.textAsHtml || '';
              emailData.attachments = parsed.attachments?.map(att => ({
                filename: att.filename,
                contentType: att.contentType,
                size: att.size
              })) || [];
              
              emails.push(emailData);
            });
          });

          msg.once('attributes', (attrs) => {
            emailData.flags = attrs.flags;
            emailData.uid = attrs.uid;
          });
        });

        fetch.once('error', (err) => {
          console.error('Fetch error:', err);
          reject(err);
        });

        fetch.once('end', () => {
          imap.end();
        });
      });
    });

    imap.once('error', (err) => {
      console.error('IMAP error:', err);
      reject(err);
    });

    imap.once('end', () => {
      resolve(emails);
    });

    imap.connect();
  });
}

/**
 * Fetch folder list from IONOS IMAP
 */
async function fetchFoldersFromIONOS() {
  return new Promise((resolve, reject) => {
    const folders = [];
    
    const imap = new Imap({
      user: process.env.EMAIL_USER || 'bielefeld@relocato.de',
      password: process.env.EMAIL_PASS || 'Bicm1308',
      host: 'imap.ionos.de',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });

    imap.once('ready', () => {
      imap.getBoxes((err, boxes) => {
        if (err) {
          console.error('Error getting folders:', err);
          imap.end();
          reject(err);
          return;
        }

        // Parse folder structure
        const parseFolders = (obj, parent = '') => {
          for (const [name, box] of Object.entries(obj)) {
            if (name !== 'attribs' && name !== 'delimiter' && name !== 'children') {
              const fullPath = parent ? `${parent}${box.delimiter}${name}` : name;
              folders.push({
                name: name,
                path: fullPath,
                hasChildren: !!box.children
              });
              
              if (box.children) {
                parseFolders(box.children, fullPath);
              }
            }
          }
        };

        parseFolders(boxes);
        imap.end();
      });
    });

    imap.once('error', (err) => {
      console.error('IMAP error:', err);
      reject(err);
    });

    imap.once('end', () => {
      resolve(folders);
    });

    imap.connect();
  });
}