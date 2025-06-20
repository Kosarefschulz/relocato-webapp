# Test Email Functions

Diese Firebase Functions wurden erstellt, um Test-E-Mails direkt in die Firestore `emailClient` Collection einzufügen. Dies ist eine temporäre Lösung zum Testen der E-Mail-Anzeige, während wir das IMAP-Sync-Problem debuggen.

## Verfügbare Funktionen

### 1. addTestEmails
Fügt 10 Test-E-Mails mit verschiedenen Eigenschaften hinzu:
- Verschiedene Ordner (INBOX, Sent, Drafts, Trash)
- Verschiedene Flags (gelesen, ungelesen, markiert, etc.)
- Mit und ohne Anhänge
- Verschiedene E-Mail-Typen (Anfragen, Beschwerden, Danksagungen, etc.)

**URL (Production):**
```
https://europe-west1-umzugsapp.cloudfunctions.net/addTestEmails
```

### 2. clearTestEmails
Löscht alle Test-E-Mails aus der Collection (nur die mit `testEmail: true` markierten).

**URL (Production):**
```
https://europe-west1-umzugsapp.cloudfunctions.net/clearTestEmails
```

## Lokales Testen

1. Firebase Functions lokal starten:
```bash
cd functions
npm run serve
```

2. In einem anderen Terminal:
```bash
# Test-E-Mails hinzufügen
node testEmailClient.js add

# Test-E-Mails löschen
node testEmailClient.js clear
```

## Direkte URLs für Production

### Test-E-Mails hinzufügen:
```bash
curl https://europe-west1-umzugsapp.cloudfunctions.net/addTestEmails
```

### Test-E-Mails löschen:
```bash
curl https://europe-west1-umzugsapp.cloudfunctions.net/clearTestEmails
```

## Test-E-Mail Eigenschaften

Die Test-E-Mails enthalten:
- **Normale Kundenanfragen** (INBOX)
- **Gesendete E-Mails** (Sent)
- **Entwürfe** (Drafts)
- **Gelöschte E-Mails** (Trash)
- **E-Mails mit Anhängen**
- **Markierte/Wichtige E-Mails**
- **Beschwerden und positive Rückmeldungen**

Alle Test-E-Mails sind mit `testEmail: true` markiert, sodass sie leicht identifiziert und gelöscht werden können.