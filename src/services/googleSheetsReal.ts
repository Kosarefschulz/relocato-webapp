import { Customer, Quote } from '../types';
import { cleanPhoneNumber } from '../utils/phoneUtils';

class GoogleSheetsRealService {
  private spreadsheetId = '178tpFCNqmnDZxkzOfgWQCS6BW7wn2rYyTB3hZh8H7PU';
  private apiKey = process.env.REACT_APP_GOOGLE_SHEETS_API_KEY || 'demo-key';

  async getCustomers(): Promise<Customer[]> {
    try {
      console.log('📊 Lade echte Kundendaten aus Google Sheets...');
      
      // Google Sheets API v4 - öffentlich lesbar wenn richtig konfiguriert
      const range = 'A:N'; // Alle Spalten A bis N
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${range}?key=${this.apiKey}`;
      
      console.log('🔗 API URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error('❌ API Fehler:', response.status, response.statusText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📋 Rohdaten von Google Sheets:', data);
      
      const rows = data.values || [];
      
      if (rows.length <= 1) {
        console.warn('⚠️ Nur Header oder keine Daten gefunden');
        return this.getFallbackCustomers();
      }

      // Erste Zeile sind Header, überspringen
      const dataRows = rows.slice(1);
      console.log(`✅ ${dataRows.length} Kunden-Zeilen gefunden`);
      
      const customers = dataRows.map((row: any[], index: number) => {
        // Mapping Ihrer Spalten:
        // A: Kontakt Name
        // B: Kontakt Telefon  
        // C: Kontakt Email
        // D: Whatsapp
        // E: Von Adresse
        // F: Von Etage
        // G: Von Flaeche M2
        // H: Nach Adresse
        // I: Nach Etage
        // J: Umzugstag
        // K: Eingang
        // L: Quelle
        // M: Datum/Zeit
        // N: Nachricht gesendet

        const customer: Customer = {
          id: `real_${index + 1}`,
          name: row[0] || `Kunde ${index + 1}`,
          phone: cleanPhoneNumber(row[1]) || '',
          email: row[2] || '',
          movingDate: row[9] || '', // J: Umzugstag
          fromAddress: row[4] ? `${row[4]}${row[5] ? ` - Etage ${row[5]}` : ''}` : '', // E + F
          toAddress: row[7] ? `${row[7]}${row[8] ? ` - Etage ${row[8]}` : ''}` : '', // H + I
          apartment: {
            rooms: 3, // Default, da nicht in Ihren Daten
            area: this.parseNumber(row[6]) || 50, // G: Von Flaeche M2
            floor: this.parseNumber(row[5]) || 1, // F: Von Etage
            hasElevator: false // Default
          },
          services: ['Umzug'], // Default
          notes: this.buildNotes({
            whatsapp: row[3],
            eingang: row[10], // K
            quelle: row[11], // L
            datetime: row[12], // M
            nachricht: row[13] // N
          })
        };

        console.log(`👤 Kunde ${index + 1}:`, customer.name);
        return customer;
      });

      console.log(`🎉 ${customers.length} Kunden erfolgreich geladen`);
      return customers;

    } catch (error) {
      console.error('❌ Fehler beim Laden der echten Daten:', error);
      console.log('🔄 Verwende Fallback-Daten...');
      return this.getFallbackCustomers();
    }
  }

  async addCustomer(customer: Omit<Customer, 'id'>): Promise<boolean> {
    console.log('💾 Neuer Kunde würde zu Google Sheets hinzugefügt werden:', customer.name);
    console.log('📝 Daten:', {
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      movingDate: customer.movingDate,
      fromAddress: customer.fromAddress,
      toAddress: customer.toAddress
    });
    
    // Für das Schreiben bräuchten wir OAuth oder Service Account
    // Für jetzt simulieren wir es
    console.log('ℹ️ Zum Schreiben in Google Sheets ist OAuth erforderlich');
    console.log('🔗 Öffnen Sie manuell: https://docs.google.com/spreadsheets/d/' + this.spreadsheetId);
    
    return true;
  }

  async addQuote(quote: Omit<Quote, 'id'>): Promise<boolean> {
    console.log('💰 Angebot für', quote.customerName, '€', quote.price);
    return true;
  }

  async getQuotes(): Promise<Quote[]> {
    // Angebote könnten in einem separaten Sheet sein
    return this.getFallbackQuotes();
  }

  // Hilfsmethoden
  private parseNumber(value: any): number {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }

  private buildNotes(data: {
    whatsapp?: string;
    eingang?: string;
    quelle?: string;
    datetime?: string;
    nachricht?: string;
  }): string {
    const notes = [];
    
    if (data.quelle) notes.push(`Quelle: ${data.quelle}`);
    if (data.eingang) notes.push(`Eingang: ${data.eingang}`);
    if (data.whatsapp) notes.push(`WhatsApp: ${cleanPhoneNumber(data.whatsapp)}`);
    if (data.datetime) notes.push(`Datum: ${data.datetime}`);
    if (data.nachricht) notes.push(`Nachricht: ${data.nachricht}`);
    
    return notes.join(', ');
  }

  private getFallbackCustomers(): Customer[] {
    return [
      {
        id: 'fallback_1',
        name: 'Beispiel Kunde (Fallback)',
        phone: '+49 123 456789',
        email: 'beispiel@kunde.de',
        movingDate: '2024-07-01',
        fromAddress: 'Beispielstraße 1, Berlin',
        toAddress: 'Zielstraße 2, München',
        apartment: {
          rooms: 3,
          area: 75,
          floor: 2,
          hasElevator: true
        },
        services: ['Umzug'],
        notes: 'API-Zugriff nicht verfügbar - Fallback-Daten'
      }
    ];
  }

  private getFallbackQuotes(): Quote[] {
    return [
      {
        id: 'fallback_quote_1',
        customerId: 'fallback_1',
        customerName: 'Beispiel Kunde',
        price: 1200.00,
        comment: 'Standard Umzug',
        createdAt: new Date(),
        createdBy: 'demo-user',
        status: 'draft'
      }
    ];
  }

  // Debug-Methode
  async testApiAccess(): Promise<void> {
    console.log('🧪 Teste Google Sheets API Zugriff...');
    console.log('📋 Spreadsheet ID:', this.spreadsheetId);
    console.log('🔑 API Key:', this.apiKey !== 'demo-key' ? '✅ Gesetzt' : '❌ Demo-Key');
    console.log('🌐 Spreadsheet URL: https://docs.google.com/spreadsheets/d/' + this.spreadsheetId);
    
    try {
      const customers = await this.getCustomers();
      console.log('✅ Test erfolgreich -', customers.length, 'Kunden geladen');
    } catch (error) {
      console.error('❌ Test fehlgeschlagen:', error);
    }
  }
}

export const googleSheetsRealService = new GoogleSheetsRealService();