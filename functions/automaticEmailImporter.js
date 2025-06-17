const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { parseEmail } = require('./emailParser');

// Don't initialize admin here - it's already initialized in index.js

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
    
    console.log('🚀 Starting scheduled customer import...');
    
    try {
      const result = await performAutomaticImport(db);
      
      // Send success notification
      await sendSuccessNotification(db, result);
      
      // Store import history
      await db.collection('import_history').add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        type: 'scheduled',
        ...result
      });
      
      // Update last import timestamp
      await updateImportMetadata(db, result);
      
      console.log(`✅ Import completed: ${result.newCustomers} new customers, ${result.duplicates} duplicates`);
      return result;
      
    } catch (error) {
      console.error('❌ Import failed:', error);
      await sendErrorNotification(db, error);
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
        
        // Build search criteria
        const searchCriteria = ['ALL'];
        
        // If we have a last import timestamp, only get newer emails
        if (lastImport) {
          const dateStr = lastImport.toISOString().split('T')[0];
          searchCriteria.push(['SINCE', dateStr]);
        }
        
        // Search for emails
        imap.search(searchCriteria, async (err, results) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (!results || results.length === 0) {
            console.log('📭 No new emails to process');
            imap.end();
            resolve(importStats);
            return;
          }
          
          importStats.totalEmails = results.length;
          console.log(`📧 Found ${results.length} emails to process`);
          
          // Process emails
          await processEmails(imap, results, importStats, lastImport, db);
          
          // Update last import timestamp
          await updateLastImportTimestamp(db);
          
          // Calculate processing time
          importStats.processingTime = new Date() - importStats.startTime;
          
          imap.end();
          resolve(importStats);
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

/**
 * Process a batch of emails
 */
async function processEmails(imap, emailIds, stats, lastImport, db) {
  return new Promise((resolve) => {
    const fetch = imap.fetch(emailIds, { 
      bodies: '', 
      markSeen: false,
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
              await logFailedImport(db, emailData, 'No customer name');
              stats.skipped++;
              return;
            }
            
            // Check for duplicate
            const isDuplicate = await checkDuplicateCustomer(db, customer);
            if (isDuplicate) {
              console.log(`⚠️ Duplicate customer: ${customer.email || customer.phone}`);
              stats.duplicates++;
              
              // Still create a new quote for existing customer
              const existingCustomer = await findExistingCustomer(db, customer);
              if (existingCustomer) {
                await createAutomaticQuote(db, existingCustomer, emailData);
              }
              return;
            }
            
            // Generate customer number
            customer.customerNumber = await generateCustomerNumber(db);
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
            const quote = await createAutomaticQuote(db, customer, emailData);
            console.log(`✅ Quote created: ${quote.id}`);
            
            // Send welcome email
            if (customer.email) {
              await sendWelcomeEmail(customer, quote);
            }
            
            stats.processedEmails++;
            
          } catch (error) {
            console.error('❌ Processing error:', error);
            await logFailedImport(db, emailData, error.message);
            stats.errors++;
          }
          
          processed++;
          if (processed === emailIds.length) {
            resolve();
          }
        });
      });
    });
    
    fetch.once('end', () => {
      console.log('✅ Finished processing emails');
    });
  });
}

/**
 * Helper functions
 */

async function getLastImportTimestamp(db) {
  try {
    const doc = await db.collection('system').doc('import_metadata').get();
    if (doc.exists) {
      const data = doc.data();
      return data.lastImport ? data.lastImport.toDate() : null;
    }
    return null;
  } catch (error) {
    console.error('Error getting last import timestamp:', error);
    return null;
  }
}

async function updateLastImportTimestamp(db) {
  try {
    await db.collection('system').doc('import_metadata').set({
      lastImport: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error updating last import timestamp:', error);
  }
}

async function updateImportMetadata(db, stats) {
  try {
    await db.collection('system').doc('import_metadata').set({
      lastImport: admin.firestore.FieldValue.serverTimestamp(),
      lastImportStats: stats,
      totalImported: admin.firestore.FieldValue.increment(stats.newCustomers)
    }, { merge: true });
  } catch (error) {
    console.error('Error updating import metadata:', error);
  }
}

async function checkDuplicateCustomer(db, customer) {
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
  
  // Check by name + address (for customers without email/phone)
  if (customer.name && (customer.fromAddress || customer.toAddress)) {
    const address = customer.fromAddress || customer.toAddress;
    const nameAddressCheck = await db.collection('customers')
      .where('name', '==', customer.name)
      .limit(10)
      .get();
    
    for (const doc of nameAddressCheck.docs) {
      const existing = doc.data();
      if (existing.fromAddress === address || existing.toAddress === address) {
        return true;
      }
    }
  }
  
  return false;
}

async function findExistingCustomer(db, customer) {
  if (customer.email) {
    const result = await db.collection('customers')
      .where('email', '==', customer.email)
      .limit(1)
      .get();
    if (!result.empty) return result.docs[0].data();
  }
  
  if (customer.phone) {
    const result = await db.collection('customers')
      .where('phone', '==', customer.phone)
      .limit(1)
      .get();
    if (!result.empty) return result.docs[0].data();
  }
  
  return null;
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

async function createAutomaticQuote(db, customer, emailData) {
  // Base pricing
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
  
  const quoteData = {
    customerId: customer.id,
    customerName: customer.name,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    fromAddress: customer.fromAddress || '',
    toAddress: customer.toAddress || '',
    date: customer.movingDate || null,
    rooms: customer.apartment?.rooms || 0,
    area: customer.apartment?.area || 0,
    floor: customer.apartment?.floor || 0,
    hasElevator: customer.apartment?.hasElevator || false,
    items: [],
    services: [
      {
        name: 'Umzugsservice',
        description: `Komplettumzug für ${customer.apartment?.rooms || 3} Zimmer`,
        price: price
      }
    ],
    volume: volume,
    distance: 10,
    price: price,
    status: 'draft',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'automatic_import',
    emailData: {
      subject: emailData.subject,
      date: emailData.date,
      messageId: emailData.messageId
    }
  };
  
  const quoteRef = db.collection('quotes').doc();
  await quoteRef.set(quoteData);
  
  return { id: quoteRef.id, ...quoteData };
}

async function sendWelcomeEmail(customer, quote) {
  // TODO: Implement welcome email using sendEmailViaSMTP
  console.log(`📧 Would send welcome email to ${customer.email}`);
}

async function sendSuccessNotification(db, stats) {
  try {
    await db.collection('notifications').add({
      type: 'import_success',
      title: 'E-Mail Import erfolgreich',
      message: `${stats.newCustomers} neue Kunden importiert`,
      details: stats,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      read: false
    });
  } catch (error) {
    console.error('Error sending success notification:', error);
  }
}

async function sendErrorNotification(db, error) {
  try {
    await db.collection('notifications').add({
      type: 'import_error',
      title: 'E-Mail Import fehlgeschlagen',
      message: error.message,
      error: error.stack,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      read: false
    });
  } catch (error) {
    console.error('Error sending error notification:', error);
  }
}

async function logFailedImport(db, emailData, reason) {
  try {
    await db.collection('failed_imports').add({
      emailData: emailData,
      reason: reason,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      resolved: false
    });
  } catch (error) {
    console.error('Error logging failed import:', error);
  }
}

function detectEmailSource(from) {
  if (from.includes('immobilienscout24')) return 'ImmobilienScout24';
  if (from.includes('umzug365')) return 'Umzug365';
  if (from.includes('relocato')) return 'Relocato';
  return 'Other';
}