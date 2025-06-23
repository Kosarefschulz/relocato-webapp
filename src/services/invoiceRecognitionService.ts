import { databaseService as googleSheetsService } from '../config/database.config';

export interface EmailInvoice {
  id: string;
  emailId: string;
  sender: string;
  subject: string;
  receivedDate: Date;
  attachments: EmailAttachment[];
  recognizedCompany?: 'steinpfleger' | 'wertvoll' | 'unknown';
  invoiceNumber?: string;
  amount?: number;
  processed: boolean;
  processedDate?: Date;
  notes?: string;
}

export interface EmailAttachment {
  filename: string;
  contentType: string;
  size: number;
  content?: string; // Base64 encoded content
}

export interface RecognitionRule {
  id: string;
  name: string;
  type: 'sender' | 'subject' | 'attachment';
  pattern: string; // Regex pattern
  targetAccount: 'steinpfleger' | 'wertvoll';
  priority: number;
  active: boolean;
}

// Default recognition rules
const DEFAULT_RULES: RecognitionRule[] = [
  {
    id: 'rule-1',
    name: 'Steinpfleger - Rechnungen von Lieferanten',
    type: 'sender',
    pattern: '.*@(bauhaus|obi|hornbach|hagebau|toom)\\.de$',
    targetAccount: 'steinpfleger',
    priority: 1,
    active: true
  },
  {
    id: 'rule-2',
    name: 'Steinpfleger - Materialrechnungen',
    type: 'subject',
    pattern: '.*(Rechnung|Invoice).*(Material|Baustoffe|Werkzeug).*',
    targetAccount: 'steinpfleger',
    priority: 2,
    active: true
  },
  {
    id: 'rule-3',
    name: 'Wertvoll - Umzugsrechnungen',
    type: 'subject',
    pattern: '.*(Rechnung|Invoice).*(Umzug|Transport|Spedition).*',
    targetAccount: 'wertvoll',
    priority: 1,
    active: true
  },
  {
    id: 'rule-4',
    name: 'Wertvoll - Personalkosten',
    type: 'subject',
    pattern: '.*(Lohn|Gehalt|Personal|Sozialversicherung).*',
    targetAccount: 'wertvoll',
    priority: 2,
    active: true
  },
  {
    id: 'rule-5',
    name: 'PDF Rechnungen',
    type: 'attachment',
    pattern: '.*\\.(pdf|PDF)$',
    targetAccount: 'wertvoll', // Default für PDFs
    priority: 10,
    active: true
  }
];

class InvoiceRecognitionService {
  private rules: RecognitionRule[] = [];
  private rulesLoaded = false;
  private emailInvoicesCache: EmailInvoice[] = [];
  private cacheLoaded = false;

  /**
   * Process an incoming email and recognize invoice details
   */
  async processEmail(email: {
    id: string;
    from: string;
    subject: string;
    body: string;
    receivedDate: Date;
    attachments: EmailAttachment[];
  }): Promise<EmailInvoice> {

    // Recognize company based on rules
    const recognizedCompany = this.recognizeCompany(email);
    
    // Extract invoice details from email
    const invoiceDetails = this.extractInvoiceDetails(email);

    const emailInvoice: EmailInvoice = {
      id: `inv-email-${Date.now()}`,
      emailId: email.id,
      sender: email.from,
      subject: email.subject,
      receivedDate: email.receivedDate,
      attachments: email.attachments,
      recognizedCompany,
      invoiceNumber: invoiceDetails.invoiceNumber,
      amount: invoiceDetails.amount,
      processed: false
    };

    // Save to database
    await this.saveEmailInvoice(emailInvoice);

    return emailInvoice;
  }

  /**
   * Recognize which company account the invoice belongs to
   */
  private recognizeCompany(email: {
    from: string;
    subject: string;
    attachments: EmailAttachment[];
  }): 'steinpfleger' | 'wertvoll' | 'unknown' {
    // Sort rules by priority
    const sortedRules = [...this.rules]
      .filter(rule => rule.active)
      .sort((a, b) => a.priority - b.priority);

    for (const rule of sortedRules) {
      let matches = false;

      switch (rule.type) {
        case 'sender':
          matches = new RegExp(rule.pattern, 'i').test(email.from);
          break;
        case 'subject':
          matches = new RegExp(rule.pattern, 'i').test(email.subject);
          break;
        case 'attachment':
          matches = email.attachments.some(att => 
            new RegExp(rule.pattern, 'i').test(att.filename)
          );
          break;
      }

      if (matches) {
        return rule.targetAccount;
      }
    }

    return 'unknown';
  }

  /**
   * Extract invoice details from email content
   */
  private extractInvoiceDetails(email: {
    subject: string;
    body: string;
  }): { invoiceNumber?: string; amount?: number } {
    const details: { invoiceNumber?: string; amount?: number } = {};

    // Extract invoice number
    const invoiceNumberPatterns = [
      /Rechnungsnummer\s*:?\s*([A-Z0-9\-\/]+)/i,
      /Invoice\s*#?\s*:?\s*([A-Z0-9\-\/]+)/i,
      /Rechnung\s*Nr\.?\s*:?\s*([A-Z0-9\-\/]+)/i,
      /RE\s*-?\s*([0-9]{4,})/i
    ];

    for (const pattern of invoiceNumberPatterns) {
      const match = email.subject.match(pattern) || email.body.match(pattern);
      if (match) {
        details.invoiceNumber = match[1];
        break;
      }
    }

    // Extract amount
    const amountPatterns = [
      /Gesamtbetrag\s*:?\s*€?\s*([0-9]+[,.]?[0-9]*)/i,
      /Total\s*:?\s*€?\s*([0-9]+[,.]?[0-9]*)/i,
      /Summe\s*:?\s*€?\s*([0-9]+[,.]?[0-9]*)/i,
      /€\s*([0-9]+[,.]?[0-9]*)\s*(?:EUR)?/i
    ];

    for (const pattern of amountPatterns) {
      const match = email.subject.match(pattern) || email.body.match(pattern);
      if (match) {
        details.amount = parseFloat(match[1].replace(',', '.'));
        break;
      }
    }

    return details;
  }

  /**
   * Load rules from Google Sheets on first access
   */
  private async ensureRulesLoaded(): Promise<void> {
    if (this.rulesLoaded) return;
    
    try {
      // Try to load from Google Sheets
      const savedRules = await googleSheetsService.getRecognitionRules();
      if (savedRules && savedRules.length > 0) {
        this.rules = savedRules;
      } else {
        // Initialize with default rules
        this.rules = [...DEFAULT_RULES];
        // Save default rules to Google Sheets
        for (const rule of this.rules) {
          await googleSheetsService.saveRecognitionRule(rule);
        }
      }
    } catch (error) {
      console.error('Error loading recognition rules:', error);
      // Fallback to default rules
      this.rules = [...DEFAULT_RULES];
    }
    
    this.rulesLoaded = true;
  }

  /**
   * Get all recognition rules
   */
  async getRules(): Promise<RecognitionRule[]> {
    await this.ensureRulesLoaded();
    return [...this.rules];
  }

  /**
   * Add a new recognition rule
   */
  async addRule(rule: Omit<RecognitionRule, 'id'>): Promise<RecognitionRule> {
    await this.ensureRulesLoaded();
    
    const newRule: RecognitionRule = {
      ...rule,
      id: `rule-${Date.now()}`
    };
    
    // Save to Google Sheets
    await googleSheetsService.saveRecognitionRule(newRule);
    
    this.rules.push(newRule);
    return newRule;
  }

  /**
   * Update an existing rule
   */
  async updateRule(id: string, updates: Partial<RecognitionRule>): Promise<RecognitionRule | null> {
    await this.ensureRulesLoaded();
    
    const index = this.rules.findIndex(r => r.id === id);
    if (index === -1) return null;

    this.rules[index] = { ...this.rules[index], ...updates };
    
    // Update in Google Sheets
    await googleSheetsService.updateRecognitionRule(id, this.rules[index]);
    
    return this.rules[index];
  }

  /**
   * Delete a rule
   */
  async deleteRule(id: string): Promise<boolean> {
    await this.ensureRulesLoaded();
    
    const index = this.rules.findIndex(r => r.id === id);
    if (index === -1) return false;

    // Delete from Google Sheets
    await googleSheetsService.deleteRecognitionRule(id);
    
    this.rules.splice(index, 1);
    return true;
  }

  /**
   * Get unprocessed email invoices
   */
  async getUnprocessedInvoices(): Promise<EmailInvoice[]> {
    if (!this.cacheLoaded) {
      try {
        const allInvoices = await googleSheetsService.getEmailInvoices();
        this.emailInvoicesCache = allInvoices || [];
        this.cacheLoaded = true;
      } catch (error) {
        console.error('Error loading email invoices:', error);
        return [];
      }
    }
    
    return this.emailInvoicesCache.filter(inv => !inv.processed);
  }

  /**
   * Mark an email invoice as processed
   */
  async markAsProcessed(emailInvoiceId: string, notes?: string): Promise<void> {
    const invoice = this.emailInvoicesCache.find(inv => inv.id === emailInvoiceId);
    if (!invoice) return;
    
    invoice.processed = true;
    invoice.processedDate = new Date();
    if (notes) invoice.notes = notes;
    
    // Update in Google Sheets
    await googleSheetsService.updateEmailInvoice(emailInvoiceId, invoice);
  }

  /**
   * Save email invoice to database
   */
  private async saveEmailInvoice(emailInvoice: EmailInvoice): Promise<void> {
    // Save to Google Sheets
    await googleSheetsService.saveEmailInvoice(emailInvoice);
    
    // Add to cache
    this.emailInvoicesCache.push(emailInvoice);
  }

  /**
   * Get statistics about processed invoices
   */
  async getStatistics(): Promise<{
    total: number;
    processed: number;
    unprocessed: number;
    byAccount: {
      steinpfleger: number;
      wertvoll: number;
      unknown: number;
    };
  }> {
    if (!this.cacheLoaded) {
      await this.getUnprocessedInvoices(); // This loads the cache
    }
    
    const stats = {
      total: this.emailInvoicesCache.length,
      processed: 0,
      unprocessed: 0,
      byAccount: {
        steinpfleger: 0,
        wertvoll: 0,
        unknown: 0
      }
    };
    
    for (const invoice of this.emailInvoicesCache) {
      if (invoice.processed) {
        stats.processed++;
      } else {
        stats.unprocessed++;
      }
      
      const company = invoice.recognizedCompany || 'unknown';
      stats.byAccount[company]++;
    }
    
    return stats;
  }
}

export const invoiceRecognitionService = new InvoiceRecognitionService();