# Google Drive Integration Setup - Schritt-für-Schritt Anleitung

## Übersicht
Diese Anleitung erklärt, wie Sie Google Drive für die Foto-Speicherung in der Relocato App einrichten.

## Voraussetzungen
- Google Account mit Zugriff auf Google Cloud Console
- Node.js installiert (für Backend-Server)
- Die Backend-API muss deployed sein (z.B. auf Render.com)

## Schritt 1: Google Cloud Projekt erstellen

1. Gehen Sie zu [Google Cloud Console](https://console.cloud.google.com)
2. Klicken Sie auf "Neues Projekt erstellen"
3. Geben Sie dem Projekt einen Namen (z.B. "Relocato-Photos")
4. Notieren Sie sich die Projekt-ID

## Schritt 2: Google Drive API aktivieren

1. In der Google Cloud Console, navigieren Sie zu "APIs & Services" > "Bibliothek"
2. Suchen Sie nach "Google Drive API"
3. Klicken Sie auf "Google Drive API" und dann auf "Aktivieren"

## Schritt 3: Service Account erstellen

1. Gehen Sie zu "APIs & Services" > "Anmeldedaten"
2. Klicken Sie auf "+ Anmeldedaten erstellen" > "Dienstkonto"
3. Geben Sie folgende Details ein:
   - Name: `relocato-drive-service`
   - Beschreibung: `Service Account für Relocato Foto-Uploads`
4. Klicken Sie auf "Erstellen und fortfahren"
5. Überspringen Sie die optionalen Schritte

## Schritt 4: Service Account Key erstellen

1. Klicken Sie auf den erstellten Service Account
2. Gehen Sie zum Tab "Schlüssel"
3. Klicken Sie auf "Schlüssel hinzufügen" > "Neuen Schlüssel erstellen"
4. Wählen Sie "JSON" als Schlüsseltyp
5. Der JSON-Schlüssel wird heruntergeladen - **BEWAHREN SIE DIESE DATEI SICHER AUF!**

## Schritt 5: Google Drive Ordner erstellen und teilen

1. Gehen Sie zu [Google Drive](https://drive.google.com)
2. Erstellen Sie einen neuen Ordner namens "Relocato-Kundenfotos"
3. Rechtsklick auf den Ordner > "Freigeben"
4. Geben Sie die E-Mail-Adresse des Service Accounts ein (aus der JSON-Datei, endet mit `.iam.gserviceaccount.com`)
5. Wählen Sie "Bearbeiter" als Berechtigung
6. Klicken Sie auf "Senden"
7. Kopieren Sie die Ordner-ID aus der URL (nach `/folders/`)

## Schritt 6: Backend Environment Variables konfigurieren

Erstellen Sie eine `.env` Datei im `backend` Ordner mit folgenden Werten aus der JSON-Datei:

```env
# IONOS SMTP (bereits vorhanden)
SMTP_HOST=smtp.ionos.de
SMTP_PORT=587
SMTP_USER=ihre-email@ionos.de
SMTP_PASS=ihr-passwort
SMTP_FROM=ihre-email@ionos.de

# Google Drive API
GOOGLE_CLIENT_EMAIL=relocato-drive-service@ihr-projekt.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nIHR_PRIVATE_KEY_HIER\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=ihre-ordner-id-aus-schritt-5

# Server Port
PORT=3001
```

**Wichtig**: 
- Ersetzen Sie `\n` im Private Key mit echten Zeilenumbrüchen
- Der Private Key muss in Anführungszeichen stehen

## Schritt 7: Backend deployen (Render.com Beispiel)

1. Pushen Sie Ihre Änderungen zu GitHub
2. In Render.com, gehen Sie zu Ihrem Backend-Service
3. Fügen Sie die Environment Variables hinzu:
   - `GOOGLE_CLIENT_EMAIL`
   - `GOOGLE_PRIVATE_KEY` (mit echten Zeilenumbrüchen)
   - `GOOGLE_DRIVE_FOLDER_ID`
4. Deploy den Service neu

## Schritt 8: Frontend konfigurieren

Das Frontend ist bereits konfiguriert und nutzt automatisch das Backend wenn verfügbar.

Für lokale Entwicklung: Backend läuft auf `http://localhost:3001`
Für Produktion: Backend URL ist in `.env.production` konfiguriert

## Schritt 9: Testen

1. Starten Sie das Backend lokal:
   ```bash
   cd backend
   npm install
   npm start
   ```

2. Überprüfen Sie den Health-Check:
   ```bash
   curl http://localhost:3001/api/health
   ```
   
   Sie sollten sehen: `"googleDrive": "ready"`

3. Laden Sie ein Foto für einen Kunden hoch
4. Prüfen Sie in Google Drive, ob der Ordner und das Foto erstellt wurden

## Troubleshooting

### "Google Drive Service nicht verfügbar"
- Prüfen Sie, ob alle Environment Variables korrekt gesetzt sind
- Stellen Sie sicher, dass der Service Account Zugriff auf den Ordner hat
- Überprüfen Sie die Backend-Logs für Fehlermeldungen

### Fotos werden nur lokal gespeichert
- Das System fällt automatisch auf localStorage zurück wenn das Backend nicht erreichbar ist
- Prüfen Sie die Browser-Konsole für Fehlermeldungen
- Stellen Sie sicher, dass das Backend läuft und erreichbar ist

### "Quota exceeded" Fehler
- Google Drive API hat Limits - warten Sie etwas oder erhöhen Sie die Quota in der Google Cloud Console

## Sicherheitshinweise

1. **Teilen Sie niemals den Private Key öffentlich**
2. Fügen Sie die `.env` Datei zu `.gitignore` hinzu
3. Verwenden Sie Environment Variables in Produktionsumgebungen
4. Beschränken Sie die Service Account Berechtigungen auf das Minimum

## Support

Bei Problemen überprüfen Sie:
- Backend-Logs für detaillierte Fehlermeldungen
- Browser-Konsole für Frontend-Fehler
- Google Cloud Console für API-Limits und Fehler