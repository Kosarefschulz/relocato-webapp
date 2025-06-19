// Email sending backend endpoint
const nodemailer = require('nodemailer');

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const emailUser = process.env.SMTP_USER || 'bielefeld@relocato.de';
  const emailPass = process.env.SMTP_PASS || 'Bicm1308';
  
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
  
  try {
    const { to, subject, html, text } = req.body;
    
    // Verify connection
    await transporter.verify();
    
    // Send email
    const info = await transporter.sendMail({
      from: `RELOCATO® <${emailUser}>`,
      to: to || emailUser,
      subject: subject || 'Test Email',
      text: text || 'Test email',
      html: html || '<p>Test email</p>'
    });
    
    res.json({
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack
    });
  }
}