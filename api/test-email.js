// Schneller E-Mail Test Endpunkt
const nodemailer = require('nodemailer');

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const emailUser = process.env.IONOS_EMAIL_USER || process.env.REACT_APP_EMAIL_USERNAME || process.env.SMTP_USER;
  const emailPass = process.env.IONOS_EMAIL_PASS || process.env.REACT_APP_EMAIL_PASSWORD || process.env.SMTP_PASS;

  // Test 1: Check Environment Variables
  if (req.method === 'GET' && req.query.check === 'env') {
    return res.json({
      hasUser: !!emailUser,
      hasPass: !!emailPass,
      user: emailUser ? emailUser.substring(0, 5) + '***' : 'NOT SET',
      envKeys: Object.keys(process.env).filter(k => k.includes('EMAIL') || k.includes('SMTP') || k.includes('IONOS')).sort()
    });
  }

  // Test 2: Send Test Email
  if (req.method === 'POST' || (req.method === 'GET' && req.query.action === 'send')) {
    try {
      const transporter = nodemailer.createTransporter({
        host: 'smtp.ionos.de',
        port: 587,
        secure: false,
        auth: {
          user: emailUser,
          pass: emailPass
        },
        tls: {
          ciphers: 'SSLv3',
          rejectUnauthorized: false
        }
      });

      // Verify connection
      await transporter.verify();

      // Send email
      const info = await transporter.sendMail({
        from: `RELOCATO® <${emailUser}>`,
        to: emailUser, // Send to self
        subject: `Test Email - ${new Date().toLocaleString('de-DE')}`,
        text: 'Email system is working!',
        html: `
          <h2>✅ RELOCATO® Email System Working!</h2>
          <p>Time: ${new Date().toLocaleString('de-DE')}</p>
          <p>This is an automated test email.</p>
        `
      });

      return res.json({
        success: true,
        messageId: info.messageId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        details: error.stack
      });
    }
  }

  // Test 3: Quick IMAP Check
  if (req.method === 'GET' && req.query.action === 'check-imap') {
    const Imap = require('imap');
    
    return new Promise((resolve) => {
      const imap = new Imap({
        user: emailUser,
        password: emailPass,
        host: 'imap.ionos.de',
        port: 993,
        tls: true,
        tlsOptions: { 
          ciphers: 'SSLv3',
          rejectUnauthorized: false
        },
        connTimeout: 10000
      });

      const timeout = setTimeout(() => {
        imap.destroy();
        res.status(504).json({ success: false, error: 'IMAP connection timeout' });
        resolve();
      }, 9000);

      imap.once('ready', () => {
        clearTimeout(timeout);
        imap.end();
        res.json({ success: true, message: 'IMAP connection successful' });
        resolve();
      });

      imap.once('error', (err) => {
        clearTimeout(timeout);
        res.status(500).json({ success: false, error: err.message });
        resolve();
      });

      imap.connect();
    });
  }

  // Default response
  res.json({
    endpoints: [
      'GET /api/test-email?check=env - Check environment variables',
      'GET /api/test-email?action=send - Send test email',
      'GET /api/test-email?action=check-imap - Test IMAP connection'
    ]
  });
}