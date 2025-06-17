# Import ALLER Kunden - Anleitung

## Problem
Die bisherige Import-Funktion `importAllEmails` hat mehrere Einschränkungen:

1. **Batch-Limitierung**: Nur 100 E-Mails pro Aufruf
2. **Duplikat-Filter**: Überspringt Kunden mit gleicher E-Mail-Adresse
3. **Manuelle Pagination**: Muss mehrfach mit verschiedenen `startFrom` Werten aufgerufen werden
4. **Fehlende Kunden**: Bei 1200+ E-Mails fehlen viele Kunden

## Lösung: importAllCustomers

Die neue Funktion `importAllCustomers` importiert ALLE Kunden ohne Einschränkungen:

- ✅ Keine Batch-Limits - importiert alle E-Mails auf einmal
- ✅ Importiert auch Duplikate (können später manuell gelöscht werden)
- ✅ Eindeutige Kundennummern für jeden Import
- ✅ Bessere Fehlerbehandlung
- ✅ Detaillierte Statistiken

## Deployment

1. **Functions deployen:**
   ```bash
   cd functions
   firebase deploy --only functions:importAllCustomers
   ```

2. **Import starten:**
   ```
   https://europe-west1-umzugsapp.cloudfunctions.net/importAllCustomers
   ```

## Was passiert beim Import?

1. Verbindet sich mit dem IMAP-Server
2. Öffnet den Ordner "erfolgreich verarbeitete Anfragen"
3. Lädt ALLE E-Mails (keine Limits!)
4. Parst jede E-Mail und erstellt Kundendaten
5. Importiert JEDEN Kunden (auch Duplikate)
6. Generiert eindeutige Kundennummern
7. Erstellt automatische Angebote

## Erwartete Ergebnisse

Bei 1200+ E-Mails:
- Alle 1200+ Kunden werden importiert
- Inklusive der 141 Duplikate
- Jeder bekommt eine eindeutige Kundennummer
- Format: `K202412XXXX_RANDOM`

## Nach dem Import

1. **Duplikate prüfen:**
   - Die Funktion zeigt an, welche E-Mail-Adressen mehrfach vorkommen
   - Diese können in der App manuell geprüft und ggf. gelöscht werden

2. **Statistiken:**
   ```json
   {
     "total": 1200,
     "imported": 1200,
     "duplicates": 141,
     "failed": 0,
     "skippedNoName": 5
   }
   ```

## Diagnose-Tools

**Vor dem Import analysieren:**
```bash
node analyzeImportIssues.js
```

**Detaillierte Diagnose:**
```bash
node testImportDiagnostics.js
```

## Wichtige Hinweise

- Die Funktion hat ein 9-Minuten Timeout
- 4GB Memory für große Datenmengen
- Importiert wirklich ALLE Kunden
- Duplikate bekommen eigene Kundennummern
- Keine E-Mails werden übersprungen (außer ohne Namen)

## Support

Bei Fragen oder Problemen:
- Logs prüfen: `firebase functions:log`
- Statistiken im Response prüfen
- Diagnose-Tools verwenden