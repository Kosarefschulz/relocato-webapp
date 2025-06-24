# Relocato MCP Server

Ein Model Context Protocol (MCP) Server für die Relocato Umzugs-WebApp, der es Claude Desktop ermöglicht, direkt mit Firebase zu interagieren.

## Features

- **Kunden aus Bildern erstellen**: Automatische Texterkennung (OCR) und Datenextraktion
- **Kunden verwalten**: Erstellen, suchen, aktualisieren
- **Automatische Angebotserstellung**: Bei jeder Kundenerstellung
- **Telefonnummern-Formatierung**: Automatische Korrektur deutscher Telefonnummern

## Installation

1. Dependencies installieren:
```bash
cd mcp-server
npm install
```

2. Firebase Service Account einrichten:
   - Kopiere `serviceAccountKey.json` ins Hauptverzeichnis
   - Oder setze den Pfad in `.env`:
   ```
   FIREBASE_SERVICE_ACCOUNT_PATH=/pfad/zu/serviceAccountKey.json
   ```

3. TypeScript kompilieren:
```bash
npm run build
```

## Claude Desktop Konfiguration

Füge folgendes zu deiner Claude Desktop Konfiguration hinzu:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "relocato": {
      "command": "node",
      "args": ["/Users/sergejschulz/Desktop/main/umzugs-webapp/mcp-server/dist/index.js"],
      "env": {
        "FIREBASE_SERVICE_ACCOUNT_PATH": "/Users/sergejschulz/Desktop/main/umzugs-webapp/serviceAccountKey.json"
      }
    }
  }
}
```

## Verwendung in Claude Desktop

### Kunde aus Bild erstellen
```
Erstelle einen Kunden aus dem Bild /pfad/zum/bild.png
```

### Kunde manuell erstellen
```
Erstelle einen neuen Kunden:
Name: Max Mustermann
Telefon: 0521 123456
Email: max@example.com
Von: Alte Straße 1, 33602 Bielefeld
Nach: Neue Straße 2, 33602 Bielefeld
Umzugstermin: 15.07.2025
```

### Kunden suchen
```
Suche nach Kunden mit Namen "Müller"
```

### Kunde aktualisieren
```
Aktualisiere Kunde K202506123 mit neuer Telefonnummer: 0521 654321
```

## Tools

- `create_customer`: Kunde manuell erstellen
- `create_customer_from_image`: Kunde aus Bild erstellen (OCR)
- `list_customers`: Kunden auflisten
- `search_customers`: Kunden suchen
- `get_customer`: Einzelnen Kunden abrufen
- `update_customer`: Kunde aktualisieren

## Entwicklung

```bash
# Development mit Auto-Reload
npm run dev

# Build für Production
npm run build

# Start Production Server
npm start
```