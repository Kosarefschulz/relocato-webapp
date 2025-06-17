const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { parseEmail } = require('./emailParser');

/**
 * Importiert WIRKLICH ALLE Kunden - keine Filter, keine Limits
 * Auch Duplikate werden importiert!
 */
exports.importAllCustomers = functions
  .region('europe-west1')
  .runWith({
    timeoutSeconds: 540, // 9 Minuten Maximum
    memory: '4GB'
  })
  .https.onRequest(async (req, res) => {
    console.log('🚀 VOLLSTÄNDIGER KUNDEN-IMPORT GESTARTET...');
    
    // CORS Headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    
    const db = admin.firestore();
    
    try {
      // Starte den Import mit ALLEN E-Mails
      const result = await importEveryCustomer(db);
      
      res.json({
        success: true,
        message: 'Import abgeschlossen',
        ...result
      });
    } catch (error) {
      console.error('❌ Import-Fehler:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        stack: error.stack
      });
    }
  });

async function importEveryCustomer(db) {
  const config = {
    user: 'bielefeld@relocato.de',
    password: 'Bicm1308',
    host: 'imap.ionos.de',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    connTimeout: 60000,
    authTimeout: 60000
  };
  
  const imap = new Imap(config);
  const stats = {
    total: 0,
    processed: 0,
    imported: 0,
    failed: 0,
    skippedNoName: 0,
    duplicates: 0,
    errors: [],
    customersByEmail: {},
    allCustomers: []
  };
  
  return new Promise((resolve, reject) => {
    imap.once('ready', () => {
      console.log('✅ IMAP-Verbindung hergestellt');
      
      // Öffne den Ordner mit verarbeiteten Anfragen
      imap.openBox('erfolgreich verarbeitete Anfragen', false, async (err, box) => {
        if (err) {
          reject(err);
          return;
        }
        
        console.log(`📬 ${box.messages.total} E-Mails im Ordner gefunden`);
        stats.total = box.messages.total;
        
        if (box.messages.total === 0) {
          imap.end();
          resolve(stats);
          return;
        }
        
        // WICHTIG: Hole ALLE E-Mails auf einmal
        const fetch = imap.fetch(`1:${box.messages.total}`, { 
          bodies: '',
          markSeen: false
        });
        
        const emailPromises = [];
        let emailCount = 0;
        
        fetch.on('message', (msg, seqno) => {
          emailCount++;
          
          // Fortschritt anzeigen
          if (emailCount % 100 === 0) {
            console.log(`📊 Verarbeite E-Mail ${emailCount} von ${box.messages.total}...`);
          }
          
          const emailPromise = new Promise((resolveEmail) => {
            let emailBuffer = '';
            
            msg.on('body', (stream) => {
              stream.on('data', (chunk) => {
                emailBuffer += chunk.toString('utf8');
              });
              
              stream.once('end', async () => {
                try {
                  // Parse die E-Mail
                  const parsed = await simpleParser(emailBuffer);
                  
                  const emailData = {
                    from: parsed.from?.text || '',
                    to: parsed.to?.text || '',
                    subject: parsed.subject || '',
                    text: parsed.text || '',
                    html: parsed.html || '',
                    date: parsed.date || new Date()
                  };
                  
                  // Parse Kundendaten
                  const customer = parseEmail(emailData);
                  
                  // WICHTIG: Wir überspringen NUR E-Mails ohne Namen
                  // Aber wir importieren ALLE anderen, auch Duplikate!
                  if (!customer.name || customer.name === 'Unbekannt') {
                    stats.skippedNoName++;
                    console.log(`⚠️  E-Mail #${seqno}: Kein Kundenname gefunden`);
                    resolveEmail();
                    return;
                  }
                  
                  // Zähle Duplikate, aber importiere sie trotzdem!
                  if (customer.email && stats.customersByEmail[customer.email]) {
                    stats.duplicates++;
                    console.log(`🔄 Duplikat gefunden: ${customer.email} (wird trotzdem importiert)`);
                  }
                  
                  // Generiere eindeutige Kundennummer mit Timestamp
                  const timestamp = Date.now();
                  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
                  customer.customerNumber = await generateUniqueCustomerNumber(db, emailData.date, timestamp, random);
                  customer.id = customer.customerNumber;
                  
                  // Füge Import-Metadaten hinzu
                  customer.importMetadata = {
                    importedAt: new Date(),
                    emailSequenceNumber: seqno,
                    emailDate: emailData.date,
                    isDuplicate: customer.email && stats.customersByEmail[customer.email] ? true : false,
                    originalEmail: emailData.from
                  };
                  
                  // Speichere in Firestore
                  await db.collection('customers').doc(customer.id).set({
                    ...customer,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    importedFrom: 'full-import',
                    importDate: new Date()
                  });
                  
                  // Erstelle Angebot
                  await createAutomaticQuote(customer, db);
                  
                  // Tracking
                  if (customer.email) {
                    if (!stats.customersByEmail[customer.email]) {
                      stats.customersByEmail[customer.email] = [];
                    }
                    stats.customersByEmail[customer.email].push(customer.customerNumber);
                  }
                  
                  stats.allCustomers.push({
                    customerNumber: customer.customerNumber,
                    name: customer.name,
                    email: customer.email,
                    phone: customer.phone,
                    importDate: new Date()
                  });
                  
                  stats.imported++;
                  stats.processed++;
                  
                } catch (error) {
                  stats.failed++;
                  stats.errors.push({ 
                    seqno, 
                    error: error.message,
                    stack: error.stack
                  });
                  console.error(`❌ Fehler bei E-Mail #${seqno}:`, error);
                }
                
                resolveEmail();
              });
            });
          });
          
          emailPromises.push(emailPromise);
        });
        
        fetch.once('error', (err) => {
          console.error('❌ Fetch-Fehler:', err);
          stats.errors.push({ type: 'fetch', error: err.message });
        });
        
        fetch.once('end', async () => {
          console.log(`⏳ Warte auf Verarbeitung von ${emailPromises.length} E-Mails...`);
          
          // Warte auf ALLE E-Mails
          await Promise.all(emailPromises);
          
          console.log('✅ IMPORT ABGESCHLOSSEN!');
          console.log(`📊 Statistik:`);
          console.log(`   - Total E-Mails: ${stats.total}`);
          console.log(`   - Verarbeitet: ${stats.processed}`);
          console.log(`   - Importiert: ${stats.imported}`);
          console.log(`   - Ohne Namen: ${stats.skippedNoName}`);
          console.log(`   - Duplikate (trotzdem importiert): ${stats.duplicates}`);
          console.log(`   - Fehler: ${stats.failed}`);
          
          // Finde E-Mail-Adressen mit mehreren Kunden
          const duplicateEmails = Object.entries(stats.customersByEmail)
            .filter(([email, customers]) => customers.length > 1)
            .map(([email, customers]) => ({
              email,
              count: customers.length,
              customerNumbers: customers
            }));
          
          stats.duplicateEmailDetails = duplicateEmails;
          
          imap.end();
          resolve(stats);
        });
      });
    });
    
    imap.once('error', (err) => {
      console.error('❌ IMAP-Verbindungsfehler:', err);
      reject(err);
    });
    
    imap.once('end', () => {
      console.log('📪 IMAP-Verbindung beendet');
    });
    
    imap.connect();
  });
}

// Generiere absolut eindeutige Kundennummer
async function generateUniqueCustomerNumber(db, emailDate, timestamp, random) {
  const date = emailDate ? new Date(emailDate) : new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  const counterRef = db.collection('counters').doc(`customers_${year}_${month}_full`);
  
  return await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(counterRef);
    
    let counter = 1;
    if (doc.exists) {
      counter = (doc.data().value || 0) + 1;
    }
    
    transaction.set(counterRef, { value: counter });
    
    // Eindeutige Nummer mit Timestamp für absolute Eindeutigkeit
    return `K${year}${month}${String(counter).padStart(4, '0')}_${random}`;
  });
}

async function createAutomaticQuote(customer, db) {
  const basePrice = 450;
  const pricePerRoom = 150;
  const pricePerSqm = 8;
  const pricePerFloor = 50;
  
  let price = basePrice;
  
  if (customer.apartment?.rooms) {
    price += customer.apartment.rooms * pricePerRoom;
  }
  
  if (customer.apartment?.area) {
    price += customer.apartment.area * pricePerSqm;
  }
  
  if (customer.apartment?.floor > 0 && !customer.apartment?.hasElevator) {
    price += customer.apartment.floor * pricePerFloor;
  }
  
  const volume = (customer.apartment?.rooms || 3) * 12;
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  const quoteId = `Q${timestamp}_${random}`;
  
  const quote = {
    id: quoteId,
    customerId: customer.id,
    customerName: customer.name,
    price: Math.round(price),
    status: 'draft',
    comment: `Automatisch erstelltes Angebot basierend auf ${customer.source || 'E-Mail'} Anfrage.`,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'full-import',
    volume: volume,
    distance: 25,
    moveDate: customer.moveDate,
    fromAddress: customer.fromAddress,
    toAddress: customer.toAddress,
    services: customer.services || ['Umzug']
  };
  
  await db.collection('quotes').doc(quoteId).set(quote);
  
  return quote;
}