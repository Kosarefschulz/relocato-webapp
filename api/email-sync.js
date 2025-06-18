// Vercel Serverless Function für E-Mail-Sync
// Diese Funktion läuft auf Vercel's Servern und umgeht CORS-Probleme

const Imap = require('imap');
const { simpleParser } = require('mailparser');

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
    
    console.log(`📧 API: Syncing emails from folder: ${folder}, limit: ${limitNum}`);
    
    // Check for required environment variables
    const emailUser = process.env.IONOS_EMAIL_USER || process.env.REACT_APP_EMAIL_USERNAME || process.env.SMTP_USER;
    const emailPass = process.env.IONOS_EMAIL_PASS || process.env.REACT_APP_EMAIL_PASSWORD || process.env.SMTP_PASS;
    
    if (!emailUser || !emailPass) {
      console.error('❌ Missing email credentials in environment variables');
      console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('EMAIL') || k.includes('SMTP') || k.includes('IONOS')));
      return res.status(500).json({
        error: 'Email credentials not configured',
        details: 'Email user or password not found in environment variables'
      });
    }
    
    // Fetch emails from IONOS
    const emails = await fetchEmailsFromIONOS(folder, limitNum);
    
    res.status(200).json({
      emails: emails,
      folder: folder,
      count: emails.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Email sync error:', error);
    res.status(500).json({
      error: 'Failed to sync emails',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

async function fetchEmailsFromIONOS(folder, limit) {
  return new Promise((resolve, reject) => {
    const emails = [];
    
    const imap = new Imap({
      user: emailUser,
      password: emailPass,
      host: 'imap.ionos.de',
      port: 993,
      tls: true,
      tlsOptions: { 
        rejectUnauthorized: false,
        servername: 'mail.ionos.de'
      }
    });

    imap.once('ready', () => {
      console.log('✅ IMAP connection ready');
      
      imap.openBox(folder, false, (err, box) => {
        if (err) {
          console.error('❌ Error opening mailbox:', err);
          imap.end();
          return reject(err);
        }

        console.log(`📂 Opened folder: ${folder} (${box.messages.total} messages)`);

        if (box.messages.total === 0) {
          imap.end();
          return resolve([]);
        }

        // Fetch last N messages
        const fetchStart = Math.max(1, box.messages.total - limit + 1);
        const fetchEnd = box.messages.total;
        
        const fetch = imap.seq.fetch(`${fetchStart}:${fetchEnd}`, {
          bodies: '',
          envelope: true,
          struct: true
        });

        fetch.on('message', (msg, seqno) => {
          const emailData = {
            uid: null,
            seqno: seqno,
            flags: [],
            envelope: null,
            body: null
          };

          msg.on('body', (stream, info) => {
            let buffer = '';
            stream.on('data', (chunk) => {
              buffer += chunk.toString('utf8');
            });
            stream.once('end', () => {
              simpleParser(buffer)
                .then(parsed => {
                  emailData.body = {
                    from: parsed.from?.text || '',
                    to: parsed.to?.text || '',
                    subject: parsed.subject || '(no subject)',
                    date: parsed.date || new Date(),
                    text: parsed.text || '',
                    html: parsed.html || '',
                    attachments: parsed.attachments?.map(att => ({
                      filename: att.filename,
                      size: att.size,
                      contentType: att.contentType
                    })) || []
                  };
                })
                .catch(err => {
                  console.error('Error parsing email:', err);
                });
            });
          });

          msg.once('attributes', (attrs) => {
            emailData.uid = attrs.uid;
            emailData.flags = attrs.flags;
            emailData.date = attrs.date;
          });

          msg.once('end', () => {
            emails.push(emailData);
          });
        });

        fetch.once('error', (err) => {
          console.error('Fetch error:', err);
          reject(err);
        });

        fetch.once('end', () => {
          console.log(`✅ Fetched ${emails.length} emails`);
          imap.end();
        });
      });
    });

    imap.once('error', (err) => {
      console.error('IMAP error:', err);
      reject(err);
    });

    imap.once('end', () => {
      console.log('📪 IMAP connection ended');
      resolve(emails);
    });

    console.log('🔌 Connecting to IONOS IMAP...');
    imap.connect();
  });
}