import { OpenAIService } from './openaiService';
import { AIContextManager } from './aiContextManager';
import { Customer, Quote, Invoice } from '../../types';
import { firebaseService } from '../firebaseService';
import { emailService } from '../emailService';
import { pdfService } from '../pdfService';
import { quoteCalculationService } from '../quoteCalculation';

export interface AIAssistantConfig {
  apiKey: string;
  model?: string;
}

export interface AIResponse {
  message: string;
  actions?: any[];
  suggestions?: string[];
  requiresConfirmation?: boolean;
  data?: any;
}

export class AIAssistantServiceV2 {
  private openai: OpenAIService;
  private contextManager: AIContextManager;
  private conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

  constructor(config: AIAssistantConfig) {
    this.openai = new OpenAIService({
      apiKey: config.apiKey,
      model: config.model || 'gpt-4o',
      maxTokens: 3000,
      temperature: 0.8
    });
    this.contextManager = new AIContextManager();
  }

  async processMessage(userMessage: string, context?: any): Promise<AIResponse> {
    try {
      // Hole aktuellen System-Kontext
      const systemContext = await this.buildSystemContext();
      
      // Füge Nachricht zur Historie hinzu
      this.conversationHistory.push({ role: 'user', content: userMessage });

      // Erstelle erweiterten System-Prompt
      const systemPrompt = `Du bist ein hochintelligenter KI-Assistent für die Relocato Umzugsapp. Du verstehst das gesamte System und kannst sowohl spezifische Aktionen ausführen als auch allgemeine Fragen beantworten.

DEINE FÄHIGKEITEN:
1. AKTIONEN AUSFÜHREN:
   - Kunden anlegen, suchen, bearbeiten
   - Angebote erstellen mit detaillierten Preisberechnungen
   - Rechnungen erstellen und verwalten
   - E-Mails mit professionellen Vorlagen versenden
   - PDFs generieren (Angebote, Rechnungen)
   - Preise kalkulieren basierend auf Volumen, Entfernung, Etagen, Zusatzleistungen

2. WISSEN ÜBER DAS SYSTEM:
   - Umzugspreise: 5m³ = 515€, 10m³ = 790€, bis 100m³ = 4840€
   - Zusatzleistungen: Verpackung, Montage, Reinigung, etc.
   - Entfernungszuschläge: 2,50€/km über 50km
   - Etagenzuschläge: 3% pro Etage
   - Firmendaten: Relocato und Wertvoll Umzüge
   - E-Mail-System mit SendGrid und IONOS
   - Firebase-basierte Datenspeicherung

3. INTELLIGENTE BERATUNG:
   - Preisempfehlungen basierend auf Erfahrungswerten
   - Optimierungsvorschläge für Umzugsrouten
   - Kundenkommunikationsstrategien
   - Geschäftsanalysen und Trends
   - Best Practices im Umzugsgeschäft

AKTUELLE SYSTEM-DATEN:
${systemContext}

WICHTIGE REGELN:
- Sei proaktiv und denke mit
- Erkläre komplexe Zusammenhänge verständlich
- Gib konkrete Handlungsempfehlungen
- Stelle Rückfragen bei unklaren Anfragen
- Nutze Emojis sparsam und professionell
- Antworte auf Deutsch

ANTWORTFORMAT:
- Bei Aktionen: Erkläre was du tust und warum
- Bei Fragen: Gib detaillierte, hilfreiche Antworten
- Bei Analysen: Zeige Daten und ziehe Schlussfolgerungen
- Biete immer weiterführende Vorschläge an`;

      // Bereite Nachrichten für API vor
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...this.conversationHistory.slice(-10) // Letzte 10 Nachrichten für Kontext
      ];

      // Generiere Antwort
      const response = await this.openai.generateText(
        messages[messages.length - 1].content,
        systemPrompt
      );

      // Füge Antwort zur Historie hinzu
      this.conversationHistory.push({ role: 'assistant', content: response });

      // Analysiere Antwort auf mögliche Aktionen
      const actions = await this.extractActions(response, userMessage);
      const suggestions = this.generateSuggestions(response, userMessage);

      return {
        message: response,
        actions,
        suggestions,
        requiresConfirmation: actions.length > 0
      };
    } catch (error) {
      console.error('AI Assistant Error:', error);
      return {
        message: `Entschuldigung, es ist ein Fehler aufgetreten: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}. 
        
Ich kann Ihnen trotzdem helfen! Versuchen Sie es mit einer anderen Formulierung oder fragen Sie mich nach:
- Kundeninformationen
- Preisberechnungen
- Angebotserstellung
- Allgemeinen Tipps zum Umzugsgeschäft`,
        suggestions: [
          'Zeige mir alle Kunden',
          'Wie berechne ich einen Umzugspreis?',
          'Was kostet ein Umzug mit 30m³?',
          'Welche Zusatzleistungen gibt es?'
        ]
      };
    }
  }

  private async buildSystemContext(): Promise<string> {
    try {
      const context = await this.contextManager.getFullContext();
      const stats = {
        totalCustomers: context.customers?.length || 0,
        activeQuotes: context.quotes?.filter(q => q.status === 'sent').length || 0,
        pendingInvoices: context.invoices?.filter(i => i.status === 'unpaid').length || 0
      };

      // Berechne zusätzliche Insights
      const recentCustomers = context.customers
        ?.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 5)
        .map(c => `${c.name} (${c.city || 'Keine Stadt'})`);

      const topCities = this.getTopCities(context.customers || []);
      const averageQuoteValue = this.calculateAverageQuoteValue(context.quotes || []);

      return `
AKTUELLE STATISTIKEN:
- Kunden gesamt: ${stats.totalCustomers}
- Aktive Angebote: ${stats.activeQuotes}
- Offene Rechnungen: ${stats.pendingInvoices}

NEUESTE KUNDEN:
${recentCustomers?.join('\n') || 'Keine Kunden'}

TOP STÄDTE:
${topCities.map(city => `${city.name}: ${city.count} Kunden`).join('\n')}

DURCHSCHNITTLICHER ANGEBOTSWERT: ${averageQuoteValue.toFixed(2)}€

VERFÜGBARE SERVICES:
- Transport (Basis)
- Verpackungsmaterial
- Packservice
- Möbelmontage/-demontage
- Küchenservice
- Reinigung
- Einlagerung
- Entsorgung

PREISTABELLE (Auszug):
- 5m³: 515€
- 20m³: 1340€
- 50m³: 2690€
- 100m³: 4840€
`;
    } catch (error) {
      console.error('Error building context:', error);
      return 'Kontext konnte nicht vollständig geladen werden.';
    }
  }

  private async extractActions(response: string, userMessage: string): Promise<any[]> {
    const actions = [];
    
    // Erweiterte Aktionserkennung mit NLP
    const lowerMessage = userMessage.toLowerCase();
    const lowerResponse = response.toLowerCase();

    // Angebotserstellung
    if (lowerMessage.includes('angebot') && (lowerMessage.includes('erstell') || lowerMessage.includes('mach'))) {
      // Extrahiere Parameter aus der Nachricht
      const volumeMatch = userMessage.match(/(\d+)\s*m[³3]/);
      const distanceMatch = userMessage.match(/(\d+)\s*km/);
      const nameMatch = userMessage.match(/für\s+([A-Za-zÄÖÜäöüß\s]+?)(?:\s+mit|\s+\d|$)/i);

      if (nameMatch || volumeMatch) {
        actions.push({
          type: 'create_quote',
          data: {
            customerName: nameMatch?.[1]?.trim(),
            volume: volumeMatch ? parseInt(volumeMatch[1]) : null,
            distance: distanceMatch ? parseInt(distanceMatch[1]) : null
          },
          description: 'Angebot erstellen'
        });
      }
    }

    // Kundensuche
    if (lowerMessage.includes('kunde') && (lowerMessage.includes('such') || lowerMessage.includes('zeig') || lowerMessage.includes('find'))) {
      const searchTerm = userMessage.match(/(?:kunde|kunden)\s+(?:aus\s+)?([A-Za-zÄÖÜäöüß\s]+?)(?:\s+such|\s+zeig|$)/i);
      if (searchTerm) {
        actions.push({
          type: 'search_customer',
          data: { query: searchTerm[1].trim() },
          description: 'Kunden suchen'
        });
      }
    }

    // E-Mail senden
    if (lowerMessage.includes('email') || lowerMessage.includes('mail')) {
      const emailMatch = userMessage.match(/(?:an|@)\s*([\w.-]+@[\w.-]+\.\w+)/);
      if (emailMatch) {
        actions.push({
          type: 'send_email',
          data: { to: emailMatch[1] },
          description: 'E-Mail senden'
        });
      }
    }

    // Preisberechnung
    if (lowerMessage.includes('preis') || lowerMessage.includes('koste')) {
      const volumeMatch = userMessage.match(/(\d+)\s*m[³3]/);
      if (volumeMatch) {
        actions.push({
          type: 'calculate_price',
          data: { volume: parseInt(volumeMatch[1]) },
          description: 'Preis berechnen'
        });
      }
    }

    return actions;
  }

  private generateSuggestions(response: string, userMessage: string): string[] {
    const suggestions = [];
    const lowerMessage = userMessage.toLowerCase();

    // Kontextbasierte Vorschläge
    if (lowerMessage.includes('kunde')) {
      suggestions.push('Neuen Kunden anlegen');
      suggestions.push('Kundenstatistiken anzeigen');
      suggestions.push('Duplikate prüfen');
    }

    if (lowerMessage.includes('angebot') || lowerMessage.includes('preis')) {
      suggestions.push('Preiskalkulator öffnen');
      suggestions.push('Angebotsvorlagen anzeigen');
      suggestions.push('Rabatte berechnen');
    }

    if (lowerMessage.includes('rechnung')) {
      suggestions.push('Offene Rechnungen anzeigen');
      suggestions.push('Mahnungen versenden');
      suggestions.push('Zahlungseingänge prüfen');
    }

    // Allgemeine hilfreiche Vorschläge
    if (suggestions.length === 0) {
      suggestions.push('Tagesumsatz anzeigen');
      suggestions.push('Neue Anfrage bearbeiten');
      suggestions.push('Follow-ups für heute');
      suggestions.push('Team-Performance anzeigen');
    }

    return suggestions.slice(0, 4);
  }

  private getTopCities(customers: Customer[]): Array<{ name: string; count: number }> {
    const cityCount = customers.reduce((acc, customer) => {
      const city = customer.city || 'Unbekannt';
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(cityCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }

  private calculateAverageQuoteValue(quotes: Quote[]): number {
    if (quotes.length === 0) return 0;
    const total = quotes.reduce((sum, quote) => sum + (quote.price || 0), 0);
    return total / quotes.length;
  }

  async executeAction(action: any): Promise<any> {
    try {
      switch (action.type) {
        case 'create_quote':
          return await this.handleCreateQuote(action.data);
        
        case 'search_customer':
          return await this.handleSearchCustomer(action.data);
        
        case 'send_email':
          return await this.handleSendEmail(action.data);
        
        case 'calculate_price':
          return await this.handleCalculatePrice(action.data);
        
        default:
          throw new Error(`Unbekannte Aktion: ${action.type}`);
      }
    } catch (error) {
      console.error('Error executing action:', error);
      throw error;
    }
  }

  private async handleCreateQuote(data: any): Promise<any> {
    // Intelligente Angebotserstellung mit Standardwerten
    const { customerName, volume = 30, distance = 50 } = data;
    
    // Suche existierenden Kunden
    let customer = null;
    if (customerName) {
      const customers = await this.contextManager.searchCustomers(customerName);
      customer = customers[0];
    }

    if (!customer) {
      return {
        success: false,
        message: `Kunde "${customerName}" nicht gefunden. Soll ich einen neuen Kunden anlegen?`,
        requiresConfirmation: true
      };
    }

    const calculation = quoteCalculationService.calculateQuote(customer, {
      volume,
      distance,
      floors: { pickup: 0, delivery: 0 },
      additionalServices: [],
      manualAdjustment: 0
    });

    return {
      success: true,
      data: {
        customer,
        calculation,
        volume,
        distance
      },
      message: `Angebot für ${customer.name} vorbereitet: ${calculation.total.toFixed(2)}€ für ${volume}m³`
    };
  }

  private async handleSearchCustomer(data: any): Promise<any> {
    const customers = await this.contextManager.searchCustomers(data.query);
    return {
      success: true,
      data: customers,
      message: `${customers.length} Kunden gefunden`
    };
  }

  private async handleSendEmail(data: any): Promise<any> {
    // Hier würde die E-Mail-Logik implementiert
    return {
      success: true,
      message: `E-Mail vorbereitet für ${data.to}`
    };
  }

  private async handleCalculatePrice(data: any): Promise<any> {
    const calculation = quoteCalculationService.calculateQuote({} as Customer, {
      volume: data.volume,
      distance: data.distance || 50,
      floors: data.floors || { pickup: 0, delivery: 0 },
      additionalServices: data.services || [],
      manualAdjustment: 0
    });

    return {
      success: true,
      data: calculation,
      message: `Preisberechnung: ${calculation.total.toFixed(2)}€ für ${data.volume}m³`
    };
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  getHistory(): Array<{ role: string; content: string }> {
    return this.conversationHistory;
  }
}