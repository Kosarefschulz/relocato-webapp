import { Customer, Quote } from '../types';

interface GoogleSheetsConfig {
  apiKey: string;
  spreadsheetId: string;
  customerRange: string;
  quotesRange: string;
}

class GoogleSheetsService {
  private config: GoogleSheetsConfig;

  constructor() {
    this.config = {
      apiKey: process.env.REACT_APP_GOOGLE_SHEETS_API_KEY || '',
      spreadsheetId: process.env.REACT_APP_GOOGLE_SHEETS_ID || '',
      customerRange: 'Kunden!A:L',
      quotesRange: 'Angebote!A:I'
    };
  }

  private async fetchFromSheet(range: string): Promise<any[][]> {
    if (!this.config.apiKey || !this.config.spreadsheetId) {
      console.warn('Google Sheets API nicht konfiguriert - verwende Mock-Daten');
      return [];
    }

    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}/values/${range}?key=${this.config.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.values || [];
    } catch (error) {
      console.error('Fehler beim Laden von Google Sheets:', error);
      return [];
    }
  }

  private async appendToSheet(range: string, values: any[][]): Promise<boolean> {
    if (!this.config.apiKey || !this.config.spreadsheetId) {
      console.warn('Google Sheets API nicht konfiguriert');
      return false;
    }

    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}/values/${range}:append?valueInputOption=RAW&key=${this.config.apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: values
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Fehler beim Schreiben in Google Sheets:', error);
      return false;
    }
  }

  async getCustomers(): Promise<Customer[]> {
    const rows = await this.fetchFromSheet(this.config.customerRange);
    
    if (rows.length === 0) {
      // Fallback auf Mock-Daten
      return this.getMockCustomers();
    }

    // Erste Zeile sind Header, überspringen
    const dataRows = rows.slice(1);
    
    return dataRows.map((row, index) => ({
      id: row[0] || `${index + 1}`,
      name: row[1] || '',
      email: row[2] || '',
      phone: row[3] || '',
      movingDate: row[4] || '',
      fromAddress: row[5] || '',
      toAddress: row[6] || '',
      apartment: {
        rooms: parseInt(row[7]) || 2,
        area: parseInt(row[8]) || 50,
        floor: parseInt(row[9]) || 1,
        hasElevator: row[10] === 'TRUE' || row[10] === '1'
      },
      services: row[11] ? row[11].split(',').map((s: string) => s.trim()) : [],
      notes: row[12] || ''
    }));
  }

  async addCustomer(customer: Omit<Customer, 'id'>): Promise<boolean> {
    const id = Date.now().toString();
    const row = [
      id,
      customer.name,
      customer.email,
      customer.phone,
      customer.movingDate,
      customer.fromAddress,
      customer.toAddress,
      customer.apartment.rooms.toString(),
      customer.apartment.area.toString(),
      customer.apartment.floor.toString(),
      customer.apartment.hasElevator ? 'TRUE' : 'FALSE',
      customer.services.join(', '),
      customer.notes || ''
    ];

    const success = await this.appendToSheet(this.config.customerRange, [row]);
    
    if (!success) {
      console.log('Kunde gespeichert (lokal):', { id, ...customer });
    }
    
    return success;
  }

  async getQuotes(): Promise<Quote[]> {
    const rows = await this.fetchFromSheet(this.config.quotesRange);
    
    if (rows.length === 0) {
      return this.getMockQuotes();
    }

    const dataRows = rows.slice(1);
    
    return dataRows.map(row => ({
      id: row[0] || '',
      customerId: row[1] || '',
      customerName: row[2] || '',
      price: parseFloat(row[3]) || 0,
      comment: row[4] || '',
      createdAt: new Date(row[5] || Date.now()),
      createdBy: row[6] || '',
      status: (row[7] || 'draft') as 'draft' | 'sent' | 'accepted' | 'rejected'
    }));
  }

  async addQuote(quote: Omit<Quote, 'id'>): Promise<boolean> {
    const id = Date.now().toString();
    const row = [
      id,
      quote.customerId,
      quote.customerName,
      quote.price.toString(),
      quote.comment || '',
      quote.createdAt.toISOString(),
      quote.createdBy,
      quote.status
    ];

    const success = await this.appendToSheet(this.config.quotesRange, [row]);
    
    if (!success) {
      console.log('Angebot gespeichert (lokal):', { id, ...quote });
    }
    
    return success;
  }

  private getMockCustomers(): Customer[] {
    return [
      {
        id: '1',
        name: 'Max Mustermann',
        email: 'max@example.com',
        phone: '+49 123 456789',
        movingDate: '2024-02-15',
        fromAddress: 'Musterstraße 1, 12345 Berlin',
        toAddress: 'Beispielweg 2, 54321 Hamburg',
        apartment: {
          rooms: 3,
          area: 75,
          floor: 2,
          hasElevator: true
        },
        services: ['Umzug', 'Verpackung', 'Montage']
      },
      {
        id: '2',
        name: 'Maria Schmidt',
        email: 'maria@example.com',
        phone: '+49 987 654321',
        movingDate: '2024-03-01',
        fromAddress: 'Hauptstraße 10, 10117 Berlin',
        toAddress: 'Nebenstraße 5, 80331 München',
        apartment: {
          rooms: 2,
          area: 55,
          floor: 4,
          hasElevator: false
        },
        services: ['Umzug', 'Verpackung']
      },
      {
        id: '3',
        name: 'Hans Weber',
        email: 'hans@example.com',
        phone: '+49 555 123456',
        movingDate: '2024-01-20',
        fromAddress: 'Gartenstraße 15, 01067 Dresden',
        toAddress: 'Parkweg 8, 50667 Köln',
        apartment: {
          rooms: 4,
          area: 95,
          floor: 1,
          hasElevator: true
        },
        services: ['Umzug', 'Verpackung', 'Montage', 'Einlagerung']
      }
    ];
  }

  private getMockQuotes(): Quote[] {
    return [
      {
        id: '1',
        customerId: '1',
        customerName: 'Max Mustermann',
        price: 1250.00,
        comment: 'Klaviertransport inklusive',
        createdAt: new Date('2024-01-15'),
        createdBy: 'current-user',
        status: 'sent'
      },
      {
        id: '2',
        customerId: '2',
        customerName: 'Maria Schmidt',
        price: 890.00,
        createdAt: new Date('2024-01-14'),
        createdBy: 'current-user',
        status: 'accepted'
      }
    ];
  }
}

export const googleSheetsService = new GoogleSheetsService();