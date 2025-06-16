# E-Mail Parser Setup - Schritt für Schritt

## 🚀 So ersetzen Sie Zapier durch Firebase Functions

### Schritt 1: Firebase Functions aktivieren
```bash
# Im Hauptverzeichnis Ihrer App
firebase init functions

# Wählen Sie:
# - JavaScript
# - ESLint: Yes
# - Install dependencies: Yes
```

### Schritt 2: Firebase auf Blaze Plan upgraden
- Gehen Sie zu: https://console.firebase.google.com/u/0/project/umzugsapp/usage/details
- Klicken Sie auf "Upgrade"
- Wählen Sie "Blaze" (Pay as you go)
- **Kosten**: Nur was Sie nutzen (~€0-10/Monat bei 300 E-Mails)

### Schritt 3: SendGrid Account erstellen (KOSTENLOS)
1. Gehen Sie zu: https://signup.sendgrid.com/
2. Erstellen Sie einen kostenlosen Account
3. Verifizieren Sie Ihre E-Mail

### Schritt 4: SendGrid Inbound Parse einrichten
1. In SendGrid Dashboard → Settings → Inbound Parse
2. "Add Host & URL"
3. Einstellungen:
   - **Subdomain**: parse
   - **Domain**: relocato.de (oder Ihre Domain)
   - **Destination URL**: https://us-central1-umzugsapp.cloudfunctions.net/receiveEmail
4. Speichern

### Schritt 5: DNS-Einträge bei IONOS hinzufügen
Fügen Sie diese MX-Records hinzu:
```
parse.relocato.de    MX    10    mx.sendgrid.net
```

### Schritt 6: E-Mail-Weiterleitung einrichten
Bei IONOS:
1. E-Mail-Verwaltung öffnen
2. Neue Weiterleitung:
   - **Von**: anfragen@relocato.de
   - **An**: parse@parse.relocato.de

### Schritt 7: Functions deployen
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### Schritt 8: Testen
Senden Sie eine Test-E-Mail an anfragen@relocato.de mit diesem Format:
```
Betreff: Umzugsanfrage von ImmoScout24

Kontaktname: Max Mustermann
Telefon: 0171 1234567
E-Mail: max@example.com
Umzugsdatum: 15.03.2024
Von: Berliner Str. 123, 10115 Berlin
Nach: Hamburger Str. 456, 20095 Hamburg
Zimmeranzahl: 3
Wohnfläche: 85 m²
Etage: 2
```

## 📊 Monitoring

### Funktion Logs anzeigen:
```bash
firebase functions:log
```

### In Firebase Console:
- Functions → Logs
- Firestore → Neue Kunden sollten erscheinen

## 🔧 Anpassungen

### Neue E-Mail-Quelle hinzufügen:
Bearbeiten Sie `functions/emailParser.js`:
```javascript
ebay_kleinanzeigen: {
  patterns: {
    name: [/Interessent:\s*(.+?)(?:\n|$)/i],
    // ... weitere Pattern
  }
}
```

### E-Mail-Template anpassen:
In `functions/index.js` → `sendWelcomeEmail()`

## 💡 Tipps

1. **Testmodus**: Nutzen Sie Firebase Emulator für lokales Testen
   ```bash
   firebase emulators:start
   ```

2. **Backup**: Fehlgeschlagene E-Mails werden in `failedEmails` Collection gespeichert

3. **Kosten sparen**: 
   - SendGrid Free Tier: 100 E-Mails/Tag kostenlos
   - Firebase Functions: 2 Mio. Aufrufe/Monat kostenlos

## 🚨 Troubleshooting

### E-Mails kommen nicht an:
1. Prüfen Sie MX-Records: `nslookup -type=mx parse.relocato.de`
2. SendGrid Activity Feed prüfen
3. Firebase Functions Logs prüfen

### Parser erkennt Felder nicht:
1. Beispiel-E-Mail in `failedEmails` Collection suchen
2. Pattern in `emailParser.js` anpassen
3. Mit Regex-Tester testen: https://regex101.com/

## 📈 Vorteile gegenüber Zapier

| Feature | Zapier | Firebase Functions |
|---------|--------|-------------------|
| Kosten/Monat | €50-200 | €0-10 |
| E-Mails/Monat | 750-2000 | Unbegrenzt |
| Anpassbarkeit | Begrenzt | Vollständig |
| Geschwindigkeit | 1-15 Min | Sofort |
| Datenhoheit | Extern | Bei Ihnen |

## 🎯 Geschafft!

Ihre E-Mail-Pipeline läuft jetzt:
1. Kunde sendet Anfrage → ImmoScout24/Umzug365
2. E-Mail → anfragen@relocato.de
3. Weiterleitung → parse@parse.relocato.de
4. SendGrid → Firebase Function
5. Parse & Speichern → Firestore
6. Automatisches Angebot → Erstellt
7. Willkommens-E-Mail → Versendet

**Ersparnis: €40-190/Monat** 🎉