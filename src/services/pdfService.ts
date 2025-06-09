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
  // Wenn HTML-Content bereitgestellt wird, verwende HTML-zu-PDF Konvertierung
  if (htmlContent) {
    return generatePDFFromHTML(htmlContent);
  }
  
  // Fallback zur ursprünglichen jsPDF-Implementierung
  const doc = new jsPDF();
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = margin;

  doc.setFontSize(24);
  doc.text('UMZUGSANGEBOT', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  doc.setFontSize(10);
  doc.setTextColor(128);
  doc.text(`Angebotsnummer: ${new Date().getTime()}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;
  doc.text(`Datum: ${new Date().toLocaleDateString('de-DE')}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 20;

  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.text('Sehr geehrte/r ' + customer.name + ',', margin, yPosition);
  yPosition += 10;

  doc.setFontSize(11);
  const introText = 'vielen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen folgendes Angebot für Ihren Umzug:';
  const splitIntro = doc.splitTextToSize(introText, pageWidth - 2 * margin);
  doc.text(splitIntro, margin, yPosition);
  yPosition += splitIntro.length * 5 + 15;

  doc.setFillColor(245, 245, 245);
  doc.rect(margin - 5, yPosition - 5, pageWidth - 2 * margin + 10, 60, 'F');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('UMZUGSDETAILS', margin, yPosition);
  yPosition += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  doc.text('Von:', margin, yPosition);
  doc.text(customer.fromAddress, margin + 20, yPosition);
  yPosition += 8;
  
  doc.text('Nach:', margin, yPosition);
  doc.text(customer.toAddress, margin + 20, yPosition);
  yPosition += 8;
  
  doc.text('Umzugsdatum:', margin, yPosition);
  doc.text(new Date(customer.movingDate).toLocaleDateString('de-DE'), margin + 35, yPosition);
  yPosition += 8;
  
  doc.text('Wohnungsgröße:', margin, yPosition);
  doc.text(`${customer.apartment.rooms} Zimmer, ${customer.apartment.area} m²`, margin + 35, yPosition);
  yPosition += 8;
  
  doc.text('Etage:', margin, yPosition);
  doc.text(`${customer.apartment.floor}. Stock ${customer.apartment.hasElevator ? '(mit Aufzug)' : '(ohne Aufzug)'}`, margin + 20, yPosition);
  yPosition += 20;

  doc.setFillColor(230, 240, 250);
  doc.rect(margin - 5, yPosition - 5, pageWidth - 2 * margin + 10, 30, 'F');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('GESAMTPREIS', margin, yPosition);
  yPosition += 10;
  
  doc.setFontSize(20);
  doc.text(`€ ${quote.price.toFixed(2).replace('.', ',')}`, margin, yPosition);
  yPosition += 5;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('(inkl. 19% MwSt.)', margin, yPosition);
  yPosition += 20;

  if (quote.comment) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ANMERKUNGEN', margin, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const splitComment = doc.splitTextToSize(quote.comment, pageWidth - 2 * margin);
    doc.text(splitComment, margin, yPosition);
    yPosition += splitComment.length * 5 + 15;
  }

  yPosition += 10;
  doc.setFontSize(11);
  const closingText = 'Dieses Angebot ist 14 Tage gültig. Bei Fragen stehen wir Ihnen gerne zur Verfügung.';
  const splitClosing = doc.splitTextToSize(closingText, pageWidth - 2 * margin);
  doc.text(splitClosing, margin, yPosition);
  yPosition += splitClosing.length * 5 + 10;

  doc.text('Mit freundlichen Grüßen', margin, yPosition);
  yPosition += 10;
  doc.text('Ihr Umzugsteam', margin, yPosition);

  doc.setFontSize(9);
  doc.setTextColor(128);
  doc.text('Umzugsfirma GmbH • Musterstraße 123 • 12345 Berlin', pageWidth / 2, doc.internal.pageSize.getHeight() - 20, { align: 'center' });
  doc.text('Tel: 030 123456 • Email: info@umzugsfirma.de', pageWidth / 2, doc.internal.pageSize.getHeight() - 15, { align: 'center' });

  return doc.output('blob');
};

// HTML-zu-PDF Konvertierung für das neue Template
const generatePDFFromHTML = async (htmlContent: string): Promise<Blob> => {
  try {
    // Erstelle ein verstecktes iframe für das HTML-Rendering
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '210mm'; // A4 Breite
    iframe.style.height = '297mm'; // A4 Höhe
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      throw new Error('Iframe document nicht verfügbar');
    }
    
    // HTML Content in iframe laden
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();
    
    // Warte auf das Laden der Inhalte
    await new Promise(resolve => {
      iframe.onload = resolve;
      setTimeout(resolve, 1000); // Fallback timeout
    });
    
    // Verwende html2canvas + jsPDF für bessere HTML-Unterstützung
    const { default: html2canvas } = await import('html2canvas');
    
    const canvas = await html2canvas(iframeDoc.body, {
      width: 800,
      height: 1131, // A4 Verhältnis
      scale: 2,
      useCORS: true,
      allowTaint: true
    });
    
    // Cleanup
    document.body.removeChild(iframe);
    
    // Canvas zu PDF konvertieren
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    return pdf.output('blob');
    
  } catch (error) {
    console.warn('HTML-zu-PDF fehlgeschlagen, verwende Fallback:', error);
    
    // Fallback: Einfache PDF ohne HTML-Rendering
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('RELOCATO® Umzugsangebot', 20, 30);
    doc.setFontSize(12);
    doc.text('PDF-Generierung aus HTML fehlgeschlagen.', 20, 50);
    doc.text('Bitte kontaktieren Sie uns für das vollständige Angebot.', 20, 65);
    doc.text('📞 0800 - RELOCATO', 20, 85);
    doc.text('📧 info@relocato.de', 20, 100);
    
    return doc.output('blob');
  }
};