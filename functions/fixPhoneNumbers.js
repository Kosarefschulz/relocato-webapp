const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * Fix phone numbers in the database that have the +4949 issue
 */
exports.fixPhoneNumbers = functions
  .region('europe-west1')
  .runWith({
    timeoutSeconds: 540,
    memory: '1GB'
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
    
    console.log('📞 Starting phone number fix...');
    
    try {
      const db = admin.firestore();
      const result = await fixAllPhoneNumbers(db);
      
      res.json({
        success: true,
        message: 'Phone numbers fixed successfully',
        ...result
      });
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

async function fixAllPhoneNumbers(db) {
  const stats = {
    totalCustomers: 0,
    fixed: 0,
    errors: 0,
    fixedNumbers: []
  };
  
  try {
    // Get all customers
    const customersSnapshot = await db.collection('customers').get();
    stats.totalCustomers = customersSnapshot.size;
    
    console.log(`Found ${customersSnapshot.size} customers to check`);
    
    // Process in batches
    const batch = db.batch();
    let batchCount = 0;
    const maxBatchSize = 400; // Firestore limit is 500
    
    for (const doc of customersSnapshot.docs) {
      const customer = doc.data();
      const customerId = doc.id;
      let needsUpdate = false;
      const updates = {};
      
      // Check phone field
      if (customer.phone) {
        const oldPhone = customer.phone;
        const newPhone = fixPhoneNumber(oldPhone);
        
        if (oldPhone !== newPhone) {
          updates.phone = newPhone;
          needsUpdate = true;
          
          stats.fixedNumbers.push({
            customerName: customer.name,
            customerNumber: customer.customerNumber,
            field: 'phone',
            oldValue: oldPhone,
            newValue: newPhone
          });
          
          console.log(`📞 Fixing phone: ${customer.name} - ${oldPhone} → ${newPhone}`);
        }
      }
      
      // Check whatsapp field
      if (customer.whatsapp) {
        const oldWhatsapp = customer.whatsapp;
        const newWhatsapp = fixPhoneNumber(oldWhatsapp);
        
        if (oldWhatsapp !== newWhatsapp) {
          updates.whatsapp = newWhatsapp;
          needsUpdate = true;
          
          stats.fixedNumbers.push({
            customerName: customer.name,
            customerNumber: customer.customerNumber,
            field: 'whatsapp',
            oldValue: oldWhatsapp,
            newValue: newWhatsapp
          });
          
          console.log(`💬 Fixing WhatsApp: ${customer.name} - ${oldWhatsapp} → ${newWhatsapp}`);
        }
      }
      
      // Add to batch if needs update
      if (needsUpdate) {
        updates.phoneFixed = true;
        updates.phoneFixDate = admin.firestore.FieldValue.serverTimestamp();
        
        batch.update(db.collection('customers').doc(customerId), updates);
        batchCount++;
        stats.fixed++;
        
        // Commit batch if it's getting full
        if (batchCount >= maxBatchSize) {
          await batch.commit();
          console.log(`✅ Committed batch of ${batchCount} updates`);
          batchCount = 0;
        }
      }
    }
    
    // Commit any remaining updates
    if (batchCount > 0) {
      await batch.commit();
      console.log(`✅ Committed final batch of ${batchCount} updates`);
    }
    
    console.log(`\n🎉 Phone number fix completed!
    Total customers: ${stats.totalCustomers}
    Fixed: ${stats.fixed}
    Errors: ${stats.errors}`);
    
    return stats;
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    stats.errors++;
    throw error;
  }
}

function fixPhoneNumber(phone) {
  if (!phone) return '';
  
  // Remove all non-numeric characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If already correctly formatted, return as is
  if (cleaned.startsWith('+49') && !cleaned.startsWith('+4949')) {
    return cleaned;
  }
  
  // Fix the specific issue: +4949... → +49...
  if (cleaned.startsWith('+4949')) {
    return '+49' + cleaned.substring(5);
  }
  
  // Handle other cases
  if (cleaned && !cleaned.startsWith('+')) {
    if (cleaned.startsWith('0')) {
      // German number starting with 0
      cleaned = '+49' + cleaned.substring(1);
    } else if (cleaned.startsWith('49')) {
      // Already has German country code, just add +
      cleaned = '+' + cleaned;
    } else if (cleaned.length >= 10) {
      // Other number without country code
      cleaned = '+49' + cleaned;
    }
  }
  
  return cleaned;
}