const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onCall } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { parseEmail } = require('./emailParser');

// Firebase Admin initialisieren
admin.initializeApp();
const db = admin.firestore();

/**
 * Hauptfunktion: Prüft IONOS E-Mail-Postfach alle 5 Minuten
 */
exports.checkAndParseEmails = onSchedule({
  schedule: 'every 5 minutes',
  timeZone: 'Europe/Berlin',
  memory: '512MiB',
  timeoutSeconds: 300
}, async (event) => {
  console.log('📧 Starte E-Mail-Prüfung...');
  
  try {
    const processedEmails = await checkIONOSInbox();
    console.log(`✅ ${processedEmails} E-Mails erfolgreich verarbeitet`);
    
    // Update Statistiken
    if (processedEmails > 0) {
      await updateDailyStats(processedEmails);
    }
    
    return null;
  } catch (error) {
    console.error('❌ Fehler bei E-Mail-Prüfung:', error);
    
    // Fehler in Firestore loggen
    await db.collection('systemErrors').add({
      type: 'email-check-failed',
      error: error.message,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    throw error;
  }
});

/**
 * IMAP Verbindung zu IONOS und E-Mail-Verarbeitung
 */
async function checkIONOSInbox() {
  // E-Mail Konfiguration aus Firebase Config
  const config = {
    user: process.env.IONOS_EMAIL || 'bielefeld@relocato.de',
    password: process.env.IONOS_PASSWORD || 'Bicm1308',
    host: 'imap.ionos.de',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    connTimeout: 30000,
    authTimeout: 30000
  };
  
  // Prüfe ob Zugangsdaten vorhanden
  if (!config.user || !config.password) {
    console.error('⚠️ IONOS Zugangsdaten fehlen!');
    return 0;
  }
  
  const imap = new Imap(config);
  let processedCount = 0;
  
  return new Promise((resolve, reject) => {
    // Verbindung hergestellt
    imap.once('ready', () => {
      console.log('✅ Mit IONOS verbunden');
      
      imap.openBox('INBOX', false, async (err, box) => {
        if (err) {
          reject(err);
          return;
        }
        
        console.log(`📬 ${box.messages.total} E-Mails im Postfach`);
        
        // Suche neue, ungelesene E-Mails von heute
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Suchkriterien
        const searchCriteria = [
          'UNSEEN', // Nur ungelesene
          ['SINCE', today], // Von heute
          ['OR', // Von einem der bekannten Absender
            ['OR',
              ['FROM', 'immoscout24'],
              ['FROM', 'immobilienscout24']
            ],
            ['OR',
              ['FROM', 'umzug365'],
              ['FROM', 'umzug-365']
            ]
          ]
        ];
        
        imap.search(searchCriteria, async (err, results) => {
          if (err) {
            reject(err);
            return;
          }
          
          console.log(`📨 ${results.length} neue relevante E-Mails gefunden`);
          
          if (results.length === 0) {
            imap.end();
            resolve(0);
            return;
          }
          
          // Lade E-Mails
          const fetch = imap.fetch(results, { 
            bodies: '',
            markSeen: true // Automatisch als gelesen markieren
          });
          
          // Verarbeite jede E-Mail
          fetch.on('message', (msg, seqno) => {
            console.log(`📧 Verarbeite E-Mail #${seqno}`);
            
            msg.on('body', (stream, info) => {
              simpleParser(stream, async (err, parsed) => {
                if (err) {
                  console.error('Parse error:', err);
                  return;
                }
                
                try {
                  console.log(`📬 E-Mail von: ${parsed.from?.text}`);
                  console.log(`📬 Betreff: ${parsed.subject}`);
                  
                  // Parse E-Mail-Inhalt
                  const emailData = {
                    from: parsed.from?.text || '',
                    to: parsed.to?.text || '',
                    subject: parsed.subject || '',
                    text: parsed.text || '',
                    html: parsed.html || '',
                    date: parsed.date || new Date()
                  };
                  
                  // Extrahiere Kundendaten
                  const customer = parseEmail(emailData);
                  
                  // Prüfe ob Kunde schon existiert (basierend auf E-Mail)
                  if (customer.email) {
                    const existingCustomer = await checkExistingCustomer(customer.email);
                    if (existingCustomer) {
                      console.log(`⚠️ Kunde existiert bereits: ${existingCustomer.customerNumber}`);
                      
                      // Erstelle trotzdem neues Angebot für existierenden Kunden
                      await createAutomaticQuote({
                        ...customer,
                        id: existingCustomer.id,
                        customerNumber: existingCustomer.customerNumber
                      });
                      
                      processedCount++;
                      return;
                    }
                  }
                  
                  // Generiere neue Kundennummer
                  customer.customerNumber = await generateCustomerNumber();
                  customer.id = customer.customerNumber;
                  
                  // Speichere in Firestore
                  await db.collection('customers').doc(customer.id).set({
                    ...customer,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                  });
                  
                  console.log(`✅ Neuer Kunde angelegt: ${customer.customerNumber} - ${customer.name}`);
                  
                  // Erstelle automatisches Angebot
                  const quote = await createAutomaticQuote(customer);
                  console.log(`✅ Angebot erstellt: ${quote.id}`);
                  
                  // Sende Willkommens-E-Mail
                  if (customer.email) {
                    await sendWelcomeEmail(customer, quote);
                  }
                  
                  // Speichere Original-E-Mail als Backup
                  await db.collection('processedEmails').add({
                    customerId: customer.id,
                    quoteId: quote.id,
                    from: emailData.from,
                    subject: emailData.subject,
                    processedAt: admin.firestore.FieldValue.serverTimestamp(),
                    source: customer.source
                  });
                  
                  processedCount++;
                  
                } catch (error) {
                  console.error('❌ Fehler bei Verarbeitung:', error);
                  
                  // Speichere fehlgeschlagene E-Mail zur manuellen Prüfung
                  await db.collection('failedEmails').add({
                    from: parsed.from?.text,
                    subject: parsed.subject,
                    text: parsed.text?.substring(0, 1000), // Erste 1000 Zeichen
                    error: error.message,
                    timestamp: admin.firestore.FieldValue.serverTimestamp()
                  });
                }
              });
            });
          });
          
          // Alle E-Mails verarbeitet
          fetch.once('end', () => {
            console.log('✅ Alle E-Mails verarbeitet');
            imap.end();
            resolve(processedCount);
          });
        });
      });
    });
    
    // Fehlerbehandlung
    imap.once('error', (err) => {
      console.error('❌ IMAP Fehler:', err);
      reject(err);
    });
    
    // Verbindung beendet
    imap.once('end', () => {
      console.log('📪 IMAP Verbindung geschlossen');
    });
    
    // Verbindung herstellen
    console.log('🔌 Verbinde mit IONOS...');
    imap.connect();
  });
}

/**
 * Prüft ob ein Kunde bereits existiert
 */
async function checkExistingCustomer(email) {
  const snapshot = await db.collection('customers')
    .where('email', '==', email)
    .limit(1)
    .get();
  
  if (!snapshot.empty) {
    return snapshot.docs[0].data();
  }
  
  return null;
}

/**
 * Generiert eine eindeutige Kundennummer
 */
async function generateCustomerNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  // Hole den Counter für diesen Monat
  const counterRef = db.collection('counters').doc(`customers_${year}_${month}`);
  
  const newNumber = await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(counterRef);
    
    let counter = 1;
    if (doc.exists) {
      counter = (doc.data().value || 0) + 1;
    }
    
    transaction.set(counterRef, { value: counter });
    
    return `K${year}${month}${String(counter).padStart(3, '0')}`;
  });
  
  return newNumber;
}

/**
 * Erstellt automatisch ein Angebot
 */
async function createAutomaticQuote(customer) {
  // Basis-Preisberechnung
  const basePrice = 450; // Grundpreis
  const pricePerRoom = 150; // Pro Zimmer
  const pricePerSqm = 8; // Pro m²
  const pricePerFloor = 50; // Pro Etage ohne Aufzug
  
  let price = basePrice;
  
  // Berechne basierend auf Zimmern
  if (customer.apartment?.rooms) {
    price += customer.apartment.rooms * pricePerRoom;
  }
  
  // Berechne basierend auf Fläche
  if (customer.apartment?.area) {
    price += customer.apartment.area * pricePerSqm;
  }
  
  // Etagen-Zuschlag
  if (customer.apartment?.floor > 0 && !customer.apartment?.hasElevator) {
    price += customer.apartment.floor * pricePerFloor;
  }
  
  // Volumen-Schätzung
  const volumePerRoom = 12; // m³ pro Zimmer
  const volume = (customer.apartment?.rooms || 3) * volumePerRoom;
  
  // Generiere Angebots-ID
  const quoteId = `Q${Date.now()}_${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  
  const quote = {
    id: quoteId,
    customerId: customer.id,
    customerName: customer.name,
    price: Math.round(price),
    status: 'draft',
    comment: `Automatisch erstelltes Angebot basierend auf ${customer.source} Anfrage.\n\nKunde: ${customer.name}\nUmzugstermin: ${customer.moveDate || 'Noch offen'}\nVon: ${customer.fromAddress}\nNach: ${customer.toAddress}`,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'email-parser',
    volume: volume,
    distance: 25, // Standard, kann später berechnet werden
    moveDate: customer.moveDate,
    fromAddress: customer.fromAddress,
    toAddress: customer.toAddress,
    services: ['Umzug', 'Be- und Entladung'],
    items: [
      { name: 'Umzugsservice', quantity: 1, price: basePrice },
      { name: `${customer.apartment?.rooms || 3} Zimmer`, quantity: customer.apartment?.rooms || 3, price: pricePerRoom },
      { name: `${customer.apartment?.area || 0} m²`, quantity: customer.apartment?.area || 0, price: pricePerSqm }
    ]
  };
  
  // Speichere Angebot
  await db.collection('quotes').doc(quoteId).set(quote);
  
  return quote;
}

/**
 * Sendet Willkommens-E-Mail
 */
async function sendWelcomeEmail(customer, quote) {
  // E-Mail-Daten für Historie
  const emailData = {
    to: customer.email,
    subject: 'Ihre Umzugsanfrage bei Relocato - Angebot folgt in Kürze',
    content: `
Sehr geehrte/r ${customer.name},

vielen Dank für Ihre Umzugsanfrage! Wir haben Ihre Daten erhalten und arbeiten bereits an Ihrem persönlichen Angebot.

IHRE ANFRAGE-DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Kundennummer: ${customer.customerNumber}
• Umzugstermin: ${customer.moveDate || 'Noch offen'}
• Von: ${customer.fromAddress}
• Nach: ${customer.toAddress}
• Wohnfläche: ${customer.apartment?.area || 'Nicht angegeben'} m²
• Zimmer: ${customer.apartment?.rooms || 'Nicht angegeben'}

VORLÄUFIGE PREISSCHÄTZUNG:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Geschätzter Preis: ab ${quote.price} € (inkl. MwSt.)

WAS PASSIERT ALS NÄCHSTES?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Wir prüfen Ihre Anfrage im Detail
2. Sie erhalten innerhalb von 24 Stunden ein verbindliches Angebot
3. Optional: Kostenlose Vor-Ort-Besichtigung

Bei Fragen erreichen Sie uns unter:
📞 Telefon: 0521 1200551-0
📧 E-Mail: info@relocato.de

Mit freundlichen Grüßen
Ihr Relocato Team

--
RELOCATO® Umzugsservice
Detmolder Str. 234a
33605 Bielefeld
www.relocato.de
    `,
    customerId: customer.id,
    customerName: customer.name,
    templateType: 'welcome_auto',
    quoteId: quote.id
  };
  
  // Speichere in E-Mail-Historie
  await db.collection('emailHistory').add({
    ...emailData,
    sentAt: admin.firestore.FieldValue.serverTimestamp(),
    status: 'pending', // Wird auf 'sent' gesetzt wenn tatsächlich versendet
    source: 'email-parser'
  });
  
  console.log(`📧 Willkommens-E-Mail vorbereitet für: ${customer.email}`);
  
  // Hier würde der tatsächliche E-Mail-Versand stattfinden
  // Das ist bereits in Ihrer smtpEmailService implementiert
}

/**
 * Aktualisiert tägliche Statistiken
 */
async function updateDailyStats(count) {
  const today = new Date().toISOString().split('T')[0];
  const statsRef = db.collection('emailStats').doc(today);
  
  await statsRef.set({
    processed: admin.firestore.FieldValue.increment(count),
    lastUpdate: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

/**
 * Täglicher Report (läuft um 18:00 Uhr)
 */
exports.dailyEmailReport = onSchedule({
  schedule: '0 18 * * *',
  timeZone: 'Europe/Berlin'
}, async (event) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Hole Statistiken
  const [statsDoc, newCustomers, failedEmails] = await Promise.all([
    db.collection('emailStats').doc(today).get(),
    db.collection('customers')
      .where('createdAt', '>=', new Date(today))
      .get(),
    db.collection('failedEmails')
      .where('timestamp', '>=', new Date(today))
      .get()
  ]);
  
  const stats = statsDoc.data() || { processed: 0 };
  
  console.log('📊 Täglicher E-Mail-Report:');
  console.log(`- Verarbeitete E-Mails: ${stats.processed}`);
  console.log(`- Neue Kunden: ${newCustomers.size}`);
  console.log(`- Fehlgeschlagene E-Mails: ${failedEmails.size}`);
  
  // Speichere Report
  await db.collection('dailyReports').doc(today).set({
    emailsProcessed: stats.processed || 0,
    customersCreated: newCustomers.size,
    quotesCreated: stats.processed || 0, // Jede E-Mail = 1 Angebot
    failedEmails: failedEmails.size,
    date: today,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  return null;
});

/**
 * Bereinigung alter Daten (läuft wöchentlich)
 */
exports.weeklyCleanup = onSchedule({
  schedule: '0 3 * * 0', // Sonntags um 3 Uhr
  timeZone: 'Europe/Berlin'
}, async (event) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Lösche alte verarbeitete E-Mails
  const oldEmails = await db.collection('processedEmails')
    .where('processedAt', '<', thirtyDaysAgo)
    .get();
  
  const batch = db.batch();
  oldEmails.forEach(doc => batch.delete(doc.ref));
  
  await batch.commit();
  console.log(`🗑️ ${oldEmails.size} alte E-Mail-Records gelöscht`);
  
  return null;
});

/**
 * Manuelle E-Mail-Prüfung (kann über Firebase Console ausgelöst werden)
 */
exports.manualEmailCheck = onCall({
  cors: true
}, async (request) => {
  console.log('🔄 Manuelle E-Mail-Prüfung gestartet...');
  
  try {
    const processed = await checkIONOSInbox();
    
    return {
      success: true,
      processed: processed,
      message: `${processed} E-Mails verarbeitet`
    };
  } catch (error) {
    throw new Error(error.message);
  }
});