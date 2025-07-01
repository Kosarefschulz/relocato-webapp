import { jsPDF } from 'jspdf';
import { Customer, Quote } from '../types';
import { getCompanyConfig } from '../config/companies.config';

interface ClearanceQuoteData extends Partial<Quote> {
  customerId: string;
  customerName: string;
  price: number;
  comment?: string;
  createdAt: Date;
  createdBy: string;
  status: string;
  clearanceType?: 'wohnung' | 'haus' | 'keller' | 'dachboden' | 'garage' | 'gewerbe';
  services?: ClearanceServiceItem[];
  objectAddress?: string;
  objectDetails?: {
    area?: number;
    rooms?: number;
    floor?: number;
    hasElevator?: boolean;
    accessNotes?: string;
  };
}

interface ClearanceServiceItem {
  name: string;
  description?: string;
  price: number;
  included: boolean;
}

export const generateClearancePDF = async (
  customer: Customer, 
  quote: ClearanceQuoteData
): Promise<Blob> => {
  try {
    console.log('🔄 Starte Entrümpelungs-PDF-Generierung...', { customer, quote });
    
    const doc = new jsPDF();
    const company = getCompanyConfig('ruempelschmiede');
    
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
      doc.text(`${company.fullName} - Ihr Partner für professionelle Entrümpelungen`, pageWidth / 2, footerY, { align: 'center' });
      doc.text(`${company.address.street}, ${company.address.zip} ${company.address.city}`, pageWidth / 2, footerY + 5, { align: 'center' });
      doc.text(`Tel: ${company.contact.phone} | E-Mail: ${company.contact.email}`, pageWidth / 2, footerY + 10, { align: 'center' });
      doc.text(`${company.legal.companyName} | ${company.legal.registrationNumber} | USt-IdNr.: ${company.legal.taxId}`, pageWidth / 2, footerY + 15, { align: 'center' });
    };

    // Header mit Rümpel Schmiede Logo
    doc.setFontSize(36);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(company.primaryColor);
    doc.text('Rümpel', margin, yPosition);
    
    doc.setTextColor(company.secondaryColor);
    doc.text('Schmiede', margin + 55, yPosition);
    
    // Angebotsinformationen rechts
    doc.setFontSize(18);
    doc.setTextColor(company.secondaryColor);
    doc.text('Entrümpelungsangebot', rightMargin, yPosition - 8, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setTextColor(85, 85, 85);
    const angebotNr = `ES-${new Date().getFullYear()}-${new Date().toISOString().slice(5,10).replace('-','')}-${Date.now().toString().slice(-3)}`;
    doc.text(`Angebot Nr.: ${angebotNr}`, rightMargin, yPosition + 2, { align: 'right' });
    doc.text(`Datum: ${new Date().toLocaleDateString('de-DE')}`, rightMargin, yPosition + 8, { align: 'right' });
    
    const gueltigBis = new Date();
    gueltigBis.setDate(gueltigBis.getDate() + 31);
    doc.text(`Gültig bis: ${gueltigBis.toLocaleDateString('de-DE')}`, rightMargin, yPosition + 14, { align: 'right' });
    
    // Trennlinie
    yPosition += 25;
    doc.setDrawColor(company.primaryColor);
    doc.setLineWidth(3);
    doc.line(margin, yPosition, rightMargin, yPosition);
    yPosition += 15;
    
    // Kundeninformationen Box
    doc.setFillColor(249, 247, 244); // Leicht beige
    doc.setDrawColor(company.primaryColor);
    doc.setLineWidth(0);
    doc.rect(margin, yPosition, rightMargin - margin, 35, 'F');
    doc.setLineWidth(0);
    doc.rect(margin - 4, yPosition, 4, 35, 'F'); // Linker Rand in Rot
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(company.primaryColor);
    doc.text('Kundeninformationen', margin + 8, yPosition + 8);
    
    doc.setFontSize(10);
    doc.setTextColor(company.secondaryColor);
    doc.setFont('helvetica', 'normal');
    let infoY = yPosition + 15;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Name:', margin + 8, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(customer.name, margin + 35, infoY);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Objekt:', margin + 8, infoY + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(quote.objectAddress || customer.fromAddress || 'Zu besprechen', margin + 35, infoY + 6);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Art:', margin + 8, infoY + 12);
    doc.setFont('helvetica', 'normal');
    const clearanceTypeText = {
      'wohnung': 'Wohnungsentrümpelung',
      'haus': 'Hausentrümpelung',
      'keller': 'Kellerentrümpelung',
      'dachboden': 'Dachbodenentrümpelung',
      'garage': 'Garagenentrümpelung',
      'gewerbe': 'Gewerbeentrümpelung'
    };
    doc.text(clearanceTypeText[quote.clearanceType || 'wohnung'] || 'Entrümpelung', margin + 35, infoY + 12);
    
    yPosition += 45;
    
    // Leistungsumfang
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(company.secondaryColor);
    doc.text('Leistungsumfang der Entrümpelung', margin, yPosition);
    
    // Unterstreichen
    const textWidth = doc.getTextWidth('Leistungsumfang der Entrümpelung');
    doc.setDrawColor(company.primaryColor);
    doc.setLineWidth(2);
    doc.line(margin, yPosition + 2, margin + textWidth, yPosition + 2);
    yPosition += 15;
    
    // Service-Boxen
    const services = quote.services || [
      {
        name: 'Komplette Entrümpelung',
        description: 'Fachgerechte Räumung aller Räume, Entsorgung sämtlicher Gegenstände und Möbel, Sortierung und umweltgerechte Entsorgung, Dokumentation der Entsorgung',
        price: 0,
        included: true
      },
      {
        name: 'Demontage und Entfernung',
        description: 'Komplette Demontage der Küche, Entfernung aller Lampen, Abnahme sämtlicher Gardinen, Demontage fest verbauter Einrichtung',
        price: 0,
        included: true
      },
      {
        name: 'Endreinigung',
        description: 'Besenreine Übergabe aller Räume, Entfernung von Kleberesten, Reinigung nach Demontagearbeiten',
        price: 0,
        included: true
      }
    ];
    
    services.forEach((service, index) => {
      if (!service.included) return;
      
      // Service Box
      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(221, 221, 221);
      doc.setLineWidth(0.5);
      const boxHeight = 35;
      doc.rect(margin, yPosition, rightMargin - margin, boxHeight, 'FD');
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(company.primaryColor);
      doc.text(service.name, margin + 5, yPosition + 8);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(85, 85, 85);
      
      if (service.description) {
        const descLines = service.description.split(', ');
        let lineY = yPosition + 15;
        descLines.forEach((line, idx) => {
          if (idx < 3) { // Max 3 Zeilen
            doc.text(`• ${line}`, margin + 8, lineY);
            lineY += 5;
          }
        });
      }
      
      yPosition += boxHeight + 8;
    });
    
    // Highlight Box
    doc.setFillColor(255, 243, 224); // Helles Orange
    doc.setDrawColor(255, 152, 0);
    doc.setLineWidth(2);
    doc.rect(margin, yPosition, rightMargin - margin, 15, 'FD');
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(230, 81, 0);
    doc.text('⚡ Alles aus einer Hand - Schnell, sauber und zuverlässig! ⚡', pageWidth / 2, yPosition + 9, { align: 'center' });
    yPosition += 25;
    
    // Kostenübersicht
    doc.setFillColor(245, 241, 232); // Leicht beige
    doc.setDrawColor(company.primaryColor);
    doc.setLineWidth(2);
    doc.rect(margin, yPosition, rightMargin - margin, 60, 'FD');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(company.secondaryColor);
    doc.text('Kostenübersicht', margin + 5, yPosition + 10);
    
    // Kostenpositionen
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    let costY = yPosition + 20;
    
    const nettoPreis = quote.price / 1.19;
    const mwst = quote.price - nettoPreis;
    
    // Hauptleistung
    doc.text('Komplette Entrümpelung inkl. aller Nebenleistungen', margin + 5, costY);
    doc.text(nettoPreis.toFixed(2).replace('.', ',') + ' €', rightMargin - 5, costY, { align: 'right' });
    
    // Trennlinie
    costY += 8;
    doc.setDrawColor(221, 221, 221);
    doc.setLineWidth(0.5);
    doc.line(margin + 5, costY, rightMargin - 5, costY);
    costY += 8;
    
    // MwSt
    doc.text('MwSt. 19%', margin + 5, costY);
    doc.text(mwst.toFixed(2).replace('.', ',') + ' €', rightMargin - 5, costY, { align: 'right' });
    
    // Dicke Trennlinie vor Total
    costY += 8;
    doc.setDrawColor(company.primaryColor);
    doc.setLineWidth(2);
    doc.line(margin + 5, costY, rightMargin - 5, costY);
    costY += 10;
    
    // Gesamtpreis
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(company.primaryColor);
    doc.text('GESAMTPREIS FESTPREIS', margin + 5, costY);
    doc.text(quote.price.toFixed(2).replace('.', ',') + ' €', rightMargin - 5, costY, { align: 'right' });
    
    yPosition += 70;
    
    // Inklusivleistungen Box
    doc.setFillColor(232, 244, 248); // Hellblau
    doc.setDrawColor(company.secondaryColor);
    doc.setLineWidth(0);
    doc.rect(margin, yPosition, rightMargin - margin, 35, 'F');
    doc.setLineWidth(0);
    doc.rect(margin - 4, yPosition, 4, 35, 'F'); // Linker Rand
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(company.secondaryColor);
    doc.text('Inklusivleistungen:', margin + 8, yPosition + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const inklusivItems = [
      '✓ Alle Entsorgungskosten',
      '✓ Containerstellung bei Bedarf',
      '✓ Fachgerechte Mülltrennung',
      '✓ Besenreine Übergabe',
      '✓ Haftpflichtversicherung'
    ];
    
    let inklusivY = yPosition + 15;
    inklusivItems.forEach((item) => {
      doc.text(item, margin + 8, inklusivY);
      inklusivY += 5;
    });
    
    yPosition += 45;
    
    // Hinweise & Konditionen
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(221, 221, 221);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPosition, rightMargin - margin, 40, 'FD');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(company.secondaryColor);
    doc.text('Hinweise & Konditionen', margin + 5, yPosition + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(102, 102, 102);
    const hinweise = [
      '• Festpreisgarantie - keine versteckten Kosten',
      '• Terminvereinbarung nach Absprache',
      '• Durchführung innerhalb von 1-2 Werktagen',
      '• Zahlung nach Leistungserbringung',
      '• Angebot freibleibend und unverbindlich',
      '• Gültigkeit: 31 Tage'
    ];
    
    let hinweisY = yPosition + 15;
    hinweise.forEach((hinweis) => {
      doc.text(hinweis, margin + 5, hinweisY);
      hinweisY += 5;
    });
    
    // Footer
    addFooter();
    
    console.log('✅ Entrümpelungs-PDF erfolgreich generiert');
    return doc.output('blob');
    
  } catch (error) {
    console.error('❌ Fehler bei Entrümpelungs-PDF-Generierung:', error);
    throw new Error('PDF-Erstellung fehlgeschlagen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
  }
};