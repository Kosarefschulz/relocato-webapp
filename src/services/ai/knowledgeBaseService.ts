/**
 * Knowledge Base Service
 * Lädt und managed alle Wissens-Dokumente für die KI
 */

export interface KnowledgeBase {
  pricing: string;
  faqCustomers: string;
  emailTemplates: string;
  phoneScripts: string;
  processWorkflows: string;
  fullKnowledge: string; // Alle kombiniert
}

export class KnowledgeBaseService {
  private knowledge: KnowledgeBase | null = null;
  private loadedAt: number | null = null;
  private readonly CACHE_TTL = 3600000; // 1 Stunde

  /**
   * Lädt alle Knowledge Base Dateien
   */
  async loadKnowledgeBase(): Promise<KnowledgeBase> {
    // Check Cache
    if (this.knowledge && this.loadedAt) {
      const age = Date.now() - this.loadedAt;
      if (age < this.CACHE_TTL) {
        console.log(`📚 Using cached knowledge base (${Math.round(age / 60000)} min old)`);
        return this.knowledge;
      }
    }

    console.log('📚 Loading knowledge base...');

    try {
      // In Production würden wir die Dateien via fetch laden
      // Für jetzt: Direkte Imports (mit raw-loader oder als string)

      this.knowledge = {
        pricing: await this.loadFile('pricing-guide.md'),
        faqCustomers: await this.loadFile('faq-customers.md'),
        emailTemplates: await this.loadFile('email-templates.md'),
        phoneScripts: await this.loadFile('phone-scripts.md'),
        processWorkflows: await this.loadFile('process-workflows.md'),
        fullKnowledge: '' // Wird unten befüllt
      };

      // Kombiniere alles zu einem großen Knowledge String
      this.knowledge.fullKnowledge = this.combineKnowledge(this.knowledge);

      this.loadedAt = Date.now();

      console.log('✅ Knowledge base loaded:', {
        pricing: this.knowledge.pricing.length,
        faq: this.knowledge.faqCustomers.length,
        emails: this.knowledge.emailTemplates.length,
        phone: this.knowledge.phoneScripts.length,
        workflows: this.knowledge.processWorkflows.length,
        total: this.knowledge.fullKnowledge.length
      });

      return this.knowledge;

    } catch (error) {
      console.error('❌ Failed to load knowledge base:', error);
      throw error;
    }
  }

  /**
   * Lädt eine einzelne Knowledge-Datei
   */
  private async loadFile(fileName: string): Promise<string> {
    try {
      // In Production: fetch vom Server
      const response = await fetch(`/knowledge-base/${fileName}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.warn(`⚠️ Could not load ${fileName}, using empty string`);
      return '';
    }
  }

  /**
   * Kombiniert alle Knowledge-Dokumente zu einem String
   */
  private combineKnowledge(kb: Partial<KnowledgeBase>): string {
    let combined = `
# 📚 RELOCATO WISSENSDATENBANK

Die folgende Wissensdatenbank enthält ALLE Informationen die du brauchst
um Bürokräften und dem Management bei ihrer täglichen Arbeit zu helfen.

NUTZE DIESES WISSEN um:
- Kundenfragen zu beantworten
- Preise zu berechnen
- E-Mails zu schreiben
- Prozesse zu verstehen
- Probleme zu lösen

═══════════════════════════════════════════════════════════════════

`;

    if (kb.pricing) {
      combined += kb.pricing + '\n\n═══════════════════════════════════════════════════════════════════\n\n';
    }

    if (kb.faqCustomers) {
      combined += kb.faqCustomers + '\n\n═══════════════════════════════════════════════════════════════════\n\n';
    }

    if (kb.emailTemplates) {
      combined += kb.emailTemplates + '\n\n═══════════════════════════════════════════════════════════════════\n\n';
    }

    if (kb.phoneScripts) {
      combined += kb.phoneScripts + '\n\n═══════════════════════════════════════════════════════════════════\n\n';
    }

    if (kb.processWorkflows) {
      combined += kb.processWorkflows + '\n\n═══════════════════════════════════════════════════════════════════\n\n';
    }

    combined += `
═══════════════════════════════════════════════════════════════════

🎯 WICHTIGSTE INFORMATIONEN ZUSAMMENGEFASST:

PREISE (Standard):
- 1-Zimmer (10m³): 749€
- 2-Zimmer (15m³): 899€
- 3-Zimmer (25m³): 1.099€
- 4-Zimmer (35m³): 1.699€

ZUSCHLÄGE:
- Pro Stockwerk ohne Aufzug: 50€
- Pro km über 50km: 1,20€
- Klaviertransport: 150€
- Halteverbotszone: 80€

RABATTE:
- Frühbucher (≥4 Wochen): 5%

HÄUFIGSTE ANFRAGEN:
1. Preis-Anfrage → Angebot erstellen
2. Terminanfrage → Kalender checken
3. Follow-Up → Phase aktualisieren

PROZESS:
Anruf → Angebot → Follow-Up → Besichtigung? → Auftrag → Umzug → Rechnung → Bewertung → Archiv

8 PHASEN:
angerufen → nachfassen → angebot_erstellt → besichtigung_geplant → durchfuehrung → rechnung → bewertung → archiviert

═══════════════════════════════════════════════════════════════════
`;

    return combined;
  }

  /**
   * Gibt die vollständige Knowledge Base zurück
   */
  getFullKnowledge(): string {
    return this.knowledge?.fullKnowledge || '';
  }

  /**
   * Sucht in der Knowledge Base
   */
  search(query: string): string[] {
    if (!this.knowledge) {
      return [];
    }

    const results: string[] = [];
    const lowerQuery = query.toLowerCase();

    // Durchsuche alle Dokumente
    Object.entries(this.knowledge).forEach(([key, content]) => {
      if (key === 'fullKnowledge') return; // Skip combined

      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(lowerQuery)) {
          results.push(`[${key}:${index}] ${line.trim()}`);
        }
      });
    });

    return results;
  }

  /**
   * Gibt spezifisches Wissen zurück
   */
  getPricingInfo(): string {
    return this.knowledge?.pricing || '';
  }

  getFAQs(): string {
    return this.knowledge?.faqCustomers || '';
  }

  getEmailTemplates(): string {
    return this.knowledge?.emailTemplates || '';
  }

  getPhoneScripts(): string {
    return this.knowledge?.phoneScripts || '';
  }

  getWorkflows(): string {
    return this.knowledge?.processWorkflows || '';
  }

  /**
   * Invalidate Cache
   */
  clearCache(): void {
    this.knowledge = null;
    this.loadedAt = null;
    console.log('🗑️ Knowledge base cache cleared');
  }
}

// Singleton
export const knowledgeBaseService = new KnowledgeBaseService();
