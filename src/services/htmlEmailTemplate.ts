import { Customer } from '../types';
import { QuoteCalculation } from './quoteCalculation';

export const generateEmailHTML = (customer: Customer, calculation: QuoteCalculation, quoteDetails: any): string => {
  // Berechne Preise
  const nettoPreis = calculation.totalPrice / 1.19;
  const mwst = calculation.totalPrice - nettoPreis;
  const rabatt = calculation.basePrice * 0.05; // 5% Rabatt
  const grundhaftung = Math.round(quoteDetails.volume * 620);
  
  const angebotNr = `3097191025051418452${Math.floor(Math.random() * 10)}`;
  const gueltigBis = new Date();
  gueltigBis.setDate(gueltigBis.getDate() + 30);
  
  // Material-Liste für die Tabelle erstellen
  let materialListe = '';
  if (quoteDetails.materials && quoteDetails.materials.length > 0) {
    quoteDetails.materials.forEach((material: any) => {
      materialListe += `
            <tr>
                <td>${material.quantity || '1,00'}</td>
                <td>${material.name}</td>
                <td style="text-align: right;">${material.unitPrice ? material.unitPrice.toFixed(2).replace('.', ',') : '0,00'} €</td>
                <td style="text-align: right;">${material.totalPrice ? material.totalPrice.toFixed(2).replace('.', ',') : '0,00'} €</td>
            </tr>`;
    });
  } else {
    // Standard-Materialien wenn keine angegeben
    materialListe = `
            <tr>
                <td>10,00</td>
                <td>Umzugskartons Standard</td>
                <td style="text-align: right;">3,45 €</td>
                <td style="text-align: right;">34,50 €</td>
            </tr>
            <tr>
                <td>5,00</td>
                <td>Kleiderboxen</td>
                <td style="text-align: right;">10,68 €</td>
                <td style="text-align: right;">53,40 €</td>
            </tr>`;
  }

  // Zusatzleistungen für die Tabelle
  let zusatzLeistungen = '';
  if (quoteDetails.additionalServices && quoteDetails.additionalServices.length > 0) {
    quoteDetails.additionalServices.forEach((service: any) => {
      zusatzLeistungen += `
            <tr>
                <td>1,00</td>
                <td>${service.name}</td>
                <td style="text-align: right;">${service.price ? service.price.toFixed(2).replace('.', ',') : '0,00'} €</td>
                <td style="text-align: right;">${service.price ? service.price.toFixed(2).replace('.', ',') : '0,00'} €</td>
            </tr>`;
    });
  }

  // Material-Summe berechnen
  const materialSumme = quoteDetails.materials 
    ? quoteDetails.materials.reduce((sum: number, m: any) => sum + (m.totalPrice || 0), 0)
    : 87.90;

  // HTML Template - 1:1 Übernahme des bereitgestellten Templates
  let html = `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>Umzugsangebot</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
            color: #333;
            font-size: 10pt;
        }
        
        /* Logo Header */
        .logo-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #8BC34A;
        }
        
        .logo-img {
            max-width: 300px;
            height: auto;
            margin-bottom: 10px;
        }
        
        .logo-text {
            font-size: 48px;
            font-weight: bold;
            color: #4A4A4A;
            letter-spacing: -2px;
        }
        
        .logo-registered {
            font-size: 20px;
            vertical-align: super;
        }
        
        h1 {
            color: #8BC34A;
            text-align: center;
            margin-bottom: 30px;
            font-size: 24pt;
        }
        
        h2 {
            font-size: 12pt;
            margin-top: 15px;
            margin-bottom: 10px;
        }
        
        h3 {
            font-size: 10pt;
            font-weight: bold;
        }
        
        .header {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .price-box {
            background-color: #8BC34A;
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
        }
        
        .price {
            font-size: 36px;
            font-weight: bold;
        }
        
        .info-section {
            margin: 20px 0;
        }
        
        .info-section h3 {
            color: #8BC34A;
            font-size: 11pt;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        td {
            padding: 10px;
            border-bottom: 1px solid #ddd;
        }
        
        .label {
            font-weight: bold;
            width: 40%;
        }
        
        .signature-section {
            margin-top: 40px;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
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
        
        ul {
            padding-left: 20px;
        }
        
        li {
            margin-bottom: 8px;
        }
        
        .section-header {
            background-color: #D7D7D7;
            border: 1px solid #000;
            padding: 5px;
            font-weight: bold;
            margin-top: 20px;
        }
        
        .footer-text {
            font-size: 8pt;
            color: #666;
            text-align: center;
            margin-top: 40px;
        }
        
        .checkbox {
            width: 16px;
            height: 16px;
            border: 1px solid #000;
            display: inline-block;
            margin-right: 10px;
            vertical-align: middle;
        }
        
        .price-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        .price-table th {
            background-color: #f8f9fa;
            padding: 8px;
            text-align: left;
            font-weight: bold;
            border-bottom: 1px solid #ddd;
        }
        
        .price-table td {
            padding: 8px;
            border-bottom: 1px solid #ddd;
        }
        
        .price-table .total-row {
            font-weight: bold;
            border-top: 2px solid #333;
        }
    </style>
</head>
<body>
    <div class="logo-header">
        <img src="https://images.provenexpert.com/cf/91/1fa1149f570df63b5b99e815df3d/relocato-ulm_full_1701284945.jpg" alt="RELOCATO® Logo" class="logo-img">
    </div>
    
    <h1>Umzugsangebot</h1>
    
    <div class="header">
        <h2>Angebot Nr. ${angebotNr}</h2>
        <p>Gültig bis: ${gueltigBis.toLocaleDateString('de-DE')}</p>
        <p>RELOCATO® Bielefeld - Ihr regionaler Umzugsservice!</p>
    </div>
    
    <div class="info-section">
        <h3>Kundendaten</h3>
        <table>
            <tr>
                <td class="label">Name:</td>
                <td>${customer.name}</td>
            </tr>
            <tr>
                <td class="label">Adresse:</td>
                <td>${customer.fromAddress || customer.toAddress || 'Nicht angegeben'}</td>
            </tr>
            <tr>
                <td class="label">Telefon:</td>
                <td>${customer.phone}</td>
            </tr>
            <tr>
                <td class="label">E-Mail:</td>
                <td>${customer.email}</td>
            </tr>
            <tr>
                <td class="label">Umzugstermin:</td>
                <td>${customer.movingDate || 'Nach Absprache'}</td>
            </tr>
        </table>
    </div>
    
    <div class="info-section">
        <h3>Umzugsdetails</h3>
        <table>
            <tr>
                <td class="label">Beladeadresse:</td>
                <td>${customer.fromAddress || 'Wird noch mitgeteilt'}</td>
            </tr>
            <tr>
                <td class="label">Etage:</td>
                <td>${quoteDetails.fromFloor || 'EG'}</td>
            </tr>
            <tr>
                <td class="label">Entladeadresse:</td>
                <td>${customer.toAddress || 'Wird noch mitgeteilt'}</td>
            </tr>
            <tr>
                <td class="label">Etage:</td>
                <td>${quoteDetails.toFloor || 'EG'}</td>
            </tr>
            <tr>
                <td class="label">Transportvolumen:</td>
                <td>bis ${quoteDetails.volume} m³</td>
            </tr>
            <tr>
                <td class="label">Transportweg:</td>
                <td>${quoteDetails.distance} km</td>
            </tr>
        </table>
    </div>
    
    <div class="section-header">Leistungsumfang</div>
    
    <table class="price-table">
        <thead>
            <tr>
                <th>Anzahl</th>
                <th>Leistung</th>
                <th>Einzelpreis</th>
                <th>Gesamtpreis</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>1,00</td>
                <td>Transport inkl. Be- und Entladen pauschal</td>
                <td style="text-align: right;">${calculation.basePrice.toFixed(2).replace('.', ',')} €</td>
                <td style="text-align: right;">${calculation.basePrice.toFixed(2).replace('.', ',')} €</td>
            </tr>
            ${zusatzLeistungen}
        </tbody>
    </table>
    
    <div class="section-header">Material</div>
    
    <table class="price-table">
        <tbody>
            ${materialListe}
        </tbody>
    </table>
    
    <div class="section-header">Kostenübersicht</div>
    
    <table class="price-table">
        <tbody>
            <tr>
                <td colspan="3">Transport inkl. Be- und Entladen</td>
                <td style="text-align: right;">${calculation.basePrice.toFixed(2).replace('.', ',')} €</td>
            </tr>
            <tr>
                <td colspan="3">Summe Packmaterialien</td>
                <td style="text-align: right;">${materialSumme.toFixed(2).replace('.', ',')} €</td>
            </tr>
            <tr>
                <td colspan="3">Gesamtsumme netto</td>
                <td style="text-align: right;">${nettoPreis.toFixed(2).replace('.', ',')} €</td>
            </tr>
            <tr>
                <td colspan="3">MwSt. 19,00 %</td>
                <td style="text-align: right;">${mwst.toFixed(2).replace('.', ',')} €</td>
            </tr>
            <tr class="total-row">
                <td colspan="3"><strong>Gesamtsumme Festpreis inkl. MwSt.</strong></td>
                <td style="text-align: right;"><strong>${calculation.totalPrice.toFixed(2).replace('.', ',')} €</strong></td>
            </tr>
        </tbody>
    </table>
    
    <div class="section-header">Versicherung des Transportgutes</div>
    
    <div class="info-section">
        <h3>Grundhaftung / Haftung des Möbelspediteurs</h3>
        <p>Bei Übernahme Ihres Umzugsgutes ist die gesetzliche Haftung nach §451g HGB begrenzt auf 620,00 € pro Kubikmeter.</p>
        <p>Diese Grundhaftung beträgt gesamt: <strong>${grundhaftung.toFixed(2).replace('.', ',')} €</strong></p>
        <p>Versicherung: SCHUNCK GROUP - Oskar Schunck GmbH & Co. KG</p>
    </div>
    
    <div class="info-section">
        <h2>Transportversicherung für Umzugsgüter</h2>
        <p><strong>Ja, ich möchte eine Transport-Warenversicherung für mein Umzugsgut abschließen.</strong></p>
        
        <p style="margin-left: 20px;">
            <span class="checkbox"></span> <strong>zum Neuwert</strong><br>
            <span style="margin-left: 36px;">die Versicherungssumme soll dem Neupreis für die Anschaffung gleichwertigen Umzugsgutes entsprechen.</span><br>
            <span style="margin-left: 36px;">Zu 4,60 ‰ des Versicherungswertes zuzüglich 19,00 % Versicherungssteuer.</span>
        </p>
        
        <p style="margin-left: 20px;">
            <span class="checkbox"></span> <strong>zum Zeitwert</strong><br>
            <span style="margin-left: 36px;">die Versicherungssumme soll dem Kaufpreis für gleichwertiges, gebrauchtes Umzugsgut entsprechen.</span><br>
            <span style="margin-left: 36px;">Zu 3,60 ‰ des Versicherungswertes zuzüglich 19,00 % Versicherungssteuer.</span>
        </p>
        
        <p>mit einer <strong>Versicherungssumme</strong> von: __________ EUR</p>
    </div>
    
    <div class="section-header">Zahlungsbedingungen</div>
    
    <div class="info-section">
        <p>mit EC-Karte, bei Auftragsdurchführung.</p>
        <p>Aufgrund der allgemeinen Verkehrssituation kann es trotz sorgfältiger Planung zu nicht kalkulierbaren Verzögerungen kommen. Hierfür übernehmen wir keine Haftung.</p>
        <p>Der ausgewiesene Angebotspreis ist ein Festpreis inklusive Mehrwertsteuer.</p>
    </div>
    
    <div class="signature-section">
        <p><strong>Hinweis:</strong> Dieses Angebot ist unverbindlich und freibleibend. Alle Preise verstehen sich inkl. 19% MwSt.</p>
        <p>Mit meiner Unterschrift beauftrage ich RELOCATO® Bielefeld mit der Durchführung des Umzugs zu den genannten Konditionen.</p>
        
        <table style="width: 100%; margin-top: 40px;">
            <tr>
                <td style="width: 45%;">
                    <div class="signature-field"></div>
                    <p class="signature-label">Ort, Datum</p>
                </td>
                <td style="width: 10%;"></td>
                <td style="width: 45%;">
                    <div class="signature-field"></div>
                    <p class="signature-label">Unterschrift Auftraggeber</p>
                </td>
            </tr>
        </table>
    </div>
    
    <p class="footer-text">
        RELOCATO® Bielefeld | Detmolder Str. 234a, 33605 Bielefeld<br>
        Tel: (0521) 1200551-0 | E-Mail: bielefeld@relocato.de | Web: www.relocato.de<br>
        Wertvoll Dienstleistungen GmbH | Geschäftsführer: M. Michailowski & M. Knaub<br>
        Amtsgericht Bielefeld HRB 43574 | USt-IdNr.: DE328644143
    </p>
</body>
</html>`;

  return html;
};