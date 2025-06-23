import { firebaseService } from './firebaseServiceWrapper';
import { googleSheetsPublicService } from './googleSheetsPublic';
import { Customer, Quote, Invoice } from '../types';

interface MigrationProgress {
  total: number;
  completed: number;
  failed: number;
  status: string;
}

class MigrationService {
  /**
   * Migriere alle Daten von Google Sheets zu Firestore
   */
  async migrateAllData(
    onProgress?: (progress: MigrationProgress) => void
  ): Promise<void> {
    console.log('🚀 Starte vollständige Migration zu Firestore...');

    try {
      // 1. Migriere Kunden
      await this.migrateCustomers(onProgress);
      
      // 2. Migriere Angebote
      await this.migrateQuotes(onProgress);
      
      // 3. Migriere Rechnungen
      await this.migrateInvoices(onProgress);

      console.log('✅ Migration abgeschlossen!');
    } catch (error) {
      console.error('❌ Migration fehlgeschlagen:', error);
      throw error;
    }
  }

  /**
   * Migriere nur Kunden
   */
  async migrateCustomers(
    onProgress?: (progress: MigrationProgress) => void
  ): Promise<void> {
    console.log('👥 Migriere Kunden...');

    try {
      // Lade alle Kunden aus Google Sheets
      const customers = await googleSheetsPublicService.getCustomers();
      const total = customers.length;
      let completed = 0;
      let failed = 0;

      for (const customer of customers) {
        try {
          // Überspringe Demo-Kunden
          if (customer.id.startsWith('demo_')) {
            console.log('⏭️ Überspringe Demo-Kunde:', customer.id);
            completed++;
            continue;
          }

          // Migriere Kunde zu Firestore
          await firebaseService.migrateCustomerFromGoogleSheets(customer);
          completed++;

          if (onProgress) {
            onProgress({
              total,
              completed,
              failed,
              status: `Migriere Kunde ${customer.name}...`,
            });
          }
        } catch (error) {
          console.error(`❌ Fehler bei Kunde ${customer.id}:`, error);
          failed++;
        }
      }

      console.log(`✅ Kunden-Migration abgeschlossen: ${completed}/${total} erfolgreich`);
    } catch (error) {
      console.error('❌ Fehler bei Kunden-Migration:', error);
      throw error;
    }
  }

  /**
   * Migriere nur Angebote
   */
  async migrateQuotes(
    onProgress?: (progress: MigrationProgress) => void
  ): Promise<void> {
    console.log('📄 Migriere Angebote...');

    try {
      const quotes = await googleSheetsPublicService.getQuotes();
      const total = quotes.length;
      let completed = 0;
      let failed = 0;

      for (const quote of quotes) {
        try {
          // Überspringe Demo-Angebote
          if (quote.id.startsWith('demo_')) {
            console.log('⏭️ Überspringe Demo-Angebot:', quote.id);
            completed++;
            continue;
          }

          await firebaseService.migrateQuoteFromGoogleSheets(quote);
          completed++;

          if (onProgress) {
            onProgress({
              total,
              completed,
              failed,
              status: `Migriere Angebot ${quote.id}...`,
            });
          }
        } catch (error) {
          console.error(`❌ Fehler bei Angebot ${quote.id}:`, error);
          failed++;
        }
      }

      console.log(`✅ Angebots-Migration abgeschlossen: ${completed}/${total} erfolgreich`);
    } catch (error) {
      console.error('❌ Fehler bei Angebots-Migration:', error);
      throw error;
    }
  }

  /**
   * Migriere nur Rechnungen
   */
  async migrateInvoices(
    onProgress?: (progress: MigrationProgress) => void
  ): Promise<void> {
    console.log('💰 Migriere Rechnungen...');

    try {
      const invoices = await googleSheetsPublicService.getInvoices();
      const total = invoices.length;
      let completed = 0;
      let failed = 0;

      for (const invoice of invoices) {
        try {
          // Überspringe Demo-Rechnungen
          if (invoice.id?.startsWith('demo_')) {
            console.log('⏭️ Überspringe Demo-Rechnung:', invoice.id);
            completed++;
            continue;
          }

          await firebaseService.addInvoice(invoice);
          completed++;

          if (onProgress) {
            onProgress({
              total,
              completed,
              failed,
              status: `Migriere Rechnung ${invoice.invoiceNumber}...`,
            });
          }
        } catch (error) {
          console.error(`❌ Fehler bei Rechnung ${invoice.id}:`, error);
          failed++;
        }
      }

      console.log(`✅ Rechnungs-Migration abgeschlossen: ${completed}/${total} erfolgreich`);
    } catch (error) {
      console.error('❌ Fehler bei Rechnungs-Migration:', error);
      throw error;
    }
  }

  /**
   * Teste die Migration mit einem einzelnen Kunden
   */
  async testMigrationWithSingleCustomer(customerId: string): Promise<void> {
    console.log('🧪 Teste Migration mit einem Kunden...');

    try {
      // Lade Kunde aus Google Sheets
      const customers = await googleSheetsPublicService.getCustomers();
      const customer = customers.find(c => c.id === customerId);

      if (!customer) {
        throw new Error(`Kunde ${customerId} nicht gefunden`);
      }

      // Migriere zu Firestore
      await firebaseService.migrateCustomerFromGoogleSheets(customer);

      // Verifiziere Migration
      const migratedCustomer = await firebaseService.getCustomerById(customer.id);
      
      if (migratedCustomer) {
        console.log('✅ Test-Migration erfolgreich:', migratedCustomer);
      } else {
        throw new Error('Migration fehlgeschlagen - Kunde nicht in Firestore gefunden');
      }
    } catch (error) {
      console.error('❌ Test-Migration fehlgeschlagen:', error);
      throw error;
    }
  }

  /**
   * Vergleiche Daten zwischen Google Sheets und Firestore
   */
  async compareDataSources(): Promise<{
    googleSheets: { customers: number; quotes: number; invoices: number };
    firestore: { customers: number; quotes: number; invoices: number };
    differences: string[];
  }> {
    console.log('🔍 Vergleiche Datenquellen...');

    try {
      // Google Sheets Daten
      const gsCustomers = await googleSheetsPublicService.getCustomers();
      const gsQuotes = await googleSheetsPublicService.getQuotes();
      const gsInvoices = await googleSheetsPublicService.getInvoices();

      // Firestore Daten
      const fsCustomers = await firebaseService.getCustomers();
      const fsQuotes = await firebaseService.getQuotes();
      const fsInvoices = await firebaseService.getInvoices();

      // Finde Unterschiede
      const differences: string[] = [];

      // Filter Demo-Daten aus Google Sheets
      const realGsCustomers = gsCustomers.filter(c => !c.id.startsWith('demo_'));
      const realGsQuotes = gsQuotes.filter(q => !q.id.startsWith('demo_'));
      const realGsInvoices = gsInvoices.filter(i => i.id && !i.id.startsWith('demo_'));

      if (realGsCustomers.length !== fsCustomers.length) {
        differences.push(
          `Kunden: ${realGsCustomers.length} in Google Sheets, ${fsCustomers.length} in Firestore`
        );
      }

      if (realGsQuotes.length !== fsQuotes.length) {
        differences.push(
          `Angebote: ${realGsQuotes.length} in Google Sheets, ${fsQuotes.length} in Firestore`
        );
      }

      if (realGsInvoices.length !== fsInvoices.length) {
        differences.push(
          `Rechnungen: ${realGsInvoices.length} in Google Sheets, ${fsInvoices.length} in Firestore`
        );
      }

      const result = {
        googleSheets: {
          customers: realGsCustomers.length,
          quotes: realGsQuotes.length,
          invoices: realGsInvoices.length,
        },
        firestore: {
          customers: fsCustomers.length,
          quotes: fsQuotes.length,
          invoices: fsInvoices.length,
        },
        differences,
      };

      console.log('📊 Vergleichsergebnis:', result);
      return result;
    } catch (error) {
      console.error('❌ Fehler beim Datenvergleich:', error);
      throw error;
    }
  }

  /**
   * Lösche alle Firestore-Daten (VORSICHT!)
   */
  async clearFirestoreData(): Promise<void> {
    console.warn('⚠️ WARNUNG: Lösche alle Firestore-Daten...');
    
    const confirmed = window.confirm(
      'WARNUNG: Dies löscht ALLE Daten aus Firestore!\n\nSind Sie sicher?'
    );

    if (!confirmed) {
      console.log('❌ Löschvorgang abgebrochen');
      return;
    }

    try {
      // Lösche alle Kunden
      const customers = await firebaseService.getCustomers();
      for (const customer of customers) {
        await firebaseService.deleteCustomer(customer.id);
      }

      console.log('✅ Alle Firestore-Daten gelöscht');
    } catch (error) {
      console.error('❌ Fehler beim Löschen:', error);
      throw error;
    }
  }
}

export const migrationService = new MigrationService();