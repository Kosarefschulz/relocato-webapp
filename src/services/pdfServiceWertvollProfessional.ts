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
    const margin = 15; // 15mm margins like HTML
    const rightMargin = pageWidth - margin;
    let yPosition = margin;

    // Font sizes from HTML
    const fontSizes = {
      companyName: 16,
      services: 8,
      contact: 8,
      addressLine: 7,
      recipient: 9,
      reference: 11,
      date: 9,
      body: 10,
      table: 9,
      serviceDesc: 8,
      info: 9,
      footer: 7
    };

    // Colors
    const colors = {
      primary: { r: 0, g: 0, b: 0 },
      gray: { r: 102, g: 102, b: 102 },
      lightGray: { r: 245, g: 245, b: 245 },
      borderGray: { r: 221, g: 221, b: 221 }
    };

    // Helper function für neue Seite
    const checkNewPage = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // HEADER - Kompakt wie im HTML
    // Firmenname links
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(fontSizes.companyName);
    doc.text('Wertvoll Dienstleistungen GmbH', margin, yPosition);
    
    // Services darunter
    yPosition += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSizes.services);
    doc.setTextColor(colors.gray.r, colors.gray.g, colors.gray.b);
    doc.text('Rückbau • Umzüge • Entrümpelungen • Entkernung • Renovierungsarbeiten • Gewerbeauflösungen', margin, yPosition);
    
    // Kontakt rechts
    const contactY = margin;
    doc.setFontSize(fontSizes.contact);
    doc.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
    doc.text(company.address.street, rightMargin, contactY, { align: 'right' });
    doc.text(`${company.address.zip} ${company.address.city}`, rightMargin, contactY + 3.5, { align: 'right' });
    doc.text(`Tel: ${company.contact.phone}`, rightMargin, contactY + 7, { align: 'right' });
    doc.text(`Mobil: ${company.contact.mobile}`, rightMargin, contactY + 10.5, { align: 'right' });
    doc.text(company.contact.email, rightMargin, contactY + 14, { align: 'right' });
    
    yPosition += 12;
    
    // Absenderzeile mit Unterstrich
    doc.setFontSize(fontSizes.addressLine);
    const addressLineText = `${company.legalName} • ${company.address.street} • ${company.address.zip} ${company.address.city}`;
    doc.text(addressLineText, margin, yPosition);
    
    // Unterstrich für Absenderzeile
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.1);
    doc.line(margin, yPosition + 1, rightMargin, yPosition + 1);
    
    yPosition += 10;
    
    // Empfängeradresse
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSizes.recipient);
    doc.text(customer.name || 'Kunde', margin, yPosition);
    if (customer.address) {
      doc.text(customer.address, margin, yPosition + 4);
    }
    if (customer.city && customer.zip) {
      doc.text(`${customer.zip} ${customer.city}`, margin, yPosition + 8);
    }
    
    yPosition += 20;
    
    // Datum und Referenz
    const currentDate = new Date();
    const docNumber = isInvoice 
      ? `Rechnung Nr. ${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}${String(currentDate.getDate()).padStart(2, '0')}-001`
      : `Angebot Nr. ${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}${String(currentDate.getDate()).padStart(2, '0')}-001`;
    
    // Referenznummer links
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(fontSizes.reference);
    doc.text(docNumber, margin, yPosition);
    
    // Datum rechts
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSizes.date);
    doc.text(`${company.address.city}, ${currentDate.toLocaleDateString('de-DE', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, rightMargin, yPosition, { align: 'right' });
    
    yPosition += 10;
    
    // Anrede und Einleitung
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSizes.body);
    
    const greeting = customer.salutation === 'Herr' 
      ? `Sehr geehrter Herr ${customer.name?.split(' ').pop()},`
      : customer.salutation === 'Frau'
      ? `Sehr geehrte Frau ${customer.name?.split(' ').pop()},`
      : `Sehr geehrte Damen und Herren,`;
    
    doc.text(greeting, margin, yPosition);
    yPosition += 5;
    
    const introText = isInvoice
      ? 'vielen Dank für Ihren Auftrag. Wir berechnen Ihnen folgende Leistungen:'
      : 'vielen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen folgendes Angebot:';
    
    doc.text(introText, margin, yPosition);
    yPosition += 10;
    
    // TABELLE - Exakt wie im HTML
    doc.setFontSize(fontSizes.table);
    
    // Tabellenkopf
    doc.setFillColor(colors.lightGray.r, colors.lightGray.g, colors.lightGray.b);
    doc.setDrawColor(colors.borderGray.r, colors.borderGray.g, colors.borderGray.b);
    doc.setLineWidth(0.1);
    
    // Header-Zeile
    const tableX = margin;
    const tableWidth = rightMargin - margin;
    const colWidths = {
      pos: tableWidth * 0.08,
      desc: tableWidth * 0.62,
      qty: tableWidth * 0.15,
      price: tableWidth * 0.15
    };
    
    // Header-Hintergrund
    doc.rect(tableX, yPosition, tableWidth, 8, 'FD');
    
    // Vertikale Linien
    let currentX = tableX;
    doc.line(currentX, yPosition, currentX, yPosition + 8); // Links
    currentX += colWidths.pos;
    doc.line(currentX, yPosition, currentX, yPosition + 8);
    currentX += colWidths.desc;
    doc.line(currentX, yPosition, currentX, yPosition + 8);
    currentX += colWidths.qty;
    doc.line(currentX, yPosition, currentX, yPosition + 8);
    doc.line(tableX + tableWidth, yPosition, tableX + tableWidth, yPosition + 8); // Rechts
    
    // Header-Text
    doc.setFont('helvetica', 'bold');
    doc.text('Pos.', tableX + colWidths.pos / 2, yPosition + 5, { align: 'center' });
    doc.text('Leistungsbeschreibung', tableX + colWidths.pos + 3, yPosition + 5);
    doc.text('Menge', tableX + colWidths.pos + colWidths.desc + colWidths.qty / 2, yPosition + 5, { align: 'center' });
    doc.text('Preis', tableX + colWidths.pos + colWidths.desc + colWidths.qty + colWidths.price - 3, yPosition + 5, { align: 'right' });
    
    yPosition += 8;
    
    // Tabellendaten
    doc.setFont('helvetica', 'normal');
    
    // Default items wenn keine vorhanden
    const items = quote.items || [
      {
        position: 1,
        name: 'Dienstleistungspaket',
        description: 'Professionelle Ausführung aller vereinbarten Leistungen',
        quantity: 'pauschal',
        price: quote.price || 0
      }
    ];
    
    let subtotal = 0;
    
    items.forEach((item) => {
      checkNewPage(15);
      
      const rowHeight = 15;
      
      // Zeilen-Hintergrund (weiß)
      doc.setFillColor(255, 255, 255);
      doc.rect(tableX, yPosition, tableWidth, rowHeight, 'FD');
      
      // Rahmen für jede Zelle
      currentX = tableX;
      doc.rect(currentX, yPosition, colWidths.pos, rowHeight); // Pos
      currentX += colWidths.pos;
      doc.rect(currentX, yPosition, colWidths.desc, rowHeight); // Beschreibung
      currentX += colWidths.desc;
      doc.rect(currentX, yPosition, colWidths.qty, rowHeight); // Menge
      currentX += colWidths.qty;
      doc.rect(currentX, yPosition, colWidths.price, rowHeight); // Preis
      
      // Position
      doc.text(item.position.toString(), tableX + colWidths.pos / 2, yPosition + 5, { align: 'center' });
      
      // Leistungsbeschreibung
      const descX = tableX + colWidths.pos + 3;
      doc.setFont('helvetica', 'bold');
      doc.text(item.name, descX, yPosition + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontSizes.serviceDesc);
      doc.setTextColor(colors.gray.r, colors.gray.g, colors.gray.b);
      doc.text(item.description, descX, yPosition + 9);
      doc.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
      doc.setFontSize(fontSizes.table);
      
      // Menge
      doc.text(item.quantity, tableX + colWidths.pos + colWidths.desc + colWidths.qty / 2, yPosition + 5, { align: 'center' });
      
      // Preis
      doc.text(`${item.price.toFixed(2).replace('.', ',')} €`, tableX + tableWidth - 3, yPosition + 5, { align: 'right' });
      
      subtotal += item.price;
      yPosition += rowHeight;
    });
    
    // Summenbereich
    yPosition += 5;
    
    // Zwischensumme
    const sumX = tableX + colWidths.pos + colWidths.desc;
    doc.text('Zwischensumme netto', sumX, yPosition);
    doc.text(`${subtotal.toFixed(2).replace('.', ',')} €`, rightMargin, yPosition, { align: 'right' });
    
    yPosition += 5;
    
    // MwSt
    const vat = subtotal * 0.19;
    doc.text('zzgl. 19% MwSt.', sumX, yPosition);
    doc.text(`${vat.toFixed(2).replace('.', ',')} €`, rightMargin, yPosition, { align: 'right' });
    
    yPosition += 5;
    
    // Trennlinie über Gesamtsumme
    doc.setLineWidth(0.5);
    doc.line(sumX, yPosition, rightMargin, yPosition);
    
    yPosition += 5;
    
    // Gesamtsumme
    const total = subtotal + vat;
    doc.setFont('helvetica', 'bold');
    doc.text('Gesamtbetrag brutto', sumX, yPosition);
    doc.text(`${total.toFixed(2).replace('.', ',')} €`, rightMargin, yPosition, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    yPosition += 10;
    
    // Info-Blöcke
    if (!isInvoice) {
      // Leistungsumfang
      doc.setFontSize(fontSizes.info);
      doc.setFont('helvetica', 'bold');
      doc.text('Leistungsumfang:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      
      yPosition += 5;
      const leistungen = [
        '• Ausführung durch qualifiziertes Fachpersonal',
        '• Ordnungsgemäße Entsorgung gemäß Vorschriften',
        '• Verwendung hochwertiger Materialien',
        '• Besenreine Übergabe'
      ];
      
      leistungen.forEach(punkt => {
        doc.text(punkt, margin + 3, yPosition);
        yPosition += 4;
      });
      
      yPosition += 5;
      
      // Zahlungsbedingungen etc.
      doc.setFont('helvetica', 'bold');
      doc.text('Zahlungsbedingungen:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(' 50% Anzahlung, Rest nach Fertigstellung', margin + 35, yPosition);
      
      yPosition += 5;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Ausführungszeitraum:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(' Nach Absprache, ca. 3-5 Werktage', margin + 35, yPosition);
      
      yPosition += 5;
      
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 30);
      doc.setFont('helvetica', 'bold');
      doc.text('Angebotsgültigkeit:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(` Bis ${validUntil.toLocaleDateString('de-DE')}`, margin + 32, yPosition);
      
      yPosition += 10;
    } else {
      // Rechnungsspezifische Infos
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);
      doc.text(`Zahlungsziel: ${dueDate.toLocaleDateString('de-DE')}`, margin, yPosition);
      yPosition += 5;
      doc.text('Bitte überweisen Sie den Betrag unter Angabe der Rechnungsnummer.', margin, yPosition);
      yPosition += 10;
    }
    
    // Abschlusstext
    doc.text('Für Rückfragen stehen wir Ihnen jederzeit zur Verfügung.', margin, yPosition);
    
    yPosition += 10;
    
    // Grußformel
    doc.text('Mit freundlichen Grüßen', margin, yPosition);
    yPosition += 3;
    doc.text('Wertvoll Dienstleistungen GmbH', margin, yPosition);
    
    // Unterschriftslinie
    yPosition += 25;
    doc.setLineWidth(0.1);
    doc.line(margin, yPosition, margin + 40, yPosition);
    
    yPosition += 3;
    doc.text('Michael Michailowski', margin, yPosition);
    yPosition += 3;
    doc.text('Geschäftsführer', margin, yPosition);
    
    // Footer - auf jeder Seite
    const addFooter = () => {
      const footerY = pageHeight - 15;
      
      // Footer-Linie
      doc.setDrawColor(colors.borderGray.r, colors.borderGray.g, colors.borderGray.b);
      doc.setLineWidth(0.1);
      doc.line(margin, footerY - 5, rightMargin, footerY - 5);
      
      // Footer-Text
      doc.setFontSize(fontSizes.footer);
      doc.setTextColor(colors.gray.r, colors.gray.g, colors.gray.b);
      
      const footerLine1 = `${company.legalName} | Geschäftsführer: ${company.ceo.join(', ')}`;
      const footerLine2 = `Bank: ${company.bank.name} | IBAN: ${company.bank.iban} | Amtsgericht: ${company.legal.court} ${company.legal.hrb} | StNr: ${company.legal.taxNumber}`;
      
      doc.text(footerLine1, pageWidth / 2, footerY - 2, { align: 'center' });
      doc.text(footerLine2, pageWidth / 2, footerY + 1, { align: 'center' });
    };
    
    // Footer auf jeder Seite hinzufügen
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      addFooter();
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