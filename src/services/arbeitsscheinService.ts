import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { PaymentInfo, Quote, Customer } from '../types';

export interface ArbeitsscheinData {
  auftragsnummer: string;
  kunde: {
    name: string;
    telefon: string;
    email?: string;
  };
  datum: Date;
  volumen: number;
  strecke: number;
  vonAdresse: {
    strasse: string;
    ort: string;
    etage: string;
  };
  nachAdresse: {
    strasse: string;
    ort: string;
    etage: string;
  };
  leistungen: string[];
  preis: number;
  paymentInfo?: PaymentInfo;
}

export const generateArbeitsschein = (data: ArbeitsscheinData): Blob => {
  const doc = new jsPDF({
    format: 'a4',
    unit: 'mm'
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Helper function for centered text
  const centerText = (text: string, y: number, fontSize = 12) => {
    doc.setFontSize(fontSize);
    const textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, y);
  };

  // Logo
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  centerText('RELOCATO®', yPos);
  yPos += 10;

  // Green line
  doc.setDrawColor(139, 195, 74);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Title
  doc.setFontSize(18);
  doc.setTextColor(139, 195, 74);
  centerText('ARBEITSSCHEIN', yPos);
  doc.setTextColor(0, 0, 0);
  yPos += 15;

  // Customer info section
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 30, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Left column
  let leftX = margin + 5;
  let rightX = pageWidth / 2 + 5;
  let infoY = yPos;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Auftragsnummer:', leftX, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.auftragsnummer, leftX + 35, infoY);
  
  infoY += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Kunde:', leftX, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.kunde.name, leftX + 35, infoY);
  
  infoY += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Telefon:', leftX, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.kunde.telefon, leftX + 35, infoY);
  
  // Right column
  infoY = yPos;
  doc.setFont('helvetica', 'bold');
  doc.text('Datum:', rightX, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(format(data.datum, 'dd.MM.yyyy', { locale: de }), rightX + 35, infoY);
  
  infoY += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Volumen:', rightX, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.volumen.toFixed(2)} m³`, rightX + 35, infoY);
  
  infoY += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Strecke:', rightX, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.strecke} km`, rightX + 35, infoY);
  
  yPos += 35;

  // Addresses section
  doc.setFillColor(232, 245, 233);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 35, 'F');
  
  // Von Address
  let addressY = yPos;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(76, 175, 80);
  doc.text('VON', leftX, addressY);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  addressY += 7;
  doc.text(data.vonAdresse.strasse, leftX, addressY);
  addressY += 5;
  doc.text(data.vonAdresse.ort, leftX, addressY);
  addressY += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(data.vonAdresse.etage, leftX, addressY);
  
  // Nach Address
  addressY = yPos;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(76, 175, 80);
  doc.text('NACH', rightX, addressY);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  addressY += 7;
  doc.text(data.nachAdresse.strasse, rightX, addressY);
  addressY += 5;
  doc.text(data.nachAdresse.ort, rightX, addressY);
  addressY += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(data.nachAdresse.etage, rightX, addressY);
  
  yPos += 40;

  // Services section
  doc.setFillColor(139, 195, 74);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Durchgeführte Leistungen', margin + 5, yPos);
  doc.setTextColor(0, 0, 0);
  yPos += 10;
  
  doc.setFillColor(250, 250, 250);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, data.leistungen.length * 6 + 10, 'F');
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  data.leistungen.forEach(leistung => {
    doc.text(`✓ ${leistung}`, margin + 5, yPos);
    yPos += 6;
  });
  
  yPos += 10;

  // Price section
  doc.setFillColor(51, 51, 51);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  centerText('RECHNUNGSBETRAG', yPos + 3);
  
  doc.setTextColor(139, 195, 74);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  centerText(`${data.preis.toFixed(2)} €`, yPos + 13);
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  centerText('inkl. 19% MwSt.', yPos + 20);
  
  doc.setTextColor(0, 0, 0);
  yPos += 35;

  // Confirmation section
  doc.setFillColor(249, 249, 249);
  doc.setDrawColor(51, 51, 51);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 45, 'FD');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  centerText('LEISTUNGSBESTÄTIGUNG', yPos);
  yPos += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const confirmations = [
    'Die Umzugsleistungen wurden vollständig und ordnungsgemäß erbracht',
    'Das Umzugsgut wurde unbeschädigt transportiert',
    'Alle vereinbarten Leistungen wurden durchgeführt'
  ];
  
  // Add dynamic payment confirmation based on payment info
  if (data.paymentInfo && data.paymentInfo.status === 'paid_on_site') {
    const paymentMethod = data.paymentInfo.method === 'ec_card' ? 'EC-Karte' :
                         data.paymentInfo.method === 'cash' ? 'Bargeld' : 
                         'andere Zahlungsart';
    confirmations.push(`✓ Zahlung wurde vor Ort per ${paymentMethod} erhalten`);
    
    // Add payment amount confirmation
    if (data.paymentInfo.paidAmount) {
      confirmations.push(`✓ Betrag: €${data.paymentInfo.paidAmount.toFixed(2)} - Belegnr.: ${data.paymentInfo.receiptNumber || 'N/A'}`);
    }
  } else if (data.paymentInfo && data.paymentInfo.status === 'pending') {
    confirmations.push('Zahlung erfolgt per Rechnung');
  } else {
    confirmations.push('Zahlungsart: ________________________');
  }
  
  confirmations.forEach(text => {
    // Checkbox (only for non-payment lines)
    if (!text.startsWith('✓')) {
      doc.rect(margin + 5, yPos - 3, 4, 4);
      doc.text(text, margin + 12, yPos);
    } else {
      // Payment confirmation with checkmark
      doc.setFont('helvetica', 'bold');
      doc.text(text, margin + 5, yPos);
      doc.setFont('helvetica', 'normal');
    }
    yPos += 7;
  });
  
  // Signatures
  yPos = pageHeight - 50;
  
  const signatureWidth = (pageWidth - 3 * margin) / 2;
  
  // Left signature
  doc.line(margin, yPos, margin + signatureWidth, yPos);
  doc.setFontSize(9);
  doc.setTextColor(102, 102, 102);
  doc.text('Datum, Unterschrift Kunde', margin + signatureWidth / 2, yPos + 5, { align: 'center' });
  
  // Right signature
  doc.line(pageWidth - margin - signatureWidth, yPos, pageWidth - margin, yPos);
  doc.text('Datum, Unterschrift RELOCATO® Mitarbeiter', pageWidth - margin - signatureWidth / 2, yPos + 5, { align: 'center' });
  
  // Footer
  doc.setTextColor(102, 102, 102);
  doc.setFontSize(8);
  centerText('RELOCATO® Bielefeld | Detmolder Str. 234a, 33605 Bielefeld | Tel: (0521) 1200551-0', pageHeight - 20);
  centerText('www.relocato.de | Wertvoll Dienstleistungen GmbH', pageHeight - 17);

  return doc.output('blob');
};

export const generateArbeitsscheinHTML = (data: ArbeitsscheinData): string => {
  const formattedDate = format(data.datum, 'dd.MM.yyyy', { locale: de });
  const formattedVolume = data.volumen.toFixed(2).replace('.', ',');
  const formattedPrice = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(data.preis);

  return `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Arbeitsschein - ${data.auftragsnummer}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11pt;
            line-height: 1.4;
            color: #000;
            background-color: #fff;
        }
        
        .container {
            max-width: 210mm;
            height: 297mm;
            margin: 0 auto;
            padding: 10mm;
            display: flex;
            flex-direction: column;
        }
        
        .logo-section {
            text-align: center;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 2px solid #8BC34A;
        }
        
        .company-name {
            font-size: 24pt;
            font-weight: bold;
            color: #333;
        }
        
        .registered {
            font-size: 12pt;
            vertical-align: super;
        }
        
        h1 {
            font-size: 18pt;
            color: #8BC34A;
            text-align: center;
            margin: 10px 0;
            text-transform: uppercase;
        }
        
        .info-section {
            background-color: #f5f5f5;
            border: 1px solid #ddd;
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 5px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        .info-item {
            margin-bottom: 5px;
            font-size: 10pt;
        }
        
        .label {
            font-weight: bold;
            color: #555;
            display: inline-block;
            min-width: 100px;
        }
        
        .value {
            color: #000;
        }
        
        .address-section {
            background-color: #e8f5e9;
            border: 1px solid #4caf50;
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 5px;
        }
        
        .address-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        
        .address-box h3 {
            color: #4caf50;
            margin-bottom: 5px;
            font-size: 11pt;
        }
        
        .address-box p {
            font-size: 10pt;
        }
        
        .service-section {
            margin-bottom: 10px;
        }
        
        .service-header {
            background-color: #8BC34A;
            color: white;
            padding: 5px 10px;
            font-weight: bold;
            font-size: 11pt;
        }
        
        .service-content {
            border: 1px solid #ddd;
            padding: 10px;
            background-color: #fafafa;
            font-size: 10pt;
        }
        
        .service-content p {
            margin: 3px 0;
        }
        
        .price-section {
            background-color: #333;
            color: white;
            padding: 15px;
            margin: 10px 0;
            text-align: center;
            border-radius: 5px;
        }
        
        .price-label {
            font-size: 12pt;
            margin-bottom: 5px;
        }
        
        .price-amount {
            font-size: 24pt;
            font-weight: bold;
            color: #8BC34A;
        }
        
        .confirmation-section {
            background-color: #f9f9f9;
            border: 1px solid #333;
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
        }
        
        .confirmation-header {
            font-size: 12pt;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
            text-align: center;
        }
        
        .checkbox-item {
            margin: 5px 0;
            display: flex;
            align-items: center;
            font-size: 10pt;
        }
        
        .checkbox {
            width: 15px;
            height: 15px;
            border: 2px solid #333;
            margin-right: 8px;
            display: inline-block;
            flex-shrink: 0;
        }
        
        .signature-section {
            margin-top: auto;
            padding-top: 15px;
        }
        
        .signature-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }
        
        .signature-box {
            text-align: center;
        }
        
        .signature-line {
            border-bottom: 2px solid #000;
            height: 40px;
            margin-bottom: 3px;
        }
        
        .signature-label {
            font-size: 9pt;
            color: #666;
        }
        
        .footer {
            text-align: center;
            font-size: 8pt;
            color: #666;
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
        }
        
        @media print {
            body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
            .container {
                margin: 0;
                padding: 10mm;
            }
        }
        
        @media screen and (max-width: 768px) {
            .container {
                height: auto;
                padding: 10px;
            }
            
            .info-grid, .address-grid, .signature-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Logo -->
        <div class="logo-section">
            <div class="company-name">RELOCATO<span class="registered">®</span></div>
        </div>
        
        <h1>Arbeitsschein</h1>
        
        <!-- Kundeninformationen -->
        <div class="info-section">
            <div class="info-grid">
                <div>
                    <div class="info-item">
                        <span class="label">Auftragsnummer:</span>
                        <span class="value"><strong>${data.auftragsnummer}</strong></span>
                    </div>
                    <div class="info-item">
                        <span class="label">Kunde:</span>
                        <span class="value">${data.kunde.name}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Telefon:</span>
                        <span class="value">${data.kunde.telefon}</span>
                    </div>
                    ${data.kunde.email ? `
                    <div class="info-item">
                        <span class="label">E-Mail:</span>
                        <span class="value">${data.kunde.email}</span>
                    </div>
                    ` : ''}
                </div>
                <div>
                    <div class="info-item">
                        <span class="label">Datum:</span>
                        <span class="value"><strong>${formattedDate}</strong></span>
                    </div>
                    <div class="info-item">
                        <span class="label">Volumen:</span>
                        <span class="value">${formattedVolume} m³</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Strecke:</span>
                        <span class="value">${data.strecke} km</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Adressen -->
        <div class="address-section">
            <div class="address-grid">
                <div class="address-box">
                    <h3>VON</h3>
                    <p>${data.vonAdresse.strasse}<br>
                    ${data.vonAdresse.ort}<br>
                    ${data.vonAdresse.etage ? `<strong>${data.vonAdresse.etage}</strong>` : ''}</p>
                </div>
                <div class="address-box">
                    <h3>NACH</h3>
                    <p>${data.nachAdresse.strasse}<br>
                    ${data.nachAdresse.ort}<br>
                    ${data.nachAdresse.etage ? `<strong>${data.nachAdresse.etage}</strong>` : ''}</p>
                </div>
            </div>
        </div>
        
        <!-- Leistungen -->
        <div class="service-section">
            <div class="service-header">Durchgeführte Leistungen</div>
            <div class="service-content">
                ${data.leistungen.map(leistung => `<p>✓ ${leistung}</p>`).join('\n                ')}
            </div>
        </div>
        
        <!-- Preis -->
        <div class="price-section">
            <div class="price-label">RECHNUNGSBETRAG</div>
            <div class="price-amount">${formattedPrice}</div>
            <div style="font-size: 10pt; margin-top: 5px;">inkl. 19% MwSt.</div>
        </div>
        
        <!-- Bestätigung -->
        <div class="confirmation-section">
            <div class="confirmation-header">LEISTUNGSBESTÄTIGUNG</div>
            <div class="checkbox-item">
                <div class="checkbox"></div>
                <span>Die Umzugsleistungen wurden vollständig und ordnungsgemäß erbracht</span>
            </div>
            <div class="checkbox-item">
                <div class="checkbox"></div>
                <span>Das Umzugsgut wurde unbeschädigt transportiert</span>
            </div>
            <div class="checkbox-item">
                <div class="checkbox"></div>
                <span>Alle vereinbarten Leistungen wurden durchgeführt</span>
            </div>
            <div class="checkbox-item">
                <div class="checkbox"></div>
                <span>Zahlung erfolgt per: _____________________</span>
            </div>
        </div>
        
        <!-- Unterschriften -->
        <div class="signature-section">
            <div class="signature-grid">
                <div class="signature-box">
                    <div class="signature-line"></div>
                    <div class="signature-label">Datum, Unterschrift Kunde</div>
                </div>
                <div class="signature-box">
                    <div class="signature-line"></div>
                    <div class="signature-label">Datum, Unterschrift RELOCATO® Mitarbeiter</div>
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            RELOCATO® Bielefeld | Detmolder Str. 234a, 33605 Bielefeld | Tel: (0521) 1200551-0<br>
            www.relocato.de | Wertvoll Dienstleistungen GmbH
        </div>
    </div>
</body>
</html>`;
};

export const prepareArbeitsscheinData = (quote: Quote, customer: Customer): ArbeitsscheinData => {
  // Format date
  const moveDate = customer.movingDate ? new Date(customer.movingDate) : new Date();

  // Extract address parts
  const extractAddressParts = (address: string) => {
    const parts = address.split(',').map(part => part.trim());
    return {
      strasse: parts[0] || '',
      ort: parts.slice(1).join(', ') || '',
      etage: '' // This would need to be extracted from additional data
    };
  };

  const vonAdresse = extractAddressParts(customer.fromAddress || '');
  const nachAdresse = extractAddressParts(customer.toAddress || '');

  // Extract volume from quote
  const totalVolume = quote.volume || 0;

  // Extract distance from quote
  const distance = quote.distance || 10; // Default to 10km if not provided

  // Extract services from quote
  const leistungen: string[] = [];
  
  // Add packing service if requested
  if (quote.packingRequested) {
    leistungen.push('Verpackungsmaterial bereitgestellt');
    leistungen.push('Ein- und Auspacken');
  }
  
  // Add additional services
  if (quote.additionalServices && quote.additionalServices.length > 0) {
    quote.additionalServices.forEach(service => {
      if (!leistungen.includes(service)) {
        leistungen.push(service);
      }
    });
  }
  
  // Add standard services based on quote data
  if (quote.furnitureAssemblyPrice && quote.furnitureAssemblyPrice > 0) {
    leistungen.push('Möbeldemontage');
    leistungen.push('Möbelremontage');
  }

  // Add standard services
  if (totalVolume > 0) {
    leistungen.unshift(`Transport inkl. Be- und Entladen (${totalVolume.toFixed(2).replace('.', ',')} m³)`);
  }

  // Generate order number (format: YYYYMMDDHHMM)
  const now = new Date();
  const orderNumber = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

  return {
    auftragsnummer: orderNumber,
    kunde: {
      name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.companyName || 'Kunde',
      telefon: customer.phone || '',
      email: customer.email
    },
    datum: moveDate,
    volumen: totalVolume,
    strecke: distance,
    vonAdresse,
    nachAdresse,
    leistungen: leistungen.length > 0 ? leistungen : ['Umzugsleistungen'],
    preis: quote.price || 0,
    paymentInfo: undefined // This would come from payment data
  };
};