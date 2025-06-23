const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { parseEmail } = require('./emailParser');

/**
 * Import recent customers from INBOX without date restrictions
 */
exports.importRecentCustomers = functions
  .region('europe-west1')
  .runWith({
    timeoutSeconds: 540,
    memory: '2GB'
  })
  .https.onRequest(async (req, res) => {
    // CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    
    const limit = parseInt(req.query.limit) || 300;
    const folder = req.query.folder || 'INBOX';
    
    console.log(`🚀 Importing ${limit} recent customers from ${folder}...`);
    
    try {
      const db = admin.firestore();
      const result = await importRecentEmails(db, folder, limit);
      
      res.json({
        success: true,
        message: 'Import completed',
        ...result
      });
    } catch (error) {
      console.error('❌ Import error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

async function importRecentEmails(db, folderName, limit) {
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
    totalEmails: 0,
    processedEmails: 0,
    newCustomers: 0,
    duplicates: 0,
    errors: 0,
    skipped: 0,
    emailDates: []
  };
  
  return new Promise((resolve, reject) => {
    imap.once('ready', () => {
      console.log('✅ Connected to IONOS');
      
      imap.openBox(folderName, false, async (err, box) => {
        if (err) {
          reject(err);
          return;
        }
        
        console.log(`📬 ${box.messages.total} emails in ${folderName}`);
        
        if (box.messages.total === 0) {
          imap.end();
          resolve(stats);
          return;
        }
        
        // Get the most recent emails (no date filter)
        const start = Math.max(1, box.messages.total - limit + 1);
        const range = `${start}:${box.messages.total}`;
        
        console.log(`📧 Fetching emails ${range}`);
        
        // Search ALL emails without date restrictions
        imap.search(['ALL'], async (err, results) => {
          if (err) {
            reject(err);
            return;
          }
          
          // Take the most recent ones
          const emailsToProcess = results.slice(-limit);
          stats.totalEmails = emailsToProcess.length;
          
          console.log(`📨 Processing ${emailsToProcess.length} emails`);
          
          const fetch = imap.fetch(emailsToProcess, {
            bodies: '',
            markSeen: false
          });
          
          let processedCount = 0;
          
          fetch.on('message', (msg, seqno) => {
            msg.on('body', (stream) => {
              simpleParser(stream, async (err, parsed) => {
                if (err) {
                  stats.errors++;
                  processedCount++;
                  if (processedCount === emailsToProcess.length) {
                    imap.end();
                    resolve(stats);
                  }
                  return;
                }
                
                try {
                  // Log email date for debugging
                  if (parsed.date) {
                    stats.emailDates.push({
                      date: parsed.date,
                      from: parsed.from?.text,
                      subject: parsed.subject
                    });
                  }
                  
                  // Check if it's a customer email
                  const isCustomerEmail = 
                    parsed.from?.text?.toLowerCase().includes('immoscout24') ||
                    parsed.from?.text?.toLowerCase().includes('immobilienscout24') ||
                    parsed.from?.text?.toLowerCase().includes('umzug365') ||
                    parsed.from?.text?.toLowerCase().includes('umzug-365') ||
                    parsed.text?.includes('Anfrage #') ||
                    parsed.text?.includes('Voraussichtlicher Umzugstag:') ||
                    parsed.text?.includes('Umzugstermin:');
                  
                  if (!isCustomerEmail) {
                    stats.skipped++;
                    processedCount++;
                    if (processedCount === emailsToProcess.length) {
                      imap.end();
                      resolve(stats);
                    }
                    return;
                  }
                  
                  const emailData = {
                    from: parsed.from?.text || '',
                    to: parsed.to?.text || '',
                    subject: parsed.subject || '',
                    text: parsed.text || '',
                    html: parsed.html || '',
                    date: parsed.date || new Date()
                  };
                  
                  // Parse customer data
                  const customer = parseEmail(emailData);
                  
                  // Validate
                  if (!customer.name || customer.name === 'Unbekannt') {
                    stats.skipped++;
                    processedCount++;
                    if (processedCount === emailsToProcess.length) {
                      imap.end();
                      resolve(stats);
                    }
                    return;
                  }
                  
                  // Check duplicate
                  if (customer.email) {
                    const existing = await db.collection('customers')
                      .where('email', '==', customer.email)
                      .limit(1)
                      .get();
                    
                    if (!existing.empty) {
                      stats.duplicates++;
                      processedCount++;
                      if (processedCount === emailsToProcess.length) {
                        imap.end();
                        resolve(stats);
                      }
                      return;
                    }
                  }
                  
                  // Generate customer number
                  customer.customerNumber = await generateCustomerNumber(db);
                  customer.id = customer.customerNumber;
                  
                  // Save customer
                  await db.collection('customers').doc(customer.id).set({
                    ...customer,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    importedFrom: 'recent-import',
                    emailDate: emailData.date
                  });
                  
                  // Create quote
                  await createAutomaticQuote(customer, db);
                  
                  console.log(`✅ Imported: ${customer.customerNumber} - ${customer.name} (Email date: ${emailData.date})`);
                  
                  stats.newCustomers++;
                  stats.processedEmails++;
                  
                } catch (error) {
                  console.error('❌ Error:', error.message);
                  stats.errors++;
                }
                
                processedCount++;
                if (processedCount === emailsToProcess.length) {
                  // Sort email dates to show range
                  stats.emailDates.sort((a, b) => a.date - b.date);
                  
                  console.log(`\n📊 Import completed:
- Total emails: ${stats.totalEmails}
- New customers: ${stats.newCustomers}
- Duplicates: ${stats.duplicates}
- Skipped: ${stats.skipped}
- Errors: ${stats.errors}`);
                  
                  if (stats.emailDates.length > 0) {
                    console.log(`\n📅 Email date range:
- Oldest: ${stats.emailDates[0].date}
- Newest: ${stats.emailDates[stats.emailDates.length - 1].date}`);
                  }
                  
                  imap.end();
                  resolve(stats);
                }
              });
            });
          });
          
          fetch.once('error', (err) => {
            console.error('Fetch error:', err);
            imap.end();
            reject(err);
          });
        });
      });
    });
    
    imap.once('error', (err) => {
      console.error('IMAP error:', err);
      reject(err);
    });
    
    imap.connect();
  });
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
    comment: `Automatisch erstelltes Angebot basierend auf ${customer.source || 'E-Mail'} Anfrage.`,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'recent-import',
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