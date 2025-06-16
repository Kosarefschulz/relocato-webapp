# 🚀 Schnelle E-Mail Parser Einrichtung

## Option 1: Manuell (empfohlen)

Führen Sie diese Befehle nacheinander aus:

```bash
# 1. IONOS App-Passwort erstellen:
# - Gehen Sie zu: IONOS Kundencenter → E-Mail → Einstellungen → App-Passwörter
# - Erstellen Sie ein neues App-Passwort
# - Kopieren Sie es (wird nur einmal angezeigt!)

# 2. Firebase Konfiguration setzen (ersetzen Sie IHR_APP_PASSWORT):
firebase functions:config:set ionos.email="anfragen@relocato.de" ionos.password="IHR_APP_PASSWORT"

# 3. Functions deployen:
firebase deploy --only functions
```

## Option 2: Setup-Skript verwenden

```bash
# Im Terminal ausführen:
./setup-email-parser.sh

# Dann eingeben:
# - E-Mail: anfragen@relocato.de (oder Enter für Standard)
# - Passwort: [Ihr IONOS App-Passwort]
```

## ✅ Fertig!

Nach dem Deploy läuft der E-Mail Parser automatisch alle 5 Minuten.

## 📧 Testen

Senden Sie eine Test-E-Mail an **anfragen@relocato.de**:

```
Betreff: Umzugsanfrage von ImmoScout24

Kontaktname: Test Kunde
Telefon: 0171 1234567
E-Mail: test@example.com
Von: Teststraße 1, 10115 Berlin
Nach: Zielstraße 2, 20095 Hamburg
```

## 📊 Logs prüfen

```bash
# Live-Logs anzeigen:
firebase functions:log --follow
```

## 🆘 Bei Problemen

```bash
# Konfiguration prüfen:
firebase functions:config:get

# Neu deployen:
firebase deploy --only functions
```