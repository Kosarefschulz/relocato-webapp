import { OpenAIService } from './openaiService';
import { AIContextManager } from './aiContextManager';
import { AIVisionService } from './aiVisionService';
import { AIBackgroundService } from './aiBackgroundService';
import { AISystemAnalyzer } from './aiSystemAnalyzer';
import { AIVoiceService } from './aiVoiceService';
import { Customer, Quote, Invoice } from '../../types';
import { unifiedDatabaseService } from '../unifiedDatabaseService';
import { sendEmail } from '../emailService';
import { pdfService } from '../pdfServiceWrapper';
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
  audioResponse?: string;
}

export class AIAssistantServiceV2 {
  private static instance: AIAssistantServiceV2 | null = null;
  private openai: OpenAIService;
  private contextManager: AIContextManager;
  private visionService: AIVisionService;
  private backgroundService: AIBackgroundService;
  private systemAnalyzer: AISystemAnalyzer;
  private voiceService: AIVoiceService;
  private conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];
  private apiKey: string;

  constructor(config: AIAssistantConfig) {
    this.apiKey = config.apiKey;
    this.openai = new OpenAIService({
      apiKey: config.apiKey,
      model: config.model || 'gpt-4o',
      maxTokens: 3000,
      temperature: 0.8
    });
    this.contextManager = new AIContextManager();
    this.visionService = new AIVisionService(config.apiKey);
    this.backgroundService = new AIBackgroundService();
    this.systemAnalyzer = new AISystemAnalyzer();
    this.voiceService = new AIVoiceService();
  }

  static getInstance(config: AIAssistantConfig): AIAssistantServiceV2 {
    if (!AIAssistantServiceV2.instance || AIAssistantServiceV2.instance.apiKey !== config.apiKey) {
      AIAssistantServiceV2.instance = new AIAssistantServiceV2(config);
    }
    return AIAssistantServiceV2.instance;
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  async processMessage(userMessage: string, context?: any, images?: string[]): Promise<AIResponse> {
    try {
      // Verarbeite Bilder wenn vorhanden
      let imageAnalysisResults = null;
      if (images && images.length > 0) {
        imageAnalysisResults = await this.visionService.processMultipleImages(images);
      }

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
   - Supabase-basierte Datenspeicherung

3. INTELLIGENTE BERATUNG:
   - Preisempfehlungen basierend auf Erfahrungswerten
   - Optimierungsvorschläge für Umzugsrouten
   - Kundenkommunikationsstrategien
   - Geschäftsanalysen und Trends
   - Best Practices im Umzugsgeschäft

4. BILDVERARBEITUNG:
   - Analyse von Fotos (Besichtigungen, Notizen, Kalender)
   - Automatische Datenextraktion aus Bildern
   - Kundenerstellung aus Visitenkarten
   - Volumenberechnung aus Raumfotos

5. HINTERGRUND-AUFGABEN:
   - Angebote im Hintergrund erstellen und versenden
   - Automatische Follow-ups
   - E-Mail-Versand mit Wiederholung bei Fehlern
   - Status-Updates für laufende Aufgaben

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

      // Generiere Antwort mit vollständiger Historie
      const response = await this.openai.generateTextWithHistory(messages);

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
      packingRequested: false,
      additionalServices: [],
      notes: '',
      boxCount: 0,
      parkingZonePrice: 0,
      storagePrice: 0,
      furnitureAssemblyPrice: 0,
      furnitureDisassemblyPrice: 0,
      cleaningService: false,
      cleaningHours: 0,
      clearanceService: false,
      clearanceVolume: 0,
      renovationService: false,
      renovationHours: 0,
      pianoTransport: false,
      heavyItemsCount: 0,
      packingMaterials: false,
      manualBasePrice: 0
    });

    return {
      success: true,
      data: {
        customer,
        calculation,
        volume,
        distance
      },
      message: `Angebot für ${customer.name} vorbereitet: ${calculation.totalPrice.toFixed(2)}€ für ${volume}m³`
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
      packingRequested: false,
      additionalServices: data.services || [],
      notes: '',
      boxCount: 0,
      parkingZonePrice: 0,
      storagePrice: 0,
      furnitureAssemblyPrice: 0,
      furnitureDisassemblyPrice: 0,
      cleaningService: false,
      cleaningHours: 0,
      clearanceService: false,
      clearanceVolume: 0,
      renovationService: false,
      renovationHours: 0,
      pianoTransport: false,
      heavyItemsCount: 0,
      packingMaterials: false,
      manualBasePrice: 0
    });

    return {
      success: true,
      data: calculation,
      message: `Preisberechnung: ${calculation.totalPrice.toFixed(2)}€ für ${data.volume}m³`
    };
  }

  getHistory(): Array<{ role: string; content: string }> {
    return this.conversationHistory;
  }

  // Voice-Support Methoden
  async startVoiceListening(): Promise<string> {
    return await this.voiceService.startListening();
  }

  stopVoiceListening(): void {
    this.voiceService.stopListening();
  }

  async speakResponse(text: string): Promise<void> {
    return await this.voiceService.speak(text);
  }

  isVoiceSupported(): boolean {
    return this.voiceService.isSupported();
  }

  // System-Analyse Methoden
  async getSystemHealth(): Promise<string> {
    return await this.systemAnalyzer.getCompleteSystemState();
  }

  async getDatabaseStructure(): Promise<string> {
    return await this.systemAnalyzer.getDatabaseStructure();
  }

  async processImage(imageBase64: string): Promise<any> {
    return await this.visionService.analyzeImage(imageBase64);
  }

  async getBackgroundTaskStatus(taskId: string): Promise<any> {
    return await this.backgroundService.getTaskStatus(taskId);
  }

  async createBackgroundTask(type: string, data: any): Promise<string> {
    // Parse spezielle Anweisungen für Hintergrundaufgaben
    if (type === 'auto_quote') {
      // "Mach für Herrn Schulz ein Angebot für 1500€ und sende es"
      return await this.backgroundService.addTask('create_quote', {
        ...data,
        sendEmail: true
      });
    }
    
    return await this.backgroundService.addTask(type as any, data);
  }

  // Erweiterte Aktionserkennung für Bilder und Hintergrundaufgaben
  async processEnhancedMessage(message: string, images?: string[], audioData?: string): Promise<AIResponse> {
    // Verarbeite Sprachnachricht wenn vorhanden
    let finalMessage = message;
    if (audioData && this.voiceService.isSupported()) {
      try {
        const transcription = await this.voiceService.transcribeAudio(audioData, this.apiKey);
        finalMessage = transcription || message;
      } catch (error) {
        console.error('Fehler bei Sprachtranskription:', error);
      }
    }

    // Erkenne System-Analyse-Anfragen
    const systemAnalysisPattern = /(?:zeige?|was ist|wie ist|analysiere?).*?(?:system|struktur|app|gesundheit|status)/i;
    if (systemAnalysisPattern.test(finalMessage)) {
      const systemState = await this.systemAnalyzer.getCompleteSystemState();
      return {
        message: systemState,
        suggestions: [
          'Zeige Datenbankstruktur',
          'Prüfe System-Performance',
          'Analysiere Geschäftstrends',
          'Zeige verfügbare Funktionen'
        ]
      };
    }

    // Erkenne Hintergrund-Aufgaben
    const backgroundPattern = /(?:mach|erstelle|sende).*?(?:für|an)\s+(?:herrn|frau|firma)?\s*([A-Za-zÄÖÜäöüß\s]+?)(?:\s+ein|\s+eine|\s+noch).*?(?:angebot|rechnung).*?(\d+)\s*€.*?(?:und\s+sende|versende|schicke)/i;
    const match = finalMessage.match(backgroundPattern);
    
    if (match) {
      const customerName = match[1].trim();
      const amount = parseInt(match[2]);
      
      const taskId = await this.createBackgroundTask('auto_quote', {
        customerName,
        amount,
        notes: `Automatisch erstellt: ${finalMessage}`
      });
      
      return {
        message: `Verstanden! Ich erstelle im Hintergrund ein Angebot für ${customerName} über ${amount}€ und sende es automatisch zu. Task-ID: ${taskId}`,
        actions: [{
          type: 'background_task',
          data: { taskId, customerName, amount }
        }],
        suggestions: [
          `Status von Task ${taskId} prüfen`,
          'Weitere Angebote erstellen',
          'E-Mail-Verlauf anzeigen'
        ]
      };
    }

    // Normale Verarbeitung mit optionalen Bildern
    return await this.processMessage(finalMessage, null, images);
  }
}