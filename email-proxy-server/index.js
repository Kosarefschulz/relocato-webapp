const express = require('express');
const cors = require('cors');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// IONOS Configuration
const IONOS_CONFIG = {
  user: process.env.IONOS_EMAIL || 'bielefeld@relocato.de',
  password: process.env.IONOS_PASSWORD,
  host: process.env.IONOS_IMAP_HOST || 'imap.ionos.de',
  port: parseInt(process.env.IONOS_IMAP_PORT || '993'),
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
};

// Helper function to connect to IMAP
function connectImap() {
  return new Promise((resolve, reject) => {
    const imap = new Imap(IONOS_CONFIG);
    
    imap.once('ready', () => resolve(imap));
    imap.once('error', reject);
    imap.connect();
  });
}

// List emails endpoint
app.post('/api/emails/list', async (req, res) => {
  const { folder = 'INBOX', page = 1, limit = 50 } = req.body;
  
  try {
    console.log(`📧 Fetching emails from ${folder}...`);
    const imap = await connectImap();
    
    // Open folder
    await new Promise((resolve, reject) => {
      imap.openBox(folder, true, (err, box) => {
        if (err) reject(err);
        else resolve(box);
      });
    });
    
    // Get total count
    const totalMessages = imap.seq.length;
    
    // Calculate range for pagination
    const start = Math.max(1, totalMessages - (page * limit) + 1);
    const end = Math.max(1, totalMessages - ((page - 1) * limit));
    
    if (start > end || totalMessages === 0) {
      imap.end();
      return res.json({
        success: true,
        emails: [],
        total: totalMessages,
        page,
        limit
      });
    }
    
    // Fetch emails
    const emails = [];
    const f = imap.seq.fetch(`${start}:${end}`, {
      bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
      struct: true
    });
    
    await new Promise((resolve, reject) => {
      f.on('message', (msg, seqno) => {
        const email = { seqno, uid: null };
        
        msg.on('body', (stream, info) => {
          let buffer = '';
          stream.on('data', chunk => buffer += chunk.toString('utf8'));
          stream.once('end', () => {
            const parsed = Imap.parseHeader(buffer);
            email.from = parsed.from ? parsed.from[0] : 'Unknown';
            email.to = parsed.to ? parsed.to[0] : '';
            email.subject = parsed.subject ? parsed.subject[0] : '(Kein Betreff)';
            email.date = parsed.date ? parsed.date[0] : new Date().toISOString();
          });
        });
        
        msg.once('attributes', attrs => {
          email.uid = attrs.uid;
          email.flags = attrs.flags;
        });
        
        msg.once('end', () => {
          emails.push({
            id: email.uid,
            uid: email.uid,
            from: parseAddress(email.from),
            to: [parseAddress(email.to)],
            subject: email.subject,
            date: new Date(email.date).toISOString(),
            flags: email.flags || [],
            folder: folder
          });
        });
      });
      
      f.once('error', reject);
      f.once('end', resolve);
    });
    
    imap.end();
    
    // Sort by date (newest first)
    emails.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json({
      success: true,
      emails,
      total: totalMessages,
      page,
      limit
    });
    
  } catch (error) {
    console.error('IMAP Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Read single email endpoint
app.post('/api/emails/read', async (req, res) => {
  const { uid, folder = 'INBOX' } = req.body;
  
  if (!uid) {
    return res.status(400).json({
      success: false,
      error: 'Email UID is required'
    });
  }
  
  try {
    console.log(`📧 Reading email ${uid} from ${folder}...`);
    const imap = await connectImap();
    
    // Open folder
    await new Promise((resolve, reject) => {
      imap.openBox(folder, true, (err, box) => {
        if (err) reject(err);
        else resolve(box);
      });
    });
    
    // Fetch email by UID
    let email = null;
    const f = imap.fetch(uid, {
      bodies: '',
      struct: true
    });
    
    await new Promise((resolve, reject) => {
      f.on('message', (msg, seqno) => {
        msg.on('body', (stream, info) => {
          simpleParser(stream, (err, parsed) => {
            if (err) {
              console.error('Parse error:', err);
              return;
            }
            
            email = {
              id: uid,
              uid: uid,
              from: parsed.from ? {
                name: parsed.from.text,
                address: parsed.from.value[0].address
              } : { name: 'Unknown', address: 'unknown@unknown.com' },
              to: parsed.to ? parsed.to.value.map(t => ({
                name: t.name || '',
                address: t.address
              })) : [],
              subject: parsed.subject || '(Kein Betreff)',
              date: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
              text: parsed.text || '',
              html: parsed.html || '',
              body: parsed.text || parsed.html || '',
              attachments: parsed.attachments ? parsed.attachments.map(a => ({
                filename: a.filename,
                size: a.size,
                contentType: a.contentType
              })) : [],
              folder: folder
            };
          });
        });
        
        msg.once('attributes', attrs => {
          if (email) email.flags = attrs.flags;
        });
      });
      
      f.once('error', reject);
      f.once('end', resolve);
    });
    
    imap.end();
    
    if (!email) {
      return res.status(404).json({
        success: false,
        error: 'Email not found'
      });
    }
    
    res.json({
      success: true,
      email
    });
    
  } catch (error) {
    console.error('IMAP Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function to parse email addresses
function parseAddress(addressStr) {
  if (!addressStr) return { name: '', address: '' };
  
  const match = addressStr.match(/^"?([^"<]*)"?\s*<?([^>]*)>?$/);
  if (match) {
    return {
      name: match[1].trim(),
      address: match[2].trim() || addressStr
    };
  }
  
  return { name: '', address: addressStr };
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'email-proxy',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`📧 Email proxy server running on port ${PORT}`);
  console.log(`📬 Using IONOS account: ${IONOS_CONFIG.user}`);
});