import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Customer, Quote } from '../types';
import { COMPANY_CONFIGS } from '../types/company';

export async function generateRuempelschmiedePDF(customer: Customer, quote: Quote | any): Promise<Blob> {
  const doc = new jsPDF();
  const companyConfig = COMPANY_CONFIGS.ruempelschmiede;
  
  // Farben - Basierend auf dem Logo
  const primaryColor = '#C73E3A';  // Rot aus dem Logo
  const secondaryColor = '#2C4A5F'; // Dunkelblau aus dem Logo
  const lightGray = '#F5F5F5';
  const darkGray = '#666666';
  
  // Maße
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const rightMargin = pageWidth - margin;
  
  // Helper Funktionen
  const addHeader = (pageNum: number) => {
    // Weißer Hintergrund für Header
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Logo würde hier eingefügt werden (links)
    // Platzhalter für Logo-Bereich: 40x30 bei Position (margin, 5)
    
    // Firmenname und Tagline (mittig-rechts vom Logo)
    doc.setTextColor(primaryColor);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('RÜMPEL SCHMIEDE', margin + 50, 18);
    
    doc.setTextColor(secondaryColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Professionelle Entrümpelungen seit 2015', margin + 50, 26);
    
    // Kontaktinfo rechts
    doc.setTextColor(darkGray);
    doc.setFontSize(9);
    doc.text([
      companyConfig.contact.phone,
      companyConfig.contact.email,
      companyConfig.website || 'www.ruempelschmiede.de'
    ], rightMargin - 5, 15, { align: 'right' });
    
    // Trennlinie unter Header
    doc.setDrawColor(primaryColor);
    doc.setLineWidth(1);
    doc.line(margin, 38, rightMargin, 38);
  };
  
  const addFooter = (pageNum: number) => {
    // Position anpassen um Überlagerung zu vermeiden
    const footerY = pageHeight - 25;
    
    // Footer Linie
    doc.setDrawColor(primaryColor);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY, rightMargin, footerY);
    
    // Footer Text
    doc.setFontSize(7);
    doc.setTextColor(darkGray);
    doc.setFont('helvetica', 'normal');
    
    // Adresse links - kompakter
    doc.text(
      `${companyConfig.legalName} | ${companyConfig.address.street}, ${companyConfig.address.zip} ${companyConfig.address.city}`,
      margin, footerY + 5
    );
    doc.text(
      `Geschäftsführer: ${companyConfig.ceo.join(', ')} | ${companyConfig.legal.court} ${companyConfig.legal.hrb}`,
      margin, footerY + 9
    );
    doc.text(
      `USt-IdNr.: ${companyConfig.legal.taxNumber} | ${companyConfig.bank.name} | IBAN: ${companyConfig.bank.iban}`,
      margin, footerY + 13
    );
    
    // Seitenzahl rechts
    doc.setTextColor(primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text(`Seite ${pageNum} von 2`, rightMargin, footerY + 9, { align: 'right' });
  };
  
  // SEITE 1
  addHeader(1);
  
  // Angebotsnummer und Datum Box
  let yPos = 55;
  doc.setFillColor(lightGray);
  doc.roundedRect(margin, yPos, pageWidth - 2*margin, 25, 3, 3, 'F');
  
  doc.setTextColor(secondaryColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('ANGEBOT', margin + 5, yPos + 8);
  doc.text('DATUM', rightMargin - 50, yPos + 8);
  
  doc.setTextColor(51, 51, 51);
  doc.setFontSize(14);
  doc.text(`#${quote.id || 'ENT-' + Date.now()}`, margin + 5, yPos + 18);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(quote.createdAt || new Date()).toLocaleDateString('de-DE'), rightMargin - 50, yPos + 18);
  
  // Kundenadresse
  yPos += 40;
  doc.setTextColor(darkGray);
  doc.setFontSize(9);
  doc.text('Angebot für:', margin, yPos);
  
  yPos += 7;
  doc.setTextColor(51, 51, 51);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(customer.name || 'Kunde', margin, yPos);
  
  doc.setFont('helvetica', 'normal');
  yPos += 6;
  if (customer.company) {
    doc.text(customer.company, margin, yPos);
    yPos += 6;
  }
  doc.text(customer.fromAddress || 'Adresse wird noch mitgeteilt', margin, yPos);
  yPos += 6;
  if (customer.email) {
    doc.text(customer.email, margin, yPos);
    yPos += 6;
  }
  if (customer.phone) {
    doc.text(customer.phone, margin, yPos);
  }
  
  // Anrede
  yPos += 20;
  doc.setTextColor(51, 51, 51);
  doc.setFontSize(11);
  doc.text(`Sehr geehrte${customer.salutation === 'Herr' ? 'r Herr' : customer.salutation === 'Frau' ? ' Frau' : '/r'} ${customer.name || 'Kunde'},`, margin, yPos);
  
  yPos += 10;
  doc.text('vielen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen folgendes Angebot für die', margin, yPos);
  yPos += 6;
  doc.text('professionelle Entrümpelung Ihrer Immobilie:', margin, yPos);
  
  // Leistungsübersicht
  yPos += 20;
  doc.setFillColor(primaryColor);
  doc.rect(margin, yPos, pageWidth - 2*margin, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('LEISTUNGSUMFANG', margin + 5, yPos + 6);
  
  yPos += 15;
  const services = [
    { icon: '✓', text: 'Komplette Entrümpelung aller beauftragten Bereiche' },
    { icon: '✓', text: 'Fachgerechte Entsorgung aller Gegenstände' },
    { icon: '✓', text: 'Mülltrennung und umweltgerechte Entsorgung' },
    { icon: '✓', text: 'Besenreine Übergabe der Räumlichkeiten' },
    { icon: '✓', text: 'Entsorgungsnachweis inklusive' },
    { icon: '✓', text: 'Festpreisgarantie - keine versteckten Kosten' }
  ];
  
  doc.setTextColor(51, 51, 51);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  services.forEach(service => {
    doc.setTextColor(primaryColor);
    doc.text(service.icon, margin + 5, yPos);
    doc.setTextColor(51, 51, 51);
    doc.text(service.text, margin + 15, yPos);
    yPos += 8;
  });
  
  // Objektdetails
  yPos += 10;
  doc.setFillColor(lightGray);
  doc.roundedRect(margin, yPos, pageWidth - 2*margin, 50, 3, 3, 'F');
  
  doc.setTextColor(secondaryColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('OBJEKTDETAILS', margin + 5, yPos + 10);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 51, 51);
  
  const details = [
    { label: 'Objekt:', value: customer.fromAddress || 'Nach Vereinbarung' },
    { label: 'Umfang:', value: `ca. ${quote.volume || 50} m³ zu entsorgendes Material` },
    { label: 'Etage:', value: customer.apartment?.floor ? `${customer.apartment.floor}. Etage${customer.apartment.hasElevator ? ' (mit Aufzug)' : ' (ohne Aufzug)'}` : 'EG' }
  ];
  
  let detailY = yPos + 20;
  details.forEach(detail => {
    doc.setFont('helvetica', 'bold');
    doc.text(detail.label, margin + 5, detailY);
    doc.setFont('helvetica', 'normal');
    doc.text(detail.value, margin + 35, detailY);
    detailY += 8;
  });
  
  // Footer Seite 1
  addFooter(1);
  
  // SEITE 2
  doc.addPage();
  addHeader(2);
  
  // Preisübersicht
  yPos = 50;
  doc.setFillColor(primaryColor);
  doc.rect(margin, yPos, pageWidth - 2*margin, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PREISÜBERSICHT', margin + 5, yPos + 6);
  
  yPos += 20;
  
  // Preistabelle
  const priceData = [
    ['Grundpreis Entrümpelung', `${(quote.price * 0.6).toFixed(2)} €`],
    ['Entsorgungsgebühren', `${(quote.price * 0.25).toFixed(2)} €`],
    ['Arbeitszeit und Personal', `${(quote.price * 0.15).toFixed(2)} €`]
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [['Leistung', 'Preis']],
    body: priceData,
    foot: [['GESAMTPREIS (inkl. 19% MwSt.)', `${quote.price.toFixed(2)} €`]],
    theme: 'plain',
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [44, 74, 95],
      fontSize: 11,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [51, 51, 51]
    },
    footStyles: {
      fillColor: [44, 74, 95],
      textColor: [255, 255, 255],
      fontSize: 12,
      fontStyle: 'bold'
    },
    columnStyles: {
      1: { halign: 'right' }
    },
    margin: { left: margin, right: margin }
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 20;
  
  // Zusätzliche Informationen
  doc.setFillColor(lightGray);
  doc.roundedRect(margin, yPos, pageWidth - 2*margin, 60, 3, 3, 'F');
  
  doc.setTextColor(secondaryColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('WICHTIGE INFORMATIONEN', margin + 5, yPos + 10);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 51, 51);
  
  const infos = [
    '• Alle Preise verstehen sich als Festpreise inkl. 19% MwSt.',
    '• Die Arbeiten werden innerhalb eines Tages durchgeführt',
    '• Wertgegenstände werden auf Wunsch separiert',
    '• Kostenlose Besichtigung vor Ort möglich',
    '• Zahlung nach Leistungserbringung in bar oder per Überweisung'
  ];
  
  let infoY = yPos + 20;
  infos.forEach(info => {
    doc.text(info, margin + 5, infoY);
    infoY += 7;
  });
  
  // Gültigkeit und Anmerkungen
  yPos = infoY + 10;
  if (quote.comment) {
    doc.setTextColor(secondaryColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('ANMERKUNGEN:', margin, yPos);
    
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 51, 51);
    const lines = doc.splitTextToSize(quote.comment, pageWidth - 2*margin);
    doc.text(lines, margin, yPos);
    yPos += lines.length * 5 + 10;
  }
  
  // Abschlusstext
  doc.setTextColor(51, 51, 51);
  doc.setFontSize(10);
  doc.text('Dieses Angebot ist 30 Tage gültig. Für Rückfragen stehen wir Ihnen gerne zur Verfügung.', margin, yPos);
  
  yPos += 15;
  doc.text('Mit freundlichen Grüßen', margin, yPos);
  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Ihr Rümpel Schmiede Team', margin, yPos);
  
  // Call-to-Action Box - nur wenn genug Platz
  if (yPos + 35 < pageHeight - 30) {
    yPos += 20;
    doc.setFillColor(primaryColor);
    doc.roundedRect(margin, yPos, pageWidth - 2*margin, 25, 3, 3, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('JETZT BEAUFTRAGEN:', pageWidth/2, yPos + 10, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`📞 ${companyConfig.contact.phone}`, pageWidth/2, yPos + 18, { align: 'center' });
  }
  
  // Footer Seite 2
  addFooter(2);
  
  // PDF generieren
  const pdfBlob = doc.output('blob');
  return pdfBlob;
}