const functions = require('firebase-functions');
const cors = require('cors')({ 
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
});
const nodemailer = require('nodemailer');
const Imap = require('imap');
const { simpleParser } = require('mailparser');

// SMTP Configuration from environment
const SMTP_CONFIG = {
  host: functions.config().smtp?.host || 'smtp.ionos.de',
  port: parseInt(functions.config().smtp?.port || '587'),
  secure: functions.config().smtp?.port === '465',
  auth: {
    user: functions.config().smtp?.user,
    pass: functions.config().smtp?.pass
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  }
};

// IMAP Configuration
const IMAP_CONFIG = {
  user: SMTP_CONFIG.auth.user,
  password: SMTP_CONFIG.auth.pass,
  host: 'imap.ionos.de',
  port: 993,
  tls: true,
  tlsOptions: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  },
  connTimeout: 10000,
  authTimeout: 10000
};

// Create email transporter
let transporter;
try {
  transporter = nodemailer.createTransport(SMTP_CONFIG);
} catch (error) {
  console.error('❌ Error creating transporter:', error);
}

// Helper function to handle CORS
const handleCors = (handler) => {
  return (req, res) => {
    cors(req, res, () => {
      handler(req, res);
    });
  };
};

// List emails endpoint
exports.listEmails = functions.https.onRequest(handleCors(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { folder = 'INBOX', page = 1, limit = 50 } = req.body;
    
    console.log(`📧 Loading email list: Folder=${folder}, Page=${page}, Limit=${limit}`);
    
    const imap = new Imap(IMAP_CONFIG);
    
    let emails = [];
    let totalCount = 0;
    let connectionClosed = false;
    
    await new Promise((resolve, reject) => {
      imap.once('ready', () => {
        imap.openBox(folder, false, (err, box) => {
          if (err) {
            console.error('❌ Error opening mailbox:', err);
            if (!connectionClosed) {
              connectionClosed = true;
              imap.end();
              reject(err);
            }
            return;
          }
          
          totalCount = box.messages.total;
          
          if (totalCount === 0) {
            if (!connectionClosed) {
              connectionClosed = true;
              imap.end();
              resolve();
            }
            return;
          }
          
          // Calculate range for pagination
          const start = Math.max(1, totalCount - (page * limit) + 1);
          const end = Math.max(1, totalCount - ((page - 1) * limit));
          
          const fetch = imap.seq.fetch(`${start}:${end}`, {
            bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
            struct: false
          });
          
          fetch.on('message', (msg, seqno) => {
            let header = '';
            let uid = null;
            let flags = [];
            
            msg.on('body', (stream, info) => {
              stream.on('data', (chunk) => {
                header += chunk.toString('utf8');
              });
            });
            
            msg.once('attributes', (attrs) => {
              uid = attrs.uid;
              flags = attrs.flags || [];
            });
            
            msg.once('end', () => {
              const lines = header.split('\r\n');
              const emailInfo = {
                id: uid || seqno,
                seqno: seqno,
                flags: flags
              };
              
              lines.forEach(line => {
                if (line.startsWith('From: ')) {
                  emailInfo.from = line.substring(6);
                } else if (line.startsWith('To: ')) {
                  emailInfo.to = line.substring(4);
                } else if (line.startsWith('Subject: ')) {
                  emailInfo.subject = line.substring(9);
                } else if (line.startsWith('Date: ')) {
                  emailInfo.date = line.substring(6);
                }
              });
              
              emails.push(emailInfo);
            });
          });
          
          fetch.once('error', (err) => {
            console.error('❌ Fetch error:', err);
            if (!connectionClosed) {
              connectionClosed = true;
              imap.end();
              reject(err);
            }
          });
          
          fetch.once('end', () => {
            console.log(`✅ ${emails.length} emails loaded`);
            if (!connectionClosed) {
              connectionClosed = true;
              imap.end();
              resolve();
            }
          });
        });
      });
      
      imap.once('error', (err) => {
        console.error('❌ IMAP error:', err);
        if (!connectionClosed) {
          connectionClosed = true;
          reject(err);
        }
      });
      
      imap.connect();
    });
    
    res.json({ 
      success: true, 
      emails: emails.reverse(), // Newest first
      total: totalCount 
    });
    
  } catch (error) {
    console.error('❌ Error fetching email list:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}));

// Read email endpoint
exports.readEmail = functions.https.onRequest(handleCors(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { uid, folder = 'INBOX' } = req.body;
    
    if (!uid) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email UID is required' 
      });
    }
    
    console.log(`📧 Loading email: UID=${uid}, Folder=${folder}`);
    
    const imap = new Imap(IMAP_CONFIG);
    
    let emailData = null;
    let connectionClosed = false;
    
    await new Promise((resolve, reject) => {
      imap.once('ready', () => {
        imap.openBox(folder, false, (err, box) => {
          if (err) {
            console.error('❌ Error opening mailbox:', err);
            if (!connectionClosed) {
              connectionClosed = true;
              imap.end();
              reject(err);
            }
            return;
          }
          
          const fetch = imap.fetch([uid], { 
            bodies: '',
            struct: true
          });
          
          fetch.on('message', (msg, seqno) => {
            msg.on('body', (stream, info) => {
              simpleParser(stream, async (err, parsed) => {
                if (err) {
                  console.error('❌ Parse error:', err);
                  return;
                }
                
                emailData = {
                  id: uid,
                  from: parsed.from?.text || '',
                  to: parsed.to?.text || '',
                  subject: parsed.subject || '',
                  date: parsed.date?.toISOString() || new Date().toISOString(),
                  text: parsed.text || '',
                  html: parsed.html || parsed.textAsHtml || '',
                  attachments: parsed.attachments?.map(att => ({
                    filename: att.filename,
                    contentType: att.contentType,
                    size: att.size
                  })) || []
                };
              });
            });
          });
          
          fetch.once('error', (err) => {
            console.error('❌ Fetch error:', err);
            if (!connectionClosed) {
              connectionClosed = true;
              imap.end();
              reject(err);
            }
          });
          
          fetch.once('end', () => {
            console.log('✅ Email loaded');
            if (!connectionClosed) {
              connectionClosed = true;
              imap.end();
              resolve();
            }
          });
        });
      });
      
      imap.once('error', (err) => {
        console.error('❌ IMAP error:', err);
        if (!connectionClosed) {
          connectionClosed = true;
          reject(err);
        }
      });
      
      imap.connect();
    });
    
    if (emailData) {
      res.json({ 
        success: true, 
        email: emailData 
      });
    } else {
      res.status(404).json({ 
        success: false, 
        error: 'Email not found' 
      });
    }
    
  } catch (error) {
    console.error('❌ Error fetching email:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}));

// Get email folders endpoint
exports.getEmailFolders = functions.https.onRequest(handleCors(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    console.log('📁 Loading email folders...');
    
    const imap = new Imap(IMAP_CONFIG);
    
    let connectionClosed = false;
    
    const folders = await new Promise((resolve, reject) => {
      imap.once('ready', () => {
        imap.getBoxes((err, boxes) => {
          if (err) {
            console.error('❌ Error fetching folders:', err);
            if (!connectionClosed) {
              connectionClosed = true;
              imap.end();
              reject(err);
            }
            return;
          }
          
          const folders = [];
          
          function parseBoxes(boxes, parent = '') {
            for (const [name, box] of Object.entries(boxes)) {
              const fullPath = parent ? `${parent}${box.delimiter}${name}` : name;
              folders.push({
                name: name,
                path: fullPath,
                delimiter: box.delimiter,
                flags: box.attribs || [],
                hasChildren: box.children ? Object.keys(box.children).length > 0 : false
              });
              
              if (box.children) {
                parseBoxes(box.children, fullPath);
              }
            }
          }
          
          parseBoxes(boxes);
          
          console.log(`✅ ${folders.length} folders found`);
          if (!connectionClosed) {
            connectionClosed = true;
            imap.end();
            resolve(folders);
          }
        });
      });
      
      imap.once('error', (err) => {
        console.error('❌ IMAP error:', err);
        if (!connectionClosed) {
          connectionClosed = true;
          reject(err);
        }
      });
      
      imap.connect();
    });
    
    res.json({ 
      success: true, 
      folders: folders 
    });
    
  } catch (error) {
    console.error('❌ Error fetching folders:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}));

// Send email endpoint
exports.sendEmail = functions.https.onRequest(handleCors(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { to, subject, content, attachments, bcc } = req.body;
    
    if (!to || !subject || !content) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: to, subject, content' 
      });
    }

    if (!transporter) {
      return res.status(503).json({ 
        success: false, 
        error: 'Email service not available' 
      });
    }

    // Prepare email options
    const mailOptions = {
      from: `Relocato Umzugsservice <${functions.config().smtp?.from || SMTP_CONFIG.auth.user}>`,
      to: to,
      subject: subject,
      text: content,
      html: content.replace(/\n/g, '<br>'), // Simple HTML conversion
      attachments: []
    };

    // Add BCC (for sent folder)
    if (bcc) {
      mailOptions.bcc = bcc;
      console.log('📋 BCC to:', bcc);
    }

    // Process PDF attachments
    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        encoding: 'base64'
      }));
    }

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent:', {
      messageId: info.messageId,
      to: to,
      subject: subject
    });

    res.json({ 
      success: true, 
      messageId: info.messageId,
      accepted: info.accepted
    });

  } catch (error) {
    console.error('❌ Email send failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
}));

// Health check endpoint
exports.healthCheck = functions.https.onRequest(handleCors(async (req, res) => {
  res.json({ 
    status: 'ok', 
    smtp: transporter ? 'ready' : 'error',
    from: functions.config().smtp?.from || SMTP_CONFIG.auth.user,
    timestamp: new Date().toISOString()
  });
}));

// Initialize SMTP on function cold start
if (transporter) {
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ SMTP connection error:', error);
    } else {
      console.log('✅ SMTP server is ready for emails');
      console.log('📧 From:', functions.config().smtp?.from || SMTP_CONFIG.auth.user);
    }
  });
}