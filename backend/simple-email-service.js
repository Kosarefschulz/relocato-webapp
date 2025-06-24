const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();
const app = express();

app.use(cors());
app.use(express.json());

// Email transporter
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.ionos.de',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
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
      from: `RELOCATO® <${process.env.SMTP_USER}>`,
      to: to || process.env.SMTP_USER,
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
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASS,
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