const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { parseEmail } = require('./emailParser');

// Don't initialize admin here - it's already initialized in index.js
// Get db instance inside functions instead

/**
 * Scheduled function that runs periodically to import new customers from emails
 * Runs every 2 hours between 6:00 and 22:00 Berlin time
 */
exports.scheduledCustomerImport = functions
  .region('europe-west1')
  .pubsub
  .schedule('0 */2 * * *') // Every 2 hours
  .timeZone('Europe/Berlin')
  .onRun(async (context) => {
    const db = admin.firestore();
    const currentHour = new Date().getHours();
    
    // Only run between 6:00 and 22:00
    if (currentHour < 6 || currentHour >= 22) {
      console.log('🌙 Outside business hours, skipping import');
      return null;
    }
    
    console.log('🚀 Starting automatic customer import');
    
    try {
      const result = await performAutomaticImport();
      
      // Send notification if new customers were imported
      if (result.newCustomers > 0) {
        await sendImportNotification(result);
      }
      
      // Update last import timestamp
      await updateImportMetadata(result);
      
      console.log(`✅ Import completed: ${result.newCustomers} new customers, ${result.duplicates} duplicates`);
      return result;
      
    } catch (error) {
      console.error('❌ Import failed:', error);
      await sendErrorNotification(error);
      throw error;
    }
  });

/**
 * Manual trigger for immediate import (useful for testing)
 */
exports.triggerCustomerImport = functions
  .region('europe-west1')
  .https.onRequest(async (req, res) => {
    // CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    
    console.log('🔄 Manual customer import triggered');
    
    try {
      const db = admin.firestore();
      const result = await performAutomaticImport(db);
      res.json({
        success: true,
        ...result,
        message: `Imported ${result.newCustomers} new customers`
      });
    } catch (error) {
      console.error('❌ Manual import failed:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

/**
 * Main import function that connects to IONOS and processes emails
 */
async function performAutomaticImport(db) {
  // Get last import timestamp
  const lastImport = await getLastImportTimestamp(db);
  console.log(`📅 Last import: ${lastImport ? lastImport.toISOString() : 'Never'}`);
  
  // Email configuration
  const config = {
    user: 'bielefeld@relocato.de',
    password: 'Bicm1308',
    host: 'imap.ionos.de',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    connTimeout: 30000,
    authTimeout: 30000
  };
  
  const imap = new Imap(config);
  const importStats = {
    totalEmails: 0,
    processedEmails: 0,
    newCustomers: 0,
    duplicates: 0,
    errors: 0,
    skipped: 0,
    emailsBySource: {},
    startTime: new Date()
  };
  
  return new Promise((resolve, reject) => {
    imap.once('ready', () => {
      console.log('✅ Connected to IONOS');
      
      // Open inbox
      imap.openBox('INBOX', false, async (err, box) => {
        if (err) {
          reject(err);
          return;
        }
        
        console.log(`📬 ${box.messages.total} emails in inbox`);
        
        // Build search criteria
        const searchCriteria = buildSearchCriteria(lastImport);
        
        imap.search(searchCriteria, async (err, results) => {
          if (err) {
            reject(err);
            return;
          }
          
          importStats.totalEmails = results.length;
          console.log(`📨 Found ${results.length} emails to process`);
          
          if (results.length === 0) {
            imap.end();
            resolve(importStats);
            return;
          }
          
          // Process emails in batches to avoid memory issues
          const batchSize = 50;
          const batches = [];
          for (let i = 0; i < results.length; i += batchSize) {
            batches.push(results.slice(i, i + batchSize));
          }
          
          for (const batch of batches) {
            await processBatch(imap, batch, importStats, lastImport);
          }
          
          imap.end();
          resolve(importStats);
        });
      });
    });
    
    imap.once('error', (err) => {
      console.error('❌ IMAP error:', err);
      reject(err);
    });
    
    imap.once('end', () => {
      console.log('📪 IMAP connection closed');
    });
    
    console.log('🔌 Connecting to IONOS...');
    imap.connect();
  });
}

/**
 * Build search criteria based on last import timestamp
 */
function buildSearchCriteria(lastImport) {
  const criteria = [];
  
  // Only get emails newer than last import
  if (lastImport) {
    criteria.push(['SINCE', lastImport]);
  } else {
    // If no last import, get emails from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    criteria.push(['SINCE', sevenDaysAgo]);
  }
  
  // Filter by known sources
  criteria.push([
    'OR',
    ['OR',
      ['FROM', 'immoscout24'],
      ['FROM', 'immobilienscout24']
    ],
    ['OR',
      ['FROM', 'umzug365'],
      ['FROM', 'umzug-365']
    ]
  ]);
  
  return criteria;
}

/**
 * Process a batch of emails
 */
async function processBatch(imap, emailIds, stats, lastImport) {
  return new Promise((resolve) => {
    const fetch = imap.fetch(emailIds, { 
      bodies: '',
      struct: true 
    });
    
    let processed = 0;
    
    fetch.on('message', (msg, seqno) => {
      msg.on('body', (stream, info) => {
        simpleParser(stream, async (err, parsed) => {
          if (err) {
            console.error('Parse error:', err);
            stats.errors++;
            return;
          }
          
          try {
            // Skip if email is older than last import (double check)
            if (lastImport && parsed.date && parsed.date <= lastImport) {
              stats.skipped++;
              return;
            }
            
            // Extract email data
            const emailData = {
              from: parsed.from?.text || '',
              to: parsed.to?.text || '',
              subject: parsed.subject || '',
              text: parsed.text || '',
              html: parsed.html || '',
              date: parsed.date || new Date(),
              messageId: parsed.messageId
            };
            
            // Track source
            const source = detectEmailSource(emailData.from);
            stats.emailsBySource[source] = (stats.emailsBySource[source] || 0) + 1;
            
            // Parse customer data
            const customer = parseEmail(emailData);
            
            // Validate customer data
            if (!customer.name || customer.name === 'Unbekannt') {
              console.warn('⚠️ No name found, skipping');
              await logFailedImport(emailData, 'No customer name');
              stats.skipped++;
              return;
            }
            
            // Check for duplicate
            const isDuplicate = await checkDuplicateCustomer(customer);
            if (isDuplicate) {
              console.log(`⚠️ Duplicate customer: ${customer.email || customer.phone}`);
              stats.duplicates++;
              
              // Still create a new quote for existing customer
              const existingCustomer = await findExistingCustomer(customer);
              if (existingCustomer) {
                await createAutomaticQuote(existingCustomer, emailData);
              }
              return;
            }
            
            // Generate customer number
            customer.customerNumber = await generateCustomerNumber();
            customer.id = customer.customerNumber;
            
            // Add import metadata
            customer.importedAt = admin.firestore.FieldValue.serverTimestamp();
            customer.importSource = 'automatic_import';
            customer.emailMessageId = emailData.messageId;
            
            // Save customer
            await db.collection('customers').doc(customer.id).set({
              ...customer,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            console.log(`✅ New customer: ${customer.customerNumber} - ${customer.name}`);
            stats.newCustomers++;
            
            // Create automatic quote
            const quote = await createAutomaticQuote(customer, emailData);
            console.log(`✅ Quote created: ${quote.id}`);
            
            // Send welcome email
            if (customer.email) {
              await sendWelcomeEmail(customer, quote);
            }
            
            stats.processedEmails++;
            
          } catch (error) {
            console.error('❌ Processing error:', error);
            await logFailedImport(emailData, error.message);
            stats.errors++;
          }
          
          processed++;
          if (processed === emailIds.length) {
            resolve();
          }
        });
      });
    });
    
    fetch.once('error', (err) => {
      console.error('Fetch error:', err);
      stats.errors++;
      resolve();
    });
  });
}

/**
 * Check if customer already exists (based on email, phone, or name+address)
 */
async function checkDuplicateCustomer(customer) {
  // Check by email
  if (customer.email) {
    const emailCheck = await db.collection('customers')
      .where('email', '==', customer.email)
      .limit(1)
      .get();
    
    if (!emailCheck.empty) return true;
  }
  
  // Check by phone
  if (customer.phone) {
    const phoneCheck = await db.collection('customers')
      .where('phone', '==', customer.phone)
      .limit(1)
      .get();
    
    if (!phoneCheck.empty) return true;
  }
  
  // Check by name and address (to catch duplicates without email/phone)
  if (customer.name && (customer.fromAddress || customer.toAddress)) {
    const nameAddressCheck = await db.collection('customers')
      .where('name', '==', customer.name)
      .where('fromAddress', '==', customer.fromAddress || '')
      .limit(1)
      .get();
    
    if (!nameAddressCheck.empty) return true;
  }
  
  return false;
}

/**
 * Find existing customer for creating additional quotes
 */
async function findExistingCustomer(customer) {
  let query = db.collection('customers');
  
  if (customer.email) {
    query = query.where('email', '==', customer.email);
  } else if (customer.phone) {
    query = query.where('phone', '==', customer.phone);
  } else if (customer.name) {
    query = query.where('name', '==', customer.name);
  }
  
  const snapshot = await query.limit(1).get();
  
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }
  
  return null;
}

/**
 * Detect email source
 */
function detectEmailSource(fromAddress) {
  const lowerFrom = fromAddress.toLowerCase();
  
  if (lowerFrom.includes('immoscout24') || lowerFrom.includes('immobilienscout24')) {
    return 'ImmobilienScout24';
  } else if (lowerFrom.includes('umzug365') || lowerFrom.includes('umzug-365')) {
    return 'Umzug365';
  } else {
    return 'Other';
  }
}

/**
 * Get last import timestamp from metadata
 */
async function getLastImportTimestamp() {
  try {
    const doc = await db.collection('system').doc('import_metadata').get();
    
    if (doc.exists) {
      const data = doc.data();
      return data.lastAutomaticImport ? data.lastAutomaticImport.toDate() : null;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting last import timestamp:', error);
    return null;
  }
}

/**
 * Update import metadata
 */
async function updateImportMetadata(importStats) {
  try {
    await db.collection('system').doc('import_metadata').set({
      lastAutomaticImport: admin.firestore.FieldValue.serverTimestamp(),
      lastImportStats: importStats,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    // Also log import history
    await db.collection('import_history').add({
      ...importStats,
      endTime: new Date(),
      duration: new Date() - importStats.startTime,
      type: 'automatic',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
  } catch (error) {
    console.error('Error updating import metadata:', error);
  }
}

/**
 * Log failed import for manual review
 */
async function logFailedImport(emailData, reason) {
  try {
    await db.collection('failed_imports').add({
      ...emailData,
      reason: reason,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      type: 'automatic_import'
    });
  } catch (error) {
    console.error('Error logging failed import:', error);
  }
}

/**
 * Send import notification
 */
async function sendImportNotification(importStats) {
  try {
    const message = `
🎉 Automatischer Import abgeschlossen

Neue Kunden: ${importStats.newCustomers}
Duplikate: ${importStats.duplicates}
Fehler: ${importStats.errors}
Übersprungen: ${importStats.skipped}

E-Mails nach Quelle:
${Object.entries(importStats.emailsBySource)
  .map(([source, count]) => `• ${source}: ${count}`)
  .join('\n')}

Dauer: ${Math.round((importStats.endTime - importStats.startTime) / 1000)}s
    `;
    
    // Log notification (in production, this would send an email or push notification)
    console.log('📧 Import notification:', message);
    
    // Store notification
    await db.collection('notifications').add({
      type: 'import_success',
      message: message,
      stats: importStats,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      read: false
    });
    
  } catch (error) {
    console.error('Error sending import notification:', error);
  }
}

/**
 * Send error notification
 */
async function sendErrorNotification(error) {
  try {
    const message = `
❌ Automatischer Import fehlgeschlagen

Fehler: ${error.message}
Zeit: ${new Date().toLocaleString('de-DE')}
    `;
    
    // Log error notification
    console.error('📧 Error notification:', message);
    
    // Store notification
    await db.collection('notifications').add({
      type: 'import_error',
      message: message,
      error: error.message,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      read: false
    });
    
  } catch (err) {
    console.error('Error sending error notification:', err);
  }
}

/**
 * Generate unique customer number
 */
async function generateCustomerNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
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
 * Create automatic quote
 */
async function createAutomaticQuote(customer, emailData) {
  // Base price calculation
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
  
  const volumePerRoom = 12;
  const volume = (customer.apartment?.rooms || 3) * volumePerRoom;
  
  const quoteId = `Q${Date.now()}_${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  
  const quote = {
    id: quoteId,
    customerId: customer.id,
    customerName: customer.name,
    price: Math.round(price),
    status: 'draft',
    comment: `Automatisch erstelltes Angebot basierend auf ${customer.source} Anfrage.\n\nE-Mail erhalten: ${emailData.date.toLocaleString('de-DE')}`,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'automatic_import',
    volume: volume,
    distance: 25,
    moveDate: customer.moveDate,
    fromAddress: customer.fromAddress,
    toAddress: customer.toAddress,
    services: ['Umzug', 'Be- und Entladung'],
    items: [
      { name: 'Umzugsservice', quantity: 1, price: basePrice },
      { name: `${customer.apartment?.rooms || 3} Zimmer`, quantity: customer.apartment?.rooms || 3, price: pricePerRoom },
      { name: `${customer.apartment?.area || 0} m²`, quantity: customer.apartment?.area || 0, price: pricePerSqm }
    ],
    automaticImport: true,
    importMessageId: emailData.messageId
  };
  
  await db.collection('quotes').doc(quoteId).set(quote);
  
  return quote;
}

/**
 * Send welcome email
 */
async function sendWelcomeEmail(customer, quote) {
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
  
  await db.collection('emailHistory').add({
    ...emailData,
    sentAt: admin.firestore.FieldValue.serverTimestamp(),
    status: 'pending',
    source: 'automatic_import'
  });
  
  console.log(`📧 Welcome email prepared for: ${customer.email}`);
}