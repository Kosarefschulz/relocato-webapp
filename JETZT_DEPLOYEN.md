# 🚀 E-Mail Parser JETZT deployen!

## Was Sie jetzt tun müssen:

### 1. Firebase einloggen (einmalig):
```bash
firebase login
```

### 2. Deploy-Script ausführen:
```bash
node firebase-deploy.js
```

Das Script macht automatisch:
- ✅ Setzt Ihre IONOS Zugangsdaten (bielefeld@relocato.de)
- ✅ Deployed die Functions zu Firebase
- ✅ Startet den E-Mail Parser

## Alternative: Manuelle Befehle

Falls das Script nicht funktioniert:

```bash
# Konfiguration setzen:
firebase functions:config:set ionos.email="bielefeld@relocato.de" ionos.password="Bicm1308"

# Functions deployen:
firebase deploy --only functions
```

## Nach dem Deploy:

Der E-Mail Parser läuft automatisch alle 5 Minuten!

### Logs anzeigen:
```bash
firebase functions:log --follow
```

### Test-E-Mail senden:
Senden Sie eine E-Mail an **bielefeld@relocato.de** mit diesem Inhalt:

```
Betreff: Umzugsanfrage von ImmoScout24

Kontaktname: Test Kunde
Telefon: 0171 1234567
E-Mail: test@example.com
Von: Teststraße 1, 33605 Bielefeld
Nach: Zielstraße 2, 33602 Bielefeld
```

Nach max. 5 Minuten sollte der Kunde in Firebase erscheinen!