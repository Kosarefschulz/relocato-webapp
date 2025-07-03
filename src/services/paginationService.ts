import { Customer, Quote, Invoice } from '../types';
import { databaseService } from './databaseAbstraction';

interface PaginationOptions {
  pageSize: number;
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: Array<{ field: string; operator: any; value: any }>;
}

interface PaginatedResult<T> {
  data: T[];
  lastDoc: any | null;  // Changed from QueryDocumentSnapshot to generic
  hasMore: boolean;
  totalLoaded: number;
}

class PaginationService {
  private cache = new Map<string, any[]>();
  private lastDocs = new Map<string, any>();
  private listeners = new Map<string, () => void>();
  private cacheTimestamps = new Map<string, number>();

  /**
   * Load initial batch of customers (most recent ones)
   */
  async loadInitialCustomers(options: PaginationOptions = { pageSize: 500 }): Promise<PaginatedResult<Customer>> {
    const cacheKey = `customers_initial_${options.pageSize}_${options.orderByField}_${options.orderDirection}`;
    
    // Return cached data if available and fresh (less than 2 minutes old)
    if (this.cache.has(cacheKey)) {
      const cachedData = this.cache.get(cacheKey)!;
      const cacheAge = Date.now() - (this.cacheTimestamps.get(cacheKey) || 0);
      if (cacheAge < 2 * 60 * 1000) { // 2 minutes
        return {
          data: cachedData,
          lastDoc: this.lastDocs.get(cacheKey) || null,
          hasMore: cachedData.length >= options.pageSize,
          totalLoaded: cachedData.length
        };
      }
    }

    try {
      console.log('📄 Loading customers via database service (pagination disabled in Supabase mode)...');
      
      // Since Firebase is disabled, we'll load all customers and simulate pagination
      const allCustomers = await databaseService.getCustomers();
      
      // Sort customers by creation date (most recent first)
      const sortedCustomers = allCustomers.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA; // Descending order
      });

      // Simulate pagination
      const pageSize = options.pageSize || 500;
      const paginatedData = sortedCustomers.slice(0, pageSize);
      
      // Cache the result
      this.cache.set(cacheKey, paginatedData);
      this.cacheTimestamps.set(cacheKey, Date.now());
      this.lastDocs.set(cacheKey, paginatedData.length > 0 ? paginatedData[paginatedData.length - 1] : null);

      return {
        data: paginatedData,
        lastDoc: paginatedData.length > 0 ? paginatedData[paginatedData.length - 1] : null,
        hasMore: allCustomers.length > pageSize,
        totalLoaded: paginatedData.length
      };

    } catch (error) {
      console.error('❌ Error loading customers via database service:', error);
      return {
        data: [],
        lastDoc: null,
        hasMore: false,
        totalLoaded: 0
      };
    }
  }

  /**
   * Load more customers after the last document
   */
  async loadMoreCustomers(lastDoc: any, options: PaginationOptions = { pageSize: 20 }): Promise<PaginatedResult<Customer>> {
    try {
      console.log('📄 Loading more customers via database service (pagination disabled in Supabase mode)...');
      
      // Since Firebase is disabled, we'll load all customers and simulate pagination
      const allCustomers = await databaseService.getCustomers();
      
      // Sort customers by creation date (most recent first)
      const sortedCustomers = allCustomers.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA; // Descending order
      });

      // Find the index of the last document
      let startIndex = 0;
      if (lastDoc && lastDoc.id) {
        startIndex = sortedCustomers.findIndex(customer => customer.id === lastDoc.id) + 1;
      }

      // Get the next page
      const pageSize = options.pageSize || 20;
      const nextPage = sortedCustomers.slice(startIndex, startIndex + pageSize);
      
      return {
        data: nextPage,
        lastDoc: nextPage.length > 0 ? nextPage[nextPage.length - 1] : null,
        hasMore: startIndex + pageSize < sortedCustomers.length,
        totalLoaded: nextPage.length
      };

    } catch (error) {
      console.error('❌ Error loading more customers via database service:', error);
      return {
        data: [],
        lastDoc: null,
        hasMore: false,
        totalLoaded: 0
      };
    }
  }

  /**
   * Load quotes with pagination - alias for loadInitialQuotes for backward compatibility
   */
  async loadQuotes(lastDoc?: any, options: PaginationOptions = { pageSize: 100 }): Promise<PaginatedResult<Quote>> {
    return this.loadInitialQuotes(options);
  }

  /**
   * Load initial batch of quotes
   */
  async loadInitialQuotes(options: PaginationOptions = { pageSize: 100 }): Promise<PaginatedResult<Quote>> {
    try {
      console.log('📄 Loading quotes via database service (pagination disabled in Supabase mode)...');
      
      const allQuotes = await databaseService.getQuotes();
      
      // Sort quotes by creation date (most recent first)
      const sortedQuotes = allQuotes.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      const pageSize = options.pageSize || 100;
      const paginatedData = sortedQuotes.slice(0, pageSize);
      
      return {
        data: paginatedData,
        lastDoc: paginatedData.length > 0 ? paginatedData[paginatedData.length - 1] : null,
        hasMore: allQuotes.length > pageSize,
        totalLoaded: paginatedData.length
      };

    } catch (error) {
      console.error('❌ Error loading quotes via database service:', error);
      return {
        data: [],
        lastDoc: null,
        hasMore: false,
        totalLoaded: 0
      };
    }
  }

  /**
   * Load invoices with pagination - alias for loadInitialInvoices for backward compatibility
   */
  async loadInvoices(lastDoc?: any, options: PaginationOptions = { pageSize: 100 }): Promise<PaginatedResult<Invoice>> {
    return this.loadInitialInvoices(options);
  }

  /**
   * Load initial batch of invoices
   */
  async loadInitialInvoices(options: PaginationOptions = { pageSize: 100 }): Promise<PaginatedResult<Invoice>> {
    try {
      console.log('📄 Loading invoices via database service (pagination disabled in Supabase mode)...');
      
      const allInvoices = await databaseService.getInvoices();
      
      // Sort invoices by creation date (most recent first)
      const sortedInvoices = allInvoices.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      const pageSize = options.pageSize || 100;
      const paginatedData = sortedInvoices.slice(0, pageSize);
      
      return {
        data: paginatedData,
        lastDoc: paginatedData.length > 0 ? paginatedData[paginatedData.length - 1] : null,
        hasMore: allInvoices.length > pageSize,
        totalLoaded: paginatedData.length
      };

    } catch (error) {
      console.error('❌ Error loading invoices via database service:', error);
      return {
        data: [],
        lastDoc: null,
        hasMore: false,
        totalLoaded: 0
      };
    }
  }

  /**
   * Search customers with pagination
   */
  async searchCustomers(searchTerm: string, options: PaginationOptions = { pageSize: 50 }): Promise<PaginatedResult<Customer>> {
    try {
      console.log('🔍 Searching customers via database service...');
      
      const searchResults = await databaseService.searchCustomers(searchTerm);
      
      const pageSize = options.pageSize || 50;
      const paginatedData = searchResults.slice(0, pageSize);
      
      return {
        data: paginatedData,
        lastDoc: paginatedData.length > 0 ? paginatedData[paginatedData.length - 1] : null,
        hasMore: searchResults.length > pageSize,
        totalLoaded: paginatedData.length
      };

    } catch (error) {
      console.error('❌ Error searching customers via database service:', error);
      return {
        data: [],
        lastDoc: null,
        hasMore: false,
        totalLoaded: 0
      };
    }
  }

  /**
   * Generic search with pagination for backward compatibility
   */
  async searchWithPagination<T>(
    collection: string,
    field: string,
    searchTerm: string,
    lastDoc?: any,
    options: PaginationOptions = { pageSize: 50 }
  ): Promise<PaginatedResult<T>> {
    try {
      console.log(`🔍 Generic search with pagination: ${collection}.${field} = "${searchTerm}"`);
      
      // For now, only support customer search since that's what we have in the database service
      if (collection === 'customers') {
        const result = await this.searchCustomers(searchTerm, options);
        return result as PaginatedResult<T>;
      } else {
        console.warn(`❌ Search not supported for collection: ${collection}`);
        return {
          data: [],
          lastDoc: null,
          hasMore: false,
          totalLoaded: 0
        };
      }

    } catch (error) {
      console.error('❌ Error in generic search with pagination:', error);
      return {
        data: [],
        lastDoc: null,
        hasMore: false,
        totalLoaded: 0
      };
    }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    console.log('🧹 Clearing pagination cache...');
    this.cache.clear();
    this.lastDocs.clear();
    this.cacheTimestamps.clear();
    
    // Clear any active listeners
    this.listeners.forEach(unsubscribe => {
      if (unsubscribe) unsubscribe();
    });
    this.listeners.clear();
  }

  /**
   * Cleanup method - alias for clearCache for backward compatibility
   */
  cleanup(): void {
    this.clearCache();
  }

  /**
   * Subscribe to real-time updates for customers
   */
  subscribeToCustomers(callback: (customers: Customer[]) => void): () => void {
    console.log('👁️ Setting up customer subscription via database service...');
    
    // Use the database service's subscription method
    const unsubscribe = databaseService.subscribeToCustomers(callback);
    
    const listenerId = `customers_${Date.now()}`;
    this.listeners.set(listenerId, unsubscribe);
    
    return () => {
      unsubscribe();
      this.listeners.delete(listenerId);
    };
  }

  /**
   * Subscribe to real-time updates for quotes
   */
  subscribeToQuotes(callback: (quotes: Quote[]) => void): () => void {
    console.log('👁️ Setting up quotes subscription via database service...');
    
    const unsubscribe = databaseService.subscribeToQuotes(callback);
    
    const listenerId = `quotes_${Date.now()}`;
    this.listeners.set(listenerId, unsubscribe);
    
    return () => {
      unsubscribe();
      this.listeners.delete(listenerId);
    };
  }

  /**
   * Subscribe to new customers created after a specific date
   */
  subscribeToNewCustomers(callback: (customers: Customer[]) => void, options?: { since?: Date }): () => void {
    console.log('👁️ Setting up new customers subscription via database service...');
    
    // Since we don't have real-time filtering by date in our current implementation,
    // we'll use the regular subscription and filter locally
    const unsubscribe = databaseService.subscribeToCustomers((allCustomers) => {
      if (options?.since) {
        const sinceTime = options.since.getTime();
        const newCustomers = allCustomers.filter(customer => {
          const createdAt = customer.createdAt ? new Date(customer.createdAt).getTime() : 0;
          return createdAt > sinceTime;
        });
        callback(newCustomers);
      } else {
        callback(allCustomers);
      }
    });
    
    const listenerId = `newCustomers_${Date.now()}`;
    this.listeners.set(listenerId, unsubscribe);
    
    return () => {
      unsubscribe();
      this.listeners.delete(listenerId);
    };
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[]; oldestEntry?: number } {
    const keys = Array.from(this.cache.keys());
    const timestamps = Array.from(this.cacheTimestamps.values());
    const oldestEntry = timestamps.length > 0 ? Math.min(...timestamps) : undefined;
    
    return {
      size: this.cache.size,
      keys,
      oldestEntry
    };
  }
}

export const paginationService = new PaginationService();