const fetch = require('node-fetch');

// Preis-Kalkulation basierend auf Zapier-Logik
class QuoteCalculator {
  constructor() {
    // Basis-Preise nach Wohnfläche (aus Zapier-Script)
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
      distanceSurcharge: 3.5, // Euro pro zusätzlichem km (updated from Zapier spec)
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

// HTML-Template für Angebots-PDF
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
        <p><strong>Telefon:</strong> ${customer.phone || 'Nicht angegeben'}</p>
        <p><strong>E-Mail:</strong> ${customer.email}</p>
        <p><strong>Von:</strong> ${customer.fromAddress || 'Wird noch mitgeteilt'}</p>
        <p><strong>Nach:</strong> ${customer.toAddress || 'Wird noch mitgeteilt'}</p>
        <p><strong>Umzugsdatum:</strong> ${customer.movingDate || 'Nach Vereinbarung'}</p>
    </div>

    <h2>Umzugsdetails</h2>
    <p><strong>Wohnfläche:</strong> ${customer.area || customer.apartment?.area || 60} m²</p>
    <p><strong>Zimmer:</strong> ${customer.rooms || customer.apartment?.rooms || 3}</p>
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
                <td>Transport für ${customer.area || customer.apartment?.area || 60} m² Wohnfläche</td>
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
• Wohnfläche: ${customer.area || customer.apartment?.area || 60} m²
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

module.exports = {
  QuoteCalculator,
  generateQuoteHTML,
  generatePDFFromHTML,
  generateEmailText
};