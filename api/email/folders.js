const Imap = require('imap');

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

    // IMAP Configuration
    const imapConfig = {
      user: process.env.IONOS_EMAIL || 'bielefeld@relocato.de',
      password: process.env.IONOS_PASSWORD || 'Bicm1308',
      host: process.env.IONOS_IMAP_HOST || 'imap.ionos.de',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    };

    // Get folders from IMAP
    const folders = await getFoldersFromIMAP(imapConfig);
    
    return res.status(200).json({ folders });
  } catch (error) {
    console.error('Error in folders API:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

function getFoldersFromIMAP(config) {
  return new Promise((resolve, reject) => {
    const imap = new Imap(config);
    const folders = [];

    imap.once('ready', () => {
      imap.getBoxes((err, boxes) => {
        if (err) {
          imap.end();
          return reject(err);
        }

        // Parse folder structure
        const parseFolders = (boxList, parentPath = '') => {
          for (const [name, box] of Object.entries(boxList)) {
            const path = parentPath ? `${parentPath}${box.delimiter}${name}` : name;
            
            folders.push({
              name: name,
              path: path,
              delimiter: box.delimiter,
              children: box.children ? Object.keys(box.children) : [],
              flags: box.attribs || [],
              specialUse: getSpecialUse(name, box.attribs),
              hasChildren: !!box.children,
              level: parentPath.split(box.delimiter).length - 1
            });

            if (box.children) {
              parseFolders(box.children, path);
            }
          }
        };

        parseFolders(boxes);
        imap.end();
        resolve(folders);
      });
    });

    imap.once('error', (err) => {
      reject(err);
    });

    imap.connect();
  });
}

function getSpecialUse(name, attribs = []) {
  const lowerName = name.toLowerCase();
  
  if (lowerName === 'inbox') return 'inbox';
  if (lowerName.includes('sent') || lowerName.includes('gesendet')) return 'sent';
  if (lowerName.includes('draft') || lowerName.includes('entwurf')) return 'drafts';
  if (lowerName.includes('trash') || lowerName.includes('papierkorb')) return 'trash';
  if (lowerName.includes('spam') || lowerName.includes('junk')) return 'spam';
  if (lowerName.includes('archive') || lowerName.includes('archiv')) return 'archive';
  
  return null;
}