import { jsPDF } from 'jspdf';
import { Customer, Invoice } from '../types';
import { CompanyType, COMPANY_CONFIGS } from '../types/company';

interface QuoteData {
  customerId: string;
  customerName: string;
  price: number;
  comment?: string;
  createdAt: Date;
  createdBy: string;
  status: string;
  volume?: number;
  distance?: number;
  calculation?: any;
  details?: any;
  items?: QuoteItem[];
}

interface QuoteItem {
  position: number;
  name: string;
  description: string;
  quantity: string;
  price: number;
}

export const generateWertvollPDF = async (
  customer: Customer, 
  quote: QuoteData, 
  isInvoice: boolean = false
): Promise<Blob> => {
  try {
    const doc = new jsPDF();
    const company = COMPANY_CONFIGS.wertvoll;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 25;
    const rightMargin = pageWidth - margin;
    let yPosition = 25;

    // Helper function for footer
    const addFooter = () => {
      const footerY = pageHeight - 15;
      doc.setFontSize(8);
      doc.setTextColor(102, 102, 102);
      doc.setDrawColor(204, 204, 204);
      doc.line(margin, footerY - 5, rightMargin, footerY - 5);
      
      const footerText1 = `${company.legalName} | Geschäftsführer: ${company.ceo.join(', ')}`;
      const footerText2 = `Bank: ${company.bank.name} | IBAN: ${company.bank.iban}`;
      const footerText3 = `${company.legal.court} ${company.legal.hrb} | Steuernummer: ${company.legal.taxNumber}`;
      
      doc.text(footerText1, pageWidth / 2, footerY, { align: 'center' });
      doc.text(footerText2, pageWidth / 2, footerY + 4, { align: 'center' });
      doc.text(footerText3, pageWidth / 2, footerY + 8, { align: 'center' });
    };

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(company.name, margin, yPosition);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(85, 85, 85);
    doc.text(company.services, margin, yPosition + 5);
    
    // Contact details (right side)
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const contactX = rightMargin;
    doc.text(company.address.street, contactX, yPosition, { align: 'right' });
    doc.text(`${company.address.zip} ${company.address.city}`, contactX, yPosition + 5, { align: 'right' });
    doc.text('', contactX, yPosition + 10, { align: 'right' });
    doc.text(`Tel: ${company.contact.phone}`, contactX, yPosition + 15, { align: 'right' });
    if (company.contact.mobile) {
      doc.text(`Mobil: ${company.contact.mobile}`, contactX, yPosition + 20, { align: 'right' });
    }
    doc.text(company.contact.email, contactX, yPosition + 25, { align: 'right' });
    
    yPosition += 40;
    
    // Address line
    doc.setFontSize(8);
    doc.text(`${company.legalName} • ${company.address.street} • ${company.address.zip} ${company.address.city}`, margin, yPosition);
    doc.line(margin, yPosition + 2, rightMargin, yPosition + 2);
    
    yPosition += 15;
    
    // Recipient address
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(customer.name || 'Kunde', margin, yPosition);
    if (customer.address) {
      doc.text(customer.address, margin, yPosition + 6);
    }
    if (customer.city && customer.zip) {
      doc.text(`${customer.zip} ${customer.city}`, margin, yPosition + 12);
    }
    doc.text('Deutschland', margin, yPosition + 18);
    
    yPosition += 35;
    
    // Document info
    const currentDate = new Date();
    const docNumber = isInvoice 
      ? `Rechnung Nr. ${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}${String(currentDate.getDate()).padStart(2, '0')}-001`
      : `Angebot Nr. ${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}${String(currentDate.getDate()).padStart(2, '0')}-001`;
    
    doc.setFontSize(10);
    doc.text(`${company.address.city}, ${currentDate.toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })}`, rightMargin, yPosition, { align: 'right' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(docNumber, margin, yPosition + 10);
    
    yPosition += 20;
    
    // Greeting
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const greeting = customer.salutation === 'Herr' 
      ? `Sehr geehrter Herr ${customer.name?.split(' ').pop()},`
      : customer.salutation === 'Frau'
      ? `Sehr geehrte Frau ${customer.name?.split(' ').pop()},`
      : `Sehr geehrte Damen und Herren,`;
    doc.text(greeting, margin, yPosition);
    
    yPosition += 8;
    
    const introText = isInvoice
      ? 'vielen Dank für Ihren Auftrag. Hiermit stellen wir Ihnen folgende Leistungen in Rechnung:'
      : 'vielen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen folgendes Angebot für die gewünschten Dienstleistungen:';
    doc.text(introText, margin, yPosition);
    
    yPosition += 12;
    
    // Table headers
    doc.setFillColor(240, 240, 240);
    doc.setDrawColor(51, 51, 51);
    doc.rect(margin, yPosition, rightMargin - margin, 8, 'FD');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Pos.', margin + 3, yPosition + 5);
    doc.text('Leistungsbeschreibung', margin + 20, yPosition + 5);
    doc.text('Menge', rightMargin - 40, yPosition + 5, { align: 'right' });
    doc.text('Preis', rightMargin - 3, yPosition + 5, { align: 'right' });
    
    yPosition += 10;
    
    // Table content
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    let subtotal = 0;
    
    // Default items if none provided
    const items = quote.items || [
      {
        position: 1,
        name: 'Umzugsleistung',
        description: 'Kompletter Umzugsservice inklusive Transport und Montage',
        quantity: 'pauschal',
        price: quote.price || 0
      }
    ];
    
    items.forEach((item) => {
      // Draw borders
      doc.setDrawColor(204, 204, 204);
      doc.rect(margin, yPosition, rightMargin - margin, 20);
      
      // Position
      doc.text(item.position.toString(), margin + 3, yPosition + 5);
      
      // Service name and description
      doc.setFont('helvetica', 'bold');
      doc.text(item.name, margin + 20, yPosition + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(68, 68, 68);
      const descLines = doc.splitTextToSize(item.description, 100);
      descLines.forEach((line: string, index: number) => {
        doc.text(line, margin + 20, yPosition + 10 + (index * 4));
      });
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      
      // Quantity
      doc.text(item.quantity, rightMargin - 40, yPosition + 5, { align: 'right' });
      
      // Price
      doc.text(`${item.price.toFixed(2).replace('.', ',')} €`, rightMargin - 3, yPosition + 5, { align: 'right' });
      
      subtotal += item.price;
      yPosition += 22;
    });
    
    // Summary
    yPosition += 5;
    
    // Subtotal
    doc.text('Zwischensumme netto', rightMargin - 60, yPosition);
    doc.text(`${subtotal.toFixed(2).replace('.', ',')} €`, rightMargin - 3, yPosition, { align: 'right' });
    
    yPosition += 6;
    
    // VAT
    const vat = subtotal * 0.19;
    doc.text('zzgl. 19% MwSt.', rightMargin - 60, yPosition);
    doc.text(`${vat.toFixed(2).replace('.', ',')} €`, rightMargin - 3, yPosition, { align: 'right' });
    
    yPosition += 6;
    
    // Total
    doc.setFont('helvetica', 'bold');
    doc.setDrawColor(0, 0, 0);
    doc.line(rightMargin - 70, yPosition - 2, rightMargin, yPosition - 2);
    doc.line(rightMargin - 70, yPosition - 1, rightMargin, yPosition - 1);
    const total = subtotal + vat;
    doc.text('Gesamtbetrag brutto', rightMargin - 60, yPosition + 4);
    doc.text(`${total.toFixed(2).replace('.', ',')} €`, rightMargin - 3, yPosition + 4, { align: 'right' });
    
    yPosition += 15;
    
    // Terms
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    
    if (!isInvoice) {
      // Quote terms
      doc.setFont('helvetica', 'bold');
      doc.text('Leistungsumfang:', margin, yPosition);
      yPosition += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      const services = [
        '• Alle Arbeiten werden von qualifiziertem Fachpersonal durchgeführt',
        '• Ordnungsgemäße Entsorgung aller Abfälle gemäß geltenden Vorschriften',
        '• Verwendung hochwertiger Materialien',
        '• Besenreine Übergabe nach Abschluss aller Arbeiten'
      ];
      
      services.forEach(service => {
        doc.text(service, margin + 2, yPosition);
        yPosition += 5;
      });
      
      yPosition += 5;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Zahlungsbedingungen:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(' 50% Anzahlung bei Auftragserteilung, Restzahlung nach Fertigstellung.', margin + 45, yPosition);
      
      yPosition += 8;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Ausführungszeitraum:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(' Nach Absprache, voraussichtliche Dauer: 3-5 Werktage', margin + 45, yPosition);
      
      yPosition += 8;
      
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 30);
      doc.setFont('helvetica', 'bold');
      doc.text('Angebotsgültigkeit:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(` Dieses Angebot ist gültig bis zum ${validUntil.toLocaleDateString('de-DE')}.`, margin + 40, yPosition);
    } else {
      // Invoice terms
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);
      doc.text(`Zahlungsziel: ${dueDate.toLocaleDateString('de-DE')}`, margin, yPosition);
      yPosition += 8;
      doc.text('Bitte überweisen Sie den Betrag unter Angabe der Rechnungsnummer auf unser Konto.', margin, yPosition);
    }
    
    yPosition += 12;
    
    doc.text('Für Rückfragen stehen wir Ihnen jederzeit gerne zur Verfügung.', margin, yPosition);
    
    yPosition += 15;
    
    // Closing
    doc.text('Mit freundlichen Grüßen', margin, yPosition);
    yPosition += 5;
    doc.text(company.legalName, margin, yPosition);
    
    // Signature line
    yPosition += 20;
    doc.line(margin, yPosition, margin + 60, yPosition);
    yPosition += 5;
    company.ceo.forEach((ceo, index) => {
      doc.text(ceo, margin, yPosition + (index * 5));
    });
    doc.text('Geschäftsführer', margin, yPosition + 10);
    
    // Add footer
    addFooter();
    
    // Return as blob
    return doc.output('blob');
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
};

export const generateWertvollInvoicePDF = (customer: Customer, invoice: Invoice): Promise<Blob> => {
  const quoteData: QuoteData = {
    customerId: customer.id,
    customerName: customer.name,
    price: invoice.totalPrice,
    comment: invoice.notes,
    createdAt: new Date(invoice.createdAt),
    createdBy: invoice.createdBy || 'System',
    status: invoice.status,
    items: invoice.items?.map((item, index) => ({
      position: index + 1,
      name: item.name || 'Leistung',
      description: item.description || '',
      quantity: item.quantity || 'pauschal',
      price: item.price || 0
    }))
  };
  
  return generateWertvollPDF(customer, quoteData, true);
};