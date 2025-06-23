# Google Sheets Konfiguration

## Wichtige Umgebungsvariablen

Füge diese Variablen zu deiner `.env.local` Datei hinzu:

```env
# Google Sheets Configuration
REACT_APP_GOOGLE_SHEETS_ID=178tpFCNqmnDZxkzOfgWQCS6BW7wn2rYyTB3hZh8H7PU
REACT_APP_GOOGLE_SHEETS_API_KEY=dein_google_api_key_hier
```

## Google Sheets API Key erstellen

1. Gehe zu [Google Cloud Console](https://console.cloud.google.com/)
2. Erstelle ein neues Projekt oder wähle ein bestehendes
3. Aktiviere die "Google Sheets API"
4. Erstelle einen API Key unter "Credentials"
5. (Optional) Beschränke den API Key auf deine Domain

## Google Sheet Berechtigungen

Stelle sicher, dass dein Google Sheet öffentlich lesbar ist:
1. Öffne das Sheet
2. Klicke auf "Freigeben" (oben rechts)
3. Ändere zu "Jeder mit dem Link kann ansehen"

## Datenstruktur im Google Sheet

Das Sheet sollte folgende Tabs haben:
- **Kunden**: Kundendaten (A:Z)
- **Angebote**: Angebotsdaten (A:Z)
- **Rechnungen**: Rechnungsdaten (A:Z)

## Umschalten zwischen Firebase und Google Sheets

In `src/config/database.config.ts`:
- `USE_FIREBASE_PRIMARY = true` → Firebase als Datenquelle
- `USE_FIREBASE_PRIMARY = false` → Google Sheets als Datenquelle

Aktuell ist Google Sheets aktiviert!