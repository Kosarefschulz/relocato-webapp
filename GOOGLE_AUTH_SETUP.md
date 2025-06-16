# Google Authentication Setup für Firebase

## Schritte zum Aktivieren der Google-Authentifizierung in Firebase Console:

1. **Firebase Console öffnen**
   - Gehen Sie zu https://console.firebase.google.com
   - Wählen Sie das Projekt "umzugsapp" aus

2. **Authentication aktivieren**
   - Klicken Sie im linken Menü auf "Authentication"
   - Gehen Sie zum Tab "Sign-in method"

3. **Google Provider aktivieren**
   - Suchen Sie "Google" in der Liste der Anbieter
   - Klicken Sie auf "Google"
   - Schalten Sie den Toggle "Enable" ein

4. **Konfiguration**
   - **Project public-facing name**: Geben Sie einen Namen ein (z.B. "Umzugs WebApp")
   - **Project support email**: Wählen Sie Ihre Support-E-Mail-Adresse aus dem Dropdown
   - Klicken Sie auf "Save"

5. **Autorisierte Domains prüfen**
   - Gehen Sie zum Tab "Settings"
   - Unter "Authorized domains" sollten folgende Domains aufgelistet sein:
     - localhost
     - umzugsapp.firebaseapp.com
     - umzugsapp.web.app
   - Fügen Sie bei Bedarf weitere Domains hinzu (z.B. Ihre eigene Domain)

## Wichtige Hinweise:

- Die Google-Authentifizierung verwendet automatisch die Firebase-Projekt-Konfiguration
- Keine zusätzlichen API-Schlüssel erforderlich
- OAuth 2.0 Client wird automatisch von Firebase verwaltet
- Bei Produktiv-Deployment: Stellen Sie sicher, dass Ihre Domain in den autorisierten Domains aufgeführt ist

## Test der Implementierung:

1. Starten Sie die App lokal: `npm start`
2. Gehen Sie zur Login-Seite
3. Klicken Sie auf "Mit Google anmelden"
4. Ein Popup sollte erscheinen zur Google-Anmeldung
5. Nach erfolgreicher Anmeldung werden Sie zum Dashboard weitergeleitet

## Fehlerbehebung:

- **Popup blockiert**: Stellen Sie sicher, dass Popups für localhost erlaubt sind
- **Redirect URI mismatch**: Prüfen Sie die autorisierten Domains in Firebase
- **403 Fehler**: Stellen Sie sicher, dass die Google Sign-In API aktiviert ist