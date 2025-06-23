import { OpenAIService } from './openaiService';
import { AIContextManager } from './aiContextManager';
import { Customer, Quote, Invoice } from '../../types';
import { firebaseService } from '../firebaseService';
import { emailService } from '../emailService';
import { pdfService } from '../pdfService';
import { quoteCalculationService } from '../quoteCalculation';

export interface AIAssistantConfig {
  apiKey: string;
  model?: string;
}

export interface AIAction {
  type: 'create_quote' | 'create_invoice' | 'send_email' | 'search_customer' | 
        'update_customer' | 'generate_pdf' | 'calculate_price' | 'get_info';
  data: any;
}

export class AIAssistantService {
  private openai: OpenAIService;
  private contextManager: AIContextManager;

  constructor(config: AIAssistantConfig) {
    this.openai = new OpenAIService({
      apiKey: config.apiKey,
      model: config.model || 'gpt-4o'
    });
    this.contextManager = new AIContextManager();
  }

  async processCommand(command: string, context?: any): Promise<{
    response: string;
    actions?: AIAction[];
    data?: any;
  }> {
    try {
      const systemCapabilities = await this.contextManager.getSystemCapabilities();
      const currentContext = context || await this.contextManager.getFullContext();

      const systemPrompt = `
Du bist ein KI-Assistent für die Umzugsapp. Du hast Zugriff auf alle Funktionen der App und kannst:
- Kunden verwalten (erstellen, suchen, aktualisieren)
- Angebote erstellen und kalkulieren
- Rechnungen erstellen
- E-Mails versenden
- PDFs generieren
- Preise berechnen

${systemCapabilities}

Aktuelle Daten:
- ${currentContext.customers?.length || 0} Kunden
- ${currentContext.quotes?.length || 0} Angebote
- ${currentContext.invoices?.length || 0} Rechnungen

Antworte auf Deutsch und führe die angeforderten Aktionen aus.
Gib strukturierte Aktionen zurück, die ausgeführt werden sollen.
`;

      const functions = this.getAIFunctions();
      
      const result = await this.openai.generateWithFunctions(
        command,
        systemPrompt,
        functions
      );

      if (result.functionCall) {
        const actions = await this.processFunctionCall(
          result.functionCall.name,
          result.functionCall.arguments
        );
        
        return {
          response: result.content || 'Aktion wird ausgeführt...',
          actions,
          data: result.functionCall.arguments
        };
      }

      return {
        response: result.content || 'Keine Aktion erkannt.'
      };
    } catch (error) {
      console.error('AI Assistant Error:', error);
      return {
        response: `Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
      };
    }
  }

  async executeAction(action: AIAction): Promise<any> {
    switch (action.type) {
      case 'create_quote':
        return await this.createQuote(action.data);
      
      case 'create_invoice':
        return await this.createInvoice(action.data);
      
      case 'send_email':
        return await this.sendEmail(action.data);
      
      case 'search_customer':
        return await this.searchCustomer(action.data);
      
      case 'update_customer':
        return await this.updateCustomer(action.data);
      
      case 'generate_pdf':
        return await this.generatePDF(action.data);
      
      case 'calculate_price':
        return await this.calculatePrice(action.data);
      
      case 'get_info':
        return await this.getInfo(action.data);
      
      default:
        throw new Error(`Unbekannte Aktion: ${action.type}`);
    }
  }

  private async createQuote(data: any): Promise<Quote> {
    const customer = await firebaseService.getCustomer(data.customerId);
    if (!customer) {
      throw new Error('Kunde nicht gefunden');
    }

    const calculation = quoteCalculationService.calculateQuote(customer, {
      volume: data.volume || 30,
      distance: data.distance || 50,
      floors: data.floors || { pickup: 0, delivery: 0 },
      additionalServices: data.additionalServices || [],
      manualAdjustment: data.manualAdjustment || 0
    });

    const quote: Partial<Quote> = {
      customerId: data.customerId,
      customerName: customer.name,
      customerEmail: customer.email,
      date: new Date().toISOString(),
      volume: data.volume || 30,
      distance: data.distance || 50,
      services: data.services || ['Transport'],
      pricing: calculation,
      status: 'draft',
      notes: data.notes || '',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    const quoteId = await firebaseService.createQuote(quote as Quote);
    return { ...quote, id: quoteId } as Quote;
  }

  private async createInvoice(data: any): Promise<Invoice> {
    const customer = await firebaseService.getCustomer(data.customerId);
    if (!customer) {
      throw new Error('Kunde nicht gefunden');
    }

    const invoice: Partial<Invoice> = {
      customerId: data.customerId,
      customerName: customer.name,
      quoteId: data.quoteId,
      invoiceNumber: await this.generateInvoiceNumber(),
      date: new Date().toISOString(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      items: data.items || [],
      subtotal: data.subtotal || 0,
      tax: data.tax || 0,
      total: data.total || 0,
      status: 'unpaid',
      notes: data.notes || ''
    };

    const invoiceId = await firebaseService.createInvoice(invoice as Invoice);
    return { ...invoice, id: invoiceId } as Invoice;
  }

  private async sendEmail(data: any): Promise<any> {
    const { to, subject, html, attachments } = data;
    
    return await emailService.sendEmail({
      to,
      subject,
      html,
      attachments
    });
  }

  private async searchCustomer(data: any): Promise<Customer[]> {
    return await this.contextManager.searchCustomers(data.query);
  }

  private async updateCustomer(data: any): Promise<void> {
    const { customerId, updates } = data;
    await firebaseService.updateCustomer(customerId, updates);
  }

  private async generatePDF(data: any): Promise<Blob> {
    return await this.contextManager.generatePDF(data.type, data);
  }

  private async calculatePrice(data: any): Promise<any> {
    return quoteCalculationService.calculateQuote({} as Customer, data);
  }

  private async getInfo(data: any): Promise<any> {
    const { type, id } = data;
    
    switch (type) {
      case 'customer':
        return await this.contextManager.getCustomerContext(id);
      case 'quote':
        return await firebaseService.getQuote(id);
      case 'invoice':
        return await firebaseService.getInvoice(id);
      default:
        return null;
    }
  }

  private async processFunctionCall(
    functionName: string,
    args: any
  ): Promise<AIAction[]> {
    const actionMap: { [key: string]: AIAction['type'] } = {
      'create_quote': 'create_quote',
      'create_invoice': 'create_invoice',
      'send_email': 'send_email',
      'search_customer': 'search_customer',
      'update_customer': 'update_customer',
      'generate_pdf': 'generate_pdf',
      'calculate_price': 'calculate_price',
      'get_info': 'get_info'
    };

    const actionType = actionMap[functionName];
    if (!actionType) {
      throw new Error(`Unbekannte Funktion: ${functionName}`);
    }

    return [{
      type: actionType,
      data: args
    }];
  }

  private getAIFunctions(): any[] {
    return [
      {
        name: 'create_quote',
        description: 'Erstelle ein neues Angebot für einen Kunden',
        parameters: {
          type: 'object',
          properties: {
            customerId: { type: 'string', description: 'Kunden-ID' },
            volume: { type: 'number', description: 'Volumen in m³' },
            distance: { type: 'number', description: 'Entfernung in km' },
            floors: { 
              type: 'object',
              properties: {
                pickup: { type: 'number' },
                delivery: { type: 'number' }
              }
            },
            additionalServices: { 
              type: 'array',
              items: { type: 'string' }
            },
            notes: { type: 'string' }
          },
          required: ['customerId']
        }
      },
      {
        name: 'create_invoice',
        description: 'Erstelle eine neue Rechnung',
        parameters: {
          type: 'object',
          properties: {
            customerId: { type: 'string' },
            quoteId: { type: 'string' },
            items: { type: 'array' },
            subtotal: { type: 'number' },
            tax: { type: 'number' },
            total: { type: 'number' },
            notes: { type: 'string' }
          },
          required: ['customerId', 'items', 'total']
        }
      },
      {
        name: 'send_email',
        description: 'Sende eine E-Mail',
        parameters: {
          type: 'object',
          properties: {
            to: { type: 'string' },
            subject: { type: 'string' },
            html: { type: 'string' },
            attachments: { type: 'array' }
          },
          required: ['to', 'subject', 'html']
        }
      },
      {
        name: 'search_customer',
        description: 'Suche nach Kunden',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string' }
          },
          required: ['query']
        }
      },
      {
        name: 'calculate_price',
        description: 'Berechne Preise für einen Umzug',
        parameters: {
          type: 'object',
          properties: {
            volume: { type: 'number' },
            distance: { type: 'number' },
            floors: { type: 'object' },
            additionalServices: { type: 'array' }
          },
          required: ['volume']
        }
      }
    ];
  }

  private async generateInvoiceNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `RE-${year}${month}-${random}`;
  }
}