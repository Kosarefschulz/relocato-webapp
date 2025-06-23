// Wrapper für Firebase Service mit Fallback
import { Customer, Quote, Invoice, EmailHistory } from '../types';
import { db } from '../config/firebase';

class FirebaseServiceWrapper {
  private isFirebaseAvailable(): boolean {
    return !!db;
  }

  async getCustomers(): Promise<Customer[]> {
    if (!this.isFirebaseAvailable()) {
      console.log('⚠️ Firebase nicht verfügbar - nutze lokale Daten');
      return [];
    }
    
    // Dynamischer Import nur wenn Firebase verfügbar
    const { firebaseService } = await import('./firebaseService');
    return firebaseService.getCustomers();
  }

  async getCustomerById(customerId: string): Promise<Customer | null> {
    if (!this.isFirebaseAvailable()) return null;
    const { firebaseService } = await import('./firebaseService');
    return firebaseService.getCustomerById(customerId);
  }

  async addCustomer(customer: Omit<Customer, 'id'>): Promise<string> {
    if (!this.isFirebaseAvailable()) {
      console.warn('Firebase nicht verfügbar - Kunde kann nicht gespeichert werden');
      return '';
    }
    const { firebaseService } = await import('./firebaseService');
    return firebaseService.addCustomer(customer);
  }

  async updateCustomer(customerId: string, updates: Partial<Customer>): Promise<void> {
    if (!this.isFirebaseAvailable()) return;
    const { firebaseService } = await import('./firebaseService');
    return firebaseService.updateCustomer(customerId, updates);
  }

  async deleteCustomer(customerId: string): Promise<void> {
    if (!this.isFirebaseAvailable()) return;
    const { firebaseService } = await import('./firebaseService');
    return firebaseService.deleteCustomer(customerId);
  }

  async getQuotes(): Promise<Quote[]> {
    if (!this.isFirebaseAvailable()) return [];
    const { firebaseService } = await import('./firebaseService');
    return firebaseService.getQuotes();
  }

  async getQuotesByCustomerId(customerId: string): Promise<Quote[]> {
    if (!this.isFirebaseAvailable()) return [];
    const { firebaseService } = await import('./firebaseService');
    return firebaseService.getQuotesByCustomerId(customerId);
  }

  async addQuote(quote: Omit<Quote, 'id'>): Promise<string> {
    if (!this.isFirebaseAvailable()) return '';
    const { firebaseService } = await import('./firebaseService');
    return firebaseService.addQuote(quote);
  }

  async updateQuote(quoteId: string, updates: Partial<Quote>): Promise<void> {
    if (!this.isFirebaseAvailable()) return;
    const { firebaseService } = await import('./firebaseService');
    return firebaseService.updateQuote(quoteId, updates);
  }

  async getQuote(quoteId: string): Promise<Quote | null> {
    if (!this.isFirebaseAvailable()) return null;
    const { firebaseService } = await import('./firebaseService');
    return firebaseService.getQuoteById?.(quoteId) || null;
  }

  async deleteQuote(quoteId: string): Promise<void> {
    if (!this.isFirebaseAvailable()) return;
    const { firebaseService } = await import('./firebaseService');
    return firebaseService.deleteQuote?.(quoteId);
  }

  async getInvoices(): Promise<Invoice[]> {
    if (!this.isFirebaseAvailable()) return [];
    const { firebaseService } = await import('./firebaseService');
    return firebaseService.getInvoices();
  }

  async addInvoice(invoice: Omit<Invoice, 'id'>): Promise<string> {
    if (!this.isFirebaseAvailable()) return '';
    const { firebaseService } = await import('./firebaseService');
    return firebaseService.addInvoice(invoice);
  }

  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    if (!this.isFirebaseAvailable()) return null;
    const { firebaseService } = await import('./firebaseService');
    return firebaseService.getInvoiceById?.(invoiceId) || null;
  }

  async updateInvoice(invoiceId: string, updates: Partial<Invoice>): Promise<void> {
    if (!this.isFirebaseAvailable()) return;
    const { firebaseService } = await import('./firebaseService');
    return firebaseService.updateInvoice?.(invoiceId, updates);
  }

  async deleteInvoice(invoiceId: string): Promise<void> {
    if (!this.isFirebaseAvailable()) return;
    const { firebaseService } = await import('./firebaseService');
    return firebaseService.deleteInvoice?.(invoiceId);
  }

  async getInvoicesByCustomer(customerId: string): Promise<Invoice[]> {
    if (!this.isFirebaseAvailable()) return [];
    const { firebaseService } = await import('./firebaseService');
    return firebaseService.getInvoicesByCustomer?.(customerId) || [];
  }

  async getEmailHistory(customerId?: string): Promise<EmailHistory[]> {
    if (!this.isFirebaseAvailable()) return [];
    const { firebaseService } = await import('./firebaseService');
    return firebaseService.getEmailHistory(customerId);
  }

  async addEmailHistory(email: Omit<EmailHistory, 'id'>): Promise<string> {
    if (!this.isFirebaseAvailable()) return '';
    const { firebaseService } = await import('./firebaseService');
    return firebaseService.addEmailHistory(email);
  }

  subscribeToCustomers(callback: (customers: Customer[]) => void): () => void {
    if (!this.isFirebaseAvailable()) {
      return () => {}; // Leere unsubscribe Funktion
    }
    
    // Async import und subscribe
    import('./firebaseService').then(({ firebaseService }) => {
      firebaseService.subscribeToCustomers(callback);
    });
    
    return () => {};
  }

  subscribeToQuotes(callback: (quotes: Quote[]) => void): () => void {
    if (!this.isFirebaseAvailable()) {
      return () => {};
    }
    
    import('./firebaseService').then(({ firebaseService }) => {
      firebaseService.subscribeToQuotes(callback);
    });
    
    return () => {};
  }

  async migrateCustomerFromGoogleSheets(customer: Customer): Promise<void> {
    if (!this.isFirebaseAvailable()) {
      throw new Error('Firebase nicht verfügbar für Migration');
    }
    const { firebaseService } = await import('./firebaseService');
    return firebaseService.migrateCustomerFromGoogleSheets(customer);
  }

  async migrateQuoteFromGoogleSheets(quote: Quote): Promise<void> {
    if (!this.isFirebaseAvailable()) {
      throw new Error('Firebase nicht verfügbar für Migration');
    }
    const { firebaseService } = await import('./firebaseService');
    return firebaseService.migrateQuoteFromGoogleSheets(quote);
  }

  async getQuotesByCustomer(customerId: string): Promise<Quote[]> {
    return this.getQuotesByCustomerId(customerId);
  }

  subscribeToInvoices(callback: (invoices: Invoice[]) => void): () => void {
    if (!this.isFirebaseAvailable()) {
      return () => {};
    }
    
    import('./firebaseService').then(({ firebaseService }) => {
      firebaseService.subscribeToInvoices?.(callback);
    });
    
    return () => {};
  }

  isAvailable(): boolean {
    return this.isFirebaseAvailable();
  }

  async getQuoteById(quoteId: string): Promise<Quote | null> {
    return this.getQuote(quoteId);
  }

  async getInvoiceById(invoiceId: string): Promise<Invoice | null> {
    return this.getInvoice(invoiceId);
  }

  // Invoice Recognition Methods
  async getRecognitionRules(): Promise<any[]> {
    if (!this.isFirebaseAvailable()) return [];
    const { firebaseService } = await import('./firebaseService');
    return firebaseService.getRecognitionRules?.() || [];
  }

  async saveRecognitionRule(rule: any): Promise<void> {
    if (!this.isFirebaseAvailable()) return;
    const { firebaseService } = await import('./firebaseService');
    return firebaseService.saveRecognitionRule?.(rule);
  }

  async updateRecognitionRule(id: string, rule: any): Promise<void> {
    if (!this.isFirebaseAvailable()) return;
    const { firebaseService } = await import('./firebaseService');
    return firebaseService.updateRecognitionRule?.(id, rule);
  }

  async deleteRecognitionRule(id: string): Promise<void> {
    if (!this.isFirebaseAvailable()) return;
    const { firebaseService } = await import('./firebaseService');
    return firebaseService.deleteRecognitionRule?.(id);
  }

  async getEmailInvoices(): Promise<any[]> {
    if (!this.isFirebaseAvailable()) return [];
    const { firebaseService } = await import('./firebaseService');
    return firebaseService.getEmailInvoices?.() || [];
  }

  async saveEmailInvoice(invoice: any): Promise<void> {
    if (!this.isFirebaseAvailable()) return;
    const { firebaseService } = await import('./firebaseService');
    return firebaseService.saveEmailInvoice?.(invoice);
  }

  async updateEmailInvoice(id: string, invoice: any): Promise<void> {
    if (!this.isFirebaseAvailable()) return;
    const { firebaseService } = await import('./firebaseService');
    return firebaseService.updateEmailInvoice?.(id, invoice);
  }
}

export const firebaseService = new FirebaseServiceWrapper();