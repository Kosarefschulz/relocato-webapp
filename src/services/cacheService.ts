interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

interface CacheOptions {
  expiresIn?: number; // milliseconds
  forceRefresh?: boolean;
}

class CacheService {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Check if expired
    if (Date.now() - item.timestamp > item.expiresIn) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const expiresIn = options.expiresIn || this.defaultTTL;
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn
    });
  }

  /**
   * Get or fetch data with caching
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Check if we should force refresh
    if (!options.forceRefresh) {
      const cached = this.get<T>(key);
      if (cached !== null) {
        return cached;
      }
    }

    // Fetch new data
    const data = await fetcher();
    
    // Cache the result
    this.set(key, data, options);
    
    return data;
  }

  /**
   * Remove specific item from cache
   */
  remove(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean expired items
   */
  cleanExpired(): void {
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.expiresIn) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Batch get multiple items
   */
  getMany<T>(keys: string[]): Map<string, T | null> {
    const results = new Map<string, T | null>();
    
    for (const key of keys) {
      results.set(key, this.get<T>(key));
    }
    
    return results;
  }

  /**
   * Batch set multiple items
   */
  setMany<T>(items: Array<{ key: string; data: T; options?: CacheOptions }>): void {
    for (const item of items) {
      this.set(item.key, item.data, item.options);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    items: Array<{ key: string; size: number; age: number }>;
  } {
    const items = Array.from(this.cache.entries()).map(([key, item]) => ({
      key,
      size: JSON.stringify(item.data).length,
      age: Date.now() - item.timestamp
    }));

    return {
      size: this.cache.size,
      items
    };
  }
}

// Create singleton instance
export const cacheService = new CacheService();

// Auto-clean expired items every minute
setInterval(() => {
  cacheService.cleanExpired();
}, 60 * 1000);

// Cache keys constants
export const CACHE_KEYS = {
  CUSTOMERS_INITIAL: 'customers_initial',
  CUSTOMERS_COUNT: 'customers_count',
  QUOTES_RECENT: 'quotes_recent',
  INVOICES_UNPAID: 'invoices_unpaid',
  EMAIL_TEMPLATES: 'email_templates',
  CUSTOMER_DETAILS: (id: string) => `customer_${id}`,
  QUOTE_DETAILS: (id: string) => `quote_${id}`,
  INVOICE_DETAILS: (id: string) => `invoice_${id}`,
} as const;