import { Customer, Quote } from '../types';

class GoogleSheetsSimpleService {
  private spreadsheetId = '178tpFCNqmnDZxkzOfgWQCS6BW7wn2rYyTB3hZh8H7PU';
  private apiKey = process.env.REACT_APP_GOOGLE_SHEETS_API_KEY || '';

  async getCustomers(): Promise<Customer[]> {
    // Für jetzt verwenden wir Mock-Daten, da Google Sheets API komplexer ist
    console.log('📊 Lade Kundendaten aus Google Sheets (Simulation)');
    console.log('🔗 Spreadsheet ID:', this.spreadsheetId);
    
    // Simuliere API-Aufruf mit Delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return this.getMockCustomersFromSheets();
  }

  async addCustomer(customer: Omit<Customer, 'id'>): Promise<boolean> {
    console.log('✅ Kunde wird zu Google Sheets hinzugefügt (Simulation):', customer.name);
    console.log('📋 Spreadsheet URL: https://docs.google.com/spreadsheets/d/' + this.spreadsheetId);
    
    // In einer echten Implementation würde hier die Google Sheets API aufgerufen
    // Für jetzt simulieren wir den Erfolg
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return true;
  }

  async addQuote(quote: Omit<Quote, 'id'>): Promise<boolean> {
    console.log('💰 Angebot wird zu Google Sheets hinzugefügt (Simulation):', quote.customerName);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return true;
  }

  async getQuotes(): Promise<Quote[]> {
    console.log('📈 Lade Angebote aus Google Sheets (Simulation)');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return this.getMockQuotes();
  }

  private getMockCustomersFromSheets(): Customer[] {
    // Simuliert die Daten aus Ihrer echten Google Sheets Datei
    return [
      {
        id: 'sheet_1',
        name: 'Familie Weber',
        phone: '+49 30 12345678',
        email: 'weber@familie.de',
        movingDate: '2024-06-15',
        fromAddress: 'Hauptstraße 15, 10115 Berlin - Etage 3',
        toAddress: 'Nebenstraße 8, 22301 Hamburg - Etage 2',
        apartment: {
          rooms: 4,
          area: 95,
          floor: 3,
          hasElevator: true
        },
        services: ['Umzug', 'Verpackung'],
        notes: 'Quelle: Online-Formular, WhatsApp: +49 30 12345678'
      },
      {
        id: 'sheet_2', 
        name: 'Max Schmidt',
        phone: '+49 40 87654321',
        email: 'max.schmidt@email.de',
        movingDate: '2024-07-01',
        fromAddress: 'Gartenweg 22, 20095 Hamburg - Etage 1',
        toAddress: 'Parkstraße 5, 80331 München - Etage 4',
        apartment: {
          rooms: 2,
          area: 65,
          floor: 1,
          hasElevator: false
        },
        services: ['Umzug'],
        notes: 'Quelle: Telefonanruf, Dringend!'
      },
      {
        id: 'sheet_3',
        name: 'Anna Müller',
        phone: '+49 89 11223344',
        email: 'anna.mueller@web.de',
        movingDate: '2024-05-20',
        fromAddress: 'Blumenstraße 7, 50667 Köln - Etage 2',
        toAddress: 'Sonnenallee 12, 10967 Berlin - Etage 1',
        apartment: {
          rooms: 3,
          area: 80,
          floor: 2,
          hasElevator: true
        },
        services: ['Umzug', 'Verpackung', 'Montage'],
        notes: 'Quelle: Empfehlung, WhatsApp: +49 89 11223344'
      },
      {
        id: 'sheet_4',
        name: 'Thomas Klein',
        phone: '+49 69 55443322',
        email: 'thomas.klein@firma.com',
        movingDate: '2024-08-10',
        fromAddress: 'Industriestraße 45, 60311 Frankfurt - Etage 0',
        toAddress: 'Wiesenweg 18, 70173 Stuttgart - Etage 3',
        apartment: {
          rooms: 5,
          area: 120,
          floor: 0,
          hasElevator: true
        },
        services: ['Umzug', 'Verpackung', 'Montage', 'Einlagerung'],
        notes: 'Quelle: Website, Büroumzug'
      }
    ];
  }

  private getMockQuotes(): Quote[] {
    return [
      {
        id: 'quote_1',
        customerId: 'sheet_1',
        customerName: 'Familie Weber',
        price: 1450.00,
        comment: 'Komplettservice mit Verpackung',
        createdAt: new Date('2024-01-15'),
        createdBy: 'demo-user',
        status: 'sent'
      },
      {
        id: 'quote_2',
        customerId: 'sheet_2',
        customerName: 'Max Schmidt',
        price: 890.00,
        comment: 'Standardumzug',
        createdAt: new Date('2024-01-14'),
        createdBy: 'demo-user',
        status: 'accepted'
      },
      {
        id: 'quote_3',
        customerId: 'sheet_3',
        customerName: 'Anna Müller',
        price: 1250.00,
        comment: 'Mit Montageservice',
        createdAt: new Date('2024-01-12'),
        createdBy: 'demo-user',
        status: 'draft'
      }
    ];
  }

  // Hilfsmethode für später: echte Google Sheets API Integration
  private async callGoogleSheetsAPI(range: string, method: 'GET' | 'POST' = 'GET', values?: any[][]) {
    const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}`;
    
    if (method === 'GET') {
      const url = `${baseUrl}/values/${range}?key=${this.apiKey}`;
      const response = await fetch(url);
      return response.json();
    }
    
    // POST für das Hinzufügen von Daten würde eine OAuth-Authentifizierung benötigen
    console.log('POST zu Google Sheets würde OAuth benötigen');
    return null;
  }

  // Öffentliche Methode um Verbindung zu testen
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Teste Verbindung zu Google Sheets...');
      console.log('📊 Spreadsheet ID:', this.spreadsheetId);
      console.log('🔑 API Key gesetzt:', this.apiKey ? 'Ja' : 'Nein');
      console.log('🌐 Spreadsheet URL: https://docs.google.com/spreadsheets/d/' + this.spreadsheetId);
      
      // Simuliere Test
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('❌ Verbindungstest fehlgeschlagen:', error);
      return false;
    }
  }
}

export const googleSheetsSimpleService = new GoogleSheetsSimpleService();