const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();

// CORS
app.use(cors({ origin: '*' }));
app.use(express.json());

// Email configuration
const emailUser = process.env.SMTP_USER || 'bielefeld@relocato.de';
const emailPass = process.env.SMTP_PASS || 'Bicm1308';

// SMTP Transporter
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

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'Relocato Email Backend',
    timestamp: new Date().toISOString()
  });
});

// Send email
app.post('/send-email', async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;
    
    await transporter.verify();
    
    const info = await transporter.sendMail({
      from: `RELOCATO® <${emailUser}>`,
      to: to || emailUser,
      subject: subject || 'Test Email',
      text: text || 'Test email content',
      html: html || '<p>Test email content</p>'
    });
    
    res.json({
      success: true,
      messageId: info.messageId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Email sync endpoint (returns mock data for now)
app.get('/sync-emails', (req, res) => {
  const { folder = 'INBOX', limit = 10 } = req.query;
  
  const mockEmails = [
    {
      uid: 1,
      from: 'kunde@example.com',
      to: emailUser,
      subject: 'Umzugsanfrage Berlin → Hamburg',
      date: new Date().toISOString(),
      preview: 'Sehr geehrte Damen und Herren, ich benötige ein Angebot für meinen Umzug...'
    },
    {
      uid: 2,
      from: 'info@partner.de',
      to: emailUser,
      subject: 'Kooperationsanfrage',
      date: new Date(Date.now() - 86400000).toISOString(),
      preview: 'Wir möchten gerne mit Ihnen zusammenarbeiten...'
    }
  ];
  
  res.json({
    success: true,
    emails: mockEmails.slice(0, parseInt(limit)),
    folder: folder,
    count: mockEmails.length
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Email backend running on port ${PORT}`);
});