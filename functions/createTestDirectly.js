// Direct test customer creation using Firebase Admin SDK
const admin = require('firebase-admin');

// Initialize Firebase Admin with project ID
const serviceAccount = {
  projectId: 'umzugsapp',
};

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'umzugsapp'
});

const db = admin.firestore();

async function createTestCustomer() {
  console.log('🚀 Creating test customer directly in Firebase...');
  
  try {
    // Test customer data
    const movingDate = new Date();
    movingDate.setDate(movingDate.getDate() + 14);
    const movingDateStr = movingDate.toLocaleDateString('de-DE');
    
    const customerData = {
      name: 'Sergej Schulz',
      email: 'sergej.schulz92@gmail.com',
      phone: '+49 1234 567890',
      fromAddress: 'Detmolder Str. 234a, 33605 Bielefeld',
      toAddress: 'Musterstraße 123, 33602 Bielefeld',
      moveDate: movingDateStr,
      movingDate: movingDateStr,
      apartment: {
        area: 65,
        rooms: 3,
        floor: 1,
        hasElevator: false
      },
      source: 'manual_test',
      customerType: 'private',
      distance: 15,
      packingService: true,
      furnitureAssembly: true,
      notes: 'TEST CUSTOMER - Created for automatic quote system testing',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Generate simple test customer number
    const timestamp = Date.now();
    const customerNumber = `KTEST${timestamp}`;
    customerData.customerNumber = customerNumber;
    customerData.id = customerNumber;
    
    console.log(`📋 Creating customer ${customerNumber}...`);
    
    // Save customer to Firestore
    await db.collection('customers').doc(customerNumber).set(customerData);
    console.log(`✅ Customer created successfully!`);
    
    // Calculate price
    const basePrice = 949; // for 65m²
    const floorSurcharge = 60; // 1st floor no elevator
    const packingPrice = 65 * 8; // 520
    const furniturePrice = 3 * 75; // 225
    
    let subtotal = basePrice + floorSurcharge + packingPrice + furniturePrice;
    subtotal = Math.round(subtotal * 0.95); // Private discount
    const vat = Math.round(subtotal * 0.19);
    const total = subtotal + vat;
    
    // Generate simple test quote number
    const quoteNumber = `QTEST${timestamp}`;
    
    // Create quote document
    const quoteData = {
      id: quoteNumber,
      customerId: customerNumber,
      customerName: customerData.name,
      customerEmail: customerData.email,
      customerPhone: customerData.phone,
      fromAddress: customerData.fromAddress,
      toAddress: customerData.toAddress,
      moveDate: customerData.moveDate,
      movingDate: customerData.movingDate,
      apartment: customerData.apartment,
      distance: customerData.distance,
      services: {
        packing: customerData.packingService,
        furnitureAssembly: customerData.furnitureAssembly
      },
      pricing: {
        basePrice,
        floorSurcharge,
        packingPrice,
        furniturePrice,
        subtotal,
        vat,
        total
      },
      price: total,
      status: 'draft',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'test_script_direct',
      notes: 'Test quote - ready for manual email sending'
    };
    
    console.log(`📄 Creating quote ${quoteNumber}...`);
    await db.collection('quotes').doc(quoteNumber).set(quoteData);
    console.log(`✅ Quote created successfully!`);
    
    console.log('\n🎉 Test data created successfully!');
    console.log('📊 Summary:');
    console.log(`  - Customer: ${customerData.name} (${customerNumber})`);
    console.log(`  - Email: ${customerData.email}`);
    console.log(`  - Quote: ${quoteNumber}`);
    console.log(`  - Total Price: €${total.toFixed(2)}`);
    console.log(`  - Status: Draft (ready for manual sending)`);
    console.log('\n📧 To send the quote email:');
    console.log('  1. Go to the web app');
    console.log('  2. Find the customer in the list');
    console.log('  3. Click on "Send Quote" to generate PDF and send email');
    
    return {
      customer: customerData,
      quote: quoteData,
      success: true
    };
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run the function
createTestCustomer()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });