# 🔧 APIs manuell aktivieren

Das Deployment hat ein Quota-Problem. Bitte aktivieren Sie diese APIs manuell:

## 1. Öffnen Sie die Google Cloud Console:
https://console.cloud.google.com/apis/library?project=umzugsapp

## 2. Suchen und aktivieren Sie diese APIs:

### ✅ Bereits aktiviert:
- Cloud Functions API
- Cloud Build API
- Artifact Registry API
- Cloud Scheduler API
- Pub/Sub API
- Cloud Storage API
- Firebase Extensions API

### ❌ Noch zu aktivieren:
1. **Cloud Run API**
   - Suchen Sie nach "Cloud Run API"
   - Klicken Sie auf "Aktivieren"

2. **Eventarc API**
   - Suchen Sie nach "Eventarc API"
   - Klicken Sie auf "Aktivieren"

## 3. Nach der Aktivierung:

Führen Sie diesen Befehl aus:
```bash
firebase deploy --only functions
```

## Alternative: Direkte Links

- [Cloud Run API aktivieren](https://console.cloud.google.com/apis/library/run.googleapis.com?project=umzugsapp)
- [Eventarc API aktivieren](https://console.cloud.google.com/apis/library/eventarc.googleapis.com?project=umzugsapp)

Nach der Aktivierung sollte das Deployment funktionieren!