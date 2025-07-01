// Test-Skript für Entrümpelungs-PDF-Generierung (Rümpel Schmiede)
const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

// Test-Kunde für Entrümpelung
const testCustomer = {
  id: 'test-456',
  name: 'Frau Möller',
  email: 'moeller@example.com',
  phone: '0521 987654',
  fromAddress: 'Meller Straße 5, 32139 Spenge'
};

// Test-Entrümpelungsangebot
const testQuote = {
  price: 2890.00,
  company: 'ruempelschmiede',
  clearanceType: 'wohnung',
  objectAddress: 'Meller Straße 5, 32139 Spenge',
  comment: 'Bitte besonders vorsichtig mit alten Möbeln umgehen - eventuell verwertbar.'
};

function generateTestClearancePDF() {
  const doc = new jsPDF();
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 25;
  const rightMargin = pageWidth - margin;
  let yPosition = 30;
  
  // Helper-Funktion für Footer
  const addFooter = () => {
    const footerY = pageHeight - 20;
    doc.setDrawColor(221, 221, 221);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 8, rightMargin, footerY - 8);
    
    doc.setFontSize(9);
    doc.setTextColor(102, 102, 102);
    doc.setFont('helvetica', 'normal');
    doc.text('Rümpelschmiede - Ihr Partner für professionelle Entrümpelungen', pageWidth / 2, footerY, { align: 'center' });
    doc.text('Albrechtstraße 27, 33615 Bielefeld', pageWidth / 2, footerY + 5, { align: 'center' });
    doc.text('Tel: (0521) 1200551-0 | E-Mail: info@ruempelschmiede.de', pageWidth / 2, footerY + 10, { align: 'center' });
    doc.text('Wertvoll Dienstleistungen GmbH | HRB 43574 | USt-IdNr.: DE328644143', pageWidth / 2, footerY + 15, { align: 'center' });
  };

  // Header mit Rümpel Schmiede Logo
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 54, 53); // #b93635
  doc.text('Rümpel', margin, yPosition);
  
  doc.setTextColor(44, 62, 80); // #2c3e50
  doc.text('Schmiede', margin + 55, yPosition);
  
  // Angebotsinformationen rechts
  doc.setFontSize(18);
  doc.setTextColor(44, 62, 80);
  doc.text('Entrümpelungsangebot', rightMargin, yPosition - 8, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setTextColor(85, 85, 85);
  const angebotNr = `ES-2025-0701-001`;
  doc.text(`Angebot Nr.: ${angebotNr}`, rightMargin, yPosition + 2, { align: 'right' });
  doc.text(`Datum: ${new Date().toLocaleDateString('de-DE')}`, rightMargin, yPosition + 8, { align: 'right' });
  
  const gueltigBis = new Date();
  gueltigBis.setDate(gueltigBis.getDate() + 31);
  doc.text(`Gültig bis: ${gueltigBis.toLocaleDateString('de-DE')}`, rightMargin, yPosition + 14, { align: 'right' });
  
  // Trennlinie
  yPosition += 25;
  doc.setDrawColor(185, 54, 53);
  doc.setLineWidth(3);
  doc.line(margin, yPosition, rightMargin, yPosition);
  yPosition += 15;
  
  // Kundeninformationen Box
  doc.setFillColor(249, 247, 244);
  doc.rect(margin, yPosition, rightMargin - margin, 35, 'F');
  doc.setFillColor(185, 54, 53);
  doc.rect(margin - 4, yPosition, 4, 35, 'F');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 54, 53);
  doc.text('Kundeninformationen', margin + 8, yPosition + 8);
  
  doc.setFontSize(10);
  doc.setTextColor(44, 62, 80);
  doc.setFont('helvetica', 'normal');
  let infoY = yPosition + 15;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Name:', margin + 8, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(testCustomer.name, margin + 35, infoY);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Objekt:', margin + 8, infoY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(testQuote.objectAddress, margin + 35, infoY + 6);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Art:', margin + 8, infoY + 12);
  doc.setFont('helvetica', 'normal');
  doc.text('Wohnungsentrümpelung', margin + 35, infoY + 12);
  
  yPosition += 45;
  
  // Leistungsumfang
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(44, 62, 80);
  doc.text('Leistungsumfang der Entrümpelung', margin, yPosition);
  
  const textWidth = doc.getTextWidth('Leistungsumfang der Entrümpelung');
  doc.setDrawColor(185, 54, 53);
  doc.setLineWidth(2);
  doc.line(margin, yPosition + 2, margin + textWidth, yPosition + 2);
  yPosition += 15;
  
  // Service-Boxen
  const services = [
    {
      title: 'Komplette Wohnungsentrümpelung',
      items: [
        'Fachgerechte Räumung aller Räume',
        'Entsorgung sämtlicher Gegenstände und Möbel',
        'Sortierung und umweltgerechte Entsorgung',
        'Dokumentation der Entsorgung'
      ]
    },
    {
      title: 'Demontage und Entfernung',
      items: [
        'Komplette Demontage der Küche',
        'Entfernung aller Lampen',
        'Abnahme sämtlicher Gardinen',
        'Demontage fest verbauter Einrichtung'
      ]
    },
    {
      title: 'Endreinigung',
      items: [
        'Besenreine Übergabe aller Räume',
        'Entfernung von Kleberesten',
        'Reinigung nach Demontagearbeiten'
      ]
    }
  ];
  
  services.forEach((service) => {
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(221, 221, 221);
    doc.setLineWidth(0.5);
    const boxHeight = 35;
    doc.rect(margin, yPosition, rightMargin - margin, boxHeight, 'FD');
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 54, 53);
    doc.text(service.title, margin + 5, yPosition + 8);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(85, 85, 85);
    
    let lineY = yPosition + 15;
    service.items.slice(0, 3).forEach((item) => {
      doc.text(`• ${item}`, margin + 8, lineY);
      lineY += 5;
    });
    
    yPosition += boxHeight + 8;
  });
  
  // Highlight Box
  doc.setFillColor(255, 243, 224);
  doc.setDrawColor(255, 152, 0);
  doc.setLineWidth(2);
  doc.rect(margin, yPosition, rightMargin - margin, 15, 'FD');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(230, 81, 0);
  doc.text('⚡ Alles aus einer Hand - Schnell, sauber und zuverlässig! ⚡', pageWidth / 2, yPosition + 9, { align: 'center' });
  yPosition += 25;
  
  // Kostenübersicht
  doc.setFillColor(245, 241, 232);
  doc.setDrawColor(185, 54, 53);
  doc.setLineWidth(2);
  doc.rect(margin, yPosition, rightMargin - margin, 60, 'FD');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(44, 62, 80);
  doc.text('Kostenübersicht', margin + 5, yPosition + 10);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  let costY = yPosition + 20;
  
  const positions = [
    { desc: 'Komplette Wohnungsentrümpelung', price: '1.680,00' },
    { desc: 'Demontage Küche, Lampen & Gardinen', price: '750,00' }
  ];
  
  positions.forEach(pos => {
    doc.text(pos.desc, margin + 5, costY);
    doc.text(pos.price + ' €', rightMargin - 5, costY, { align: 'right' });
    costY += 6;
  });
  
  // Zwischensumme
  costY += 2;
  doc.setDrawColor(221, 221, 221);
  doc.setLineWidth(0.5);
  doc.line(margin + 5, costY, rightMargin - 5, costY);
  costY += 6;
  
  doc.text('Zwischensumme netto', margin + 5, costY);
  doc.text('2.430,00 €', rightMargin - 5, costY, { align: 'right' });
  costY += 6;
  
  doc.text('MwSt. 19%', margin + 5, costY);
  doc.text('461,70 €', rightMargin - 5, costY, { align: 'right' });
  
  costY += 8;
  doc.setDrawColor(185, 54, 53);
  doc.setLineWidth(2);
  doc.line(margin + 5, costY, rightMargin - 5, costY);
  costY += 10;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(185, 54, 53);
  doc.text('GESAMTPREIS FESTPREIS', margin + 5, costY);
  doc.text('2.890,00 €', rightMargin - 5, costY, { align: 'right' });
  
  // Footer
  addFooter();
  
  // Speichere PDF
  const fileName = `Test_Entruempelung_${new Date().toISOString().split('T')[0]}.pdf`;
  const filePath = path.join(__dirname, fileName);
  
  const pdfOutput = doc.output('arraybuffer');
  fs.writeFileSync(filePath, Buffer.from(pdfOutput));
  
  console.log(`✅ Entrümpelungs-PDF erfolgreich generiert: ${filePath}`);
  
  // Kopiere auch in Downloads
  const downloadsPath = path.join(process.env.HOME || '', 'Downloads', fileName);
  fs.writeFileSync(downloadsPath, Buffer.from(pdfOutput));
  console.log(`📥 Kopie in Downloads: ${downloadsPath}`);
}

// Führe aus
generateTestClearancePDF();