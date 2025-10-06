import { ClaudeService } from './claudeService';
import { Customer, Quote, Invoice } from '../../types';
import { supabaseService } from '../supabaseService';
import { codeOperationsService } from './codeOperationsService';
import { ragService } from './ragService';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; image_url?: any }>;
  images?: string[];
  actions?: AIAction[];
}

export interface AIAction {
  type: 'create_customer' | 'update_customer' | 'create_quote' | 'create_invoice' | 'search' | 'search_customers' | 'analyze' |
        'read_file' | 'write_file' | 'edit_file' | 'create_component' | 'search_code' | 'execute_command' | 'git_operation';
  data: any;
  status: 'pending' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

export interface SupabaseContext {
  customers: Customer[];
  quotes: Quote[];
  invoices: Invoice[];
  customerPhases: { [phase: string]: number };
  statistics: {
    totalCustomers: number;
    totalQuotes: number;
    totalInvoices: number;
    totalRevenue: number;
  };
}

export class IntelligentAssistantService {
  private claude: ClaudeService;
  private chatHistory: ChatMessage[] = [];
  private supabaseContext: SupabaseContext | null = null;
  private contextCache: { data: SupabaseContext; timestamp: number } | null = null;
  private readonly CACHE_TTL = 30000; // 30 Sekunden Cache

  constructor() {
    const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Anthropic API Key nicht konfiguriert');
    }

    this.claude = new ClaudeService({
      apiKey,
      model: process.env.REACT_APP_AI_MODEL || 'claude-sonnet-4-5-20250929',
      maxTokens: 8192, // Erhöht für Multi-Step Operations
      temperature: 0.7
    });

    console.log('✅ Claude Sonnet 4.5 initialized (mit Multi-Step & Caching)');
  }

  /**
   * Lädt den vollständigen Kontext aus Supabase (mit Caching)
   */
  async loadSupabaseContext(forceRefresh: boolean = false): Promise<void> {
    // Check Cache
    if (!forceRefresh && this.contextCache) {
      const age = Date.now() - this.contextCache.timestamp;
      if (age < this.CACHE_TTL) {
        console.log(`📦 Using cached context (${(age / 1000).toFixed(1)}s old)`);
        this.supabaseContext = this.contextCache.data;
        return;
      }
    }

    try {
      console.log('🔄 Loading fresh Supabase context...');

      const [customers, quotes, invoices] = await Promise.all([
        supabaseService.getCustomers(),
        supabaseService.getQuotes(),
        supabaseService.getInvoices()
      ]);

      // Phasen-Statistiken
      const customerPhases: { [phase: string]: number } = {};
      customers.forEach(customer => {
        const phase = customer.currentPhase || 'angerufen';
        customerPhases[phase] = (customerPhases[phase] || 0) + 1;
      });

      // Gesamt-Statistiken
      const totalRevenue = invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + (inv.totalPrice || 0), 0);

      this.supabaseContext = {
        customers,
        quotes,
        invoices,
        customerPhases,
        statistics: {
          totalCustomers: customers.length,
          totalQuotes: quotes.length,
          totalInvoices: invoices.length,
          totalRevenue
        }
      };

      // Update Cache
      this.contextCache = {
        data: this.supabaseContext,
        timestamp: Date.now()
      };

      console.log('✅ Context loaded & cached:', {
        customers: customers.length,
        quotes: quotes.length,
        invoices: invoices.length
      });
    } catch (error) {
      console.error('❌ Fehler beim Laden des Supabase-Kontext:', error);
      throw error;
    }
  }

  /**
   * Cache leeren
   */
  clearCache(): void {
    this.contextCache = null;
    console.log('🗑️ Cache cleared');
  }

  /**
   * Erstellt den System-Prompt mit aktuellem Kontext
   */
  private getSystemPrompt(): string {
    if (!this.supabaseContext) {
      return `Du bist ein intelligenter KI-Assistent für die Umzugs-CRM-App "Relocato".

🎯 DEINE FÄHIGKEITEN:
1. **KUNDEN ANLEGEN** - Du kannst selbstständig neue Kunden in der Datenbank anlegen
2. **KUNDEN AKTUALISIEREN** - Du kannst Kundendaten ändern
3. **ANGEBOTE ERSTELLEN** - Du kannst Umzugsangebote erstellen
4. **RECHNUNGEN ERSTELLEN** - Du kannst Rechnungen generieren
5. **DATEN ANALYSIEREN** - Du kannst Screenshots und Dokumente analysieren
6. **SUCHEN & FINDEN** - Du kannst in der Datenbank suchen

⚠️ WICHTIG:
- Wenn ein Benutzer sagt "Lege einen Kunden an" oder "Erstelle einen neuen Kunden", dann TU ES DIREKT
- Frage nach fehlenden Informationen, aber lege den Kunden dann selbstständig an
- Nutze die verfügbaren Funktionen, um Aktionen auszuführen

Antworte immer auf Deutsch, professionell und präzise.`;
    }

    const { statistics, customerPhases } = this.supabaseContext;

    return `Du bist Claude Sonnet 4.5 - ALLROUNDER-ASSISTENT für RELOCATO® Umzüge & Rümpel Schmiede.

🏢 FIRMEN-KONTEXT:
RELOCATO® = Umzugsfirma (200-300 Kunden/Monat)
Rümpel Schmiede = Partner für Hausauflösungen
E-Mail: bielefeld@relocato.de

📊 SYSTEM-STATUS:
Kunden: ${statistics.totalCustomers} | Angebote: ${statistics.totalQuotes} | Rechnungen: ${statistics.totalInvoices} | Umsatz: ${statistics.totalRevenue.toFixed(2)}€

📈 PIPELINE:
${Object.entries(customerPhases).map(([phase, count]) => `${phase}: ${count}`).join(' | ')}

💰 PREIS-TABELLE (AUSWENDIG!):
10m³=749€ | 15m³=899€ | 20m³=1.099€ | 25m³=1.299€ | 30m³=1.499€ | 35m³=1.699€ | 40m³=1.899€
Etage (kein Aufzug): +50€/Stock | Entfernung: +1,20€/km über 50km
Services: Klavier +150€ | Halteverbot +80€ | Einpacken +45€/h | Montage +65€/h | Reinigung +35€/h
Rabatt: Frühbucher -5% (≥4 Wochen)

💬 TELEFON-SCRIPT (Neuanfrage):
1. Name, Von/Nach, Datum, Zimmerzahl erfragen
2. Etage & Aufzug? | Besonderes (Klavier etc.)?
3. Volumen schätzen: 1Zi=10m³, 2Zi=15m³, 3Zi=25m³, 4Zi=35m³
4. Preis kalkulieren | 5. Email + Follow-Up (7 Tage)

🎯 DEINE FÄHIGKEITEN MIT DIREKTEM ZUGRIFF:

**CRM-OPERATIONEN:**
1. **KUNDEN ANLEGEN** ✅ - Neue Kunden in Datenbank erstellen
2. **KUNDEN AKTUALISIEREN** ✅ - Kundendaten ändern
3. **ANGEBOTE ERSTELLEN** ✅ - Umzugsangebote kalkulieren
4. **RECHNUNGEN ERSTELLEN** ✅ - Rechnungen generieren

**CODE-OPERATIONEN (NEU!):**
5. **CODE LESEN** ✅ - Dateien im Projekt öffnen und lesen
6. **CODE SCHREIBEN** ✅ - Neue Dateien/Komponenten erstellen
7. **CODE EDITIEREN** ✅ - Bestehende Dateien ändern (find/replace)
8. **KOMPONENTEN ERSTELLEN** ✅ - Neue React-Komponenten generieren
9. **CODE-SUCHE** ✅ - Nach Code-Patterns suchen (grep)
10. **TERMINAL-BEFEHLE** ✅ - npm, git, etc. ausführen
11. **GIT-OPERATIONEN** ✅ - status, add, commit, diff

**ANALYSE:**
12. **VISION** ✅ - Screenshots/Dokumente analysieren
13. **SUCHE** ✅ - ${statistics.totalCustomers} Kunden durchsuchen

⚠️ WICHTIG - AKTIONS-REGELN:

**Für CRM-Operationen:**
- "Lege einen Kunden an" → Nutze create_customer Tool SOFORT
- "Erstelle ein Angebot" → Nutze create_quote Tool
- "Suche nach..." → Nutze search_customers Tool
- Bei fehlenden Infos → Frage einmal, dann führe mit Defaults aus

**Für Code-Operationen:**
- "Erstelle eine Komponente" → Nutze create_component Tool
- "Lies die Datei X" → Nutze read_file Tool
- "Ändere in Datei X..." → Nutze edit_file Tool
- "Suche nach Pattern" → Nutze search_code Tool
- "Führe npm/git aus" → Nutze execute_command oder git_operation Tool

**Generell:**
- NUTZE IMMER DIE TOOLS wenn verfügbar
- NIEMALS sagen "Ich habe keinen Zugriff" → DU HAST ALLE TOOLS!
- Bei Code-Änderungen → Erkläre WAS du tust BEVOR du es tust
- Nach Aktionen → Bestätige mit ✅ und Details

📋 KUNDEN-PHASEN:
- angerufen (Erstkontakt)
- nachfassen (Follow-up nötig)
- angebot_erstellt (Angebot versendet)
- besichtigung_geplant (Termin vereinbart)
- durchfuehrung (Umzug läuft)
- rechnung (Rechnung erstellt)
- bewertung (Warte auf Feedback)
- archiviert (Abgeschlossen)

📧 EMAIL-VORLAGEN:
Angebot: "Vielen Dank für Ihre Anfrage! Hier Ihr Angebot: [DETAILS]. Gültig bis [DATUM]."
Follow-Up: "Vor 7 Tagen Angebot geschickt. Noch Fragen?"
Auftragsbestätigung: "Bestätigt: [DATUM] um [UHRZEIT]. Team kommt pünktlich!"

❓ TOP-KUNDENFRAGEN:
"Was kostet...?" → Preistabelle nutzen + Zuschläge
"Wann habt ihr Zeit?" → Kalender Tool nutzen
"Wie lange dauert...?" → 1Zi=2-4h, 2Zi=4-6h, 3Zi=6-8h
"Versicherung?" → "620€/cbm Haftpflicht inkl., Vollkasko optional"
"Rabatt?" → "5% Frühbucher bei ≥4 Wochen Vorlauf"

🎯 BÜROKRAFT-HILFE:
- "Tagesübersicht" → Zeige: Termine heute, Follow-Ups, überfällige Rechnungen
- "Preis für X" → Kalkuliere exakt mit Tabelle
- "Email an Kunde" → Nutze Templates, personalisiere
- "Nächste Schritte für Kunde X" → Zeige workflow basierend auf Phase

⚡ SEI PROAKTIV:
- Nach Kunden-Anlage → "Soll ich Angebot erstellen?"
- Nach Angebot → "Soll ich Follow-Up in 7 Tagen anlegen?"
- Bei überfälligen Follow-Ups → "3 Follow-Ups überfällig. Soll ich E-Mails entwerfen?"

Antworte IMMER:
- Deutsch | Professionell | Aktionsorientiert | Mit Emojis ✅
- NUTZE TOOLS aggressiv! | Multi-Step bei komplexen Tasks!
`;
  }

  /**
   * Definiert die verfügbaren Tools für Claude
   */
  private getToolDefinitions(): any[] {
    return [
      {
        name: 'create_customer',
        description: 'Legt einen neuen Kunden in der Datenbank an. Nutze diese Funktion, wenn der Benutzer einen Kunden anlegen möchte.',
        input_schema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name des Kunden (Vor- und Nachname)'
            },
            phone: {
              type: 'string',
              description: 'Telefonnummer des Kunden'
            },
            email: {
              type: 'string',
              description: 'E-Mail-Adresse des Kunden'
            },
            currentAddress: {
              type: 'string',
              description: 'Aktuelle Adresse (von wo umgezogen wird)'
            },
            newAddress: {
              type: 'string',
              description: 'Neue Adresse (wohin umgezogen wird)'
            },
            moveDate: {
              type: 'string',
              description: 'Umzugsdatum im Format YYYY-MM-DD'
            },
            currentPhase: {
              type: 'string',
              enum: ['angerufen', 'nachfassen', 'angebot_erstellt', 'besichtigung_geplant', 'durchfuehrung', 'rechnung', 'bewertung', 'archiviert'],
              description: 'Aktuelle Phase des Kunden in der Pipeline'
            },
            notes: {
              type: 'string',
              description: 'Zusätzliche Notizen oder Anforderungen'
            }
          },
          required: ['name']
        }
      },
      {
        name: 'update_customer',
        description: 'Aktualisiert einen existierenden Kunden',
        input_schema: {
          type: 'object',
          properties: {
            customerId: {
              type: 'string',
              description: 'ID des zu aktualisierenden Kunden'
            },
            updates: {
              type: 'object',
              description: 'Zu aktualisierende Felder'
            }
          },
          required: ['customerId', 'updates']
        }
      },
      {
        name: 'search_customers',
        description: 'Sucht nach Kunden in der Datenbank',
        input_schema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Suchbegriff (Name, E-Mail, Telefon, etc.)'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'create_quote',
        description: 'Erstellt ein neues Angebot für einen Kunden',
        input_schema: {
          type: 'object',
          properties: {
            customerId: {
              type: 'string',
              description: 'ID des Kunden'
            },
            price: {
              type: 'number',
              description: 'Angebotspreis in Euro'
            },
            volume: {
              type: 'number',
              description: 'Umzugsvolumen in m³'
            },
            distance: {
              type: 'number',
              description: 'Entfernung in km'
            },
            comment: {
              type: 'string',
              description: 'Kommentar zum Angebot'
            }
          },
          required: ['customerId', 'price']
        }
      },
      // ========== CODE OPERATIONS ==========
      {
        name: 'read_file',
        description: 'Liest den Inhalt einer Datei aus dem Projekt',
        input_schema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Relativer Pfad zur Datei (z.B. src/components/MyComponent.tsx)'
            }
          },
          required: ['path']
        }
      },
      {
        name: 'write_file',
        description: 'Schreibt oder erstellt eine Datei mit Inhalt',
        input_schema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Relativer Pfad zur Datei'
            },
            content: {
              type: 'string',
              description: 'Dateiinhalt'
            }
          },
          required: ['path', 'content']
        }
      },
      {
        name: 'edit_file',
        description: 'Editiert eine Datei durch Ersetzen von Text (find & replace)',
        input_schema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Relativer Pfad zur Datei'
            },
            oldString: {
              type: 'string',
              description: 'Text der ersetzt werden soll'
            },
            newString: {
              type: 'string',
              description: 'Neuer Text'
            }
          },
          required: ['path', 'oldString', 'newString']
        }
      },
      {
        name: 'create_component',
        description: 'Erstellt eine neue React-Komponente mit Standard-Template',
        input_schema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name der Komponente (z.B. CustomerStats)'
            },
            directory: {
              type: 'string',
              description: 'Verzeichnis (default: src/components)'
            }
          },
          required: ['name']
        }
      },
      {
        name: 'search_code',
        description: 'Sucht nach einem Pattern/Text im Code (grep)',
        input_schema: {
          type: 'object',
          properties: {
            pattern: {
              type: 'string',
              description: 'Suchbegriff oder Regex-Pattern'
            },
            path: {
              type: 'string',
              description: 'Optionaler Pfad zum Durchsuchen (default: src/)'
            }
          },
          required: ['pattern']
        }
      },
      {
        name: 'execute_command',
        description: 'Führt einen Terminal-Befehl aus (npm, git, etc.)',
        input_schema: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'Befehl der ausgeführt werden soll'
            }
          },
          required: ['command']
        }
      },
      {
        name: 'git_operation',
        description: 'Führt eine Git-Operation aus',
        input_schema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['status', 'add', 'commit', 'diff', 'log'],
              description: 'Git-Aktion'
            },
            params: {
              type: 'object',
              description: 'Zusätzliche Parameter (z.B. message für commit)'
            }
          },
          required: ['action']
        }
      }
    ];
  }

  /**
   * NEUE: Multi-Step Chat mit Tool-Chaining
   * Ermöglicht der KI, mehrere Tools nacheinander zu nutzen
   */
  async chat(
    userMessage: string,
    imageBase64?: string,
    refreshContext: boolean = false,
    maxSteps: number = 10
  ): Promise<{ response: string; actions?: AIAction[]; steps?: number }> {
    const startTime = Date.now();

    try {
      // Kontext neu laden falls gewünscht
      if (refreshContext || !this.supabaseContext) {
        await this.loadSupabaseContext();
      }

      // RAG: Session starten wenn noch nicht vorhanden
      if (!ragService.getSessionId()) {
        await ragService.startSession();
      }

      // RAG: Finde relevanten Kontext aus früheren Chats
      const relevantHistory = await ragService.findRelevantContext(userMessage, 3);
      const relevantKnowledge = await ragService.searchKnowledge(userMessage);

      // Erweitere System-Prompt mit RAG-Context
      let ragContext = '';

      if (relevantHistory.length > 0) {
        ragContext += '\n\n📚 RELEVANTER KONTEXT AUS FRÜHEREN GESPRÄCHEN:\n';
        relevantHistory.forEach((msg, i) => {
          ragContext += `${i + 1}. [${msg.role}]: ${msg.content.slice(0, 200)}...\n`;
        });
      }

      if (relevantKnowledge.length > 0) {
        ragContext += '\n\n💡 RELEVANTES WISSEN:\n';
        relevantKnowledge.forEach((kb, i) => {
          ragContext += `${i + 1}. ${kb.title}: ${kb.content.slice(0, 300)}...\n`;
        });
      }

      // System-Prompt mit RAG
      const systemPrompt = this.getSystemPrompt() + ragContext;

      let finalResponse = '';
      let executedActions: AIAction[] = [];
      let stepCount = 0;

      // Mit Bild: Nutze Vision (kein Multi-Step bei Vision)
      if (imageBase64) {
        finalResponse = await this.claude.generateTextWithVision(
          userMessage,
          imageBase64,
          systemPrompt
        );
      } else {
        // Ohne Bild: Multi-Step Tool Use mit Conversation Loop
        const tools = this.getToolDefinitions();
        let conversationMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
        let currentPrompt = userMessage;
        let shouldContinue = true;

        // Multi-Step Loop
        while (shouldContinue && stepCount < maxSteps) {
          stepCount++;
          console.log(`\n🔄 Step ${stepCount}/${maxSteps}`);

          const result = await this.claude.generateWithTools(
            currentPrompt,
            systemPrompt + this.getConversationContext(conversationMessages, executedActions),
            tools
          );

          // Text-Response vorhanden
          if (result.content) {
            finalResponse = result.content;
          }

          // Tool Use vorhanden
          if (result.toolUse) {
            console.log(`   🔧 Tool: ${result.toolUse.name}`);

            const action: AIAction = {
              type: result.toolUse.name as any,
              data: result.toolUse.arguments,
              status: 'pending'
            };

            try {
              const actionResult = await this.executeAction(action);
              action.status = 'completed';
              action.result = actionResult;
              executedActions.push(action);

              console.log(`   ✅ Tool executed successfully`);

              // Add to conversation history für nächsten Step
              conversationMessages.push({
                role: 'assistant',
                content: `Ich habe ${action.type} ausgeführt.`
              });

              conversationMessages.push({
                role: 'user',
                content: `Tool Ergebnis: ${JSON.stringify(actionResult).slice(0, 500)}. Führe den nächsten Schritt aus oder bestätige wenn fertig.`
              });

              // Update prompt for next iteration
              currentPrompt = `Das Tool ${action.type} wurde erfolgreich ausgeführt. ${result.content || 'Führe den nächsten Schritt aus oder sage "Fertig" wenn die Aufgabe komplett ist.'}`;

              // Wenn KI "fertig" sagt oder kein Text mehr kommt, stoppe
              if (result.content && (
                result.content.toLowerCase().includes('fertig') ||
                result.content.toLowerCase().includes('abgeschlossen') ||
                result.content.toLowerCase().includes('erledigt')
              )) {
                console.log('   ✅ KI signalisiert: Aufgabe fertig');
                shouldContinue = false;
              }

            } catch (error) {
              action.status = 'failed';
              action.error = error instanceof Error ? error.message : 'Unbekannter Fehler';
              executedActions.push(action);

              console.log(`   ❌ Tool failed:`, action.error);

              finalResponse = `❌ Fehler in Schritt ${stepCount}: ${action.error}`;
              shouldContinue = false;
            }
          } else {
            // Kein Tool mehr → Fertig
            console.log(`   ✅ No more tools needed, finishing`);
            shouldContinue = false;
          }
        }

        // Max Steps erreicht?
        if (stepCount >= maxSteps) {
          finalResponse = `⚠️ Maximum steps (${maxSteps}) erreicht. ${executedActions.length} Aktionen ausgeführt.\n\n` + finalResponse;
        }

        // Generate final summary
        if (executedActions.length > 0) {
          finalResponse = await this.generateMultiStepSummary(executedActions, finalResponse);
        }
      }

      // History aktualisieren (local)
      this.chatHistory.push({
        role: 'user',
        content: userMessage,
        images: imageBase64 ? [imageBase64] : undefined
      });

      this.chatHistory.push({
        role: 'assistant',
        content: finalResponse,
        actions: executedActions.length > 0 ? executedActions : undefined
      });

      // RAG: Chat-Historie persistent speichern
      const responseTime = Date.now() - startTime;
      await ragService.storeChatMessage('user', userMessage, {
        imageUrl: imageBase64
      });
      await ragService.storeChatMessage('assistant', finalResponse, {
        toolsUsed: executedActions,
        success: executedActions.every(a => a.status === 'completed'),
        responseTimeMs: responseTime
      });

      // RAG: Automatisches Learning bei erfolgreichen Multi-Steps
      if (executedActions.length > 1 && responseTime < 10000) {
        const successfulActions = executedActions.filter(a => a.status === 'completed');
        if (successfulActions.length === executedActions.length) {
          await ragService.learnFromInteraction(
            userMessage,
            finalResponse,
            executedActions.map(a => ({ type: a.type, data: a.data })),
            0.9 // Auto-Rating für schnelle erfolgreiche Multi-Steps
          );
        }
      }

      return {
        response: finalResponse,
        actions: executedActions.length > 0 ? executedActions : undefined,
        steps: stepCount
      };
    } catch (error) {
      console.error('❌ Chat-Fehler:', error);
      throw new Error(`Chat fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    }
  }

  /**
   * Generiert Conversation Context für Multi-Step
   */
  private getConversationContext(
    messages: Array<{ role: string; content: string }>,
    actions: AIAction[]
  ): string {
    if (messages.length === 0 && actions.length === 0) {
      return '';
    }

    let context = '\n\n🔄 BISHERIGER FORTSCHRITT:\n';

    if (actions.length > 0) {
      context += `\nAusgeführte Tools (${actions.length}):\n`;
      actions.forEach((action, i) => {
        context += `${i + 1}. ${action.status === 'completed' ? '✅' : '❌'} ${action.type}\n`;
      });
    }

    context += '\nDu kannst JETZT weitere Tools nutzen um die Aufgabe zu komplettieren!\n';

    return context;
  }

  /**
   * Generiert Multi-Step Summary
   */
  private async generateMultiStepSummary(actions: AIAction[], aiResponse: string): Promise<string> {
    const successful = actions.filter(a => a.status === 'completed');
    const failed = actions.filter(a => a.status === 'failed');

    let summary = `✅ Multi-Step Operation abgeschlossen!\n\n`;
    summary += `📊 ${successful.length}/${actions.length} Aktionen erfolgreich\n\n`;
    summary += `📋 Ausgeführte Schritte:\n\n`;

    successful.forEach((action, i) => {
      summary += `${i + 1}. ✅ ${this.getActionLabel(action.type)}\n`;
      summary += `   ${this.getActionSummary(action)}\n\n`;
    });

    if (failed.length > 0) {
      summary += `\n❌ Fehlgeschlagen (${failed.length}):\n\n`;
      failed.forEach((action, i) => {
        summary += `${i + 1}. ❌ ${this.getActionLabel(action.type)}\n`;
        summary += `   Error: ${action.error}\n\n`;
      });
    }

    if (aiResponse && !aiResponse.includes('Fehler')) {
      summary += `\n💬 ${aiResponse}`;
    }

    return summary;
  }

  /**
   * Hilfsfunktion: Lesbare Action Labels
   */
  private getActionLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'create_customer': 'Kunde anlegen',
      'update_customer': 'Kunde aktualisieren',
      'create_quote': 'Angebot erstellen',
      'read_file': 'Datei lesen',
      'write_file': 'Datei schreiben',
      'edit_file': 'Datei editieren',
      'create_component': 'Komponente erstellen',
      'search_code': 'Code durchsuchen',
      'execute_command': 'Command ausführen',
      'git_operation': 'Git-Operation'
    };
    return labels[type] || type;
  }

  /**
   * Hilfsfunktion: Action Summary
   */
  private getActionSummary(action: AIAction): string {
    switch (action.type) {
      case 'create_customer':
        return `Kunde "${action.data.name}" wurde angelegt`;
      case 'create_component':
        return `Komponente "${action.data.name}" wurde erstellt`;
      case 'write_file':
        return `Datei "${action.data.path}" wurde geschrieben`;
      case 'edit_file':
        return `"${action.data.path}" wurde editiert (${action.result?.replacements || 0} Änderungen)`;
      case 'read_file':
        return `"${action.data.path}" wurde gelesen (${action.result?.size || 0} Bytes)`;
      case 'search_code':
        return `${action.result?.length || 0} Treffer für "${action.data.pattern}"`;
      case 'execute_command':
        return `Command "${action.data.command}" wurde ausgeführt`;
      case 'git_operation':
        return `Git ${action.data.action} wurde ausgeführt`;
      default:
        return 'Aktion wurde ausgeführt';
    }
  }

  /**
   * Führt eine Aktion aus
   */
  private async executeAction(action: AIAction): Promise<any> {
    console.log('▶️ Führe Aktion aus:', action.type, action.data);

    switch (action.type) {
      // CRM Operations
      case 'create_customer':
        return await this.createCustomer(action.data);

      case 'update_customer':
        return await this.updateCustomer(action.data);

      case 'search':
      case 'search_customers':
        return await this.searchCustomers(action.data.query);

      case 'create_quote':
        return await this.createQuote(action.data);

      // Code Operations
      case 'read_file':
        return await codeOperationsService.readFile(action.data.path);

      case 'write_file':
        await codeOperationsService.writeFile(action.data.path, action.data.content);
        return { path: action.data.path, success: true };

      case 'edit_file':
        const replacements = await codeOperationsService.editFile(
          action.data.path,
          action.data.oldString,
          action.data.newString
        );
        return { path: action.data.path, replacements, success: true };

      case 'create_component':
        await codeOperationsService.createComponent(
          action.data.name,
          action.data.directory
        );
        return { name: action.data.name, success: true };

      case 'search_code':
        return await codeOperationsService.search(action.data.pattern, action.data.path);

      case 'execute_command':
        return await codeOperationsService.execute(action.data.command);

      case 'git_operation':
        const output = await codeOperationsService.git(action.data.action, action.data.params);
        return { action: action.data.action, output };

      default:
        throw new Error(`Unbekannte Aktion: ${action.type}`);
    }
  }

  /**
   * Erstellt einen neuen Kunden
   */
  private async createCustomer(data: any): Promise<Customer> {
    console.log('➕ Erstelle neuen Kunden:', data);

    const newCustomer: Partial<Customer> = {
      name: data.name,
      phone: data.phone || '',
      email: data.email || '',
      fromAddress: data.currentAddress || '',
      toAddress: data.newAddress || '',
      movingDate: data.moveDate || new Date().toISOString().split('T')[0],
      currentPhase: data.currentPhase || 'angerufen',
      notes: data.notes || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      services: [],
      apartment: {
        rooms: 0,
        area: 0,
        floor: 0,
        hasElevator: false
      }
    };

    const customerId = await supabaseService.addCustomer(newCustomer as Customer);

    // Kontext neu laden
    await this.loadSupabaseContext();

    return {
      ...newCustomer,
      id: customerId
    } as Customer;
  }

  /**
   * Aktualisiert einen Kunden
   */
  private async updateCustomer(data: any): Promise<void> {
    console.log('✏️ Aktualisiere Kunden:', data.customerId);

    await supabaseService.updateCustomer(data.customerId, data.updates);

    // Kontext neu laden
    await this.loadSupabaseContext();
  }

  /**
   * Erstellt ein Angebot
   */
  private async createQuote(data: any): Promise<Quote> {
    console.log('📄 Erstelle Angebot:', data);

    const newQuote: Partial<Quote> = {
      customerId: data.customerId,
      price: data.price,
      volume: data.volume,
      distance: data.distance,
      comment: data.comment || '',
      createdAt: new Date(),
      status: 'draft'
    };

    const quoteId = await supabaseService.addQuote(newQuote as Quote);

    // Kontext neu laden
    await this.loadSupabaseContext();

    return {
      ...newQuote,
      id: quoteId
    } as Quote;
  }

  /**
   * Sucht nach Kunden
   */
  async searchCustomers(query: string): Promise<Customer[]> {
    if (!this.supabaseContext) {
      await this.loadSupabaseContext();
    }

    if (!this.supabaseContext) {
      return [];
    }

    const lowerQuery = query.toLowerCase();
    return this.supabaseContext.customers.filter(customer =>
      customer.name?.toLowerCase().includes(lowerQuery) ||
      customer.email?.toLowerCase().includes(lowerQuery) ||
      customer.phone?.includes(query)
    );
  }

  /**
   * Generiert eine Erfolgsnachricht nach einer Aktion
   */
  private async generateSuccessMessage(action: AIAction): Promise<string> {
    switch (action.type) {
      case 'create_customer':
        const customer = action.result as Customer;
        return `✅ Kunde erfolgreich angelegt!

📋 Details:
- Name: ${customer.name}
- Telefon: ${customer.phone || 'N/A'}
- E-Mail: ${customer.email || 'N/A'}
- Von: ${customer.fromAddress || 'N/A'}
- Nach: ${customer.toAddress || 'N/A'}
- Umzugsdatum: ${customer.movingDate || 'N/A'}
- Phase: ${customer.currentPhase || 'angerufen'}

Der Kunde wurde in der Datenbank gespeichert und ist jetzt in der Pipeline verfügbar.`;

      case 'update_customer':
        return `✅ Kunde erfolgreich aktualisiert!`;

      case 'create_quote':
        const quote = action.result as Quote;
        return `✅ Angebot erfolgreich erstellt!

📄 Angebot-Details:
- Preis: ${quote.price} €
- Volumen: ${quote.volume || 'N/A'} m³
- Entfernung: ${quote.distance || 'N/A'} km

Das Angebot wurde gespeichert.`;

      case 'read_file':
        return `✅ Datei gelesen!

📄 ${action.data.path}
Größe: ${action.result.size} Bytes

Inhalt wurde erfolgreich geladen.`;

      case 'write_file':
        return `✅ Datei geschrieben!

📝 ${action.data.path}

Die Datei wurde erfolgreich erstellt/aktualisiert.`;

      case 'edit_file':
        return `✅ Datei editiert!

✏️ ${action.data.path}
${action.result.replacements} Ersetzungen vorgenommen.

Die Änderungen wurden gespeichert.`;

      case 'create_component':
        return `✅ Komponente erstellt!

🎨 ${action.data.name}

Die React-Komponente wurde erfolgreich generiert und ist ready to use!`;

      case 'search_code':
        const results = action.result as any[];
        return `✅ Code-Suche abgeschlossen!

🔍 Pattern: "${action.data.pattern}"
📊 ${results.length} Treffer gefunden

Die Suchergebnisse sind verfügbar.`;

      case 'execute_command':
        return `✅ Command ausgeführt!

💻 ${action.data.command}

${action.result.stdout ? `Output:\n${action.result.stdout}` : 'Erfolgreich ausgeführt.'}`;

      case 'git_operation':
        return `✅ Git-Operation erfolgreich!

🔧 ${action.data.action}

${action.result.output || 'Erfolgreich ausgeführt.'}`;

      default:
        return '✅ Aktion erfolgreich ausgeführt!';
    }
  }

  /**
   * Analysiert einen Screenshot und extrahiert Kundeninformationen
   */
  async analyzeScreenshot(imageBase64: string): Promise<{
    customers: any[];
    insights: string;
    recommendations: string[];
  }> {
    const prompt = `Analysiere diesen Screenshot aus dem CRM-System.

Extrahiere:
1. Alle sichtbaren Kundeninformationen (Namen, Kontaktdaten, Status, etc.)
2. Erkannte Probleme oder Auffälligkeiten
3. Konkrete Handlungsempfehlungen

Gib die Antwort strukturiert zurück.`;

    const result = await this.chat(prompt, imageBase64);

    return {
      customers: [],
      insights: result.response,
      recommendations: this.extractRecommendations(result.response)
    };
  }

  /**
   * Führt eine Nachberechnung durch
   */
  async calculatePostMoveCosts(data: {
    originalQuote?: Quote;
    actualHours?: number;
    actualWorkers?: number;
    additionalServices?: string[];
    notes?: string;
  }): Promise<{
    originalCost: number;
    additionalCost: number;
    totalCost: number;
    breakdown: { item: string; cost: number }[];
    explanation: string;
  }> {
    const prompt = `Führe eine Nachberechnung für einen Umzug durch.

ORIGINAL-ANGEBOT:
${data.originalQuote ? JSON.stringify(data.originalQuote, null, 2) : 'Nicht vorhanden'}

TATSÄCHLICHE WERTE:
- Stunden: ${data.actualHours || 'N/A'}
- Mitarbeiter: ${data.actualWorkers || 'N/A'}
- Zusatzleistungen: ${data.additionalServices?.join(', ') || 'Keine'}
- Notizen: ${data.notes || 'Keine'}

Berechne:
1. Differenz zum Original-Angebot
2. Kosten für Zusatzleistungen
3. Gesamt-Nachberechnung
4. Detaillierte Aufschlüsselung

Gib eine präzise Kalkulation mit Begründung zurück.`;

    const result = await this.chat(prompt);

    return {
      originalCost: data.originalQuote?.price || 0,
      additionalCost: 0,
      totalCost: data.originalQuote?.price || 0,
      breakdown: [],
      explanation: result.response
    };
  }

  /**
   * Gibt Kontext-Informationen zu einem Kunden
   */
  async getCustomerContext(customerId: string): Promise<string> {
    if (!this.supabaseContext) {
      await this.loadSupabaseContext();
    }

    if (!this.supabaseContext) {
      return 'Kontext konnte nicht geladen werden.';
    }

    const customer = this.supabaseContext.customers.find(c => c.id === customerId);
    if (!customer) {
      return 'Kunde nicht gefunden.';
    }

    const quotes = this.supabaseContext.quotes.filter(q => q.customerId === customerId);
    const invoices = this.supabaseContext.invoices.filter(i => i.customerId === customerId);

    const prompt = `Gib mir eine Zusammenfassung zu diesem Kunden:

${JSON.stringify({
  customer,
  quotes,
  invoices
}, null, 2)}

Erstelle eine prägnante Übersicht mit:
- Status & Phase
- Offene Aufgaben
- Umsatz
- Besonderheiten
- Nächste Schritte`;

    const result = await this.chat(prompt);
    return result.response;
  }

  /**
   * Extrahiert Empfehlungen aus einem Text
   */
  private extractRecommendations(text: string): string[] {
    const recommendations: string[] = [];
    const lines = text.split('\n');

    lines.forEach(line => {
      if (
        line.includes('Empfehlung:') ||
        line.includes('Vorschlag:') ||
        line.includes('Tipp:') ||
        line.match(/^\d+\./)
      ) {
        recommendations.push(line.trim());
      }
    });

    return recommendations;
  }

  /**
   * NEUE: Chat mit Streaming-Support (für lange Antworten)
   */
  async chatStreaming(
    userMessage: string,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    try {
      await this.loadSupabaseContext();

      const systemPrompt = this.getSystemPrompt();
      const response = await this.claude.streamText(
        userMessage,
        systemPrompt,
        onChunk
      );

      this.chatHistory.push({
        role: 'user',
        content: userMessage
      });

      this.chatHistory.push({
        role: 'assistant',
        content: response
      });

      return response;

    } catch (error) {
      console.error('❌ Streaming error:', error);
      throw error;
    }
  }

  /**
   * Setzt den Chat zurück
   */
  resetChat(): void {
    this.chatHistory = [];
    this.clearCache();
  }

  /**
   * Gibt die Chat-Historie zurück
   */
  getChatHistory(): ChatMessage[] {
    return this.chatHistory;
  }

  /**
   * Gibt den aktuellen Kontext zurück
   */
  getContext(): SupabaseContext | null {
    return this.supabaseContext;
  }
}

// Singleton-Instanz
export const intelligentAssistant = new IntelligentAssistantService();
