const Imap = require('imap');
const { simpleParser } = require('mailparser');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // No auth check for now - we're using dummy auth

    // Get parameters from query or body
    const params = req.method === 'POST' ? req.body : req.query;
    const { id, uid, folder = 'INBOX' } = params;
    
    const emailId = id || uid;
    if (!emailId) {
      return res.status(400).json({ error: 'Email ID or UID is required' });
    }

    // IMAP Configuration
    const imapConfig = {
      user: process.env.IONOS_EMAIL || 'bielefeld@relocato.de',
      password: process.env.IONOS_PASSWORD || 'Bicm1308',
      host: process.env.IONOS_IMAP_HOST || 'imap.ionos.de',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    };

    // Get email from IMAP
    const email = await getEmailFromIMAP(imapConfig, folder, emailId);
    
    return res.status(200).json({ email });
  } catch (error) {
    console.error('Error in read API:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

function getEmailFromIMAP(config, folderName, emailId) {
  return new Promise((resolve, reject) => {
    const imap = new Imap(config);

    imap.once('ready', () => {
      imap.openBox(folderName, false, (err, box) => {
        if (err) {
          imap.end();
          return reject(err);
        }

        // Try to fetch by UID first
        const fetch = imap.fetch(emailId, {
          bodies: '',
          markSeen: true
        });

        let emailFound = false;

        fetch.on('message', (msg, seqno) => {
          emailFound = true;
          
          msg.on('body', (stream, info) => {
            simpleParser(stream, (err, parsed) => {
              if (err) {
                imap.end();
                return reject(err);
              }

              const email = {
                id: emailId,
                messageId: parsed.messageId || '',
                subject: parsed.subject || '(No subject)',
                from: parsed.from ? {
                  name: parsed.from.text,
                  address: parsed.from.value[0]?.address || ''
                } : null,
                to: parsed.to ? parsed.to.value.map(addr => ({
                  name: addr.name || '',
                  address: addr.address
                })) : [],
                cc: parsed.cc ? parsed.cc.value.map(addr => ({
                  name: addr.name || '',
                  address: addr.address
                })) : [],
                bcc: parsed.bcc ? parsed.bcc.value.map(addr => ({
                  name: addr.name || '',
                  address: addr.address
                })) : [],
                date: parsed.date || new Date(),
                text: parsed.text || '',
                html: parsed.html || parsed.textAsHtml || '',
                attachments: parsed.attachments ? parsed.attachments.map(att => ({
                  filename: att.filename || 'attachment',
                  contentType: att.contentType,
                  size: att.size,
                  contentId: att.contentId,
                  content: att.content
                })) : [],
                headers: Object.fromEntries(parsed.headers || []),
                flags: [],
                folder: folderName
              };

              imap.end();
              resolve(email);
            });
          });

          msg.once('attributes', (attrs) => {
            // Store flags for later use
          });
        });

        fetch.once('error', (err) => {
          imap.end();
          reject(err);
        });

        fetch.once('end', () => {
          if (!emailFound) {
            imap.end();
            reject(new Error('Email not found'));
          }
        });
      });
    });

    imap.once('error', (err) => {
      reject(err);
    });

    imap.connect();
  });
}