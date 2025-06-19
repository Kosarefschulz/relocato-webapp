# 📧 RELOCATO® Email Integration Guide

## 🚀 Schnellstart

### Option 1: Brevo (Empfohlen - 9000 kostenlose Emails/Monat)

1. **Kostenlosen Account erstellen**: https://www.brevo.com
2. **API Key generieren**: Settings → API Keys → Generate new API key
3. **In Vercel hinzufügen**: 
   ```
   BREVO_API_KEY=your-api-key-here
   ```
4. **Endpoint nutzen**: `/api/email-brevo`

### Option 2: IONOS SMTP (Bereits konfiguriert)

Die IONOS Credentials sind bereits in Vercel gesetzt:
- Email: bielefeld@relocato.de
- Password: Bicm1308
- Endpoint: `/api/email-smart` (nutzt automatisch IONOS oder Brevo)

## 📋 Verfügbare Endpoints

### 1. `/api/simple-test` (GET/POST)
- Testet ob API Routes funktionieren
- Keine externe Dependencies
- Zeigt Environment Variables Status

### 2. `/api/email-smart` (POST)
- Intelligenter Email Service mit Fallback
- Versucht: IONOS → Brevo → Mock
- Automatische Fehlerbehandlung

### 3. `/api/email-brevo` (POST)
- Direkte Brevo API Integration
- 9000 kostenlose Emails/Monat
- Keine Kreditkarte erforderlich

### 4. `/api/email-test-async` (POST)
- IONOS SMTP mit async/await
- Port 587 mit STARTTLS
- Detaillierte Fehlerausgabe

## 🔧 Beispiel-Requests

### Test ob API funktioniert:
```bash
curl https://relocato-app.vercel.app/api/simple-test
```

### Email senden (Smart Service):
```javascript
fetch('https://relocato-app.vercel.app/api/email-smart', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: 'kunde@example.com',
    subject: 'Ihr Umzugsangebot',
    html: '<h1>Willkommen bei RELOCATO®</h1>'
  })
})
```

## 🛠️ Troubleshooting

### Problem: API gibt HTML zurück
**Lösung**: 
1. Vercel Dashboard → Settings → Deployment Protection → Vercel Authentication deaktivieren
2. Cache leeren und neu deployen

### Problem: SMTP Timeout
**Lösung**: 
- Nutzen Sie `/api/email-brevo` statt SMTP
- Brevo hat keine SMTP-Beschränkungen

### Problem: Environment Variables nicht gefunden
**Lösung**:
```bash
vercel env add BREVO_API_KEY
vercel env pull
vercel --prod
```

## 📊 Email Service Vergleich

| Service | Kostenlose Emails | Kreditkarte | Setup Zeit |
|---------|------------------|-------------|------------|
| Brevo | 9000/Monat | Nein | 5 Min |
| SMTP2Go | 1000/Monat | Nein | 10 Min |
| SendGrid | 100/Tag | Nein* | 15 Min |
| IONOS | Unbegrenzt** | Ja | Fertig |

*SendGrid limitiert Features ohne Kreditkarte
**Mit Ihrem bestehenden IONOS Account

## 🎯 Empfehlung

Für sofortigen Start:
1. Nutzen Sie `/api/email-smart` - es funktioniert automatisch
2. Für mehr Emails: Brevo Account erstellen (5 Minuten)
3. Für Production: Firebase Functions als Backend

## 📞 Support

Bei Fragen:
- Email: sergej.schulz@relocato.de
- GitHub Issues: [Link zum Repo]