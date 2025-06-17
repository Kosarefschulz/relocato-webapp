const admin = require('firebase-admin');
const { QuoteCalculator, generateQuoteHTML, generatePDFFromHTML, generateEmailText } = require('./quotePriceCalculator');
const nodemailer = require('nodemailer');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Email configuration for sending
const transporter = nodemailer.createTransport({
  host: 'smtp.ionos.de',
  port: 587,
  secure: false,
  auth: {
    user: 'bielefeld@relocato.de',
    pass: 'Bicm1308'
  }
});

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

async function generateQuoteNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  const counterRef = db.collection('counters').doc(`quotes_${year}_${month}`);
  
  const newNumber = await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(counterRef);
    
    let counter = 1;
    if (doc.exists) {
      counter = (doc.data().value || 0) + 1;
    }
    
    transaction.set(counterRef, { value: counter });
    
    return `Q${year}${month}${String(counter).padStart(3, '0')}`;
  });
  
  return newNumber;
}

async function createTestCustomer() {
  console.log('🚀 Starting test customer creation...');
  
  try {
    // Calculate moving date (2 weeks from now)
    const movingDate = new Date();
    movingDate.setDate(movingDate.getDate() + 14);
    const movingDateStr = movingDate.toLocaleDateString('de-DE');
    
    // Test customer data
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
      distance: 15, // km within Bielefeld
      packingService: true,
      furnitureAssembly: true,
      notes: 'TEST CUSTOMER - Created for automatic quote system testing',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Generate customer number
    const customerNumber = await generateCustomerNumber();
    customerData.customerNumber = customerNumber;
    customerData.id = customerNumber;
    
    console.log(`📋 Creating customer ${customerNumber}...`);
    
    // Save customer to Firestore
    await db.collection('customers').doc(customerNumber).set(customerData);
    console.log(`✅ Customer created: ${customerNumber}`);
    
    // Create quote data
    const calculator = new QuoteCalculator();
    const calculation = calculator.calculateQuote({
      area: customerData.apartment.area,
      rooms: customerData.apartment.rooms,
      fromFloor: customerData.apartment.floor,
      toFloor: 0,
      hasElevatorFrom: customerData.apartment.hasElevator,
      hasElevatorTo: true,
      distance: customerData.distance,
      packingService: customerData.packingService,
      furnitureAssembly: customerData.furnitureAssembly,
      customerType: customerData.customerType
    });
    
    console.log('💰 Price calculation:', calculation);
    
    // Generate quote number
    const quoteNumber = await generateQuoteNumber();
    
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
      pricing: calculation,
      price: calculation.total,
      status: 'sent',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'test_script',
      notes: 'Automatically generated test quote'
    };
    
    console.log(`📄 Creating quote ${quoteNumber}...`);
    await db.collection('quotes').doc(quoteNumber).set(quoteData);
    console.log(`✅ Quote created: ${quoteNumber}`);
    
    // Generate PDF
    console.log('📑 Generating PDF...');
    const html = generateQuoteHTML(customerData, calculation, quoteNumber);
    const pdfBuffer = await generatePDFFromHTML(html);
    console.log('✅ PDF generated successfully');
    
    // Generate email content
    const emailText = generateEmailText(customerData, calculation, quoteNumber);
    const emailHtml = emailText.replace(/\n/g, '<br>').replace(/━/g, '─');
    
    // Send email with PDF attachment
    console.log('📧 Sending email to', customerData.email);
    const mailOptions = {
      from: {
        name: 'RELOCATO® Bielefeld',
        address: 'bielefeld@relocato.de'
      },
      to: customerData.email,
      subject: `Ihr Umzugsangebot #${quoteNumber} - RELOCATO®`,
      text: emailText,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${emailHtml}</div>`,
      attachments: [
        {
          filename: `Umzugsangebot_${quoteNumber}_RELOCATO.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    
    // Save email history
    await db.collection('emailHistory').add({
      to: customerData.email,
      subject: mailOptions.subject,
      content: emailText,
      customerId: customerNumber,
      customerName: customerData.name,
      quoteId: quoteNumber,
      templateType: 'quote_automatic',
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'sent',
      messageId: info.messageId,
      source: 'test_script'
    });
    
    console.log('✅ Email history saved');
    
    // Update Google Sheets if webhook is configured
    try {
      const webhookUrl = 'https://hook.eu2.make.com/w17yktqb6gkpajddcw8m5b9lgp4tnk9c';
      const webhookData = {
        eventType: 'quote.created',
        timestamp: new Date().toISOString(),
        data: {
          quoteId: quoteNumber,
          customerId: customerNumber,
          customerName: customerData.name,
          customerEmail: customerData.email,
          customerPhone: customerData.phone,
          fromAddress: customerData.fromAddress,
          toAddress: customerData.toAddress,
          moveDate: customerData.moveDate,
          totalPrice: calculation.total,
          status: 'sent'
        }
      };
      
      const fetch = require('node-fetch');
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData)
      });
      
      if (response.ok) {
        console.log('✅ Webhook notification sent to Make.com');
      } else {
        console.warn('⚠️ Webhook notification failed:', response.status);
      }
    } catch (webhookError) {
      console.warn('⚠️ Webhook error (non-critical):', webhookError.message);
    }
    
    console.log('\n🎉 Test customer creation completed successfully!');
    console.log('📊 Summary:');
    console.log(`  - Customer: ${customerData.name} (${customerNumber})`);
    console.log(`  - Email: ${customerData.email}`);
    console.log(`  - Quote: ${quoteNumber}`);
    console.log(`  - Total Price: €${calculation.total.toFixed(2)}`);
    console.log(`  - Moving Date: ${movingDateStr}`);
    console.log(`  - From: ${customerData.fromAddress}`);
    console.log(`  - To: ${customerData.toAddress}`);
    
    return {
      customer: customerData,
      quote: quoteData,
      success: true
    };
    
  } catch (error) {
    console.error('❌ Error creating test customer:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createTestCustomer()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createTestCustomer };