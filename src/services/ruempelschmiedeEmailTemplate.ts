import { getEmailLogo } from '../utils/svgUtils';
import { ruempelSchmiedeLogoSVG } from '../assets/logos/ruempelschmiedeLogo';

export const generateRuempelschmiedeEmailHTML = (
  customerName: string,
  quoteNumber: string,
  quotePrice: number,
  movingDate?: string,
  fromAddress?: string,
  toAddress?: string,
  volume?: number,
  distance?: number,
  services?: string[]
): string => {
  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
          background-color: #E74C3C;
          color: white;
          padding: 30px;
          text-align: center;
        }
        .logo img {
          max-width: 150px;
          height: auto;
          margin: 0 auto;
          display: block;
        }
        .tagline {
          font-size: 16px;
          opacity: 0.9;
        }
        .content {
          padding: 30px;
        }
        .greeting {
          font-size: 20px;
          color: #2C3E50;
          margin-bottom: 20px;
        }
        .info-box {
          background-color: #F8F9FA;
          border-left: 4px solid #E74C3C;
          padding: 20px;
          margin: 20px 0;
        }
        .price-highlight {
          background-color: #E74C3C;
          color: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          margin: 20px 0;
        }
        .price-amount {
          font-size: 32px;
          font-weight: bold;
        }
        .service-list {
          margin: 20px 0;
        }
        .service-list li {
          margin: 10px 0;
          color: #555;
        }
        .cta-button {
          display: inline-block;
          background-color: #E74C3C;
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          margin: 20px 0;
        }
        .footer {
          background-color: #34495E;
          color: white;
          padding: 20px;
          text-align: center;
          font-size: 14px;
        }
        .contact-info {
          margin: 10px 0;
        }
        .highlight {
          color: #E74C3C;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div style="margin-bottom: 20px;">
            ${getEmailLogo(ruempelSchmiedeLogoSVG, false)}
          </div>
          <div class="tagline">Ihre Profis für Entrümpelung & Haushaltsauflösung</div>
        </div>
        
        <div class="content">
          <h2 class="greeting">Sehr geehrte/r ${customerName},</h2>
          
          <p>vielen Dank für Ihre Anfrage! Wir freuen uns, Ihnen ein maßgeschneidertes Angebot für Ihre Entrümpelung unterbreiten zu können.</p>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #2C3E50;">Ihre Angebotsübersicht</h3>
            <p><strong>Angebotsnummer:</strong> ${quoteNumber}</p>
            ${movingDate ? `<p><strong>Gewünschter Termin:</strong> ${movingDate}</p>` : ''}
            ${fromAddress ? `<p><strong>Adresse:</strong> ${fromAddress}</p>` : ''}
            ${volume ? `<p><strong>Geschätztes Volumen:</strong> ${volume} m³</p>` : ''}
          </div>
          
          <div class="price-highlight">
            <div>Ihr Festpreis:</div>
            <div class="price-amount">€ ${quotePrice.toFixed(2).replace('.', ',')}</div>
            <div style="font-size: 14px; opacity: 0.9;">inkl. 19% MwSt.</div>
          </div>
          
          <h3 style="color: #2C3E50;">Unsere Leistungen für Sie:</h3>
          <ul class="service-list">
            <li>✓ Professionelles Entrümpelungsteam</li>
            <li>✓ Demontage und Abtransport aller Gegenstände</li>
            <li>✓ Fachgerechte Entsorgung und Recycling</li>
            <li>✓ Besenreine Übergabe der Räumlichkeiten</li>
            <li>✓ Wertanrechnung bei verwertbaren Gegenständen</li>
            <li>✓ Entsorgungsnachweis inklusive</li>
            ${services && services.length > 0 ? services.map(service => `<li>✓ ${service}</li>`).join('') : ''}
          </ul>
          
          <h3 style="color: #2C3E50;">Ihre Vorteile:</h3>
          <ul style="color: #555;">
            <li><span class="highlight">Festpreis-Garantie:</span> Keine versteckten Kosten</li>
            <li><span class="highlight">Schnelle Ausführung:</span> Termine auch kurzfristig möglich</li>
            <li><span class="highlight">Versichert:</span> Wir sind vollumfänglich versichert</li>
            <li><span class="highlight">Umweltgerecht:</span> Professionelle Entsorgung und Recycling</li>
          </ul>
          
          <p>Das detaillierte Angebot finden Sie im PDF-Anhang. Bei Fragen stehen wir Ihnen gerne zur Verfügung!</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="font-size: 18px; color: #2C3E50; margin-bottom: 20px;">
              <strong>Möchten Sie uns beauftragen?</strong>
            </p>
            <p>Rufen Sie uns einfach an oder antworten Sie auf diese E-Mail!</p>
          </div>
        </div>
        
        <div class="footer">
          <div class="contact-info">
            <strong>RÜMPEL SCHMIEDE</strong><br>
            Tel: 0162 3456789<br>
            E-Mail: info@ruempel-schmiede.de<br>
            Web: www.ruempel-schmiede.de
          </div>
          <p style="margin-top: 20px; font-size: 12px; opacity: 0.8;">
            Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht direkt auf diese E-Mail.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};