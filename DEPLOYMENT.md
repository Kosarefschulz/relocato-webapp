# Deployment Anleitung

## 🚀 Schnell-Deployment

### Demo-Version deployen:
```bash
npm run deploy:demo
```

### Firebase Auth Version deployen:
```bash
npm run deploy:firebase
```

### Responsive Version deployen:
```bash
npm run deploy:responsive
```

## 📋 Schritt-für-Schritt Deployment

### 1. Vorbereitung

#### Firebase CLI installieren:
```bash
npm install -g firebase-tools
```

#### Firebase Login:
```bash
firebase login
```

#### Firebase Projekt erstellen:
```bash
firebase init hosting
```

**Einstellungen:**
- **Public directory**: `build`
- **Single-page app**: `Yes`
- **Overwite index.html**: `No`

### 2. Umgebung konfigurieren

#### .env Datei erstellen:
```bash
cp .env.example .env
```

#### Umgebungsvariablen setzen:
```env
# Firebase (für Authentication)
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# SendGrid (für Email-Versand)
REACT_APP_SENDGRID_API_KEY=your_sendgrid_key
REACT_APP_SENDGRID_FROM_EMAIL=your_email@domain.com

# Google Sheets (für Datenspeicherung)
REACT_APP_GOOGLE_SHEETS_API_KEY=your_sheets_key
REACT_APP_GOOGLE_SHEETS_ID=your_spreadsheet_id
```

### 3. Build und Test

#### Manueller Build:
```bash
npm run build:test
```

#### Automatischer Build + Deploy:
```bash
npm run deploy
```

### 4. Deployment-Modi

#### Demo-Modus (ohne APIs):
- Beliebiger Login
- Mock-Daten
- PDF-Generierung funktioniert
- Email wird simuliert

#### Firebase-Modus (mit Auth):
- Echter Login mit Firebase
- Benutzer-Management
- Sichere Authentication

#### Responsive-Modus:
- Mobile-optimierte UI
- Touch-freundliche Navigation
- PWA-Features

## 🌐 Produktions-Setup

### Custom Domain konfigurieren:

1. **Firebase Console** → **Hosting** → **Add custom domain**
2. DNS-Einträge setzen:
   ```
   A Record: @ → Firebase IP
   CNAME: www → your-project.web.app
   ```

### SSL-Zertifikat:
- Automatisch von Firebase bereitgestellt
- Keine manuelle Konfiguration nötig

### Performance Optimierung:

#### Caching Headers (bereits in firebase.json):
```json
{
  "headers": [
    {
      "source": "/static/**",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

#### Compression:
- Automatisch von Firebase aktiviert
- Gzip/Brotli für alle Dateien

### PWA-Features aktivieren:

#### Service Worker:
```bash
# In public/sw.js
self.addEventListener('install', function(event) {
  // Cache critical resources
});
```

#### App Installation:
- Add to Home Screen prompt
- Standalone App Experience
- Offline-Funktionalität

## 📊 Monitoring und Analytics

### Firebase Analytics hinzufügen:
```javascript
import { getAnalytics } from "firebase/analytics";
const analytics = getAnalytics(app);
```

### Performance Monitoring:
```javascript
import { getPerformance } from "firebase/performance";
const perf = getPerformance(app);
```

### Error Tracking:
```bash
npm install @sentry/react
```

## 🔒 Sicherheit

### Environment Variables:
- **Nie** private Keys in den Code
- Alle Secrets in `.env`
- `.env` in `.gitignore`

### Firebase Security Rules:
```javascript
// Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### HTTPS:
- Automatisch von Firebase erzwungen
- Alle HTTP-Requests werden umgeleitet

## 🚀 CI/CD Pipeline (Optional)

### GitHub Actions:
```yaml
# .github/workflows/deploy.yml
name: Deploy to Firebase
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Firebase
        run: |
          npm install
          npm run build:test
          npx firebase deploy --token ${{ secrets.FIREBASE_TOKEN }}
```

## 📱 Mobile App (PWA)

### Installation auf Mobile:
1. Website im Browser öffnen
2. "Add to Home Screen" tippen
3. App wird wie native App installiert

### App Store Submission (optional):
```bash
# Mit PWABuilder oder Capacitor
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add ios
npx cap add android
```

## 🔧 Troubleshooting

### Build Fehler:
```bash
# Dependencies neu installieren
rm -rf node_modules package-lock.json
npm install
```

### Deployment Fehler:
```bash
# Firebase neu initialisieren
firebase logout
firebase login
firebase init hosting
```

### Performance Issues:
```bash
# Bundle Analyzer
npm install -g source-map-explorer
npm run build
npx source-map-explorer build/static/js/*.js
```

## 📈 Nach dem Deployment

### Checklist:
- [ ] App auf verschiedenen Geräten testen
- [ ] Performance mit Lighthouse prüfen
- [ ] SEO-Score optimieren
- [ ] Accessibility testen
- [ ] Error-Monitoring einrichten
- [ ] Analytics konfigurieren
- [ ] Backup-Strategie planen

### URLs:
- **Live App**: https://your-project.web.app
- **Firebase Console**: https://console.firebase.google.com
- **Analytics**: Firebase Console → Analytics

### Support:
- **Firebase Docs**: https://firebase.google.com/docs
- **React Docs**: https://react.dev
- **Material-UI**: https://mui.com