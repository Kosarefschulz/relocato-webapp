// Cache für Lexware-Angebotsdaten um Rate Limiting zu vermeiden

interface CachedQuotations {
  data: any[];
  timestamp: number;
  expiry: number; // 5 Minuten Cache
}

class QuotationCacheService {
  private cache: CachedQuotations | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 Minuten

  // Lade Angebotsdaten mit Cache
  async getQuotations(): Promise<any[]> {
    // Prüfe Cache
    if (this.cache && Date.now() < this.cache.expiry) {
      console.log('📋 Using cached quotation data');
      return this.cache.data;
    }

    // Cache abgelaufen oder nicht vorhanden - lade neu
    console.log('🔄 Loading fresh quotation data from Lexware...');
    
    try {
      const response = await fetch('/api/lexware/quotations-list');
      const result = await response.json();

      if (result.success) {
        // Speichere im Cache
        this.cache = {
          data: result.quotations,
          timestamp: Date.now(),
          expiry: Date.now() + this.CACHE_DURATION
        };

        console.log(`✅ Cached ${result.quotations.length} quotations for 5 minutes`);
        return result.quotations;
      } else {
        throw new Error(result.error || 'Failed to load quotations');
      }
    } catch (error) {
      console.error('❌ Error loading quotations:', error);
      
      // Falls Fehler und alter Cache vorhanden, nutze diesen
      if (this.cache) {
        console.log('⚠️ Using stale cache due to API error');
        return this.cache.data;
      }
      
      throw error;
    }
  }

  // Finde spezifischen Kunden/Angebot
  async findCustomer(customerId: string): Promise<any | null> {
    try {
      const quotations = await this.getQuotations();
      return quotations.find(q => q.id === customerId) || null;
    } catch (error) {
      console.error('❌ Error finding customer:', error);
      return null;
    }
  }

  // Cache manuell leeren
  clearCache(): void {
    this.cache = null;
    console.log('🗑️ Quotation cache cleared');
  }

  // Cache-Status prüfen
  getCacheStatus(): { hasCache: boolean; age: number; remaining: number } {
    if (!this.cache) {
      return { hasCache: false, age: 0, remaining: 0 };
    }

    const age = Date.now() - this.cache.timestamp;
    const remaining = this.cache.expiry - Date.now();

    return {
      hasCache: true,
      age: Math.round(age / 1000), // Sekunden
      remaining: Math.max(0, Math.round(remaining / 1000)) // Sekunden
    };
  }
}

export const quotationCacheService = new QuotationCacheService();