# Google Drive Integration Setup

## 1. NPM Paket installieren

```bash
npm install react-qr-code
```

## 2. Google Cloud Console Setup

### Schritt 1: Google Cloud Projekt erstellen
1. Gehen Sie zu: https://console.cloud.google.com
2. Klicken Sie auf "Projekt erstellen"
3. Projektname: "Relocato-Webapp" (oder ähnlich)
4. Projekt-ID notieren (wird automatisch generiert)

### Schritt 2: Google Drive API aktivieren
1. Im Projekt: "APIs & Dienste" → "Bibliothek"
2. Suchen Sie nach "Google Drive API"
3. Klicken Sie auf "Aktivieren"

### Schritt 3: Service Account erstellen
1. "APIs & Dienste" → "Anmeldedaten"
2. "+ ANMELDEDATEN ERSTELLEN" → "Dienstkonto"
3. Name: "relocato-drive-service"
4. Rolle: "Bearbeiter" oder "Drive API Service Agent"
5. Fertig → JSON-Schlüssel herunterladen

### Schritt 4: Ordner in Google Drive erstellen
1. Erstellen Sie einen Ordner "Relocato Kunden" in Ihrem Google Drive
2. Rechtsklick → "Freigeben" → Service Account Email hinzufügen
3. Berechtigung: "Bearbeiter"
4. Ordner-ID aus URL kopieren (nach /folders/)

## 3. Umgebungsvariablen einrichten

Erstellen Sie eine `.env` Datei im Hauptverzeichnis:

```env
# Google Drive API
REACT_APP_GOOGLE_DRIVE_API_KEY=your-api-key-here
REACT_APP_GOOGLE_DRIVE_FOLDER_ID=your-folder-id-here
REACT_APP_GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
```

## 4. Vercel Umgebungsvariablen

In Vercel Dashboard:
1. Settings → Environment Variables
2. Alle drei Variablen hinzufügen
3. Redeployment triggern

## 5. Features testen

### QR-Code Upload testen:
1. Kunde in der App öffnen
2. Tab "Fotos" wählen
3. "Upload QR-Code" klicken
4. Mit Smartphone scannen
5. Fotos hochladen

### Rechnung aus Angebot:
1. Angebote-Liste öffnen
2. Bei akzeptiertem Angebot: "Rechnung erstellen"
3. Automatische Weiterleitung zur Rechnungsliste

## Troubleshooting

### "Google Drive API Key fehlt"
- Prüfen Sie die .env Datei
- Starten Sie die App neu: `npm start`

### Upload funktioniert nicht
- Service Account Berechtigungen prüfen
- Ordner-Freigabe überprüfen

### QR-Code wird nicht angezeigt
- `npm install react-qr-code` ausführen
- Browser-Console auf Fehler prüfen

## Nächste Schritte

Nach erfolgreichem Setup:
1. Testen Sie den Upload-Workflow
2. Prüfen Sie die Ordnerstruktur in Google Drive
3. Testen Sie die Rechnung-aus-Angebot Funktion