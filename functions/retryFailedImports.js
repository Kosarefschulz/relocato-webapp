const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { parseEmail } = require('./emailParser');

/**
 * Retry failed imports with more lenient rules
 * Can be triggered manually from the Failed Email Recovery UI
 */
exports.retryFailedImports = functions
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
    
    const db = admin.firestore();
    const { failedImportIds, lenientMode = false } = req.body;
    
    if (!failedImportIds || !Array.isArray(failedImportIds)) {
      res.status(400).json({
        success: false,
        error: 'Missing or invalid failedImportIds array'
      });
      return;
    }
    
    console.log(`🔄 Retrying ${failedImportIds.length} failed imports in ${lenientMode ? 'lenient' : 'normal'} mode`);
    
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: []
    };
    
    try {
      for (const importId of failedImportIds) {
        try {
          // Get failed import
          const failedDoc = await db.collection('failed_imports').doc(importId).get();
          if (!failedDoc.exists) {
            console.warn(`Failed import ${importId} not found`);
            results.errors.push({ id: importId, error: 'Not found' });
            results.failed++;
            continue;
          }
          
          const failedData = failedDoc.data();
          const emailData = failedData.emailData;
          
          // Try to parse again
          const customer = parseEmail(emailData);
          
          // Apply lenient validation if enabled
          if (lenientMode) {
            // In lenient mode, we only require name OR email OR phone
            const hasMinimumData = 
              (customer.name && customer.name !== 'Unbekannt') ||
              customer.email ||
              customer.phone;
              
            if (!hasMinimumData) {
              // Try to extract email from the from field
              if (emailData.from) {
                const fromEmailMatch = emailData.from.match(/<?([\w\.\-]+@[\w\.\-]+\.\w+)>?/);
                if (fromEmailMatch) {
                  customer.email = fromEmailMatch[1];
                  customer.name = customer.name || fromEmailMatch[1].split('@')[0];
                }
              }
            }
          } else {
            // Normal mode validation
            if (!customer.name || customer.name === 'Unbekannt') {
              throw new Error('No customer name found');
            }
            if (!customer.email && !customer.phone) {
              throw new Error('No contact information found');
            }
          }
          
          // Check for duplicate
          const isDuplicate = await checkDuplicateCustomer(db, customer);
          if (isDuplicate) {
            throw new Error('Duplicate customer');
          }
          
          // Generate customer number
          customer.customerNumber = await generateCustomerNumber(db);
          customer.id = customer.customerNumber;
          
          // Add import metadata
          customer.importedAt = admin.firestore.FieldValue.serverTimestamp();
          customer.importSource = 'retry_import';
          customer.emailMessageId = emailData.messageId;
          customer.originalFailureReason = failedData.reason;
          customer.retriedAt = admin.firestore.FieldValue.serverTimestamp();
          customer.lenientMode = lenientMode;
          
          // Save customer
          await db.collection('customers').doc(customer.id).set({
            ...customer,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          // Create automatic quote
          await createAutomaticQuote(db, customer, emailData);
          
          // Mark failed import as resolved
          await db.collection('failed_imports').doc(importId).update({
            resolved: true,
            resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
            resolvedBy: 'retry_import',
            newCustomerId: customer.id
          });
          
          console.log(`✅ Successfully imported: ${customer.customerNumber} - ${customer.name}`);
          results.successful++;
          
        } catch (error) {
          console.error(`❌ Failed to retry import ${importId}:`, error);
          results.errors.push({ id: importId, error: error.message });
          results.failed++;
        }
        
        results.processed++;
      }
      
      res.json({
        success: true,
        results
      });
      
    } catch (error) {
      console.error('❌ Retry import failed:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

// Helper functions (same as in automaticEmailImporter.js)
async function checkDuplicateCustomer(db, customer) {
  if (customer.email) {
    const emailCheck = await db.collection('customers')
      .where('email', '==', customer.email)
      .limit(1)
      .get();
    if (!emailCheck.empty) return true;
  }
  
  if (customer.phone) {
    const phoneCheck = await db.collection('customers')
      .where('phone', '==', customer.phone)
      .limit(1)
      .get();
    if (!phoneCheck.empty) return true;
  }
  
  return false;
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
    createdBy: 'retry_import',
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