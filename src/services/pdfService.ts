import { jsPDF } from 'jspdf';
import { Customer, Invoice } from '../types';
import pdfSignatureService, { SignatureData } from './pdfSignatureService';
import { generateArbeitsschein } from './arbeitsscheinService';

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
}

export const generatePDF = async (customer: Customer, quote: QuoteData & { volume?: number; distance?: number; calculation?: any; details?: any }, htmlContent?: string): Promise<Blob> => {
  try {
    console.log('🔄 Starte PDF-Generierung...', { customer, quote });
    
    // Validierung
    if (!customer) {
      throw new Error('Kundendaten fehlen');
    }
    if (!quote) {
      throw new Error('Angebotsdaten fehlen');
    }
    
    // Verwende immer die robuste jsPDF-Implementierung
    const doc = new jsPDF();
  
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const rightMargin = pageWidth - margin;
    let yPosition = 20;

    // Header - Relocato Logo mit ®
    doc.setFontSize(28);
    doc.setTextColor(51, 51, 51); // Dunkelgrau wie in Vorlage
    doc.setFont('helvetica', 'bold');
    doc.text('RELOCATO', pageWidth / 2 - 15, yPosition, { align: 'center' });
    doc.setFontSize(12);
    doc.text('®', pageWidth / 2 + 25, yPosition - 5);
    
    // Unterstrich in Grün
    doc.setDrawColor(139, 195, 74); // #8BC34A
    doc.setLineWidth(2);
    doc.line(margin, yPosition + 5, rightMargin, yPosition + 5);
    yPosition += 15;
    
    doc.setFontSize(18);
    doc.setTextColor(139, 195, 74);
    doc.setFont('helvetica', 'bold');
    doc.text('Umzugsangebot', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 12;
    
    // Angebotsnummer und Gültigkeit Box
    doc.setFillColor(245, 245, 245);
    doc.setDrawColor(221, 221, 221);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPosition, rightMargin - margin, 10, 'FD');
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    const angebotNr = new Date().getTime().toString();
    const gueltigBis = new Date();
    gueltigBis.setDate(gueltigBis.getDate() + 14);
    
    doc.text(`Angebot Nr.: ${angebotNr}`, margin + 3, yPosition + 6);
    doc.text(`Gültig bis: ${gueltigBis.toLocaleDateString('de-DE')}`, rightMargin - 3, yPosition + 6, { align: 'right' });
    yPosition += 15;
    
    // Professional Note
    doc.setFillColor(232, 245, 233); // #e8f5e9
    doc.setDrawColor(76, 175, 80); // #4caf50
    doc.setLineWidth(1);
    doc.rect(margin, yPosition, rightMargin - margin, 12, 'FD');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Hinweis:', margin + 3, yPosition + 5);
    doc.setFont('helvetica', 'normal');
    const hinweisText = 'Dieses Angebot wurde gemäß den Vorgaben des Bundesumzugskostengesetzes (BUKG) erstellt. Eine Besichtigung vor Ort kann gerne vereinbart werden.';
    const hinweisLines = doc.splitTextToSize(hinweisText, rightMargin - margin - 20);
    doc.text(hinweisLines[0], margin + 20, yPosition + 5);
    if (hinweisLines.length > 1) {
      doc.text(hinweisLines[1], margin + 3, yPosition + 9);
    }
    yPosition += 15;
    
    // Zwei-Spalten-Layout für Kundendaten und Umzugsdetails
    const columnWidth = (rightMargin - margin - 10) / 2;
    const labelOffset = 30; // Einheitlicher Abstand für Labels
    const lineHeight = 6; // Einheitlicher Zeilenabstand
    
    // Kundendaten (linke Spalte)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 195, 74); // #8BC34A
    doc.text('Kundendaten', margin, yPosition);
    
    doc.setFontSize(9);
    doc.setTextColor(85, 85, 85); // #555
    let leftY = yPosition + 8;
    
    // Name
    doc.setFont('helvetica', 'bold');
    doc.text('Name:', margin, leftY);
    doc.setFont('helvetica', 'normal');
    doc.text(customer.name || 'N/A', margin + labelOffset, leftY);
    leftY += lineHeight;
    
    // Telefon - mit +49 Formatierung
    doc.setFont('helvetica', 'bold');
    doc.text('Telefon:', margin, leftY);
    doc.setFont('helvetica', 'normal');
    let phoneNumber = customer.phone || 'N/A';
    // Formatiere Telefonnummer mit +49
    if (phoneNumber !== 'N/A' && !phoneNumber.startsWith('+')) {
      // Entferne führende 0 und füge +49 hinzu
      phoneNumber = phoneNumber.replace(/^0+/, '');
      phoneNumber = '+49 ' + phoneNumber;
    }
    doc.text(phoneNumber, margin + labelOffset, leftY);
    leftY += lineHeight;
    
    // E-Mail
    doc.setFont('helvetica', 'bold');
    doc.text('E-Mail:', margin, leftY);
    doc.setFont('helvetica', 'normal');
    const email = customer.email || 'N/A';
    // E-Mail auf mehrere Zeilen aufteilen wenn zu lang
    if (email.length > 25) {
      const emailLines = doc.splitTextToSize(email, columnWidth - labelOffset - 5);
      doc.text(emailLines, margin + labelOffset, leftY);
      leftY += (emailLines.length - 1) * 4;
    } else {
      doc.text(email, margin + labelOffset, leftY);
    }
    leftY += lineHeight;
    
    // Umzugstermin
    doc.setFont('helvetica', 'bold');
    doc.text('Termin:', margin, leftY);
    doc.setFont('helvetica', 'normal');
    let termin = 'Nach Absprache';
    if (customer.movingDate) {
      try {
        const date = new Date(customer.movingDate);
        // Prüfe ob das Datum gültig ist
        if (!isNaN(date.getTime())) {
          termin = date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        }
      } catch (e) {
        // Bei Fehler bleibt es bei "Nach Absprache"
      }
    }
    doc.text(termin, margin + labelOffset, leftY);
    
    // Umzugsdetails (rechte Spalte)
    const rightX = margin + columnWidth + 10;
    const rightLabelOffset = 20; // Kürzerer Offset für rechte Spalte
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 195, 74); // #8BC34A
    doc.text('Umzugsdetails', rightX, yPosition);
    
    doc.setFontSize(9);
    doc.setTextColor(85, 85, 85);
    let rightY = yPosition + 8;
    
    // Von
    doc.setFont('helvetica', 'bold');
    doc.text('Von:', rightX, rightY);
    doc.setFont('helvetica', 'normal');
    const fromAddr = customer.fromAddress || 'Wird noch mitgeteilt';
    const fromLines = doc.splitTextToSize(fromAddr, columnWidth - rightLabelOffset - 5);
    doc.text(fromLines, rightX + rightLabelOffset, rightY);
    rightY += Math.max(fromLines.length * 4, lineHeight);
    
    // Nach
    doc.setFont('helvetica', 'bold');
    doc.text('Nach:', rightX, rightY);
    doc.setFont('helvetica', 'normal');
    const toAddr = customer.toAddress || 'Wird noch mitgeteilt';
    const toLines = doc.splitTextToSize(toAddr, columnWidth - rightLabelOffset - 5);
    doc.text(toLines, rightX + rightLabelOffset, rightY);
    rightY += Math.max(toLines.length * 4, lineHeight);
    
    // Wohnungsgröße wenn vorhanden
    if (customer.apartment) {
      doc.setFont('helvetica', 'bold');
      doc.text('Wohnung:', rightX, rightY);
      doc.setFont('helvetica', 'normal');
      doc.text(`${customer.apartment.rooms || '?'} Zi., ${customer.apartment.area || '?'} m²`, rightX + rightLabelOffset, rightY);
      rightY += lineHeight;
    }
    
    yPosition = Math.max(leftY, rightY) + 10;
    
    // Leistungsumfang
    doc.setFillColor(224, 224, 224); // #e0e0e0
    doc.setDrawColor(153, 153, 153); // #999
    doc.setLineWidth(1);
    doc.rect(margin, yPosition, rightMargin - margin, 8, 'FD');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Leistungsumfang - Premium-Service', margin + 3, yPosition + 5.5);
    yPosition += 12;
    
    // Service Box
    const includedServices = [];
    
    // Basis Be- und Entladen
    includedServices.push(`• Be- und Entladen (${quote.volume || 50} m³ Umzugsvolumen)`);
    
    // Etagen-Zuschlag
    if (quote.calculation?.floorSurcharge && quote.calculation.floorSurcharge > 0) {
      includedServices.push('• Etagen-Zuschlag berücksichtigt');
    }
    
    // Entfernungs-Zuschlag
    if (quote.calculation?.distanceSurcharge && quote.calculation.distanceSurcharge > 0) {
      includedServices.push(`• Transportstrecke: ${quote.distance || 25} km`);
    }
    
    // Verpackungsservice
    if (quote.details?.packingRequested && quote.calculation?.packingService > 0) {
      includedServices.push('• Professioneller Verpackungsservice');
    }
    
    // Umzugskartons
    if (quote.details?.boxCount && quote.details.boxCount > 0) {
      includedServices.push(`• ${quote.details.boxCount} Umzugskartons (Leihweise)`);
    }
    
    // Möbelmontage/-demontage
    if (quote.details?.furnitureAssemblyPrice && quote.details.furnitureAssemblyPrice > 0) {
      includedServices.push('• Möbelmontage am Zielort');
    }
    
    if (quote.details?.furnitureDisassemblyPrice && quote.details.furnitureDisassemblyPrice > 0) {
      includedServices.push('• Möbeldemontage am Ausgangsort');
    }
    
    // Reinigungsservice
    if (quote.details?.cleaningService && quote.details.cleaningHours > 0) {
      includedServices.push(`• Endreinigung (${quote.details.cleaningHours} Stunden)`);
    }
    
    // Entrümpelung
    if (quote.details?.clearanceService && quote.details.clearanceVolume > 0) {
      includedServices.push(`• Entrümpelung (${quote.details.clearanceVolume} m³)`);
    }
    
    // Renovierung
    if (quote.details?.renovationService && quote.details.renovationHours > 0) {
      includedServices.push(`• Renovierungsarbeiten (${quote.details.renovationHours} Stunden)`);
    }
    
    // Klaviertransport
    if (quote.details?.pianoTransport) {
      includedServices.push('• Spezialtransport für Klavier/Flügel');
    }
    
    // Schwere Gegenstände
    if (quote.details?.heavyItemsCount && quote.details.heavyItemsCount > 0) {
      includedServices.push(`• Transport von ${quote.details.heavyItemsCount} schweren Gegenständen`);
    }
    
    // Parkzone
    if (quote.details?.parkingZonePrice && quote.details.parkingZonePrice > 0) {
      includedServices.push('• Parkzonengenehmigung');
    }
    
    // Lagerung
    if (quote.details?.storagePrice && quote.details.storagePrice > 0) {
      includedServices.push('• Zwischenlagerung');
    }
    
    // Verpackungsmaterial
    if (quote.details?.packingMaterials) {
      includedServices.push('• Hochwertiges Verpackungsmaterial');
    }
    
    // Immer enthalten
    includedServices.push('• Transport mit modernem Umzugs-LKW');
    includedServices.push('• Grundhaftung nach §451g HGB');
    
    doc.setFillColor(249, 249, 249);
    doc.setDrawColor(221, 221, 221);
    doc.setLineWidth(0.5);
    const serviceBoxHeight = Math.min(45, 8 + includedServices.length * 4.5); // Dynamische Höhe basierend auf Anzahl der Leistungen
    doc.rect(margin, yPosition, rightMargin - margin, serviceBoxHeight, 'FD');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Folgende Leistungen sind im Festpreis enthalten:', margin + 3, yPosition + 5);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    // Leistungen ausgeben (kompakter mit Bullets)
    let serviceY = yPosition;
    const maxServicesPerColumn = 8;
    const servicesInBox = includedServices.slice(0, maxServicesPerColumn * 2);
    
    servicesInBox.forEach((service, index) => {
      if (index < maxServicesPerColumn) {
        doc.text(service, margin + 5, serviceY);
        serviceY += 4.5;
      } else {
        // Zweite Spalte
        const secondColumnY = yPosition + (index - maxServicesPerColumn) * 4.5;
        doc.text(service, margin + columnWidth + 5, secondColumnY);
      }
    });
    
    yPosition += serviceBoxHeight - 5;
    
    // Kostenübersicht
    doc.setFillColor(224, 224, 224);
    doc.setDrawColor(153, 153, 153);
    doc.setLineWidth(1);
    doc.rect(margin, yPosition, rightMargin - margin, 8, 'FD');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Kostenübersicht', margin + 3, yPosition + 5.5);
    yPosition += 12;
    
    // Preis-Tabelle
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(221, 221, 221);
    doc.setLineWidth(0.5);
    
    // Tabelle mit Rahmen
    const tableHeight = 24;
    doc.rect(margin, yPosition, rightMargin - margin, tableHeight, 'D');
    
    const nettoPreis = quote.price / 1.19;
    const mwst = quote.price - nettoPreis;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Premium-Komplettpaket netto', margin + 3, yPosition + 5);
    doc.text(nettoPreis.toFixed(2).replace('.', ',') + ' €', rightMargin - 5, yPosition + 5, { align: 'right' });
    
    // Trennlinie
    doc.setDrawColor(238, 238, 238);
    doc.line(margin, yPosition + 8, rightMargin, yPosition + 8);
    
    doc.text('MwSt. 19,00 %', margin + 3, yPosition + 13);
    doc.text(mwst.toFixed(2).replace('.', ',') + ' €', rightMargin - 5, yPosition + 13, { align: 'right' });
    
    // Dicke Linie vor Gesamtsumme
    doc.setDrawColor(51, 51, 51);
    doc.setLineWidth(2);
    doc.line(margin, yPosition + 16, rightMargin, yPosition + 16);
    
    // Gesamtsumme hervorgehoben
    doc.setFillColor(249, 249, 249);
    doc.rect(margin, yPosition + 16, rightMargin - margin, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Gesamtsumme Festpreis inkl. MwSt.', margin + 3, yPosition + 21);
    doc.text(quote.price.toFixed(2).replace('.', ',') + ' €', rightMargin - 5, yPosition + 21, { align: 'right' });
    yPosition += tableHeight + 5;
    
    // Bemerkungen (wenn vorhanden) - kompakter
    if (quote.comment && quote.comment.trim()) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('Anmerkungen:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      const splitComment = doc.splitTextToSize(quote.comment, rightMargin - margin - 30);
      if (splitComment.length > 0) {
        doc.text(splitComment[0], margin + 30, yPosition);
      }
      yPosition += 5;
    }
    
    // Versicherungsschutz Box
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(221, 221, 221);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPosition, rightMargin - margin, 20, 'FD');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Versicherungsschutz:', margin + 3, yPosition + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Grundhaftung: Gesetzliche Haftung nach §451g HGB (620€/m³)', margin + 3, yPosition + 10);
    doc.setFont('helvetica', 'bold');
    doc.text('Transportversicherung optional:', margin + 3, yPosition + 14);
    doc.setFont('helvetica', 'normal');
    doc.text('Zum Neuwert oder Zeitwert', margin + 65, yPosition + 14);
    doc.text('Prämie: 4,60‰ (Neuwert) oder 3,60‰ (Zeitwert) + 19% Versicherungssteuer', margin + 3, yPosition + 18);
    yPosition += 25;
    
    // Zahlungsbedingungen
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Zahlungsbedingungen:', margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text('Gemäß BUKG-Vorgaben', margin + 40, yPosition);
    doc.setFont('helvetica', 'bold');
    doc.text('Besichtigung:', margin + 100, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text('Gerne vereinbaren wir einen Termin vor Ort', margin + 125, yPosition);
    yPosition += 8;
    
    // Unterschriftsbox
    const boxHeight = 35;
    doc.setDrawColor(153, 153, 153);
    doc.setLineWidth(1);
    doc.rect(margin, yPosition, rightMargin - margin, boxHeight, 'D');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const unterschriftText = 'Mit meiner Unterschrift beauftrage ich RELOCATO® Bielefeld mit der Durchführung des Umzugs zu den genannten Konditionen. Dieses Angebot entspricht den Anforderungen des BUKG.';
    const unterschriftLines = doc.splitTextToSize(unterschriftText, rightMargin - margin - 6);
    doc.text(unterschriftLines, margin + 3, yPosition + 5);
    
    // Unterschriftslinien
    const lineY = yPosition + boxHeight - 8;
    const lineLength = (rightMargin - margin - 30) / 2;
    
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(margin + 15, lineY, margin + 15 + lineLength, lineY);
    doc.line(rightMargin - 15 - lineLength, lineY, rightMargin - 15, lineY);
    
    doc.setFontSize(8);
    doc.setTextColor(102, 102, 102);
    doc.text('Ort, Datum', margin + 15 + lineLength/2, lineY + 4, { align: 'center' });
    doc.text('Unterschrift Auftraggeber', rightMargin - 15 - lineLength/2, lineY + 4, { align: 'center' });
    
    // Footer
    const footerY = pageHeight - 20;
    doc.setDrawColor(221, 221, 221);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 5, rightMargin, footerY - 5);
    
    doc.setFontSize(8);
    doc.setTextColor(102, 102, 102);
    doc.setFont('helvetica', 'normal');
    doc.text('RELOCATO® Bielefeld | Detmolder Str. 234a, 33605 Bielefeld | Tel: (0521) 1200551-0', pageWidth / 2, footerY, { align: 'center' });
    doc.text('E-Mail: bielefeld@relocato.de | Web: www.relocato.de', pageWidth / 2, footerY + 4, { align: 'center' });

    console.log('✅ PDF erfolgreich generiert');
    return doc.output('blob');
  } catch (error) {
    console.error('❌ Fehler bei PDF-Generierung:', error);
    
    // Fallback: Erstelle ein minimales PDF
    try {
      console.log('🔄 Versuche Fallback PDF...');
      const fallbackDoc = new jsPDF();
      
      fallbackDoc.setFontSize(20);
      fallbackDoc.text('Relocato Umzugsangebot', 20, 30);
      
      fallbackDoc.setFontSize(12);
      fallbackDoc.text(`Kunde: ${customer.name || 'Unbekannt'}`, 20, 50);
      fallbackDoc.text(`Preis: € ${quote.price.toFixed(2)}`, 20, 60);
      fallbackDoc.text(`Datum: ${new Date().toLocaleDateString('de-DE')}`, 20, 70);
      
      if (quote.comment) {
        fallbackDoc.text('Anmerkungen:', 20, 90);
        const splitComment = fallbackDoc.splitTextToSize(quote.comment, 170);
        fallbackDoc.text(splitComment, 20, 100);
      }
      
      console.log('✅ Fallback PDF erstellt');
      return fallbackDoc.output('blob');
    } catch (fallbackError) {
      console.error('❌ Auch Fallback PDF fehlgeschlagen:', fallbackError);
      throw new Error('PDF-Erstellung fehlgeschlagen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  }
};

export const generateInvoicePDF = async (customer: Customer, invoice: Invoice): Promise<Blob> => {
  try {
    console.log('🔄 Starte Rechnungs-PDF-Generierung...', { customer, invoice });
    
    const doc = new jsPDF();
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const rightMargin = pageWidth - margin;
    let yPosition = 20;

    // Header - Relocato Logo mit ®
    doc.setFontSize(28);
    doc.setTextColor(51, 51, 51); // Dunkelgrau
    doc.setFont('helvetica', 'bold');
    doc.text('RELOCATO', pageWidth / 2 - 15, yPosition, { align: 'center' });
    doc.setFontSize(12);
    doc.text('®', pageWidth / 2 + 25, yPosition - 5);
    
    // Unterstrich in Grün
    doc.setDrawColor(139, 195, 74); // #8BC34A
    doc.setLineWidth(2);
    doc.line(margin, yPosition + 5, rightMargin, yPosition + 5);
    yPosition += 15;
    
    doc.setFontSize(18);
    doc.setTextColor(139, 195, 74);
    doc.setFont('helvetica', 'bold');
    doc.text('RECHNUNG', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;
    
    // Rechnungsinformationen Box
    doc.setFillColor(245, 245, 245);
    doc.setDrawColor(221, 221, 221);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPosition, rightMargin - margin, 20, 'FD');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(85, 85, 85);
    doc.text('Rechnungsnummer:', margin + 5, yPosition + 6);
    doc.text('Rechnungsdatum:', margin + 5, yPosition + 12);
    doc.text('Leistungsdatum:', margin + 5, yPosition + 16);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    doc.text(invoice.invoiceNumber, margin + 40, yPosition + 6);
    doc.text(new Date(invoice.createdAt).toLocaleDateString('de-DE'), margin + 40, yPosition + 12);
    doc.text(new Date(invoice.createdAt).toLocaleDateString('de-DE'), margin + 40, yPosition + 16);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(85, 85, 85);
    doc.text('Zahlungsziel:', rightMargin - 80, yPosition + 6);
    doc.text('Kundennummer:', rightMargin - 80, yPosition + 12);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    doc.text(new Date(invoice.dueDate).toLocaleDateString('de-DE'), rightMargin - 35, yPosition + 6);
    doc.text(customer.id, rightMargin - 35, yPosition + 12);
    
    yPosition += 25;
    
    // Absender
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text('Relocato | Albrechtstraße 27, 33615 Bielefeld', margin, yPosition);
    yPosition += 8;
    
    // Empfänger
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');
    doc.text(customer.name, margin, yPosition);
    yPosition += 5;
    
    // Adresse des Kunden
    if (customer.toAddress) {
      const addressLines = doc.splitTextToSize(customer.toAddress, 80);
      doc.text(addressLines, margin, yPosition);
      yPosition += addressLines.length * 5 + 3;
    }
    
    // E-Mail wenn vorhanden
    if (customer.email) {
      doc.text(customer.email, margin, yPosition);
      yPosition += 10;
    } else {
      yPosition += 5;
    }
    
    // Betreff
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Rechnung für Umzugsdienstleistung`, margin, yPosition);
    yPosition += 10;
    
    // Anrede
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Sehr geehrte/r ${customer.name},`, margin, yPosition);
    yPosition += 6;
    doc.text('vielen Dank für Ihren Auftrag. Wir berechnen Ihnen folgende Leistungen:', margin, yPosition);
    yPosition += 10;
    
    // Leistungstabelle
    // Tabellenkopf
    doc.setFillColor(240, 240, 240);
    doc.setDrawColor(221, 221, 221);
    doc.rect(margin, yPosition, rightMargin - margin, 8, 'FD');
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Pos.', margin + 3, yPosition + 5.5);
    doc.text('Beschreibung', margin + 15, yPosition + 5.5);
    doc.text('Menge', rightMargin - 60, yPosition + 5.5, { align: 'right' });
    doc.text('Einzelpreis', rightMargin - 35, yPosition + 5.5, { align: 'right' });
    doc.text('Gesamt', rightMargin - 5, yPosition + 5.5, { align: 'right' });
    yPosition += 10;
    
    // Tabelleninhalt
    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');
    
    let pos = 1;
    doc.setDrawColor(238, 238, 238);
    (invoice.items || []).forEach((item, index) => {
      doc.text(pos.toString(), margin + 3, yPosition + 3);
      
      // Beschreibung auf mehrere Zeilen aufteilen wenn nötig
      const descLines = doc.splitTextToSize(item.description, 90);
      doc.text(descLines[0], margin + 15, yPosition + 3);
      
      doc.text(item.quantity.toString(), rightMargin - 60, yPosition + 3, { align: 'right' });
      doc.text((item.unitPrice || 0).toFixed(2).replace('.', ',') + ' €', rightMargin - 35, yPosition + 3, { align: 'right' });
      doc.text((item.totalPrice || 0).toFixed(2).replace('.', ',') + ' €', rightMargin - 5, yPosition + 3, { align: 'right' });
      
      // Trennlinie nach jeder Zeile
      if (index < (invoice.items || []).length - 1) {
        doc.line(margin, yPosition + 6, rightMargin, yPosition + 6);
      }
      
      yPosition += 8;
      pos++;
    });
    
    yPosition += 5;
    
    // Summenbereich
    yPosition += 3;
    const sumX = rightMargin - 70;
    
    // Box für Summen
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(221, 221, 221);
    doc.setLineWidth(0.5);
    doc.rect(sumX - 10, yPosition - 3, 80, 28, 'D');
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Zwischensumme:', sumX, yPosition + 2);
    doc.text((invoice.price || 0).toFixed(2).replace('.', ',') + ' €', rightMargin - 5, yPosition + 2, { align: 'right' });
    
    // Trennlinie
    doc.setDrawColor(238, 238, 238);
    doc.line(sumX - 5, yPosition + 5, rightMargin - 5, yPosition + 5);
    
    doc.text('MwSt. 19,00 %:', sumX, yPosition + 10);
    doc.text((invoice.taxAmount || 0).toFixed(2).replace('.', ',') + ' €', rightMargin - 5, yPosition + 10, { align: 'right' });
    
    // Dicke Linie vor Gesamtbetrag
    doc.setDrawColor(51, 51, 51);
    doc.setLineWidth(2);
    doc.line(sumX - 5, yPosition + 13, rightMargin - 5, yPosition + 13);
    
    // Gesamtbetrag hervorgehoben
    doc.setFillColor(249, 249, 249);
    doc.rect(sumX - 5, yPosition + 13, 70, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Gesamtbetrag:', sumX, yPosition + 20);
    doc.text(invoice.totalPrice.toFixed(2).replace('.', ',') + ' €', rightMargin - 5, yPosition + 20, { align: 'right' });
    yPosition += 35;
    
    // Zahlungsinformationen
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Zahlungsinformationen:', margin, yPosition);
    yPosition += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const zahlungshinweis = `Bitte überweisen Sie den Gesamtbetrag von € ${invoice.totalPrice.toFixed(2)} bis zum ${new Date(invoice.dueDate).toLocaleDateString('de-DE')} auf folgendes Konto:`;
    const zahlungsLines = doc.splitTextToSize(zahlungshinweis, rightMargin - margin);
    doc.text(zahlungsLines, margin, yPosition);
    yPosition += zahlungsLines.length * 4 + 5;
    
    // Bankverbindung
    doc.setFillColor(245, 245, 245);
    doc.setDrawColor(221, 221, 221);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPosition, rightMargin - margin, 32, 'FD');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(85, 85, 85);
    let bankY = yPosition + 6;
    doc.text('Kontoinhaber:', margin + 5, bankY);
    doc.text('Bank:', margin + 5, bankY + 6);
    doc.text('IBAN:', margin + 5, bankY + 12);
    doc.text('BIC:', margin + 5, bankY + 18);
    doc.text('Verwendungszweck:', margin + 5, bankY + 24);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    doc.text('Wertvoll Dienstleistungen GmbH', margin + 45, bankY);
    doc.text('Commerzbank', margin + 45, bankY + 6);
    doc.text('DE89 3704 0044 0532 0130 00', margin + 45, bankY + 12);
    doc.text('COBADEFFXXX', margin + 45, bankY + 18);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.invoiceNumber, margin + 45, bankY + 24);
    
    yPosition += 37;
    
    // Hinweise
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('Vielen Dank für Ihr Vertrauen. Bei Fragen zu dieser Rechnung kontaktieren Sie uns gerne.', margin, yPosition);
    yPosition += 4;
    doc.text('Diese Rechnung wurde maschinell erstellt und ist ohne Unterschrift gültig.', margin, yPosition);
    
    // Footer
    const footerY = pageHeight - 20;
    doc.setDrawColor(221, 221, 221);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 5, rightMargin, footerY - 5);
    
    doc.setFontSize(8);
    doc.setTextColor(102, 102, 102);
    doc.setFont('helvetica', 'normal');
    doc.text('RELOCATO® Bielefeld | Detmolder Str. 234a, 33605 Bielefeld | Tel: (0521) 1200551-0', pageWidth / 2, footerY, { align: 'center' });
    doc.text('E-Mail: bielefeld@relocato.de | Web: www.relocato.de | Wertvoll Dienstleistungen GmbH | HRB 43574', pageWidth / 2, footerY + 4, { align: 'center' });
    doc.text('Geschäftsführer: Sergej Schulz | USt-IdNr.: DE815143866 | Amtsgericht Bielefeld', pageWidth / 2, footerY + 8, { align: 'center' });
    
    console.log('✅ Rechnungs-PDF erfolgreich generiert');
    return doc.output('blob');
    
  } catch (error) {
    console.error('❌ Fehler bei Rechnungs-PDF-Generierung:', error);
    
    // Fallback PDF
    try {
      const fallbackDoc = new jsPDF();
      
      fallbackDoc.setFontSize(20);
      fallbackDoc.text('Relocato Rechnung', 20, 30);
      
      fallbackDoc.setFontSize(12);
      fallbackDoc.text(`Rechnungsnummer: ${invoice.invoiceNumber}`, 20, 50);
      fallbackDoc.text(`Kunde: ${customer.name}`, 20, 60);
      fallbackDoc.text(`Betrag: € ${invoice.totalPrice.toFixed(2)}`, 20, 70);
      fallbackDoc.text(`Datum: ${new Date(invoice.createdAt).toLocaleDateString('de-DE')}`, 20, 80);
      
      return fallbackDoc.output('blob');
    } catch (fallbackError) {
      throw new Error('Rechnungs-PDF-Erstellung fehlgeschlagen');
    }
  }
};

/**
 * Generiert ein PDF mit digitaler Unterschrift
 */
export const generatePDFWithSignature = async (
  customer: Customer, 
  quote: QuoteData & { volume?: number; distance?: number; calculation?: any; details?: any },
  signatureData?: SignatureData,
  htmlContent?: string
): Promise<Blob> => {
  try {
    // Generiere das Basis-PDF
    const pdfBlob = await generatePDF(customer, quote, htmlContent);
    
    // Wenn keine Unterschrift vorhanden ist, gib das normale PDF zurück
    if (!signatureData) {
      return pdfBlob;
    }
    
    // Konvertiere Blob zu ArrayBuffer
    const arrayBuffer = await pdfBlob.arrayBuffer();
    
    // Füge digitale Unterschrift hinzu
    const signedPdfBuffer = await pdfSignatureService.embedSignature(
      arrayBuffer,
      signatureData,
      0 // Index für Auftraggeber-Unterschrift
    );
    
    // Konvertiere zurück zu Blob
    return new Blob([signedPdfBuffer], { type: 'application/pdf' });
  } catch (error) {
    console.error('Fehler beim Hinzufügen der digitalen Unterschrift:', error);
    // Fallback auf normales PDF
    return generatePDF(customer, quote, htmlContent);
  }
};

/**
 * Generiert ein Arbeitsschein-PDF mit digitalen Unterschriften
 */
export const generateArbeitsscheinWithSignatures = async (
  disposition: any,
  customerSignature?: SignatureData,
  employeeSignature?: SignatureData
): Promise<Blob> => {
  try {
    // Generiere das Basis-Arbeitsschein PDF
    const pdfBlob = await generateArbeitsschein(disposition);
    
    // Wenn keine Unterschriften vorhanden sind, gib das normale PDF zurück
    if (!customerSignature && !employeeSignature) {
      return pdfBlob;
    }
    
    // Konvertiere Blob zu ArrayBuffer
    let arrayBuffer = await pdfBlob.arrayBuffer();
    
    // Füge Unterschriften hinzu
    const signatures: { data: SignatureData; fieldIndex: number }[] = [];
    
    if (customerSignature) {
      signatures.push({ data: customerSignature, fieldIndex: 0 });
    }
    
    if (employeeSignature) {
      signatures.push({ data: employeeSignature, fieldIndex: 1 });
    }
    
    // Füge alle Unterschriften hinzu
    const signedPdfBuffer = await pdfSignatureService.embedMultipleSignatures(
      arrayBuffer,
      signatures
    );
    
    // Konvertiere zurück zu Blob
    return new Blob([signedPdfBuffer], { type: 'application/pdf' });
  } catch (error) {
    console.error('Fehler beim Hinzufügen der digitalen Unterschriften:', error);
    // Fallback auf normales PDF
    return generateArbeitsschein(disposition);
  }
};