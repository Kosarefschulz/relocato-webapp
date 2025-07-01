// Temporäres Skript zum Testen der PDF-Generierung
const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

// Test-Kunde
const testCustomer = {
  id: 'test-123',
  name: 'Max Mustermann',
  email: 'max.mustermann@example.com',
  phone: '0521 123456',
  fromAddress: 'Musterstraße 123, 33604 Bielefeld',
  toAddress: 'Neue Straße 456, 33605 Bielefeld',
  movingDate: new Date('2025-02-15'),
  apartment: {
    rooms: 3,
    area: 85,
    floor: 2,
    hasElevator: false
  }
};

// Test-Angebot
const testQuote = {
  price: 2499.00,
  comment: 'Bitte besonders vorsichtig mit dem Aquarium umgehen. Parkplatz vor dem Haus ist vorhanden.',
  volume: 65,
  distance: 15,
  calculation: {
    floorSurcharge: 200,
    distanceSurcharge: 150,
    packingService: 400
  },
  details: {
    packingRequested: true,
    boxCount: 50,
    furnitureAssemblyPrice: 200,
    furnitureDisassemblyPrice: 150,
    cleaningService: true,
    cleaningHours: 4,
    pianoTransport: true,
    heavyItemsCount: 2,
    parkingZonePrice: 50,
    packingMaterials: true
  }
};

function generateTestPDF() {
  const doc = new jsPDF();
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const rightMargin = pageWidth - margin;
  let yPosition = 20;
  
  // Helper-Funktion für Footer
  const addFooter = (pageNum) => {
    const footerY = pageHeight - 15;
    doc.setDrawColor(221, 221, 221);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 5, rightMargin, footerY - 5);
    
    doc.setFontSize(8);
    doc.setTextColor(102, 102, 102);
    doc.setFont('helvetica', 'normal');
    doc.text('RELOCATO® Bielefeld | Albrechtstraße 27, 33615 Bielefeld | Tel: (0521) 1200551-0', pageWidth / 2, footerY, { align: 'center' });
    doc.text('E-Mail: bielefeld@relocato.de | Web: www.relocato.de', pageWidth / 2, footerY + 4, { align: 'center' });
    doc.text(`Seite ${pageNum} von 2`, pageWidth / 2, footerY + 8, { align: 'center' });
  };

  // SEITE 1
  // Header
  doc.setFontSize(28);
  doc.setTextColor(51, 51, 51);
  doc.setFont('helvetica', 'bold');
  doc.text('RELOCATO', pageWidth / 2 - 15, yPosition, { align: 'center' });
  doc.setFontSize(12);
  doc.text('®', pageWidth / 2 + 25, yPosition - 5);
  
  doc.setDrawColor(139, 195, 74);
  doc.setLineWidth(2);
  doc.line(margin, yPosition + 5, rightMargin, yPosition + 5);
  yPosition += 12;
  
  doc.setFontSize(18);
  doc.setTextColor(139, 195, 74);
  doc.text('Umzugsangebot', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;
  
  // Angebotsnummer
  doc.setFillColor(245, 245, 245);
  doc.setDrawColor(221, 221, 221);
  doc.setLineWidth(0.5);
  doc.rect(margin, yPosition, rightMargin - margin, 10, 'FD');
  
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  const angebotNr = Date.now().toString();
  const gueltigBis = new Date();
  gueltigBis.setDate(gueltigBis.getDate() + 14);
  
  doc.text(`Angebot Nr.: ${angebotNr}`, margin + 3, yPosition + 6);
  doc.text(`Gültig bis: ${gueltigBis.toLocaleDateString('de-DE')}`, rightMargin - 3, yPosition + 6, { align: 'right' });
  yPosition += 12;
  
  // Kundendaten
  const columnWidth = (rightMargin - margin - 10) / 2;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(139, 195, 74);
  doc.text('Kundendaten', margin, yPosition);
  
  doc.setFontSize(9);
  doc.setTextColor(85, 85, 85);
  let leftY = yPosition + 8;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Name:', margin, leftY);
  doc.setFont('helvetica', 'normal');
  doc.text(testCustomer.name, margin + 30, leftY);
  leftY += 6;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Telefon:', margin, leftY);
  doc.setFont('helvetica', 'normal');
  doc.text('+49 ' + testCustomer.phone.replace(/^0+/, ''), margin + 30, leftY);
  leftY += 6;
  
  doc.setFont('helvetica', 'bold');
  doc.text('E-Mail:', margin, leftY);
  doc.setFont('helvetica', 'normal');
  doc.text(testCustomer.email, margin + 30, leftY);
  leftY += 6;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Termin:', margin, leftY);
  doc.setFont('helvetica', 'normal');
  doc.text(testCustomer.movingDate.toLocaleDateString('de-DE'), margin + 30, leftY);
  
  // Umzugsdetails
  const rightX = margin + columnWidth + 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(139, 195, 74);
  doc.text('Umzugsdetails', rightX, yPosition);
  
  doc.setFontSize(9);
  doc.setTextColor(85, 85, 85);
  let rightY = yPosition + 8;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Von:', rightX, rightY);
  doc.setFont('helvetica', 'normal');
  const fromLines = doc.splitTextToSize(testCustomer.fromAddress, columnWidth - 25);
  doc.text(fromLines, rightX + 20, rightY);
  rightY += fromLines.length * 4 + 2;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Nach:', rightX, rightY);
  doc.setFont('helvetica', 'normal');
  const toLines = doc.splitTextToSize(testCustomer.toAddress, columnWidth - 25);
  doc.text(toLines, rightX + 20, rightY);
  rightY += toLines.length * 4 + 2;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Wohnung:', rightX, rightY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${testCustomer.apartment.rooms} Zi., ${testCustomer.apartment.area} m²`, rightX + 20, rightY);
  
  yPosition = Math.max(leftY, rightY) + 8;
  
  // Leistungsumfang
  doc.setFillColor(224, 224, 224);
  doc.setDrawColor(153, 153, 153);
  doc.setLineWidth(1);
  doc.rect(margin, yPosition, rightMargin - margin, 7, 'FD');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('Leistungsumfang - Premium-Service', margin + 3, yPosition + 4.5);
  yPosition += 9;
  
  // Services
  const services = [
    `• Be- und Entladen (${testQuote.volume} m³ Umzugsvolumen)`,
    '• Etagen-Zuschlag berücksichtigt',
    `• Transportstrecke: ${testQuote.distance} km`,
    '• Professioneller Verpackungsservice',
    `• ${testQuote.details.boxCount} Umzugskartons (Leihweise)`,
    '• Möbelmontage am Zielort',
    '• Möbeldemontage am Ausgangsort',
    `• Endreinigung (${testQuote.details.cleaningHours} Stunden)`,
    '• Spezialtransport für Klavier/Flügel',
    `• Transport von ${testQuote.details.heavyItemsCount} schweren Gegenständen`,
    '• Parkzonengenehmigung',
    '• Hochwertiges Verpackungsmaterial',
    '• Transport mit modernem Umzugs-LKW',
    '• Grundhaftung nach §451g HGB'
  ];
  
  doc.setFillColor(249, 249, 249);
  doc.setDrawColor(221, 221, 221);
  doc.setLineWidth(0.5);
  const serviceBoxHeight = 40;
  doc.rect(margin, yPosition, rightMargin - margin, serviceBoxHeight, 'FD');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('Folgende Leistungen sind im Festpreis enthalten:', margin + 3, yPosition + 4);
  yPosition += 6;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  
  let serviceY = yPosition;
  services.slice(0, 10).forEach((service, index) => {
    if (index < 10) {
      doc.text(service, margin + 3, serviceY);
      serviceY += 3.5;
    }
  });
  
  // Zweite Spalte
  services.slice(10).forEach((service, index) => {
    doc.text(service, margin + columnWidth + 3, yPosition + index * 3.5);
  });
  
  yPosition += serviceBoxHeight - 6;
  
  // Kostenübersicht
  doc.setFillColor(224, 224, 224);
  doc.setDrawColor(153, 153, 153);
  doc.setLineWidth(1);
  doc.rect(margin, yPosition, rightMargin - margin, 7, 'FD');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('Kostenübersicht', margin + 3, yPosition + 4.5);
  yPosition += 9;
  
  // Preistabelle
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(221, 221, 221);
  doc.setLineWidth(0.5);
  doc.rect(margin, yPosition, rightMargin - margin, 22, 'D');
  
  const nettoPreis = testQuote.price / 1.19;
  const mwst = testQuote.price - nettoPreis;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Premium-Komplettpaket netto', margin + 3, yPosition + 5);
  doc.text(nettoPreis.toFixed(2).replace('.', ',') + ' €', rightMargin - 5, yPosition + 5, { align: 'right' });
  
  doc.setDrawColor(238, 238, 238);
  doc.line(margin, yPosition + 8, rightMargin, yPosition + 8);
  
  doc.text('MwSt. 19,00 %', margin + 3, yPosition + 12);
  doc.text(mwst.toFixed(2).replace('.', ',') + ' €', rightMargin - 5, yPosition + 12, { align: 'right' });
  
  doc.setDrawColor(51, 51, 51);
  doc.setLineWidth(2);
  doc.line(margin, yPosition + 15, rightMargin, yPosition + 15);
  
  doc.setFillColor(249, 249, 249);
  doc.rect(margin, yPosition + 15, rightMargin - margin, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Gesamtsumme Festpreis inkl. MwSt.', margin + 3, yPosition + 19);
  doc.text(testQuote.price.toFixed(2).replace('.', ',') + ' €', rightMargin - 5, yPosition + 19, { align: 'right' });
  
  // Footer Seite 1
  addFooter(1);
  
  // SEITE 2
  doc.addPage();
  yPosition = 20;
  
  // Bemerkungen
  if (testQuote.comment) {
    doc.setFillColor(255, 250, 240);
    doc.setDrawColor(255, 152, 0);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPosition, rightMargin - margin, 20, 'FD');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.text('Ihre Anmerkungen:', margin + 3, yPosition + 5);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const splitComment = doc.splitTextToSize(testQuote.comment, rightMargin - margin - 6);
    doc.text(splitComment, margin + 3, yPosition + 10);
    yPosition += 25;
  }
  
  // Versicherungsschutz
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
  doc.setFillColor(240, 248, 255);
  doc.setDrawColor(70, 130, 180);
  doc.setLineWidth(0.5);
  doc.rect(margin, yPosition, rightMargin - margin, 15, 'FD');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('Zahlungsbedingungen:', margin + 3, yPosition + 5);
  doc.setFont('helvetica', 'normal');
  doc.text('Gemäß BUKG-Vorgaben', margin + 40, yPosition + 5);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Besichtigung:', margin + 3, yPosition + 10);
  doc.setFont('helvetica', 'normal');
  doc.text('Gerne vereinbaren wir einen Termin vor Ort', margin + 28, yPosition + 10);
  yPosition += 20;
  
  // Unterschriftsbox
  doc.setDrawColor(153, 153, 153);
  doc.setLineWidth(1);
  doc.rect(margin, yPosition, rightMargin - margin, 35, 'D');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const unterschriftText = 'Mit meiner Unterschrift beauftrage ich RELOCATO® Bielefeld mit der Durchführung des Umzugs zu den genannten Konditionen. Dieses Angebot entspricht den Anforderungen des BUKG.';
  const unterschriftLines = doc.splitTextToSize(unterschriftText, rightMargin - margin - 6);
  doc.text(unterschriftLines, margin + 3, yPosition + 5);
  
  // Unterschriftslinien
  const lineY = yPosition + 27;
  const lineLength = (rightMargin - margin - 30) / 2;
  
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(margin + 15, lineY, margin + 15 + lineLength, lineY);
  doc.line(rightMargin - 15 - lineLength, lineY, rightMargin - 15, lineY);
  
  doc.setFontSize(8);
  doc.setTextColor(102, 102, 102);
  doc.text('Ort, Datum', margin + 15 + lineLength/2, lineY + 4, { align: 'center' });
  doc.text('Unterschrift Auftraggeber', rightMargin - 15 - lineLength/2, lineY + 4, { align: 'center' });
  
  // Footer Seite 2
  addFooter(2);
  
  // Speichere PDF
  const fileName = `Test_Angebot_${new Date().toISOString().split('T')[0]}.pdf`;
  const filePath = path.join(__dirname, fileName);
  
  // Erstelle Buffer aus PDF
  const pdfOutput = doc.output('arraybuffer');
  fs.writeFileSync(filePath, Buffer.from(pdfOutput));
  
  console.log(`✅ PDF erfolgreich generiert: ${filePath}`);
  
  // Kopiere auch in Downloads
  const downloadsPath = path.join(process.env.HOME || '', 'Downloads', fileName);
  fs.writeFileSync(downloadsPath, Buffer.from(pdfOutput));
  console.log(`📥 Kopie in Downloads: ${downloadsPath}`);
}

// Führe aus
generateTestPDF();