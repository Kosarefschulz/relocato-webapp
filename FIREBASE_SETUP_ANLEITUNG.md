# Firebase Setup Anleitung für Relocato

## 🔧 Was Sie in der Firebase Console aktivieren müssen:

### 1. Firestore Database aktivieren
1. Gehen Sie zu: https://console.firebase.google.com/u/0/project/umzugsapp/firestore
2. Klicken Sie auf "Datenbank erstellen"
3. Wählen Sie "Produktionsmodus"
4. Wählen Sie als Region: `europe-west3 (Frankfurt)`
5. Klicken Sie auf "Aktivieren"

### 2. Storage aktivieren
1. Gehen Sie zu: https://console.firebase.google.com/u/0/project/umzugsapp/storage
2. Klicken Sie auf "Jetzt starten"
3. Wählen Sie "Produktionsmodus"
4. Wählen Sie als Region: `europe-west3 (Frankfurt)`
5. Klicken Sie auf "Fertig"

### 3. Security Rules einrichten

#### Firestore Rules:
Gehen Sie zu Firestore → Rules und fügen Sie ein:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Authentifizierte Nutzer können alles lesen/schreiben
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Öffentliche Share-Links
    match /shareLinks/{linkId} {
      allow read: if true;
    }
  }
}
```

#### Storage Rules:
Gehen Sie zu Storage → Rules und fügen Sie ein:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Authentifizierte Nutzer können alles
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
    
    // Öffentlicher Lesezugriff für Kundenfotos
    match /customers/{customerId}/photos/{photoId} {
      allow read: if true;
    }
  }
}
```

### 4. Firebase Config in .env.local eintragen

Erstellen Sie eine `.env.local` Datei mit Ihren Firebase Credentials:
```env
REACT_APP_FIREBASE_API_KEY=AIzaSyDCeOBZw96klWFkolRQMnhr5DG4Ol2eMjY
REACT_APP_FIREBASE_AUTH_DOMAIN=umzugsapp.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=umzugsapp
REACT_APP_FIREBASE_STORAGE_BUCKET=umzugsapp.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=[Ihre Sender ID]
REACT_APP_FIREBASE_APP_ID=[Ihre App ID]
```

**Wo finden Sie die fehlenden Werte?**
1. Gehen Sie zu: https://console.firebase.google.com/u/0/project/umzugsapp/settings/general
2. Scrollen Sie zu "Ihre Apps" → "Web-Apps"
3. Kopieren Sie die fehlenden Werte

### 5. Erste Firestore Collections anlegen

Gehen Sie zu Firestore und erstellen Sie folgende Collections:

1. **customers**
   - Dokument-ID: auto-generated
   - Felder: Lassen Sie erstmal leer

2. **quotes**
   - Dokument-ID: auto-generated
   - Felder: Lassen Sie erstmal leer

3. **invoices**
   - Dokument-ID: auto-generated
   - Felder: Lassen Sie erstmal leer

4. **dispositions**
   - Dokument-ID: auto-generated
   - Felder: Lassen Sie erstmal leer

### 6. Test-User für Authentication

Falls noch nicht vorhanden:
1. Gehen Sie zu Authentication → Users
2. Klicken Sie auf "Nutzer hinzufügen"
3. E-Mail: test@relocato.de
4. Passwort: [Ihr sicheres Passwort]

## 🚀 Nach der Firebase-Aktivierung

Sobald Sie die obigen Schritte durchgeführt haben, können wir:

1. **Firestore Service erstellen** - Ich bereite den Code vor
2. **Migration Script schreiben** - Google Sheets → Firestore
3. **Storage Service implementieren** - Für Bilder
4. **Schrittweise umstellen** - Ohne Ausfallzeiten

## ⚠️ Wichtige Hinweise

- **API Key Sicherheit**: Der API Key ist öffentlich sichtbar, das ist normal bei Firebase Web Apps
- **Security Rules**: Die echte Sicherheit kommt durch die Rules
- **Kosten**: Mit dem Blaze Plan (Pay-as-you-go) bleiben Sie bei 300 Kunden/Monat unter 50€
- **Backup**: Google Sheets bleibt als Backup/Export-Option erhalten

---

**Nächster Schritt**: Bitte führen Sie die Schritte 1-3 in Ihrer Firebase Console durch und sagen Sie mir Bescheid, wenn Firestore und Storage aktiviert sind!