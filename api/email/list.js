const Imap = require('imap');
const { simpleParser } = require('mailparser');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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
    const { folder = 'INBOX', page = 1, limit = 50, search } = params;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // IMAP Configuration
    const imapConfig = {
      user: process.env.IONOS_EMAIL || 'bielefeld@relocato.de',
      password: process.env.IONOS_PASSWORD || 'Bicm1308',
      host: process.env.IONOS_IMAP_HOST || 'imap.ionos.de',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    };

    // Get emails from IMAP
    const result = await getEmailsFromIMAP(imapConfig, folder, pageNum, limitNum, search);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in list API:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

function getEmailsFromIMAP(config, folderName, page, limit, searchQuery) {
  return new Promise((resolve, reject) => {
    const imap = new Imap(config);
    const emails = [];

    imap.once('ready', () => {
      imap.openBox(folderName, false, (err, box) => {
        if (err) {
          imap.end();
          return reject(err);
        }

        const totalMessages = box.messages.total;
        
        // Calculate range for pagination
        const start = Math.max(1, totalMessages - (page * limit) + 1);
        const end = Math.max(1, totalMessages - ((page - 1) * limit));

        if (start > totalMessages) {
          imap.end();
          return resolve({ emails: [], total: totalMessages, page, limit });
        }

        // Build search criteria
        let searchCriteria = ['ALL'];
        if (searchQuery) {
          searchCriteria = [
            ['OR',
              ['SUBJECT', searchQuery],
              ['FROM', searchQuery],
              ['TO', searchQuery],
              ['BODY', searchQuery]
            ]
          ];
        }

        imap.search(searchCriteria, (err, results) => {
          if (err) {
            imap.end();
            return reject(err);
          }

          if (results.length === 0) {
            imap.end();
            return resolve({ emails: [], total: 0, page, limit });
          }

          // Sort results and paginate
          results.sort((a, b) => b - a); // Newest first
          const paginatedResults = results.slice((page - 1) * limit, page * limit);

          const fetch = imap.fetch(paginatedResults, {
            bodies: 'HEADER.FIELDS (FROM TO CC SUBJECT DATE MESSAGE-ID)',
            struct: true,
            envelope: true
          });

          fetch.on('message', (msg, seqno) => {
            const emailData = {
              id: seqno.toString(),
              seqno: seqno,
              flags: []
            };

            msg.on('body', (stream, info) => {
              let buffer = '';
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
              stream.once('end', () => {
                const headers = Imap.parseHeader(buffer);
                emailData.headers = headers;
              });
            });

            msg.once('attributes', (attrs) => {
              emailData.flags = attrs.flags;
              emailData.date = attrs.date;
              emailData.uid = attrs.uid;
              emailData.size = attrs.size;
            });

            msg.once('end', () => {
              // Parse email data
              const email = {
                id: emailData.uid?.toString() || emailData.id,
                messageId: emailData.headers?.['message-id']?.[0] || '',
                subject: emailData.headers?.subject?.[0] || '(No subject)',
                from: parseAddress(emailData.headers?.from?.[0]),
                to: parseAddressList(emailData.headers?.to?.[0]),
                cc: parseAddressList(emailData.headers?.cc?.[0]),
                date: emailData.date || new Date(),
                flags: emailData.flags || [],
                size: emailData.size || 0,
                snippet: '', // Will be filled when reading full email
                folder: folderName
              };

              emails.push(email);
            });
          });

          fetch.once('error', (err) => {
            imap.end();
            reject(err);
          });

          fetch.once('end', () => {
            imap.end();
            resolve({
              emails: emails.sort((a, b) => new Date(b.date) - new Date(a.date)),
              total: results.length,
              page,
              limit
            });
          });
        });
      });
    });

    imap.once('error', (err) => {
      reject(err);
    });

    imap.connect();
  });
}

function parseAddress(addressStr) {
  if (!addressStr) return null;
  
  const match = addressStr.match(/(?:"?([^"]*)"?\s)?(?:<?(.+@.+)>?)/);
  if (match) {
    return {
      name: match[1] || '',
      address: match[2] || addressStr
    };
  }
  
  return { name: '', address: addressStr };
}

function parseAddressList(addressStr) {
  if (!addressStr) return [];
  
  return addressStr.split(',').map(addr => parseAddress(addr.trim())).filter(Boolean);
}