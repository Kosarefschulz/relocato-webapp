const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Imap = require('imap');
const { simpleParser } = require('mailparser');

/**
 * Fetch emails with import status
 */
exports.getEmailsWithStatus = functions
  .region('europe-west1')
  .runWith({
    timeoutSeconds: 60,
    memory: '512MB'
  })
  .https.onRequest(async (req, res) => {
    // CORS Headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    
    const limit = parseInt(req.query.limit) || 20;
    const folder = 'erfolgreich verarbeitete Anfragen';
    
    console.log(`📧 Fetching last ${limit} emails from ${folder}`);
    
    const config = {
      user: 'bielefeld@relocato.de',
      password: 'Bicm1308',
      host: 'imap.ionos.de',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    };
    
    const db = admin.firestore();
    const emails = [];
    const imap = new Imap(config);
    
    return new Promise((resolve) => {
      imap.once('ready', () => {
        console.log('✅ Connected to IONOS');
        
        imap.openBox(folder, true, async (err, box) => {
          if (err) {
            res.json({ success: false, error: err.message });
            imap.end();
            return;
          }
          
          console.log(`📬 ${box.messages.total} emails in folder`);
          
          if (box.messages.total === 0) {
            res.json({ success: true, emails: [] });
            imap.end();
            return;
          }
          
          // Get the latest emails
          const start = Math.max(1, box.messages.total - limit + 1);
          const fetch = imap.fetch(`${start}:${box.messages.total}`, {
            bodies: '',
            struct: true
          });
          
          const emailPromises = [];
          
          fetch.on('message', (msg, seqno) => {
            const emailPromise = new Promise((resolveEmail) => {
              msg.on('body', (stream) => {
                simpleParser(stream, async (err, parsed) => {
                  if (err) {
                    resolveEmail(null);
                    return;
                  }
                  
                  try {
                    // Check if email is already imported
                    let isImported = false;
                    let customerNumber = null;
                    
                    if (parsed.from?.text) {
                      const emailAddress = extractEmailAddress(parsed.from.text);
                      if (emailAddress) {
                        const customerQuery = await db.collection('customers')
                          .where('email', '==', emailAddress)
                          .limit(1)
                          .get();
                        
                        if (!customerQuery.empty) {
                          isImported = true;
                          customerNumber = customerQuery.docs[0].data().customerNumber;
                        }
                      }
                    }
                    
                    const emailData = {
                      seqno,
                      from: parsed.from?.text || '',
                      subject: parsed.subject || '',
                      date: parsed.date || new Date(),
                      preview: (parsed.text || '').substring(0, 300) + '...',
                      isImported,
                      customerNumber
                    };
                    
                    resolveEmail(emailData);
                  } catch (error) {
                    console.error(`Error processing email ${seqno}:`, error);
                    resolveEmail(null);
                  }
                });
              });
            });
            
            emailPromises.push(emailPromise);
          });
          
          fetch.once('end', async () => {
            const results = await Promise.all(emailPromises);
            const validEmails = results.filter(e => e !== null);
            
            console.log(`✅ Processed ${validEmails.length} emails`);
            
            res.json({
              success: true,
              emails: validEmails.reverse() // Newest first
            });
            
            imap.end();
          });
        });
      });
      
      imap.once('error', (err) => {
        console.error('IMAP Error:', err);
        res.status(500).json({ success: false, error: err.message });
      });
      
      imap.connect();
    });
  });

/**
 * Extract email address from a string like "Name <email@domain.com>"
 */
function extractEmailAddress(fromText) {
  const match = fromText.match(/<(.+?)>/);
  if (match) {
    return match[1].toLowerCase();
  }
  // If no angle brackets, assume the whole string is the email
  if (fromText.includes('@')) {
    return fromText.toLowerCase().trim();
  }
  return null;
}