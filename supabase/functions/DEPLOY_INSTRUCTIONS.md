# Supabase Edge Functions Deployment für E-Mail

## 1. Umgebungsvariablen setzen

Führen Sie diese Befehle aus, um die IONOS E-Mail-Zugangsdaten zu konfigurieren:

```bash
# IONOS E-Mail Konfiguration
supabase secrets set IONOS_EMAIL=bielefeld@relocato.de
supabase secrets set IONOS_PASSWORD=IhrIONOSPasswort
supabase secrets set IONOS_SMTP_HOST=smtp.ionos.de
supabase secrets set IONOS_SMTP_PORT=587
supabase secrets set IONOS_IMAP_HOST=imap.ionos.de
supabase secrets set IONOS_IMAP_PORT=993
```

## 2. Edge Functions deployen

```bash
# Alle E-Mail Functions deployen
supabase functions deploy send-email
supabase functions deploy email-list
supabase functions deploy email-folders
supabase functions deploy email-read
supabase functions deploy email-mark-read
supabase functions deploy email-delete
supabase functions deploy email-move
supabase functions deploy email-star
supabase functions deploy email-search
```

## 3. Testen der Functions

### E-Mail senden testen:
```bash
curl -X POST https://[YOUR-PROJECT-REF].supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer [YOUR-ANON-KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test E-Mail",
    "content": "Dies ist eine Test-E-Mail von Relocato."
  }'
```

### E-Mail-Ordner abrufen:
```bash
curl -X GET https://[YOUR-PROJECT-REF].supabase.co/functions/v1/email-folders \
  -H "Authorization: Bearer [YOUR-ANON-KEY]"
```

## 4. Lokale Entwicklung

Für lokale Tests:

```bash
# Starten Sie die Functions lokal
supabase functions serve

# Testen Sie lokal
curl -X POST http://localhost:54321/functions/v1/send-email \
  -H "Authorization: Bearer [YOUR-ANON-KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test E-Mail",
    "content": "Test von lokaler Entwicklung"
  }'
```

## 5. Wichtige Hinweise

- **IONOS_PASSWORD**: Stellen Sie sicher, dass Sie Ihr tatsächliches IONOS-Passwort verwenden
- **CORS**: Die Functions sind bereits für CORS konfiguriert
- **Authentifizierung**: Die Functions verwenden Supabase Auth - stellen Sie sicher, dass Ihre App authentifiziert ist
- **Rate Limiting**: IONOS hat möglicherweise Rate Limits - beachten Sie diese bei der Nutzung

## 6. Fehlerbehebung

### Fehler: "IONOS_PASSWORD not configured"
→ Setzen Sie die Umgebungsvariable mit `supabase secrets set IONOS_PASSWORD=IhrPasswort`

### Fehler: "Connection refused"
→ Überprüfen Sie die SMTP/IMAP Ports und Hostnamen

### Fehler: "Authentication failed"
→ Überprüfen Sie Ihre IONOS-Zugangsdaten

## 7. Vollständige IMAP-Implementierung

Die aktuelle Implementierung von `email-list` gibt Mock-Daten zurück. Für eine vollständige IMAP-Integration müssten Sie eine Deno-kompatible IMAP-Bibliothek verwenden oder die IMAP-Kommunikation manuell implementieren.

## 8. Nächste Schritte

1. Setzen Sie die Umgebungsvariablen mit Ihrem echten IONOS-Passwort
2. Deployen Sie die Functions
3. Testen Sie die E-Mail-Funktionalität in Ihrer App
4. Überwachen Sie die Logs in der Supabase-Konsole