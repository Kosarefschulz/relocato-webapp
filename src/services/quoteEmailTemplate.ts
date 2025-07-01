import { Customer } from '../types';
import { QuoteCalculation } from './quoteCalculation';
import { tokenService } from './tokenService';
import { generateQRCode } from './qrCodeService';

export interface QuoteEmailOptions {
  customer: Customer;
  calculation: QuoteCalculation;
  quoteDetails: any;
  confirmationToken?: string;
  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
}

export const generateQuoteEmailHTML = async (options: QuoteEmailOptions): Promise<string> => {
  const {
    customer,
    calculation,
    quoteDetails,
    confirmationToken,
    companyName = 'RELOCATO® Bielefeld',
    companyEmail = 'bielefeld@relocato.de',
    companyPhone = '(0521) 1200551-0',
    companyAddress = 'Albrechtstraße 27, 33605 Bielefeld<br>Wertvoll Dienstleistungen GmbH | HRB 43574'
  } = options;

  let confirmationSection = '';
  
  if (confirmationToken) {
    const confirmationUrl = tokenService.generateConfirmationUrl(confirmationToken);
    const qrCodeDataUrl = await generateQRCode(confirmationUrl);
    
    confirmationSection = `
      <div style="background-color: #E8F5E9; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #8BC34A;">
        <h3 style="color: #8BC34A; margin-top: 0; text-align: center;">Angebot online bestätigen</h3>
        
        <p style="text-align: center; margin: 20px 0;">
          <a href="${confirmationUrl}" 
             style="display: inline-block; background-color: #8BC34A; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
            ✓ Angebot online bestätigen
          </a>
        </p>
        
        <p style="text-align: center; font-size: 14px; color: #666; margin: 10px 0;">
          Falls der Button nicht funktioniert, kopieren Sie diesen Link:<br>
          <a href="${confirmationUrl}" 
             style="color: #1976d2; word-break: break-all;">
            ${confirmationUrl}
          </a>
        </p>
        
        <div style="text-align: center; margin: 20px 0;">
          <p style="font-size: 14px; color: #666; margin-bottom: 10px;">Oder scannen Sie diesen QR-Code:</p>
          <img src="${qrCodeDataUrl}" 
               alt="QR Code" 
               style="width: 200px; height: 200px; border: 2px solid #8BC34A; padding: 10px; background: white;">
        </div>
        
        <ul style="list-style: none; padding: 0; margin: 15px 0; font-size: 14px;">
          <li style="margin: 5px 0;">✓ Angebot digital unterschreiben</li>
          <li style="margin: 5px 0;">✓ Verbindliche Auftragserteilung</li>
          <li style="margin: 5px 0;">✓ Sofortige Bestätigung erhalten</li>
        </ul>
      </div>
    `;
  }

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #8BC34A;">Sehr geehrte/r ${customer.name},</h2>
      
      <p>vielen Dank für Ihre Anfrage! Anbei erhalten Sie Ihr persönliches Umzugsangebot.</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">Angebotsübersicht:</h3>
        <ul style="list-style: none; padding: 0;">
          <li style="margin: 10px 0;"><strong>Umzugstermin:</strong> ${customer.movingDate || 'Nach Absprache'}</li>
          <li style="margin: 10px 0;"><strong>Von:</strong> ${customer.fromAddress || 'Wird noch mitgeteilt'}</li>
          <li style="margin: 10px 0;"><strong>Nach:</strong> ${customer.toAddress || 'Wird noch mitgeteilt'}</li>
          <li style="margin: 10px 0;"><strong>Volumen:</strong> ${quoteDetails.volume} m³</li>
          <li style="margin: 10px 0;"><strong>Entfernung:</strong> ${quoteDetails.distance} km</li>
        </ul>
      </div>
      
      <div style="background-color: #8BC34A; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <h2 style="margin: 0; font-size: 36px;">Gesamtpreis: ${calculation.finalPrice.toFixed(2).replace('.', ',')} €</h2>
        <p style="margin: 5px 0; opacity: 0.9;">inkl. 19% MwSt.</p>
      </div>
      
      ${confirmationSection}
      
      <p>Das detaillierte Angebot finden Sie im PDF-Anhang.</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">Ihre Vorteile bei uns:</h3>
        <ul style="list-style: none; padding: 0;">
          <li style="margin: 5px 0;">✓ Transparente Preisgestaltung ohne versteckte Kosten</li>
          <li style="margin: 5px 0;">✓ Professionelles und erfahrenes Umzugsteam</li>
          <li style="margin: 5px 0;">✓ Umfassender Versicherungsschutz inklusive</li>
          <li style="margin: 5px 0;">✓ Flexible Terminvereinbarung nach Ihren Wünschen</li>
          <li style="margin: 5px 0;">✓ Digitale Auftragsbestätigung - schnell und einfach</li>
        </ul>
      </div>
      
      <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung:</p>
      <ul style="list-style: none; padding: 0;">
        <li style="margin: 5px 0;">📞 Tel: ${companyPhone}</li>
        <li style="margin: 5px 0;">✉️ E-Mail: ${companyEmail}</li>
      </ul>
      
      <p>Mit freundlichen Grüßen<br>
      Ihr ${companyName}</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      
      <p style="font-size: 12px; color: #666;">
        ${companyName}<br>
        ${companyAddress}
      </p>
    </div>
  `;
};

// Simplified version without async for cases where QR code is not needed
export const generateQuoteEmailHTMLSync = (options: QuoteEmailOptions): string => {
  const {
    customer,
    calculation,
    quoteDetails,
    confirmationToken,
    companyName = 'RELOCATO® Bielefeld',
    companyEmail = 'bielefeld@relocato.de',
    companyPhone = '(0521) 1200551-0',
    companyAddress = 'Albrechtstraße 27, 33605 Bielefeld<br>Wertvoll Dienstleistungen GmbH | HRB 43574'
  } = options;

  let confirmationSection = '';
  
  if (confirmationToken) {
    const confirmationUrl = tokenService.generateConfirmationUrl(confirmationToken);
    
    confirmationSection = `
      <div style="background-color: #E8F5E9; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #8BC34A;">
        <h3 style="color: #8BC34A; margin-top: 0; text-align: center;">Angebot online bestätigen</h3>
        
        <p style="text-align: center; margin: 20px 0;">
          <a href="${confirmationUrl}" 
             style="display: inline-block; background-color: #8BC34A; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
            ✓ Angebot online bestätigen
          </a>
        </p>
        
        <p style="text-align: center; font-size: 14px; color: #666; margin: 10px 0;">
          Falls der Button nicht funktioniert, kopieren Sie diesen Link:<br>
          <a href="${confirmationUrl}" 
             style="color: #1976d2; word-break: break-all;">
            ${confirmationUrl}
          </a>
        </p>
        
        <p style="text-align: center; font-size: 14px; color: #666; margin: 20px 0;">
          <strong>Hinweis:</strong> Um den QR-Code zu sehen und das Angebot digital zu unterschreiben,<br>
          besuchen Sie bitte den obigen Link.
        </p>
      </div>
    `;
  }

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #8BC34A;">Sehr geehrte/r ${customer.name},</h2>
      
      <p>vielen Dank für Ihre Anfrage! Anbei erhalten Sie Ihr persönliches Umzugsangebot.</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">Angebotsübersicht:</h3>
        <ul style="list-style: none; padding: 0;">
          <li style="margin: 10px 0;"><strong>Umzugstermin:</strong> ${customer.movingDate || 'Nach Absprache'}</li>
          <li style="margin: 10px 0;"><strong>Von:</strong> ${customer.fromAddress || 'Wird noch mitgeteilt'}</li>
          <li style="margin: 10px 0;"><strong>Nach:</strong> ${customer.toAddress || 'Wird noch mitgeteilt'}</li>
          <li style="margin: 10px 0;"><strong>Volumen:</strong> ${quoteDetails.volume} m³</li>
          <li style="margin: 10px 0;"><strong>Entfernung:</strong> ${quoteDetails.distance} km</li>
        </ul>
      </div>
      
      <div style="background-color: #8BC34A; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <h2 style="margin: 0; font-size: 36px;">Gesamtpreis: ${calculation.finalPrice.toFixed(2).replace('.', ',')} €</h2>
        <p style="margin: 5px 0; opacity: 0.9;">inkl. 19% MwSt.</p>
      </div>
      
      ${confirmationSection}
      
      <p>Das detaillierte Angebot finden Sie im PDF-Anhang.</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">Ihre Vorteile bei uns:</h3>
        <ul style="list-style: none; padding: 0;">
          <li style="margin: 5px 0;">✓ Transparente Preisgestaltung ohne versteckte Kosten</li>
          <li style="margin: 5px 0;">✓ Professionelles und erfahrenes Umzugsteam</li>
          <li style="margin: 5px 0;">✓ Umfassender Versicherungsschutz inklusive</li>
          <li style="margin: 5px 0;">✓ Flexible Terminvereinbarung nach Ihren Wünschen</li>
          <li style="margin: 5px 0;">✓ Digitale Auftragsbestätigung - schnell und einfach</li>
        </ul>
      </div>
      
      <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung:</p>
      <ul style="list-style: none; padding: 0;">
        <li style="margin: 5px 0;">📞 Tel: ${companyPhone}</li>
        <li style="margin: 5px 0;">✉️ E-Mail: ${companyEmail}</li>
      </ul>
      
      <p>Mit freundlichen Grüßen<br>
      Ihr ${companyName}</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      
      <p style="font-size: 12px; color: #666;">
        ${companyName}<br>
        ${companyAddress}
      </p>
    </div>
  `;
};