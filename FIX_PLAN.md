# Fix-Plan für Umzugs-WebApp

## 🚨 Sofort zu behebende kritische Fehler

### 1. Token-URL Problem beheben

**Problem:** `window.location.origin` gibt in Produktion falsche URL zurück

**Lösung:**
```typescript
// tokenService.ts - Zeile 38-40
generateConfirmationUrl(token: string): string {
  const baseUrl = process.env.REACT_APP_BASE_URL || window.location.origin;
  return `${baseUrl}/quote-confirmation/${token}`;
}
```

**Vercel Environment Variable:**
```
REACT_APP_BASE_URL=https://umzugsapp.vercel.app
```

### 2. SMTP Konfiguration dokumentieren

**In .env.example hinzufügen:**
```env
# SMTP Configuration (Required for Email Sending)
REACT_APP_SMTP_HOST=smtp.ionos.de
REACT_APP_SMTP_PORT=587
REACT_APP_SMTP_SECURE=false
REACT_APP_SMTP_USER=your_smtp_user@domain.de
REACT_APP_SMTP_PASS=your_smtp_password
REACT_APP_SMTP_FROM=noreply@domain.de

# Base URL for Email Links
REACT_APP_BASE_URL=https://your-domain.vercel.app

# API Backend for Email Sending
REACT_APP_API_URL=https://api.ruempel-schmiede.com
```

### 3. EmailComposer Fix

**Problem:** EmailComposer ist nur ein Dummy-Component

**Quick Fix:** Redirect zu SMTP Service
```typescript
// In CustomerQuotes.tsx
// Zeile 316: setEmailComposerOpen(true);
// Ersetzen durch:
const handleEmailQuote = async (quote: Quote) => {
  // Direkt SMTP Service verwenden statt EmailComposer
  const token = tokenService.generateQuoteToken(quote);
  const confirmationUrl = tokenService.generateConfirmationUrl(token);
  
  const pdfBlob = await generatePDF(customer, quote);
  const emailData = {
    to: customer.email,
    subject: `Ihr Umzugsangebot von Relocato`,
    content: `...`, // Template wie in Zeile 360
    attachments: [{
      filename: `Angebot_${customer.name.replace(/\s+/g, '_')}.pdf`,
      content: pdfBlob
    }],
    customerId: customer.id,
    customerName: customer.name,
    templateType: 'quote_sent'
  };
  
  const sent = await sendEmailViaSMTP(emailData);
  // ... rest of the logic
};
```

## 📋 Vercel Deployment Checklist

### Environment Variables zu setzen:
- [ ] `REACT_APP_BASE_URL` - Ihre Produktions-URL
- [ ] `REACT_APP_SMTP_HOST` - SMTP Server
- [ ] `REACT_APP_SMTP_PORT` - SMTP Port (587)
- [ ] `REACT_APP_SMTP_SECURE` - false für Port 587
- [ ] `REACT_APP_SMTP_USER` - SMTP Benutzername
- [ ] `REACT_APP_SMTP_PASS` - SMTP Passwort
- [ ] `REACT_APP_SMTP_FROM` - Absender E-Mail
- [ ] `REACT_APP_API_URL` - Backend API URL
- [ ] `REACT_APP_USE_VERCEL` - true (wenn Vercel Platform verwendet wird)

### Firebase Configuration (falls verwendet):
- [ ] `REACT_APP_FIREBASE_API_KEY`
- [ ] `REACT_APP_FIREBASE_AUTH_DOMAIN`
- [ ] `REACT_APP_FIREBASE_PROJECT_ID`
- [ ] `REACT_APP_FIREBASE_STORAGE_BUCKET`
- [ ] `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `REACT_APP_FIREBASE_APP_ID`

## 🔧 Mittelfristige Fixes

### 4. E-Mail Rechnungserkennung Persistenz
- Google Sheets Integration für EmailInvoice Storage
- Neue Sheet-Tabs: "EmailInvoices", "RecognitionRules"

### 5. Vereinheitlichung der E-Mail Services
- Entscheidung für einen E-Mail Service
- Entfernen der ungenutzten Implementierungen
- Klare Dokumentation welcher Service wann verwendet wird

### 6. Error Handling verbessern
- Try-Catch Blöcke mit User-freundlichen Fehlermeldungen
- Error Boundaries für React Components
- Logging Service für Produktion

## 📊 Test-Prozedur nach Fixes

1. **Lokaler Test:**
   - .env.local mit Test-Konfiguration erstellen
   - E-Mail an Test-Account senden
   - Link in E-Mail prüfen
   - Kundenportal testen

2. **Staging Test:**
   - Vercel Preview Deployment
   - Environment Variables setzen
   - Vollständiger Workflow Test

3. **Produktions-Deployment:**
   - Alle Environment Variables prüfen
   - Monitoring einrichten
   - Test mit echtem Kunden-Account

## 🚀 Deployment-Befehl

```bash
# Nach allen Fixes
git add .
git commit -m "fix: Critical email and token URL issues"
git push

# Vercel deployed automatisch
```