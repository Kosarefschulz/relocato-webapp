const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Email transporter
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

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ status: 'Email service is running' });
});

// Send email endpoint
app.post('/send-email', async (req, res) => {
  try {
    const { to, subject, html } = req.body;
    
    const info = await transporter.sendMail({
      from: 'RELOCATO® <bielefeld@relocato.de>',
      to: to || 'bielefeld@relocato.de',
      subject: subject || 'Test Email',
      html: html || '<h2>Test Email</h2>'
    });
    
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// IMAP test endpoint
app.get('/test-imap', async (req, res) => {
  const Imap = require('imap');
  
  const imap = new Imap({
    user: 'bielefeld@relocato.de',
    password: 'Bicm1308',
    host: 'imap.ionos.de',
    port: 993,
    tls: true,
    tlsOptions: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false
    },
    connTimeout: 10000
  });
  
  let responded = false;
  
  imap.once('ready', () => {
    if (!responded) {
      responded = true;
      imap.end();
      res.json({ success: true, message: 'IMAP connection successful' });
    }
  });
  
  imap.once('error', (err) => {
    if (!responded) {
      responded = true;
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  imap.connect();
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Email service running on port ${PORT}`);
});