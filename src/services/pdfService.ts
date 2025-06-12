import jsPDF from 'jspdf';
import { Customer } from '../types';

interface QuoteData {
  customerId: string;
  customerName: string;
  price: number;
  comment?: string;
  createdAt: Date;
  createdBy: string;
  status: string;
}

export const generatePDF = async (customer: Customer, quote: QuoteData, htmlContent?: string): Promise<Blob> => {
  // Verwende immer die robuste jsPDF-Implementierung
  const doc = new jsPDF();
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = margin;

  // Header mit RELOCATO Branding
  doc.setFontSize(28);
  doc.setTextColor(139, 195, 74); // Grün
  doc.text('RELOCATO®', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 12;
  
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text('UMZUGSANGEBOT', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  doc.setFontSize(10);
  doc.setTextColor(128);
  doc.text(`Angebotsnummer: UMZ-${new Date().getTime().toString().slice(-6)}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 8;
  doc.text(`Datum: ${new Date().toLocaleDateString('de-DE')}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 25;

  // Kundenansprache
  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.text('Sehr geehrte/r ' + (customer.name || 'Kunde') + ',', margin, yPosition);
  yPosition += 12;

  doc.setFontSize(11);
  const introText = 'vielen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen folgendes Angebot für Ihren Umzug:';
  const splitIntro = doc.splitTextToSize(introText, pageWidth - 2 * margin);
  doc.text(splitIntro, margin, yPosition);
  yPosition += splitIntro.length * 5 + 20;

  // Umzugsdetails Box
  doc.setFillColor(245, 245, 245);
  const boxHeight = 80;
  doc.rect(margin - 5, yPosition - 10, pageWidth - 2 * margin + 10, boxHeight, 'F');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(139, 195, 74);
  doc.text('UMZUGSDETAILS', margin, yPosition);
  yPosition += 15;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0);
  
  doc.text('Von:', margin, yPosition);
  doc.text(customer.fromAddress || 'Wird noch mitgeteilt', margin + 25, yPosition);
  yPosition += 10;
  
  doc.text('Nach:', margin, yPosition);
  doc.text(customer.toAddress || 'Wird noch mitgeteilt', margin + 25, yPosition);
  yPosition += 10;
  
  doc.text('Umzugsdatum:', margin, yPosition);
  const movingDate = customer.movingDate ? new Date(customer.movingDate).toLocaleDateString('de-DE') : 'Nach Absprache';
  doc.text(movingDate, margin + 35, yPosition);
  yPosition += 10;
  
  if (customer.apartment) {
    doc.text('Wohnungsgröße:', margin, yPosition);
    doc.text(`${customer.apartment.rooms || '?'} Zimmer, ${customer.apartment.area || '?'} m²`, margin + 40, yPosition);
    yPosition += 10;
    
    doc.text('Etage:', margin, yPosition);
    const floorText = `${customer.apartment.floor || '?'}. Stock ${customer.apartment.hasElevator ? '(mit Aufzug)' : '(ohne Aufzug)'}`;
    doc.text(floorText, margin + 25, yPosition);
  }
  yPosition += 25;

  // Preis-Box
  doc.setFillColor(139, 195, 74);
  doc.rect(margin - 5, yPosition - 5, pageWidth - 2 * margin + 10, 35, 'F');
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('GESAMTPREIS', margin, yPosition + 5);
  
  doc.setFontSize(24);
  const priceText = `€ ${quote.price.toFixed(2).replace('.', ',')}`;
  doc.text(priceText, pageWidth - margin, yPosition + 5, { align: 'right' });
  
  doc.setFontSize(12);
  doc.text('(inkl. 19% MwSt.)', pageWidth - margin, yPosition + 20, { align: 'right' });
  yPosition += 50;

  // Anmerkungen
  if (quote.comment && quote.comment.trim()) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('ANMERKUNGEN', margin, yPosition);
    yPosition += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const splitComment = doc.splitTextToSize(quote.comment, pageWidth - 2 * margin);
    doc.text(splitComment, margin, yPosition);
    yPosition += splitComment.length * 5 + 20;
  }

  // Gültigkeit und Kontakt
  yPosition += 15;
  doc.setFontSize(11);
  doc.setTextColor(0);
  const validityText = 'Dieses Angebot ist 14 Tage gültig. Bei Fragen stehen wir Ihnen gerne zur Verfügung.';
  const splitValidity = doc.splitTextToSize(validityText, pageWidth - 2 * margin);
  doc.text(splitValidity, margin, yPosition);
  yPosition += splitValidity.length * 5 + 15;

  doc.text('Mit freundlichen Grüßen', margin, yPosition);
  yPosition += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Ihr RELOCATO® Team Bielefeld', margin, yPosition);

  // Footer
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128);
  const footerY = doc.internal.pageSize.getHeight() - 25;
  doc.text('RELOCATO® Bielefeld • Detmolder Str. 234a • 33605 Bielefeld', pageWidth / 2, footerY, { align: 'center' });
  doc.text('Tel: (0521) 1200551-0 • E-Mail: bielefeld@relocato.de', pageWidth / 2, footerY + 8, { align: 'center' });
  doc.text('Wertvoll Dienstleistungen GmbH | HRB 43574', pageWidth / 2, footerY + 16, { align: 'center' });

  return doc.output('blob');
};