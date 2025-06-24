# MCP Google Sheets Authentication Setup

## Problem
Der MCP Server gibt den Fehler: "UNAUTHENTICATED: Request had invalid authentication credentials"

## Lösung: Service Account einrichten

### 1. Google Cloud Console öffnen
- Gehen Sie zu: https://console.cloud.google.com/
- Wählen Sie Ihr Projekt "umzugsapp" aus

### 2. Service Account erstellen
1. Navigieren Sie zu "IAM & Admin" → "Service Accounts"
2. Klicken Sie auf "CREATE SERVICE ACCOUNT"
3. Name: `mcp-sheets-access`
4. Beschreibung: `Service Account for MCP Google Sheets access`
5. Klicken Sie auf "CREATE AND CONTINUE"

### 3. Berechtigungen zuweisen
- Rolle: "Editor" oder spezifisch "Google Sheets API Editor"
- Klicken Sie auf "CONTINUE"

### 4. Schlüssel erstellen
1. Klicken Sie auf "CREATE KEY"
2. Wählen Sie "JSON"
3. Die JSON-Datei wird heruntergeladen

### 5. Google Sheets API aktivieren
1. Gehen Sie zu "APIs & Services" → "Library"
2. Suchen Sie nach "Google Sheets API"
3. Klicken Sie auf "ENABLE"

### 6. Service Account zu Google Sheet hinzufügen
1. Öffnen Sie Ihr Google Sheet (ID: 178tpFCNqmnDZxkzOfgWQCS6BW7wn2rYyTB3hZh8H7PU)
2. Klicken Sie auf "Freigeben"
3. Fügen Sie die Service Account E-Mail hinzu (endet mit @umzugsapp.iam.gserviceaccount.com)
4. Geben Sie "Editor"-Rechte

### 7. MCP Server konfigurieren
Die Service Account JSON-Datei muss im MCP Server als Umgebungsvariable oder Konfigurationsdatei hinterlegt werden:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

Oder in der MCP-Konfiguration:
```json
{
  "servers": {
    "gdrive": {
      "command": "mcp-server-gdrive",
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "/path/to/service-account-key.json"
      }
    }
  }
}
```

## Alternative: OAuth2 Token
Falls Sie einen OAuth2 Token verwenden möchten:

1. Erstellen Sie OAuth2 Credentials in der Google Cloud Console
2. Führen Sie den OAuth2 Flow durch
3. Speichern Sie den Access Token
4. Konfigurieren Sie MCP mit dem Token

## Kundenimport-Daten für MCP

Nach erfolgreicher Authentifizierung können diese Kunden importiert werden:

### Carolina Klein
- Telefon: 0177 5305094
- Umzugsdatum: 17.07.2025
- Von: Viktoriastraße 27, Bielefeld (3. OG ohne Fahrstuhl)
- Nach: Obernstraße 1, Bielefeld (4. OG mit Fahrstuhl)
- Preis: 1.900 €

### Doris Mattson
- Telefon: 0170 1120639
- Umzugsdatum: 18.07.2025
- Von: Alte Verler Straße 22, Sennestadt, Bielefeld
- Nach: Solmser Weg 13, 61169 Friedberg (Hessen), EG
- Preis: 2.897 €

### Lars Schuerstedt
- Telefon: 0157 39103228
- Umzugsdatum: 18.07.2025
- Adresse: An der Else 11, Kirchlengern
- Preis: 5.498,10 €

### André Fischer
- Email: Mdivani.irma@gmail.com
- Umzugsdatum: 19.07.2025
- Von: Landerweg 23, Oerlinghausen (EG, 86 qm)
- Nach: Stukenbrocker Weg 7, 33813 Oerlinghausen (1. OG)
- Preis: 980 €