// Vercel Serverless Function für E-Mail-Sync
// Diese Funktion läuft auf Vercel's Servern und umgeht CORS-Probleme

import Imap from 'imap';
import { simpleParser } from 'mailparser';
import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { folder = 'INBOX', limit = '50', forceSync = 'false' } = req.query;
    const limitNum = parseInt(limit);
    const forceSyncBool = forceSync === 'true';
    
    console.log(`📧 Syncing emails from folder: ${folder}, limit: ${limitNum}`);
    
    // Fetch emails from IONOS
    const emails = await fetchEmailsFromIONOS(folder, limitNum);
    
    // Store emails in Firestore if we have authentication
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const userId = decodedToken.uid;
        
        // Store emails in Firestore
        const batch = db.batch();
        const emailsRef = db.collection('emailClient');
        
        for (const email of emails) {
          const docRef = emailsRef.doc(email.uid.toString());
          batch.set(docRef, {
            ...email,
            userId,
            syncedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: !forceSyncBool });
        }
        
        await batch.commit();
      } catch (authError) {
        console.log('Auth verification failed, skipping Firestore storage:', authError.message);
      }
    }
    
    console.log(`✅ Synced ${emails.length} emails successfully`);
    
    res.status(200).json({
      success: true,
      emails: emails,
      count: emails.length,
      folder: folder
    });
  } catch (error) {
    console.error('Email sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

/**
 * Fetch emails from IONOS IMAP
 */
async function fetchEmailsFromIONOS(folderName, maxEmails) {
  return new Promise((resolve, reject) => {
    const emails = [];
    
    const imap = new Imap({
      user: process.env.IONOS_EMAIL_USER || 'bielefeld@relocato.de',
      password: process.env.IONOS_EMAIL_PASS,
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