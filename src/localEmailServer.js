// Local Email Server for Development
// This server runs locally and fetches emails from IONOS

const express = require('express');
const cors = require('cors');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3002;

// Email configuration from environment variables
const IMAP_CONFIG = {
  user: process.env.REACT_APP_EMAIL_USERNAME,
  password: process.env.REACT_APP_EMAIL_PASSWORD,
  host: process.env.REACT_APP_IMAP_SERVER || 'mail.ionos.de',
  port: parseInt(process.env.REACT_APP_IMAP_PORT) || 993,
  tls: true,
  tlsOptions: { 
    rejectUnauthorized: false,
    servername: process.env.REACT_APP_IMAP_SERVER || 'mail.ionos.de'
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

// API endpoints
app.get('/api/email-sync', async (req, res) => {
  try {
    const { folder = 'INBOX', limit = '50' } = req.query;
    
    if (!IMAP_CONFIG.user || !IMAP_CONFIG.password) {
      return res.status(500).json({
        error: 'Email credentials not configured',
        message: 'Please set REACT_APP_EMAIL_USERNAME and REACT_APP_EMAIL_PASSWORD in your .env file'
      });
    }
    
    console.log(`📨 Fetching emails from ${folder} (limit: ${limit})`);
    
    const emails = await fetchEmailsFromIONOS(folder, parseInt(limit));
    
    res.json({
      emails: emails,
      folder: folder,
      count: emails.length,
      timestamp: new Date().toISOString(),
      source: 'ionos-live'
    });
  } catch (error) {
    console.error('Error syncing emails:', error);
    res.status(500).json({
      error: 'Failed to sync emails',
      message: error.message
    });
  }
});

app.get('/api/email-sync-v2', async (req, res) => {
  // Same implementation as email-sync for now
  try {
    const { folder = 'INBOX', limit = '50' } = req.query;
    
    if (!IMAP_CONFIG.user || !IMAP_CONFIG.password) {
      return res.status(500).json({
        error: 'Email credentials not configured',
        message: 'Please set REACT_APP_EMAIL_USERNAME and REACT_APP_EMAIL_PASSWORD in your .env file'
      });
    }
    
    const emails = await fetchEmailsFromIONOS(folder, parseInt(limit));
    
    res.json({
      emails: emails,
      folder: folder,
      count: emails.length,
      timestamp: new Date().toISOString(),
      source: 'ionos-live'
    });
  } catch (error) {
    console.error('Error syncing emails:', error);
    res.status(500).json({
      error: 'Failed to sync emails',
      message: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'local-email-server',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Local email server running on http://localhost:${PORT}`);
  console.log(`📧 Email user: ${IMAP_CONFIG.user || 'NOT SET'}`);
  console.log(`🔐 Password: ${IMAP_CONFIG.password ? '***' : 'NOT SET'}`);
  
  if (!IMAP_CONFIG.user || !IMAP_CONFIG.password) {
    console.error('\n⚠️  WARNING: Email credentials not found!');
    console.error('Please create a .env file with:');
    console.error('REACT_APP_EMAIL_USERNAME=your-email@ionos.de');
    console.error('REACT_APP_EMAIL_PASSWORD=your-password\n');
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  process.exit(0);
});