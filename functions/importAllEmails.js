const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { parseEmail } = require('./emailParser');

/**
 * Importiert ALLE E-Mails aus dem "erfolgreich verarbeitete Anfragen" Ordner
 */
exports.importAllEmails = functions
  .region('europe-west1')
  .runWith({
    timeoutSeconds: 540, // 9 Minuten
    memory: '2GB'
  })
  .https.onRequest(async (req, res) => {
    console.log('🚀 Starte Massen-Import aller E-Mails...');
    
    const skipExisting = req.query.skipExisting !== 'false'; // Standard: true
    const batchSize = parseInt(req.query.batchSize) || 100; // Verarbeite in Batches
    const startFrom = parseInt(req.query.startFrom) || 0; // Start-Index
    
    try {
      const result = await importAllEmailsFromFolder(
        'erfolgreich verarbeitete Anfragen',
        skipExisting,
        batchSize,
        startFrom,
        db
      );
      
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('❌ Fehler beim Import:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

async function importAllEmailsFromFolder(folderName, skipExisting, batchSize, startFrom, db) {
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
  let stats = {
    total: 0,
    processed: 0,
    imported: 0,
    skipped: 0,
    failed: 0,
    errors: []
  };
  
  return new Promise((resolve, reject) => {
    imap.once('ready', () => {
      console.log('✅ Mit IONOS verbunden');
      
      imap.openBox(folderName, false, async (err, box) => {
        if (err) {
          reject(err);
          return;
        }
        
        console.log(`📬 ${box.messages.total} E-Mails im Ordner "${folderName}"`);
        stats.total = box.messages.total;
        
        if (box.messages.total === 0) {
          imap.end();
          resolve(stats);
          return;
        }
        
        // Berechne den Bereich
        const endIndex = Math.min(startFrom + batchSize, box.messages.total);
        const range = `${startFrom + 1}:${endIndex}`;
        
        console.log(`📧 Verarbeite E-Mails ${range} (Batch-Größe: ${batchSize})`);
        
        const fetch = imap.fetch(range, { 
          bodies: '',
          markSeen: false
        });
        
        const emailPromises = [];
        
        fetch.on('message', (msg, seqno) => {
          const emailPromise = new Promise((resolveEmail) => {
            msg.on('body', (stream) => {
              simpleParser(stream, async (err, parsed) => {
                if (err) {
                  stats.failed++;
                  stats.errors.push({ seqno, error: err.message });
                  resolveEmail();
                  return;
                }
                
                try {
                  const emailData = {
                    from: parsed.from?.text || '',
                    to: parsed.to?.text || '',
                    subject: parsed.subject || '',
                    text: parsed.text || '',
                    html: parsed.html || '',
                    date: parsed.date || new Date()
                  };
                  
                  // Parse E-Mail
                  const customer = parseEmail(emailData);
                  
                  // Validierung
                  if (!customer.name || customer.name === 'Unbekannt') {
                    stats.skipped++;
                    console.log(`⏭️  E-Mail #${seqno} übersprungen: Kein Name`);
                    resolveEmail();
                    return;
                  }
                  
                  // Prüfe ob Kunde existiert
                  if (skipExisting && customer.email) {
                    const existing = await checkExistingCustomer(customer.email, db);
                    if (existing) {
                      stats.skipped++;
                      console.log(`⏭️  Kunde existiert bereits: ${existing.customerNumber}`);
                      resolveEmail();
                      return;
                    }
                  }
                  
                  // Generiere Kundennummer
                  customer.customerNumber = await generateCustomerNumber(db);
                  customer.id = customer.customerNumber;
                  
                  // Speichere in Firestore
                  await db.collection('customers').doc(customer.id).set({
                    ...customer,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    importedFrom: 'email-mass-import',
                    importDate: new Date()
                  });
                  
                  // Erstelle automatisches Angebot
                  await createAutomaticQuote(customer, db);
                  
                  stats.imported++;
                  stats.processed++;
                  
                  if (stats.imported % 10 === 0) {
                    console.log(`✅ ${stats.imported} Kunden importiert...`);
                  }
                  
                } catch (error) {
                  stats.failed++;
                  stats.errors.push({ 
                    seqno, 
                    error: error.message,
                    email: parsed.from?.text 
                  });
                  console.error(`❌ Fehler bei E-Mail #${seqno}:`, error.message);
                }
                
                resolveEmail();
              });
            });
          });
          
          emailPromises.push(emailPromise);
        });
        
        fetch.once('end', async () => {
          // Warte auf alle E-Mails
          await Promise.all(emailPromises);
          
          console.log('✅ Batch verarbeitet');
          console.log(`📊 Statistik: ${stats.imported} importiert, ${stats.skipped} übersprungen, ${stats.failed} fehlgeschlagen`);
          
          imap.end();
          resolve(stats);
        });
      });
    });
    
    imap.once('error', (err) => {
      console.error('❌ IMAP Fehler:', err);
      reject(err);
    });
    
    imap.connect();
  });
}

async function checkExistingCustomer(email, db) {
  const snapshot = await db.collection('customers')
    .where('email', '==', email)
    .limit(1)
    .get();
  
  return !snapshot.empty ? snapshot.docs[0].data() : null;
}

async function generateCustomerNumber(db) {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  const counterRef = db.collection('counters').doc(`customers_${year}_${month}`);
  
  return await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(counterRef);
    
    let counter = 1;
    if (doc.exists) {
      counter = (doc.data().value || 0) + 1;
    }
    
    transaction.set(counterRef, { value: counter });
    
    return `K${year}${month}${String(counter).padStart(3, '0')}`;
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
  const quoteId = `Q${Date.now()}_${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  
  const quote = {
    id: quoteId,
    customerId: customer.id,
    customerName: customer.name,
    price: Math.round(price),
    status: 'draft',
    comment: `Automatisch erstelltes Angebot basierend auf ${customer.source} Anfrage.`,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'email-mass-import',
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