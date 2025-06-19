const nodemailer = require('nodemailer');

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('📧 Email Test Endpoint aufgerufen');
  console.log('Environment check:', {
    emailUser: process.env.VITE_EMAIL_USER ? 'vorhanden' : 'fehlt',
    emailPass: process.env.VITE_EMAIL_PASS ? 'vorhanden' : 'fehlt'
  });

  try {
    // IONOS SMTP Configuration mit Port 587 (STARTTLS)
    const transporter = nodemailer.createTransporter({
      host: 'smtp.ionos.de',
      port: 587,
      secure: false, // false für STARTTLS
      auth: {
        user: process.env.VITE_EMAIL_USER || 'bielefeld@relocato.de',
        pass: process.env.VITE_EMAIL_PASS || 'Bicm1308'
      },
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      },
      debug: true,
      logger: true
    });

    // Verify connection
    console.log('🔍 Verifiziere SMTP Verbindung...');
    await transporter.verify();
    console.log('✅ SMTP Verbindung erfolgreich');

    // Send test email
    const info = await transporter.sendMail({
      from: '"RELOCATO® WebApp" <bielefeld@relocato.de>',
      to: req.body.to || 'sergej.schulz@relocato.de',
      subject: `Test Email - ${new Date().toLocaleString('de-DE')}`,
      text: 'Dies ist eine Test-Email von der RELOCATO® WebApp',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>🚀 RELOCATO® Email System Test</h2>
          <p>Diese Email wurde erfolgreich über Vercel gesendet!</p>
          <hr>
          <p><strong>Zeitstempel:</strong> ${new Date().toLocaleString('de-DE')}</p>
          <p><strong>Server:</strong> Vercel Functions</p>
          <p><strong>SMTP:</strong> IONOS (Port 587)</p>
        </div>
      `
    });

    console.log('✅ Email erfolgreich gesendet:', info.messageId);

    return res.status(200).json({
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Email Fehler:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      details: {
        code: error.code,
        command: error.command,
        response: error.response
      }
    });
  }
}

// Vercel Configuration
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
  maxDuration: 30,
};