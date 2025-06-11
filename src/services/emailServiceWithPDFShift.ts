import { Customer } from '../types';
import { QuoteCalculation } from './quoteCalculation';
import { generateEmailHTML } from './htmlEmailTemplate';
import { generatePDFWithPDFShift } from './pdfshiftService';

interface EmailData {
  to: string;
  subject: string;
  content: string;
  attachments?: {
    filename: string;
    content: Blob;
  }[];
}

export const sendQuoteEmailWithPDFShift = async (
  customer: Customer,
  calculation: QuoteCalculation,
  quoteDetails: any
): Promise<boolean> => {
  try {
    console.log('📧 Erstelle E-Mail mit PDFShift PDF...');
    
    // HTML für E-Mail generieren
    const htmlContent = generateEmailHTML(customer, calculation, quoteDetails);
    
    // PDF mit PDFShift generieren
    console.log('🔄 Generiere PDF mit PDFShift...');
    const pdfArrayBuffer = await generatePDFWithPDFShift(htmlContent);
    
    // ArrayBuffer zu Blob konvertieren
    const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
    
    // E-Mail-Objekt erstellen
    const emailData: EmailData = {
      to: customer.email,
      subject: `Ihr Umzugsangebot von RELOCATO® Bielefeld`,
      content: `
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
          
          <p>Das detaillierte Angebot finden Sie im PDF-Anhang.</p>
          
          <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung:</p>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 5px 0;">📞 Tel: (0521) 1200551-0</li>
            <li style="margin: 5px 0;">✉️ E-Mail: bielefeld@relocato.de</li>
          </ul>
          
          <p>Mit freundlichen Grüßen<br>
          Ihr RELOCATO® Team Bielefeld</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          
          <p style="font-size: 12px; color: #666;">
            RELOCATO® Bielefeld<br>
            Detmolder Str. 234a, 33605 Bielefeld<br>
            Wertvoll Dienstleistungen GmbH | HRB 43574
          </p>
        </div>
      `,
      attachments: [{
        filename: `Umzugsangebot_${customer.name.replace(/\s+/g, '_')}.pdf`,
        content: pdfBlob
      }]
    };
    
    // E-Mail über Backend senden
    const API_URL = process.env.REACT_APP_API_URL || 'https://api.ruempel-schmiede.com';
    
    const response = await fetch(`${API_URL}/api/send-email`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Origin': window.location.origin
      },
      body: JSON.stringify({
        to: emailData.to,
        subject: emailData.subject,
        content: emailData.content,
        attachments: emailData.attachments ? await Promise.all(
          emailData.attachments.map(async (att) => ({
            filename: att.filename,
            content: await blobToBase64(att.content),
            encoding: 'base64'
          }))
        ) : [],
        bcc: process.env.REACT_APP_SMTP_FROM || 'bielefeld@relocato.de' // BCC für Gesendet-Ordner
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ E-Mail mit PDFShift PDF erfolgreich gesendet');
      return true;
    } else {
      console.error('❌ E-Mail-Versand fehlgeschlagen:', result.error);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Fehler beim E-Mail-Versand:', error);
    return false;
  }
};

// Helper function to convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};