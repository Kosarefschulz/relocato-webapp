import { Quote, QuoteVersion } from '../types';

class QuoteHistoryService {
  private readonly STORAGE_KEY = 'quotes';

  // Neue Version eines Angebots erstellen
  async createNewVersion(originalQuote: Quote, changes: Partial<Quote>, changeDescription?: string): Promise<Quote> {
    try {
      // Alle Angebote laden
      const quotes = await this.getQuotes();
      
      // Original-Angebot finden (oder das parent wenn es bereits eine Version ist)
      const parentId = originalQuote.parentQuoteId || originalQuote.id;
      const parentQuote = quotes.find(q => q.id === parentId) || originalQuote;
      
      // Alle Versionen dieses Angebots finden
      const allVersions = quotes.filter(q => 
        q.id === parentId || q.parentQuoteId === parentId
      );
      
      // Höchste Versionsnummer finden
      const maxVersion = Math.max(
        ...allVersions.map(q => q.version || 1),
        originalQuote.version || 1
      );
      
      // Neue Version erstellen
      const newVersion: Quote = {
        ...originalQuote,
        ...changes,
        id: `${parentId}_v${maxVersion + 1}_${Date.now()}`,
        parentQuoteId: parentId,
        version: maxVersion + 1,
        isLatestVersion: true,
        createdAt: new Date(),
        status: 'draft' // Neue Versionen starten immer als Entwurf
      };
      
      // Version History aktualisieren
      const versionEntry: QuoteVersion = {
        id: newVersion.id,
        version: newVersion.version!,
        price: newVersion.price,
        createdAt: newVersion.createdAt,
        createdBy: newVersion.createdBy,
        changes: changeDescription,
        status: newVersion.status
      };
      
      // History des Parent-Angebots aktualisieren
      const updatedHistory = [
        ...(parentQuote.versionHistory || []),
        versionEntry
      ];
      
      // Alle vorherigen Versionen als nicht-aktuell markieren
      const updatedQuotes = quotes.map(q => {
        if (q.id === parentId || q.parentQuoteId === parentId) {
          return {
            ...q,
            isLatestVersion: false,
            versionHistory: updatedHistory
          };
        }
        return q;
      });
      
      // Neue Version hinzufügen
      updatedQuotes.push(newVersion);
      
      // Speichern
      await this.saveQuotes(updatedQuotes);
      
      return newVersion;
    } catch (error) {
      console.error('Fehler beim Erstellen der neuen Version:', error);
      throw error;
    }
  }

  // Alle Versionen eines Angebots abrufen
  async getQuoteVersions(quoteId: string): Promise<Quote[]> {
    try {
      const quotes = await this.getQuotes();
      
      // Parent-ID ermitteln
      const quote = quotes.find(q => q.id === quoteId);
      if (!quote) return [];
      
      const parentId = quote.parentQuoteId || quote.id;
      
      // Alle Versionen finden und nach Version sortieren
      const versions = quotes
        .filter(q => q.id === parentId || q.parentQuoteId === parentId)
        .sort((a, b) => (a.version || 1) - (b.version || 1));
      
      return versions;
    } catch (error) {
      console.error('Fehler beim Abrufen der Versionen:', error);
      return [];
    }
  }

  // Versions-Historie eines Angebots abrufen
  async getVersionHistory(quoteId: string): Promise<QuoteVersion[]> {
    try {
      const quotes = await this.getQuotes();
      const quote = quotes.find(q => q.id === quoteId);
      
      if (!quote) return [];
      
      // Wenn es eine Version ist, History vom Parent holen
      if (quote.parentQuoteId) {
        const parent = quotes.find(q => q.id === quote.parentQuoteId);
        return parent?.versionHistory || [];
      }
      
      return quote.versionHistory || [];
    } catch (error) {
      console.error('Fehler beim Abrufen der Historie:', error);
      return [];
    }
  }

  // Version vergleichen
  async compareVersions(quoteId1: string, quoteId2: string): Promise<{
    quote1: Quote | null;
    quote2: Quote | null;
    differences: {
      field: string;
      oldValue: any;
      newValue: any;
    }[];
  }> {
    try {
      const quotes = await this.getQuotes();
      const quote1 = quotes.find(q => q.id === quoteId1);
      const quote2 = quotes.find(q => q.id === quoteId2);
      
      if (!quote1 || !quote2) {
        return { quote1: quote1 || null, quote2: quote2 || null, differences: [] };
      }
      
      const differences: { field: string; oldValue: any; newValue: any }[] = [];
      
      // Wichtige Felder vergleichen
      const fieldsToCompare = ['price', 'volume', 'distance', 'comment', 'status'];
      
      for (const field of fieldsToCompare) {
        if ((quote1 as any)[field] !== (quote2 as any)[field]) {
          differences.push({
            field,
            oldValue: (quote1 as any)[field],
            newValue: (quote2 as any)[field]
          });
        }
      }
      
      return { quote1, quote2, differences };
    } catch (error) {
      console.error('Fehler beim Vergleichen der Versionen:', error);
      return { quote1: null, quote2: null, differences: [] };
    }
  }

  // Eine bestimmte Version als aktiv setzen
  async setActiveVersion(quoteId: string): Promise<boolean> {
    try {
      const quotes = await this.getQuotes();
      const selectedQuote = quotes.find(q => q.id === quoteId);
      
      if (!selectedQuote) return false;
      
      const parentId = selectedQuote.parentQuoteId || selectedQuote.id;
      
      // Alle Versionen aktualisieren
      const updatedQuotes = quotes.map(q => {
        if (q.id === parentId || q.parentQuoteId === parentId) {
          return {
            ...q,
            isLatestVersion: q.id === quoteId
          };
        }
        return q;
      });
      
      await this.saveQuotes(updatedQuotes);
      return true;
    } catch (error) {
      console.error('Fehler beim Setzen der aktiven Version:', error);
      return false;
    }
  }

  // Version löschen (nur wenn nicht die einzige)
  async deleteVersion(quoteId: string): Promise<boolean> {
    try {
      const quotes = await this.getQuotes();
      const quote = quotes.find(q => q.id === quoteId);
      
      if (!quote) return false;
      
      // Nicht löschen wenn es die Original-Version ist
      if (!quote.parentQuoteId) {
        throw new Error('Original-Angebot kann nicht gelöscht werden');
      }
      
      // Alle Versionen dieses Angebots finden
      const parentId = quote.parentQuoteId;
      const versions = quotes.filter(q => 
        q.id === parentId || q.parentQuoteId === parentId
      );
      
      // Nicht löschen wenn es die einzige Version ist
      if (versions.length <= 2) {
        throw new Error('Letzte Version kann nicht gelöscht werden');
      }
      
      // Version aus der Historie entfernen
      const updatedQuotes = quotes
        .filter(q => q.id !== quoteId)
        .map(q => {
          if (q.id === parentId || q.parentQuoteId === parentId) {
            return {
              ...q,
              versionHistory: q.versionHistory?.filter(v => v.id !== quoteId)
            };
          }
          return q;
        });
      
      // Wenn gelöschte Version die aktive war, nächstniedrigere aktivieren
      if (quote.isLatestVersion) {
        const remainingVersions = updatedQuotes
          .filter(q => q.id === parentId || q.parentQuoteId === parentId)
          .sort((a, b) => (b.version || 1) - (a.version || 1));
        
        if (remainingVersions.length > 0) {
          remainingVersions[0].isLatestVersion = true;
        }
      }
      
      await this.saveQuotes(updatedQuotes);
      return true;
    } catch (error) {
      console.error('Fehler beim Löschen der Version:', error);
      throw error;
    }
  }

  // Hilfsmethoden
  private async getQuotes(): Promise<Quote[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Fehler beim Laden der Angebote:', error);
      return [];
    }
  }

  private async saveQuotes(quotes: Quote[]): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(quotes));
    } catch (error) {
      console.error('Fehler beim Speichern der Angebote:', error);
      throw error;
    }
  }
}

export const quoteHistoryService = new QuoteHistoryService();