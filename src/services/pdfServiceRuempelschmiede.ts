import jsPDF from 'jspdf';
import { Customer, Quote } from '../types';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { preparePdfLogo } from '../utils/svgUtils';
import { ruempelSchmiedeLogoSVG } from '../assets/logos/ruempelschmiedeLogo';

export const generateRuempelschmiedePDF = async (
  customer: Customer,
  quote: Quote & { 
    volume?: number; 
    distance?: number;
    packingRequested?: boolean;
    boxCount?: number;
    parkingZonePrice?: number;
    storagePrice?: number;
    furnitureAssemblyPrice?: number;
    furnitureDisassemblyPrice?: number;
    cleaningService?: boolean;
    cleaningHours?: number;
    clearanceService?: boolean;
    clearanceVolume?: number;
    pianoTransport?: boolean;
    heavyItemsCount?: number;
    packingMaterials?: boolean;
  }
): Promise<Blob> => {
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Farben
  const primaryColor = '#E74C3C';
  const secondaryColor = '#34495E';
  const lightGray = '#F8F9FA';
  const darkGray = '#2C3E50';
  
  // Basis Daten
  const quoteNumber = `RS-${quote.id}`;
  const currentDate = format(new Date(), 'dd.MM.yyyy', { locale: de });
  const basePrice = quote.price || 0;
  
  // Erste Seite - Deckblatt
  const margin = 20;
  let y = 20;
  
  // Logo einfügen
  try {
    // Lade SVG und konvertiere zu PNG für PDF
    let logoDataUrl: string;
    
    // Nutze das importierte SVG Logo
    logoDataUrl = await preparePdfLogo(ruempelSchmiedeLogoSVG);
    
    // Füge Logo zum PDF hinzu
    doc.addImage(logoDataUrl, 'PNG', margin, 8, 35, 25);
    
  } catch (error) {
    console.error('Fehler beim Laden des Logos:', error);
    // Fallback: Logo-Platzhalter mit Rahmen
    doc.setDrawColor(primaryColor);
    doc.setLineWidth(0.5);
    doc.rect(margin, 8, 35, 25);
    
    // RS Text als Logo-Ersatz
    doc.setTextColor(primaryColor);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('RS', margin + 17.5, 23, { align: 'center' });
  }
  
  // Firmenname neben Logo
  doc.setTextColor(darkGray);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('RÜMPEL SCHMIEDE', 60, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Entrümpelung & Haushaltsauflösung', 60, 26);
  
  // Kontaktinformationen rechts
  doc.setFontSize(9);
  doc.setTextColor(secondaryColor);
  const rightX = 150;
  doc.text('Tel: 0162 3456789', rightX, 12);
  doc.text('info@ruempel-schmiede.de', rightX, 17);
  doc.text('www.ruempel-schmiede.de', rightX, 22);
  
  // Trennlinie
  y = 40;
  doc.setDrawColor(primaryColor);
  doc.setLineWidth(1);
  doc.line(margin, y, 210 - margin, y);
  
  // Angebotsnummer und Datum
  y += 15;
  doc.setTextColor(darkGray);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ENTRÜMPELUNGSANGEBOT', margin, y);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Angebotsnummer: ${quoteNumber}`, 130, y);
  
  y += 6;
  doc.text(`Datum: ${currentDate}`, 130, y);
  
  // Kundeninformationen
  y += 20;
  doc.setFillColor(lightGray);
  doc.rect(margin, y - 8, 170, 35, 'F');
  
  doc.setTextColor(secondaryColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('KUNDENINFORMATIONEN', margin + 5, y);
  
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${customer.name}`, margin + 5, y);
  
  y += 6;
  doc.text(`Telefon: ${customer.phone}`, margin + 5, y);
  doc.text(`E-Mail: ${customer.email}`, 100, y);
  
  y += 6;
  doc.text(`Adresse: ${customer.fromAddress || 'Wird noch mitgeteilt'}`, margin + 5, y);
  
  // Leistungsübersicht
  y += 25;
  doc.setTextColor(darkGray);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('LEISTUNGSÜBERSICHT', margin, y);
  
  y += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Hauptleistungen
  const services = [];
  
  if (quote.volume && quote.volume > 0) {
    services.push(`Entrümpelung von ca. ${quote.volume} m³`);
  }
  
  if (quote.cleaningService) {
    services.push(`Endreinigung (${quote.cleaningHours || 0} Stunden)`);
  }
  
  if (quote.clearanceService && quote.clearanceVolume) {
    services.push(`Sperrmüll-Entsorgung (${quote.clearanceVolume} m³)`);
  }
  
  if (quote.packingMaterials) {
    services.push('Bereitstellung von Verpackungsmaterial');
  }
  
  if (quote.pianoTransport) {
    services.push('Klavier/Flügel-Transport');
  }
  
  if (quote.heavyItemsCount && quote.heavyItemsCount > 0) {
    services.push(`Schwertransport (${quote.heavyItemsCount} Gegenstände)`);
  }
  
  // Services als Liste
  services.forEach(service => {
    doc.setTextColor(secondaryColor);
    doc.text('•', margin + 5, y);
    doc.setTextColor(darkGray);
    doc.text(service, margin + 10, y);
    y += 6;
  });
  
  // Besondere Hinweise
  if (quote.comment) {
    y += 10;
    doc.setTextColor(darkGray);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('BESONDERE HINWEISE:', margin, y);
    
    y += 6;
    doc.setFont('helvetica', 'normal');
    const splitComment = doc.splitTextToSize(quote.comment, 170);
    doc.text(splitComment, margin, y);
    y += splitComment.length * 5;
  }
  
  // Preis-Box
  y = 220;
  doc.setFillColor(primaryColor);
  doc.rect(margin, y, 170, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('GESAMTPREIS', margin + 5, y + 12);
  
  doc.setFontSize(20);
  doc.text(`€ ${basePrice.toFixed(2).replace('.', ',')}`, 160, y + 12, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('inkl. 19% MwSt.', 160, y + 20, { align: 'right' });
  
  // Footer erste Seite
  doc.setTextColor(secondaryColor);
  doc.setFontSize(8);
  doc.text('Seite 1 von 2', 105, 285, { align: 'center' });
  
  // Zweite Seite - Leistungsdetails und Bedingungen
  doc.addPage();
  y = 20;
  
  // Header zweite Seite
  doc.setTextColor(darkGray);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('LEISTUNGSUMFANG & BEDINGUNGEN', margin, y);
  
  // Trennlinie
  y += 8;
  doc.setDrawColor(primaryColor);
  doc.setLineWidth(0.5);
  doc.line(margin, y, 210 - margin, y);
  
  // Inkludierte Leistungen
  y += 15;
  doc.setTextColor(darkGray);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('INKLUDIERTE LEISTUNGEN', margin, y);
  
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const includedServices = [
    'Professionelles Entrümpelungsteam',
    'Demontage von Möbeln (soweit erforderlich)',
    'Transport und fachgerechte Entsorgung',
    'Besenreine Übergabe',
    'Wertanrechnung bei verwertbaren Gegenständen',
    'Entsorgungsnachweis'
  ];
  
  includedServices.forEach(service => {
    doc.setTextColor(primaryColor);
    doc.text('✓', margin, y);
    doc.setTextColor(darkGray);
    doc.text(service, margin + 8, y);
    y += 6;
  });
  
  // Zusatzleistungen
  y += 10;
  doc.setTextColor(darkGray);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('OPTIONALE ZUSATZLEISTUNGEN', margin, y);
  
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Folgende Leistungen können bei Bedarf zusätzlich gebucht werden:', margin, y);
  
  y += 6;
  const additionalServices = [
    'Renovierungsarbeiten',
    'Malerarbeiten',
    'Kleine Reparaturen',
    'Schlüsselübergabe an Vermieter',
    'Express-Service (innerhalb 24h)'
  ];
  
  additionalServices.forEach(service => {
    doc.text(`• ${service}`, margin + 5, y);
    y += 5;
  });
  
  // Zahlungsbedingungen
  y += 15;
  doc.setFillColor(lightGray);
  doc.rect(margin, y - 8, 170, 45, 'F');
  
  doc.setTextColor(secondaryColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('ZAHLUNGSBEDINGUNGEN', margin + 5, y);
  
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('• Zahlung nach Leistungserbringung', margin + 5, y);
  y += 6;
  doc.text('• Bar, EC-Karte oder Überweisung', margin + 5, y);
  y += 6;
  doc.text('• Bei Überweisung: Zahlungsziel 7 Tage', margin + 5, y);
  y += 6;
  doc.text('• Keine Anzahlung erforderlich', margin + 5, y);
  
  // Wichtige Hinweise
  y += 20;
  doc.setTextColor(darkGray);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('WICHTIGE HINWEISE', margin, y);
  
  y += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const notes = [
    'Dieses Angebot ist 30 Tage gültig.',
    'Die angegebenen Preise verstehen sich als Festpreise.',
    'Eventuelle Sondermüllentsorgung wird nach Aufwand berechnet.',
    'Wertgegenstände bitte vor der Entrümpelung entfernen.',
    'Kostenlose Besichtigung und Beratung vor Ort möglich.'
  ];
  
  notes.forEach(note => {
    const splitNote = doc.splitTextToSize(`• ${note}`, 165);
    doc.text(splitNote, margin, y);
    y += splitNote.length * 4 + 2;
  });
  
  // Footer mit Kontaktbox
  y = 245;
  doc.setFillColor(secondaryColor);
  doc.rect(margin, y, 170, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Kontaktieren Sie uns für Ihre Entrümpelung!', 105, y + 8, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Tel: 0162 3456789 | info@ruempel-schmiede.de', 105, y + 15, { align: 'center' });
  
  // Seitennummer
  doc.setTextColor(secondaryColor);
  doc.setFontSize(8);
  doc.text('Seite 2 von 2', 105, 285, { align: 'center' });
  
  // PDF als Blob zurückgeben
  return doc.output('blob');
};