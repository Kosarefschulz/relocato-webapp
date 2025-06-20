const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
const Imap = require('imap');
const { simpleParser } = require('mailparser');

// Email configuration from Firebase functions config
const IMAP_CONFIG = {
  user: functions.config().email?.username || process.env.EMAIL_USERNAME || 'bielefeld@relocato.de',
  password: functions.config().email?.password || process.env.EMAIL_PASSWORD || 'Bicm1308!',
  host: 'mail.ionos.de',
  port: 993,
  tls: true,
  tlsOptions: { 
    rejectUnauthorized: false,
    servername: 'mail.ionos.de'
  }
};

// Fetch emails from IONOS
async function fetchEmailsFromIONOS(folder = 'INBOX', limit = 50) {
  return new Promise((resolve, reject) => {
    const emails = [];
    const imap = new Imap(IMAP_CONFIG);
    
    imap.once('ready', () => {
      console.log('📧 Connected to IONOS IMAP server');
      
      imap.openBox(folder, true, (err, box) => {
        if (err) {
          console.error('Error opening folder:', err);
          imap.end();
          return reject(err);
        }
        
        console.log(`📂 Opened folder: ${folder} (${box.messages.total} messages)`);
        
        // Fetch recent emails
        const fetchRange = Math.max(1, box.messages.total - limit + 1) + ':*';
        const f = imap.seq.fetch(fetchRange, {
          bodies: ['HEADER', 'TEXT', ''],
          struct: true
        });
        
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
          
          msg.on('body', (stream, info) => {
            let buffer = '';
            
            stream.on('data', chunk => {
              buffer += chunk.toString('utf8');
            });
            
            stream.once('end', () => {
              if (info.which === 'HEADER') {
                simpleParser(buffer, (err, parsed) => {
                  if (!err) {
                    email.header = {
                      from: parsed.from?.text || '',
                      to: parsed.to?.text || '',
                      subject: parsed.subject || '(Kein Betreff)',
                      date: parsed.date || new Date(),
                      messageId: parsed.messageId
                    };
                  }
                });
              } else if (info.which === 'TEXT') {
                email.text = buffer;
              } else {
                // Parse full message for HTML and attachments
                simpleParser(buffer, (err, parsed) => {
                  if (!err) {
                    email.html = parsed.html || parsed.textAsHtml || '';
                    email.text = email.text || parsed.text || '';
                    if (parsed.attachments) {
                      email.attachments = parsed.attachments.map(att => ({
                        filename: att.filename,
                        size: att.size,
                        contentType: att.contentType
                      }));
                    }
                  }
                });
              }
            });
          });
          
          msg.once('attributes', attrs => {
            email.uid = attrs.uid;
            email.flags = attrs.flags;
          });
          
          msg.once('end', () => {
            emails.push(email);
          });
        });
        
        f.once('error', err => {
          console.error('Fetch error:', err);
          imap.end();
          reject(err);
        });
        
        f.once('end', () => {
          console.log(`✅ Fetched ${emails.length} emails`);
          imap.end();
        });
      });
    });
    
    imap.once('error', err => {
      console.error('IMAP error:', err);
      reject(err);
    });
    
    imap.once('end', () => {
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

// Cloud Function for email sync
exports.emailSync = functions
  .region('europe-west3')
  .https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { folder = 'INBOX', limit = '50' } = req.query;
      
      console.log(`📨 Fetching emails from ${folder} (limit: ${limit})`);
      
      const emails = await fetchEmailsFromIONOS(folder, parseInt(limit));
      
      res.json({
        emails: emails,
        folder: folder,
        count: emails.length,
        timestamp: new Date().toISOString(),
        source: 'firebase-functions'
      });
    } catch (error) {
      console.error('Error syncing emails:', error);
      res.status(500).json({
        error: 'Failed to sync emails',
        message: error.message
      });
    }
  });
});

// Alternative endpoint name for compatibility
exports.emailSyncV2 = functions
  .region('europe-west3')
  .https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { folder = 'INBOX', limit = '50' } = req.query;
      
      console.log(`📨 Fetching emails from ${folder} (limit: ${limit})`);
      
      const emails = await fetchEmailsFromIONOS(folder, parseInt(limit));
      
      res.json({
        emails: emails,
        folder: folder,
        count: emails.length,
        timestamp: new Date().toISOString(),
        source: 'firebase-functions-v2'
      });
    } catch (error) {
      console.error('Error syncing emails:', error);
      res.status(500).json({
        error: 'Failed to sync emails',
        message: error.message
      });
    }
  });
});