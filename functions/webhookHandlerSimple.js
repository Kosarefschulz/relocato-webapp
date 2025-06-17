const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const { QuoteCalculator, generateQuoteHTML, generatePDFFromHTML, generateEmailText } = require('./quotePriceCalculator');

// Initialize Firestore if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// SMTP Transporter für E-Mail-Versand
function createTransporter() {
  return nodemailer.createTransporter({
    host: functions.config().smtp?.host || 'smtp.ionos.de',
    port: parseInt(functions.config().smtp?.port || '587'),
    secure: false,
    auth: {
      user: functions.config().smtp?.user || 'bielefeld@relocato.de',
      pass: functions.config().smtp?.pass || 'Bicm1308'
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false
    }
  });
}

// Note: QuoteCalculator, generateQuoteHTML, generatePDFFromHTML, and generateEmailText
// are now imported from quotePriceCalculator.js

// Note: HTML template function is now imported from quotePriceCalculator.js

// Note: PDF generation function is now imported from quotePriceCalculator.js

// Note: Email text generation function is now imported from quotePriceCalculator.js

// Webhook-Handler für externe Formulare
exports.handleWebhook = functions
  .region('europe-west1')
  .runWith({
    timeoutSeconds: 540,
    memory: '1GB'
  })
  .https.onRequest(async (req, res) => {
    // CORS Headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }
    
    try {
      console.log('📨 Webhook empfangen:', JSON.stringify(req.body, null, 2));
      
      // Daten extrahieren (kompatibel mit verschiedenen Form-Strukturen)
      const data = req.body;
      
      // Kunde erstellen/aktualisieren
      const customer = {
        name: data.name || data.fullName || data.customer_name || 'Unbekannt',
        email: data.email || data.customer_email || '',
        phone: data.phone || data.telephone || data.customer_phone || '',
        fromAddress: data.fromAddress || data.from_address || data.current_address || '',
        toAddress: data.toAddress || data.to_address || data.new_address || '',
        movingDate: data.movingDate || data.moving_date || data.date || '',
        area: parseInt(data.area || data.apartment_size || data.wohnflaeche || 60),
        rooms: parseInt(data.rooms || data.zimmer || 3),
        fromFloor: parseInt(data.fromFloor || data.from_floor || data.etage_von || 0),
        toFloor: parseInt(data.toFloor || data.to_floor || data.etage_nach || 0),
        hasElevatorFrom: data.hasElevatorFrom === 'true' || data.elevator_from === 'yes' || false,
        hasElevatorTo: data.hasElevatorTo === 'true' || data.elevator_to === 'yes' || false,
        distance: parseInt(data.distance || data.entfernung || 25),
        packingService: data.packingService === 'true' || data.packing_service === 'yes' || false,
        furnitureAssembly: data.furnitureAssembly === 'true' || data.furniture_assembly === 'yes' || false,
        customerType: data.customerType || data.customer_type || 'private',
        source: data.source || 'webhook',
        notes: data.notes || data.comments || data.bemerkungen || '',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      // Kundennummer generieren
      const customerNumber = await generateCustomerNumber();
      customer.customerNumber = customerNumber;
      customer.id = customerNumber;
      
      // Kunde in Firestore speichern
      await db.collection('customers').doc(customer.id).set(customer);
      console.log('✅ Kunde gespeichert:', customer.id);
      
      // Preis berechnen
      const calculator = new QuoteCalculator();
      const calculation = calculator.calculateQuote(customer);
      console.log('💰 Preis berechnet:', calculation);
      
      // Angebotsnummer generieren
      const quoteNumber = `Q${Date.now()}_${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      
      // Angebot in Firestore speichern
      const quote = {
        id: quoteNumber,
        customerId: customer.id,
        customerName: customer.name,
        price: calculation.total,
        status: 'sent',
        comment: `Automatisch erstellt via Webhook von ${customer.source}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: 'webhook',
        volume: Math.round(customer.area * 0.3), // Geschätztes Volumen
        distance: customer.distance,
        moveDate: customer.movingDate,
        fromAddress: customer.fromAddress,
        toAddress: customer.toAddress,
        calculation: calculation,
        details: {
          area: customer.area,
          rooms: customer.rooms,
          packingRequested: customer.packingService,
          furnitureAssembly: customer.furnitureAssembly
        }
      };
      
      await db.collection('quotes').doc(quoteNumber).set(quote);
      console.log('✅ Angebot gespeichert:', quoteNumber);
      
      // HTML für PDF generieren
      const html = generateQuoteHTML(customer, calculation, quoteNumber);
      
      // PDF generieren
      console.log('📄 Generiere PDF...');
      const pdfBuffer = await generatePDFFromHTML(html);
      console.log('✅ PDF generiert, Größe:', pdfBuffer.length);
      
      // E-Mail senden
      if (customer.email) {
        console.log('📧 Sende E-Mail an:', customer.email);
        
        const transporter = createTransporter();
        const emailText = generateEmailText(customer, calculation, quoteNumber);
        
        const mailOptions = {
          from: 'RELOCATO® Bielefeld <bielefeld@relocato.de>',
          to: customer.email,
          bcc: 'bielefeld@relocato.de', // Kopie für Archiv
          subject: `Ihr Umzugsangebot #${quoteNumber} - RELOCATO®`,
          text: emailText,
          html: emailText.replace(/\n/g, '<br>'),
          attachments: [{
            filename: `Umzugsangebot_${quoteNumber}_RELOCATO.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }]
        };
        
        await transporter.sendMail(mailOptions);
        console.log('✅ E-Mail erfolgreich gesendet');
        
        // E-Mail-Historie speichern
        await db.collection('emailHistory').add({
          to: customer.email,
          subject: mailOptions.subject,
          content: emailText,
          customerId: customer.id,
          customerName: customer.name,
          quoteId: quoteNumber,
          templateType: 'quote_webhook',
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'sent',
          source: 'webhook'
        });
      }
      
      // Erfolgreiche Antwort
      res.status(200).json({
        success: true,
        message: 'Angebot erfolgreich erstellt und versendet',
        data: {
          customerId: customer.id,
          customerNumber: customer.customerNumber,
          quoteId: quoteNumber,
          price: calculation.total,
          emailSent: !!customer.email
        }
      });
      
    } catch (error) {
      console.error('❌ Webhook-Fehler:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        details: error.stack
      });
    }
  });

// Hilfsfunktion: Kundennummer generieren
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