import { Customer, Quote } from '../types';
import { QuoteCalculation, QuoteDetails } from './quoteCalculation';
import { quoteCalculationService } from './quoteCalculation';

export const sendConfirmationEmail = async (
  customer: Customer,
  quote: Quote,
  customerEmail: string
): Promise<boolean> => {
  try {
    console.log('📧 Sende Bestätigungsmail an:', customerEmail || customer.email);
    
    // Erstelle QuoteDetails aus den verfügbaren Quote-Daten
    const quoteDetails: QuoteDetails = {
      volume: quote.volume || 50,
      distance: quote.distance || 25,
      packingRequested: quote.packingRequested || false,
      additionalServices: quote.additionalServices || [],
      notes: quote.comment || '',
      boxCount: quote.boxCount || 0,
      parkingZonePrice: quote.parkingZonePrice || 0,
      storagePrice: quote.storagePrice || 0,
      furnitureAssemblyPrice: quote.furnitureAssemblyPrice || 0,
      furnitureDisassemblyPrice: quote.furnitureDisassemblyPrice || 0,
      cleaningService: quote.cleaningService || false,
      cleaningHours: quote.cleaningHours || 0,
      clearanceService: quote.clearanceService || false,
      clearanceVolume: quote.clearanceVolume || 0,
      renovationService: quote.renovationService || false,
      renovationHours: quote.renovationHours || 0,
      pianoTransport: quote.pianoTransport || false,
      heavyItemsCount: quote.heavyItemsCount || 0,
      packingMaterials: quote.packingMaterials || false,
      manualBasePrice: quote.manualBasePrice
    };

    // Berechne die Kalkulation für die Preisaufschlüsselung
    const calculation: QuoteCalculation = quoteCalculationService.calculateQuote(customer, quoteDetails);
    
    // Verwende den tatsächlichen Preis aus dem Quote
    calculation.finalPrice = quote.price;
    
    const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #E8F5E9; padding: 20px; text-align: center; margin-bottom: 20px;">
        <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
        <h1 style="color: #8BC34A; margin: 0;">Vielen Dank für Ihre Bestätigung!</h1>
      </div>
      
      <h2 style="color: #8BC34A;">Sehr geehrte/r ${customer.name},</h2>
      
      <p>wir freuen uns, dass Sie unser Angebot angenommen haben! Ihre Bestätigung wurde erfolgreich registriert.</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">Ihre Auftragsdetails:</h3>
        <ul style="list-style: none; padding: 0;">
          <li style="margin: 10px 0;"><strong>Auftragsnummer:</strong> ${quote.id}</li>
          <li style="margin: 10px 0;"><strong>Bestätigt am:</strong> ${new Date().toLocaleDateString('de-DE', { 
            weekday: 'long', 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</li>
          <li style="margin: 10px 0;"><strong>Umzugstermin:</strong> ${customer.movingDate ? new Date(customer.movingDate).toLocaleDateString('de-DE', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          }) : 'Nach Absprache'}</li>
          <li style="margin: 10px 0;"><strong>Von:</strong> ${customer.fromAddress || 'Wird noch mitgeteilt'}</li>
          <li style="margin: 10px 0;"><strong>Nach:</strong> ${customer.toAddress || 'Wird noch mitgeteilt'}</li>
          <li style="margin: 10px 0;"><strong>Volumen:</strong> ${quoteDetails.volume} m³</li>
          <li style="margin: 10px 0;"><strong>Entfernung:</strong> ${quoteDetails.distance} km</li>
        </ul>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">Preisübersicht:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px 0;">Basis-Umzug (${calculation.volumeRange})</td>
              <td style="text-align: right; padding: 8px 0;">€ ${calculation.basePrice.toFixed(2)}</td>
            </tr>
            ${calculation.floorSurcharge > 0 ? `
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px 0;">Etagen-Zuschlag</td>
              <td style="text-align: right; padding: 8px 0;">€ ${calculation.floorSurcharge.toFixed(2)}</td>
            </tr>
            ` : ''}
            ${calculation.distanceSurcharge > 0 ? `
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px 0;">Entfernungs-Zuschlag</td>
              <td style="text-align: right; padding: 8px 0;">€ ${calculation.distanceSurcharge.toFixed(2)}</td>
            </tr>
            ` : ''}
            ${calculation.packingService > 0 ? `
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px 0;">Verpackungsservice</td>
              <td style="text-align: right; padding: 8px 0;">€ ${calculation.packingService.toFixed(2)}</td>
            </tr>
            ` : ''}
            ${calculation.boxesPrice > 0 ? `
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px 0;">Umzugskartons (${quoteDetails.boxCount} Stück)</td>
              <td style="text-align: right; padding: 8px 0;">€ ${calculation.boxesPrice.toFixed(2)}</td>
            </tr>
            ` : ''}
            ${calculation.parkingZonePrice > 0 ? `
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px 0;">Halteverbotszone</td>
              <td style="text-align: right; padding: 8px 0;">€ ${calculation.parkingZonePrice.toFixed(2)}</td>
            </tr>
            ` : ''}
            ${calculation.storagePrice > 0 ? `
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px 0;">Zwischenlagerung</td>
              <td style="text-align: right; padding: 8px 0;">€ ${calculation.storagePrice.toFixed(2)}</td>
            </tr>
            ` : ''}
            ${calculation.furnitureAssemblyPrice > 0 ? `
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px 0;">Möbelmontage</td>
              <td style="text-align: right; padding: 8px 0;">€ ${calculation.furnitureAssemblyPrice.toFixed(2)}</td>
            </tr>
            ` : ''}
            ${calculation.furnitureDisassemblyPrice > 0 ? `
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px 0;">Möbeldemontage</td>
              <td style="text-align: right; padding: 8px 0;">€ ${calculation.furnitureDisassemblyPrice.toFixed(2)}</td>
            </tr>
            ` : ''}
            ${calculation.priceBreakdown.cleaning > 0 ? `
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px 0;">Reinigungsservice (${quoteDetails.cleaningHours} Std.)</td>
              <td style="text-align: right; padding: 8px 0;">€ ${calculation.priceBreakdown.cleaning.toFixed(2)}</td>
            </tr>
            ` : ''}
            ${calculation.priceBreakdown.clearance > 0 ? `
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px 0;">Entrümpelung (${quoteDetails.clearanceVolume} m³)</td>
              <td style="text-align: right; padding: 8px 0;">€ ${calculation.priceBreakdown.clearance.toFixed(2)}</td>
            </tr>
            ` : ''}
            ${calculation.priceBreakdown.renovation > 0 ? `
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px 0;">Renovierungsarbeiten (${quoteDetails.renovationHours} Std.)</td>
              <td style="text-align: right; padding: 8px 0;">€ ${calculation.priceBreakdown.renovation.toFixed(2)}</td>
            </tr>
            ` : ''}
            ${calculation.priceBreakdown.piano > 0 ? `
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px 0;">Klaviertransport</td>
              <td style="text-align: right; padding: 8px 0;">€ ${calculation.priceBreakdown.piano.toFixed(2)}</td>
            </tr>
            ` : ''}
            ${calculation.priceBreakdown.heavyItems > 0 ? `
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px 0;">Schwertransport (${quoteDetails.heavyItemsCount} Stück)</td>
              <td style="text-align: right; padding: 8px 0;">€ ${calculation.priceBreakdown.heavyItems.toFixed(2)}</td>
            </tr>
            ` : ''}
            ${calculation.priceBreakdown.packingMaterials > 0 ? `
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px 0;">Verpackungsmaterial</td>
              <td style="text-align: right; padding: 8px 0;">€ ${calculation.priceBreakdown.packingMaterials.toFixed(2)}</td>
            </tr>
            ` : ''}
          </tbody>
        </table>
      </div>
      
      <div style="background-color: #8BC34A; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <h2 style="margin: 0; font-size: 36px;">Gesamtpreis: ${quote.price.toFixed(2).replace('.', ',')} €</h2>
        <p style="margin: 5px 0; opacity: 0.9;">inkl. 19% MwSt.</p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">Ihre Vorteile bei uns:</h3>
        <ul style="list-style: none; padding: 0;">
          <li style="margin: 5px 0;">✓ Transparente Preisgestaltung ohne versteckte Kosten</li>
          <li style="margin: 5px 0;">✓ Professionelles und erfahrenes Umzugsteam</li>
          <li style="margin: 5px 0;">✓ Umfassender Versicherungsschutz inklusive</li>
          <li style="margin: 5px 0;">✓ Flexible Terminvereinbarung nach Ihren Wünschen</li>
        </ul>
      </div>
      
      <h3>Wie geht es weiter?</h3>
      <ol>
        <li><strong>Auftragsbestätigung:</strong> Sie erhalten in Kürze eine detaillierte Auftragsbestätigung per E-Mail.</li>
        <li><strong>Terminabsprache:</strong> Unser Team wird sich bezüglich der genauen Uhrzeiten mit Ihnen in Verbindung setzen.</li>
        <li><strong>Vorbereitung:</strong> Ca. eine Woche vor dem Umzug erhalten Sie eine Checkliste zur optimalen Vorbereitung.</li>
        <li><strong>Umzugstag:</strong> Unser Team erscheint pünktlich zum vereinbarten Termin.</li>
      </ol>
      
      <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung:</p>
      <ul style="list-style: none; padding: 0;">
        <li style="margin: 5px 0;">📞 Tel: (0521) 1200551-0</li>
        <li style="margin: 5px 0;">✉️ E-Mail: bielefeld@relocato.de</li>
        <li style="margin: 5px 0;">🕒 Erreichbar: Mo-Fr 8:00-18:00 Uhr, Sa 9:00-14:00 Uhr</li>
      </ul>
      
      <p>Mit freundlichen Grüßen<br>
      Ihr RELOCATO® Team Bielefeld</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      
      <p style="font-size: 12px; color: #666;">
        RELOCATO® Bielefeld<br>
        Detmolder Str. 234a, 33605 Bielefeld<br>
        Wertvoll Dienstleistungen GmbH | Geschäftsführer: M. Michailowski & M. Knaub<br>
        Amtsgericht Bielefeld HRB 43574 | USt-IdNr.: DE328644143
      </p>
    </div>
`;

    // Send email via backend
    const API_URL = process.env.REACT_APP_API_URL || 'https://api.ruempel-schmiede.com';
    
    const emailData = {
      to: customerEmail || customer.email,
      subject: `Bestätigung Ihres Umzugsauftrags - ${customer.name}`,
      content: emailContent
    };
    
    const response = await fetch(`${API_URL}/api/send-email`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Origin': window.location.origin
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      throw new Error(`Email service responded with status: ${response.status}`);
    }

    console.log('✅ Bestätigungsmail erfolgreich gesendet');
    return true;
  } catch (error) {
    console.error('❌ Fehler beim Senden der Bestätigungsmail:', error);
    throw error;
  }
};