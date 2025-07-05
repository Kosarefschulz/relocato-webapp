/**
 * Unified Database Service
 * This service uses Supabase as the primary database for all operations
 * It makes Supabase the single source of truth for all data
 */

import { supabaseService } from './supabaseService';
import { Customer, Quote, Invoice, EmailHistory } from '../types';
import { cleanPhoneNumber } from '../utils/phoneUtils';

class UnifiedDatabaseService {
  private generateId(): string {
    return 'K' + Date.now() + Math.random().toString(36).substr(2, 5);
  }

  /**
   * Customer Operations
   */
  async getCustomers(): Promise<Customer[]> {
    try {
      // Get all customers directly from Supabase
      return await supabaseService.getCustomers();
    } catch (error) {
      console.error('Error fetching customers from Supabase:', error);
      return [];
    }
  }

  async getCustomer(customerId: string): Promise<Customer | null> {
    try {
      return await supabaseService.getCustomer(customerId);
    } catch (error) {
      console.error('Error fetching customer from Supabase:', error);
      return null;
    }
  }

  async createCustomer(customer: Omit<Customer, 'id'>): Promise<Customer | null> {
    try {
      // Clean phone numbers before saving
      const cleanedCustomer = {
        ...customer,
        phone: customer.phone ? cleanPhoneNumber(customer.phone) : ''
      };
      
      const customerId = await supabaseService.addCustomer(cleanedCustomer);
      if (!customerId) return null;
      return await supabaseService.getCustomer(customerId);
    } catch (error) {
      console.error('Error creating customer in Supabase:', error);
      return null;
    }
  }

  async updateCustomer(customerId: string, updates: Partial<Customer>): Promise<Customer | null> {
    try {
      // Clean phone numbers if they're being updated
      const cleanedUpdates = { ...updates };
      if (updates.phone !== undefined) {
        cleanedUpdates.phone = updates.phone ? cleanPhoneNumber(updates.phone) : '';
      }
      
      await supabaseService.updateCustomer(customerId, cleanedUpdates);
      return await supabaseService.getCustomer(customerId);
    } catch (error) {
      console.error('Error updating customer in Supabase:', error);
      return null;
    }
  }

  async deleteCustomer(customerId: string): Promise<boolean> {
    try {
      await supabaseService.deleteCustomer(customerId);
      return true;
    } catch (error) {
      console.error('Error deleting customer from Supabase:', error);
      return false;
    }
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    try {
      return await supabaseService.searchCustomers(query);
    } catch (error) {
      console.error('Error searching customers in Supabase:', error);
      return [];
    }
  }

  /**
   * Quote Operations
   */
  async getQuotes(): Promise<Quote[]> {
    try {
      return await supabaseService.getQuotes();
    } catch (error) {
      console.error('Error fetching quotes from Supabase:', error);
      return [];
    }
  }

  async getQuote(quoteId: string): Promise<Quote | null> {
    try {
      return await supabaseService.getQuote(quoteId);
    } catch (error) {
      console.error('Error fetching quote from Supabase:', error);
      return null;
    }
  }

  async getQuotesByCustomerId(customerId: string): Promise<Quote[]> {
    try {
      return await supabaseService.getQuotesByCustomerId(customerId);
    } catch (error) {
      console.error('Error fetching quotes for customer from Supabase:', error);
      return [];
    }
  }

  async createQuote(quote: Omit<Quote, 'id'>): Promise<Quote | null> {
    try {
      const fullQuote: Quote = {
        ...quote,
        id: this.generateId()
      };
      const quoteId = await supabaseService.addQuote(fullQuote);
      if (!quoteId) return null;
      return await supabaseService.getQuote(quoteId);
    } catch (error) {
      console.error('Error creating quote in Supabase:', error);
      return null;
    }
  }

  async updateQuote(quoteId: string, updates: Partial<Quote>): Promise<Quote | null> {
    try {
      await supabaseService.updateQuote(quoteId, updates);
      return await supabaseService.getQuote(quoteId);
    } catch (error) {
      console.error('Error updating quote in Supabase:', error);
      return null;
    }
  }

  async deleteQuote(quoteId: string): Promise<boolean> {
    try {
      await supabaseService.deleteQuote(quoteId);
      return true;
    } catch (error) {
      console.error('Error deleting quote from Supabase:', error);
      return false;
    }
  }

  /**
   * Invoice Operations
   */
  async getInvoices(): Promise<Invoice[]> {
    try {
      return await supabaseService.getInvoices();
    } catch (error) {
      console.error('Error fetching invoices from Supabase:', error);
      return [];
    }
  }

  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    try {
      return await supabaseService.getInvoice(invoiceId);
    } catch (error) {
      console.error('Error fetching invoice from Supabase:', error);
      return null;
    }
  }

  async getInvoicesByCustomer(customerId: string): Promise<Invoice[]> {
    try {
      const allInvoices = await supabaseService.getInvoices();
      return allInvoices.filter(invoice => invoice.customerId === customerId);
    } catch (error) {
      console.error('Error fetching invoices for customer from Supabase:', error);
      return [];
    }
  }

  async createInvoice(invoice: Omit<Invoice, 'id'>): Promise<Invoice | null> {
    try {
      const fullInvoice: Invoice = {
        ...invoice,
        id: this.generateId()
      };
      const invoiceId = await supabaseService.addInvoice(fullInvoice);
      if (!invoiceId) return null;
      return await supabaseService.getInvoice(invoiceId);
    } catch (error) {
      console.error('Error creating invoice in Supabase:', error);
      return null;
    }
  }

  async updateInvoice(invoiceId: string, updates: Partial<Invoice>): Promise<Invoice | null> {
    try {
      await supabaseService.updateInvoice(invoiceId, updates);
      return await supabaseService.getInvoice(invoiceId);
    } catch (error) {
      console.error('Error updating invoice in Supabase:', error);
      return null;
    }
  }

  async deleteInvoice(invoiceId: string): Promise<boolean> {
    try {
      // SupabaseService doesn't have deleteInvoice, so we need to implement soft delete
      await supabaseService.updateInvoice(invoiceId, { status: 'deleted' } as Partial<Invoice>);
      return true;
    } catch (error) {
      console.error('Error deleting invoice from Supabase:', error);
      return false;
    }
  }

  /**
   * Email History Operations
   */
  async getEmailHistory(customerId: string): Promise<EmailHistory[]> {
    try {
      return await supabaseService.getEmailHistory(customerId);
    } catch (error) {
      console.error('Error fetching email history from Supabase:', error);
      return [];
    }
  }

  async createEmailHistory(emailData: Omit<EmailHistory, 'id'>): Promise<EmailHistory | null> {
    try {
      const fullEmailHistory: EmailHistory = {
        ...emailData,
        id: this.generateId()
      };
      const emailId = await supabaseService.addEmailHistory(fullEmailHistory);
      if (!emailId) return null;
      // SupabaseService doesn't have a getEmailHistoryById method, so return the created object
      return fullEmailHistory;
    } catch (error) {
      console.error('Error creating email history in Supabase:', error);
      return null;
    }
  }

  /**
   * Batch Operations
   */
  async batchCreateCustomers(customers: Omit<Customer, 'id'>[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const customer of customers) {
      try {
        const result = await this.createCustomer(customer);
        if (result) {
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error('Error creating customer:', error);
        failed++;
      }
    }

    return { success, failed };
  }

  async batchUpdateCustomers(updates: { id: string; data: Partial<Customer> }[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const update of updates) {
      try {
        const result = await this.updateCustomer(update.id, update.data);
        if (result) {
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error('Error updating customer:', error);
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Analytics and Reporting
   */
  async getCustomerStats(): Promise<{ total: number; active: number; inactive: number }> {
    try {
      const customers = await this.getCustomers();
      const now = new Date();
      const threeMonthsAgo = new Date(now.setMonth(now.getMonth() - 3));

      const active = customers.filter(c => {
        const lastActivity = c.updatedAt ? new Date(c.updatedAt) : c.createdAt ? new Date(c.createdAt) : new Date();
        return lastActivity > threeMonthsAgo;
      }).length;

      return {
        total: customers.length,
        active,
        inactive: customers.length - active
      };
    } catch (error) {
      console.error('Error getting customer stats:', error);
      return { total: 0, active: 0, inactive: 0 };
    }
  }

  async getQuoteStats(): Promise<{ total: number; pending: number; accepted: number; rejected: number }> {
    try {
      const quotes = await this.getQuotes();
      
      return {
        total: quotes.length,
        pending: quotes.filter(q => q.status === 'draft' || q.status === 'sent').length,
        accepted: quotes.filter(q => q.status === 'accepted').length,
        rejected: quotes.filter(q => q.status === 'rejected').length
      };
    } catch (error) {
      console.error('Error getting quote stats:', error);
      return { total: 0, pending: 0, accepted: 0, rejected: 0 };
    }
  }

  async getRevenueStats(): Promise<{ total: number; pending: number; collected: number }> {
    try {
      const invoices = await this.getInvoices();
      
      const total = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      const collected = invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + (inv.amount || 0), 0);
      
      return {
        total,
        pending: total - collected,
        collected
      };
    } catch (error) {
      console.error('Error getting revenue stats:', error);
      return { total: 0, pending: 0, collected: 0 };
    }
  }
}

// Export singleton instance
export const unifiedDatabaseService = new UnifiedDatabaseService();