# 🚀 Backend Deployment auf Vercel

## Schnellanleitung

### 1. Vercel CLI installieren
```bash
npm i -g vercel
```

### 2. Backend deployen
```bash
cd backend
vercel
```

Bei den Fragen:
- **Set up and deploy?** → Y
- **Which scope?** → Wähle deinen Account
- **Link to existing project?** → N
- **Project name?** → relocato-email-backend
- **In which directory?** → . (aktuelles Verzeichnis)
- **Override settings?** → N

### 3. Umgebungsvariablen setzen

Nach dem ersten Deployment:

1. Gehe zu [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Klicke auf "relocato-email-backend"
3. Gehe zu "Settings" → "Environment Variables"
4. Füge diese Variablen hinzu:

```
SMTP_HOST=smtp.ionos.de
SMTP_PORT=587
SMTP_USER=bielefeld@relocato.de
SMTP_PASS=Bicm1308
SMTP_FROM=bielefeld@relocato.de
GOOGLE_CLIENT_EMAIL=relocato-drive-service@umzugs-app.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDEW75IMLpuPQgZ
RDo9GS0PlAlkPWw9WJ2LcY/zqzjUucaDhVIYtc9HdliPngJSLGexWaMYx+WZa1yI
UbLETTlR+uu7TF0Dx1o8n/1yKIQQmpq0daSmErGQaS1xXYfvvhHDhgINPoz45rY2
D2fWbqbcflm/oBxrdGQPqbucQt5EBe6tcesgmQc4O9NfHTYDulHg9e2ROCfmfgwM
Q/TkqcOgziYJHSplM/yWNlnFwQYgNWCiuEa1JdljAIjETOeHbPT7guhax5xzeuko
rxTPckmPKf3c5DG4/WhewHG7dCs8yY+PQGN6v5c9JTyWWp7gMPXAkGYQHkFcIXqD
RherYA3vAgMBAAECggEACqNHw0R0jS1cR3YlS5MWGF52Rcp4Fzi6TEgqOtK/YPLx
mMV7xZ/v61izgpBWYtpKAdcv2VNXEoE5AZ+fdjgSz2ivJbYE4gQGVPt78RfV08p0
cCthcKfZm8++6QHer/PVpYiYitwlKgThwTsDbqAPBSoJNbL4Zy/mjdytr9EFlpy9
L2nws5DZvkt9sThPoN1yhTwxKOKgE9wih2ZMZWRxMwsJCZ36zR8n4A+FbEXBVAI5
fDttI/meAV4hX9Iprh6b1OSOCL0XevCNFK2AgcM4finhT4F74EVCyYQlH7JFYYdi
FL72wmEXOBCRmZf0dksqLXo4tOhrijkn1xwr/L3zsQKBgQD9sh+28qYI2RAAJsSD
vdtPoJsULQh3vOr7nI6sesX9bqb7XVzsPfLHnFrfirVLYxNJksChu3V/X2mTw8PW
Ss65RomA4pWgdU4qmCKcfx2GyfLjgMg9CtTgCTlFzPeYCu9CiDfoggsocbxVEYMN
SNtiDXVPFkop4sCX19OOz/8ekQKBgQDGJE1mlCaYxNGgMT5/gAQvlzkc361mzJU8
PHSoXkr7exFZkAa6mFCHaN3bp/Ge/xEutxJCaxZqBZlIbZ+1Gv9b3VLjgDCGybfK
6enwBV025lsDCvj+nLMcBCEQeNKo6XqTrbsdLWwt0al11mwPUe0ssOC+23bUsmW/
bbDS/AukfwKBgHLfc+LYDnxVJRyccUEh96sfkvjYx0vIfDJAGo5Y7UurDeslxEyo
ZEUkNDWiTiL7kqEu1RCmnDZ3kou5CfT/XImiOeLlNlE4rJM23f00xb7htJx1FLYn
MGrdYlSL0dTDpsDeg0pBkCHZFikCy+94/PVyGJseAajjpsdaj83Lur4xAoGAF3I2
QnwncQ5hK86H8bhpRmRjmroRH8f3pNAWkdHOl6GBdRKo6S2a4dsT3akq20CdfOSm
4XsghN0yvTJToq+WJf2zkD4b/+cgu38gcol/9T4e6OZEfoR2YUtPyk4xx1ERcyYs
rRAx694SamI8GTf9k7s+bPc1QYf2qEdHlD/E9OsCgYBmTu3ZY5rXNnC79QMy2fhE
qydTkQwyibG2ed5X8wrJk4UMOyJF7/FZkdGIGjHjZo+WCZiQhmtj/YVt3se9Iyw/
ZGtAB/U8WZwevHRU3kqFFN3kj5DtptATWSpPcY/RYmUgs+mn9u/zqqGstH64rc8a
gxKjU5aD+XEyrxt6cSvobg==
-----END PRIVATE KEY-----"
GOOGLE_DRIVE_FOLDER_ID=1Q7hSlmX2PXtUiPihcwRB12gXC-pxIhnJ
```

### 4. Erneut deployen (Production)
```bash
vercel --prod
```

### 5. Frontend konfigurieren

Die Backend-URL wird etwa so aussehen: `https://relocato-email-backend.vercel.app`

**Aktualisiere .env.production:**
```
REACT_APP_BACKEND_URL=https://relocato-email-backend.vercel.app
```

### 6. Frontend neu bauen und deployen
```bash
cd ..
npm run build
firebase deploy --only hosting
```

## 🔍 Überprüfung

1. **Backend testen:**
   ```bash
   curl https://relocato-email-backend.vercel.app/test
   ```

2. **Email-Endpunkte testen:**
   ```bash
   curl -X POST https://relocato-email-backend.vercel.app/api/email/list \
     -H "Content-Type: application/json" \
     -d '{"folder":"INBOX","limit":10}'
   ```

## 🛠️ Fehlerbehebung

### Fehler: "Function timed out"
- Gehe zu Vercel Dashboard → Settings → Functions
- Erhöhe das Timeout auf 30 Sekunden

### Fehler: "Environment variables not found"
- Stelle sicher, dass alle Umgebungsvariablen in Vercel gesetzt sind
- Redeploye nach dem Setzen der Variablen

### Fehler: "CORS error"
- Die CORS-Header sind bereits in der vercel.json konfiguriert
- Prüfe, ob die Frontend-URL korrekt ist

## 📱 Live-URLs

Nach erfolgreichem Deployment:
- **Backend:** https://relocato-email-backend.vercel.app
- **Frontend:** https://umzugsapp.web.app

Die E-Mail-Funktionalität sollte jetzt online funktionieren! 🎉