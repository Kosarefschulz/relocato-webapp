import { Customer, Quote, Invoice, EmailHistory } from '../types';
import { cleanPhoneNumber } from '../utils/phoneUtils';
import { toISODateString } from '../utils/dateUtils';

class GoogleSheetsPublicService {
  private spreadsheetId = process.env.REACT_APP_GOOGLE_SHEETS_ID || '178tpFCNqmnDZxkzOfgWQCS6BW7wn2rYyTB3hZh8H7PU';
  private apiKey = process.env.REACT_APP_GOOGLE_SHEETS_API_KEY || '';
  private localStorageKey = 'relocato_local_customers';
  private localQuotesKey = 'relocato_local_quotes';
  private localInvoicesKey = 'relocato_local_invoices';

  private getLocalCustomers(): Customer[] {
    try {
      const stored = localStorage.getItem(this.localStorageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Fehler beim Laden lokaler Kunden:', error);
      return [];
    }
  }

  private saveLocalCustomers(customers: Customer[]): void {
    try {
      localStorage.setItem(this.localStorageKey, JSON.stringify(customers));
    } catch (error) {
      console.error('Fehler beim Speichern lokaler Kunden:', error);
    }
  }

  private getLocalQuotes(): Quote[] {
    try {
      const stored = localStorage.getItem(this.localQuotesKey);
      if (!stored) return [];
      
      // Parse und konvertiere Date-Strings zurück zu Date-Objekten
      const quotes = JSON.parse(stored);
      return quotes.map((quote: any) => ({
        ...quote,
        createdAt: new Date(quote.createdAt)
      }));
    } catch (error) {
      console.error('Fehler beim Laden lokaler Angebote:', error);
      return [];
    }
  }

  private saveLocalQuotes(quotes: Quote[]): void {
    try {
      localStorage.setItem(this.localQuotesKey, JSON.stringify(quotes));
    } catch (error) {
      console.error('Fehler beim Speichern lokaler Angebote:', error);
    }
  }

  async getCustomers(): Promise<Customer[]> {
    try {
      console.log('📊 Lade Daten aus Ihrem Google Sheets...');
      console.log('🔗 Spreadsheet URL: https://docs.google.com/spreadsheets/d/' + this.spreadsheetId);
      
      // Mehrere Methoden probieren
      const methods = [
        `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/export?format=csv&gid=0`,
        `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/gviz/tq?tqx=out:csv&sheet=Sheet1`,
        `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/gviz/tq?tqx=out:csv&gid=0`
      ];
      
      for (const url of methods) {
        try {
          console.log('🔄 Versuche URL:', url);
          
          const response = await fetch(url, {
            mode: 'cors',
            headers: {
              'Accept': 'text/csv, text/plain, */*'
            }
          });
          
          if (response.ok) {
            const csvText = await response.text();
            console.log('📋 CSV Daten erhalten:', csvText.substring(0, 300) + '...');
            
            if (csvText && !csvText.includes('<HTML>') && !csvText.includes('Temporary Redirect')) {
              const sheetsCustomers = this.parseCSVToCustomers(csvText);
              const localCustomers = this.getLocalCustomers();
              
              // Kombiniere Google Sheets Kunden mit lokalen Kunden
              const allCustomers = [...sheetsCustomers, ...localCustomers];
              console.log(`✅ ${sheetsCustomers.length} Kunden aus Google Sheets + ${localCustomers.length} lokale Kunden = ${allCustomers.length} total`);
              return allCustomers;
            }
          }
        } catch (fetchError) {
          console.log('⚠️ Methode fehlgeschlagen:', fetchError);
          continue;
        }
      }
      
      throw new Error('Alle CSV-Zugriffsmethoden fehlgeschlagen');
      
    } catch (error) {
      console.error('❌ Fehler beim Laden der öffentlichen Daten:', error);
      console.log('🔄 Zeige Demo-Daten basierend auf Ihrer Struktur...');
      
      // Lade lokale Kunden auch wenn Google Sheets nicht verfügbar ist
      const localCustomers = this.getLocalCustomers();
      const demoCustomers = this.getDemoCustomersFromYourStructure();
      
      return [...demoCustomers, ...localCustomers];
    }
  }

  private parseCSVToCustomers(csvText: string): Customer[] {
    const lines = csvText.split('\n');
    
    if (lines.length <= 1) {
      console.warn('⚠️ Keine Datenzeilen in CSV gefunden');
      return [];
    }

    // Erste Zeile sind Header, überspringen
    const dataLines = lines.slice(1).filter(line => line.trim() !== '');
    
    return dataLines.map((line, index) => {
      const columns = this.parseCSVLine(line);
      
      // Mapping Ihrer Spalten:
      // 0: Kontakt Name
      // 1: Kontakt Telefon  
      // 2: Kontakt Email
      // 3: Whatsapp
      // 4: Von Adresse
      // 5: Von Etage
      // 6: Von Flaeche M2
      // 7: Nach Adresse
      // 8: Nach Etage
      // 9: Umzugstag
      // 10: Eingang
      // 11: Quelle
      // 12: Datum/Zeit
      // 13: Nachricht gesendet

      return {
        id: `csv_${index + 1}`,
        name: columns[0] || `Kunde ${index + 1}`,
        phone: cleanPhoneNumber(columns[1]) || '',
        email: columns[2] || '',
        movingDate: toISODateString(columns[9]) || '',
        fromAddress: columns[4] ? `${columns[4]}${columns[5] ? ` - Etage ${columns[5]}` : ''}` : '',
        toAddress: columns[7] ? `${columns[7]}${columns[8] ? ` - Etage ${columns[8]}` : ''}` : '',
        apartment: {
          rooms: 3,
          area: this.parseNumber(columns[6]) || 50,
          floor: this.parseNumber(columns[5]) || 1,
          hasElevator: false
        },
        services: ['Umzug'],
        notes: [
          columns[11] ? `Quelle: ${columns[11]}` : '',
          columns[10] ? `Eingang: ${columns[10]}` : '',
          columns[3] ? `WhatsApp: ${cleanPhoneNumber(columns[3])}` : '',
          columns[12] ? `Datum: ${columns[12]}` : '',
          columns[13] ? `Nachricht: ${columns[13]}` : ''
        ].filter(Boolean).join(', ')
      };
    });
  }

  private parseCSVLine(line: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && (i === 0 || line[i-1] === ',')) {
        inQuotes = true;
      } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
        inQuotes = false;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  private parseNumber(value: string): number {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }

  async getCustomer(customerId: string): Promise<Customer | null> {
    try {
      // Lade alle Kunden
      const customers = await this.getCustomers();
      
      // Suche nach ID oder Kundennummer
      const foundCustomer = customers.find(c => 
        c.id === customerId || 
        c.customerNumber === customerId
      );
      
      if (foundCustomer) {
        console.log('✅ Kunde gefunden:', foundCustomer.name);
        return foundCustomer;
      }
      
      console.log('❌ Kunde nicht gefunden:', customerId);
      return null;
    } catch (error) {
      console.error('Fehler beim Laden des Kunden:', error);
      return null;
    }
  }

  async addCustomer(customer: Omit<Customer, 'id'> | Customer): Promise<boolean> {
    try {
      // Generiere eine eindeutige ID nur wenn keine vorhanden ist
      const newCustomer: Customer = {
        ...customer,
        id: 'id' in customer && customer.id ? customer.id : `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      // Lade existierende lokale Kunden
      const localCustomers = this.getLocalCustomers();
      
      // Füge neuen Kunden hinzu
      localCustomers.push(newCustomer);
      
      // Speichere aktualisierte Liste
      this.saveLocalCustomers(localCustomers);
      
      console.log('💾 Neuer Kunde lokal gespeichert:', customer.name);
      console.log('📝 Zum Synchronisieren mit Google Sheets benötigen Sie API-Zugriff');
      console.log('🔗 Manuell hinzufügen: https://docs.google.com/spreadsheets/d/' + this.spreadsheetId);
      
      return true;
    } catch (error) {
      console.error('Fehler beim Speichern des Kunden:', error);
      return false;
    }
  }

  async updateCustomer(customerId: string, updatedData: Partial<Customer>): Promise<boolean> {
    try {
      // Lade existierende Kunden
      const customers = this.getLocalCustomers();
      
      // Finde den Index des zu aktualisierenden Kunden
      const index = customers.findIndex(c => c.id === customerId);
      
      if (index === -1) {
        console.error('❌ Kunde nicht gefunden:', customerId);
        return false;
      }
      
      // Aktualisiere die Kundendaten
      customers[index] = {
        ...customers[index],
        ...updatedData,
        id: customerId // ID beibehalten
      };
      
      // Speichere die aktualisierte Liste
      this.saveLocalCustomers(customers);
      
      console.log('✅ Kunde erfolgreich aktualisiert:', customers[index].name);
      
      return true;
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Kunden:', error);
      return false;
    }
  }

  async deleteCustomer(customerId: string): Promise<boolean> {
    try {
      // Lade existierende lokale Kunden
      const customers = this.getLocalCustomers();
      
      // Finde den Index des zu löschenden Kunden
      const index = customers.findIndex(c => c.id === customerId);
      
      if (index === -1) {
        console.error('❌ Kunde nicht gefunden:', customerId);
        return false;
      }
      
      const customerName = customers[index].name;
      
      // Entferne den Kunden aus der Liste
      customers.splice(index, 1);
      
      // Speichere die aktualisierte Liste
      this.saveLocalCustomers(customers);
      
      // Lösche auch zugehörige Angebote
      const quotes = this.getLocalQuotes();
      const updatedQuotes = quotes.filter(quote => quote.customerId !== customerId);
      this.saveLocalQuotes(updatedQuotes);
      
      // Lösche auch zugehörige Rechnungen
      const invoices = this.getLocalInvoices();
      const updatedInvoices = invoices.filter(invoice => invoice.customerId !== customerId);
      this.saveLocalInvoices(updatedInvoices);
      
      // Lösche auch zugehörige Fotos (import wird zur Laufzeit aufgelöst)
      try {
        const googleDriveService = (await import('./googleDriveService')).default;
        await googleDriveService.deleteCustomerPhotos(customerId);
      } catch (error) {
        console.warn('Hinweis: Fotos konnten nicht automatisch gelöscht werden:', error);
      }
      
      console.log('✅ Kunde erfolgreich gelöscht:', customerName);
      console.log('📝 Hinweis: Für Google Sheets Integration manuell löschen: https://docs.google.com/spreadsheets/d/' + this.spreadsheetId);
      
      return true;
    } catch (error) {
      console.error('Fehler beim Löschen des Kunden:', error);
      return false;
    }
  }

  async addQuote(quote: Omit<Quote, 'id'>): Promise<boolean> {
    try {
      // Generiere eine eindeutige ID
      const newQuote: Quote = {
        ...quote,
        id: `Q${Date.now()}_${Math.random().toString(36).substr(2, 5).toUpperCase()}`
      };
      
      // Save to backend (Google Sheets)
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/quotes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newQuote),
        });

        if (!response.ok) {
          throw new Error(`Backend save failed: ${response.statusText}`);
        }

        console.log('💰 Angebot erfolgreich in Google Sheets gespeichert:', {
          kunde: quote.customerName,
          preis: `€ ${quote.price.toFixed(2)}`,
          datum: quote.createdAt.toLocaleDateString('de-DE'),
          status: quote.status,
          kommentar: quote.comment || 'Kein Kommentar'
        });
      } catch (backendError) {
        console.error('⚠️ Backend-Speicherung fehlgeschlagen:', backendError);
        console.log('📊 Für Google Sheets Integration:');
        console.log('🔗 Fügen Sie das Angebot manuell hinzu: https://docs.google.com/spreadsheets/d/' + this.spreadsheetId);
      }
      
      // Also save locally for immediate UI feedback
      const localQuotes = this.getLocalQuotes();
      localQuotes.push(newQuote);
      this.saveLocalQuotes(localQuotes);
      
      return true;
    } catch (error) {
      console.error('Fehler beim Speichern des Angebots:', error);
      return false;
    }
  }

  // Alias für Kompatibilität
  async saveQuote(quote: Omit<Quote, 'id'>): Promise<boolean> {
    return this.addQuote(quote);
  }

  async updateQuote(quoteId: string, updates: Partial<Quote>): Promise<boolean> {
    try {
      // Update in backend (Google Sheets)
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/quotes/${quoteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Backend update failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Angebot in Google Sheets aktualisiert:', quoteId, updates);

      // Also update locally for immediate UI feedback
      const quotes = this.getLocalQuotes();
      const index = quotes.findIndex(q => q.id === quoteId);
      
      if (index !== -1) {
        quotes[index] = { ...quotes[index], ...updates };
        this.saveLocalQuotes(quotes);
      }
      
      return true;
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Angebots:', error);
      
      // Fallback to local update only
      const quotes = this.getLocalQuotes();
      const index = quotes.findIndex(q => q.id === quoteId);
      
      if (index === -1) {
        console.error('Angebot nicht gefunden:', quoteId);
        return false;
      }
      
      quotes[index] = { ...quotes[index], ...updates };
      this.saveLocalQuotes(quotes);
      
      console.log('⚠️ Angebot nur lokal aktualisiert (Backend nicht erreichbar):', quoteId, updates);
      return true;
    }
  }


  async getQuotes(): Promise<Quote[]> {
    // Lade lokale Angebote
    const localQuotes = this.getLocalQuotes();
    const demoQuotes = this.getDemoQuotes();
    
    // Kombiniere Demo-Angebote mit lokalen Angeboten
    return [...demoQuotes, ...localQuotes];
  }

  async getQuotesByCustomerId(customerId: string): Promise<Quote[]> {
    const allQuotes = await this.getQuotes();
    return allQuotes.filter(quote => quote.customerId === customerId);
  }

  async getInvoicesByCustomerId(customerId: string): Promise<Invoice[]> {
    // Placeholder für zukünftige Implementierung
    return [];
  }

  async getEmailHistoryByCustomerId(customerId: string): Promise<EmailHistory[]> {
    // Demo-Daten für Email-History
    const demoEmails: EmailHistory[] = [
      {
        id: 'email_1',
        customerId: customerId,
        recipient: 'demo@example.com',
        subject: 'Ihr Umzugsangebot von Relocato',
        body: 'Sehr geehrte Damen und Herren, anbei finden Sie Ihr persönliches Umzugsangebot...',
        sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 Tage her
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        sentBy: 'system',
        type: 'quote',
        attachments: ['Angebot_2024_001.pdf'],
        status: 'opened'
      },
      {
        id: 'email_2',
        customerId: customerId,
        recipient: 'demo@example.com',
        subject: 'Erinnerung: Ihr Umzugstermin naht',
        body: 'Guten Tag, wir möchten Sie daran erinnern, dass Ihr Umzug in 3 Tagen stattfindet...',
        sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 Tag her
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        sentBy: 'system',
        type: 'reminder',
        status: 'delivered'
      }
    ];

    // Nur Demo-Emails für den angefragten Kunden zurückgeben
    return demoEmails.filter(email => email.customerId === customerId);
  }

  private getDemoCustomersFromYourStructure(): Customer[] {
    // Demo-Daten im Format Ihrer echten Daten
    return [
      {
        id: 'demo_1',
        name: 'Familie Weber (Demo)',
        phone: '+49 30 12345678',
        email: 'weber@familie.de',
        movingDate: '15.06.2024',
        fromAddress: 'Hauptstraße 15, Berlin - Etage 3',
        toAddress: 'Nebenstraße 8, Hamburg - Etage 2',
        apartment: {
          rooms: 4,
          area: 95,
          floor: 3,
          hasElevator: true
        },
        services: ['Umzug', 'Verpackung'],
        notes: 'Quelle: Online-Formular, WhatsApp: +49 30 12345678, Eingang: 28.05.2025'
      },
      {
        id: 'demo_2',
        name: 'Max Schmidt (Demo)',
        phone: '+49 40 87654321',
        email: 'max.schmidt@email.de',
        movingDate: '01.07.2024',
        fromAddress: 'Gartenweg 22, Hamburg - Etage 1',
        toAddress: 'Parkstraße 5, München - Etage 4',
        apartment: {
          rooms: 2,
          area: 65,
          floor: 1,
          hasElevator: false
        },
        services: ['Umzug'],
        notes: 'Quelle: Telefonanruf, Eingang: 29.05.2025, Dringend!'
      },
      {
        id: 'demo_3',
        name: 'Anna Müller (Demo)',
        phone: '+49 89 11223344',
        email: 'anna.mueller@web.de',
        movingDate: '20.05.2024',
        fromAddress: 'Blumenstraße 7, Köln - Etage 2',
        toAddress: 'Sonnenallee 12, Berlin - Etage 1',
        apartment: {
          rooms: 3,
          area: 80,
          floor: 2,
          hasElevator: true
        },
        services: ['Umzug', 'Verpackung', 'Montage'],
        notes: 'Quelle: Empfehlung, WhatsApp: +49 89 11223344, Eingang: 30.05.2025'
      }
    ];
  }

  private getDemoQuotes(): Quote[] {
    return [
      {
        id: 'demo_quote_1',
        customerId: 'demo_1',
        customerName: 'Familie Weber',
        price: 1450.00,
        comment: 'Komplettservice mit Verpackung',
        createdAt: new Date('2024-06-01'),
        createdBy: 'demo-user',
        status: 'sent'
      },
      {
        id: 'demo_quote_2',
        customerId: 'demo_2',
        customerName: 'Max Schmidt',
        price: 890.00,
        comment: 'Standardumzug',
        createdAt: new Date('2024-06-02'),
        createdBy: 'demo-user',
        status: 'accepted'
      }
    ];
  }

  // Export lokale Kunden für Google Sheets
  exportLocalCustomersForSheets(): string {
    const localCustomers = this.getLocalCustomers();
    
    if (localCustomers.length === 0) {
      return 'Keine lokalen Kunden zum Exportieren vorhanden.';
    }
    
    // Formatiere die Daten im Google Sheets CSV Format
    const headers = ['Kontakt Name', 'Kontakt Telefon', 'Kontakt Email', 'Whatsapp', 'Von Adresse', 'Von Etage', 'Von Flaeche M 2', 'Nach Adresse', 'Nach Etage', 'Umzugstag', 'Eingang', 'Quelle', 'Datum/Zeit', 'Nachricht gesendet'];
    
    const rows = localCustomers.map(customer => {
      const fromFloor = customer.fromAddress.match(/Etage (\d+)/)?.[1] || customer.apartment.floor.toString();
      const toFloor = customer.toAddress.match(/Etage (\d+)/)?.[1] || '';
      const fromAddressClean = customer.fromAddress.replace(/ - Etage \d+/, '');
      const toAddressClean = customer.toAddress.replace(/ - Etage \d+/, '');
      
      return [
        customer.name,
        customer.phone,
        customer.email,
        customer.phone, // WhatsApp gleich wie Telefon
        fromAddressClean,
        fromFloor,
        `${customer.apartment.area} m²`,
        toAddressClean,
        toFloor,
        customer.movingDate,
        new Date().toLocaleDateString('de-DE'),
        'Web-App',
        new Date().toLocaleString('de-DE'),
        'Nein'
      ].map(field => {
        // Escape fields that contain commas or quotes
        const str = String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',');
    });
    
    return [headers.join(','), ...rows].join('\n');
  }

  // Lösche lokale Kunden nach erfolgreichem Export
  clearLocalCustomers(): void {
    this.saveLocalCustomers([]);
    console.log('✅ Lokale Kunden wurden gelöscht');
  }

  // Export lokale Angebote für Google Sheets
  exportLocalQuotesForSheets(): string {
    const localQuotes = this.getLocalQuotes();
    
    if (localQuotes.length === 0) {
      return 'Keine lokalen Angebote zum Exportieren vorhanden.';
    }
    
    // Formatiere die Daten im CSV Format
    const headers = ['Angebots-ID', 'Kunde', 'Preis', 'Status', 'Erstellt am', 'Kommentar'];
    
    const rows = localQuotes.map(quote => {
      return [
        quote.id,
        quote.customerName,
        quote.price.toFixed(2).replace('.', ','),
        quote.status,
        quote.createdAt.toLocaleDateString('de-DE'),
        quote.comment || ''
      ].map(field => {
        // Escape fields that contain commas or quotes
        const str = String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',');
    });
    
    return [headers.join(','), ...rows].join('\n');
  }

  // Lösche lokale Angebote nach erfolgreichem Export
  clearLocalQuotes(): void {
    this.saveLocalQuotes([]);
    console.log('✅ Lokale Angebote wurden gelöscht');
  }

  // Invoice methods
  private getLocalInvoices(): Invoice[] {
    try {
      const stored = localStorage.getItem(this.localInvoicesKey);
      if (!stored) return [];
      
      // Parse und konvertiere Date-Strings zurück zu Date-Objekten
      const invoices = JSON.parse(stored);
      return invoices.map((invoice: any) => ({
        ...invoice,
        createdAt: new Date(invoice.createdAt),
        dueDate: new Date(invoice.dueDate),
        paidDate: invoice.paidDate ? new Date(invoice.paidDate) : undefined
      }));
    } catch (error) {
      console.error('Fehler beim Laden lokaler Rechnungen:', error);
      return [];
    }
  }

  private saveLocalInvoices(invoices: Invoice[]): void {
    try {
      localStorage.setItem(this.localInvoicesKey, JSON.stringify(invoices));
    } catch (error) {
      console.error('Fehler beim Speichern lokaler Rechnungen:', error);
    }
  }

  async getInvoices(): Promise<Invoice[]> {
    // Lade lokale Rechnungen
    const localInvoices = this.getLocalInvoices();
    const demoInvoices = this.getDemoInvoices();
    
    // Kombiniere Demo-Rechnungen mit lokalen Rechnungen
    return [...demoInvoices, ...localInvoices];
  }

  async addInvoice(invoice: Omit<Invoice, 'id'>): Promise<boolean> {
    try {
      // Generiere eine eindeutige ID
      const newInvoice: Invoice = {
        ...invoice,
        id: `local_invoice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      // Lade existierende lokale Rechnungen
      const localInvoices = this.getLocalInvoices();
      
      // Füge neue Rechnung hinzu
      localInvoices.push(newInvoice);
      
      // Speichere aktualisierte Liste
      this.saveLocalInvoices(localInvoices);
      
      console.log('💸 Rechnung erfolgreich erstellt und lokal gespeichert:', {
        kunde: invoice.customerName,
        rechnungsnummer: invoice.invoiceNumber,
        betrag: `€ ${invoice.totalPrice.toFixed(2)}`,
        datum: new Date(invoice.createdAt).toLocaleDateString('de-DE'),
        status: invoice.status
      });
      
      return true;
    } catch (error) {
      console.error('Fehler beim Speichern der Rechnung:', error);
      return false;
    }
  }

  async updateInvoice(invoiceId: string, updates: Partial<Invoice>): Promise<boolean> {
    try {
      // Lade existierende lokale Rechnungen
      const localInvoices = this.getLocalInvoices();
      
      // Finde die Rechnung
      const invoiceIndex = localInvoices.findIndex(inv => inv.id === invoiceId);
      
      if (invoiceIndex === -1) {
        console.error('Rechnung nicht gefunden:', invoiceId);
        return false;
      }
      
      // Aktualisiere die Rechnung
      localInvoices[invoiceIndex] = {
        ...localInvoices[invoiceIndex],
        ...updates,
        id: invoiceId // Stelle sicher, dass die ID nicht überschrieben wird
      };
      
      // Speichere aktualisierte Liste
      this.saveLocalInvoices(localInvoices);
      
      console.log('💸 Rechnung erfolgreich aktualisiert:', invoiceId);
      
      return true;
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Rechnung:', error);
      return false;
    }
  }

  async deleteInvoice(invoiceId: string): Promise<boolean> {
    try {
      // Lade existierende lokale Rechnungen
      const localInvoices = this.getLocalInvoices();
      
      // Filtere die zu löschende Rechnung heraus
      const updatedInvoices = localInvoices.filter(inv => inv.id !== invoiceId);
      
      if (updatedInvoices.length === localInvoices.length) {
        console.error('Rechnung nicht gefunden:', invoiceId);
        return false;
      }
      
      // Speichere aktualisierte Liste
      this.saveLocalInvoices(updatedInvoices);
      
      console.log('💸 Rechnung erfolgreich gelöscht:', invoiceId);
      
      return true;
    } catch (error) {
      console.error('Fehler beim Löschen der Rechnung:', error);
      return false;
    }
  }

  async deleteQuote(quoteId: string): Promise<boolean> {
    try {
      const quotes = this.getLocalQuotes();
      const filteredQuotes = quotes.filter(q => q.id !== quoteId);
      this.saveLocalQuotes(filteredQuotes);
      console.log('📝 Angebot gelöscht:', quoteId);
      return true;
    } catch (error) {
      console.error('Fehler beim Löschen des Angebots:', error);
      return false;
    }
  }



  async getDocument(collection: string, documentId: string): Promise<any | null> {
    console.warn(`getDocument not implemented for ${collection}/${documentId}`);
    return null;
  }

  async getCollection(collectionName: string): Promise<any[]> {
    console.warn(`getCollection not implemented for ${collectionName}`);
    return [];
  }

  async updateDocument(collection: string, documentId: string, data: any): Promise<boolean> {
    console.warn(`updateDocument not implemented for ${collection}/${documentId}`);
    return false;
  }

  private getDemoInvoices(): Invoice[] {
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 30);
    
    const paidDate = new Date(today);
    paidDate.setDate(paidDate.getDate() - 5);
    
    const overdueDate = new Date(today);
    overdueDate.setDate(overdueDate.getDate() - 45);
    
    return [
      {
        id: 'demo_invoice_1',
        quoteId: 'demo_quote_1',
        customerId: 'demo_1',
        customerName: 'Familie Weber (Demo)',
        invoiceNumber: 'RE-2024-0001',
        price: 1615.13,
        taxAmount: 306.87,
        totalPrice: 1922.00,
        items: [
          {
            description: 'Umzugsservice - Transport, Be- und Entladung',
            quantity: 1,
            unitPrice: 1615.13,
            totalPrice: 1615.13
          }
        ],
        createdAt: new Date(today.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        paidDate: paidDate.toISOString(),
        status: 'paid' as const
      },
      {
        id: 'demo_invoice_2',
        quoteId: 'demo_quote_2',
        customerId: 'demo_2',
        customerName: 'Max Schmidt (Demo)',
        invoiceNumber: 'RE-2024-0002',
        price: 756.30,
        taxAmount: 143.70,
        totalPrice: 900.00,
        items: [
          {
            description: 'Umzugsservice - Transport, Be- und Entladung',
            quantity: 1,
            unitPrice: 756.30,
            totalPrice: 756.30
          }
        ],
        createdAt: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: dueDate.toISOString(),
        status: 'sent' as const
      },
      {
        id: 'demo_invoice_3',
        quoteId: 'demo_quote_3',
        customerId: 'demo_3',
        customerName: 'Anna Müller (Demo)',
        invoiceNumber: 'RE-2024-0003',
        price: 1058.82,
        taxAmount: 201.18,
        totalPrice: 1260.00,
        items: [
          {
            description: 'Umzugsservice - Transport, Be- und Entladung',
            quantity: 1,
            unitPrice: 1058.82,
            totalPrice: 1058.82
          }
        ],
        createdAt: new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: overdueDate.toISOString(),
        status: 'sent' as const
      }
    ];
  }

  // Export-Funktion für Rechnungen
  exportInvoicesToCSV(): string {
    const localInvoices = this.getLocalInvoices();
    
    if (localInvoices.length === 0) {
      console.log('⚠️ Keine lokalen Rechnungen zum Exportieren');
      return '';
    }
    
    // Formatiere die Daten im CSV Format
    const headers = ['Rechnungsnummer', 'Kunde', 'Netto', 'MwSt', 'Brutto', 'Status', 'Erstellt am', 'Fällig am', 'Bezahlt am'];
    
    const rows = localInvoices.map(invoice => {
      return [
        invoice.invoiceNumber,
        invoice.customerName,
        (invoice.price || 0).toFixed(2).replace('.', ','),
        (invoice.taxAmount || 0).toFixed(2).replace('.', ','),
        invoice.totalPrice.toFixed(2).replace('.', ','),
        invoice.status,
        new Date(invoice.createdAt).toLocaleDateString('de-DE'),
        new Date(invoice.dueDate).toLocaleDateString('de-DE'),
        invoice.paidDate ? new Date(invoice.paidDate).toLocaleDateString('de-DE') : ''
      ].map(field => {
        // Escape fields that contain commas or quotes
        const str = String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',');
    });
    
    return [headers.join(','), ...rows].join('\n');
  }

  // Test-Methode
  async testConnection(): Promise<void> {
    try {
      console.log('🧪 Teste Google Sheets Zugriff...');
      console.log('📊 Spreadsheet ID:', this.spreadsheetId);
      console.log('🌐 Spreadsheet URL: https://docs.google.com/spreadsheets/d/' + this.spreadsheetId);
      
      const customers = await this.getCustomers();
      console.log(`✅ Test erfolgreich - ${customers.length} Kunden geladen`);
    } catch (error) {
      console.error('❌ Test fehlgeschlagen:', error);
      throw error;
    }
  }
}

export const googleSheetsPublicService = new GoogleSheetsPublicService();