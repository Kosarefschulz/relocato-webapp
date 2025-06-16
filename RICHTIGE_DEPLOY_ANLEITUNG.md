# ⚠️ WICHTIG: Sie sind im falschen Bereich!

## Sie sind gerade in Cloud Run - wir brauchen aber Firebase Functions!

### 🎯 So geht's richtig:

## Option 1: Firebase Console (EMPFOHLEN)

1. **Öffnen Sie die Firebase Console**:
   https://console.firebase.google.com/project/umzugsapp/functions

2. **Klicken Sie auf "Get started" oder "Functions"**

3. **Warten Sie kurz (5-10 Minuten) wegen API Quota**

4. **Dann im Terminal ausführen**:
   ```bash
   firebase deploy --only functions
   ```

## Option 2: Direkt über Terminal (EINFACHSTE LÖSUNG)

Warten Sie einfach 5-10 Minuten und führen Sie dann aus:

```bash
firebase deploy --only functions
```

Das sollte jetzt funktionieren, da die API-Quota zurückgesetzt wurde.

## ❌ NICHT Cloud Run verwenden!

Cloud Run ist für Container-basierte Apps. Wir haben aber Firebase Functions geschrieben, die automatisch deployed werden.

## ✅ Nach erfolgreichem Deploy über Terminal:

Sie sehen dann:
```
✔ Deploy complete!
Function URL (checkAndParseEmails): https://europe-west1-umzugsapp.cloudfunctions.net/checkAndParseEmails
```

## 📧 Der E-Mail Parser läuft dann automatisch!

- Prüft alle 5 Minuten Ihr Postfach bielefeld@relocato.de
- Erstellt automatisch Kunden aus E-Mails
- Kostet €0/Monat

## Bei Problemen:

```bash
# Cache löschen
rm -rf ~/.cache/firebase

# Neu einloggen
firebase logout
firebase login

# Erneut deployen
firebase deploy --only functions
```