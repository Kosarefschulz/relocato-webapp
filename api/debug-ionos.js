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

  // Debug information
  const debugInfo = {
    environment: process.env.NODE_ENV,
    hasSmtpUser: !!process.env.SMTP_USER,
    hasSmtpPass: !!process.env.SMTP_PASS,
    hasIonosUser: !!process.env.IONOS_EMAIL_USER,
    hasIonosPass: !!process.env.IONOS_EMAIL_PASS,
    smtpUser: process.env.SMTP_USER || 'not set',
    ionosUser: process.env.IONOS_EMAIL_USER || 'not set',
    smtpHost: process.env.SMTP_HOST || 'not set',
    vercelUrl: process.env.VERCEL_URL || 'not set',
    region: process.env.VERCEL_REGION || 'not set'
  };

  // Test basic connectivity
  const net = require('net');
  const tls = require('tls');
  
  const connectivityTests = [];

  // Test IMAP connectivity
  const imapTest = new Promise((resolve) => {
    const socket = tls.connect({
      host: 'imap.ionos.de',
      port: 993,
      timeout: 5000,
      rejectUnauthorized: false
    }, () => {
      socket.end();
      resolve({ imap: 'Connected successfully to IMAP port 993' });
    });
    
    socket.on('error', (err) => {
      resolve({ imap: `Failed to connect: ${err.message}` });
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ imap: 'Connection timeout' });
    });
  });

  // Test SMTP connectivity  
  const smtpTest = new Promise((resolve) => {
    const socket = net.connect({
      host: 'smtp.ionos.de',
      port: 587,
      timeout: 5000
    }, () => {
      socket.end();
      resolve({ smtp: 'Connected successfully to SMTP port 587' });
    });
    
    socket.on('error', (err) => {
      resolve({ smtp: `Failed to connect: ${err.message}` });
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ smtp: 'Connection timeout' });
    });
  });

  connectivityTests.push(imapTest, smtpTest);
  
  const results = await Promise.all(connectivityTests);
  const connectivity = Object.assign({}, ...results);

  res.status(200).json({
    debugInfo,
    connectivity,
    suggestion: 'Check if environment variables are properly set in Vercel dashboard'
  });
}