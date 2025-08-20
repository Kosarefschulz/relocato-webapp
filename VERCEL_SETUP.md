# Vercel Setup für Relocato Web App

## Environment Variables

Die folgenden Environment Variables müssen im Vercel Dashboard gesetzt werden:

### Firebase Configuration (Pflicht)
```
REACT_APP_FIREBASE_API_KEY=AIzaSyDCeOBZw96klWFkolRQMnhr5DG4Ol2eMjY
REACT_APP_FIREBASE_AUTH_DOMAIN=umzugsapp.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=umzugsapp
REACT_APP_FIREBASE_STORAGE_BUCKET=umzugsapp.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=130199132038
REACT_APP_FIREBASE_APP_ID=1:130199132038:web:3be72ffeb2b1f55be93e07
REACT_APP_FIREBASE_MEASUREMENT_ID=G-MQWV0M47PN
```

### Email Configuration (für E-Mail-Client)
```
REACT_APP_IMAP_SERVER=mail.ionos.de
REACT_APP_IMAP_PORT=993
REACT_APP_SMTP_SERVER=mail.ionos.de
REACT_APP_SMTP_PORT=465
REACT_APP_EMAIL_USERNAME=[bielefeld@relocato.de]
REACT_APP_EMAIL_PASSWORD=[Bicm1308]
```

### Google Services (Optional)
```
REACT_APP_GOOGLE_SHEETS_API_KEY=[dein-google-sheets-api-key]
REACT_APP_GOOGLE_SHEETS_ID=[deine-spreadsheet-id]
REACT_APP_SENDGRID_API_KEY=[dein-sendgrid-api-key]
REACT_APP_SENDGRID_FROM_EMAIL=[deine-email@company.com]
```

### Backend Configuration
```
REACT_APP_BACKEND_URL=https://europe-west1-umzugsapp.cloudfunctions.net/backendApi
```

## Schritte zum Einrichten:

1. **Gehe zu deinem Vercel Dashboard**
   - https://vercel.com/dashboard

2. **Wähle dein Projekt aus**
   - Klicke auf "relocato-webapp" oder wie dein Projekt heißt

3. **Gehe zu Settings → Environment Variables**

4. **Füge jede Variable einzeln hinzu:**
   - Name: Variable name (z.B. REACT_APP_FIREBASE_API_KEY)
   - Value: Der entsprechende Wert
   - Environment: Production, Preview, Development (alle auswählen)

5. **Speichere die Änderungen**

6. **Trigger einen neuen Deploy**
   - Entweder durch einen Git Push oder manuell im Dashboard

## CORS Configuration für Firebase Functions

Falls die Firebase Functions weiterhin CORS-Fehler zeigen, musst du im Firebase Functions Code folgendes hinzufügen:

```javascript
const cors = require('cors')({
  origin: [
    'https://relocato.ruempel-schmiede.com',
    'https://*.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true
});

exports.syncEmailsForClient = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    // Dein Code hier
  });
```

## Alternative: Vercel Serverless Functions

Falls Firebase Functions nicht funktionieren, nutzt die App automatisch die Vercel Serverless Functions als Fallback. Diese sind bereits in `/api/email-sync.js` konfiguriert.

## Testen

Nach dem Setup kannst du testen:
1. Gehe zu https://relocato.ruempel-schmiede.com/email-client
2. Die E-Mail-Synchronisation sollte ohne CORS-Fehler funktionieren
3. Check die Browser Console für detaillierte Logs

## Troubleshooting

- **403 Forbidden**: Prüfe ob alle Environment Variables korrekt gesetzt sind
- **CORS Errors**: Die vercel.json sollte die CORS Headers richtig setzen
- **Firebase Auth Errors**: Stelle sicher, dass die Firebase API Keys korrekt sind