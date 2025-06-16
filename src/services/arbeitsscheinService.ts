import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export interface ArbeitsscheinData {
  auftragsnummer: string;
  kunde: {
    name: string;
    telefon: string;
  };
  datum: Date;
  volumen: number;
  strecke: number;
  vonAdresse: {
    strasse: string;
    ort: string;
    etage: string;
  };
  nachAdresse: {
    strasse: string;
    ort: string;
    etage: string;
  };
  leistungen: string[];
  preis: number;
}

export const generateArbeitsschein = (data: ArbeitsscheinData): Blob => {
  const doc = new jsPDF({
    format: 'a4',
    unit: 'mm'
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Helper function for centered text
  const centerText = (text: string, y: number, fontSize = 12) => {
    doc.setFontSize(fontSize);
    const textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, y);
  };

  // Logo
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  centerText('RELOCATO®', yPos);
  yPos += 10;

  // Green line
  doc.setDrawColor(139, 195, 74);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Title
  doc.setFontSize(18);
  doc.setTextColor(139, 195, 74);
  centerText('ARBEITSSCHEIN', yPos);
  doc.setTextColor(0, 0, 0);
  yPos += 15;

  // Customer info section
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 30, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Left column
  let leftX = margin + 5;
  let rightX = pageWidth / 2 + 5;
  let infoY = yPos;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Auftragsnummer:', leftX, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.auftragsnummer, leftX + 35, infoY);
  
  infoY += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Kunde:', leftX, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.kunde.name, leftX + 35, infoY);
  
  infoY += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Telefon:', leftX, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.kunde.telefon, leftX + 35, infoY);
  
  // Right column
  infoY = yPos;
  doc.setFont('helvetica', 'bold');
  doc.text('Datum:', rightX, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(format(data.datum, 'dd.MM.yyyy', { locale: de }), rightX + 35, infoY);
  
  infoY += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Volumen:', rightX, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.volumen.toFixed(2)} m³`, rightX + 35, infoY);
  
  infoY += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Strecke:', rightX, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.strecke} km`, rightX + 35, infoY);
  
  yPos += 35;

  // Addresses section
  doc.setFillColor(232, 245, 233);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 35, 'F');
  
  // Von Address
  let addressY = yPos;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(76, 175, 80);
  doc.text('VON', leftX, addressY);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  addressY += 7;
  doc.text(data.vonAdresse.strasse, leftX, addressY);
  addressY += 5;
  doc.text(data.vonAdresse.ort, leftX, addressY);
  addressY += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(data.vonAdresse.etage, leftX, addressY);
  
  // Nach Address
  addressY = yPos;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(76, 175, 80);
  doc.text('NACH', rightX, addressY);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  addressY += 7;
  doc.text(data.nachAdresse.strasse, rightX, addressY);
  addressY += 5;
  doc.text(data.nachAdresse.ort, rightX, addressY);
  addressY += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(data.nachAdresse.etage, rightX, addressY);
  
  yPos += 40;

  // Services section
  doc.setFillColor(139, 195, 74);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Durchgeführte Leistungen', margin + 5, yPos);
  doc.setTextColor(0, 0, 0);
  yPos += 10;
  
  doc.setFillColor(250, 250, 250);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, data.leistungen.length * 6 + 10, 'F');
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  data.leistungen.forEach(leistung => {
    doc.text(`✓ ${leistung}`, margin + 5, yPos);
    yPos += 6;
  });
  
  yPos += 10;

  // Price section
  doc.setFillColor(51, 51, 51);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  centerText('RECHNUNGSBETRAG', yPos + 3);
  
  doc.setTextColor(139, 195, 74);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  centerText(`${data.preis.toFixed(2)} €`, yPos + 13);
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  centerText('inkl. 19% MwSt.', yPos + 20);
  
  doc.setTextColor(0, 0, 0);
  yPos += 35;

  // Confirmation section
  doc.setFillColor(249, 249, 249);
  doc.setDrawColor(51, 51, 51);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 40, 'FD');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  centerText('LEISTUNGSBESTÄTIGUNG', yPos);
  yPos += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const confirmations = [
    'Die Umzugsleistungen wurden vollständig und ordnungsgemäß erbracht',
    'Das Umzugsgut wurde unbeschädigt transportiert',
    'Alle vereinbarten Leistungen wurden durchgeführt',
    'Zahlung erfolgt per EC-Karte'
  ];
  
  confirmations.forEach(text => {
    // Checkbox
    doc.rect(margin + 5, yPos - 3, 4, 4);
    doc.text(text, margin + 12, yPos);
    yPos += 7;
  });
  
  // Signatures
  yPos = pageHeight - 50;
  
  const signatureWidth = (pageWidth - 3 * margin) / 2;
  
  // Left signature
  doc.line(margin, yPos, margin + signatureWidth, yPos);
  doc.setFontSize(9);
  doc.setTextColor(102, 102, 102);
  doc.text('Datum, Unterschrift Kunde', margin + signatureWidth / 2, yPos + 5, { align: 'center' });
  
  // Right signature
  doc.line(pageWidth - margin - signatureWidth, yPos, pageWidth - margin, yPos);
  doc.text('Datum, Unterschrift RELOCATO® Mitarbeiter', pageWidth - margin - signatureWidth / 2, yPos + 5, { align: 'center' });
  
  // Footer
  doc.setTextColor(102, 102, 102);
  doc.setFontSize(8);
  centerText('RELOCATO® Bielefeld | Detmolder Str. 234a, 33605 Bielefeld | Tel: (0521) 1200551-0', pageHeight - 20);
  centerText('www.relocato.de | Wertvoll Dienstleistungen GmbH', pageHeight - 17);

  return doc.output('blob');
};