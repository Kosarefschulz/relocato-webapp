# Firebase Domain Authorization

## Problem
Die Domain `relocato.ruempel-schmiede.com` ist nicht für OAuth-Operationen autorisiert.

## Lösung

### 1. Firebase Console öffnen
1. Gehe zu [Firebase Console](https://console.firebase.google.com)
2. Wähle das Projekt **umzugsapp**

### 2. Autorisierte Domains hinzufügen
1. Navigiere zu **Authentication** → **Settings** → **Authorized domains**
2. Klicke auf **Add domain**
3. Füge folgende Domains hinzu:
   - `relocato.ruempel-schmiede.com`
   - `localhost` (falls noch nicht vorhanden)
   - `umzugsapp.firebaseapp.com` (falls noch nicht vorhanden)

### 3. Google OAuth konfigurieren
1. Gehe zu **Authentication** → **Sign-in method**
2. Stelle sicher, dass **Google** aktiviert ist
3. Überprüfe die Support-E-Mail und den öffentlichen Projektnamen

### 4. Alternative: Firebase Hosting verwenden
Falls die Domain-Autorisierung nicht funktioniert, kannst du die App auch über Firebase Hosting aufrufen:
- URL: `https://umzugsapp.web.app` oder `https://umzugsapp.firebaseapp.com`

## Wichtig für Production Build
Die `.env.production` Datei wurde bereits mit allen notwendigen Firebase-Konfigurationen aktualisiert. Nach dem nächsten Build sollten alle Firebase-Features funktionieren.

## Test-Login ohne Google
Falls Google Login noch nicht funktioniert, kannst du dich mit diesen Daten einloggen:
- Email: `admin@relocato.de`
- Passwort: `Admin123!`

(Falls dieser User noch nicht existiert, erstelle ihn in der Browser-Konsole mit: `import('./utils/createAdminUser.ts').then(m => m.createAdminUser())`)