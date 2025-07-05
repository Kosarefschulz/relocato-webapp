# Email Proxy Server für Relocato

Dieser Server ermöglicht den IMAP-Zugriff auf IONOS E-Mails, da Supabase Edge Functions Netzwerkbeschränkungen haben.

## Installation

1. Kopieren Sie diesen Ordner auf Ihren Server
2. Installieren Sie die Abhängigkeiten:
   ```bash
   npm install
   ```

3. Erstellen Sie eine `.env` Datei:
   ```bash
   cp .env.example .env
   ```

4. Fügen Sie Ihr IONOS Passwort in die `.env` Datei ein:
   ```
   IONOS_PASSWORD=IhrPasswort
   ```

5. Starten Sie den Server:
   ```bash
   npm start
   ```

## Verwendung

Der Server läuft standardmäßig auf Port 3001 und bietet folgende Endpoints:

- `POST /api/emails/list` - Listet E-Mails auf
- `POST /api/emails/read` - Liest eine einzelne E-Mail
- `GET /health` - Health Check

## Sicherheit

- Stellen Sie sicher, dass der Server nur von Ihrem Supabase-Projekt aus erreichbar ist
- Verwenden Sie HTTPS in der Produktion
- Halten Sie die `.env` Datei geheim

## Mit PM2 ausführen (empfohlen)

```bash
npm install -g pm2
pm2 start index.js --name email-proxy
pm2 save
pm2 startup
```