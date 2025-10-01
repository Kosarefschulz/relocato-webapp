# Projekt: Umzugsapp

## Technologie-Stack
- Frontend: React mit TypeScript
- Backend: Supabase (Edge Functions)
- Datenbank: Supabase (PostgreSQL)
- E-Mail: IONOS SMTP über Supabase Edge Functions
- Hosting: Vercel

## IONOS E-Mail-Konfiguration
- SMTP Server: smtp.ionos.de
- IMAP Server: imap.ionos.de
- Port SMTP: 587
- Port IMAP: 993 (SSL)
- E-Mail: bielefeld@relocato.de
- Authentifizierung: Wird über Supabase Edge Functions verwaltet

## Supabase Konfiguration
- Die App nutzt ausschließlich Supabase für:
  - Datenbank (PostgreSQL)
  - Authentifizierung
  - Edge Functions für E-Mail-Versand und -Empfang
  - Realtime Subscriptions
  - Storage für Dokumente und Bilder

## Wichtige Hinweise
- KEINE Firebase-Abhängigkeiten mehr im Projekt
- Alle E-Mail-Funktionen laufen über Supabase Edge Functions
- Lokale Entwicklung nutzt Proxy für E-Mail-Tests
- E-Mail-Service: `emailServiceIONOS.ts` nutzt Supabase Functions

## Supabase Edge Functions für E-Mail
- `send-email`: Sendet E-Mails über IONOS SMTP
- `email-list`: Listet E-Mails aus IMAP-Ordnern
- `email-folders`: Zeigt verfügbare E-Mail-Ordner
- `email-read`: Liest einzelne E-Mail
- `email-mark-read`: Markiert E-Mails als gelesen/ungelesen
- `email-delete`: Löscht E-Mails
- `email-move`: Verschiebt E-Mails zwischen Ordnern
- `email-star`: Markiert E-Mails mit Stern
- `email-search`: Durchsucht E-Mails

## MCP Supabase Server

### Installation für Claude Desktop
1. Server ist bereits installiert in: `/Users/sergejschulz/Downloads/relocato-webapp/mcp-supabase-server/`
2. Füge folgende Konfiguration zu Claude Desktop hinzu (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "supabase": {
      "command": "node",
      "args": ["/Users/sergejschulz/Downloads/relocato-webapp/mcp-supabase-server/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://kmxipuaqierjqaikuimi.supabase.co",
        "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteGlwdWFxaWVyanFhaWt1aW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MjU2NDUsImV4cCI6MjA2NjAwMTY0NX0.2S3cAnBh4zDFFQNpJ-VN17YrSJXyclyFjywN2izuPaU"
      }
    }
  }
}
```

3. Restart Claude Desktop

### Verfügbare MCP Tools:
- `test-connection` - Testet die Verbindung zu Supabase
- `list-customers` - Listet alle Kunden aus Supabase
- `count-customers` - Zählt alle Kunden in der Datenbank
- `get-customer` - Holt einen spezifischen Kunden
- `search-customers` - Sucht Kunden nach Name/Email/Telefon
- `import-customers-csv` - Importiert Kunden aus CSV-Datei
- `create-customer` - Erstellt einen neuen Kunden
- `delete-all-customers` - Löscht alle Kunden (Vorsicht!)

### Supabase Projekt Info:
- **Projekt URL**: https://kmxipuaqierjqaikuimi.supabase.co
- **Projekt ID**: kmxipuaqierjqaikuimi
- **Database**: PostgreSQL
- **Tabellen**: customers, quotes, invoices, share_links, email_history, calendar_events

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.