import axios from 'axios';
import { Customer, Quote } from '@/types';

// Lexware API Configuration
const LEXWARE_API_URL = 'https://api.lexware.io/v1';

class LexwareService {
  private apiKey: string = '';
  
  constructor() {
    // Versuche API Key aus verschiedenen Quellen zu laden
    this.apiKey = process.env.REACT_APP_LEXWARE_API_KEY || 
                  localStorage.getItem('lexware-api-key') || 
                  '';
                  
    // Wenn kein API Key gefunden, nutze den aus dem MCP Server
    if (!this.apiKey) {
      console.warn('⚠️ Kein Lexware API Key gefunden. Bitte REACT_APP_LEXWARE_API_KEY setzen oder in den Einstellungen hinterlegen.');
    }
  }
  
  private get headers() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
  }
  
  /**
   * Setzt den API Key
   */
  setApiKey(key: string) {
    this.apiKey = key;
    localStorage.setItem('lexware-api-key', key);
  }
  
  /**
   * Prüft ob API Key vorhanden ist
   */
  hasApiKey(): boolean {
    return this.apiKey !== '';
  }

  // ==================== KUNDEN MANAGEMENT ====================

  /**
   * Holt alle Kunden von Lexware
   */
  async fetchLexwareCustomers(): Promise<any[]> {
    try {
      const response = await axios.get(`${LEXWARE_API_URL}/contacts`, {
        headers: this.headers,
        params: {
          role: 'customer',
          size: 100
        }
      });
      
      console.log('✅ Lexware Kunden abgerufen:', response.data.content?.length || 0);
      return response.data.content || [];
    } catch (error: any) {
      console.error('❌ Fehler beim Abrufen der Lexware Kunden:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Konvertiert Lexware Kunde zu App-Format
   */
  convertLexwareToCustomer(lexwareContact: any): Partial<Customer> {
    const billing = lexwareContact.addresses?.billing?.[0] || {};
    const email = lexwareContact.emailAddresses?.business?.[0] || 
                  lexwareContact.emailAddresses?.private?.[0] || '';
    const phone = lexwareContact.phoneNumbers?.mobile?.[0] || 
                  lexwareContact.phoneNumbers?.business?.[0] || 
                  lexwareContact.phoneNumbers?.private?.[0] || '';
    
    return {
      name: lexwareContact.company?.name || 
            `${lexwareContact.person?.firstName || ''} ${lexwareContact.person?.lastName || ''}`.trim(),
      email: email,
      phone: phone,
      fromAddress: `${billing.street || ''}, ${billing.zip || ''} ${billing.city || ''}`.trim(),
      toAddress: '', // Muss separat gefüllt werden
      movingDate: new Date().toISOString().split('T')[0],
      apartment: {
        rooms: 0,
        area: 0,
        floor: 0,
        hasElevator: false
      },
      services: [],
      notes: lexwareContact.note || '',
      company: lexwareContact.company?.name,
      salutation: lexwareContact.person?.salutation,
      address: billing.street,
      city: billing.city,
      zip: billing.zip
    };
  }

  /**
   * Erstellt einen neuen Kunden in Lexware
   */
  async createLexwareCustomer(customer: Customer): Promise<string | null> {
    try {
      const [firstName, ...lastNameParts] = (customer.name || '').split(' ');
      const lastName = lastNameParts.join(' ') || firstName;
      
      const customerData = {
        version: 0,
        roles: {
          customer: {}
        },
        person: customer.company ? undefined : {
          salutation: customer.salutation || 'Herr',
          firstName: firstName,
          lastName: lastName
        },
        company: customer.company ? {
          name: customer.company
        } : undefined,
        addresses: {
          billing: [{
            street: customer.address || customer.fromAddress?.split(',')[0] || '',
            zip: customer.zip || '',
            city: customer.city || customer.fromAddress?.split(',')[1]?.trim() || '',
            countryCode: 'DE'
          }]
        },
        emailAddresses: customer.email ? {
          business: [customer.email]
        } : undefined,
        phoneNumbers: customer.phone ? {
          mobile: [customer.phone]
        } : undefined,
        note: customer.notes
      };

      const response = await axios.post(`${LEXWARE_API_URL}/contacts`, customerData, {
        headers: this.headers
      });

      console.log('✅ Kunde in Lexware angelegt:', response.data.id);
      return response.data.id;
    } catch (error: any) {
      if (error.response?.status === 409) {
        console.log('⚠️ Kunde existiert bereits in Lexware');
        // Versuche existierenden Kunden zu finden
        return await this.findExistingCustomer(customer);
      }
      console.error('❌ Fehler beim Anlegen des Kunden in Lexware:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Sucht einen existierenden Kunden in Lexware
   */
  async findExistingCustomer(customer: Customer): Promise<string | null> {
    try {
      const customers = await this.fetchLexwareCustomers();
      const found = customers.find((c: any) => {
        const email = c.emailAddresses?.business?.[0] || c.emailAddresses?.private?.[0];
        return email === customer.email;
      });
      
      return found?.id || null;
    } catch (error) {
      console.error('❌ Fehler bei der Kundensuche:', error);
      return null;
    }
  }

  // ==================== ANGEBOTE MANAGEMENT ====================

  /**
   * Holt alle Angebote von Lexware
   */
  async fetchLexwareQuotations(): Promise<any[]> {
    try {
      const response = await axios.get(`${LEXWARE_API_URL}/quotations`, {
        headers: this.headers,
        params: {
          size: 100,
          sort: 'voucherDate,DESC'
        }
      });
      
      console.log('✅ Lexware Angebote abgerufen:', response.data.content?.length || 0);
      return response.data.content || [];
    } catch (error: any) {
      console.error('❌ Fehler beim Abrufen der Angebote:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Erstellt ein Angebot in Lexware
   */
  async createLexwareQuotation(quote: Quote, customer: Customer, lexwareCustomerId?: string): Promise<string | null> {
    try {
      // Stelle sicher, dass wir eine Lexware Kunden-ID haben
      let customerId = lexwareCustomerId;
      if (!customerId) {
        const newCustomerId = await this.createLexwareCustomer(customer);
        if (!newCustomerId) {
          throw new Error('Kunde konnte nicht in Lexware angelegt werden');
        }
        customerId = newCustomerId;
      }

      // Bereite Line Items vor
      const lineItems = this.prepareLineItems(quote, customer);
      
      const quotationData = {
        voucherDate: new Date().toISOString().replace('Z', '+01:00'),
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().replace('Z', '+01:00'),
        address: {
          contactId: customerId,
          name: customer.company || customer.name,
          street: customer.address || customer.fromAddress?.split(',')[0] || '',
          zip: customer.zip || '',
          city: customer.city || customer.fromAddress?.split(',')[1]?.trim() || '',
          countryCode: 'DE'
        },
        lineItems: lineItems,
        totalPrice: {
          currency: 'EUR'
        },
        taxConditions: {
          taxType: 'net'
        },
        paymentConditions: {
          paymentTermLabel: 'Zahlbar innerhalb 14 Tagen nach Auftragserteilung',
          paymentTermDuration: 14
        },
        introduction: this.generateIntroduction(quote, customer),
        remark: this.generateRemark(quote, customer)
      };

      const response = await axios.post(`${LEXWARE_API_URL}/quotations`, quotationData, {
        headers: this.headers
      });

      console.log('✅ Angebot in Lexware erstellt:', response.data.id);
      return response.data.id;
    } catch (error: any) {
      console.error('❌ Fehler beim Erstellen des Angebots:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Bereitet Line Items für Lexware vor
   */
  private prepareLineItems(quote: Quote, customer: Customer): any[] {
    const items: any[] = [];
    
    // Hauptleistung - Umzug
    if (quote.price > 0) {
      const baseService = {
        type: 'custom',
        name: this.getServiceName(quote, customer),
        description: this.getServiceDescription(quote, customer),
        quantity: quote.volume || 1,
        unitName: quote.volume ? 'm³' : 'Pausch.',
        unitPrice: {
          currency: 'EUR',
          netAmount: quote.volume ? (quote.price / quote.volume) : quote.price,
          taxRatePercentage: 19
        }
      };
      items.push(baseService);
    }

    // Zusatzleistungen
    if (quote.packingMaterials) {
      items.push({
        type: 'custom',
        name: 'Verpackungsmaterial',
        description: 'Kartons, Luftpolsterfolie, Packpapier',
        quantity: quote.boxCount || 20,
        unitName: 'Stk.',
        unitPrice: {
          currency: 'EUR',
          netAmount: 5.00,
          taxRatePercentage: 19
        }
      });
    }

    if (quote.furnitureAssemblyPrice && quote.furnitureAssemblyPrice > 0) {
      items.push({
        type: 'custom',
        name: 'Möbelmontage/-demontage',
        description: 'Fachgerechte De- und Montage von Möbeln',
        quantity: 1,
        unitName: 'Pausch.',
        unitPrice: {
          currency: 'EUR',
          netAmount: quote.furnitureAssemblyPrice,
          taxRatePercentage: 19
        }
      });
    }

    if (quote.cleaningService && quote.cleaningHours) {
      items.push({
        type: 'custom',
        name: 'Endreinigung',
        description: 'Professionelle Endreinigung der alten Wohnung',
        quantity: quote.cleaningHours,
        unitName: 'Std.',
        unitPrice: {
          currency: 'EUR',
          netAmount: 35.00,
          taxRatePercentage: 19
        }
      });
    }

    if (quote.parkingZonePrice && quote.parkingZonePrice > 0) {
      items.push({
        type: 'custom',
        name: 'Halteverbotszone',
        description: 'Einrichtung und Genehmigung der Halteverbotszone',
        quantity: 1,
        unitName: 'Pausch.',
        unitPrice: {
          currency: 'EUR',
          netAmount: quote.parkingZonePrice,
          taxRatePercentage: 19
        }
      });
    }

    return items;
  }

  /**
   * Generiert Einleitungstext für Angebot
   */
  private generateIntroduction(quote: Quote, customer: Customer): string {
    return `Sehr geehrte${customer.salutation === 'Frau' ? ' Frau' : 'r Herr'} ${customer.name},

vielen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen ein Angebot für Ihren Umzug von ${customer.fromAddress || quote.moveFrom || ''} nach ${customer.toAddress || quote.moveTo || ''}.

Umzugstermin: ${customer.movingDate || quote.moveDate || 'nach Vereinbarung'}`;
  }

  /**
   * Generiert Bemerkungen für Angebot
   */
  private generateRemark(quote: Quote, customer: Customer): string {
    const remarks = [];
    
    if (customer.apartment?.hasElevator === false && customer.apartment?.floor > 0) {
      remarks.push(`Bitte beachten: ${customer.apartment.floor}. Stock ohne Aufzug`);
    }
    
    if (quote.notes) {
      remarks.push(quote.notes);
    }
    
    if (customer.notes) {
      remarks.push(customer.notes);
    }
    
    remarks.push('\nBei Fragen stehen wir Ihnen gerne zur Verfügung.');
    
    return remarks.join('\n\n');
  }

  /**
   * Bestimmt Service-Namen basierend auf Daten
   */
  private getServiceName(quote: Quote, customer: Customer): string {
    if (quote.services?.includes('Komplettservice')) {
      return 'Umzug Komplettservice';
    }
    if (quote.services?.includes('Nur Transport')) {
      return 'Umzug - Nur Transport';
    }
    return 'Umzugsleistung';
  }

  /**
   * Generiert Service-Beschreibung
   */
  private getServiceDescription(quote: Quote, customer: Customer): string {
    const services = [];
    
    services.push('Be- und Entladung');
    services.push('Transport');
    
    if (quote.services?.includes('Möbelmontage')) {
      services.push('Möbelmontage/-demontage');
    }
    
    if (quote.packingRequested) {
      services.push('Ein- und Auspacken');
    }
    
    return `Inklusive: ${services.join(', ')}`;
  }

  // ==================== SYNC FUNKTIONEN ====================

  /**
   * Synchronisiert alle Kunden von Lexware zur App
   */
  async syncCustomersFromLexware(): Promise<Partial<Customer>[]> {
    console.log('🔄 Starte Kundensynchronisation von Lexware...');
    
    const lexwareCustomers = await this.fetchLexwareCustomers();
    const appCustomers: Partial<Customer>[] = [];
    
    for (const lexCustomer of lexwareCustomers) {
      const customer = this.convertLexwareToCustomer(lexCustomer);
      // Füge Lexware ID für spätere Referenz hinzu
      (customer as any).lexwareId = lexCustomer.id;
      appCustomers.push(customer);
    }
    
    console.log(`✅ ${appCustomers.length} Kunden von Lexware synchronisiert`);
    return appCustomers;
  }

  /**
   * Synchronisiert ein Angebot zur Lexware
   */
  async syncQuoteToLexware(quote: Quote, customer: Customer): Promise<boolean> {
    console.log('🔄 Synchronisiere Angebot zu Lexware...');
    
    const lexwareQuoteId = await this.createLexwareQuotation(quote, customer);
    
    if (lexwareQuoteId) {
      console.log('✅ Angebot erfolgreich zu Lexware synchronisiert:', lexwareQuoteId);
      return true;
    }
    
    return false;
  }

  /**
   * Auto-Sync: Prüft und synchronisiert neue Daten
   */
  async autoSync(): Promise<{
    newCustomers: number;
    newQuotes: number;
  }> {
    console.log('🔄 Starte Auto-Sync mit Lexware...');
    
    // Hier würde die Logik für automatische Synchronisation implementiert
    // Dies würde mit der Supabase Datenbank interagieren
    
    return {
      newCustomers: 0,
      newQuotes: 0
    };
  }
}

export const lexwareService = new LexwareService();