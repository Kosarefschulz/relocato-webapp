import { jsPDF } from 'jspdf';
import { Customer, Quote } from '@/types';

interface PDFOptions {
  company?: 'relocato' | 'wertvoll' | 'ruempelschmiede';
  includeTerms?: boolean;
  includeSignature?: boolean;
}

export const generateQuotePDF = async (
  customer: Customer,
  quote: Quote,
  options: PDFOptions = {}
): Promise<Blob> => {
  try {
    console.log('🔄 Starte PDF-Generierung für Angebot...', { customer, quote });
    
    if (!customer || !quote) {
      throw new Error('Kunden- oder Angebotsdaten fehlen');
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 25;
    const rightMargin = pageWidth - margin;
    let yPosition = 30;

    // Helper function to add new page if needed
    const checkNewPage = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - 40) {
        doc.addPage();
        yPosition = 30;
        return true;
      }
      return false;
    };

    // Helper function for footer
    const addFooter = (pageNum: number) => {
      const footerY = pageHeight - 20;
      doc.setDrawColor(221, 221, 221);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY - 8, rightMargin, footerY - 8);
      
      doc.setFontSize(8);
      doc.setTextColor(102, 102, 102);
      doc.setFont('helvetica', 'normal');
      
      const companyInfo = getCompanyInfo(options.company || 'relocato');
      doc.text(companyInfo.footerLine1, pageWidth / 2, footerY, { align: 'center' });
      doc.text(companyInfo.footerLine2, pageWidth / 2, footerY + 5, { align: 'center' });
      doc.text(`Seite ${pageNum}`, pageWidth / 2, footerY + 10, { align: 'center' });
    };

    // Company Header
    const companyInfo = getCompanyInfo(options.company || 'relocato');
    doc.setFontSize(32);
    doc.setTextColor(51, 51, 51);
    doc.setFont('helvetica', 'bold');
    doc.text(companyInfo.name, pageWidth / 2, yPosition, { align: 'center' });
    
    if (companyInfo.hasRegisteredMark) {
      doc.setFontSize(14);
      doc.text('®', pageWidth / 2 + 30, yPosition - 6);
    }
    
    // Company line
    doc.setDrawColor(companyInfo.primaryColor.r, companyInfo.primaryColor.g, companyInfo.primaryColor.b);
    doc.setLineWidth(3);
    doc.line(margin, yPosition + 8, rightMargin, yPosition + 8);
    yPosition += 20;
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(companyInfo.primaryColor.r, companyInfo.primaryColor.g, companyInfo.primaryColor.b);
    doc.setFont('helvetica', 'bold');
    doc.text('UMZUGSANGEBOT', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Quote Number and Date
    doc.setFontSize(12);
    doc.setTextColor(102, 102, 102);
    doc.setFont('helvetica', 'normal');
    doc.text(`Angebotsnummer: ${quote.id.slice(-8).toUpperCase()}`, margin, yPosition);
    doc.text(`Datum: ${new Date(quote.createdAt).toLocaleDateString('de-DE')}`, rightMargin, yPosition, { align: 'right' });
    yPosition += 15;

    // Customer Information
    doc.setFontSize(14);
    doc.setTextColor(51, 51, 51);
    doc.setFont('helvetica', 'bold');
    doc.text('Kundeninformationen:', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    const customerLines = [
      customer.name,
      customer.company || '',
      customer.address || customer.fromAddress?.split(',')[0] || '',
      `${customer.zip || ''} ${customer.city || customer.fromAddress?.split(',')[1]?.trim() || ''}`.trim(),
      customer.email,
      customer.phone
    ].filter(line => line.trim() !== '');

    customerLines.forEach(line => {
      doc.text(line, margin, yPosition);
      yPosition += 5;
    });
    yPosition += 10;

    // Move Details
    checkNewPage(40);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Umzugsdetails:', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    if (quote.moveDate) {
      doc.text(`Umzugsdatum: ${new Date(quote.moveDate).toLocaleDateString('de-DE')}`, margin, yPosition);
      yPosition += 6;
    }
    
    if (quote.moveFrom || quote.fromAddress) {
      doc.text(`Von: ${quote.moveFrom || quote.fromAddress}`, margin, yPosition);
      yPosition += 6;
    }
    
    if (quote.moveTo || quote.toAddress) {
      doc.text(`Nach: ${quote.moveTo || quote.toAddress}`, margin, yPosition);
      yPosition += 6;
    }
    
    if (quote.volume) {
      doc.text(`Volumen: ${quote.volume} m³`, margin, yPosition);
      yPosition += 6;
    }
    
    if (quote.distance) {
      doc.text(`Entfernung: ${quote.distance} km`, margin, yPosition);
      yPosition += 6;
    }
    yPosition += 10;

    // Services
    checkNewPage(60);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Leistungen:', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    // Base service
    doc.text('• Transport und Verladung', margin + 5, yPosition);
    yPosition += 6;
    
    // Additional services
    const services = [];
    if (quote.packingRequested) services.push('• Verpackungsservice');
    if (quote.furnitureAssemblyPrice && quote.furnitureAssemblyPrice > 0) services.push('• Möbelmontage/-demontage');
    if (quote.cleaningService) services.push(`• Endreinigung (${quote.cleaningHours || 4} Stunden)`);
    if (quote.packingMaterials) services.push(`• Verpackungsmaterial (${quote.boxCount || 20} Kartons)`);
    if (quote.parkingZonePrice && quote.parkingZonePrice > 0) services.push('• Halteverbotszone');
    
    services.forEach(service => {
      doc.text(service, margin + 5, yPosition);
      yPosition += 6;
    });
    yPosition += 10;

    // Pricing
    checkNewPage(50);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Preisübersicht:', margin, yPosition);
    yPosition += 8;

    // Price breakdown
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    let subtotal = quote.price;
    if (quote.discount && quote.discount > 0) {
      const originalPrice = quote.price / (1 - quote.discount / 100);
      doc.text(`Grundpreis:`, margin + 5, yPosition);
      doc.text(`€${originalPrice.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`, rightMargin - 20, yPosition, { align: 'right' });
      yPosition += 6;
      
      doc.text(`Rabatt (${quote.discount}%):`, margin + 5, yPosition);
      doc.text(`-€${((originalPrice - quote.price)).toLocaleString('de-DE', { minimumFractionDigits: 2 })}`, rightMargin - 20, yPosition, { align: 'right' });
      yPosition += 6;
      
      // Line
      doc.setDrawColor(200, 200, 200);
      doc.line(margin + 5, yPosition + 2, rightMargin - 20, yPosition + 2);
      yPosition += 8;
    }

    // Total
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Gesamtpreis:', margin + 5, yPosition);
    doc.text(`€${quote.price.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`, rightMargin - 20, yPosition, { align: 'right' });
    yPosition += 10;

    // VAT info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(102, 102, 102);
    doc.text('Alle Preise inkl. 19% MwSt.', margin + 5, yPosition);
    yPosition += 15;

    // Notes
    if (quote.notes) {
      checkNewPage(30);
      doc.setFontSize(14);
      doc.setTextColor(51, 51, 51);
      doc.setFont('helvetica', 'bold');
      doc.text('Anmerkungen:', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(quote.notes, rightMargin - margin - 10);
      splitNotes.forEach((line: string) => {
        checkNewPage(6);
        doc.text(line, margin + 5, yPosition);
        yPosition += 6;
      });
      yPosition += 10;
    }

    // Terms and Conditions
    if (options.includeTerms !== false) {
      checkNewPage(60);
      doc.setFontSize(12);
      doc.setTextColor(51, 51, 51);
      doc.setFont('helvetica', 'bold');
      doc.text('Geschäftsbedingungen:', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const terms = [
        '• Dieses Angebot ist 30 Tage gültig.',
        '• Die Preise gelten unter der Voraussetzung normaler Arbeitsbedingungen.',
        '• Änderungen des Umzugsvolumens können zu Preisanpassungen führen.',
        '• Zahlung per Rechnung nach Ausführung der Leistung.',
        '• Es gelten unsere allgemeinen Geschäftsbedingungen.',
      ];

      terms.forEach(term => {
        checkNewPage(6);
        doc.text(term, margin, yPosition);
        yPosition += 6;
      });
    }

    // Add footer to all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addFooter(i);
    }

    return doc.output('blob');
  } catch (error) {
    console.error('❌ PDF-Generierung fehlgeschlagen:', error);
    throw new Error(`PDF-Generierung fehlgeschlagen: ${error}`);
  }
};

function getCompanyInfo(company: string) {
  switch (company) {
    case 'wertvoll':
      return {
        name: 'WERTVOLL',
        hasRegisteredMark: false,
        primaryColor: { r: 76, g: 175, b: 80 },
        footerLine1: 'WERTVOLL Entrümpelung | Musterstraße 1, 12345 Musterstadt | Tel: (01234) 567890',
        footerLine2: 'E-Mail: info@wertvoll.de | Web: www.wertvoll.de',
      };
    case 'ruempelschmiede':
      return {
        name: 'RÜMPELSCHMIEDE',
        hasRegisteredMark: false,
        primaryColor: { r: 255, g: 87, b: 34 },
        footerLine1: 'RÜMPELSCHMIEDE | Musterstraße 1, 12345 Musterstadt | Tel: (01234) 567890',
        footerLine2: 'E-Mail: info@ruempelschmiede.de | Web: www.ruempelschmiede.de',
      };
    default: // relocato
      return {
        name: 'RELOCATO',
        hasRegisteredMark: true,
        primaryColor: { r: 139, g: 195, b: 74 },
        footerLine1: 'RELOCATO® Bielefeld | Albrechtstraße 27, 33615 Bielefeld | Tel: (0521) 1200551-0',
        footerLine2: 'E-Mail: bielefeld@relocato.de | Web: www.relocato.de',
      };
  }
}

export const generateInvoicePDF = async (
  customer: Customer,
  invoice: any,
  options: PDFOptions = {}
): Promise<Blob> => {
  // Similar implementation for invoices
  // This would be a separate function with invoice-specific formatting
  throw new Error('Invoice PDF generation not yet implemented');
};

export const generateArbeitsscheinPDF = async (
  customer: Customer,
  quote: Quote,
  signatureData?: any
): Promise<Blob> => {
  // Implementation for work order/receipt PDF
  throw new Error('Arbeitsschein PDF generation not yet implemented');
};