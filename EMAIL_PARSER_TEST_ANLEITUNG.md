# 📧 E-Mail Parser Test-Anleitung

## 🎯 Neue Funktionen:

Der Parser kann jetzt:
1. **Bestimmte Ordner durchsuchen** (z.B. "Anfragen")
2. **Alte E-Mails verarbeiten** (nicht nur ungelesene)
3. **Bis zu 50 E-Mails auf einmal importieren**
4. **Alle verfügbaren Ordner anzeigen**

## 🧪 Test-URLs:

### 1. Normale Prüfung (wie bisher):
```
https://europe-west1-umzugsapp.cloudfunctions.net/checkEmails
```

### 2. Test-Import der letzten 50 E-Mails:
```
https://europe-west1-umzugsapp.cloudfunctions.net/checkEmails?test=true&limit=50
```

### 3. Bestimmten Ordner prüfen (z.B. "Anfragen"):
```
https://europe-west1-umzugsapp.cloudfunctions.net/checkEmails?folder=Anfragen&test=true&limit=50
```

### 4. Nur 10 E-Mails aus einem Ordner:
```
https://europe-west1-umzugsapp.cloudfunctions.net/checkEmails?folder=Anfragen&test=true&limit=10
```

## 📋 Parameter erklärt:

- **`test=true`**: Aktiviert Test-Modus
  - Verarbeitet ALLE E-Mails (nicht nur ungelesene)
  - Markiert E-Mails NICHT als gelesen
  - Fügt "[TEST]" vor Kundennamen
  - Sendet KEINE Willkommens-E-Mails

- **`folder=NAME`**: Wählt einen bestimmten Ordner
  - Standard: INBOX
  - Beispiele: "Anfragen", "Sent", "Drafts"
  - Falls Ordner nicht existiert, wird INBOX verwendet

- **`limit=ZAHL`**: Begrenzt die Anzahl
  - Standard: 50
  - Maximum empfohlen: 100

## 🚀 Empfohlener Test-Ablauf:

### 1. Erst schauen welche Ordner vorhanden sind:
Rufen Sie die URL auf und schauen Sie in die Logs:
```
https://europe-west1-umzugsapp.cloudfunctions.net/checkEmails?test=true&limit=1
```

Die Logs zeigen alle verfügbaren Ordner:
```
📁 INBOX
📁 Sent
📁 Drafts
📁 Anfragen
...
```

### 2. Dann den gewünschten Ordner testen:
```
https://europe-west1-umzugsapp.cloudfunctions.net/checkEmails?folder=Anfragen&test=true&limit=10
```

### 3. Logs prüfen:
```bash
firebase functions:log --follow
```

## 📊 Was passiert beim Test-Import:

1. **Kunden werden angelegt mit**:
   - "[TEST]" vor dem Namen
   - Notiz: "TEST-IMPORT vom [Datum]"
   - Flag: `isTestImport: true`

2. **Angebote werden erstellt**:
   - Automatische Preisberechnung
   - Status: "draft"

3. **KEINE E-Mails werden gesendet**

4. **E-Mails bleiben ungelesen**

## 🔍 Ergebnisse prüfen:

### Firebase Console:
https://console.firebase.google.com/project/umzugsapp/firestore/data/~2Fcustomers

### Fehlgeschlagene E-Mails:
https://console.firebase.google.com/project/umzugsapp/firestore/data/~2FfailedEmails

## 💡 Tipps:

- Starten Sie mit wenigen E-Mails (limit=5)
- Prüfen Sie die Logs für Details
- Test-Kunden können später gelöscht werden
- Der Parser erkennt automatisch ImmoScout24 und Umzug365 E-Mails

## 🆘 Bei Problemen:

1. **"Ordner nicht gefunden"**: 
   - Prüfen Sie die Schreibweise (Groß-/Kleinschreibung beachten)
   - Nutzen Sie INBOX als Fallback

2. **"0 E-Mails verarbeitet"**:
   - Prüfen Sie ob E-Mails von ImmoScout24/Umzug365 vorhanden sind
   - Schauen Sie in die Logs für Details

3. **Fehler beim Parsing**:
   - E-Mails werden in "failedEmails" Collection gespeichert
   - Dort können Sie das Format analysieren