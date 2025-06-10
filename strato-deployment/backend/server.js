const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

// Umgebungsvariablen laden
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security & Performance Middleware
app.use(helmet({
  contentSecurityPolicy: false // Für PDF Generation
}));
app.use(compression());

// CORS für eigene Domain
app.use(cors({
  origin: [
    'https://relocato.ruempel-schmiede.com',
    'https://ruempel-schmiede.com',
    'http://localhost:3000' // Für Development
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
}));

// JSON Body Parser - Großes Limit für PDFs
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// IONOS SMTP Konfiguration
const createEmailTransporter = () => {
  return nodemailer.createTransport({
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
};

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'Strato Hosting',
    smtp: 'IONOS Ready',
    from: 'bielefeld@relocato.de',
    timestamp: new Date().toISOString()
  });
});

// E-Mail senden Endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, content, attachments = [] } = req.body;

    if (!to || !subject || !content) {
      return res.status(400).json({
        success: false,
        error: 'Fehlende Parameter: to, subject, content erforderlich'
      });
    }

    const transporter = createEmailTransporter();

    // E-Mail Optionen
    const mailOptions = {
      from: 'RELOCATO® Umzugsservice <bielefeld@relocato.de>',
      to: to,
      subject: subject,
      text: content,
      html: content.replace(/\n/g, '<br>'), // Einfache HTML-Konvertierung
      attachments: attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        encoding: att.encoding || 'base64'
      }))
    };

    console.log(`📧 Sende E-Mail von ${mailOptions.from} an ${to}`);
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ E-Mail erfolgreich gesendet:', info.messageId);
    
    res.json({
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ E-Mail Fehler:', error);
    
    res.status(500).json({
      success: false,
      error: 'E-Mail konnte nicht gesendet werden',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Test Endpoint für Strato
app.get('/api/test', async (req, res) => {
  try {
    const transporter = createEmailTransporter();
    
    const info = await transporter.sendMail({
      from: 'RELOCATO® <bielefeld@relocato.de>',
      to: 'sergej.schulz@relocato.de',
      subject: 'ERFOLG! RELOCATO® auf Strato online!',
      text: `🎉 PERFEKT! 

Ihre RELOCATO® Web-App läuft jetzt erfolgreich auf Strato!

✅ Server: Strato Hosting
✅ Domain: relocato.ruempel-schmiede.com  
✅ E-Mail: IONOS SMTP
✅ Backend: Node.js Express
✅ Status: Vollständig einsatzbereit

RELOCATO® Umzugsservice
Powered by Strato & Ruempel-Schmiede

🚀 System ist online und bereit für Angebote!`
    });

    res.json({
      success: true,
      message: 'Test-E-Mail gesendet',
      messageId: info.messageId
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Static Files (für Frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Fallback für React Router
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API Endpoint nicht gefunden' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error Handler
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({
    success: false,
    error: 'Interner Serverfehler'
  });
});

// Server starten
app.listen(PORT, () => {
  console.log(`🚀 RELOCATO® Backend läuft auf Port ${PORT}`);
  console.log(`📧 E-Mail: IONOS SMTP bereit`);
  console.log(`🌐 Domain: relocato.ruempel-schmiede.com`);
  console.log(`✅ Status: Bereit für Strato Deployment`);
});

module.exports = app;