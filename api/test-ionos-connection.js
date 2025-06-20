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

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🔍 Quick IONOS connection test...');

  const config = {
    user: 'bielefeld@relocato.de',
    password: 'Bicm1308',
    host: 'imap.ionos.de',
    port: 993,
    tls: true,
    tlsOptions: { 
      rejectUnauthorized: false
    },
    connTimeout: 5000,
    authTimeout: 5000
  };

  try {
    const connectionInfo = await new Promise((resolve, reject) => {
      const imap = new Imap(config);
      const timeout = setTimeout(() => {
        imap.end();
        reject(new Error('Connection timeout after 5 seconds'));
      }, 5000);
      
      imap.once('ready', () => {
        clearTimeout(timeout);
        console.log('✅ IMAP connected successfully');
        
        // Just check if we can open INBOX
        imap.openBox('INBOX', true, (err, box) => {
          if (err) {
            imap.end();
            reject(err);
            return;
          }
          
          const info = {
            connected: true,
            totalMessages: box.messages.total,
            recent: box.messages.recent,
            unseen: box.messages.unseen
          };
          
          imap.end();
          resolve(info);
        });
      });
      
      imap.once('error', (err) => {
        clearTimeout(timeout);
        console.error('❌ IMAP error:', err);
        reject(err);
      });
      
      imap.connect();
    });
    
    res.status(200).json({
      success: true,
      ...connectionInfo,
      message: 'IONOS IMAP connection successful',
      credentials: {
        host: config.host,
        port: config.port,
        user: config.user
      }
    });
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    res.status(200).json({
      success: false,
      error: error.message || 'Failed to connect to IONOS IMAP',
      suggestion: 'Check credentials and network connection',
      credentials: {
        host: config.host,
        port: config.port,
        user: config.user
      }
    });
  }
}