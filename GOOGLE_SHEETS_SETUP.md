# Google Sheets Integration Setup

## 1. Google Sheets API aktivieren

1. Gehe zu [Google Cloud Console](https://console.cloud.google.com)
2. Erstelle ein neues Projekt oder wähle ein bestehendes
3. Aktiviere die "Google Sheets API"
4. Erstelle Credentials (API-Key)

## 2. Spreadsheet erstellen

### Erstelle ein neues Google Sheet mit 2 Tabs:

**Tab 1: "Kunden"**
Header in Zeile 1:
```
ID | Name | Email | Telefon | Umzugsdatum | Von Adresse | Nach Adresse | Zimmer | Fläche | Stockwerk | Aufzug | Services | Notizen
```

**Tab 2: "Angebote"**  
Header in Zeile 1:
```
ID | Kunden-ID | Kundenname | Preis | Kommentar | Erstellt am | Erstellt von | Status
```

## 3. Umgebungsvariablen konfigurieren

Bearbeite die `.env` Datei:

```env
REACT_APP_GOOGLE_SHEETS_API_KEY=dein_api_key_hier
REACT_APP_GOOGLE_SHEETS_ID=deine_spreadsheet_id_hier
```

### Spreadsheet ID finden:
In der URL deines Google Sheets:
`https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit`

## 4. Berechtigungen setzen

1. Öffne dein Google Sheet
2. Klicke "Teilen" 
3. Ändere zu "Jeder mit dem Link kann bearbeiten"
4. Oder teile mit der spezifischen Email-Adresse

## 5. Test der Integration

1. Starte die App: `npm start`
2. Erstelle einen neuen Kunden
3. Prüfe, ob er im Google Sheet erscheint
4. Erstelle ein Angebot
5. Prüfe, ob es im "Angebote" Tab erscheint

## Fallback-Verhalten

Wenn Google Sheets nicht konfiguriert ist:
- App verwendet Mock-Daten
- Alle Funktionen bleiben verfügbar
- Nur lokale Speicherung (Console-Logs)

## Troubleshooting

**"API not enabled"**: Google Sheets API in Cloud Console aktivieren
**"Permission denied"**: Sheet-Berechtigungen prüfen  
**"Invalid API key"**: API-Key in .env korrekt setzen
**"Spreadsheet not found"**: Spreadsheet-ID prüfen