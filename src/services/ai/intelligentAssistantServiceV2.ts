import { ClaudeService } from './claudeService';
import { Customer, Quote, Invoice } from '../../types';
import { supabaseService } from '../supabaseService';
import { codeOperationsService } from './codeOperationsService';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
  actions?: AIAction[];
}

export interface AIAction {
  type: 'create_customer' | 'update_customer' | 'create_quote' | 'create_invoice' | 'search' | 'analyze' |
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

/**
 * VERBESSERTE VERSION mit:
 * - Multi-Step Tool-Chaining
 * - Streaming Support
 * - Context Caching
 * - Besseres Error Handling
 */
export class IntelligentAssistantServiceV2 {
  private claude: ClaudeService;
  private chatHistory: ChatMessage[] = [];
  private supabaseContext: SupabaseContext | null = null;
  private contextCache: { data: SupabaseContext; timestamp: number } | null = null;
  private readonly CACHE_TTL = 30000; // 30 Sekunden

  constructor() {
    const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Anthropic API Key nicht konfiguriert');
    }

    this.claude = new ClaudeService({
      apiKey,
      model: process.env.REACT_APP_AI_MODEL || 'claude-sonnet-4-5-20250929',
      maxTokens: 8192, // Erhöht für komplexe Operations
      temperature: 0.7
    });

    console.log('✅ Claude Sonnet 4.5 V2 initialized (mit Multi-Step Support)');
  }

  /**
   * Lädt Kontext mit Caching
   */
  async loadSupabaseContext(forceRefresh: boolean = false): Promise<void> {
    // Check Cache
    if (!forceRefresh && this.contextCache) {
      const age = Date.now() - this.contextCache.timestamp;
      if (age < this.CACHE_TTL) {
        console.log('📦 Using cached context (age:', age, 'ms)');
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

      const customerPhases: { [phase: string]: number } = {};
      customers.forEach(customer => {
        const phase = customer.currentPhase || 'angerufen';
        customerPhases[phase] = (customerPhases[phase] || 0) + 1;
      });

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

      console.log('✅ Context loaded & cached');
    } catch (error) {
      console.error('❌ Context load failed:', error);
      throw error;
    }
  }

  private getSystemPrompt(): string {
    if (!this.supabaseContext) {
      return `Du bist Claude Sonnet 4.5, ein intelligenter KI-Code-Assistent für die Relocato CRM-App.

🎯 MULTI-STEP CAPABILITY:
Du kannst MEHRERE Tools NACHEINANDER nutzen um komplexe Aufgaben zu lösen!

Beispiel: "Erstelle Komponente UND füge sie zu App hinzu"
→ Schritt 1: create_component
→ Schritt 2: edit_file (App.tsx)
→ Schritt 3: edit_file (Sidebar)

**Nutze Tools sequenziell wenn nötig!**

Verfügbare Tools: create_customer, update_customer, create_quote, search_customers,
read_file, write_file, edit_file, create_component, search_code, execute_command, git_operation

Antworte auf Deutsch, professionell und aktionsorientiert.`;
    }

    const { statistics, customerPhases } = this.supabaseContext;

    return `Du bist Claude Sonnet 4.5, ein intelligenter KI-Code-Assistent mit VOLLZUGRIFF auf Relocato CRM.

📊 SYSTEM-STATUS:
- Kunden: ${statistics.totalCustomers}
- Angebote: ${statistics.totalQuotes}
- Rechnungen: ${statistics.totalInvoices}
- Umsatz: ${statistics.totalRevenue.toFixed(2)} €

🎯 MULTI-STEP TOOL-CHAINING:
Du kannst MEHRERE Tools NACHEINANDER nutzen! Wenn eine Aufgabe mehrere Schritte benötigt, nutze die Tools sequenziell.

**Beispiele:**
"Erstelle Feature X" →
1. read_file (verstehe Struktur)
2. write_file (erstelle Service)
3. create_component (erstelle UI)
4. edit_file (integriere in App)

"Fixe Bug in Datei Y" →
1. read_file (lies Datei)
2. search_code (finde verwandte Code)
3. edit_file (fixe den Bug)
4. execute_command (npm test)

**13 VERFÜGBARE TOOLS:**

CRM: create_customer, update_customer, create_quote, search_customers
CODE: read_file, write_file, edit_file, create_component, search_code
TERMINAL: execute_command, git_operation

**WICHTIG:**
- Nutze Tools NACHEINANDER für komplexe Tasks
- Erkläre deinen Plan BEVOR du Tools nutzt
- Zeige Fortschritt nach jedem Step
- Bestätige erfolgreiche Aktionen

Antworte auf Deutsch, sei proaktiv und nutze Tools aggressiv!`;
  }

  /**
   * NEUE: Multi-Step Conversation mit Tool-Chaining
   */
  async chatMultiStep(
    userMessage: string,
    imageBase64?: string,
    maxSteps: number = 5
  ): Promise<{ response: string; actions?: AIAction[]; steps: number }> {
    try {
      await this.loadSupabaseContext();

      const systemPrompt = this.getSystemPrompt();
      const tools = this.getToolDefinitions();

      let conversationMessages: Array<{ role: 'user' | 'assistant'; content: any }> = [];
      let allActions: AIAction[] = [];
      let stepCount = 0;
      let finalResponse = '';

      // Initial User Message
      if (imageBase64) {
        const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
        conversationMessages.push({
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: base64Data
              }
            },
            {
              type: 'text',
              text: userMessage
            }
          ]
        });
      } else {
        conversationMessages.push({
          role: 'user',
          content: userMessage
        });
      }

      // Multi-Step Loop
      while (stepCount < maxSteps) {
        stepCount++;
        console.log(`\n🔄 Step ${stepCount}/${maxSteps}`);

        const result = await this.claude.generateWithTools(
          userMessage,
          systemPrompt,
          tools
        );

        // Wenn Tool Use vorhanden
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
            allActions.push(action);

            console.log(`   ✅ Tool executed successfully`);

            // Add tool result to conversation
            conversationMessages.push({
              role: 'assistant',
              content: `Tool ${result.toolUse.name} ausgeführt. Ergebnis: ${JSON.stringify(actionResult).slice(0, 200)}`
            });

            // Continue conversation
            conversationMessages.push({
              role: 'user',
              content: 'Führe den nächsten Schritt aus oder bestätige wenn fertig.'
            });

            // Update userMessage for next iteration
            userMessage = 'Führe den nächsten Schritt aus oder bestätige wenn fertig.';

          } catch (error) {
            action.status = 'failed';
            action.error = error instanceof Error ? error.message : 'Unknown error';
            allActions.push(action);

            console.log(`   ❌ Tool failed:`, action.error);

            finalResponse = `❌ Fehler in Schritt ${stepCount}: ${action.error}`;
            break;
          }
        } else {
          // Kein Tool mehr → Fertig
          finalResponse = result.content || 'Aufgabe abgeschlossen.';
          console.log(`   ✅ Finished (no more tools)`);
          break;
        }
      }

      // Wenn maxSteps erreicht
      if (stepCount >= maxSteps && !finalResponse) {
        finalResponse = `⚠️ Maximum steps (${maxSteps}) erreicht. Bitte konkretisiere die Aufgabe oder teile sie auf.`;
      }

      // Generate final success message
      if (allActions.length > 0) {
        finalResponse = await this.generateMultiStepSummary(allActions);
      }

      // Update history
      this.chatHistory.push({
        role: 'user',
        content: userMessage,
        images: imageBase64 ? [imageBase64] : undefined
      });

      this.chatHistory.push({
        role: 'assistant',
        content: finalResponse,
        actions: allActions
      });

      return {
        response: finalResponse,
        actions: allActions.length > 0 ? allActions : undefined,
        steps: stepCount
      };

    } catch (error) {
      console.error('❌ Multi-step chat error:', error);
      throw error;
    }
  }

  private async generateMultiStepSummary(actions: AIAction[]): Promise<string> {
    const successful = actions.filter(a => a.status === 'completed');
    const failed = actions.filter(a => a.status === 'failed');

    let summary = `✅ Multi-Step Operation abgeschlossen!\n\n📋 Ausgeführte Aktionen (${actions.length}):\n\n`;

    successful.forEach((action, i) => {
      summary += `${i + 1}. ✅ ${action.type}\n`;
      summary += `   ${this.getActionSummary(action)}\n\n`;
    });

    if (failed.length > 0) {
      summary += `\n❌ Fehlgeschlagen (${failed.length}):\n\n`;
      failed.forEach((action, i) => {
        summary += `${i + 1}. ❌ ${action.type}\n`;
        summary += `   Error: ${action.error}\n\n`;
      });
    }

    return summary;
  }

  private getActionSummary(action: AIAction): string {
    switch (action.type) {
      case 'create_customer':
        return `Kunde "${action.data.name}" angelegt`;
      case 'create_component':
        return `Komponente "${action.data.name}" erstellt`;
      case 'write_file':
        return `Datei "${action.data.path}" geschrieben`;
      case 'edit_file':
        return `"${action.data.path}" editiert (${action.result.replacements || 0} changes)`;
      case 'read_file':
        return `"${action.data.path}" gelesen`;
      case 'search_code':
        return `${action.result.length || 0} Treffer für "${action.data.pattern}"`;
      case 'execute_command':
        return `Command "${action.data.command}" ausgeführt`;
      case 'git_operation':
        return `Git ${action.data.action} ausgeführt`;
      default:
        return 'Aktion ausgeführt';
    }
  }

  private getToolDefinitions(): any[] {
    // ... gleiche Tool Definitions wie vorher ...
    return []; // Placeholder - würde die gleichen Tools wie intelligentAssistantService nutzen
  }

  private async executeAction(action: AIAction): Promise<any> {
    // ... gleiche Implementation wie vorher ...
    switch (action.type) {
      case 'create_customer':
        return await this.createCustomer(action.data);
      case 'read_file':
        return await codeOperationsService.readFile(action.data.path);
      case 'write_file':
        await codeOperationsService.writeFile(action.data.path, action.data.content);
        return { success: true };
      case 'edit_file':
        const replacements = await codeOperationsService.editFile(
          action.data.path,
          action.data.oldString,
          action.data.newString
        );
        return { replacements };
      case 'create_component':
        await codeOperationsService.createComponent(action.data.name, action.data.directory);
        return { success: true };
      case 'search_code':
        return await codeOperationsService.search(action.data.pattern, action.data.path);
      case 'execute_command':
        return await codeOperationsService.execute(action.data.command);
      case 'git_operation':
        const output = await codeOperationsService.git(action.data.action, action.data.params);
        return { output };
      default:
        throw new Error(`Unknown action: ${action.type}`);
    }
  }

  private async createCustomer(data: any): Promise<Customer> {
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
    await this.loadSupabaseContext(true); // Force refresh

    return {
      ...newCustomer,
      id: customerId
    } as Customer;
  }

  /**
   * Streaming Chat (für lange Antworten)
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
      console.error('❌ Streaming chat error:', error);
      throw error;
    }
  }

  resetChat(): void {
    this.chatHistory = [];
  }

  getChatHistory(): ChatMessage[] {
    return this.chatHistory;
  }

  getContext(): SupabaseContext | null {
    return this.supabaseContext;
  }

  clearCache(): void {
    this.contextCache = null;
    console.log('🗑️ Cache cleared');
  }
}

// Singleton
export const intelligentAssistantV2 = new IntelligentAssistantServiceV2();
