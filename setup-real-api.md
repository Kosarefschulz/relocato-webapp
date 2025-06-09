# Google Sheets API Setup für echte Daten

## 1. Google Cloud Console - API Key erstellen

### Schritt 1: Projekt wählen/erstellen
1. Gehen Sie zu: https://console.cloud.google.com/
2. Wählen Sie Ihr Projekt "umzugs-app" oder erstellen Sie ein neues

### Schritt 2: Google Sheets API aktivieren
1. Gehen Sie zu: APIs & Services → Library
2. Suchen Sie "Google Sheets API"
3. Klicken Sie "Aktivieren"

### Schritt 3: API-Schlüssel erstellen
1. Gehen Sie zu: APIs & Services → Credentials
2. Klicken Sie "Anmeldedaten erstellen" → "API-Schlüssel"
3. **Kopieren Sie den API-Schlüssel** (z.B. `AIzaSyC...`)
4. Klicken Sie auf "Schlüssel beschränken"
5. Wählen Sie "API-Schlüssel beschränken"
6. Bei "API-Beschränkungen": Wählen Sie "Google Sheets API"
7. Klicken Sie "Speichern"

## 2. Google Sheets Freigabe

### Spreadsheet öffentlich machen (Option 1 - Einfach)
1. Öffnen Sie Ihr Spreadsheet: https://docs.google.com/spreadsheets/d/178tpFCNqmnDZxkzOfgWQCS6BW7wn2rYyTB3hZh8H7PU
2. Klicken Sie "Freigeben"
3. Wählen Sie "Jeder mit dem Link kann das Dokument ansehen"
4. Klicken Sie "Fertig"

### Oder: Spezifische Freigabe (Option 2 - Sicherer)
1. Klicken Sie "Freigeben"
2. Geben Sie eine Email-Adresse ein (die für die API verwendet wird)
3. Wählen Sie "Betrachter"
4. Klicken Sie "Senden"

## 3. API-Schlüssel in die App einsetzen

### In .env Datei:
```
REACT_APP_GOOGLE_SHEETS_API_KEY=IHR_ECHTER_API_SCHLUESSEL_HIER
```

### Beispiel:
```
REACT_APP_GOOGLE_SHEETS_API_KEY=AIzaSyC1234567890abcdefghijklmnopqrstuvwxyz
```

## 4. Test

Nach dem Setup können Sie testen:
1. App neu starten: `npm start`
2. Konsole öffnen (F12)
3. "Kunde suchen" aufrufen
4. Schauen Sie in die Konsole für API-Logs

## Troubleshooting

### Fehler: "API key not valid"
- Überprüfen Sie den API-Schlüssel
- Stellen Sie sicher, dass Google Sheets API aktiviert ist

### Fehler: "The caller does not have permission"
- Spreadsheet muss öffentlich freigegeben sein
- Oder Service Account email zur Freigabe hinzufügen

### Keine Daten zurück
- Überprüfen Sie die Spalten in Ihrem Sheet
- Erste Zeile sollte Header enthalten
- Daten ab Zeile 2

## Nützliche Links

- Google Cloud Console: https://console.cloud.google.com/
- Ihr Spreadsheet: https://docs.google.com/spreadsheets/d/178tpFCNqmnDZxkzOfgWQCS6BW7wn2rYyTB3hZh8H7PU
- Google Sheets API Docs: https://developers.google.com/sheets/api