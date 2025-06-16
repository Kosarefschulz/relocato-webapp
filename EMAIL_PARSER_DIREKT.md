# E-Mail Parser DIREKT mit IONOS - Noch einfacher!

## 🎯 Ohne SendGrid - Direkt von IONOS zu Firebase

### So funktioniert's:

1. **IONOS E-Mail** → **Weiterleitung an HTTP Endpoint** → **Firebase Function**

## 🔧 Methode 1: IONOS Webhook (Falls verfügbar)

Wenn IONOS Webhooks unterstützt:
1. E-Mail-Verwaltung → Webhook einrichten
2. URL: `https://us-central1-umzugsapp.cloudfunctions.net/receiveEmail`

## 🔧 Methode 2: E-Mail zu HTTP Service

### Option A: Email2Webhook Services (Kostenlos)
- **Mailhook.io** - Kostenlos bis 100 E-Mails/Monat
- **Mailgun** - 1000 E-Mails/Monat kostenlos
- **CloudMailin** - 200 E-Mails/Monat kostenlos

### Setup mit Mailhook.io (EMPFOHLEN):
1. Account bei https://mailhook.io erstellen (kostenlos)
2. Neue Mailhook erstellen
3. Sie bekommen eine E-Mail wie: `xyz123@mailhook.io`
4. Webhook URL: Ihre Firebase Function
5. Bei IONOS: Weiterleitung von `anfragen@relocato.de` → `xyz123@mailhook.io`

## 🔧 Methode 3: IONOS SMTP zu Firebase (Direkteste Lösung)

### Firebase Function als E-Mail-Empfänger:

```javascript
// Alternative: SMTP Server in Firebase Function
const SMTPServer = require('smtp-server').SMTPServer;

exports.smtpEmailReceiver = functions.runWith({
  timeoutSeconds: 300,
  memory: '1GB'
}).https.onRequest((req, res) => {
  const server = new SMTPServer({
    onData(stream, session, callback) {
      let emailData = '';
      stream.on('data', chunk => {
        emailData += chunk;
      });
      stream.on('end', async () => {
        // Parse E-Mail
        const parsed = await parseRawEmail(emailData);
        const customer = parseEmail(parsed);
        
        // Speichere in Firestore
        await db.collection('customers').add(customer);
        
        callback();
      });
    },
    disabledCommands: ['AUTH']
  });
  
  server.listen(25);
});
```

## 🔧 Methode 4: IMAP Polling (Einfachste Lösung!)

### Firebase Function die Ihr IONOS Postfach prüft:

```javascript
const Imap = require('imap');
const { simpleParser } = require('mailparser');

// Scheduled Function - prüft alle 5 Minuten
exports.checkEmails = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
  const imap = new Imap({
    user: 'anfragen@relocato.de',
    password: 'IHR_PASSWORT', // In Firebase Config speichern!
    host: 'imap.ionos.de',
    port: 993,
    tls: true
  });
  
  return new Promise((resolve, reject) => {
    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err, box) => {
        if (err) throw err;
        
        // Suche ungelesene E-Mails
        imap.search(['UNSEEN'], async (err, results) => {
          if (err) throw err;
          
          const fetch = imap.fetch(results, { bodies: '' });
          
          fetch.on('message', (msg) => {
            msg.on('body', (stream) => {
              simpleParser(stream, async (err, parsed) => {
                if (err) throw err;
                
                // Parse E-Mail
                const emailData = {
                  from: parsed.from.text,
                  subject: parsed.subject,
                  text: parsed.text,
                  html: parsed.html
                };
                
                const customer = parseEmail(emailData);
                
                // Speichere in Firestore
                await db.collection('customers').add(customer);
                
                // Optional: Erstelle Angebot
                await createAutomaticQuote(customer);
              });
            });
            
            // Markiere als gelesen
            msg.once('end', () => {
              imap.addFlags(results, ['\\Seen'], (err) => {
                if (err) console.error('Flag error:', err);
              });
            });
          });
          
          fetch.once('end', () => {
            imap.end();
            resolve();
          });
        });
      });
    });
    
    imap.connect();
  });
});
```

## 📋 Empfohlene Lösung: IMAP Polling

### Vorteile:
✅ Keine externen Services nötig
✅ Komplett kostenlos
✅ E-Mails bleiben in Ihrem Postfach
✅ Einfach zu implementieren
✅ Zuverlässig

### Setup:
1. **App-Passwort bei IONOS erstellen**:
   - IONOS Kundencenter → E-Mail → Einstellungen
   - App-Passwort generieren

2. **Firebase Config**:
   ```bash
   firebase functions:config:set ionos.email="anfragen@relocato.de"
   firebase functions:config:set ionos.password="APP_PASSWORT"
   ```

3. **Dependencies installieren**:
   ```bash
   cd functions
   npm install imap mailparser
   ```

4. **Deploy**:
   ```bash
   firebase deploy --only functions
   ```

## 📊 Kostenvergleich KOMPLETT:

| Lösung | Monatliche Kosten |
|--------|------------------|
| Zapier | €50-200 |
| SendGrid + Firebase | €5-10 |
| Mailhook + Firebase | €0-5 |
| **IMAP + Firebase** | **€0** ✨ |

## 🚀 Schnellstart mit IMAP:

```javascript
// functions/index.js - Komplette Lösung
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { parseEmail } = require('./emailParser');

admin.initializeApp();
const db = admin.firestore();

exports.checkAndParseEmails = functions
  .runWith({ memory: '512MB' })
  .pubsub.schedule('every 5 minutes')
  .timeZone('Europe/Berlin')
  .onRun(async (context) => {
    console.log('📧 Prüfe E-Mails...');
    
    const processedEmails = await checkIONOSInbox();
    console.log(`✅ ${processedEmails} E-Mails verarbeitet`);
    
    return null;
  });

async function checkIONOSInbox() {
  const config = {
    user: functions.config().ionos.email,
    password: functions.config().ionos.password,
    host: 'imap.ionos.de',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
  };
  
  const imap = new Imap(config);
  let processedCount = 0;
  
  return new Promise((resolve, reject) => {
    imap.once('ready', () => {
      imap.openBox('INBOX', false, async (err, box) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Suche E-Mails von heute die noch nicht verarbeitet wurden
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        imap.search([
          ['SINCE', today],
          ['UNSEEN'],
          ['OR',
            ['FROM', 'immoscout24'],
            ['FROM', 'umzug365']
          ]
        ], async (err, results) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (results.length === 0) {
            imap.end();
            resolve(0);
            return;
          }
          
          const fetch = imap.fetch(results, { 
            bodies: '',
            markSeen: true 
          });
          
          fetch.on('message', (msg, seqno) => {
            msg.on('body', (stream, info) => {
              simpleParser(stream, async (err, parsed) => {
                if (err) {
                  console.error('Parse error:', err);
                  return;
                }
                
                try {
                  // Parse E-Mail
                  const emailData = {
                    from: parsed.from?.text || '',
                    subject: parsed.subject || '',
                    text: parsed.text || '',
                    html: parsed.html || '',
                    date: parsed.date
                  };
                  
                  const customer = parseEmail(emailData);
                  
                  // Generiere Kundennummer
                  customer.customerNumber = await generateCustomerNumber();
                  customer.id = customer.customerNumber;
                  
                  // Speichere in Firestore
                  await db.collection('customers').doc(customer.id).set(customer);
                  console.log('✅ Kunde gespeichert:', customer.id);
                  
                  // Erstelle Angebot
                  await createAutomaticQuote(customer);
                  
                  processedCount++;
                } catch (error) {
                  console.error('Verarbeitungsfehler:', error);
                  
                  // Speichere fehlgeschlagene E-Mail
                  await db.collection('failedEmails').add({
                    from: parsed.from?.text,
                    subject: parsed.subject,
                    error: error.message,
                    timestamp: admin.firestore.FieldValue.serverTimestamp()
                  });
                }
              });
            });
          });
          
          fetch.once('end', () => {
            imap.end();
            resolve(processedCount);
          });
        });
      });
    });
    
    imap.once('error', (err) => {
      console.error('IMAP Error:', err);
      reject(err);
    });
    
    imap.connect();
  });
}
```

## ✅ Fertig!

Mit dieser Lösung:
- **Kosten**: €0/Monat
- **Setup**: 30 Minuten
- **Wartung**: Keine
- **Zuverlässigkeit**: Sehr hoch

Ihre E-Mails werden automatisch alle 5 Minuten geprüft und verarbeitet!