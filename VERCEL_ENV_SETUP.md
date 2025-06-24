# Vercel Environment Variables Setup

## Wichtig: Diese Variablen müssen in Vercel konfiguriert werden!

Die `.env.local` Datei wird NICHT auf Vercel deployed. Sie müssen alle Umgebungsvariablen manuell in Vercel setzen.

## So geht's:

1. Gehen Sie zu: https://vercel.com/dashboard
2. Wählen Sie Ihr Projekt "relocato-webapp"
3. Klicken Sie auf "Settings"
4. Navigieren Sie zu "Environment Variables"
5. Fügen Sie folgende Variablen hinzu:

### Firebase Konfiguration
```
REACT_APP_FIREBASE_API_KEY=AIzaSyDCeOBZw96klWFkolRQMnhr5DG4Ol2eMjY
REACT_APP_FIREBASE_AUTH_DOMAIN=umzugsapp.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=umzugsapp
REACT_APP_FIREBASE_STORAGE_BUCKET=umzugsapp.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=130199132038
REACT_APP_FIREBASE_APP_ID=1:130199132038:web:3be72ffeb2b1f55be93e07
REACT_APP_FIREBASE_MEASUREMENT_ID=G-MQWV0M47PN
```

### Google Sheets API
```
REACT_APP_GOOGLE_SHEETS_ID=178tpFCNqmnDZxkzOfgWQCS6BW7wn2rYyTB3hZh8H7PU
REACT_APP_GOOGLE_SHEETS_API_KEY=AIzaSyDCeOBZw96klWFkolRQMnhr5DG4Ol2eMjY
```

### OpenAI API
```
REACT_APP_OPENAI_API_KEY=[Ihren OpenAI API Key hier einfügen]
```
**Hinweis**: Den API Key finden Sie in der lokalen `.env.local` Datei

### SMTP Configuration
```
REACT_APP_SMTP_FROM=bielefeld@relocato.de
SMTP_FROM=bielefeld@relocato.de
SMTP_HOST=smtp.ionos.de
SMTP_PASS=Bicm1308
SMTP_PORT=587
SMTP_USER=bielefeld@relocato.de
```

### API URL
```
REACT_APP_API_URL=https://relocato-webapp-83zh.vercel.app
```

## Wichtige Hinweise:

1. **Für alle Environments**: Setzen Sie die Variablen für "Production", "Preview" und "Development"
2. **Nach dem Hinzufügen**: Triggern Sie ein neues Deployment
3. **Sicherheit**: Der OpenAI API Key sollte eigentlich auf dem Backend sein, nicht im Frontend!

## Deployment neu starten:

Nach dem Hinzufügen der Variablen:
1. Gehen Sie zu "Deployments"
2. Klicken Sie auf die drei Punkte beim letzten Deployment
3. Wählen Sie "Redeploy"

## Debugging:

Um zu prüfen, ob die Variablen geladen werden, können Sie in der Browser-Konsole eingeben:
```javascript
console.log({
  sheetsId: process.env.REACT_APP_GOOGLE_SHEETS_ID,
  sheetsApiKey: process.env.REACT_APP_GOOGLE_SHEETS_API_KEY ? 'SET' : 'MISSING',
  openaiKey: process.env.REACT_APP_OPENAI_API_KEY ? 'SET' : 'MISSING'
})
```