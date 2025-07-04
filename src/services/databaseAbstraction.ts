import { supabaseService } from './supabaseService';
import { 
  Customer, 
  Quote, 
  Invoice, 
  EmailHistory, 
  ShareLink,
  CalendarEvent 
} from '../types';

export interface DatabaseService {
  // Initialization
  initialize(): Promise<void>;
  testConnection(): Promise<void>;
  isAvailable(): boolean;

  // Customer operations
  getCustomers(): Promise<Customer[]>;
  getCustomer(customerId: string): Promise<Customer | null>;
  addCustomer(customer: Omit<Customer, 'id'>): Promise<string>;
  updateCustomer(customerId: string, updates: Partial<Customer>): Promise<void>;
  deleteCustomer(customerId: string): Promise<void>;
  searchCustomers(searchTerm: string): Promise<Customer[]>;

  // Quote operations
  getQuotes(): Promise<Quote[]>;
  getQuote(quoteId: string): Promise<Quote | null>;
  getQuotesByCustomerId(customerId: string): Promise<Quote[]>;
  addQuote(quote: Quote): Promise<string>;
  updateQuote(quoteId: string, updates: Partial<Quote>): Promise<void>;
  deleteQuote(quoteId: string): Promise<void>;

  // Invoice operations
  getInvoices(): Promise<Invoice[]>;
  getInvoice(invoiceId: string): Promise<Invoice | null>;
  addInvoice(invoice: Invoice): Promise<string>;
  updateInvoice(invoiceId: string, updates: Partial<Invoice>): Promise<void>;

  // ShareLink operations
  createShareLink(customerId: string, quoteId: string, expiresIn?: number): Promise<ShareLink>;
  getShareLinkByToken(token: string): Promise<ShareLink | null>;
  updateShareLink(token: string, updates: Partial<ShareLink>): Promise<void>;

  // Email history operations
  addEmailHistory(emailHistory: EmailHistory): Promise<string>;
  getEmailHistory(customerId?: string): Promise<EmailHistory[]>;

  // Calendar operations
  getCalendarEvents(startDate?: Date, endDate?: Date): Promise<CalendarEvent[]>;
  addCalendarEvent(event: CalendarEvent): Promise<string>;

  // Real-time subscriptions
  subscribeToCustomers(callback: (customers: Customer[]) => void): () => void;
  subscribeToQuotes(callback: (quotes: Quote[]) => void): () => void;
  subscribeToInvoices(callback: (invoices: Invoice[]) => void): () => void;
}

// Database service configuration
export const DATABASE_CONFIG = {
  provider: process.env.REACT_APP_DATABASE_PROVIDER || 'supabase', // 'firebase' or 'supabase' - Firebase is disabled
  autoSwitch: process.env.REACT_APP_DATABASE_AUTO_SWITCH === 'true',
  fallbackToFirebase: false // Firebase is disabled, no fallback to Firebase
};

class DatabaseAbstractionService implements DatabaseService {
  private primaryService: DatabaseService;
  private fallbackService: DatabaseService | null = null;
  private currentService: DatabaseService;
  private initialized = false;

  constructor() {
    // Set up primary and fallback services based on configuration
    // Firebase is disabled, only use Supabase
    this.primaryService = supabaseService;
    this.fallbackService = null; // No fallback to Firebase since it's disabled
    this.currentService = this.primaryService;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log(`🚀 Initializing database service (${DATABASE_CONFIG.provider})...`);
    
    try {
      await this.primaryService.initialize();
      this.currentService = this.primaryService;
      this.initialized = true;
      console.log(`✅ Primary database service (${DATABASE_CONFIG.provider}) initialized`);
    } catch (error) {
      console.error(`❌ Failed to initialize primary service:`, error);
      
      if (this.fallbackService && DATABASE_CONFIG.autoSwitch) {
        console.log('🔄 Attempting to use fallback service...');
        try {
          await this.fallbackService.initialize();
          this.currentService = this.fallbackService;
          this.initialized = true;
          console.log('✅ Fallback database service initialized');
        } catch (fallbackError) {
          console.error('❌ Failed to initialize fallback service:', fallbackError);
          throw new Error('Unable to initialize any database service');
        }
      } else {
        throw error;
      }
    }
  }

  async testConnection(): Promise<void> {
    return this.currentService.testConnection();
  }

  isAvailable(): boolean {
    return this.currentService.isAvailable();
  }

  // Customer operations
  async getCustomers(): Promise<Customer[]> {
    return this.withFallback(() => this.currentService.getCustomers());
  }

  async getCustomer(customerId: string): Promise<Customer | null> {
    return this.withFallback(() => this.currentService.getCustomer(customerId));
  }

  async addCustomer(customer: Omit<Customer, 'id'>): Promise<string> {
    return this.withFallback(() => this.currentService.addCustomer(customer));
  }

  async updateCustomer(customerId: string, updates: Partial<Customer>): Promise<void> {
    return this.withFallback(() => this.currentService.updateCustomer(customerId, updates));
  }

  async deleteCustomer(customerId: string): Promise<void> {
    return this.withFallback(() => this.currentService.deleteCustomer(customerId));
  }

  async searchCustomers(searchTerm: string): Promise<Customer[]> {
    return this.withFallback(() => this.currentService.searchCustomers(searchTerm));
  }

  // Quote operations
  async getQuotes(): Promise<Quote[]> {
    return this.withFallback(() => this.currentService.getQuotes());
  }

  async getQuote(quoteId: string): Promise<Quote | null> {
    return this.withFallback(() => this.currentService.getQuote(quoteId));
  }

  async getQuotesByCustomerId(customerId: string): Promise<Quote[]> {
    return this.withFallback(() => this.currentService.getQuotesByCustomerId(customerId));
  }

  async addQuote(quote: Quote): Promise<string> {
    return this.withFallback(() => this.currentService.addQuote(quote));
  }

  async updateQuote(quoteId: string, updates: Partial<Quote>): Promise<void> {
    return this.withFallback(() => this.currentService.updateQuote(quoteId, updates));
  }

  async deleteQuote(quoteId: string): Promise<void> {
    return this.withFallback(() => this.currentService.deleteQuote(quoteId));
  }

  // Invoice operations
  async getInvoices(): Promise<Invoice[]> {
    return this.withFallback(() => this.currentService.getInvoices());
  }

  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    return this.withFallback(() => this.currentService.getInvoice(invoiceId));
  }

  async addInvoice(invoice: Invoice): Promise<string> {
    return this.withFallback(() => this.currentService.addInvoice(invoice));
  }

  async updateInvoice(invoiceId: string, updates: Partial<Invoice>): Promise<void> {
    return this.withFallback(() => this.currentService.updateInvoice(invoiceId, updates));
  }

  // ShareLink operations
  async createShareLink(customerId: string, quoteId: string, expiresIn?: number): Promise<ShareLink> {
    return this.withFallback(() => this.currentService.createShareLink(customerId, quoteId, expiresIn));
  }

  async getShareLinkByToken(token: string): Promise<ShareLink | null> {
    return this.withFallback(() => this.currentService.getShareLinkByToken(token));
  }

  async updateShareLink(token: string, updates: Partial<ShareLink>): Promise<void> {
    return this.withFallback(() => this.currentService.updateShareLink(token, updates));
  }

  // Email history operations
  async addEmailHistory(emailHistory: EmailHistory): Promise<string> {
    return this.withFallback(() => this.currentService.addEmailHistory(emailHistory));
  }

  async getEmailHistory(customerId?: string): Promise<EmailHistory[]> {
    return this.withFallback(() => this.currentService.getEmailHistory(customerId));
  }

  // Calendar operations
  async getCalendarEvents(startDate?: Date, endDate?: Date): Promise<CalendarEvent[]> {
    return this.withFallback(() => this.currentService.getCalendarEvents(startDate, endDate));
  }

  async addCalendarEvent(event: CalendarEvent): Promise<string> {
    return this.withFallback(() => this.currentService.addCalendarEvent(event));
  }

  // Real-time subscriptions
  subscribeToCustomers(callback: (customers: Customer[]) => void): () => void {
    return this.currentService.subscribeToCustomers(callback);
  }

  subscribeToQuotes(callback: (quotes: Quote[]) => void): () => void {
    return this.currentService.subscribeToQuotes(callback);
  }

  subscribeToInvoices(callback: (invoices: Invoice[]) => void): () => void {
    return this.currentService.subscribeToInvoices(callback);
  }

  // Helper method for automatic fallback
  private async withFallback<T>(operation: () => Promise<T>): Promise<T> {
    // If fallback is disabled, only use primary service (Supabase)
    if (!DATABASE_CONFIG.autoSwitch) {
      console.log('🎯 Using Supabase only - fallback disabled');
      return await operation();
    }
    
    try {
      return await operation();
    } catch (error) {
      const currentProvider = this.getCurrentProvider();
      console.error(`❌ Operation failed on ${currentProvider} service:`, error);
      
      // Log more details for quote-related operations
      if (error instanceof Error && error.message.includes('quote')) {
        console.error('🔍 Quote operation details:', {
          provider: currentProvider,
          error: error.message,
          stack: error.stack
        });
      }
      
      if (this.fallbackService && DATABASE_CONFIG.autoSwitch && this.currentService !== this.fallbackService) {
        const fallbackProvider = this.currentService === supabaseService ? 'firebase' : 'supabase';
        console.log(`🔄 Switching from ${currentProvider} to ${fallbackProvider} fallback service...`);
        this.currentService = this.fallbackService;
        
        try {
          const result = await operation();
          console.log(`✅ Operation succeeded on ${fallbackProvider} fallback service`);
          return result;
        } catch (fallbackError) {
          console.error(`❌ Operation also failed on ${fallbackProvider} fallback service:`, fallbackError);
          throw fallbackError;
        }
      }
      
      throw error;
    }
  }

  // Method to manually switch database provider
  async switchProvider(provider: 'firebase' | 'supabase'): Promise<void> {
    console.log(`🔄 Switching database provider to ${provider}...`);
    
    if (provider === 'firebase') {
      console.warn('⚠️ Firebase is no longer supported. Using Supabase instead.');
      provider = 'supabase';
    }
    
    const newService = supabaseService;
    
    try {
      if ('initialize' in newService) {
        await newService.initialize();
      }
      this.currentService = newService;
      console.log(`✅ Successfully switched to ${provider}`);
    } catch (error) {
      console.error(`❌ Failed to switch to ${provider}:`, error);
      throw error;
    }
  }

  // Get current provider
  getCurrentProvider(): string {
    if (this.currentService === supabaseService) return 'supabase';
    return 'supabase'; // Only Supabase is supported now
  }
}

// Export singleton instance
export const databaseAbstraction = new DatabaseAbstractionService();

// Export for use in components - this will be the main import
export const databaseService = databaseAbstraction;