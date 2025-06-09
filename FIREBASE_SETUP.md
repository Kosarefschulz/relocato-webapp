# Firebase Authentication Setup

## 1. Firebase Projekt erstellen

1. Gehe zu [Firebase Console](https://console.firebase.google.com)
2. Klicke **"Projekt hinzufügen"**
3. Gib einen Projektnamen ein (z.B. "umzugs-angebote")
4. Google Analytics optional aktivieren
5. Projekt erstellen

## 2. Web-App hinzufügen

1. Klicke auf **"</>"** (Web-App hinzufügen)
2. App-Name eingeben (z.B. "Umzugs WebApp")
3. Firebase Hosting optional aktivieren
4. **Wichtig**: Kopiere die Konfigurationsdaten!

## 3. Authentication aktivieren

1. Gehe zu **"Authentication"** → **"Get started"**
2. Tab **"Sign-in method"**
3. **"Email/Password"** aktivieren
4. **"Email/Password"** aktivieren (erste Option)
5. Speichern

## 4. Umgebungsvariablen konfigurieren

Bearbeite die `.env` Datei mit deinen Firebase-Daten:

```env
REACT_APP_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXX
REACT_APP_FIREBASE_AUTH_DOMAIN=dein-projekt.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=dein-projekt-id
REACT_APP_FIREBASE_STORAGE_BUCKET=dein-projekt.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789012
REACT_APP_FIREBASE_APP_ID=1:123456789012:web:xxxxxxxxxxxxx
```

## 5. Zu Firebase Auth wechseln

```bash
node switch-to-firebase.js
npm start
```

## 6. Test-Benutzer anlegen

### Option A: Über Firebase Console
1. Authentication → Users → **"Add user"**
2. Email und Passwort eingeben
3. Benutzer erstellen

### Option B: Über App-Registrierung
1. App starten
2. "Registrieren" Feature hinzufügen (optional)
3. Oder ersten Benutzer manuell in Console anlegen

## 7. Sicherheitsregeln (optional)

### Firestore Regeln:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Storage Regeln:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 8. Produktionssetup

### Domain-Autorisierung:
1. Authentication → Settings → **"Authorized domains"**
2. Produktionsdomain hinzufügen

### API-Key Einschränkungen:
1. Google Cloud Console → Credentials
2. API-Key auswählen → **"Application restrictions"**
3. HTTP-Referrer einschränken

## Modi wechseln

**Demo-Modus (ohne Firebase):**
```bash
node switch-to-demo.js
npm start
```

**Firebase-Modus (echte Auth):**
```bash
node switch-to-firebase.js
npm start
```

## Troubleshooting

**"Firebase not configured"**: .env Datei prüfen
**"Auth domain not authorized"**: Domain in Firebase Console autorisieren
**"User not found"**: Test-Benutzer in Console anlegen
**"Permission denied"**: Authentication Rules prüfen

## Deployment

Für Firebase Hosting:
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## Kosten

Firebase Authentication:
- Bis 50.000 MAU kostenlos
- Danach $0.0055 pro MAU
- Telefon-Auth: $0.006 pro Verifikation