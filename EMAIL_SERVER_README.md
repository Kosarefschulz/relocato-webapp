# Local Email Server für IONOS E-Mails

Dieses Setup ermöglicht es, echte E-Mails von IONOS während der lokalen Entwicklung zu laden.

## Installation

1. **Installiere die Email-Server-Abhängigkeiten:**
   ```bash
   npm install express cors imap mailparser dotenv --save-dev
   ```

## Konfiguration

1. **Erstelle eine `.env` Datei** im Root-Verzeichnis mit deinen IONOS-Zugangsdaten:
   ```env
   REACT_APP_EMAIL_USERNAME=deine-email@ionos.de
   REACT_APP_EMAIL_PASSWORD=dein-passwort
   REACT_APP_IMAP_SERVER=mail.ionos.de
   REACT_APP_IMAP_PORT=993
   ```

   ⚠️ **WICHTIG**: Füge `.env` zu deiner `.gitignore` hinzu, um deine Zugangsdaten nicht zu committen!

## Verwendung

1. **Starte den Email-Server** in einem Terminal:
   ```bash
   node src/localEmailServer.js
   ```
   
   Der Server läuft auf `http://localhost:3002`

2. **Starte die React-App** in einem anderen Terminal:
   ```bash
   npm start
   ```

3. **Öffne den Email-Client** unter `http://localhost:3001/email-client`

## Wie es funktioniert

1. Der lokale Email-Server verbindet sich direkt mit dem IONOS IMAP-Server
2. Er ruft die echten E-Mails ab und stellt sie über eine lokale API bereit
3. Der React-Proxy leitet Email-Anfragen an den lokalen Server weiter
4. Falls der lokale Server nicht läuft, werden Mock-Daten verwendet

## Fehlerbehebung

### "Email credentials not configured"
- Stelle sicher, dass die `.env` Datei existiert und die korrekten Zugangsdaten enthält

### "Connection timeout"
- Überprüfe deine Internetverbindung
- Stelle sicher, dass die IONOS-Zugangsdaten korrekt sind
- Prüfe, ob deine Firewall den Zugriff auf Port 993 (IMAP) erlaubt

### Keine E-Mails werden angezeigt
1. Prüfe die Konsole des Email-Servers für Fehlermeldungen
2. Stelle sicher, dass E-Mails im IONOS-Postfach vorhanden sind
3. Versuche die Seite zu aktualisieren (F5)

## Sicherheitshinweise

- **Niemals** die `.env` Datei mit echten Zugangsdaten committen
- Verwende App-spezifische Passwörter wenn möglich
- Der lokale Server ist nur für die Entwicklung gedacht