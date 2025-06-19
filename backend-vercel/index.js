const express = require('express');
const nodemailer = require('nodemailer');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const cors = require('cors');

const app = express();

// CORS
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// Email configuration
const emailUser = process.env.SMTP_USER || 'bielefeld@relocato.de';
const emailPass = process.env.SMTP_PASS || 'Bicm1308';

// SMTP Transporter
const transporter = nodemailer.createTransporter({
  host: 'smtp.ionos.de',
  port: 587,
  secure: false,
  auth: {
    user: emailUser,
    pass: emailPass
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'Relocato Email Backend',
    endpoints: [
      'GET /sync-emails',
      'POST /send-email',
      'GET /test'
    ]
  });
});

// Test endpoint
app.get('/test', async (req, res) => {
  try {
    await transporter.verify();
    res.json({ 
      smtp: 'connected',
      user: emailUser.substring(0, 10) + '...'
    });
  } catch (error) {
    res.status(500).json({ 
      smtp: 'error',
      error: error.message 
    });
  }
});

// Send email
app.post('/send-email', async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;
    
    const info = await transporter.sendMail({
      from: `RELOCATO® <${emailUser}>`,
      to: to || emailUser,
      subject: subject || 'Test Email',
      text: text || 'Test email content',
      html: html || '<p>Test email content</p>'
    });
    
    res.json({
      success: true,
      messageId: info.messageId,
      accepted: info.accepted
    });
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Sync emails (simplified)
app.get('/sync-emails', async (req, res) => {
  const { folder = 'INBOX', limit = 10 } = req.query;
  
  try {
    const emails = await fetchEmails(folder, parseInt(limit));
    res.json({
      success: true,
      emails: emails,
      count: emails.length,
      folder: folder
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// IMAP email fetching
function fetchEmails(folder, limit) {
  return new Promise((resolve, reject) => {
    const emails = [];
    
    const imap = new Imap({
      user: emailUser,
      password: emailPass,
      host: 'imap.ionos.de',
      port: 993,
      tls: true,
      tlsOptions: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      },
      connTimeout: 10000
    });
    
    const timeout = setTimeout(() => {
      imap.destroy();
      reject(new Error('IMAP timeout'));
    }, 9000);
    
    imap.once('ready', () => {
      clearTimeout(timeout);
      
      imap.openBox(folder, false, (err, box) => {
        if (err) {
          imap.end();
          return reject(err);
        }
        
        if (box.messages.total === 0) {
          imap.end();
          return resolve([]);
        }
        
        const fetchStart = Math.max(1, box.messages.total - limit + 1);
        const fetchEnd = box.messages.total;
        
        const f = imap.seq.fetch(`${fetchStart}:${fetchEnd}`, {
          bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
          struct: true
        });
        
        f.on('message', (msg, seqno) => {
          const email = {
            seqno: seqno,
            uid: null,
            flags: [],
            header: {}
          };
          
          msg.on('body', (stream, info) => {
            let buffer = '';
            stream.on('data', chunk => buffer += chunk.toString('utf8'));
            stream.once('end', () => {
              // Parse headers
              const lines = buffer.split('\r\n');
              lines.forEach(line => {
                if (line.toLowerCase().startsWith('from:')) {
                  email.header.from = line.substring(5).trim();
                } else if (line.toLowerCase().startsWith('to:')) {
                  email.header.to = line.substring(3).trim();
                } else if (line.toLowerCase().startsWith('subject:')) {
                  email.header.subject = line.substring(8).trim();
                } else if (line.toLowerCase().startsWith('date:')) {
                  email.header.date = line.substring(5).trim();
                }
              });
            });
          });
          
          msg.once('attributes', attrs => {
            email.uid = attrs.uid;
            email.flags = attrs.flags;
          });
          
          msg.once('end', () => {
            emails.push({
              uid: email.uid,
              seqno: email.seqno,
              flags: email.flags,
              from: email.header.from || '',
              to: email.header.to || '',
              subject: email.header.subject || '(no subject)',
              date: email.header.date ? new Date(email.header.date) : new Date()
            });
          });
        });
        
        f.once('error', err => reject(err));
        f.once('end', () => {
          imap.end();
        });
      });
    });
    
    imap.once('error', err => {
      clearTimeout(timeout);
      reject(err);
    });
    
    imap.once('end', () => {
      clearTimeout(timeout);
      resolve(emails);
    });
    
    imap.connect();
  });
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Email backend running on port ${PORT}`);
});