/**
 * Database Service for Vercel/PostgreSQL
 * Replaces Firebase with PostgreSQL database
 */

import { Customer, Quote, Invoice, EmailHistory } from '../types';

interface DatabaseConfig {
  apiUrl: string;
  authToken?: string;
}

class DatabaseServiceVercel {
  private config: DatabaseConfig;
  
  constructor() {
    this.config = {
      apiUrl: process.env.REACT_APP_API_URL || '/api',
    };
  }

  private async getAuthToken(): Promise<string> {
    // Get auth token from your auth service
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    
    const response = await fetch(`${this.config.apiUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  /**
   * Customer Operations
   */
  async getCustomers(): Promise<Customer[]> {
    try {
      return await this.request<Customer[]>('/customers');
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  }

  async getCustomer(customerId: string): Promise<Customer | null> {
    try {
      return await this.request<Customer>(`/customers/${customerId}`);
    } catch (error) {
      console.error('Error fetching customer:', error);
      return null;
    }
  }

  async addCustomer(customer: Customer): Promise<boolean> {
    try {
      const result = await this.request('/customers', {
        method: 'POST',
        body: JSON.stringify(customer),
      });
      return !!result;
    } catch (error) {
      console.error('Error adding customer:', error);
      return false;
    }
  }

  async updateCustomer(
    customerId: string,
    updates: Partial<Customer>
  ): Promise<boolean> {
    try {
      await this.request(`/customers/${customerId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return true;
    } catch (error) {
      console.error('Error updating customer:', error);
      return false;
    }
  }

  async deleteCustomer(customerId: string): Promise<boolean> {
    try {
      await this.request(`/customers/${customerId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('Error deleting customer:', error);
      return false;
    }
  }

  async searchCustomers(searchTerm: string): Promise<Customer[]> {
    try {
      return await this.request<Customer[]>(
        `/customers/search?q=${encodeURIComponent(searchTerm)}`
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
      return await this.request<Quote[]>('/quotes');
    } catch (error) {
      console.error('Error fetching quotes:', error);
      return [];
    }
  }

  async getQuote(quoteId: string): Promise<Quote | null> {
    try {
      return await this.request<Quote>(`/quotes/${quoteId}`);
    } catch (error) {
      console.error('Error fetching quote:', error);
      return null;
    }
  }

  async addQuote(quote: Quote): Promise<boolean> {
    try {
      const result = await this.request('/quotes', {
        method: 'POST',
        body: JSON.stringify(quote),
      });
      return !!result;
    } catch (error) {
      console.error('Error adding quote:', error);
      return false;
    }
  }

  async updateQuote(
    quoteId: string,
    updates: Partial<Quote>
  ): Promise<boolean> {
    try {
      await this.request(`/quotes/${quoteId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return true;
    } catch (error) {
      console.error('Error updating quote:', error);
      return false;
    }
  }

  async deleteQuote(quoteId: string): Promise<boolean> {
    try {
      await this.request(`/quotes/${quoteId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('Error deleting quote:', error);
      return false;
    }
  }

  /**
   * Invoice Operations
   */
  async getInvoices(): Promise<Invoice[]> {
    try {
      return await this.request<Invoice[]>('/invoices');
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  }

  async getUnpaidInvoices(): Promise<Invoice[]> {
    try {
      return await this.request<Invoice[]>('/invoices?status=unpaid');
    } catch (error) {
      console.error('Error fetching unpaid invoices:', error);
      return [];
    }
  }

  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    try {
      return await this.request<Invoice>(`/invoices/${invoiceId}`);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      return null;
    }
  }

  async addInvoice(invoice: Invoice): Promise<boolean> {
    try {
      const result = await this.request('/invoices', {
        method: 'POST',
        body: JSON.stringify(invoice),
      });
      return !!result;
    } catch (error) {
      console.error('Error adding invoice:', error);
      return false;
    }
  }

  async updateInvoice(
    invoiceId: string,
    updates: Partial<Invoice>
  ): Promise<boolean> {
    try {
      await this.request(`/invoices/${invoiceId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return true;
    } catch (error) {
      console.error('Error updating invoice:', error);
      return false;
    }
  }

  async deleteInvoice(invoiceId: string): Promise<boolean> {
    try {
      await this.request(`/invoices/${invoiceId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      return false;
    }
  }

  /**
   * Email History Operations
   */
  async getEmailHistory(customerId?: string): Promise<EmailHistory[]> {
    try {
      const url = customerId
        ? `/email-history?customerId=${customerId}`
        : '/email-history';
      return await this.request<EmailHistory[]>(url);
    } catch (error) {
      console.error('Error fetching email history:', error);
      return [];
    }
  }

  async addEmailHistory(emailHistory: EmailHistory): Promise<boolean> {
    try {
      const result = await this.request('/email-history', {
        method: 'POST',
        body: JSON.stringify(emailHistory),
      });
      return !!result;
    } catch (error) {
      console.error('Error adding email history:', error);
      return false;
    }
  }

  /**
   * Real-time Updates (Using Server-Sent Events or WebSockets)
   */
  subscribeToCustomers(callback: (customers: Customer[]) => void): () => void {
    // For now, use polling. Can be replaced with WebSockets later
    const interval = setInterval(async () => {
      const customers = await this.getCustomers();
      callback(customers);
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }

  subscribeToQuotes(callback: (quotes: Quote[]) => void): () => void {
    const interval = setInterval(async () => {
      const quotes = await this.getQuotes();
      callback(quotes);
    }, 5000);

    return () => clearInterval(interval);
  }

  subscribeToInvoices(callback: (invoices: Invoice[]) => void): () => void {
    const interval = setInterval(async () => {
      const invoices = await this.getInvoices();
      callback(invoices);
    }, 5000);

    return () => clearInterval(interval);
  }

  /**
   * Utility Methods
   */
  async testConnection(): Promise<void> {
    console.log('🧪 Testing database connection...');
    try {
      await this.request('/health');
      console.log('✅ Connection successful!');
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      throw error;
    }
  }

  isAvailable(): boolean {
    return true; // Always available when using API
  }

  /**
   * Generic document operations
   */
  async getDocument(collection: string, documentId: string): Promise<any | null> {
    try {
      return await this.request(`/${collection}/${documentId}`);
    } catch (error) {
      console.error('Error fetching document:', error);
      return null;
    }
  }

  async getCollection(collectionName: string): Promise<any[]> {
    try {
      return await this.request(`/${collectionName}`);
    } catch (error) {
      console.error('Error fetching collection:', error);
      return [];
    }
  }

  async updateDocument(
    collection: string,
    documentId: string,
    data: any
  ): Promise<boolean> {
    try {
      await this.request(`/${collection}/${documentId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return true;
    } catch (error) {
      console.error('Error updating document:', error);
      return false;
    }
  }
}

// Create singleton instance
export const databaseServiceVercel = new DatabaseServiceVercel();

// Export for backward compatibility
export const databaseService = databaseServiceVercel;