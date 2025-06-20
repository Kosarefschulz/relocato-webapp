const Imap = require('imap');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // No auth check for now - we're using dummy auth

    const { id, folder = 'INBOX' } = req.method === 'GET' || req.method === 'DELETE' ? req.query : req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Email ID is required' });
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

    await deleteEmail(imapConfig, folder, id);
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in delete API:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

function deleteEmail(config, folderName, emailId) {
  return new Promise((resolve, reject) => {
    const imap = new Imap(config);

    imap.once('ready', () => {
      imap.openBox(folderName, false, (err, box) => {
        if (err) {
          imap.end();
          return reject(err);
        }

        // Mark as deleted
        imap.addFlags(emailId, ['\\Deleted'], (err) => {
          if (err) {
            imap.end();
            return reject(err);
          }

          // Expunge to actually delete
          imap.expunge((err) => {
            imap.end();
            
            if (err) {
              return reject(err);
            }
            
            resolve();
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