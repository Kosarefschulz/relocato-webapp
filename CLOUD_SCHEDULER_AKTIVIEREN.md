# 🔧 Cloud Scheduler API manuell aktivieren

## Das Problem:
Die API-Aktivierung schlägt wegen Quota-Überschreitung fehl.

## Die Lösung:

### 1. Cloud Scheduler API direkt aktivieren:

**Klicken Sie auf diesen Link:**
https://console.cloud.google.com/apis/library/cloudscheduler.googleapis.com?project=umzugsapp

**Dann klicken Sie auf "AKTIVIEREN"**

### 2. Warten Sie 2-3 Minuten

### 3. Versuchen Sie das Deploy erneut:
```bash
firebase deploy --only functions
```

## Alternative: Alle benötigten APIs auf einmal aktivieren

Öffnen Sie diese Links und klicken Sie jeweils auf "AKTIVIEREN":

1. [Cloud Scheduler API](https://console.cloud.google.com/apis/library/cloudscheduler.googleapis.com?project=umzugsapp)
2. [Cloud Build API](https://console.cloud.google.com/apis/library/cloudbuild.googleapis.com?project=umzugsapp) 
3. [Cloud Functions API](https://console.cloud.google.com/apis/library/cloudfunctions.googleapis.com?project=umzugsapp)
4. [Artifact Registry API](https://console.cloud.google.com/apis/library/artifactregistry.googleapis.com?project=umzugsapp)

## Danach:
```bash
firebase deploy --only functions
```

Das sollte dann funktionieren!