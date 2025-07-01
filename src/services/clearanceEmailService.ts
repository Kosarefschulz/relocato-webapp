import { Customer, Quote } from '../types';
import { getCompanyConfig } from '../config/companies.config';
import { databaseService } from '../config/database.config';

interface EmailData {
  to: string;
  subject: string;
  html: string;
  attachments?: any[];
}

export const sendClearanceQuoteEmail = async (
  customer: Customer,
  quote: Quote & { 
    clearanceType?: string;
    objectAddress?: string;
    services?: any[];
  },
  recipientEmail: string,
  pdfBlob: Blob
): Promise<void> => {
  const company = getCompanyConfig('ruempelschmiede');
  
  // Generiere Bestätigungslink
  const confirmationLink = quote.confirmationToken 
    ? `${window.location.origin}/quote-confirmation/${quote.confirmationToken}`
    : '';

  const emailHtml = `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #2c3e50;
            margin: 0;
            padding: 0;
            background-color: #f5f1e8;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #b93635 0%, #8b2928 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 36px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .header .subtitle {
            font-size: 18px;
            margin-top: 10px;
            opacity: 0.9;
        }
        .content {
            padding: 30px;
        }
        .greeting {
            font-size: 20px;
            color: #2c3e50;
            margin-bottom: 20px;
            font-weight: bold;
        }
        .highlight-box {
            background-color: #fff3e0;
            border-left: 4px solid #ff9800;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .service-box {
            background-color: #f9f7f4;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            border: 1px solid #e0d5c7;
        }
        .service-title {
            color: #b93635;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .service-list {
            list-style: none;
            padding: 0;
            margin: 10px 0;
        }
        .service-list li {
            padding: 8px 0;
            border-bottom: 1px solid #e0d5c7;
        }
        .service-list li:last-child {
            border-bottom: none;
        }
        .service-list li:before {
            content: "✓ ";
            color: #4caf50;
            font-weight: bold;
            margin-right: 8px;
        }
        .price-box {
            background: linear-gradient(135deg, #f5f1e8 0%, #ede7dc 100%);
            border-radius: 10px;
            padding: 25px;
            margin: 25px 0;
            text-align: center;
            border: 2px solid #b93635;
        }
        .price-label {
            font-size: 16px;
            color: #666;
            margin-bottom: 10px;
        }
        .price-amount {
            font-size: 36px;
            color: #b93635;
            font-weight: bold;
            margin: 10px 0;
        }
        .price-note {
            font-size: 14px;
            color: #666;
            font-style: italic;
        }
        .cta-button {
            display: inline-block;
            background-color: #b93635;
            color: white;
            padding: 15px 40px;
            text-decoration: none;
            border-radius: 30px;
            font-weight: bold;
            font-size: 18px;
            margin: 20px 0;
            text-align: center;
            box-shadow: 0 4px 15px rgba(185, 54, 53, 0.3);
            transition: all 0.3s ease;
        }
        .cta-button:hover {
            background-color: #8b2928;
            box-shadow: 0 6px 20px rgba(185, 54, 53, 0.4);
        }
        .benefits {
            background-color: #e8f4f8;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .benefits h3 {
            color: #2c3e50;
            margin-bottom: 15px;
        }
        .benefits ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .benefits li {
            padding: 8px 0;
            padding-left: 25px;
            position: relative;
        }
        .benefits li:before {
            content: "⚡";
            position: absolute;
            left: 0;
            color: #ff9800;
        }
        .footer {
            background-color: #2c3e50;
            color: white;
            padding: 30px;
            text-align: center;
        }
        .footer-info {
            margin: 10px 0;
            font-size: 14px;
            opacity: 0.9;
        }
        .footer-links {
            margin-top: 20px;
        }
        .footer-links a {
            color: #ff9800;
            text-decoration: none;
            margin: 0 10px;
        }
        .qr-section {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background-color: #f9f7f4;
            border-radius: 10px;
        }
        .qr-code {
            margin: 15px auto;
        }
        .emergency-banner {
            background-color: #ff5252;
            color: white;
            padding: 15px;
            text-align: center;
            font-weight: bold;
            margin-bottom: 20px;
        }
        @media (max-width: 600px) {
            .container {
                margin: 0;
                border-radius: 0;
            }
            .header h1 {
                font-size: 28px;
            }
            .price-amount {
                font-size: 28px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Rümpel Schmiede</h1>
            <div class="subtitle">Professionelle Entrümpelungen in Bielefeld</div>
        </div>
        
        <div class="content">
            <div class="greeting">
                Sehr geehrte/r ${customer.name},
            </div>
            
            <p>vielen Dank für Ihre Anfrage! Wir freuen uns, Ihnen unser maßgeschneidertes Angebot für Ihre Entrümpelung zu präsentieren.</p>
            
            <div class="highlight-box">
                <strong>🏠 Ihre Entrümpelung auf einen Blick:</strong><br>
                ${quote.clearanceType ? `Art: ${quote.clearanceType === 'wohnung' ? 'Wohnungsentrümpelung' : 
                  quote.clearanceType === 'haus' ? 'Hausentrümpelung' : 
                  quote.clearanceType === 'keller' ? 'Kellerentrümpelung' : 'Entrümpelung'}<br>` : ''}
                ${quote.objectAddress ? `Objekt: ${quote.objectAddress}<br>` : ''}
                Termin: Nach Vereinbarung - wir richten uns nach Ihnen!
            </div>
            
            <div class="service-box">
                <div class="service-title">Unsere Leistungen für Sie:</div>
                <ul class="service-list">
                    <li>Komplette Entrümpelung aller Räume</li>
                    <li>Fachgerechte Entsorgung und Mülltrennung</li>
                    <li>Demontage von Möbeln und Einbauten</li>
                    <li>Besenreine Übergabe</li>
                    <li>Auf Wunsch: Express-Service innerhalb 24-48h</li>
                </ul>
            </div>
            
            <div class="price-box">
                <div class="price-label">Ihr Festpreis-Angebot:</div>
                <div class="price-amount">€ ${quote.price.toFixed(2).replace('.', ',')}</div>
                <div class="price-note">Komplett-Preis inkl. MwSt. - Keine versteckten Kosten!</div>
            </div>
            
            <div style="text-align: center;">
                <a href="${confirmationLink}" class="cta-button">
                    Angebot online ansehen & bestätigen
                </a>
            </div>
            
            <div class="benefits">
                <h3>Ihre Vorteile bei Rümpel Schmiede:</h3>
                <ul>
                    <li>Festpreisgarantie - transparente Kosten</li>
                    <li>Schnelle Terminvergabe</li>
                    <li>Umweltgerechte Entsorgung mit Nachweis</li>
                    <li>Versicherte und erfahrene Mitarbeiter</li>
                    <li>Wertanrechnung bei verwertbaren Gegenständen möglich</li>
                </ul>
            </div>
            
            ${confirmationLink ? `
            <div class="qr-section">
                <p><strong>Angebot mit dem Smartphone öffnen:</strong></p>
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(confirmationLink)}" 
                     alt="QR Code" 
                     class="qr-code"
                     style="border: 2px solid #ddd; padding: 10px; background: white;">
                <p style="font-size: 12px; color: #666;">
                    Scannen Sie diesen QR-Code mit Ihrer Smartphone-Kamera
                </p>
            </div>
            ` : ''}
            
            ${quote.comment ? `
            <div class="service-box">
                <div class="service-title">Besondere Hinweise:</div>
                <p>${quote.comment}</p>
            </div>
            ` : ''}
            
            <div class="emergency-banner">
                ⚡ Express-Service verfügbar: Entrümpelung innerhalb 24-48 Stunden! ⚡
            </div>
            
            <p><strong>Die nächsten Schritte:</strong></p>
            <ol>
                <li>Prüfen Sie unser Angebot in Ruhe</li>
                <li>Bestätigen Sie online oder kontaktieren Sie uns bei Fragen</li>
                <li>Wir vereinbaren einen passenden Termin</li>
                <li>Professionelle Durchführung zum Festpreis</li>
            </ol>
            
            <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung. Sie erreichen uns telefonisch unter 
            <strong>${company.contact.phone}</strong> oder per E-Mail.</p>
            
            <p>Wir freuen uns darauf, Ihnen bei Ihrer Entrümpelung professionell zur Seite zu stehen!</p>
        </div>
        
        <div class="footer">
            <div class="footer-info">
                <strong>Rümpel Schmiede</strong><br>
                Ihr Partner für professionelle Entrümpelungen
            </div>
            <div class="footer-info">
                ${company.address.street}, ${company.address.zip} ${company.address.city}<br>
                Tel: ${company.contact.phone} | E-Mail: ${company.contact.email}
            </div>
            <div class="footer-info" style="font-size: 12px; margin-top: 15px;">
                ${company.legal.companyName} | ${company.legal.registrationNumber}<br>
                Geschäftsführer: ${company.legal.ceo} | USt-IdNr.: ${company.legal.taxId}
            </div>
            <div class="footer-links">
                <a href="https://www.ruempelschmiede.de">www.ruempelschmiede.de</a>
                <a href="https://www.ruempelschmiede.de/agb">AGB</a>
                <a href="https://www.ruempelschmiede.de/datenschutz">Datenschutz</a>
            </div>
        </div>
    </div>
</body>
</html>
  `;

  const attachments = [{
    filename: `Entrümpelungsangebot_${customer.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
    content: Buffer.from(await pdfBlob.arrayBuffer()).toString('base64'),
    encoding: 'base64'
  }];

  const emailData: EmailData = {
    to: recipientEmail,
    subject: `Ihr Entrümpelungsangebot von Rümpel Schmiede - ${customer.name}`,
    html: emailHtml,
    attachments
  };

  // Sende E-Mail über Backend
  try {
    const response = await fetch('http://localhost:5005/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      throw new Error(`Email sending failed: ${response.statusText}`);
    }

    // Speichere E-Mail-Historie
    await databaseService.addEmailHistory({
      customerId: customer.id,
      subject: emailData.subject,
      body: emailHtml,
      sentAt: new Date(),
      sentBy: quote.createdBy || 'System',
      type: 'quote',
      attachments: [`Entrümpelungsangebot_${customer.name}.pdf`],
      status: 'sent'
    });

    console.log('✅ Entrümpelungsangebot-E-Mail erfolgreich gesendet');
  } catch (error) {
    console.error('❌ Fehler beim Senden der E-Mail:', error);
    throw error;
  }
};

// E-Mail für Auftragsbestätigung
export const sendClearanceConfirmationEmail = async (
  customer: Customer,
  quote: Quote,
  recipientEmail: string
): Promise<void> => {
  const company = getCompanyConfig('ruempelschmiede');
  
  const emailHtml = `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #2c3e50;
            margin: 0;
            padding: 0;
            background-color: #f5f1e8;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .success-icon {
            font-size: 60px;
            margin-bottom: 10px;
        }
        .content {
            padding: 30px;
        }
        .confirmation-box {
            background-color: #e8f5e9;
            border: 2px solid #4caf50;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        .next-steps {
            background-color: #f9f7f4;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="success-icon">✓</div>
            <h1>Auftrag bestätigt!</h1>
        </div>
        
        <div class="content">
            <h2>Vielen Dank für Ihren Auftrag!</h2>
            
            <p>Sehr geehrte/r ${customer.name},</p>
            
            <p>wir haben Ihre Auftragsbestätigung erhalten und freuen uns, Ihre Entrümpelung durchführen zu dürfen.</p>
            
            <div class="confirmation-box">
                <h3>Auftragsdetails:</h3>
                <p><strong>Auftragsnummer:</strong> ${quote.id}</p>
                <p><strong>Leistung:</strong> Entrümpelung</p>
                <p><strong>Festpreis:</strong> € ${quote.price.toFixed(2).replace('.', ',')}</p>
                <p><strong>Status:</strong> ✓ Bestätigt</p>
            </div>
            
            <div class="next-steps">
                <h3>So geht es weiter:</h3>
                <ol>
                    <li><strong>Terminvereinbarung:</strong> Wir melden uns innerhalb von 24 Stunden bei Ihnen zur Terminabsprache</li>
                    <li><strong>Vorbereitung:</strong> Sie müssen nichts vorbereiten - wir kümmern uns um alles</li>
                    <li><strong>Durchführung:</strong> Professionelle Entrümpelung zum vereinbarten Termin</li>
                    <li><strong>Abnahme:</strong> Gemeinsame Endabnahme und besenreine Übergabe</li>
                </ol>
            </div>
            
            <p><strong>Wichtige Informationen:</strong></p>
            <ul>
                <li>Festpreisgarantie - es entstehen keine zusätzlichen Kosten</li>
                <li>Zahlung nach Leistungserbringung</li>
                <li>Alle Entsorgungskosten sind inklusive</li>
                <li>Versicherungsschutz während der gesamten Entrümpelung</li>
            </ul>
            
            <p>Bei Fragen erreichen Sie uns jederzeit unter <strong>${company.contact.phone}</strong> oder per E-Mail.</p>
            
            <p>Mit freundlichen Grüßen<br>
            Ihr Rümpel Schmiede Team</p>
        </div>
    </div>
</body>
</html>
  `;

  const emailData: EmailData = {
    to: recipientEmail,
    subject: `Auftragsbestätigung - Entrümpelung ${customer.name}`,
    html: emailHtml
  };

  // Sende E-Mail über Backend
  try {
    const response = await fetch('http://localhost:5005/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      throw new Error(`Email sending failed: ${response.statusText}`);
    }

    console.log('✅ Bestätigungs-E-Mail erfolgreich gesendet');
  } catch (error) {
    console.error('❌ Fehler beim Senden der Bestätigungs-E-Mail:', error);
    throw error;
  }
};