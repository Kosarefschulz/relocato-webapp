/**
 * Unified Database Service
 * This service uses Firebase as the primary database for all operations
 * It replaces the Google Sheets service and makes Firebase the single source of truth
 */

import { firebaseService } from './firebaseServiceWrapper';
import { Customer, Quote, Invoice, EmailHistory } from '../types';
import { cleanPhoneNumber } from '../utils/phoneUtils';

class UnifiedDatabaseService {
  /**
   * Customer Operations
   */
  async getCustomers(): Promise<Customer[]> {
    try {
      // Get all customers directly from Firebase
      return await firebaseService.getCustomers();
    } catch (error) {
      console.error('Error fetching customers from Firebase:', error);
      return [];
    }
  }

  async getCustomer(customerId: string): Promise<Customer | null> {
    try {
      return await firebaseService.getCustomer(customerId);
    } catch (error) {
      console.error('Error fetching customer from Firebase:', error);
      return null;
    }
  }

  async addCustomer(customer: Customer): Promise<boolean> {
    try {
      // Clean phone numbers before saving
      if (customer.phone) {
        customer.phone = cleanPhoneNumber(customer.phone);
      }
      if (customer.whatsapp) {
        customer.whatsapp = cleanPhoneNumber(customer.whatsapp);
      }

      // Save directly to Firebase
      return await firebaseService.addCustomer(customer);
    } catch (error) {
      console.error('Error adding customer to Firebase:', error);
      return false;
    }
  }

  async updateCustomer(customerId: string, updates: Partial<Customer>): Promise<boolean> {
    try {
      // Clean phone numbers if they're being updated
      if (updates.phone) {
        updates.phone = cleanPhoneNumber(updates.phone);
      }
      if (updates.whatsapp) {
        updates.whatsapp = cleanPhoneNumber(updates.whatsapp);
      }

      // Update directly in Firebase
      return await firebaseService.updateCustomer(customerId, updates);
    } catch (error) {
      console.error('Error updating customer in Firebase:', error);
      return false;
    }
  }

  async deleteCustomer(customerId: string): Promise<boolean> {
    try {
      return await firebaseService.deleteCustomer(customerId);
    } catch (error) {
      console.error('Error deleting customer from Firebase:', error);
      return false;
    }
  }

  async searchCustomers(searchTerm: string): Promise<Customer[]> {
    try {
      const customers = await this.getCustomers();
      const term = searchTerm.toLowerCase();
      
      return customers.filter(customer => 
        customer.name.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term) ||
        customer.phone.includes(term) ||
        customer.id.toLowerCase().includes(term)
      );
    } catch (error) {
      console.error('Error searching customers:', error);
      return [];
    }
  }

  /**
   * Quote Operations
   */
  async getQuotes(): Promise<Quote[]> {
    try {
      return await firebaseService.getQuotes();
    } catch (error) {
      console.error('Error fetching quotes from Firebase:', error);
      return [];
    }
  }

  async getQuote(quoteId: string): Promise<Quote | null> {
    try {
      return await firebaseService.getQuote(quoteId);
    } catch (error) {
      console.error('Error fetching quote from Firebase:', error);
      return null;
    }
  }

  async getQuotesByCustomer(customerId: string): Promise<Quote[]> {
    try {
      return await firebaseService.getQuotesByCustomer(customerId);
    } catch (error) {
      console.error('Error fetching customer quotes from Firebase:', error);
      return [];
    }
  }

  async addQuote(quote: Quote): Promise<boolean> {
    try {
      return await firebaseService.addQuote(quote);
    } catch (error) {
      console.error('Error adding quote to Firebase:', error);
      return false;
    }
  }

  async updateQuote(quoteId: string, updates: Partial<Quote>): Promise<boolean> {
    try {
      return await firebaseService.updateQuote(quoteId, updates);
    } catch (error) {
      console.error('Error updating quote in Firebase:', error);
      return false;
    }
  }

  async deleteQuote(quoteId: string): Promise<boolean> {
    try {
      return await firebaseService.deleteQuote(quoteId);
    } catch (error) {
      console.error('Error deleting quote from Firebase:', error);
      return false;
    }
  }

  /**
   * Invoice Operations
   */
  async getInvoices(): Promise<Invoice[]> {
    try {
      return await firebaseService.getInvoices();
    } catch (error) {
      console.error('Error fetching invoices from Firebase:', error);
      return [];
    }
  }

  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    try {
      return await firebaseService.getInvoice(invoiceId);
    } catch (error) {
      console.error('Error fetching invoice from Firebase:', error);
      return null;
    }
  }

  async getInvoicesByCustomer(customerId: string): Promise<Invoice[]> {
    try {
      return await firebaseService.getInvoicesByCustomer(customerId);
    } catch (error) {
      console.error('Error fetching customer invoices from Firebase:', error);
      return [];
    }
  }

  async addInvoice(invoice: Invoice): Promise<boolean> {
    try {
      return await firebaseService.addInvoice(invoice);
    } catch (error) {
      console.error('Error adding invoice to Firebase:', error);
      return false;
    }
  }

  async updateInvoice(invoiceId: string, updates: Partial<Invoice>): Promise<boolean> {
    try {
      return await firebaseService.updateInvoice(invoiceId, updates);
    } catch (error) {
      console.error('Error updating invoice in Firebase:', error);
      return false;
    }
  }

  async deleteInvoice(invoiceId: string): Promise<boolean> {
    try {
      return await firebaseService.deleteInvoice(invoiceId);
    } catch (error) {
      console.error('Error deleting invoice from Firebase:', error);
      return false;
    }
  }

  /**
   * Email History Operations
   */
  async getEmailHistory(customerId: string): Promise<EmailHistory[]> {
    try {
      return await firebaseService.getEmailHistory(customerId);
    } catch (error) {
      console.error('Error fetching email history from Firebase:', error);
      return [];
    }
  }

  async addEmailHistory(emailHistory: EmailHistory): Promise<boolean> {
    try {
      return await firebaseService.addEmailHistory(emailHistory);
    } catch (error) {
      console.error('Error adding email history to Firebase:', error);
      return false;
    }
  }

  /**
   * Real-time listeners for live updates
   */
  subscribeToCustomers(callback: (customers: Customer[]) => void): () => void {
    return firebaseService.subscribeToCustomers(callback);
  }

  subscribeToQuotes(callback: (quotes: Quote[]) => void): () => void {
    return firebaseService.subscribeToQuotes(callback);
  }

  subscribeToInvoices(callback: (invoices: Invoice[]) => void): () => void {
    return firebaseService.subscribeToInvoices(callback);
  }

  /**
   * Migration helpers (for importing from Google Sheets)
   */
  async importFromGoogleSheets(data: {
    customers?: Customer[];
    quotes?: Quote[];
    invoices?: Invoice[];
  }): Promise<{
    customersImported: number;
    quotesImported: number;
    invoicesImported: number;
    errors: string[];
  }> {
    const result = {
      customersImported: 0,
      quotesImported: 0,
      invoicesImported: 0,
      errors: [] as string[]
    };

    // Import customers
    if (data.customers) {
      for (const customer of data.customers) {
        try {
          // Clean phone numbers
          if (customer.phone) {
            customer.phone = cleanPhoneNumber(customer.phone);
          }
          if (customer.whatsapp) {
            customer.whatsapp = cleanPhoneNumber(customer.whatsapp);
          }

          const success = await this.addCustomer(customer);
          if (success) {
            result.customersImported++;
          } else {
            result.errors.push(`Failed to import customer: ${customer.name}`);
          }
        } catch (error) {
          result.errors.push(`Error importing customer ${customer.name}: ${error}`);
        }
      }
    }

    // Import quotes
    if (data.quotes) {
      for (const quote of data.quotes) {
        try {
          const success = await this.addQuote(quote);
          if (success) {
            result.quotesImported++;
          } else {
            result.errors.push(`Failed to import quote: ${quote.id}`);
          }
        } catch (error) {
          result.errors.push(`Error importing quote ${quote.id}: ${error}`);
        }
      }
    }

    // Import invoices
    if (data.invoices) {
      for (const invoice of data.invoices) {
        try {
          const success = await this.addInvoice(invoice);
          if (success) {
            result.invoicesImported++;
          } else {
            result.errors.push(`Failed to import invoice: ${invoice.id}`);
          }
        } catch (error) {
          result.errors.push(`Error importing invoice ${invoice.id}: ${error}`);
        }
      }
    }

    return result;
  }

  /**
   * Check if Firebase is available
   */
  isAvailable(): boolean {
    return firebaseService.isAvailable();
  }
}

// Export a singleton instance
export const unifiedDatabaseService = new UnifiedDatabaseService();