const express = require('express');
const nodemailer = require('nodemailer');

const app = express();

// Einfaches CORS - erlaubt alles
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-Requested-With, Accept');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json({ limit: '50mb' }));

// IONOS SMTP Transporter
const transporter = nodemailer.createTransporter({
  host: 'smtp.ionos.de',
  port: 587,
  secure: false,
  auth: {
    user: 'bielefeld@relocato.de',
    pass: 'Bicm1308'
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', smtp: 'ready', from: 'bielefeld@relocato.de' });
});

// E-Mail senden
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, content, attachments = [] } = req.body;

    const mailOptions = {
      from: 'RELOCATO® <bielefeld@relocato.de>',
      to: to,
      subject: subject,
      text: content,
      attachments: attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        encoding: att.encoding || 'base64'
      }))
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ E-Mail gesendet:', info.messageId);
    
    res.json({ 
      success: true, 
      messageId: info.messageId,
      accepted: info.accepted
    });

  } catch (error) {
    console.error('❌ E-Mail Fehler:', error);
    res.status(500).json({ success: false, error: 'Interner Serverfehler' });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`🚀 Simple Backend läuft auf Port ${port}`);
});

module.exports = app;