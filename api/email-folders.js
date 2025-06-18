// Vercel Serverless Function für E-Mail-Ordner
// Diese Funktion holt die Ordnerstruktur vom IONOS IMAP Server

const Imap = require('imap');

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

  // Check authentication
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - missing or invalid authorization header'
    });
  }

  try {
    // Verify the ID token
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log(`📁 Fetching email folders for user: ${decodedToken.uid}`);

    const folders = await fetchFoldersFromIONOS();
    
    res.status(200).json({
      success: true,
      folders: folders
    });
  } catch (error) {
    console.error('Email folders error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

/**
 * Fetch folder list from IONOS IMAP
 */
async function fetchFoldersFromIONOS() {
  return new Promise((resolve, reject) => {
    const folders = [];
    
    const imap = new Imap({
      user: process.env.IONOS_EMAIL_USER || 'bielefeld@relocato.de',
      password: process.env.IONOS_EMAIL_PASS,
      host: 'imap.ionos.de',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });

    imap.once('ready', () => {
      imap.getBoxes((err, boxes) => {
        if (err) {
          console.error('Error getting folders:', err);
          imap.end();
          reject(err);
          return;
        }

        // Parse folder structure
        const parseFolders = (obj, parent = '') => {
          for (const [name, box] of Object.entries(obj)) {
            if (name !== 'attribs' && name !== 'delimiter' && name !== 'children') {
              const fullPath = parent ? `${parent}${box.delimiter}${name}` : name;
              folders.push({
                name: name,
                path: fullPath,
                hasChildren: !!box.children
              });
              
              if (box.children) {
                parseFolders(box.children, fullPath);
              }
            }
          }
        };

        parseFolders(boxes);
        imap.end();
      });
    });

    imap.once('error', (err) => {
      console.error('IMAP error:', err);
      reject(err);
    });

    imap.once('end', () => {
      resolve(folders);
    });

    imap.connect();
  });
}