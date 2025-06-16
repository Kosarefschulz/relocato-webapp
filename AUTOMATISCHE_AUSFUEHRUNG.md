# 📧 E-Mail Parser - Automatische Ausführung einrichten

## ✅ Die Function läuft jetzt!

URL: https://europe-west1-umzugsapp.cloudfunctions.net/checkEmails

## 🔄 Automatische Ausführung alle 5 Minuten einrichten:

### Option 1: Cloud Scheduler (Empfohlen)

1. **Öffnen Sie Cloud Scheduler**:
   https://console.cloud.google.com/cloudscheduler?project=umzugsapp

2. **Klicken Sie auf "+ JOB ERSTELLEN"**

3. **Einstellungen**:
   - **Name**: `email-parser-trigger`
   - **Region**: `europe-west1`
   - **Frequenz**: `*/5 * * * *`
   - **Zeitzone**: `Europe/Berlin`

4. **Zieltyp konfigurieren**:
   - **Zieltyp**: HTTP
   - **URL**: `https://europe-west1-umzugsapp.cloudfunctions.net/checkEmails`
   - **HTTP-Methode**: GET
   - **Auth-Header**: Keine

5. **"Erstellen" klicken**

## 📊 Sofort testen:

### Browser-Test:
Öffnen Sie einfach diese URL in Ihrem Browser:
https://europe-west1-umzugsapp.cloudfunctions.net/checkEmails

### Terminal-Test:
```bash
curl https://europe-west1-umzugsapp.cloudfunctions.net/checkEmails
```

## 📱 Integration in Ihre App:

```javascript
// In Ihrer React-App
const checkEmails = async () => {
  const response = await fetch('https://europe-west1-umzugsapp.cloudfunctions.net/checkEmails');
  const result = await response.json();
  console.log(result);
};
```

## 💡 Alternative: Kostenloser Cron-Service

Falls Cloud Scheduler Probleme macht, können Sie einen kostenlosen externen Cron-Service nutzen:

### cron-job.org (Kostenlos):
1. Registrieren bei https://cron-job.org
2. Neuen Cronjob erstellen:
   - URL: `https://europe-west1-umzugsapp.cloudfunctions.net/checkEmails`
   - Intervall: Alle 5 Minuten

### UptimeRobot (Kostenlos):
1. Registrieren bei https://uptimerobot.com
2. Neuen Monitor erstellen:
   - Monitor Type: HTTP(s)
   - URL: `https://europe-west1-umzugsapp.cloudfunctions.net/checkEmails`
   - Monitoring Interval: 5 minutes

## ✅ Fertig!

Der E-Mail Parser:
- ✅ Ist deployed und läuft
- ✅ Prüft bei jedem Aufruf Ihr IONOS Postfach
- ✅ Erstellt automatisch Kunden aus E-Mails
- ✅ Kostet praktisch nichts (€0-5/Monat)

## 📧 Test-E-Mail senden:

Senden Sie eine Test-E-Mail an **bielefeld@relocato.de**:

```
Betreff: Umzugsanfrage von ImmoScout24

Kontaktname: Test Kunde
Telefon: 0171 1234567
E-Mail: test@example.com
Von: Teststraße 1, 33605 Bielefeld
Nach: Zielstraße 2, 33602 Bielefeld
```

Dann rufen Sie die URL auf oder warten Sie auf den nächsten automatischen Lauf!