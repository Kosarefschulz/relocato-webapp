# 🚀 Schnelle Backend-Bereitstellung

## 1. Vercel CLI installieren (falls noch nicht installiert)
```bash
npm i -g vercel
```

## 2. In das Backend-Verzeichnis wechseln
```bash
cd /Users/sergejschulz/Desktop/main/umzugs-webapp/backend
```

## 3. Deployment starten
```bash
vercel
```

## 4. Bei den Fragen:
- Set up and deploy? **Y**
- Which scope? **Wähle deinen Account**
- Link to existing project? **N** (beim ersten Mal)
- Project name? **relocato-email-backend**
- In which directory? **.** (aktuelles Verzeichnis)
- Override settings? **N**

## 5. Umgebungsvariablen setzen

Nach dem ersten Deployment:

1. Gehe zu https://vercel.com/dashboard
2. Klicke auf dein Projekt "relocato-email-backend"
3. Gehe zu "Settings" → "Environment Variables"
4. Füge folgende Variablen hinzu:

```
SMTP_HOST=smtp.ionos.de
SMTP_PORT=587
SMTP_USER=bielefeld@relocato.de
SMTP_PASS=Bicm1308
SMTP_FROM=bielefeld@relocato.de
GOOGLE_CLIENT_EMAIL=relocato-drive-service@umzugs-app.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDEW75IMLpuPQgZ
... (gesamter Key) ...
-----END PRIVATE KEY-----"
GOOGLE_DRIVE_FOLDER_ID=1Q7hSlmX2PXtUiPihcwRB12gXC-pxIhnJ
```

## 6. Erneut deployen (mit Umgebungsvariablen)
```bash
vercel --prod
```

## 7. Frontend aktualisieren

Die Backend-URL wird etwa so aussehen: `https://relocato-email-backend.vercel.app`

Aktualisiere in deiner React-App alle Backend-URLs von `http://localhost:3001` zu deiner Vercel-URL.

## Fertig! 🎉

Dein Backend läuft jetzt online und die E-Mail-Funktionalität sollte funktionieren.