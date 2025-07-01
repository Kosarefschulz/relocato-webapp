import { Customer, Quote } from '../types';
import { getCompanyConfig } from '../config/companies.config';

// HIER DAS LOGO EINFÜGEN - Ersetze den Platzhalter mit deinem Base64-String
export const RUEMPELSCHMIEDE_LOGO_BASE64 = 'data:image/png;base64,HIER_DEIN_BASE64_STRING';

interface ClearanceQuoteData {
  clearanceType?: string;
  objectAddress?: string;
  services?: any[];
  volume?: number;
  confirmationToken?: string;
}

export const generateRuempelschmiedeEmailHTML = (
  customer: Customer, 
  quote: Quote & ClearanceQuoteData,
  recipientEmail: string
): string => {
  const company = getCompanyConfig('ruempelschmiede');
  
  // Generiere Bestätigungslink
  const confirmationLink = quote.confirmationToken 
    ? `${window.location.origin}/quote-confirmation/${quote.confirmationToken}`
    : '';

  // QR Code für Bestätigungslink
  const qrCodeUrl = confirmationLink 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(confirmationLink)}`
    : '';

  // Formatiere Datum
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const angebotNr = `RS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  const gueltigBis = new Date();
  gueltigBis.setDate(gueltigBis.getDate() + 30);

  // Farben von Rümpel Schmiede
  const primaryColor = '#C73E3A';  // Rot
  const secondaryColor = '#2C4A5F'; // Dunkelblau
  
  return `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>Entrümpelungsangebot - Rümpel Schmiede</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            padding-top: 0;
            color: #333;
            font-size: 10pt;
            line-height: 1.6;
        }
        
        /* Logo Header */
        .logo-header {
            text-align: center;
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 3px solid ${primaryColor};
        }
        
        .logo-wrapper {
            display: inline-block;
            vertical-align: middle;
        }
        
        .logo-img {
            max-width: 80px;
            height: auto;
            vertical-align: middle;
            margin-right: 15px;
        }
        
        .logo-text {
            display: inline-block;
            vertical-align: middle;
        }
        
        .company-name {
            font-size: 36px;
            font-weight: bold;
            color: ${primaryColor};
            letter-spacing: -1px;
            margin: 0;
        }
        
        .company-tagline {
            font-size: 14px;
            color: ${secondaryColor};
            margin: 0;
        }
        
        h1 {
            color: ${primaryColor};
            text-align: center;
            margin-top: 10px;
            margin-bottom: 20px;
            font-size: 24pt;
        }
        
        h2 {
            color: ${secondaryColor};
            font-size: 14pt;
            margin-top: 20px;
            margin-bottom: 10px;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 5px;
        }
        
        h3 {
            color: ${primaryColor};
            font-size: 12pt;
            font-weight: bold;
            margin-top: 15px;
            margin-bottom: 10px;
        }
        
        .header {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 1px solid #e0e0e0;
        }
        
        .price-box {
            background: linear-gradient(135deg, ${primaryColor} 0%, #8b2928 100%);
            color: white;
            padding: 25px;
            border-radius: 10px;
            text-align: center;
            margin: 25px 0;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
        
        .price {
            font-size: 42px;
            font-weight: bold;
            margin: 10px 0;
        }
        
        .price-label {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .info-section {
            margin: 25px 0;
            padding: 20px;
            background-color: #fafafa;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
        }
        
        .info-section h3 {
            color: ${primaryColor};
            font-size: 14pt;
            margin-top: 0;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        td {
            padding: 12px;
            border-bottom: 1px solid #e0e0e0;
        }
        
        tr:last-child td {
            border-bottom: none;
        }
        
        .label {
            font-weight: bold;
            width: 40%;
            color: ${secondaryColor};
        }
        
        .value {
            color: #333;
        }
        
        .services-list {
            list-style: none;
            padding: 0;
            margin: 15px 0;
        }
        
        .services-list li {
            padding: 10px 0 10px 30px;
            position: relative;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .services-list li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: ${primaryColor};
            font-weight: bold;
            font-size: 16px;
        }
        
        .services-list li:last-child {
            border-bottom: none;
        }
        
        .cta-section {
            background-color: #f0f7ff;
            padding: 25px;
            border-radius: 10px;
            margin: 30px 0;
            text-align: center;
            border: 2px solid ${secondaryColor};
        }
        
        .cta-button {
            display: inline-block;
            background-color: ${primaryColor};
            color: white;
            padding: 15px 40px;
            text-decoration: none;
            border-radius: 30px;
            font-weight: bold;
            font-size: 16px;
            margin: 10px 0;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }
        
        .qr-code {
            margin: 20px 0;
            text-align: center;
        }
        
        .qr-code img {
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            padding: 10px;
            background-color: white;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
            text-align: center;
            color: #666;
            font-size: 9pt;
        }
        
        .contact-info {
            margin: 10px 0;
        }
        
        .contact-info strong {
            color: ${secondaryColor};
        }
        
        .highlight-box {
            background-color: #fff3e0;
            border-left: 4px solid #ff9800;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 5px 5px 0;
        }
        
        .signature-section {
            margin-top: 40px;
            padding: 25px;
            border: 2px dashed ${primaryColor};
            border-radius: 10px;
            background-color: #fff9f9;
        }
        
        .signature-field {
            border-bottom: 1px solid #333;
            height: 40px;
            margin-bottom: 5px;
        }
        
        .signature-label {
            font-size: 9pt;
            color: #666;
        }
        
        @media print {
            .cta-section {
                display: none;
            }
            .qr-code {
                display: none;
            }
        }
    </style>
</head>
<body>
    <!-- Logo Header -->
    <div class="logo-header">
        <div class="logo-wrapper">
            <img src="${RUEMPELSCHMIEDE_LOGO_BASE64}" alt="Rümpel Schmiede Logo" class="logo-img">
            <div class="logo-text">
                <div class="company-name">RÜMPEL SCHMIEDE</div>
                <div class="company-tagline">Professionelle Entrümpelungen seit 2015</div>
            </div>
        </div>
    </div>

    <h1>Ihr Entrümpelungsangebot</h1>

    <!-- Kundeninformationen -->
    <div class="header">
        <table>
            <tr>
                <td class="label">Angebotsnummer:</td>
                <td class="value"><strong>${angebotNr}</strong></td>
            </tr>
            <tr>
                <td class="label">Datum:</td>
                <td class="value">${formatDate(new Date())}</td>
            </tr>
            <tr>
                <td class="label">Gültig bis:</td>
                <td class="value">${formatDate(gueltigBis)}</td>
            </tr>
            <tr>
                <td class="label">Kunde:</td>
                <td class="value"><strong>${customer.name}</strong></td>
            </tr>
            ${customer.email ? `
            <tr>
                <td class="label">E-Mail:</td>
                <td class="value">${customer.email}</td>
            </tr>` : ''}
            ${customer.phone ? `
            <tr>
                <td class="label">Telefon:</td>
                <td class="value">${customer.phone}</td>
            </tr>` : ''}
        </table>
    </div>

    <!-- Preis -->
    <div class="price-box">
        <div class="price-label">Ihr Festpreis inkl. MwSt.</div>
        <div class="price">€ ${quote.price.toFixed(2).replace('.', ',')}</div>
        <div class="price-label">Keine versteckten Kosten!</div>
    </div>

    <!-- Objektdetails -->
    <div class="info-section">
        <h3>Objektdetails</h3>
        <table>
            <tr>
                <td class="label">Objekt:</td>
                <td class="value">${quote.objectAddress || customer.fromAddress || 'Nach Vereinbarung'}</td>
            </tr>
            <tr>
                <td class="label">Entrümpelungsart:</td>
                <td class="value">${quote.clearanceType || 'Komplette Entrümpelung'}</td>
            </tr>
            <tr>
                <td class="label">Geschätztes Volumen:</td>
                <td class="value">ca. ${quote.volume || 50} m³</td>
            </tr>
            ${customer.apartment?.floor ? `
            <tr>
                <td class="label">Etage:</td>
                <td class="value">${customer.apartment.floor}. Etage ${customer.apartment.hasElevator ? '(mit Aufzug)' : '(ohne Aufzug)'}</td>
            </tr>` : ''}
        </table>
    </div>

    <!-- Leistungsumfang -->
    <div class="info-section">
        <h3>Leistungsumfang</h3>
        <ul class="services-list">
            <li>Komplette Entrümpelung aller beauftragten Bereiche</li>
            <li>Fachgerechte Entsorgung aller Gegenstände</li>
            <li>Mülltrennung und umweltgerechte Entsorgung</li>
            <li>Demontage von Möbeln und Einrichtungsgegenständen</li>
            <li>Besenreine Übergabe der Räumlichkeiten</li>
            <li>Entsorgungsnachweis inklusive</li>
            <li>Haftpflichtversicherung für Schäden während der Arbeiten</li>
            ${quote.services && quote.services.length > 0 
              ? quote.services.map(service => `<li>${service}</li>`).join('')
              : ''
            }
        </ul>
    </div>

    <!-- Wichtige Informationen -->
    <div class="highlight-box">
        <h3 style="margin-top: 0;">Wichtige Informationen</h3>
        <ul style="margin: 0; padding-left: 20px;">
            <li>Festpreisgarantie - keine versteckten Kosten</li>
            <li>Ausführung innerhalb eines Tages</li>
            <li>Wertgegenstände werden auf Wunsch separiert</li>
            <li>Zahlung nach Leistungserbringung</li>
            <li>Kostenlose Besichtigung vor Ort möglich</li>
        </ul>
    </div>

    <!-- Call to Action -->
    ${confirmationLink ? `
    <div class="cta-section">
        <h2 style="color: ${secondaryColor}; border: none;">Angebot online bestätigen</h2>
        <p style="font-size: 14px; margin-bottom: 20px;">
            Bestätigen Sie Ihr Angebot bequem online mit nur einem Klick!
        </p>
        <a href="${confirmationLink}" class="cta-button">
            Angebot jetzt bestätigen
        </a>
        <div class="qr-code">
            <p style="margin-bottom: 10px;">Oder scannen Sie diesen QR-Code:</p>
            <img src="${qrCodeUrl}" alt="QR Code zur Angebotsbestätigung" width="150" height="150">
        </div>
    </div>
    ` : ''}

    <!-- Unterschrift Sektion -->
    <div class="signature-section">
        <h3 style="margin-top: 0; color: ${primaryColor};">Auftragserteilung</h3>
        <p>Mit meiner Unterschrift beauftrage ich die ${company.legal.companyName} mit der Durchführung der Entrümpelung zu den genannten Konditionen.</p>
        
        <table style="margin-top: 30px;">
            <tr>
                <td style="width: 50%; padding-right: 20px;">
                    <div class="signature-field"></div>
                    <div class="signature-label">Datum, Unterschrift Auftraggeber</div>
                </td>
                <td style="width: 50%; padding-left: 20px;">
                    <div class="signature-field"></div>
                    <div class="signature-label">Datum, Unterschrift Rümpel Schmiede</div>
                </td>
            </tr>
        </table>
    </div>

    <!-- Footer -->
    <div class="footer">
        <div class="contact-info">
            <strong>${company.name}</strong><br>
            ${company.address.street}, ${company.address.zip} ${company.address.city}<br>
            <strong>Tel:</strong> ${company.contact.phone} | <strong>E-Mail:</strong> ${company.contact.email}<br>
            <strong>Web:</strong> www.ruempelschmiede.de
        </div>
        <div style="margin-top: 10px; font-size: 8pt; color: #999;">
            ${company.legal.companyName} | Geschäftsführer: ${company.legal.ceo}<br>
            ${company.legal.court} ${company.legal.registrationNumber} | USt-IdNr.: ${company.legal.taxId}
        </div>
    </div>
</body>
</html>`;
};