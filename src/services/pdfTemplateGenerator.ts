import { jsPDF } from 'jspdf';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { 
  PDFTemplate, 
  TemplateContentBlock, 
  CompanyBranding,
  PDFGenerationData,
  ContentBlockType
} from '../types/pdfTemplate';
import { pdfTemplateService } from './pdfTemplateService';
import { supabase } from '../config/supabase';

export class PDFTemplateGenerator {
  private doc: jsPDF | null = null;
  private currentY: number = 0;
  private pageNumber: number = 1;
  private pageWidth: number = 0;
  private pageHeight: number = 0;
  private margins: { top: number; right: number; bottom: number; left: number } = { top: 25, right: 25, bottom: 25, left: 25 };

  async generatePDF(data: PDFGenerationData): Promise<Blob> {
    try {
      const { template, branding, customer, quote, invoice, services, variables } = data;

      // Initialize jsPDF with template settings
      this.initializeDocument(template);

      // Get all content blocks sorted by page and position
      const contentBlocks = template.contentBlocks || [];
      const pageGroups = this.groupBlocksByPage(contentBlocks);

      // Process each page
      for (const [pageNum, blocks] of Object.entries(pageGroups)) {
        if (parseInt(pageNum) > 1 && this.doc) {
          this.doc.addPage();
          this.pageNumber = parseInt(pageNum);
        }

        // Process blocks in order
        for (const block of blocks) {
          if (block.isVisible) {
            await this.renderBlock(block, data);
          }
        }
      }

      return this.doc!.output('blob');
    } catch (error) {
      console.error('Error generating PDF from template:', error);
      throw error;
    }
  }

  private initializeDocument(template: PDFTemplate) {
    const { format, orientation, margins } = template.pageSettings;
    
    this.doc = new jsPDF({
      orientation: orientation,
      format: format.toLowerCase() as any,
      unit: 'mm'
    });

    this.margins = margins;
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.currentY = margins.top;
  }

  private groupBlocksByPage(blocks: TemplateContentBlock[]): Record<number, TemplateContentBlock[]> {
    const groups: Record<number, TemplateContentBlock[]> = {};
    
    blocks.forEach(block => {
      const page = block.pageNumber || 1;
      if (!groups[page]) {
        groups[page] = [];
      }
      groups[page].push(block);
    });

    // Sort blocks within each page by position
    Object.values(groups).forEach(pageBlocks => {
      pageBlocks.sort((a, b) => a.position - b.position);
    });

    return groups;
  }

  private async renderBlock(block: TemplateContentBlock, data: PDFGenerationData) {
    const { blockType, xPosition, yPosition, width, height, settings, content } = block;

    // Set position
    const x = xPosition || this.margins.left;
    const y = yPosition || this.currentY;

    // Apply block settings
    this.applyBlockSettings(settings);

    // Render based on block type
    switch (blockType) {
      case 'logo':
        await this.renderLogo(x, y, width || 50, height || 50, data.branding || undefined);
        break;
      case 'header':
        this.renderHeader(x, y, width || (this.pageWidth - this.margins.left - this.margins.right), content, data);
        break;
      case 'footer':
        this.renderFooter(content, data);
        break;
      case 'company_info':
        this.renderCompanyInfo(x, y, data.branding, content);
        break;
      case 'customer_info':
        this.renderCustomerInfo(x, y, data.customer, content);
        break;
      case 'service_list':
        this.renderServiceList(x, y, width || (this.pageWidth - this.margins.left - this.margins.right), data.services || [], content);
        break;
      case 'pricing_table':
        this.renderPricingTable(x, y, width || (this.pageWidth - this.margins.left - this.margins.right), data, content);
        break;
      case 'terms':
        this.renderTerms(x, y, width || (this.pageWidth - this.margins.left - this.margins.right), content);
        break;
      case 'signature':
        this.renderSignatureBlock(x, y, width || (this.pageWidth - this.margins.left - this.margins.right), content);
        break;
      case 'custom':
        this.renderCustomBlock(x, y, width || (this.pageWidth - this.margins.left - this.margins.right), content, data);
        break;
    }

    // Update current Y position if not fixed
    if (!yPosition && height) {
      this.currentY = y + height;
    }
  }

  private applyBlockSettings(settings: any) {
    if (!this.doc) return;

    // Font settings
    if (settings.font) {
      const { family = 'helvetica', size = 10, weight = 'normal', style = 'normal' } = settings.font;
      this.doc.setFont(family, weight === 'bold' ? 'bold' : style);
      this.doc.setFontSize(size);
    }

    // Color settings
    if (settings.color) {
      const rgb = this.hexToRgb(settings.color);
      if (rgb) {
        this.doc.setTextColor(rgb.r, rgb.g, rgb.b);
      }
    }

    // Background color
    if (settings.backgroundColor && settings.backgroundColor !== 'transparent') {
      // This would need to be implemented with rectangles
    }
  }

  private async renderLogo(x: number, y: number, width: number, height: number, branding?: CompanyBranding) {
    if (!this.doc || !branding?.logoUrl) return;

    try {
      // Fetch logo from URL
      const response = await fetch(branding.logoUrl);
      const blob = await response.blob();
      const dataUrl = await this.blobToDataUrl(blob);

      // Add image to PDF
      const imgWidth = width || 40;
      const imgHeight = height || 20;
      this.doc.addImage(dataUrl, 'PNG', x, y, imgWidth, imgHeight);
    } catch (error) {
      console.error('Error rendering logo:', error);
    }
  }

  private renderHeader(x: number, y: number, width: number, content: any, data: PDFGenerationData) {
    if (!this.doc) return;

    const text = this.processTemplate(content.template || content.text || '', data);
    const lines = this.doc.splitTextToSize(text, width || this.pageWidth - this.margins.left - this.margins.right);
    
    const doc = this.doc; // Capture reference for TypeScript
    lines.forEach((line: string, index: number) => {
      doc.text(line, x, y + (index * 5));
    });
  }

  private renderFooter(content: any, data: PDFGenerationData) {
    if (!this.doc) return;

    const footerY = this.pageHeight - this.margins.bottom + 10;
    const text = this.processTemplate(content.template || content.text || '', data);
    
    this.doc.setFontSize(8);
    this.doc.text(text, this.pageWidth / 2, footerY, { align: 'center' });
  }

  private renderCompanyInfo(x: number, y: number, branding: CompanyBranding | null | undefined, content: any) {
    if (!this.doc) return;

    const companyData = content.data || {};
    let currentY = y;
    const lineHeight = 5;

    // Company name
    if (companyData.name) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(companyData.name, x, currentY);
      currentY += lineHeight;
    }

    this.doc.setFont('helvetica', 'normal');

    // Address
    if (companyData.address) {
      this.doc.text(companyData.address, x, currentY);
      currentY += lineHeight;
    }

    // Contact info
    if (companyData.phone) {
      this.doc.text(`Tel: ${companyData.phone}`, x, currentY);
      currentY += lineHeight;
    }

    if (companyData.email) {
      this.doc.text(`Email: ${companyData.email}`, x, currentY);
      currentY += lineHeight;
    }
  }

  private renderCustomerInfo(x: number, y: number, customer: any, content: any) {
    if (!this.doc || !customer) return;

    let currentY = y;
    const lineHeight = 5;

    // Customer name
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(customer.name || 'Kunde', x, currentY);
    currentY += lineHeight;

    this.doc.setFont('helvetica', 'normal');

    // Address
    if (customer.address || customer.toAddress) {
      const address = customer.address || customer.toAddress;
      const addressLines = this.doc.splitTextToSize(address, 80);
      const doc = this.doc; // Capture reference for TypeScript
      addressLines.forEach((line: string) => {
        doc.text(line, x, currentY);
        currentY += lineHeight;
      });
    }

    // Contact info
    if (customer.email) {
      this.doc.text(customer.email, x, currentY);
      currentY += lineHeight;
    }

    if (customer.phone) {
      this.doc.text(customer.phone, x, currentY);
    }
  }

  private renderServiceList(x: number, y: number, width: number, services: any[], content: any) {
    if (!this.doc) return;

    let currentY = y;
    const lineHeight = 6;

    // Title
    if (content.title) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(content.title, x, currentY);
      currentY += lineHeight + 2;
    }

    // Services
    this.doc.setFont('helvetica', 'normal');
    const doc = this.doc; // Capture reference for TypeScript
    services.forEach(service => {
      const text = `• ${service.serviceName}${service.quantity ? ` (${service.quantity} ${service.unit || ''})` : ''}`;
      const lines = doc.splitTextToSize(text, width || 150);
      lines.forEach((line: string) => {
        doc.text(line, x + 5, currentY);
        currentY += lineHeight;
      });
    });
  }

  private renderPricingTable(x: number, y: number, width: number, data: PDFGenerationData, content: any) {
    if (!this.doc) return;

    const tableWidth = width || this.pageWidth - this.margins.left - this.margins.right;
    let currentY = y;

    // Table header
    this.doc.setFillColor(240, 240, 240);
    this.doc.rect(x, currentY, tableWidth, 8, 'F');
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Beschreibung', x + 2, currentY + 5);
    this.doc.text('Menge', x + tableWidth - 40, currentY + 5, { align: 'center' });
    this.doc.text('Preis', x + tableWidth - 2, currentY + 5, { align: 'right' });
    currentY += 10;

    // Table rows
    this.doc.setFont('helvetica', 'normal');
    const items = content.items || [];
    let subtotal = 0;

    const doc = this.doc; // Capture reference for TypeScript
    items.forEach((item: any) => {
      doc.text(item.description || item.name, x + 2, currentY + 5);
      doc.text(String(item.quantity || '1'), x + tableWidth - 40, currentY + 5, { align: 'center' });
      const price = item.price || 0;
      doc.text(`€ ${price.toFixed(2)}`, x + tableWidth - 2, currentY + 5, { align: 'right' });
      subtotal += price;
      currentY += 8;
    });

    // Subtotal
    currentY += 5;
    this.doc.line(x + tableWidth - 50, currentY, x + tableWidth, currentY);
    currentY += 5;
    this.doc.text('Zwischensumme:', x + tableWidth - 50, currentY);
    this.doc.text(`€ ${subtotal.toFixed(2)}`, x + tableWidth - 2, currentY, { align: 'right' });

    // VAT
    const vat = subtotal * 0.19;
    currentY += 6;
    this.doc.text('MwSt. 19%:', x + tableWidth - 50, currentY);
    this.doc.text(`€ ${vat.toFixed(2)}`, x + tableWidth - 2, currentY, { align: 'right' });

    // Total
    currentY += 6;
    this.doc.setLineWidth(2);
    this.doc.line(x + tableWidth - 50, currentY - 2, x + tableWidth, currentY - 2);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Gesamtbetrag:', x + tableWidth - 50, currentY + 3);
    this.doc.text(`€ ${(subtotal + vat).toFixed(2)}`, x + tableWidth - 2, currentY + 3, { align: 'right' });
  }

  private renderTerms(x: number, y: number, width: number, content: any) {
    if (!this.doc) return;

    let currentY = y;

    // Title
    if (content.title) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(content.title, x, currentY);
      currentY += 8;
    }

    // Terms text
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    const termsText = content.text || content.template || '';
    const lines = this.doc.splitTextToSize(termsText, width || this.pageWidth - this.margins.left - this.margins.right);
    
    const doc = this.doc; // Capture reference for TypeScript
    lines.forEach((line: string) => {
      doc.text(line, x, currentY);
      currentY += 5;
    });
  }

  private renderSignatureBlock(x: number, y: number, width: number, content: any) {
    if (!this.doc) return;

    const blockWidth = width || this.pageWidth - this.margins.left - this.margins.right;
    const signatureWidth = (blockWidth - 20) / 2;

    // Signature lines
    this.doc.setDrawColor(0, 0, 0);
    this.doc.line(x, y + 30, x + signatureWidth, y + 30);
    this.doc.line(x + blockWidth - signatureWidth, y + 30, x + blockWidth, y + 30);

    // Labels
    this.doc.setFontSize(8);
    this.doc.text(content.leftLabel || 'Ort, Datum', x + signatureWidth / 2, y + 35, { align: 'center' });
    this.doc.text(content.rightLabel || 'Unterschrift', x + blockWidth - signatureWidth / 2, y + 35, { align: 'center' });
  }

  private renderCustomBlock(x: number, y: number, width: number, content: any, data: PDFGenerationData) {
    if (!this.doc) return;

    // Process template if provided
    const text = content.template 
      ? this.processTemplate(content.template, data)
      : content.text || '';

    const lines = this.doc.splitTextToSize(text, width || this.pageWidth - this.margins.left - this.margins.right);
    
    const doc = this.doc; // Capture reference for TypeScript
    lines.forEach((line: string, index: number) => {
      doc.text(line, x, y + (index * 5));
    });
  }

  private processTemplate(template: string, data: PDFGenerationData): string {
    // Simple template processing - replace {{variable}} with actual values
    let processed = template;
    
    // Replace customer variables
    if (data.customer) {
      Object.entries(data.customer).forEach(([key, value]) => {
        const regex = new RegExp(`{{customer.${key}}}`, 'g');
        processed = processed.replace(regex, String(value || ''));
      });
    }

    // Replace quote variables
    if (data.quote) {
      Object.entries(data.quote).forEach(([key, value]) => {
        const regex = new RegExp(`{{quote.${key}}}`, 'g');
        processed = processed.replace(regex, String(value || ''));
      });
    }

    // Replace custom variables
    if (data.variables) {
      Object.entries(data.variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        processed = processed.replace(regex, String(value || ''));
      });
    }

    // Replace date variables
    processed = processed.replace(/{{date}}/g, new Date().toLocaleDateString('de-DE'));
    processed = processed.replace(/{{year}}/g, new Date().getFullYear().toString());

    return processed;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  private async blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Enhanced PDF generation with letterhead support
  async generatePDFWithLetterhead(data: PDFGenerationData): Promise<Blob> {
    try {
      const { template, branding } = data;

      // If letterhead is provided, use pdf-lib for better background image support
      if (branding?.letterheadUrl) {
        return await this.generateWithPDFLib(data);
      }

      // Otherwise use standard jsPDF generation
      return await this.generatePDF(data);
    } catch (error) {
      console.error('Error generating PDF with letterhead:', error);
      throw error;
    }
  }

  private async generateWithPDFLib(data: PDFGenerationData): Promise<Blob> {
    const { template, branding, customer, quote, invoice } = data;
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Add letterhead as background if provided
    if (branding?.letterheadUrl) {
      try {
        const letterheadBytes = await fetch(branding.letterheadUrl).then(res => res.arrayBuffer());
        const letterheadImage = await pdfDoc.embedPng(new Uint8Array(letterheadBytes));
        
        // Add pages with letterhead
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        
        // Draw letterhead as background
        page.drawImage(letterheadImage, {
          x: 0,
          y: 0,
          width: width,
          height: height,
          opacity: 1
        });
      } catch (error) {
        console.error('Error embedding letterhead:', error);
      }
    }

    // Convert to blob
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }
}

export const pdfTemplateGenerator = new PDFTemplateGenerator();

// Export function for PDFPreview component
export const generatePDFFromTemplate = async (
  template: PDFTemplate,
  contentBlocks: TemplateContentBlock[],
  companyBranding?: CompanyBranding | null,
  sampleData?: any
): Promise<Blob> => {
  const data: PDFGenerationData = {
    template: { ...template, contentBlocks },
    branding: companyBranding || null,
    customer: sampleData?.customer || {},
    quote: sampleData?.quote,
    invoice: sampleData?.invoice,
    services: [],
    variables: {}
  };
  
  return pdfTemplateGenerator.generatePDF(data);
};