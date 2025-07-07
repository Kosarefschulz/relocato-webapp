import { Customer, Invoice } from '../types';
import { CompanyType } from '../types/company';
import { PDFGenerationData } from '../types/pdfTemplate';
import { pdfTemplateService } from './pdfTemplateService';
import { pdfTemplateGenerator } from './pdfTemplateGenerator';
import { generatePDF as generateLegacyPDF } from './pdfService';
import { generateWertvollPDF } from './pdfServiceWertvoll';
import { generateRuempelschmiedePDF } from './pdfServiceRuempelschmiede';

interface QuoteData {
  id?: string;
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
  company?: string;
}

/**
 * Enhanced PDF generation service that uses templates when available
 * Falls back to legacy PDF generation if no template is found
 */
export class PDFServiceWithTemplates {
  async generateQuotePDF(
    customer: Customer, 
    quote: QuoteData,
    useTemplate: boolean = true
  ): Promise<Blob> {
    try {
      const companyType = (quote.company || 'relocato') as CompanyType;

      // Try to use template if enabled
      if (useTemplate) {
        const templates = await pdfTemplateService.getTemplates(companyType, 'quote');
        const activeTemplate = templates.find(t => t.isActive);

        if (activeTemplate) {
          return await this.generateWithTemplate(activeTemplate.id, customer, quote);
        }
      }

      // Fallback to legacy PDF generation
      return await this.generateLegacyPDF(customer, quote);
    } catch (error) {
      console.error('Error in PDF generation:', error);
      // Final fallback to legacy generation
      return await this.generateLegacyPDF(customer, quote);
    }
  }

  async generateInvoicePDF(
    customer: Customer,
    invoice: Invoice,
    useTemplate: boolean = true
  ): Promise<Blob> {
    try {
      const companyType = (invoice.company || 'relocato') as CompanyType;

      // Try to use template if enabled
      if (useTemplate) {
        const templates = await pdfTemplateService.getTemplates(companyType, 'invoice');
        const activeTemplate = templates.find(t => t.isActive);

        if (activeTemplate) {
          return await this.generateWithTemplate(activeTemplate.id, customer, null, invoice);
        }
      }

      // Fallback to legacy PDF generation
      const { generateInvoicePDF } = await import('./pdfService');
      return await generateInvoicePDF(customer, invoice);
    } catch (error) {
      console.error('Error in invoice PDF generation:', error);
      // Final fallback
      const { generateInvoicePDF } = await import('./pdfService');
      return await generateInvoicePDF(customer, invoice);
    }
  }

  private async generateWithTemplate(
    templateId: string,
    customer: Customer,
    quote?: QuoteData | null,
    invoice?: Invoice | null
  ): Promise<Blob> {
    // Load template with all content blocks
    const template = await pdfTemplateService.getTemplate(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Load branding
    const branding = await pdfTemplateService.getBranding(template.companyType);

    // Load services if needed
    const services = await pdfTemplateService.getServices(template.companyType);

    // Prepare generation data
    const data: PDFGenerationData = {
      template,
      branding: branding || {
        id: '',
        companyType: template.companyType,
        primaryColor: '#000000',
        secondaryColor: '#666666',
        accentColor: '#0066CC',
        fontFamily: 'Helvetica',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      customer,
      quote: quote || undefined,
      invoice: invoice || undefined,
      services,
      variables: this.prepareVariables(customer, quote, invoice)
    };

    // Generate PDF with template
    if (branding?.letterheadUrl) {
      return await pdfTemplateGenerator.generatePDFWithLetterhead(data);
    } else {
      return await pdfTemplateGenerator.generatePDF(data);
    }
  }

  private async generateLegacyPDF(
    customer: Customer,
    quote: QuoteData
  ): Promise<Blob> {
    const companyType = quote.company as CompanyType;

    // Ensure quote has an id for functions that require it
    const quoteWithId = {
      ...quote,
      id: quote.id || `temp-${Date.now()}`
    };

    switch (companyType) {
      case 'wertvoll':
        return await generateWertvollPDF(customer, quoteWithId as any);
      case 'ruempelschmiede':
        return await generateRuempelschmiedePDF(customer, quoteWithId as any);
      default:
        return await generateLegacyPDF(customer, quoteWithId as any);
    }
  }

  private prepareVariables(
    customer: Customer,
    quote?: QuoteData | null,
    invoice?: Invoice | null
  ): Record<string, any> {
    const now = new Date();
    const variables: Record<string, any> = {
      date: now.toLocaleDateString('de-DE'),
      year: now.getFullYear(),
      month: now.toLocaleDateString('de-DE', { month: 'long' }),
      time: now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    };

    if (quote) {
      const validUntil = new Date(quote.createdAt);
      validUntil.setDate(validUntil.getDate() + 14);

      variables.quoteNumber = quote.id || `Q-${Date.now()}`;
      variables.quoteDate = new Date(quote.createdAt).toLocaleDateString('de-DE');
      variables.quoteValidUntil = validUntil.toLocaleDateString('de-DE');
      variables.quoteTotal = quote.price;
      variables.quoteTotalFormatted = `€ ${quote.price.toFixed(2).replace('.', ',')}`;
    }

    if (invoice) {
      variables.invoiceNumber = invoice.invoiceNumber;
      variables.invoiceDate = new Date(invoice.createdAt).toLocaleDateString('de-DE');
      variables.invoiceDueDate = new Date(invoice.dueDate).toLocaleDateString('de-DE');
      variables.invoiceTotal = invoice.totalPrice;
      variables.invoiceTotalFormatted = `€ ${invoice.totalPrice.toFixed(2).replace('.', ',')}`;
    }

    return variables;
  }
}

export const pdfServiceWithTemplates = new PDFServiceWithTemplates();