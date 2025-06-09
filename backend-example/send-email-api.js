// BEISPIEL: Backend API für IONOS SMTP
// Diese Datei müsste auf Ihrem Server laufen (z.B. Node.js Express)

const nodemailer = require('nodemailer');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// IONOS SMTP Transporter erstellen
const createTransporter = (smtpConfig) => {
  return nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure, // true für Port 465, false für Port 587
    auth: {
      user: smtpConfig.auth.user,
      pass: smtpConfig.auth.pass
    },
    // IONOS spezifische Einstellungen
    tls: {
      rejectUnauthorized: false // Bei Zertifikatsproblemen
    }
  });
};

// E-Mail senden Endpunkt
app.post('/api/send-email', async (req, res) => {
  try {
    const { smtp, message } = req.body;
    
    // Transporter mit IONOS Daten erstellen
    const transporter = createTransporter(smtp);
    
    // Anhänge vorbereiten
    const attachments = message.attachments?.map(att => ({
      filename: att.filename,
      content: att.content,
      encoding: att.encoding || 'base64'
    })) || [];
    
    // E-Mail-Optionen
    const mailOptions = {
      from: message.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      attachments: attachments
    };
    
    // E-Mail senden
    const info = await transporter.sendMail(mailOptions);
    
    console.log('E-Mail gesendet:', info.messageId);
    res.json({ success: true, messageId: info.messageId });
    
  } catch (error) {
    console.error('E-Mail Fehler:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Server starten
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`E-Mail API läuft auf Port ${PORT}`);
});

/* 
INSTALLATION:
npm install express nodemailer cors

IONOS SMTP Einstellungen:
- Host: smtp.ionos.de
- Port: 587 (STARTTLS) oder 465 (SSL/TLS)
- Sicher: false für 587, true für 465
- Benutzer: Ihre vollständige E-Mail-Adresse
- Passwort: Ihr E-Mail-Passwort

VERWENDUNG in React:
const response = await fetch('http://ihr-server.de:3001/api/send-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});
*/