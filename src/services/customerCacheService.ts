import { Customer } from '../types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiryTime: number;
}

interface SearchCache {
  query: string;
  results: string[]; // Customer IDs
  timestamp: number;
}

class CustomerCacheService {
  private customerCache = new Map<string, CacheEntry<Customer>>();
  private searchCache = new Map<string, SearchCache>();
  private customerListCache: CacheEntry<Customer[]> | null = null;
  private preloadQueue = new Set<string>();
  private preloadTimer: NodeJS.Timeout | null = null;
  
  // Cache configuration
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly SEARCH_CACHE_DURATION = 1 * 60 * 1000; // 1 minute
  private readonly MAX_CACHE_SIZE = 1000; // Maximum number of customers to cache
  private readonly PRELOAD_DELAY = 500; // Delay before preloading on hover

  /**
   * Cache a single customer
   */
  cacheCustomer(customer: Customer): void {
    // Check cache size and remove oldest entries if needed
    if (this.customerCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.getOldestCacheKey();
      if (oldestKey) {
        this.customerCache.delete(oldestKey);
      }
    }

    this.customerCache.set(customer.id, {
      data: customer,
      timestamp: Date.now(),
      expiryTime: Date.now() + this.CACHE_DURATION,
    });
  }

  /**
   * Cache multiple customers
   */
  cacheCustomers(customers: Customer[]): void {
    customers.forEach(customer => this.cacheCustomer(customer));
  }

  /**
   * Get a customer from cache
   */
  getCachedCustomer(customerId: string): Customer | null {
    const entry = this.customerCache.get(customerId);
    
    if (!entry) return null;
    
    // Check if cache is expired
    if (Date.now() > entry.expiryTime) {
      this.customerCache.delete(customerId);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Cache customer list
   */
  cacheCustomerList(customers: Customer[]): void {
    this.customerListCache = {
      data: customers,
      timestamp: Date.now(),
      expiryTime: Date.now() + this.CACHE_DURATION,
    };
    
    // Also cache individual customers
    this.cacheCustomers(customers);
  }

  /**
   * Get cached customer list
   */
  getCachedCustomerList(): Customer[] | null {
    if (!this.customerListCache) return null;
    
    // Check if cache is expired
    if (Date.now() > this.customerListCache.expiryTime) {
      this.customerListCache = null;
      return null;
    }
    
    return this.customerListCache.data;
  }

  /**
   * Cache search results
   */
  cacheSearchResults(query: string, customerIds: string[]): void {
    // Limit search cache size
    if (this.searchCache.size > 50) {
      const oldestSearch = Array.from(this.searchCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
      if (oldestSearch) {
        this.searchCache.delete(oldestSearch[0]);
      }
    }

    this.searchCache.set(query.toLowerCase(), {
      query,
      results: customerIds,
      timestamp: Date.now(),
    });
  }

  /**
   * Get cached search results
   */
  getCachedSearchResults(query: string): string[] | null {
    const cache = this.searchCache.get(query.toLowerCase());
    
    if (!cache) return null;
    
    // Check if cache is expired
    if (Date.now() - cache.timestamp > this.SEARCH_CACHE_DURATION) {
      this.searchCache.delete(query.toLowerCase());
      return null;
    }
    
    return cache.results;
  }

  /**
   * Schedule preloading of customer details
   */
  schedulePreload(customerId: string): void {
    // Don't preload if already cached
    if (this.getCachedCustomer(customerId)) return;
    
    this.preloadQueue.add(customerId);
    
    // Clear existing timer
    if (this.preloadTimer) {
      clearTimeout(this.preloadTimer);
    }
    
    // Set new timer
    this.preloadTimer = setTimeout(() => {
      this.processPreloadQueue();
    }, this.PRELOAD_DELAY);
  }

  /**
   * Cancel preloading
   */
  cancelPreload(customerId: string): void {
    this.preloadQueue.delete(customerId);
  }

  /**
   * Process preload queue
   */
  private async processPreloadQueue(): Promise<void> {
    const customerIds = Array.from(this.preloadQueue);
    this.preloadQueue.clear();
    
    if (customerIds.length === 0) return;
    
    // Import the service here to avoid circular dependencies
    const { databaseService } = await import('../config/database.config');
    
    try {
      // Load all customers once instead of multiple times
      const customers = await databaseService.getCustomers();
      
      // Find and cache the requested customers
      customerIds.forEach(id => {
        const customer = customers.find(c => c.id === id);
        if (customer) {
          this.cacheCustomer(customer);
        }
      });
    } catch (error) {
      console.error('Failed to preload customers:', error);
    }
  }

  /**
   * Get oldest cache key
   */
  private getOldestCacheKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;
    
    for (const [key, entry] of this.customerCache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.customerCache.clear();
    this.searchCache.clear();
    this.customerListCache = null;
    this.preloadQueue.clear();
    
    if (this.preloadTimer) {
      clearTimeout(this.preloadTimer);
      this.preloadTimer = null;
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    customersCached: number;
    searchesCached: number;
    hasCustomerList: boolean;
    preloadQueueSize: number;
  } {
    return {
      customersCached: this.customerCache.size,
      searchesCached: this.searchCache.size,
      hasCustomerList: !!this.customerListCache,
      preloadQueueSize: this.preloadQueue.size,
    };
  }
}

export const customerCacheService = new CustomerCacheService();