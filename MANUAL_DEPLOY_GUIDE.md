# 🚀 Manuelle Deploy-Anleitung für E-Mail Parser

Da es API-Quota-Probleme gibt, hier die manuelle Lösung:

## Option 1: Warten und erneut versuchen (5-10 Minuten)

Die API-Quota wird alle paar Minuten zurückgesetzt. Warten Sie 5-10 Minuten und versuchen Sie dann:

```bash
firebase deploy --only functions
```

## Option 2: Über Google Cloud Console

1. **Öffnen Sie die Cloud Functions Console**:
   https://console.cloud.google.com/functions/list?project=umzugsapp

2. **Klicken Sie auf "Funktion erstellen"**

3. **Grundeinstellungen**:
   - Name: `Q`
   - Region: `europe-west1`
   - Trigger-Typ: `Cloud Pub/Sub`
   - Neues Thema erstellen: `email-check-schedule`

4. **Runtime-Einstellungen**:
   - Arbeitsspeicher: 512 MB
   - Timeout: 540 Sekunden
   - Runtime: Node.js 18

5. **Code hochladen**:
   - Wählen Sie "ZIP-Upload"
   - Laden Sie den `functions` Ordner als ZIP hoch

6. **Umgebungsvariablen**:
   ```
   IONOS_EMAIL=bielefeld@relocato.de
   IONOS_PASSWORD=Bicm1308
   ```

7. **Cloud Scheduler einrichten**:
   - Gehen Sie zu: https://console.cloud.google.com/cloudscheduler?project=umzugsapp
   - "Job erstellen"
   - Name: `email-parser-schedule`
   - Frequenz: `*/5 * * * *` (alle 5 Minuten)
   - Zeitzone: `Europe/Berlin`
   - Ziel-Typ: `Pub/Sub`
   - Thema: `email-check-schedule`

## Option 3: Firebase CLI Reset

Falls die Quota weiterhin Probleme macht:

```bash
# Firebase ausloggen und neu einloggen
firebase logout
firebase login

# Cache löschen
rm -rf ~/.cache/firebase

# Erneut versuchen
firebase deploy --only functions
```

## Option 4: Direkt über gcloud CLI

```bash
# Google Cloud SDK installieren (falls nicht vorhanden)
curl https://sdk.cloud.google.com | bash

# Einloggen
gcloud auth login

# Projekt setzen
gcloud config set project umzugsapp

# Functions deployen
gcloud functions deploy checkAndParseEmails \
  --runtime nodejs18 \
  --trigger-topic email-check-schedule \
  --entry-point checkAndParseEmails \
  --memory 512MB \
  --timeout 540s \
  --region europe-west1 \
  --set-env-vars IONOS_EMAIL=bielefeld@relocato.de,IONOS_PASSWORD=Bicm1308
```

## 📧 Nach erfolgreichem Deploy:

Der E-Mail Parser läuft automatisch alle 5 Minuten!

### Test-E-Mail senden an: bielefeld@relocato.de

```
Betreff: Umzugsanfrage von ImmoScout24

Kontaktname: Test Kunde
Telefon: 0171 1234567
E-Mail: test@example.com
Von: Teststraße 1, 33605 Bielefeld
Nach: Zielstraße 2, 33602 Bielefeld
Zimmeranzahl: 3
Wohnfläche: 85 m²
```

### Logs prüfen:
```bash
firebase functions:log --follow
```

## 💡 Tipp:

Die API-Quota wird normalerweise nach 5-10 Minuten zurückgesetzt. Am besten warten Sie kurz und versuchen dann:

```bash
firebase deploy --only functions
```

Das sollte dann funktionieren!