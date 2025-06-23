import { firebaseService } from './firebaseServiceWrapper';
import { googleSheetsPublicService } from './googleSheetsPublic';
import { Customer, Quote, Invoice } from '../types';

interface SyncStatus {
  lastSync: Date | null;
  customerssynced: number;
  quotessynced: number;
  invoicessynced: number;
  errors: string[];
}

class AutoSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private syncStatus: SyncStatus = {
    lastSync: null,
    customerssynced: 0,
    quotessynced: 0,
    invoicessynced: 0,
    errors: []
  };

  /**
   * Startet die automatische Synchronisation
   * @param intervalMinutes - Sync-Intervall in Minuten (Standard: 5 Minuten)
   */
  startAutoSync(intervalMinutes: number = 5): void {
    console.log(`🔄 Starte Auto-Sync alle ${intervalMinutes} Minuten`);
    
    // Erste Synchronisation sofort
    this.syncNow();
    
    // Dann regelmäßig
    this.syncInterval = setInterval(() => {
      this.syncNow();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stoppt die automatische Synchronisation
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('🛑 Auto-Sync gestoppt');
    }
  }

  /**
   * Führt eine manuelle Synchronisation durch
   */
  async syncNow(): Promise<SyncStatus> {
    if (this.isSyncing) {
      console.log('⏳ Sync läuft bereits...');
      return this.syncStatus;
    }

    console.log('🔄 Starte Synchronisation Google Sheets → Firestore...');
    this.isSyncing = true;
    this.syncStatus.errors = [];

    try {
      // 1. Sync Customers
      await this.syncCustomers();
      
      // 2. Sync Quotes
      await this.syncQuotes();
      
      // 3. Sync Invoices
      await this.syncInvoices();

      this.syncStatus.lastSync = new Date();
      console.log('✅ Synchronisation abgeschlossen:', this.syncStatus);
      
      // Speichere Sync-Status im localStorage
      this.saveSyncStatus();
      
    } catch (error) {
      console.error('❌ Fehler bei Synchronisation:', error);
      this.syncStatus.errors.push((error as Error).message);
    } finally {
      this.isSyncing = false;
    }

    return this.syncStatus;
  }

  /**
   * Synchronisiert nur Kunden
   */
  private async syncCustomers(): Promise<void> {
    try {
      console.log('👥 Synchronisiere Kunden...');
      
      // Lade Kunden aus Google Sheets
      const sheetsCustomers = await googleSheetsPublicService.getCustomers();
      
      // Lade existierende Firestore Kunden (zum Vergleich)
      const firestoreCustomers = await firebaseService.getCustomers();
      const firestoreCustomerIds = new Set(firestoreCustomers.map(c => c.id));
      
      let synced = 0;
      
      for (const customer of sheetsCustomers) {
        // Überspringe Demo-Kunden
        if (customer.id.startsWith('demo_')) continue;
        
        try {
          if (!firestoreCustomerIds.has(customer.id)) {
            // Neuer Kunde - zu Firestore hinzufügen
            await firebaseService.migrateCustomerFromGoogleSheets(customer);
            synced++;
          } else {
            // Existierender Kunde - aktualisieren
            await firebaseService.updateCustomer(customer.id, customer);
            synced++;
          }
        } catch (error) {
          console.error(`Fehler bei Kunde ${customer.id}:`, error);
          this.syncStatus.errors.push(`Kunde ${customer.id}: ${(error as Error).message}`);
        }
      }
      
      this.syncStatus.customerssynced = synced;
      console.log(`✅ ${synced} Kunden synchronisiert`);
      
    } catch (error) {
      console.error('❌ Fehler bei Kunden-Sync:', error);
      throw error;
    }
  }

  /**
   * Synchronisiert nur Angebote
   */
  private async syncQuotes(): Promise<void> {
    try {
      console.log('📄 Synchronisiere Angebote...');
      
      const sheetsQuotes = await googleSheetsPublicService.getQuotes();
      const firestoreQuotes = await firebaseService.getQuotes();
      const firestoreQuoteIds = new Set(firestoreQuotes.map(q => q.id));
      
      let synced = 0;
      
      for (const quote of sheetsQuotes) {
        if (quote.id.startsWith('demo_')) continue;
        
        try {
          if (!firestoreQuoteIds.has(quote.id)) {
            await firebaseService.migrateQuoteFromGoogleSheets(quote);
            synced++;
          } else {
            await firebaseService.updateQuote(quote.id, quote);
            synced++;
          }
        } catch (error) {
          console.error(`Fehler bei Angebot ${quote.id}:`, error);
          this.syncStatus.errors.push(`Angebot ${quote.id}: ${(error as Error).message}`);
        }
      }
      
      this.syncStatus.quotessynced = synced;
      console.log(`✅ ${synced} Angebote synchronisiert`);
      
    } catch (error) {
      console.error('❌ Fehler bei Angebots-Sync:', error);
      throw error;
    }
  }

  /**
   * Synchronisiert nur Rechnungen
   */
  private async syncInvoices(): Promise<void> {
    try {
      console.log('💰 Synchronisiere Rechnungen...');
      
      const sheetsInvoices = await googleSheetsPublicService.getInvoices();
      const firestoreInvoices = await firebaseService.getInvoices();
      const firestoreInvoiceIds = new Set(firestoreInvoices.map(i => i.id));
      
      let synced = 0;
      
      for (const invoice of sheetsInvoices) {
        if (invoice.id?.startsWith('demo_')) continue;
        
        try {
          if (invoice.id && !firestoreInvoiceIds.has(invoice.id)) {
            await firebaseService.addInvoice(invoice);
            synced++;
          }
        } catch (error) {
          console.error(`Fehler bei Rechnung ${invoice.id}:`, error);
          this.syncStatus.errors.push(`Rechnung ${invoice.id}: ${(error as Error).message}`);
        }
      }
      
      this.syncStatus.invoicessynced = synced;
      console.log(`✅ ${synced} Rechnungen synchronisiert`);
      
    } catch (error) {
      console.error('❌ Fehler bei Rechnungs-Sync:', error);
      throw error;
    }
  }

  /**
   * Gibt den aktuellen Sync-Status zurück
   */
  getSyncStatus(): SyncStatus {
    return this.syncStatus;
  }

  /**
   * Lädt den letzten Sync-Status aus localStorage
   */
  loadSyncStatus(): void {
    const saved = localStorage.getItem('autoSyncStatus');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.syncStatus = {
          ...parsed,
          lastSync: parsed.lastSync ? new Date(parsed.lastSync) : null
        };
      } catch (error) {
        console.error('Fehler beim Laden des Sync-Status:', error);
      }
    }
  }

  /**
   * Speichert den Sync-Status in localStorage
   */
  private saveSyncStatus(): void {
    localStorage.setItem('autoSyncStatus', JSON.stringify(this.syncStatus));
  }

  /**
   * Prüft ob eine Synchronisation nötig ist
   */
  needsSync(): boolean {
    if (!this.syncStatus.lastSync) return true;
    
    // Sync wenn älter als 10 Minuten
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    return this.syncStatus.lastSync < tenMinutesAgo;
  }
}

export const autoSyncService = new AutoSyncService();