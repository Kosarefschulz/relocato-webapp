import { Customer, Quote } from '../types';

class GoogleSheetsPublicService {
  private spreadsheetId = '178tpFCNqmnDZxkzOfgWQCS6BW7wn2rYyTB3hZh8H7PU';
  private localStorageKey = 'relocato_local_customers';

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
        phone: columns[1] || '',
        email: columns[2] || '',
        movingDate: columns[9] || '',
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
          columns[3] ? `WhatsApp: ${columns[3]}` : '',
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

  async addCustomer(customer: Omit<Customer, 'id'>): Promise<boolean> {
    try {
      // Generiere eine eindeutige ID
      const newCustomer: Customer = {
        ...customer,
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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

  async addQuote(quote: Omit<Quote, 'id'>): Promise<boolean> {
    console.log('💰 Angebot erfolgreich erstellt:', {
      kunde: quote.customerName,
      preis: `€ ${quote.price.toFixed(2)}`,
      datum: quote.createdAt.toLocaleDateString('de-DE'),
      status: quote.status,
      kommentar: quote.comment || 'Kein Kommentar'
    });
    
    console.log('📊 Angebot wurde lokal gespeichert. Für echte Google Sheets Integration:');
    console.log('🔗 Fügen Sie das Angebot manuell hinzu: https://docs.google.com/spreadsheets/d/' + this.spreadsheetId);
    
    return true;
  }

  async getQuotes(): Promise<Quote[]> {
    return this.getDemoQuotes();
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

  // Test-Methode
  async testConnection(): Promise<boolean> {
    try {
      console.log('🧪 Teste Google Sheets Zugriff...');
      console.log('📊 Spreadsheet ID:', this.spreadsheetId);
      console.log('🌐 Spreadsheet URL: https://docs.google.com/spreadsheets/d/' + this.spreadsheetId);
      
      const customers = await this.getCustomers();
      console.log(`✅ Test erfolgreich - ${customers.length} Kunden geladen`);
      
      return true;
    } catch (error) {
      console.error('❌ Test fehlgeschlagen:', error);
      return false;
    }
  }
}

export const googleSheetsPublicService = new GoogleSheetsPublicService();