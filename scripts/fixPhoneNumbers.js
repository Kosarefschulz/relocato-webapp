const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixPhoneNumbers() {
  console.log('📞 Starting phone number fix...\n');
  
  try {
    // Get all customers
    const customersSnapshot = await db.collection('customers').get();
    console.log(`Found ${customersSnapshot.size} customers to check\n`);
    
    let fixed = 0;
    let errors = 0;
    const fixedNumbers = [];
    
    for (const doc of customersSnapshot.docs) {
      const customer = doc.data();
      const customerId = doc.id;
      
      if (customer.phone) {
        const oldPhone = customer.phone;
        const newPhone = fixPhoneNumber(oldPhone);
        
        if (oldPhone !== newPhone) {
          try {
            // Update the phone number
            await db.collection('customers').doc(customerId).update({
              phone: newPhone,
              phoneFixed: true,
              phoneFixDate: admin.firestore.FieldValue.serverTimestamp()
            });
            
            fixed++;
            fixedNumbers.push({
              customerName: customer.name,
              customerNumber: customer.customerNumber,
              oldPhone: oldPhone,
              newPhone: newPhone
            });
            
            console.log(`✅ Fixed: ${customer.name} - ${oldPhone} → ${newPhone}`);
          } catch (error) {
            console.error(`❌ Error fixing ${customer.name}:`, error.message);
            errors++;
          }
        }
      }
      
      // Also check whatsapp field
      if (customer.whatsapp) {
        const oldWhatsapp = customer.whatsapp;
        const newWhatsapp = fixPhoneNumber(oldWhatsapp);
        
        if (oldWhatsapp !== newWhatsapp) {
          try {
            await db.collection('customers').doc(customerId).update({
              whatsapp: newWhatsapp
            });
            
            console.log(`✅ Fixed WhatsApp: ${customer.name} - ${oldWhatsapp} → ${newWhatsapp}`);
          } catch (error) {
            console.error(`❌ Error fixing WhatsApp ${customer.name}:`, error.message);
          }
        }
      }
    }
    
    console.log(`\n🎉 Phone number fix completed!
    ================================
    Total customers: ${customersSnapshot.size}
    Fixed: ${fixed}
    Errors: ${errors}
    ================================\n`);
    
    if (fixedNumbers.length > 0) {
      console.log('📋 Fixed phone numbers:');
      fixedNumbers.forEach((fix, idx) => {
        console.log(`${idx + 1}. ${fix.customerName} (${fix.customerNumber})`);
        console.log(`   ${fix.oldPhone} → ${fix.newPhone}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
  
  process.exit(0);
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

// Run the fix
fixPhoneNumbers();