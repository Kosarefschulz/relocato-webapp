# E-Mail Parser Lösung für Relocato - Zapier Alternative

## 🎯 Ziel
Automatisches Parsen von ImmoScout24 und Umzug365 E-Mails direkt in Firebase/Firestore ohne Zapier.

## 📧 Option 1: Firebase Functions + SendGrid Inbound Parse (EMPFOHLEN)
**Kosten: ~€5-10/Monat**

### Wie es funktioniert:
1. Sie richten eine E-Mail-Weiterleitung ein: anfragen@relocato.de → parse@relocato.sendgrid.net
2. SendGrid empfängt die E-Mail und sendet sie an Ihre Firebase Function
3. Firebase Function parsed die E-Mail und speichert in Firestore

### Vorteile:
✅ Sehr günstig (SendGrid Free Tier: 100 E-Mails/Tag kostenlos)
✅ Zuverlässig und schnell
✅ Kein eigener Server nötig
✅ Automatische Skalierung

## 📧 Option 2: Gmail API + Firebase Functions
**Kosten: €0 (komplett kostenlos)**

### Wie es funktioniert:
1. Firebase Function prüft alle 5 Minuten Ihr Gmail-Postfach
2. Filtert E-Mails von ImmoScout24/Umzug365
3. Parsed und speichert in Firestore
4. Markiert E-Mails als verarbeitet

### Vorteile:
✅ Komplett kostenlos
✅ Nutzt bestehende Gmail-Adresse
✅ Keine DNS-Änderungen nötig

## 📧 Option 3: Eigener E-Mail-Server (Mailgun/Postmark)
**Kosten: €10-35/Monat**

### Wie es funktioniert:
1. Mailgun/Postmark empfängt E-Mails
2. Webhook zu Firebase Function
3. Parsing und Speicherung

## 🔧 Implementierungsplan für Option 1 (SendGrid)

### Schritt 1: SendGrid Setup
```javascript
// Firebase Function für E-Mail-Empfang
exports.receiveEmail = functions.https.onRequest(async (req, res) => {
  const email = req.body;
  
  // Parse E-Mail
  const customerData = await parseEmail(email);
  
  // Speichere in Firestore
  await db.collection('customers').add(customerData);
  
  res.status(200).send('OK');
});
```

### Schritt 2: E-Mail Parser
```javascript
function parseImmoScout24(emailBody) {
  const customer = {
    source: 'ImmoScout24',
    name: extractPattern(emailBody, /Name:\s*(.+)/),
    phone: extractPattern(emailBody, /Telefon:\s*(.+)/),
    email: extractPattern(emailBody, /E-Mail:\s*(.+)/),
    moveDate: extractPattern(emailBody, /Umzugstermin:\s*(.+)/),
    fromAddress: extractPattern(emailBody, /Von:\s*(.+)/),
    toAddress: extractPattern(emailBody, /Nach:\s*(.+)/),
    apartment: {
      rooms: extractPattern(emailBody, /Zimmer:\s*(\d+)/),
      area: extractPattern(emailBody, /Wohnfläche:\s*(\d+)/),
    },
    message: extractPattern(emailBody, /Nachricht:\s*(.+)/s),
    createdAt: new Date()
  };
  
  return customer;
}

function parseUmzug365(emailBody) {
  // Ähnlicher Parser für Umzug365
}
```

### Schritt 3: Automatische Angebotserstellung
```javascript
// Nach dem Speichern des Kunden
async function createAutomaticQuote(customer) {
  const quote = {
    customerId: customer.id,
    customerName: customer.name,
    price: calculatePrice(customer),
    status: 'draft',
    volume: estimateVolume(customer.apartment),
    distance: await calculateDistance(customer.fromAddress, customer.toAddress),
    createdAt: new Date()
  };
  
  await db.collection('quotes').add(quote);
  
  // Optional: Sende automatische Antwort-E-Mail
  await sendWelcomeEmail(customer);
}
```

## 🚀 Implementierung in Ihrer App

### 1. Firebase Functions erstellen
```bash
firebase init functions
cd functions
npm install @sendgrid/mail
```

### 2. E-Mail Parser Function
```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

admin.initializeApp();
const db = admin.firestore();

exports.parseIncomingEmail = functions.https.onRequest(async (req, res) => {
  try {
    const { from, subject, text, html } = req.body;
    
    let customerData;
    
    // Erkenne Quelle
    if (from.includes('immoscout24')) {
      customerData = parseImmoScout24Email(text || html);
    } else if (from.includes('umzug365')) {
      customerData = parseUmzug365Email(text || html);
    } else {
      return res.status(400).send('Unknown email source');
    }
    
    // Speichere Kunde
    const customerRef = await db.collection('customers').add({
      ...customerData,
      source: 'email-parser',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Erstelle automatisches Angebot
    await createQuoteForCustomer(customerRef.id, customerData);
    
    // Sende Bestätigung
    await sendConfirmationEmail(customerData);
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Email parsing error:', error);
    res.status(500).send('Error');
  }
});
```

### 3. Parser-Funktionen
```javascript
function parseImmoScout24Email(content) {
  const patterns = {
    name: /Kontaktname:\s*(.+?)(?:\n|$)/i,
    phone: /Telefon(?:nummer)?:\s*(.+?)(?:\n|$)/i,
    email: /E-Mail:\s*(.+?)(?:\n|$)/i,
    moveDate: /Umzugsdatum:\s*(.+?)(?:\n|$)/i,
    fromZip: /Von PLZ:\s*(\d{5})/i,
    fromCity: /Von Stadt:\s*(.+?)(?:\n|$)/i,
    toZip: /Nach PLZ:\s*(\d{5})/i,
    toCity: /Nach Stadt:\s*(.+?)(?:\n|$)/i,
    rooms: /Zimmeranzahl:\s*(\d+(?:,\d+)?)/i,
    area: /Wohnfläche:\s*(\d+)/i,
    floor: /Etage:\s*(.+?)(?:\n|$)/i,
  };
  
  const data = {};
  
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = content.match(pattern);
    if (match) {
      data[key] = match[1].trim();
    }
  }
  
  // Formatiere Daten
  return {
    name: data.name || 'Unbekannt',
    firstName: data.name?.split(' ')[0] || '',
    lastName: data.name?.split(' ').slice(1).join(' ') || '',
    phone: data.phone || '',
    email: data.email || '',
    moveDate: parseDate(data.moveDate),
    fromAddress: `${data.fromZip || ''} ${data.fromCity || ''}`.trim(),
    toAddress: `${data.toZip || ''} ${data.toCity || ''}`.trim(),
    apartment: {
      rooms: parseFloat(data.rooms?.replace(',', '.') || '0'),
      area: parseInt(data.area || '0'),
      floor: parseInt(data.floor || '0'),
      hasElevator: false
    }
  };
}
```

## 💰 Kostenvergleich

| Lösung | Monatliche Kosten | Setup-Aufwand | Zuverlässigkeit |
|--------|------------------|---------------|-----------------|
| Zapier | €50-200 | Einfach | Sehr hoch |
| SendGrid + Firebase | €5-10 | Mittel | Hoch |
| Gmail API + Firebase | €0 | Mittel | Hoch |
| Mailgun + Firebase | €35 | Mittel | Sehr hoch |

## 🔐 Sicherheit

1. **Webhook-Authentifizierung**: Nur verifizierte Requests akzeptieren
2. **Rate Limiting**: Max. 100 E-Mails pro Stunde
3. **Spam-Filter**: Ignoriere nicht-relevante E-Mails
4. **DSGVO**: Automatisches Löschen nach Verarbeitung

## 📊 Monitoring

```javascript
// Tracking für verarbeitete E-Mails
exports.trackEmailStats = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const stats = await db.collection('emailStats').doc('daily').get();
  
  await db.collection('emailStats').doc(new Date().toISOString()).set({
    immoscout24: stats.data()?.immoscout24 || 0,
    umzug365: stats.data()?.umzug365 || 0,
    failed: stats.data()?.failed || 0,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
});
```

## 🚀 Nächste Schritte

1. **SendGrid Account erstellen** (kostenlos)
2. **Firebase Functions aktivieren** (Blaze Plan nötig)
3. **E-Mail-Weiterleitung einrichten**
4. **Parser testen und anpassen**

**Geschätzte Implementierungszeit**: 1-2 Tage
**Ersparnis**: €40-190/Monat gegenüber Zapier