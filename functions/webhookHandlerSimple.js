const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const fetch = require('node-fetch');

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

// Preis-Kalkulation basierend auf Python-Script
class QuoteCalculator {
  constructor() {
    // Basis-Preise nach Wohnfläche (aus Python-Script)
    this.areaPrices = [
      { maxArea: 25, price: 399 },
      { maxArea: 40, price: 549 },
      { maxArea: 60, price: 749 },
      { maxArea: 80, price: 949 },
      { maxArea: 100, price: 1149 },
      { maxArea: Infinity, price: 1349 }
    ];
    
    // Etagen-Zuschläge (ohne Aufzug)
    this.floorSurcharges = {
      1: 60,
      2: 120,
      3: 180,
      4: 240
    };
    
    // Service-Preise
    this.serviceRates = {
      packing: 8, // Euro pro m²
      furnitureAssembly: 75, // Euro pro Zimmer
      includedDistance: 50, // km inklusive
      distanceSurcharge: 1.5, // Euro pro zusätzlichem km
      privateDiscount: 0.05, // 5% Rabatt für Privatkunden
      vat: 0.19 // 19% MwSt.
    };
  }
  
  calculateBasePrice(area) {
    const priceEntry = this.areaPrices.find(entry => area <= entry.maxArea);
    return priceEntry ? priceEntry.price : this.areaPrices[this.areaPrices.length - 1].price;
  }
  
  calculateFloorSurcharge(fromFloor, toFloor, hasElevatorFrom, hasElevatorTo) {
    let surcharge = 0;
    
    if (!hasElevatorFrom && fromFloor > 0) {
      surcharge += this.floorSurcharges[Math.min(fromFloor, 4)] || this.floorSurcharges[4];
    }
    
    if (!hasElevatorTo && toFloor > 0) {
      surcharge += this.floorSurcharges[Math.min(toFloor, 4)] || this.floorSurcharges[4];
    }
    
    return surcharge;
  }
  
  calculateDistanceSurcharge(distance) {
    if (distance <= this.serviceRates.includedDistance) return 0;
    return Math.round((distance - this.serviceRates.includedDistance) * this.serviceRates.distanceSurcharge);
  }
  
  calculateQuote(data) {
    // Basis-Preis basierend auf Wohnfläche
    const basePrice = this.calculateBasePrice(data.area || 60);
    
    // Etagen-Zuschlag
    const floorSurcharge = this.calculateFloorSurcharge(
      data.fromFloor || 0,
      data.toFloor || 0,
      data.hasElevatorFrom || false,
      data.hasElevatorTo || false
    );
    
    // Entfernungs-Zuschlag
    const distanceSurcharge = this.calculateDistanceSurcharge(data.distance || 25);
    
    // Verpackungsservice
    const packingPrice = data.packingService ? Math.round((data.area || 60) * this.serviceRates.packing) : 0;
    
    // Möbelmontage
    const furniturePrice = data.furnitureAssembly ? Math.round((data.rooms || 3) * this.serviceRates.furnitureAssembly) : 0;
    
    // Zwischensumme
    let subtotal = basePrice + floorSurcharge + distanceSurcharge + packingPrice + furniturePrice;
    
    // Privatkunden-Rabatt
    if (data.customerType === 'private') {
      subtotal = Math.round(subtotal * (1 - this.serviceRates.privateDiscount));
    }
    
    // MwSt. hinzufügen
    const vat = Math.round(subtotal * this.serviceRates.vat);
    const total = subtotal + vat;
    
    return {
      basePrice,
      floorSurcharge,
      distanceSurcharge,
      packingPrice,
      furniturePrice,
      subtotal,
      vat,
      total,
      breakdown: {
        base: basePrice,
        floors: floorSurcharge,
        distance: distanceSurcharge,
        packing: packingPrice,
        furniture: furniturePrice
      }
    };
  }
}

// HTML-Template für Angebots-PDF (kompakt)
function generateQuoteHTML(customer, calculation, quoteNumber) {
  const currentDate = new Date().toLocaleDateString('de-DE');
  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE');
  
  return `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>Umzugsangebot - RELOCATO®</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #e74c3c;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            color: #e74c3c;
            margin-bottom: 10px;
        }
        .quote-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 25px;
            display: flex;
            justify-content: space-between;
        }
        .customer-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
        }
        .price-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
        }
        .price-table th,
        .price-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        .price-table th {
            background-color: #e74c3c;
            color: white;
        }
        .total-row {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        .total-price {
            font-size: 24px;
            color: #e74c3c;
            text-align: center;
            margin: 25px 0;
            padding: 15px;
            border: 2px solid #e74c3c;
            border-radius: 8px;
        }
        .conditions {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-top: 25px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">RELOCATO®</div>
        <div>Ihr zuverlässiger Partner für stressfreie Umzüge</div>
        <div>📞 0521 / 329 777 30 | 📧 bielefeld@relocato.de</div>
    </div>

    <h1 style="color: #e74c3c; text-align: center;">Umzugsangebot</h1>

    <div class="quote-info">
        <div><strong>Angebotsnummer:</strong> #${quoteNumber}</div>
        <div><strong>Datum:</strong> ${currentDate}</div>
        <div><strong>Gültig bis:</strong> ${validUntil}</div>
    </div>

    <div class="customer-section">
        <h2>Kundeninformationen</h2>
        <p><strong>Name:</strong> ${customer.name}</p>
        <p><strong>Telefon:</strong> ${customer.phone}</p>
        <p><strong>E-Mail:</strong> ${customer.email}</p>
        <p><strong>Von:</strong> ${customer.fromAddress}</p>
        <p><strong>Nach:</strong> ${customer.toAddress}</p>
        <p><strong>Umzugsdatum:</strong> ${customer.movingDate || 'Nach Vereinbarung'}</p>
    </div>

    <h2>Umzugsdetails</h2>
    <p><strong>Wohnfläche:</strong> ${customer.area || 60} m²</p>
    <p><strong>Zimmer:</strong> ${customer.rooms || 3}</p>
    <p><strong>Entfernung:</strong> ca. ${customer.distance || 25} km</p>
    ${customer.packingService ? '<p><strong>Verpackungsservice:</strong> Ja</p>' : ''}
    ${customer.furnitureAssembly ? '<p><strong>Möbelmontage:</strong> Ja</p>' : ''}

    <table class="price-table">
        <thead>
            <tr>
                <th>Position</th>
                <th>Beschreibung</th>
                <th>Preis</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Basis-Umzug</td>
                <td>Transport für ${customer.area || 60} m² Wohnfläche</td>
                <td>€ ${calculation.basePrice.toFixed(2)}</td>
            </tr>
            ${calculation.floorSurcharge > 0 ? `
            <tr>
                <td>Etagen-Zuschlag</td>
                <td>Zusätzliche Stockwerke ohne Aufzug</td>
                <td>€ ${calculation.floorSurcharge.toFixed(2)}</td>
            </tr>
            ` : ''}
            ${calculation.distanceSurcharge > 0 ? `
            <tr>
                <td>Entfernungs-Zuschlag</td>
                <td>Zusätzliche Entfernung über 50km</td>
                <td>€ ${calculation.distanceSurcharge.toFixed(2)}</td>
            </tr>
            ` : ''}
            ${calculation.packingPrice > 0 ? `
            <tr>
                <td>Verpackungsservice</td>
                <td>Professionelle Verpackung Ihrer Gegenstände</td>
                <td>€ ${calculation.packingPrice.toFixed(2)}</td>
            </tr>
            ` : ''}
            ${calculation.furniturePrice > 0 ? `
            <tr>
                <td>Möbelmontage</td>
                <td>Auf- und Abbau Ihrer Möbel</td>
                <td>€ ${calculation.furniturePrice.toFixed(2)}</td>
            </tr>
            ` : ''}
            ${customer.customerType === 'private' ? `
            <tr>
                <td>Privatkundenrabatt</td>
                <td>5% Rabatt für Privatkunden</td>
                <td>-€ ${((calculation.basePrice + calculation.floorSurcharge + calculation.distanceSurcharge + calculation.packingPrice + calculation.furniturePrice) * 0.05).toFixed(2)}</td>
            </tr>
            ` : ''}
            <tr>
                <td colspan="2">Zwischensumme (netto)</td>
                <td>€ ${calculation.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
                <td colspan="2">MwSt. 19%</td>
                <td>€ ${calculation.vat.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
                <td colspan="2"><strong>Gesamtpreis</strong></td>
                <td><strong>€ ${calculation.total.toFixed(2)}</strong></td>
            </tr>
        </tbody>
    </table>

    <div class="total-price">
        <strong>Ihr Umzugspreis: € ${calculation.total.toFixed(2)} 🚛</strong>
    </div>

    <div class="conditions">
        <h3>Leistungen & Bedingungen</h3>
        <ul>
            <li>✅ Professionelle Möbelpacker</li>
            <li>✅ Vollständig versicherter Transport</li>
            <li>✅ Moderne Fahrzeugflotte</li>
            <li>✅ Kostenlose Besichtigung vor Ort</li>
            <li>📋 Angebot gültig für 30 Tage</li>
            <li>💰 Zahlung nach erfolgreicher Durchführung</li>
        </ul>
    </div>

    <div style="text-align: center; margin: 30px 0;">
        <p><strong>Haben Sie Fragen? Rufen Sie uns an!</strong></p>
        <p style="font-size: 18px; color: #e74c3c;">📞 0521 / 329 777 30</p>
    </div>

    <div class="footer">
        <p>RELOCATO® - Ihr Partner für stressfreie Umzüge</p>
        <p>Wertvoll Dienstleistungen GmbH | Detmolder Str. 234a, 33605 Bielefeld</p>
        <p>Geschäftsführer: Sergej Schulz | HRB 43574 | USt-IdNr.: DE815143866</p>
    </div>
</body>
</html>`;
}

// PDF-Generierung mit PDFShift
async function generatePDFFromHTML(html) {
  try {
    const response = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from('api:sk_cd456151b38d36f96ab4b1f088de8bb65d214897').toString('base64'),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: html,
        format: 'A4',
        margin: '20px',
        css: 'print'
      })
    });

    if (!response.ok) {
      throw new Error(`PDFShift API error: ${response.status}`);
    }

    const buffer = await response.buffer();
    return buffer;
  } catch (error) {
    console.error('❌ PDF-Generierung fehlgeschlagen:', error);
    throw error;
  }
}

// E-Mail-Text generieren
function generateEmailText(customer, calculation, quoteNumber) {
  return `Sehr geehrte/r ${customer.name},

vielen Dank für Ihre Umzugsanfrage bei RELOCATO®!

Wir freuen uns, Ihnen Ihr persönliches Umzugsangebot zusenden zu können.

📋 IHRE ANFRAGE-DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Angebotsnummer: #${quoteNumber}
• Von: ${customer.fromAddress || 'Wird noch mitgeteilt'}
• Nach: ${customer.toAddress || 'Wird noch mitgeteilt'}
• Umzugstermin: ${customer.movingDate || 'Nach Vereinbarung'}
• Wohnfläche: ${customer.area || 60} m²
• Entfernung: ca. ${customer.distance || 25} km

💰 IHR UMZUGSPREIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Gesamtpreis inkl. MwSt.: ${calculation.total.toFixed(2)} €

Im Anhang finden Sie Ihr detailliertes Angebot mit allen Leistungen und der genauen Preisaufstellung.

✅ IHRE VORTEILE BEI RELOCATO®:
• Festpreisgarantie - keine versteckten Kosten
• Professionelle Umzugshelfer
• Moderne Fahrzeugflotte
• Vollständige Transportversicherung
• Kostenlose Vor-Ort-Besichtigung möglich

📞 NÄCHSTE SCHRITTE:
1. Prüfen Sie das beigefügte Angebot in Ruhe
2. Bei Fragen rufen Sie uns gerne an: 0521 / 329 777 30
3. Für eine Buchung antworten Sie einfach auf diese E-Mail

Das Angebot ist 30 Tage gültig. 

Wir freuen uns darauf, Ihren Umzug zu einem stressfreien Erlebnis zu machen!

Mit freundlichen Grüßen
Ihr RELOCATO® Team

--
RELOCATO® Bielefeld
Detmolder Str. 234a
33605 Bielefeld

📞 0521 / 329 777 30
📧 bielefeld@relocato.de
🌐 www.relocato.de`;
}

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