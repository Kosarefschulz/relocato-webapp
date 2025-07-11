import { Customer, Quote, Invoice, Consultant, CustomerNote } from '../../types';
import { databaseService } from '../databaseAbstraction';
import { paginationService } from '../paginationService';
import { quoteCalculationService } from '../quoteCalculation';
import { sendEmail } from '../emailService';
import emailTemplateService from '../emailTemplateService';
import { pdfService } from '../pdfServiceWrapper';

export interface AIContext {
  customers: Customer[];
  quotes: Quote[];
  invoices: Invoice[];
  consultants: Consultant[];
  customerNotes: CustomerNote[];
  emailTemplates: any[];
  priceCalculations: typeof quoteCalculationService;
}

export class AIContextManager {
  private context: Partial<AIContext> = {};
  private lastUpdate: Date = new Date();
  private updateInterval = 5 * 60 * 1000; // 5 minutes

  async getFullContext(): Promise<AIContext> {
    if (this.shouldUpdateContext()) {
      await this.updateContext();
    }
    
    return this.context as AIContext;
  }

  async getCustomerContext(customerId: string): Promise<{
    customer: Customer | null;
    quotes: Quote[];
    invoices: Invoice[];
    notes: CustomerNote[];
    emails: any[];
  }> {
    const customer = await databaseService.getCustomer(customerId);
    if (!customer) {
      return {
        customer: null,
        quotes: [],
        invoices: [],
        notes: [],
        emails: []
      };
    }

    const [quotes, invoices] = await Promise.all([
      databaseService.getQuotesByCustomerId(customerId),
      databaseService.getInvoices().then(allInvoices => 
        allInvoices.filter(invoice => invoice.customerId === customerId)
      )
    ]);
    
    // Customer notes are part of the customer object
    const notes = customer.extendedNotes || [];

    const emails: any[] = [];

    return {
      customer,
      quotes,
      invoices,
      notes,
      emails
    };
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    const allCustomers = await this.getAllCustomers();
    const searchTerm = query.toLowerCase();

    return allCustomers.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm) ||
      customer.phone?.includes(searchTerm) ||
      customer.city?.toLowerCase().includes(searchTerm) ||
      customer.company?.toLowerCase().includes(searchTerm)
    );
  }

  async getQuoteCalculationContext(): Promise<{
    priceTable: any;
    additionalServices: any;
    calculateQuote: (params: any) => any;
  }> {
    return {
      priceTable: (quoteCalculationService as any).priceTable,
      additionalServices: quoteCalculationService.getAvailableServices(),
      calculateQuote: (params) => quoteCalculationService.calculateQuote(params.customer, params)
    };
  }

  async getEmailContext(): Promise<{
    templates: any[];
    sendEmail: (params: any) => Promise<any>;
  }> {
    const templates = await emailTemplateService.getAllTemplates();
    
    return {
      templates,
      sendEmail: async (params) => {
        return await sendEmail(params);
      }
    };
  }

  async generatePDF(type: 'quote' | 'invoice', data: any): Promise<Blob> {
    if (type === 'quote') {
      return await pdfService.generatePDF(data.customer, data.quote);
    } else {
      return await pdfService.generateInvoicePDF(data.customer, data.invoice);
    }
  }

  private async updateContext(): Promise<void> {
    try {
      const [customers, quotes, invoices, emailTemplates] = await Promise.all([
        this.getAllCustomers(),
        this.getAllQuotes(),
        this.getAllInvoices(),
        emailTemplateService.getAllTemplates()
      ]);

      this.context = {
        customers,
        quotes,
        invoices,
        consultants: [], // TODO: Implement consultants loading
        emailTemplates,
        priceCalculations: quoteCalculationService,
        customerNotes: [] // TODO: Implement customer notes loading
      };

      this.lastUpdate = new Date();
    } catch (error) {
      console.error('Error updating AI context:', error);
      throw error;
    }
  }

  private shouldUpdateContext(): boolean {
    const now = new Date();
    return now.getTime() - this.lastUpdate.getTime() > this.updateInterval;
  }

  private async getAllCustomers(): Promise<Customer[]> {
    // Load initial batch first
    const initialResult = await paginationService.loadInitialCustomers({ pageSize: 500 });
    const allCustomers: Customer[] = [...initialResult.data];
    let lastDoc = initialResult.lastDoc;
    let hasMore = initialResult.hasMore;

    // Load remaining customers if any
    while (hasMore && lastDoc) {
      const result = await paginationService.loadMoreCustomers(lastDoc, { pageSize: 20 });
      allCustomers.push(...result.data);
      lastDoc = result.lastDoc;
      hasMore = result.hasMore;
    }

    return allCustomers;
  }

  private async getAllQuotes(): Promise<Quote[]> {
    // Just return all quotes from database service for now
    return await databaseService.getQuotes();
  }

  private async getAllInvoices(): Promise<Invoice[]> {
    // Just return all invoices from database service for now
    return await databaseService.getInvoices();
  }

  async getSystemCapabilities(): Promise<string> {
    return `
    Umzugsapp System Capabilities:
    
    1. Customer Management:
       - Create, read, update, delete customers
       - Search customers by name, email, phone, city, company
       - Add notes and tags to customers
       - Track customer priority and status
    
    2. Quote Management:
       - Create professional moving quotes
       - Calculate prices based on volume (5-100m³)
       - Add additional services (packing, assembly, cleaning, etc.)
       - Apply distance and floor surcharges
       - Generate PDF quotes with signatures
       - Track quote versions and history
    
    3. Invoice Management:
       - Create and manage invoices
       - Track payment status
       - Generate PDF invoices
       - Link invoices to customers and quotes
    
    4. Email Communication:
       - Send emails via SendGrid or IONOS SMTP
       - Use email templates with variables
       - Attach PDFs and other files
       - Track email history per customer
       - Import EML files
    
    5. Price Calculation:
       - Volume-based pricing (5-100m³)
       - Additional services pricing
       - Distance surcharges (per km)
       - Floor surcharges
       - Manual price adjustments
    
    6. Document Generation:
       - Generate professional PDF quotes
       - Generate PDF invoices
       - Digital signature support
       - Custom branding options
    
    7. Data Storage:
       - Supabase PostgreSQL for all data
       - File storage in Supabase Storage
       - Real-time data synchronization
    
    8. User Management:
       - Admin and consultant roles
       - Supabase Authentication
       - Role-based access control
    `;
  }
}