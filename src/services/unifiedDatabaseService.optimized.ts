/**
 * Optimized Unified Database Service with Caching
 * This service uses Firebase as the primary database with caching layer
 */

import { firebaseService } from './firebaseServiceWrapper';
import { Customer, Quote, Invoice, EmailHistory } from '../types';
import { cleanPhoneNumber } from '../utils/phoneUtils';
import { cacheService, CACHE_KEYS } from './cacheService';
import { paginationService } from './paginationService';

class UnifiedDatabaseServiceOptimized {
  private customerCache = new Map<string, Customer>();
  private quoteCache = new Map<string, Quote>();
  private invoiceCache = new Map<string, Invoice>();

  /**
   * Customer Operations with Caching
   */
  async getCustomers(): Promise<Customer[]> {
    try {
      // Try to get from cache first
      return await cacheService.getOrFetch(
        CACHE_KEYS.CUSTOMERS_INITIAL,
        async () => {
          const result = await paginationService.loadInitialCustomers({ pageSize: 100 });
          return result.data;
        },
        { expiresIn: 5 * 60 * 1000 } // 5 minutes
      );
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  }

  async getCustomer(customerId: string): Promise<Customer | null> {
    try {
      // Check local cache first
      if (this.customerCache.has(customerId)) {
        return this.customerCache.get(customerId)!;
      }

      // Then check service cache
      return await cacheService.getOrFetch(
        CACHE_KEYS.CUSTOMER_DETAILS(customerId),
        () => firebaseService.getCustomer(customerId),
        { expiresIn: 10 * 60 * 1000 } // 10 minutes
      );
    } catch (error) {
      console.error('Error fetching customer:', error);
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

      // Save to Firebase
      const result = await firebaseService.addCustomer(customer);
      
      if (result) {
        // Invalidate cache
        cacheService.remove(CACHE_KEYS.CUSTOMERS_INITIAL);
        cacheService.remove(CACHE_KEYS.CUSTOMERS_COUNT);
        
        // Add to local cache
        this.customerCache.set(customer.id, customer);
      }
      
      return result;
    } catch (error) {
      console.error('Error adding customer:', error);
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

      // Update in Firebase
      const result = await firebaseService.updateCustomer(customerId, updates);
      
      if (result) {
        // Invalidate cache
        cacheService.remove(CACHE_KEYS.CUSTOMER_DETAILS(customerId));
        cacheService.remove(CACHE_KEYS.CUSTOMERS_INITIAL);
        
        // Update local cache if exists
        if (this.customerCache.has(customerId)) {
          const existing = this.customerCache.get(customerId)!;
          this.customerCache.set(customerId, { ...existing, ...updates });
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error updating customer:', error);
      return false;
    }
  }

  async deleteCustomer(customerId: string): Promise<boolean> {
    try {
      const result = await firebaseService.deleteCustomer(customerId);
      
      if (result) {
        // Invalidate cache
        cacheService.remove(CACHE_KEYS.CUSTOMER_DETAILS(customerId));
        cacheService.remove(CACHE_KEYS.CUSTOMERS_INITIAL);
        cacheService.remove(CACHE_KEYS.CUSTOMERS_COUNT);
        
        // Remove from local cache
        this.customerCache.delete(customerId);
      }
      
      return result;
    } catch (error) {
      console.error('Error deleting customer:', error);
      return false;
    }
  }

  async searchCustomers(searchTerm: string): Promise<Customer[]> {
    try {
      // For search, we'll use pagination service to search efficiently
      const result = await paginationService.searchWithPagination<Customer>(
        'customers',
        'name',
        searchTerm,
        null,
        { pageSize: 50 }
      );
      
      return result.data;
    } catch (error) {
      console.error('Error searching customers:', error);
      // Fallback to local search
      const customers = await this.getCustomers();
      const term = searchTerm.toLowerCase();
      
      return customers.filter(customer => 
        customer.name.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term) ||
        customer.phone?.includes(term) ||
        customer.id.toLowerCase().includes(term)
      );
    }
  }

  /**
   * Quote Operations with Caching
   */
  async getQuotes(): Promise<Quote[]> {
    try {
      return await cacheService.getOrFetch(
        CACHE_KEYS.QUOTES_RECENT,
        async () => {
          const result = await paginationService.loadQuotes(null, { pageSize: 100 });
          return result.data;
        },
        { expiresIn: 5 * 60 * 1000 } // 5 minutes
      );
    } catch (error) {
      console.error('Error fetching quotes:', error);
      return [];
    }
  }

  async getQuote(quoteId: string): Promise<Quote | null> {
    try {
      // Check local cache first
      if (this.quoteCache.has(quoteId)) {
        return this.quoteCache.get(quoteId)!;
      }

      return await cacheService.getOrFetch(
        CACHE_KEYS.QUOTE_DETAILS(quoteId),
        () => firebaseService.getQuote(quoteId),
        { expiresIn: 10 * 60 * 1000 } // 10 minutes
      );
    } catch (error) {
      console.error('Error fetching quote:', error);
      return null;
    }
  }

  async addQuote(quote: Quote): Promise<boolean> {
    try {
      const result = await firebaseService.addQuote(quote);
      
      if (result) {
        // Invalidate cache
        cacheService.remove(CACHE_KEYS.QUOTES_RECENT);
        
        // Add to local cache
        this.quoteCache.set(quote.id, quote);
      }
      
      return result;
    } catch (error) {
      console.error('Error adding quote:', error);
      return false;
    }
  }

  async updateQuote(quoteId: string, updates: Partial<Quote>): Promise<boolean> {
    try {
      const result = await firebaseService.updateQuote(quoteId, updates);
      
      if (result) {
        // Invalidate cache
        cacheService.remove(CACHE_KEYS.QUOTE_DETAILS(quoteId));
        cacheService.remove(CACHE_KEYS.QUOTES_RECENT);
        
        // Update local cache if exists
        if (this.quoteCache.has(quoteId)) {
          const existing = this.quoteCache.get(quoteId)!;
          this.quoteCache.set(quoteId, { ...existing, ...updates });
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error updating quote:', error);
      return false;
    }
  }

  /**
   * Invoice Operations with Caching
   */
  async getInvoices(): Promise<Invoice[]> {
    try {
      const result = await paginationService.loadInvoices(null, { pageSize: 100 });
      return result.data;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  }

  async getUnpaidInvoices(): Promise<Invoice[]> {
    try {
      return await cacheService.getOrFetch(
        CACHE_KEYS.INVOICES_UNPAID,
        async () => {
          const invoices = await this.getInvoices();
          return invoices.filter(invoice => invoice.status === 'unpaid');
        },
        { expiresIn: 3 * 60 * 1000 } // 3 minutes
      );
    } catch (error) {
      console.error('Error fetching unpaid invoices:', error);
      return [];
    }
  }

  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    try {
      // Check local cache first
      if (this.invoiceCache.has(invoiceId)) {
        return this.invoiceCache.get(invoiceId)!;
      }

      return await cacheService.getOrFetch(
        CACHE_KEYS.INVOICE_DETAILS(invoiceId),
        () => firebaseService.getInvoice(invoiceId),
        { expiresIn: 10 * 60 * 1000 } // 10 minutes
      );
    } catch (error) {
      console.error('Error fetching invoice:', error);
      return null;
    }
  }

  async addInvoice(invoice: Invoice): Promise<boolean> {
    try {
      const result = await firebaseService.addInvoice(invoice);
      
      if (result) {
        // Invalidate cache
        cacheService.remove(CACHE_KEYS.INVOICES_UNPAID);
        
        // Add to local cache
        this.invoiceCache.set(invoice.id, invoice);
      }
      
      return result;
    } catch (error) {
      console.error('Error adding invoice:', error);
      return false;
    }
  }

  async updateInvoice(invoiceId: string, updates: Partial<Invoice>): Promise<boolean> {
    try {
      const result = await firebaseService.updateInvoice(invoiceId, updates);
      
      if (result) {
        // Invalidate cache
        cacheService.remove(CACHE_KEYS.INVOICE_DETAILS(invoiceId));
        cacheService.remove(CACHE_KEYS.INVOICES_UNPAID);
        
        // Update local cache if exists
        if (this.invoiceCache.has(invoiceId)) {
          const existing = this.invoiceCache.get(invoiceId)!;
          this.invoiceCache.set(invoiceId, { ...existing, ...updates });
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error updating invoice:', error);
      return false;
    }
  }

  /**
   * Email History Operations
   */
  async getEmailHistory(customerId?: string): Promise<EmailHistory[]> {
    try {
      return await firebaseService.getEmailHistory(customerId);
    } catch (error) {
      console.error('Error fetching email history:', error);
      return [];
    }
  }

  async addEmailHistory(emailHistory: EmailHistory): Promise<boolean> {
    try {
      return await firebaseService.addEmailHistory(emailHistory);
    } catch (error) {
      console.error('Error adding email history:', error);
      return false;
    }
  }

  /**
   * Performance Monitoring
   */
  getCacheStats() {
    return {
      serviceCache: cacheService.getStats(),
      localCache: {
        customers: this.customerCache.size,
        quotes: this.quoteCache.size,
        invoices: this.invoiceCache.size
      }
    };
  }

  /**
   * Clear all caches
   */
  clearCache() {
    cacheService.clear();
    this.customerCache.clear();
    this.quoteCache.clear();
    this.invoiceCache.clear();
  }
}

// Create singleton instance
export const unifiedDatabaseService = new UnifiedDatabaseServiceOptimized();

// Export for backward compatibility
export const databaseService = unifiedDatabaseService;