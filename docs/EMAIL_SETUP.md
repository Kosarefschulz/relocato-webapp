# E-Mail System Setup für Relocato

## Vollständige Online-Lösung ohne zusätzliche Server

### 1. Datenbank-Tabellen erstellen

Gehen Sie zum Supabase Dashboard:
1. Öffnen Sie: https://supabase.com/dashboard/project/kmxipuaqierjqaikuimi/sql
2. Führen Sie das SQL-Script aus: `/supabase/migrations/20240108_emails_table.sql`

### 2. E-Mail-Weiterleitung einrichten

Da IONOS keine direkte IMAP-API bietet und Supabase Edge Functions keine IMAP-Verbindungen erlauben, nutzen wir E-Mail-Weiterleitung:

#### Option A: IONOS E-Mail-Weiterleitung (Empfohlen)
1. Loggen Sie sich bei IONOS ein
2. Gehen Sie zu E-Mail → E-Mail-Adressen
3. Klicken Sie auf `bielefeld@relocato.de`
4. Richten Sie eine Weiterleitung ein zu einem Service, der Webhooks unterstützt

#### Option B: Zapier Integration (Kostenlos bis 100 E-Mails/Monat)
1. Erstellen Sie einen kostenlosen Zapier Account
2. Erstellen Sie einen neuen Zap:
   - Trigger: "Email by Zapier" (Sie bekommen eine eigene E-Mail-Adresse)
   - Action: "Webhooks by Zapier" → POST
   - URL: `https://kmxipuaqierjqaikuimi.supabase.co/functions/v1/email-webhook`
   - Headers:
     ```
     Authorization: Bearer YOUR_ANON_KEY
     Content-Type: application/json
     ```
   - Data: Pass through all email fields

3. Leiten Sie E-Mails von IONOS an die Zapier-E-Mail weiter

#### Option C: IFTTT Integration (Kostenlos)
1. Erstellen Sie einen IFTTT Account
2. Erstellen Sie ein Applet:
   - IF: "Email" → "Send IFTTT an email"
   - THEN: "Webhooks" → "Make a web request"
   - URL: `https://kmxipuaqierjqaikuimi.supabase.co/functions/v1/email-webhook`
   - Method: POST
   - Content Type: application/json
   - Body:
     ```json
     {
       "subject": "{{Subject}}",
       "from_email": "{{FromAddress}}",
       "body_text": "{{Body}}",
       "date": "{{ReceivedAt}}"
     }
     ```

### 3. E-Mail-Versand testen

Der E-Mail-Versand funktioniert bereits über IONOS SMTP und speichert automatisch in der Datenbank.

### 4. System aktivieren

1. Die App versucht zuerst E-Mails aus der Datenbank zu laden
2. Falls keine E-Mails vorhanden sind, versucht sie IMAP (was fehlschlagen wird)
3. Sobald E-Mails über Webhooks ankommen, werden sie in der Datenbank gespeichert und angezeigt

### Vorteile dieser Lösung:
- ✅ Keine zusätzlichen Server nötig
- ✅ Funktioniert komplett online
- ✅ E-Mails werden dauerhaft gespeichert
- ✅ Schnellere Ladezeiten (Datenbank statt IMAP)
- ✅ Volltextsuche möglich
- ✅ Backup aller E-Mails

### Test-E-Mail senden

Um das System zu testen:
1. Gehen Sie zu `/email-test-complete`
2. Senden Sie eine Test-E-Mail
3. Die E-Mail wird automatisch in der "Sent" Folder gespeichert
4. Eingehende E-Mails erscheinen im "INBOX" sobald die Weiterleitung aktiv ist