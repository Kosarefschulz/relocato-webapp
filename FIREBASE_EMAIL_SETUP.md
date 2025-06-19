# 🚀 Firebase Email Functions Setup

## Option A: Firebase Cloud Functions (Empfohlen)

### 1. Firebase Functions initialisieren
```bash
# Im Hauptverzeichnis des Projekts
firebase init functions

# Wählen Sie:
# - JavaScript
# - ESLint: Yes
# - Install dependencies: Yes
```

### 2. Email Function erstellen
Erstellen Sie `functions/emailService.js`:

```javascript
const functions = require('firebase-functions');
const nodemailer = require('nodemailer');
const cors = require('cors')({ origin: true });

// IONOS SMTP Configuration
const transporter = nodemailer.createTransporter({
  host: 'smtp.ionos.de',
  port: 587,
  secure: false,
  auth: {
    user: 'bielefeld@relocato.de',
    pass: 'Bicm1308'
  },
  tls: {
    rejectUnauthorized: false
  }
});

exports.sendEmail = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { to, subject, html, text } = req.body;
      
      const info = await transporter.sendMail({
        from: '"RELOCATO®" <bielefeld@relocato.de>',
        to,
        subject,
        text,
        html
      });
      
      res.json({
        success: true,
        messageId: info.messageId,
        provider: 'Firebase/IONOS'
      });
    } catch (error) {
      console.error('Email error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
});

// Email Client Functions
exports.syncEmailsForClient = functions.https.onCall(async (data, context) => {
  // Sync implementation
});

exports.getEmailFolders = functions.https.onCall(async (data, context) => {
  // Folders implementation
});
```

### 3. Dependencies installieren
```bash
cd functions
npm install nodemailer cors imap
```

### 4. Deploy
```bash
firebase deploy --only functions
```

## Option B: Brevo API Integration (Schnellste Lösung)

### 1. Brevo Account erstellen
- Gehen Sie zu: https://www.brevo.com
- Registrieren Sie sich kostenlos (keine Kreditkarte)
- Bestätigen Sie Ihre Email-Adresse

### 2. API Key generieren
- Dashboard → Settings → API Keys
- "Generate new API key" klicken
- Key kopieren

### 3. In Vercel hinzufügen
```bash
vercel env add BREVO_API_KEY
# Paste your API key when prompted
```

### 4. Frontend Update
Die Email-Services nutzen automatisch Brevo als Fallback!

## 📧 Test der Integration

1. **Öffnen Sie**: https://relocato-app.vercel.app/email-test
2. **Testen Sie die Endpoints**:
   - Simple API Test
   - Smart Email Service
   - Brevo Email API

## 🔍 Debugging

### Vercel Logs prüfen:
```bash
vercel logs --follow
```

### Environment Variables prüfen:
```bash
vercel env ls
```

### Deployment Protection prüfen:
1. Vercel Dashboard öffnen
2. Project Settings → Deployment Protection
3. "Vercel Authentication" deaktivieren

## 📊 Service Vergleich

| Lösung | Vorteile | Nachteile |
|--------|----------|-----------|
| Firebase Functions | Keine SMTP-Limits, Skalierbar | Setup dauert länger |
| Brevo API | 9000 Emails/Monat gratis, Sofort ready | API Key erforderlich |
| IONOS SMTP | Bereits konfiguriert | Funktioniert nicht auf Vercel |

## 🎯 Empfehlung

**Für sofortigen Start**: Brevo API
**Für Production**: Firebase Functions
**Für Tests**: Smart Email Service (probiert alle Optionen)

## Support

Bei Fragen: sergej.schulz@relocato.de