# 🚀 RELOCATO® WebApp - Vercel Deployment

## Schritt 1: GitHub Repository erstellen

1. **GitHub.com öffnen** und einloggen
2. **"New Repository" klicken**
3. **Repository Name:** `relocato-webapp`
4. **Public** auswählen
5. **"Create repository"** klicken

## Schritt 2: Code zu GitHub hochladen

**In Ihrem Terminal:**
```bash
cd /Users/sergejschulz/Desktop/main/umzugs-webapp
git remote add origin https://github.com/IHR-USERNAME/relocato-webapp.git
git branch -M main
git push -u origin main
```

*Ersetzen Sie `IHR-USERNAME` mit Ihrem GitHub-Benutzernamen*

## Schritt 3: Backend auf Vercel deployen

1. **Vercel.com öffnen** und mit GitHub einloggen
2. **"New Project" klicken**
3. **"relocato-webapp" Repository auswählen**
4. **"Import" klicken**
5. **Settings ändern:**
   - **Root Directory:** `backend`
   - **Framework Preset:** Other
   - **Build Command:** `npm install`
   - **Output Directory:** `.`
   - **Install Command:** `npm install`

6. **Environment Variables hinzufügen:**
   ```
   SMTP_HOST = smtp.ionos.de
   SMTP_PORT = 587
   SMTP_USER = bielefeld@relocato.de
   SMTP_PASS = Bicm1308
   SMTP_FROM = bielefeld@relocato.de
   NODE_ENV = production
   ```

7. **"Deploy" klicken**

## Schritt 4: Frontend auf Vercel deployen

1. **Neues Projekt erstellen** (gleiche Repository)
2. **Settings ändern:**
   - **Root Directory:** `.` (Frontend-Root)
   - **Framework Preset:** Create React App
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`

3. **Environment Variables:**
   ```
   REACT_APP_API_URL = https://ihr-backend-name.vercel.app
   REACT_APP_FIREBASE_API_KEY = AIzaSyDCeOBZw96klWFkolRQMnhr5DG4Ol2eMjY
   REACT_APP_FIREBASE_AUTH_DOMAIN = umzugsapp.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID = umzugsapp
   REACT_APP_GOOGLE_SHEETS_ID = 178tpFCNqmnDZxkzOfgWQCS6BW7wn2rYyTB3hZh8H7PU
   REACT_APP_SMTP_FROM = bielefeld@relocato.de
   ```

## Schritt 5: URLs verbinden

Nach dem Deployment erhalten Sie:
- **Backend URL:** `https://ihr-backend-name.vercel.app`
- **Frontend URL:** `https://ihr-frontend-name.vercel.app`

**Frontend Environment Variable aktualisieren:**
```
REACT_APP_API_URL = https://ihr-backend-name.vercel.app
```

## Schritt 6: Testen

1. **Backend testen:** `https://ihr-backend-name.vercel.app/api/health`
2. **Frontend öffnen:** `https://ihr-frontend-name.vercel.app`
3. **E-Mail senden:** Angebot erstellen → E-Mail kommt von bielefeld@relocato.de

## Wichtige Hinweise:

- ✅ **IONOS SMTP Daten sind bereits konfiguriert**
- ✅ **Google Sheets funktioniert weiter**
- ✅ **Firebase Auth bleibt erhalten**
- ✅ **Mobile optimiert**

## Bei Problemen:

1. **Vercel Logs checken:** Dashboard → Functions → View Logs
2. **Browser Console öffnen:** F12 → Console
3. **Backend Health Check:** `/api/health` aufrufen

Ihre App ist dann weltweit verfügbar! 🌍