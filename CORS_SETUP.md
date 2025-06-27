# Firebase Storage CORS Setup

## ⚠️ WICHTIG: CORS muss für Produktion konfiguriert werden!

Firebase Storage blockiert standardmäßig Cross-Origin-Anfragen. Da Ihre App unter `relocato.ruempel-schmiede.com` läuft, müssen Sie CORS erlauben.

## Option 1: Über Google Cloud Console (Empfohlen)

1. **Google Cloud Console öffnen**
   - Gehen Sie zu: https://console.cloud.google.com/storage/browser
   - Wählen Sie Ihr Projekt: `umzugsapp`
   - Klicken Sie auf den Bucket: `umzugsapp.firebasestorage.app`

2. **Cloud Shell aktivieren**
   - Klicken Sie oben rechts auf das Terminal-Symbol (>_)
   - Warten Sie bis Cloud Shell geladen ist

3. **CORS-Datei erstellen**
   ```bash
   cat > cors.json << 'EOF'
   [
     {
       "origin": [
         "https://relocato.ruempel-schmiede.com",
         "http://localhost:3000",
         "http://localhost:3001"
       ],
       "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
       "maxAgeSeconds": 3600,
       "responseHeader": [
         "Content-Type",
         "Access-Control-Allow-Origin",
         "x-goog-resumable"
       ]
     }
   ]
   EOF
   ```

4. **CORS anwenden**
   ```bash
   gsutil cors set cors.json gs://umzugsapp.firebasestorage.app
   ```

5. **Überprüfen**
   ```bash
   gsutil cors get gs://umzugsapp.firebasestorage.app
   ```

## Option 2: Über lokale Google Cloud SDK

Falls Sie Google Cloud SDK lokal installiert haben:

1. **Installieren** (falls noch nicht vorhanden)
   ```bash
   # macOS
   brew install google-cloud-sdk
   
   # Oder direkt von Google
   curl https://sdk.cloud.google.com | bash
   ```

2. **Einloggen**
   ```bash
   gcloud auth login
   gcloud config set project umzugsapp
   ```

3. **CORS setzen**
   ```bash
   gsutil cors set cors.json gs://umzugsapp.firebasestorage.app
   ```

## Option 3: Temporäre Lösung (NUR für Tests!)

Für schnelle Tests können Sie alle Origins erlauben:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "maxAgeSeconds": 3600
  }
]
```

⚠️ **WARNUNG**: Dies ist unsicher für Produktion!

## Fehlerbehebung

### "Preflight response is not successful. Status code: 404"
- CORS ist nicht konfiguriert
- Lösung: Folgen Sie den Schritten oben

### "storage/unauthorized"
- Storage Rules verhindern Zugriff
- Prüfen Sie die Rules in Firebase Console

### Storage Bucket URL hat Zeilenumbruch
- Der Fix in firebase.ts sollte das beheben
- Alle Environment Variables werden jetzt mit .trim() bereinigt

## Verifizierung

Nach der CORS-Konfiguration:
1. Browser-Cache leeren (wichtig!)
2. Seite neu laden
3. Foto-Upload testen
4. In der Console sollte kein CORS-Fehler mehr erscheinen

## Support

Bei Problemen:
- Firebase Support: https://firebase.google.com/support
- Google Cloud Console: https://console.cloud.google.com