const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');

// Umgebungsvariablen laden
dotenv.config();

const app = express();

// CORS konfigurieren für Ihre React-App - Erlaubt alle Vercel URLs
app.use(cors({
  origin: [
    'https://relocato.ruempel-schmiede.com',
    'https://ruempel-schmiede.com',
    'https://umzugs-webapp-jgns7q61s-sergej-schulzs-projects.vercel.app',
    'https://umzugs-webapp-1acwl6e1x-sergej-schulzs-projects.vercel.app',
    'http://localhost:3000',
    /\.vercel\.app$/  // Alle Vercel Preview URLs
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
}));

// JSON Body Parser mit größerem Limit für PDFs
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// IONOS SMTP Konfiguration
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.ionos.de',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465', // true für SSL, false für STARTTLS
  auth: {
    user: process.env.SMTP_USER, // Ihre vollständige IONOS E-Mail-Adresse
    pass: process.env.SMTP_PASS  // Ihr IONOS E-Mail-Passwort
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  }
};

// Nodemailer Transporter erstellen
let transporter;
try {
  transporter = nodemailer.createTransport(SMTP_CONFIG);
  
  // Verbindung testen
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ SMTP Verbindungsfehler:', error);
    } else {
      console.log('✅ SMTP Server ist bereit für E-Mails');
      console.log('📧 Von:', process.env.SMTP_FROM || SMTP_CONFIG.auth.user);
    }
  });
} catch (error) {
  console.error('❌ Fehler beim Erstellen des Transporters:', error);
}

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    smtp: transporter ? 'ready' : 'error',
    from: process.env.SMTP_FROM || process.env.SMTP_USER
  });
});

// E-Mail senden Endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, content, attachments, bcc } = req.body;
    
    if (!to || !subject || !content) {
      return res.status(400).json({ 
        success: false, 
        error: 'Fehlende Pflichtfelder: to, subject, content' 
      });
    }

    // E-Mail-Optionen vorbereiten
    const mailOptions = {
      from: `Relocato Umzugsservice <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      text: content,
      html: content.replace(/\n/g, '<br>'), // Einfache HTML-Konvertierung
      attachments: []
    };

    // BCC hinzufügen (für Gesendet-Ordner)
    if (bcc) {
      mailOptions.bcc = bcc;
      console.log('📋 BCC an:', bcc);
    }

    // PDF-Anhänge verarbeiten
    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        encoding: 'base64'
      }));
    }

    // E-Mail senden
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ E-Mail gesendet:', {
      messageId: info.messageId,
      to: to,
      subject: subject
    });

    res.json({ 
      success: true, 
      messageId: info.messageId,
      accepted: info.accepted
    });

  } catch (error) {
    console.error('❌ E-Mail Versand fehlgeschlagen:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// PDF-Download Endpoint für iOS-kompatible Downloads
app.post('/api/generate-pdf', async (req, res) => {
  try {
    const { html } = req.body;
    
    if (!html) {
      return res.status(400).json({ 
        success: false, 
        error: 'HTML content ist erforderlich' 
      });
    }

    // PDFShift API konfigurieren
    const PDFSHIFT_API_KEY = 'sk_14a4ecfc1ba71f54456ab30bf80897383eeb714e';
    const PDFSHIFT_API_URL = 'https://api.pdfshift.io/v3/convert/pdf';

    const options = {
      source: html,
      landscape: false,
      use_print: true,
      format: 'A4',
      margin: {
        top: '10mm',
        bottom: '10mm',
        left: '10mm',
        right: '10mm'
      }
    };

    const response = await axios.post(
      PDFSHIFT_API_URL,
      options,
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`api:${PDFSHIFT_API_KEY}`).toString('base64')}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );

    // Korrekte Headers für iOS PDF-Download setzen
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="Umzugsangebot.pdf"',
      'Content-Length': response.data.length,
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.send(Buffer.from(response.data));

  } catch (error) {
    console.error('❌ PDF-Generierung fehlgeschlagen:', error);
    res.status(500).json({ 
      success: false, 
      error: 'PDF-Generierung fehlgeschlagen',
      details: error.message
    });
  }
});

// Test-E-Mail Endpoint
app.post('/api/test-email', async (req, res) => {
  try {
    const testMail = {
      from: `RELOCATO® Test <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: req.body.to || process.env.SMTP_USER,
      subject: 'RELOCATO® Test-E-Mail',
      html: `
        <h2>RELOCATO® E-Mail-System Test</h2>
        <p>Diese Test-E-Mail wurde erfolgreich über IONOS SMTP gesendet!</p>
        <hr>
        <p><strong>Server-Informationen:</strong></p>
        <ul>
          <li>SMTP Host: ${SMTP_CONFIG.host}</li>
          <li>Port: ${SMTP_CONFIG.port}</li>
          <li>Von: ${process.env.SMTP_FROM || process.env.SMTP_USER}</li>
          <li>Zeit: ${new Date().toLocaleString('de-DE')}</li>
        </ul>
        <hr>
        <p>Mit freundlichen Grüßen<br>
        Ihr RELOCATO® Team</p>
      `
    };

    const info = await transporter.sendMail(testMail);
    
    res.json({ 
      success: true, 
      message: 'Test-E-Mail gesendet!',
      info: info
    });

  } catch (error) {
    console.error('❌ Test-E-Mail Fehler:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Fehlerbehandlung
app.use((err, req, res, next) => {
  console.error('Server Fehler:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Interner Serverfehler' 
  });
});

// Server starten
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 RELOCATO® E-Mail-Server läuft auf Port ${PORT}`);
  console.log(`📧 SMTP-Host: ${SMTP_CONFIG.host}`);
  console.log(`👤 SMTP-User: ${SMTP_CONFIG.auth.user || 'NICHT KONFIGURIERT'}`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM empfangen, Server wird heruntergefahren...');
  process.exit(0);
});