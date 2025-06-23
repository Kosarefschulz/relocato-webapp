const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { parseEmail } = require('./emailParser');

/**
 * Import the last 300 customers from ALL email folders
 * This function searches ALL folders for customer emails
 */
exports.import300Customers = functions
  .region('europe-west1')
  .runWith({
    timeoutSeconds: 540, // 9 minutes
    memory: '4GB'
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
    
    console.log('🚀 Starting import of last 300 customers from ALL folders...');
    
    try {
      const db = admin.firestore();
      const result = await importLast300Customers(db);
      
      res.json({
        success: true,
        message: 'Import completed',
        stats: result
      });
    } catch (error) {
      console.error('❌ Import error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        stack: error.stack
      });
    }
  });

async function importLast300Customers(db) {
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
    totalCustomers: 0,
    newCustomers: 0,
    duplicates: 0,
    errors: 0,
    emailsByFolder: {},
    processedEmails: []
  };
  
  return new Promise((resolve, reject) => {
    imap.once('ready', () => {
      console.log('✅ Connected to IONOS');
      
      // Get all folders
      imap.getBoxes((err, boxes) => {
        if (err) {
          reject(err);
          return;
        }
        
        console.log('📁 Available folders:', Object.keys(boxes));
        
        // Process folders in priority order
        const foldersToCheck = [
          'INBOX',
          'erfolgreich verarbeitete Anfragen',
          'Sent',
          'Drafts'
        ];
        
        // Add any other folders found
        Object.keys(boxes).forEach(folder => {
          if (!foldersToCheck.includes(folder)) {
            foldersToCheck.push(folder);
          }
        });
        
        processAllFolders(imap, foldersToCheck, db, stats)
          .then(() => {
            imap.end();
            resolve(stats);
          })
          .catch(error => {
            imap.end();
            reject(error);
          });
      });
    });
    
    imap.once('error', (err) => {
      console.error('❌ IMAP error:', err);
      reject(err);
    });
    
    imap.connect();
  });
}

async function processAllFolders(imap, folders, db, stats) {
  const allEmails = [];
  
  // Process each folder
  for (const folder of folders) {
    try {
      console.log(`\n📂 Processing folder: ${folder}`);
      const folderEmails = await processFolder(imap, folder);
      
      stats.emailsByFolder[folder] = folderEmails.length;
      allEmails.push(...folderEmails);
      
      console.log(`✅ Found ${folderEmails.length} emails in ${folder}`);
    } catch (error) {
      console.error(`❌ Error processing folder ${folder}:`, error.message);
    }
  }
  
  // Sort all emails by date (newest first)
  allEmails.sort((a, b) => b.date - a.date);
  
  console.log(`\n📊 Total emails found: ${allEmails.length}`);
  stats.totalEmails = allEmails.length;
  
  // Process only the most recent 300 customer emails
  let customersImported = 0;
  const targetCustomers = 300;
  
  for (const emailData of allEmails) {
    if (customersImported >= targetCustomers) {
      break;
    }
    
    try {
      // Parse customer data
      const customer = parseEmail(emailData);
      
      // Skip if no name
      if (!customer.name || customer.name === 'Unbekannt') {
        continue;
      }
      
      // Skip if no contact info
      if (!customer.email && !customer.phone) {
        continue;
      }
      
      // Check for duplicate
      const isDuplicate = await checkDuplicateCustomer(db, customer);
      if (isDuplicate) {
        stats.duplicates++;
        console.log(`⚠️ Duplicate customer: ${customer.email || customer.phone}`);
        continue;
      }
      
      // Generate customer number
      customer.customerNumber = await generateCustomerNumber(db, emailData.date);
      customer.id = customer.customerNumber;
      
      // Save customer
      await db.collection('customers').doc(customer.id).set({
        ...customer,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        importedFrom: 'import300',
        importDate: new Date(),
        emailFolder: emailData.folder
      });
      
      // Create quote
      await createAutomaticQuote(customer, db);
      
      console.log(`✅ Imported customer #${customersImported + 1}: ${customer.customerNumber} - ${customer.name}`);
      
      customersImported++;
      stats.newCustomers++;
      stats.processedEmails.push({
        folder: emailData.folder,
        date: emailData.date,
        from: emailData.from,
        customerNumber: customer.customerNumber
      });
      
    } catch (error) {
      console.error('❌ Error processing email:', error.message);
      stats.errors++;
    }
  }
  
  stats.totalCustomers = customersImported;
  
  console.log('\n🎉 Import completed!');
  console.log(`📊 Final stats:
    - Total emails scanned: ${stats.totalEmails}
    - New customers imported: ${stats.newCustomers}
    - Duplicates skipped: ${stats.duplicates}
    - Errors: ${stats.errors}`);
  
  return stats;
}

async function processFolder(imap, folderName) {
  return new Promise((resolve, reject) => {
    imap.openBox(folderName, true, (err, box) => {
      if (err) {
        resolve([]);
        return;
      }
      
      if (!box || box.messages.total === 0) {
        resolve([]);
        return;
      }
      
      const emails = [];
      
      // Get ALL emails from the folder (no date restrictions)
      const fetch = imap.fetch('1:*', {
        bodies: '',
        struct: true
      });
      
      fetch.on('message', (msg, seqno) => {
        msg.on('body', (stream) => {
          let buffer = '';
          stream.on('data', chunk => buffer += chunk);
          stream.on('end', () => {
            simpleParser(buffer, (err, parsed) => {
              if (!err && parsed) {
                // Check if it's a customer email
                const isCustomerEmail = 
                  parsed.from?.text?.toLowerCase().includes('immoscout24') ||
                  parsed.from?.text?.toLowerCase().includes('immobilienscout24') ||
                  parsed.from?.text?.toLowerCase().includes('umzug365') ||
                  parsed.from?.text?.toLowerCase().includes('umzug-365') ||
                  parsed.text?.includes('Anfrage #') ||
                  parsed.text?.includes('Voraussichtlicher Umzugstag:') ||
                  parsed.text?.includes('Umzugstermin:') ||
                  parsed.text?.includes('Auszugsadresse:') ||
                  parsed.text?.includes('Einzugsadresse:');
                
                if (isCustomerEmail) {
                  emails.push({
                    from: parsed.from?.text || '',
                    to: parsed.to?.text || '',
                    subject: parsed.subject || '',
                    text: parsed.text || '',
                    html: parsed.html || '',
                    date: parsed.date || new Date(),
                    folder: folderName
                  });
                }
              }
            });
          });
        });
      });
      
      fetch.once('error', (err) => {
        console.error(`Error fetching from ${folderName}:`, err);
        resolve(emails);
      });
      
      fetch.once('end', () => {
        resolve(emails);
      });
    });
  });
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
  
  return false;
}

async function generateCustomerNumber(db, emailDate) {
  const date = emailDate ? new Date(emailDate) : new Date();
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
    createdBy: 'import300',
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