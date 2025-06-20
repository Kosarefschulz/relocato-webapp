const nodemailer = require('nodemailer');

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

  console.log('📧 Testing IONOS SMTP connection...');

  const { to, subject, text } = req.body;
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.ionos.de',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'bielefeld@relocato.de',
      pass: 'Bicm1308'
    },
    tls: {
      rejectUnauthorized: false,
      ciphers: 'SSLv3'
    },
    debug: true,
    logger: true
  });

  try {
    // First verify connection
    console.log('🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    // Send test email
    const mailOptions = {
      from: '"Relocato Bielefeld" <bielefeld@relocato.de>',
      to: to || 'bielefeld@relocato.de',
      subject: subject || 'IONOS SMTP Test',
      text: text || 'Dies ist eine Test-E-Mail von der Relocato WebApp.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>IONOS SMTP Test</h2>
          <p>${text || 'Dies ist eine Test-E-Mail von der Relocato WebApp.'}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            Gesendet am: ${new Date().toLocaleString('de-DE')}<br>
            Von: Relocato WebApp
          </p>
        </div>
      `
    };

    console.log('📨 Sending test email to:', mailOptions.to);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);

    res.status(200).json({
      success: true,
      messageId: info.messageId,
      to: mailOptions.to,
      from: mailOptions.from,
      accepted: info.accepted,
      rejected: info.rejected,
      message: 'Email successfully sent via IONOS SMTP'
    });

  } catch (error) {
    console.error('❌ SMTP test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send email via IONOS SMTP',
      details: {
        host: 'smtp.ionos.de',
        port: 587,
        user: 'bielefeld@relocato.de',
        errorCode: error.code || 'UNKNOWN',
        command: error.command || null,
        response: error.response || null
      }
    });
  }
}