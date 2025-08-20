import { lexwareService } from './lexwareService';
import { supabaseService } from './supabaseService';
import { Customer, Quote } from '../types';

class LexwareSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private lastSyncTime: Date | null = null;

  /**
   * Startet die automatische Synchronisation
   * @param intervalMinutes - Intervall in Minuten (Standard: 5 Minuten)
   */
  startAutoSync(intervalMinutes: number = 5) {
    console.log(`🚀 Starte Lexware Auto-Sync (alle ${intervalMinutes} Minuten)`);
    
    // Führe sofort erste Synchronisation durch
    this.performSync();
    
    // Setze Intervall für regelmäßige Synchronisation
    this.syncInterval = setInterval(() => {
      this.performSync();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stoppt die automatische Synchronisation
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏹️ Lexware Auto-Sync gestoppt');
    }
  }

  /**
   * Führt eine vollständige Synchronisation durch
   */
  async performSync() {
    // Prüfe ob API Key vorhanden ist
    if (!lexwareService.hasApiKey()) {
      console.warn('⚠️ Lexware Sync übersprungen - kein API Key konfiguriert');
      console.warn('Bitte setze REACT_APP_LEXWARE_API_KEY in der .env Datei');
      return;
    }
    
    if (this.isSyncing) {
      console.log('⚠️ Synchronisation läuft bereits...');
      return;
    }

    this.isSyncing = true;
    console.log('🔄 Starte Lexware Synchronisation...');

    try {
      const results = {
        customersFromLexware: 0,
        customersToLexware: 0,
        quotesToLexware: 0,
        errors: [] as string[]
      };

      // 1. Hole Kunden von Lexware und synchronisiere zur App
      await this.syncCustomersFromLexware(results);

      // 2. Synchronisiere neue Kunden von App zu Lexware
      await this.syncCustomersToLexware(results);

      // 3. Synchronisiere Angebote zu Lexware
      await this.syncQuotesToLexware(results);

      this.lastSyncTime = new Date();
      
      console.log('✅ Synchronisation abgeschlossen:', {
        ...results,
        zeitpunkt: this.lastSyncTime.toLocaleString('de-DE')
      });

      // Speichere Sync-Status in Supabase
      await this.saveSyncStatus(results);

    } catch (error) {
      console.error('❌ Fehler bei der Synchronisation:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Synchronisiert Kunden von Lexware zur App
   */
  private async syncCustomersFromLexware(results: any) {
    try {
      console.log('📥 Hole Kunden von Lexware...');
      
      // Hole alle Lexware Kunden
      const lexwareCustomers = await lexwareService.syncCustomersFromLexware();
      
      // Hole existierende Kunden aus Supabase
      const existingCustomers = await supabaseService.getCustomers();
      const existingEmails = new Set(existingCustomers.map(c => c.email?.toLowerCase()));
      
      // Finde neue Kunden
      const newCustomers = lexwareCustomers.filter(lexCustomer => {
        const email = lexCustomer.email?.toLowerCase();
        return email && !existingEmails.has(email);
      });

      // Füge neue Kunden zu Supabase hinzu
      for (const customer of newCustomers) {
        try {
          // Füge fehlende Pflichtfelder hinzu
          const customerData: Customer = {
            id: '', // Wird von Supabase generiert
            name: customer.name || 'Unbekannt',
            email: customer.email || '',
            phone: customer.phone || '',
            movingDate: customer.movingDate || new Date().toISOString().split('T')[0],
            fromAddress: customer.fromAddress || '',
            toAddress: customer.toAddress || '',
            apartment: customer.apartment || {
              rooms: 0,
              area: 0,
              floor: 0,
              hasElevator: false
            },
            services: customer.services || [],
            notes: customer.notes,
            company: customer.company,
            salutation: customer.salutation,
            address: customer.address,
            city: customer.city,
            zip: customer.zip,
            // Speichere Lexware ID für spätere Referenz
            salesNotes: [{
              id: 'lexware-sync',
              content: `Lexware ID: ${(customer as any).lexwareId}`,
              createdAt: new Date(),
              createdBy: 'System',
              type: 'other'
            }]
          };

          await supabaseService.createCustomer(customerData);
          results.customersFromLexware++;
          console.log(`✅ Kunde importiert: ${customer.name}`);
        } catch (error) {
          console.error(`❌ Fehler beim Import von ${customer.name}:`, error);
          results.errors.push(`Kunde ${customer.name}: ${error}`);
        }
      }

      console.log(`📥 ${results.customersFromLexware} neue Kunden von Lexware importiert`);
    } catch (error) {
      console.error('❌ Fehler beim Kunden-Import von Lexware:', error);
      results.errors.push(`Kunden-Import: ${error}`);
    }
  }

  /**
   * Synchronisiert neue Kunden von App zu Lexware
   */
  private async syncCustomersToLexware(results: any) {
    try {
      console.log('📤 Synchronisiere neue Kunden zu Lexware...');
      
      // Hole alle Kunden aus Supabase
      const customers = await supabaseService.getCustomers();
      
      // Filtere Kunden ohne Lexware ID
      const customersWithoutLexwareId = customers.filter(customer => {
        // Prüfe ob Lexware ID in den Notizen gespeichert ist
        const hasLexwareId = customer.salesNotes?.some(note => 
          note.content?.includes('Lexware ID:')
        );
        return !hasLexwareId;
      });

      for (const customer of customersWithoutLexwareId) {
        try {
          // Erstelle Kunde in Lexware
          const lexwareId = await lexwareService.createLexwareCustomer(customer);
          
          if (lexwareId) {
            // Speichere Lexware ID in Supabase
            const updatedNotes = customer.salesNotes || [];
            updatedNotes.push({
              id: `lexware-${Date.now()}`,
              content: `Lexware ID: ${lexwareId}`,
              createdAt: new Date(),
              createdBy: 'System',
              type: 'other'
            });

            await supabaseService.updateCustomer(customer.id, {
              salesNotes: updatedNotes
            });

            results.customersToLexware++;
            console.log(`✅ Kunde zu Lexware exportiert: ${customer.name}`);
          }
        } catch (error) {
          console.error(`❌ Fehler beim Export von ${customer.name}:`, error);
          results.errors.push(`Kunde ${customer.name}: ${error}`);
        }
      }

      console.log(`📤 ${results.customersToLexware} Kunden zu Lexware exportiert`);
    } catch (error) {
      console.error('❌ Fehler beim Kunden-Export zu Lexware:', error);
      results.errors.push(`Kunden-Export: ${error}`);
    }
  }

  /**
   * Synchronisiert Angebote zu Lexware
   */
  private async syncQuotesToLexware(results: any) {
    try {
      console.log('📤 Synchronisiere Angebote zu Lexware...');
      
      // Hole alle Angebote aus Supabase
      const quotes = await supabaseService.getQuotes();
      
      // Filtere Angebote ohne Lexware ID und mit Status 'sent' oder 'confirmed'
      const quotesToSync = quotes.filter(quote => {
        const shouldSync = ['sent', 'confirmed', 'accepted'].includes(quote.status);
        const hasLexwareId = quote.notes?.includes('Lexware Quote ID:');
        return shouldSync && !hasLexwareId;
      });

      for (const quote of quotesToSync) {
        try {
          // Hole zugehörigen Kunden
          const customer = await supabaseService.getCustomer(quote.customerId);
          
          if (customer) {
            // Finde Lexware Kunden ID
            const lexwareIdNote = customer.salesNotes?.find(note => 
              note.content?.includes('Lexware ID:')
            );
            const lexwareCustomerId = lexwareIdNote?.content?.split('Lexware ID:')[1]?.trim();

            // Erstelle Angebot in Lexware
            const lexwareQuoteId = await lexwareService.createLexwareQuotation(
              quote, 
              customer, 
              lexwareCustomerId || undefined
            );
            
            if (lexwareQuoteId) {
              // Speichere Lexware Quote ID in Supabase
              const updatedNotes = (quote.notes || '') + 
                `\n[System] Lexware Quote ID: ${lexwareQuoteId}`;
              
              await supabaseService.updateQuote(quote.id, {
                notes: updatedNotes
              });

              results.quotesToLexware++;
              console.log(`✅ Angebot zu Lexware exportiert: ${quote.id}`);
            }
          }
        } catch (error) {
          console.error(`❌ Fehler beim Export von Angebot ${quote.id}:`, error);
          results.errors.push(`Angebot ${quote.id}: ${error}`);
        }
      }

      console.log(`📤 ${results.quotesToLexware} Angebote zu Lexware exportiert`);
    } catch (error) {
      console.error('❌ Fehler beim Angebots-Export zu Lexware:', error);
      results.errors.push(`Angebots-Export: ${error}`);
    }
  }

  /**
   * Speichert den Sync-Status in Supabase
   */
  private async saveSyncStatus(results: any) {
    try {
      // Hier könnte eine spezielle Sync-Status Tabelle in Supabase verwendet werden
      console.log('💾 Sync-Status gespeichert:', results);
    } catch (error) {
      console.error('❌ Fehler beim Speichern des Sync-Status:', error);
    }
  }

  /**
   * Führt eine manuelle Synchronisation durch
   */
  async manualSync() {
    await this.performSync();
  }

  /**
   * Gibt den aktuellen Sync-Status zurück
   */
  getSyncStatus() {
    return {
      isRunning: this.isSyncing,
      isAutoSyncActive: this.syncInterval !== null,
      lastSyncTime: this.lastSyncTime
    };
  }

  /**
   * Synchronisiert einen einzelnen Kunden zu Lexware
   */
  async syncSingleCustomerToLexware(customer: Customer): Promise<string | null> {
    console.log(`🔄 Synchronisiere Kunde ${customer.name} zu Lexware...`);
    
    try {
      const lexwareId = await lexwareService.createLexwareCustomer(customer);
      
      if (lexwareId) {
        // Speichere Lexware ID
        const updatedNotes = customer.salesNotes || [];
        updatedNotes.push({
          id: `lexware-${Date.now()}`,
          content: `Lexware ID: ${lexwareId}`,
          createdAt: new Date(),
          createdBy: 'System',
          type: 'other'
        });

        await supabaseService.updateCustomer(customer.id, {
          salesNotes: updatedNotes
        });

        console.log(`✅ Kunde erfolgreich synchronisiert: ${lexwareId}`);
        return lexwareId;
      }
    } catch (error) {
      console.error('❌ Fehler bei der Kundensynchronisation:', error);
    }
    
    return null;
  }

  /**
   * Synchronisiert ein einzelnes Angebot zu Lexware
   */
  async syncSingleQuoteToLexware(quote: Quote, customer: Customer): Promise<string | null> {
    console.log(`🔄 Synchronisiere Angebot ${quote.id} zu Lexware...`);
    
    try {
      // Finde Lexware Kunden ID
      const lexwareIdNote = customer.salesNotes?.find(note => 
        note.content?.includes('Lexware ID:')
      );
      let lexwareCustomerId = lexwareIdNote?.content?.split('Lexware ID:')[1]?.trim();

      // Falls Kunde noch nicht in Lexware, erstelle ihn zuerst
      if (!lexwareCustomerId) {
        const newCustomerId = await this.syncSingleCustomerToLexware(customer);
        lexwareCustomerId = newCustomerId || undefined;
      }

      // Erstelle Angebot in Lexware
      const lexwareQuoteId = await lexwareService.createLexwareQuotation(
        quote, 
        customer, 
        lexwareCustomerId || undefined
      );
      
      if (lexwareQuoteId) {
        // Speichere Lexware Quote ID
        const updatedNotes = (quote.notes || '') + 
          `\n[System] Lexware Quote ID: ${lexwareQuoteId}`;
        
        await supabaseService.updateQuote(quote.id, {
          notes: updatedNotes
        });

        console.log(`✅ Angebot erfolgreich synchronisiert: ${lexwareQuoteId}`);
        return lexwareQuoteId;
      }
    } catch (error) {
      console.error('❌ Fehler bei der Angebotssynchronisation:', error);
    }
    
    return null;
  }
}

export const lexwareSyncService = new LexwareSyncService();