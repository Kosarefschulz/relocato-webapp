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

export const generateWertvollProfessionalPDF = async (
  customer: Customer, 
  quote: QuoteData, 
  isInvoice: boolean = false
): Promise<Blob> => {
  try {
    const doc = new jsPDF({
      format: 'a4',
      unit: 'mm'
    });
    
    const company = COMPANY_CONFIGS.wertvoll;
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const rightMargin = pageWidth - margin;
    let yPosition = 20;

    // Farbschema
    const primaryColor = { r: 18, g: 86, b: 136 }; // #125688
    const accentColor = { r: 255, g: 152, b: 0 }; // #FF9800
    const grayLight = { r: 245, g: 245, b: 245 };
    const grayDark = { r: 100, g: 100, b: 100 };

    // Helper function für neue Seite
    const checkNewPage = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
        return true;
      }
      return false;
    };

    // Header mit professionellem Design
    const addHeader = () => {
      // Farbiger Header-Bereich
      doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
      doc.rect(0, 0, pageWidth, 45, 'F');
      
      // Firmenname und Logo-Bereich
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.text('WERTVOLL', margin, 20);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('DIENSTLEISTUNGEN GMBH', margin, 28);
      
      doc.setFontSize(8);
      doc.text(company.services, margin, 35);
      
      // Kontaktdaten rechts
      doc.setFontSize(9);
      const contactY = 15;
      doc.text(company.address.street, rightMargin, contactY, { align: 'right' });
      doc.text(`${company.address.zip} ${company.address.city}`, rightMargin, contactY + 5, { align: 'right' });
      doc.text(`Tel: ${company.contact.phone}`, rightMargin, contactY + 10, { align: 'right' });
      doc.text(`Mobil: ${company.contact.mobile}`, rightMargin, contactY + 15, { align: 'right' });
      doc.text(company.contact.email, rightMargin, contactY + 20, { align: 'right' });
      
      yPosition = 55;
    };

    // Footer
    const addFooter = () => {
      const footerY = pageHeight - 20;
      
      // Footer-Linie
      doc.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY - 15, rightMargin, footerY - 15);
      
      // Footer-Text
      doc.setFontSize(8);
      doc.setTextColor(grayDark.r, grayDark.g, grayDark.b);
      doc.setFont('helvetica', 'normal');
      
      const footerLines = [
        `${company.legalName} | Geschäftsführer: ${company.ceo.join(', ')}`,
        `${company.legal.court} ${company.legal.hrb} | Steuernummer: ${company.legal.taxNumber}`,
        `${company.bank.name} | IBAN: ${company.bank.iban}`
      ];
      
      footerLines.forEach((line, index) => {
        doc.text(line, pageWidth / 2, footerY - 10 + (index * 4), { align: 'center' });
      });
    };

    // Erste Seite
    addHeader();
    
    // Empfängeradresse
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    // Absenderzeile
    doc.setFontSize(8);
    doc.text(`${company.legalName} • ${company.address.street} • ${company.address.zip} ${company.address.city}`, margin, yPosition);
    
    yPosition += 10;
    
    // Empfänger-Box
    doc.setFillColor(grayLight.r, grayLight.g, grayLight.b);
    doc.rect(margin - 2, yPosition - 2, 85, 35, 'F');
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(customer.name || 'Kunde', margin, yPosition + 5);
    if (customer.address) {
      doc.text(customer.address, margin, yPosition + 11);
    }
    if (customer.city && customer.zip) {
      doc.text(`${customer.zip} ${customer.city}`, margin, yPosition + 17);
    }
    
    // Datum rechts
    const currentDate = new Date();
    doc.setFontSize(10);
    doc.text(currentDate.toLocaleDateString('de-DE', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }), rightMargin, yPosition + 5, { align: 'right' });
    
    yPosition += 45;
    
    // Dokumenttitel
    const docType = isInvoice ? 'RECHNUNG' : 'ANGEBOT';
    const docNumber = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}${String(currentDate.getDate()).padStart(2, '0')}-${customer.name ? customer.name.substring(0, 3).toUpperCase() : 'XXX'}`;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.text(docType, margin, yPosition);
    
    doc.setFontSize(12);
    doc.setTextColor(grayDark.r, grayDark.g, grayDark.b);
    doc.text(`Nr. ${docNumber}`, margin, yPosition + 8);
    
    yPosition += 20;
    
    // Anrede
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    
    const greeting = customer.salutation === 'Herr' 
      ? `Sehr geehrter Herr ${customer.name?.split(' ').pop()},`
      : customer.salutation === 'Frau'
      ? `Sehr geehrte Frau ${customer.name?.split(' ').pop()},`
      : `Sehr geehrte Damen und Herren,`;
    
    doc.text(greeting, margin, yPosition);
    yPosition += 8;
    
    const introText = isInvoice
      ? 'vielen Dank für Ihren Auftrag. Hiermit stellen wir Ihnen folgende Leistungen in Rechnung:'
      : 'vielen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen folgendes Angebot:';
    
    doc.text(introText, margin, yPosition);
    yPosition += 15;
    
    // Leistungstabelle
    const tableHeaders = ['Pos.', 'Leistungsbeschreibung', 'Menge', 'Einzelpreis', 'Gesamtpreis'];
    const colWidths = [15, 95, 25, 25, 30];
    const colX = [margin, margin + 15, margin + 110, margin + 135, margin + 160];
    
    // Tabellen-Header
    doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.rect(margin, yPosition, rightMargin - margin, 10, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    
    tableHeaders.forEach((header, i) => {
      const align = i >= 2 ? 'right' : 'left';
      const xPos = i >= 2 ? colX[i] + colWidths[i] - 3 : colX[i] + 3;
      doc.text(header, xPos, yPosition + 6, { align });
    });
    
    yPosition += 12;
    
    // Tabellen-Inhalt
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    const items = quote.items || [{
      position: 1,
      name: 'Dienstleistungspaket',
      description: 'Professionelle Ausführung aller vereinbarten Leistungen durch qualifiziertes Fachpersonal',
      quantity: '1',
      price: quote.price || 0
    }];
    
    let subtotal = 0;
    
    items.forEach((item, index) => {
      checkNewPage(25);
      
      // Alternierende Zeilenfarben
      if (index % 2 === 0) {
        doc.setFillColor(grayLight.r, grayLight.g, grayLight.b);
        doc.rect(margin, yPosition - 2, rightMargin - margin, 20, 'F');
      }
      
      // Position
      doc.text(item.position.toString(), colX[0] + 3, yPosition + 3);
      
      // Leistung
      doc.setFont('helvetica', 'bold');
      doc.text(item.name, colX[1] + 3, yPosition + 3);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const descLines = doc.splitTextToSize(item.description, colWidths[1] - 6);
      descLines.forEach((line: string, lineIndex: number) => {
        if (lineIndex < 2) { // Max 2 Zeilen
          doc.text(line, colX[1] + 3, yPosition + 8 + (lineIndex * 4));
        }
      });
      doc.setFontSize(10);
      
      // Menge
      doc.text(item.quantity, colX[2] + colWidths[2] - 3, yPosition + 3, { align: 'right' });
      
      // Einzelpreis
      const unitPrice = item.price / parseFloat(item.quantity) || item.price;
      doc.text(`${unitPrice.toFixed(2).replace('.', ',')} €`, colX[3] + colWidths[3] - 3, yPosition + 3, { align: 'right' });
      
      // Gesamtpreis
      doc.text(`${item.price.toFixed(2).replace('.', ',')} €`, colX[4] + colWidths[4] - 3, yPosition + 3, { align: 'right' });
      
      subtotal += item.price;
      yPosition += 22;
    });
    
    // Zusammenfassung
    yPosition += 10;
    
    // Trennlinie
    doc.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.setLineWidth(0.5);
    doc.line(colX[3], yPosition, rightMargin, yPosition);
    
    yPosition += 8;
    
    // Zwischensumme
    doc.setFont('helvetica', 'normal');
    doc.text('Zwischensumme netto:', colX[3], yPosition);
    doc.text(`${subtotal.toFixed(2).replace('.', ',')} €`, rightMargin, yPosition, { align: 'right' });
    
    yPosition += 6;
    
    // MwSt
    const vat = subtotal * 0.19;
    doc.text('zzgl. 19% MwSt.:', colX[3], yPosition);
    doc.text(`${vat.toFixed(2).replace('.', ',')} €`, rightMargin, yPosition, { align: 'right' });
    
    yPosition += 8;
    
    // Gesamtsumme
    doc.setLineWidth(1);
    doc.line(colX[3], yPosition - 2, rightMargin, yPosition - 2);
    
    const total = subtotal + vat;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Gesamtbetrag:', colX[3], yPosition + 5);
    doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.text(`${total.toFixed(2).replace('.', ',')} €`, rightMargin, yPosition + 5, { align: 'right' });
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    
    yPosition += 20;
    
    // Zusatzinformationen
    checkNewPage(80);
    
    if (!isInvoice) {
      // Angebotsbedingungen
      doc.setFillColor(grayLight.r, grayLight.g, grayLight.b);
      doc.rect(margin, yPosition, rightMargin - margin, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('ANGEBOTSBEDINGUNGEN', margin + 3, yPosition + 5);
      
      yPosition += 12;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      const conditions = [
        { title: 'Leistungsumfang:', text: 'Alle Arbeiten werden fachgerecht durch qualifiziertes Personal ausgeführt.' },
        { title: 'Zahlungsbedingungen:', text: '50% Anzahlung bei Auftragserteilung, Restzahlung nach Fertigstellung.' },
        { title: 'Ausführungszeitraum:', text: 'Nach Vereinbarung, voraussichtliche Dauer: 3-5 Werktage.' },
        { title: 'Gültigkeit:', text: `Dieses Angebot ist gültig bis zum ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE')}.` }
      ];
      
      conditions.forEach(condition => {
        doc.setFont('helvetica', 'bold');
        doc.text(condition.title, margin, yPosition);
        doc.setFont('helvetica', 'normal');
        const textX = margin + doc.getTextWidth(condition.title) + 2;
        doc.text(condition.text, textX, yPosition);
        yPosition += 6;
      });
    } else {
      // Rechnungsbedingungen
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);
      
      doc.setFillColor(accentColor.r, accentColor.g, accentColor.b);
      doc.rect(margin, yPosition, rightMargin - margin, 25, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('ZAHLUNGSINFORMATIONEN', margin + 3, yPosition + 6);
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Zahlungsziel: ${dueDate.toLocaleDateString('de-DE')}`, margin + 3, yPosition + 12);
      doc.text('Bitte überweisen Sie den Betrag unter Angabe der Rechnungsnummer.', margin + 3, yPosition + 18);
      
      doc.setTextColor(0, 0, 0);
      yPosition += 30;
    }
    
    // Abschlusstext
    yPosition += 10;
    doc.setFontSize(11);
    doc.text('Wir freuen uns auf eine erfolgreiche Zusammenarbeit!', margin, yPosition);
    
    yPosition += 8;
    doc.text('Für Rückfragen stehen wir Ihnen jederzeit gerne zur Verfügung.', margin, yPosition);
    
    yPosition += 15;
    doc.text('Mit freundlichen Grüßen', margin, yPosition);
    
    // Unterschrift
    yPosition += 25;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, margin + 70, yPosition);
    
    yPosition += 5;
    doc.setFontSize(10);
    company.ceo.forEach((ceo, index) => {
      doc.text(ceo, margin, yPosition + (index * 5));
    });
    doc.text('Geschäftsführung', margin, yPosition + 12);
    
    // Footer auf jeder Seite
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      addFooter();
      
      // Seitenzahl
      doc.setFontSize(8);
      doc.setTextColor(grayDark.r, grayDark.g, grayDark.b);
      doc.text(`Seite ${i} von ${pageCount}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
    }
    
    return doc.output('blob');
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
};

export const generateWertvollProfessionalInvoicePDF = (customer: Customer, invoice: Invoice): Promise<Blob> => {
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
      quantity: String(item.quantity || '1'),
      price: item.price || 0
    }))
  };
  
  return generateWertvollProfessionalPDF(customer, quoteData, true);
};