const Imap = require('imap');
const { simpleParser } = require('mailparser');

// Enable CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

module.exports = async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeader('Access-Control-Allow-Origin', '*').end();
  }

  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  try {
    const { operation = 'list', folder = 'INBOX', page = 1, limit = 50, uid } = req.body || req.query;

    // IONOS Configuration
    const config = {
      user: process.env.IONOS_EMAIL || 'bielefeld@relocato.de',
      password: process.env.IONOS_PASSWORD,
      host: process.env.IONOS_IMAP_HOST || 'imap.ionos.de',
      port: parseInt(process.env.IONOS_IMAP_PORT || '993'),
      tls: true,
      tlsOptions: { 
        rejectUnauthorized: false,
        servername: 'imap.ionos.de'
      },
      connTimeout: 10000,
      authTimeout: 10000
    };

    if (!config.password) {
      throw new Error('IONOS_PASSWORD not configured');
    }

    console.log(`📧 IMAP operation: ${operation} on ${folder}`);

    switch (operation) {
      case 'list':
        return await listEmails(config, folder, parseInt(page), parseInt(limit), res);
      case 'read':
        return await readEmail(config, folder, uid, res);
      case 'folders':
        return await listFolders(config, res);
      default:
        return res.status(400).json({ error: 'Invalid operation' });
    }
  } catch (error) {
    console.error('IMAP Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

async function listEmails(config, folder, page, limit, res) {
  return new Promise((resolve, reject) => {
    const imap = new Imap(config);
    const emails: any[] = [];

    imap.once('ready', () => {
      imap.openBox(folder, true, (err, box) => {
        if (err) {
          imap.end();
          return reject(err);
        }

        const totalMessages = box.messages.total;
        
        // Calculate range for pagination
        const start = Math.max(1, totalMessages - (page * limit) + 1);
        const end = Math.max(1, totalMessages - ((page - 1) * limit));

        if (start > end || totalMessages === 0) {
          imap.end();
          return resolve(res.json({
            success: true,
            emails: [],
            total: totalMessages,
            page,
            limit
          }));
        }

        const f = imap.seq.fetch(`${start}:${end}`, {
          bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
          struct: true,
          envelope: true
        });

        f.on('message', (msg, seqno) => {
          const emailData = { seqno };

          msg.on('body', (stream, info) => {
            let buffer = '';
            stream.on('data', chunk => buffer += chunk.toString('utf8'));
            stream.once('end', () => {
              const parsed = Imap.parseHeader(buffer);
              emailData.from = parsed.from ? parsed.from[0] : '';
              emailData.to = parsed.to ? parsed.to : [];
              emailData.subject = parsed.subject ? parsed.subject[0] : '(No subject)';
              emailData.date = parsed.date ? parsed.date[0] : new Date().toISOString();
            });
          });

          msg.once('attributes', (attrs) => {
            emailData.uid = attrs.uid;
            emailData.flags = attrs.flags;
          });

          msg.once('end', () => {
            emails.push({
              id: emailData.uid,
              uid: emailData.uid,
              from: parseEmailAddress(emailData.from),
              to: Array.isArray(emailData.to) ? emailData.to.map(parseEmailAddress) : [],
              subject: emailData.subject,
              date: new Date(emailData.date).toISOString(),
              flags: emailData.flags || [],
              folder: folder,
              preview: emailData.subject || ''
            });
          });
        });

        f.once('error', (err) => {
          imap.end();
          reject(err);
        });

        f.once('end', () => {
          imap.end();
          
          // Sort by date (newest first)
          emails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          resolve(res.json({
            success: true,
            emails,
            total: totalMessages,
            page,
            limit
          }));
        });
      });
    });

    imap.once('error', (err) => {
      reject(err);
    });

    imap.connect();
  });
}

async function readEmail(config, folder, uid, res) {
  return new Promise((resolve, reject) => {
    const imap = new Imap(config);

    imap.once('ready', () => {
      imap.openBox(folder, false, (err, box) => {
        if (err) {
          imap.end();
          return reject(err);
        }

        const f = imap.fetch(uid, { bodies: '', markSeen: true });
        let email = null;

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
                to: parsed.to ? parsed.to.value.map((t) => ({
                  name: t.name || '',
                  address: t.address
                })) : [],
                subject: parsed.subject || '(No subject)',
                date: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
                text: parsed.text || '',
                html: parsed.html || '',
                body: parsed.text || parsed.html || '',
                attachments: parsed.attachments ? parsed.attachments.map((a) => ({
                  filename: a.filename,
                  size: a.size,
                  contentType: a.contentType
                })) : [],
                folder: folder
              };
            });
          });

          msg.once('attributes', (attrs) => {
            if (email) email.flags = attrs.flags;
          });
        });

        f.once('error', (err) => {
          imap.end();
          reject(err);
        });

        f.once('end', () => {
          imap.end();
          
          if (!email) {
            return resolve(res.status(404).json({
              success: false,
              error: 'Email not found'
            }));
          }

          resolve(res.json({
            success: true,
            email
          }));
        });
      });
    });

    imap.once('error', (err) => {
      reject(err);
    });

    imap.connect();
  });
}

async function listFolders(config, res) {
  return new Promise((resolve, reject) => {
    const imap = new Imap(config);

    imap.once('ready', () => {
      imap.getBoxes((err, boxes) => {
        if (err) {
          imap.end();
          return reject(err);
        }

        const folders = parseFolders(boxes);
        imap.end();

        resolve(res.json({
          success: true,
          folders
        }));
      });
    });

    imap.once('error', (err) => {
      reject(err);
    });

    imap.connect();
  });
}

function parseFolders(boxes, parentPath = '', level = 0) {
  const folders = [];

  for (const [name, box] of Object.entries(boxes)) {
    const path = parentPath ? `${parentPath}/${name}` : name;
    
    folders.push({
      name,
      path,
      delimiter: box.delimiter || '/',
      flags: box.attribs || [],
      level,
      hasChildren: box.children ? Object.keys(box.children).length > 0 : false,
      specialUse: detectSpecialUse(name, box.attribs),
      unreadCount: 0,
      totalCount: 0
    });

    if (box.children) {
      folders.push(...parseFolders(box.children, path, level + 1));
    }
  }

  return folders;
}

function detectSpecialUse(name, attribs) {
  const lowerName = name.toLowerCase();
  
  if (lowerName === 'inbox') return 'inbox';
  if (lowerName === 'sent' || lowerName === 'gesendet') return 'sent';
  if (lowerName === 'drafts' || lowerName === 'entwürfe') return 'drafts';
  if (lowerName === 'trash' || lowerName === 'papierkorb') return 'trash';
  if (lowerName === 'spam' || lowerName === 'junk') return 'spam';
  
  return null;
}

function parseEmailAddress(addressStr) {
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