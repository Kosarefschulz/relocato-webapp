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

### Supabase Access Token
- Service Role Key: `sbp_61d622f70f2d7c18c14719897bf6d16755606a9e`
- Verwendung: Für administrative Aufgaben wie Storage Bucket Erstellung
- WICHTIG: Dieser Token hat volle Admin-Rechte, nur für Backend/Admin-Tasks verwenden!

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

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.