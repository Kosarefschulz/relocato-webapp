# Google Cloud Projekt Wiederherstellung für Relocato

## Schritt 1: Google Drive Ordner prüfen

1. Gehe zu [Google Drive](https://drive.google.com) mit deinem Account: `sergej.schulz92@gmail.com`
2. Suche nach einem Ordner namens **"Relocato Kunden"**
3. Wenn du den Ordner findest:
   - Öffne ihn und kopiere die Ordner-ID aus der URL (nach `/folders/`)
   - Diese ID brauchst du für `GOOGLE_DRIVE_FOLDER_ID`

## Schritt 2: Google Cloud Console

1. Gehe zu [Google Cloud Console](https://console.cloud.google.com)
2. Einloggen mit `sergej.schulz92@gmail.com`
3. Oben links beim Projekt-Dropdown schauen nach:
   - "Relocato-Webapp"
   - "Relocato-Photos"
   - "Relocato"
   - Oder ähnliche Namen

## Schritt 3: Service Account wiederfinden

Wenn du das Projekt gefunden hast:

1. Gehe zu **"IAM & Verwaltung"** > **"Dienstkonten"**
2. Du solltest einen Service Account sehen (wahrscheinlich "relocato-drive-service" oder ähnlich)
3. Klicke auf den Service Account
4. Die E-Mail-Adresse des Service Accounts kopieren (endet mit `.iam.gserviceaccount.com`)

## Schritt 4: Neuen Schlüssel erstellen

Da der alte Schlüssel verloren ist:

1. Beim Service Account auf **"Schlüssel"** Tab gehen
2. **"Schlüssel hinzufügen"** > **"Neuen Schlüssel erstellen"**
3. **JSON** auswählen
4. Die JSON-Datei wird heruntergeladen

## Schritt 5: APIs prüfen

Stelle sicher, dass diese APIs aktiviert sind:
1. **"APIs & Services"** > **"Aktivierte APIs"**
2. Prüfe ob aktiviert:
   - Google Drive API
   - Google Sheets API (falls du das auch nutzt)

## Schritt 6: Environment Variables setzen

### Backend (.env)
```env
# Aus der heruntergeladenen JSON-Datei:
GOOGLE_CLIENT_EMAIL=relocato-service@dein-projekt.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Aus Google Drive:
GOOGLE_DRIVE_FOLDER_ID=deine-ordner-id-hier
```

### Wichtig beim Private Key:
- Den kompletten Key aus der JSON kopieren
- Die `\n` durch echte Zeilenumbrüche ersetzen
- In Anführungszeichen einschließen

## Falls du kein Projekt findest:

Dann müssen wir ein neues erstellen. Sag mir Bescheid und ich führe dich durch den kompletten Setup-Prozess.

## Quick Check Commands:

Nach dem Setup kannst du testen:

```bash
# Im backend Ordner
cd backend
node -e "require('dotenv').config(); console.log('Email:', process.env.GOOGLE_CLIENT_EMAIL); console.log('Key vorhanden:', !!process.env.GOOGLE_PRIVATE_KEY); console.log('Folder ID:', process.env.GOOGLE_DRIVE_FOLDER_ID)"
```

Das sollte deine Konfiguration anzeigen (ohne den Private Key zu zeigen).