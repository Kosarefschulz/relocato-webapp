import { jsPDF } from 'jspdf';
import { Customer, Invoice } from '../types';

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

    // Header - Relocato Logo
    doc.setFontSize(26);
    doc.setTextColor(74, 189, 189); // Türkis wie im Logo
    doc.setFont('helvetica', 'bold');
    doc.text('Relocato', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 9;
    
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');
    doc.text('Umzugsangebot', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 12;
    
    // Angebotsnummer und Gültigkeit
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    const angebotNr = new Date().getTime().toString();
    const gueltigBis = new Date();
    gueltigBis.setDate(gueltigBis.getDate() + 14);
    
    doc.text(`Angebot Nr.: ${angebotNr}`, margin, yPosition);
    doc.text(`Gültig bis: ${gueltigBis.toLocaleDateString('de-DE')}`, rightMargin, yPosition, { align: 'right' });
    yPosition += 8;
    
    // Hinweis-Box (kompakter)
    doc.setFillColor(232, 245, 232); // #e8f5e8
    doc.setDrawColor(124, 204, 66);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPosition, rightMargin - margin, 15, 'FD');
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Hinweis:', margin + 3, yPosition + 4);
    doc.setFont('helvetica', 'normal');
    const hinweisText = 'Dieses Angebot wurde gemäß den Vorgaben des Bundesumzugskostengesetzes (BUKG) erstellt.';
    doc.text(hinweisText, margin + 3, yPosition + 8);
    const volumeText = `Umzugsvolumen: ${quote.volume || 50} m³ | Entfernung: ${quote.distance || 25} km`;
    doc.text(volumeText, margin + 3, yPosition + 12);
    yPosition += 18;
    
    // Zwei-Spalten-Layout für Kundendaten und Umzugsdetails
    const columnWidth = (rightMargin - margin - 10) / 2;
    const labelOffset = 30; // Einheitlicher Abstand für Labels
    const lineHeight = 6; // Einheitlicher Zeilenabstand
    
    // Kundendaten (linke Spalte)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(124, 204, 66);
    doc.text('Kundendaten', margin, yPosition);
    
    doc.setFontSize(9);
    doc.setTextColor(0);
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
    doc.setTextColor(124, 204, 66);
    doc.text('Umzugsdetails', rightX, yPosition);
    
    doc.setFontSize(9);
    doc.setTextColor(0);
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
    
    // Leistungsumfang (kompakter)
    doc.setFillColor(224, 224, 224);
    doc.rect(margin, yPosition, rightMargin - margin, 7, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Leistungsumfang', margin + 3, yPosition + 5);
    yPosition += 10;
    
    // In der Kalkulation berücksichtigte Leistungen
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Folgende Leistungen sind im Preis enthalten:', margin, yPosition);
    yPosition += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
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
    
    // Leistungen ausgeben
    includedServices.forEach(service => {
      doc.text(service, margin + 3, yPosition);
      yPosition += 4;
    });
    
    yPosition += 6;
    
    // Kostenübersicht
    doc.setFillColor(224, 224, 224);
    doc.rect(margin, yPosition, rightMargin - margin, 7, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Kostenübersicht', margin + 3, yPosition + 5);
    yPosition += 10;
    
    // Netto/Brutto Berechnung
    const nettoPreis = quote.price / 1.19;
    const mwst = quote.price - nettoPreis;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Komplettpaket netto', margin + 3, yPosition);
    doc.text(nettoPreis.toFixed(2).replace('.', ',') + ' €', rightMargin - 5, yPosition, { align: 'right' });
    yPosition += 4;
    
    doc.text('MwSt. 19,00 %', margin + 3, yPosition);
    doc.text(mwst.toFixed(2).replace('.', ',') + ' €', rightMargin - 5, yPosition, { align: 'right' });
    yPosition += 5;
    
    // Linie vor Gesamtsumme
    doc.setDrawColor(200);
    doc.line(margin, yPosition, rightMargin, yPosition);
    yPosition += 3;
    
    // Gesamtsumme
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition - 2, rightMargin - margin, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Gesamtpreis inkl. MwSt.', margin + 3, yPosition + 3);
    doc.text(quote.price.toFixed(2).replace('.', ',') + ' €', rightMargin - 5, yPosition + 3, { align: 'right' });
    yPosition += 12;
    
    // Bemerkungen (wenn vorhanden)
    if (quote.comment && quote.comment.trim()) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Anmerkungen:', margin, yPosition);
      yPosition += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const splitComment = doc.splitTextToSize(quote.comment, rightMargin - margin);
      doc.text(splitComment.slice(0, 2), margin, yPosition);
      yPosition += splitComment.slice(0, 2).length * 3.5 + 4;
    }
    
    // Versicherung & Zahlungsbedingungen (kompakt)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Versicherung: Grundhaftung nach §451g HGB (620€/m³) | Optional: Transportversicherung', margin, yPosition);
    yPosition += 4;
    doc.text('Zahlungsbedingungen: Gemäß BUKG-Vorgaben | Gültigkeit: 14 Tage', margin, yPosition);
    yPosition += 6;
    
    // Unterschriftsbox (kompakter)
    const boxHeight = 28;
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPosition, rightMargin - margin, boxHeight);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const unterschriftText = 'Mit meiner Unterschrift beauftrage ich Relocato mit der Durchführung des Umzugs zu den genannten Konditionen.';
    doc.text(unterschriftText, margin + 3, yPosition + 5);
    
    // Unterschriftslinien
    const lineY = yPosition + boxHeight - 6;
    const lineLength = (rightMargin - margin - 20) / 2;
    
    doc.line(margin + 10, lineY, margin + 10 + lineLength, lineY);
    doc.line(rightMargin - 10 - lineLength, lineY, rightMargin - 10, lineY);
    
    doc.setFontSize(7);
    doc.text('Ort, Datum', margin + 10 + lineLength/2, lineY + 3, { align: 'center' });
    doc.text('Unterschrift Auftraggeber', rightMargin - 10 - lineLength/2, lineY + 3, { align: 'center' });
    
    // Footer (mit mehr Abstand)
    const footerY = pageHeight - 25;
    doc.setDrawColor(128);
    doc.line(margin, footerY - 8, rightMargin, footerY - 8);
    
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.setFont('helvetica', 'normal');
    // Korrigierte Adresse
    doc.text('Relocato | Albrechtstraße 27, 33615 Bielefeld | Tel: (0521) 1200551-0', pageWidth / 2, footerY - 3, { align: 'center' });
    doc.text('E-Mail: bielefeld@relocato.de | Web: www.relocato.de | Wertvoll Dienstleistungen GmbH | HRB 43574', pageWidth / 2, footerY + 1, { align: 'center' });

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

    // Header - Relocato Logo
    doc.setFontSize(26);
    doc.setTextColor(74, 189, 189); // Türkis wie im Logo
    doc.setFont('helvetica', 'bold');
    doc.text('Relocato', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 9;
    
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text('RECHNUNG', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;
    
    // Rechnungsinformationen
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Rechnungsnummer und Datum Box
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition, rightMargin - margin, 20, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.text('Rechnungsnummer:', margin + 5, yPosition + 6);
    doc.text('Rechnungsdatum:', margin + 5, yPosition + 12);
    doc.text('Leistungsdatum:', margin + 5, yPosition + 18);
    
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.invoiceNumber, margin + 45, yPosition + 6);
    doc.text(new Date(invoice.createdAt).toLocaleDateString('de-DE'), margin + 45, yPosition + 12);
    doc.text(new Date(invoice.createdAt).toLocaleDateString('de-DE'), margin + 45, yPosition + 18);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Zahlungsziel:', rightMargin - 80, yPosition + 6);
    doc.text('Kundennummer:', rightMargin - 80, yPosition + 12);
    
    doc.setFont('helvetica', 'normal');
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
    doc.setFillColor(74, 189, 189);
    doc.rect(margin, yPosition, rightMargin - margin, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Pos.', margin + 3, yPosition + 6);
    doc.text('Beschreibung', margin + 20, yPosition + 6);
    doc.text('Menge', rightMargin - 70, yPosition + 6);
    doc.text('Einzelpreis', rightMargin - 45, yPosition + 6);
    doc.text('Gesamt', rightMargin - 15, yPosition + 6, { align: 'right' });
    yPosition += 10;
    
    // Tabelleninhalt
    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');
    
    let pos = 1;
    invoice.items.forEach((item, index) => {
      // Abwechselnde Zeilenfarben
      if (index % 2 === 0) {
        doc.setFillColor(248, 248, 248);
        doc.rect(margin, yPosition - 2, rightMargin - margin, 8, 'F');
      }
      
      doc.text(pos.toString(), margin + 3, yPosition + 3);
      
      // Beschreibung auf mehrere Zeilen aufteilen wenn nötig
      const descLines = doc.splitTextToSize(item.description, 80);
      doc.text(descLines[0], margin + 20, yPosition + 3);
      
      doc.text(item.quantity.toString(), rightMargin - 70, yPosition + 3);
      doc.text(`€ ${item.unitPrice.toFixed(2)}`, rightMargin - 45, yPosition + 3);
      doc.text(`€ ${item.totalPrice.toFixed(2)}`, rightMargin - 15, yPosition + 3, { align: 'right' });
      
      yPosition += 8;
      pos++;
    });
    
    yPosition += 5;
    
    // Zwischensumme
    doc.setDrawColor(200);
    doc.line(rightMargin - 80, yPosition, rightMargin, yPosition);
    yPosition += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.text('Zwischensumme:', rightMargin - 80, yPosition);
    doc.text(`€ ${invoice.price.toFixed(2)}`, rightMargin - 15, yPosition, { align: 'right' });
    yPosition += 5;
    
    // MwSt
    doc.text('MwSt. 19%:', rightMargin - 80, yPosition);
    doc.text(`€ ${invoice.taxAmount.toFixed(2)}`, rightMargin - 15, yPosition, { align: 'right' });
    yPosition += 5;
    
    // Gesamtbetrag
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(rightMargin - 80, yPosition, rightMargin, yPosition);
    yPosition += 5;
    
    doc.setFillColor(74, 189, 189, 20);
    doc.rect(rightMargin - 80, yPosition - 3, 65, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Gesamtbetrag:', rightMargin - 80, yPosition + 3);
    doc.text(`€ ${invoice.totalPrice.toFixed(2)}`, rightMargin - 15, yPosition + 3, { align: 'right' });
    yPosition += 15;
    
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
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition, rightMargin - margin, 30, 'F');
    
    doc.setFont('helvetica', 'bold');
    let bankY = yPosition + 6;
    doc.text('Kontoinhaber:', margin + 5, bankY);
    doc.text('Bank:', margin + 5, bankY + 6);
    doc.text('IBAN:', margin + 5, bankY + 12);
    doc.text('BIC:', margin + 5, bankY + 18);
    doc.text('Verwendungszweck:', margin + 5, bankY + 24);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Wertvoll Dienstleistungen GmbH', margin + 50, bankY);
    doc.text('Commerzbank', margin + 50, bankY + 6);
    doc.text('DE89 3704 0044 0532 0130 00', margin + 50, bankY + 12);
    doc.text('COBADEFFXXX', margin + 50, bankY + 18);
    doc.text(invoice.invoiceNumber, margin + 50, bankY + 24);
    
    yPosition += 35;
    
    // Hinweise
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('Vielen Dank für Ihr Vertrauen. Bei Fragen zu dieser Rechnung kontaktieren Sie uns gerne.', margin, yPosition);
    yPosition += 4;
    doc.text('Diese Rechnung wurde maschinell erstellt und ist ohne Unterschrift gültig.', margin, yPosition);
    
    // Footer
    const footerY = pageHeight - 25;
    doc.setDrawColor(128);
    doc.line(margin, footerY - 8, rightMargin, footerY - 8);
    
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.setFont('helvetica', 'normal');
    doc.text('Relocato | Albrechtstraße 27, 33615 Bielefeld | Tel: (0521) 1200551-0', pageWidth / 2, footerY - 3, { align: 'center' });
    doc.text('E-Mail: bielefeld@relocato.de | Web: www.relocato.de | Wertvoll Dienstleistungen GmbH | HRB 43574', pageWidth / 2, footerY + 1, { align: 'center' });
    doc.text('Geschäftsführer: Sergej Schulz | USt-IdNr.: DE815143866 | Amtsgericht Bielefeld', pageWidth / 2, footerY + 5, { align: 'center' });
    
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