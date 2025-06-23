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
  private rules: RecognitionRule[] = [...DEFAULT_RULES];

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
    console.log('📧 Processing email for invoice recognition:', email.subject);

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
        console.log(`✅ Matched rule: ${rule.name} -> ${rule.targetAccount}`);
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
   * Get all recognition rules
   */
  getRules(): RecognitionRule[] {
    return [...this.rules];
  }

  /**
   * Add a new recognition rule
   */
  addRule(rule: Omit<RecognitionRule, 'id'>): RecognitionRule {
    const newRule: RecognitionRule = {
      ...rule,
      id: `rule-${Date.now()}`
    };
    this.rules.push(newRule);
    return newRule;
  }

  /**
   * Update an existing rule
   */
  updateRule(id: string, updates: Partial<RecognitionRule>): RecognitionRule | null {
    const index = this.rules.findIndex(r => r.id === id);
    if (index === -1) return null;

    this.rules[index] = { ...this.rules[index], ...updates };
    return this.rules[index];
  }

  /**
   * Delete a rule
   */
  deleteRule(id: string): boolean {
    const index = this.rules.findIndex(r => r.id === id);
    if (index === -1) return false;

    this.rules.splice(index, 1);
    return true;
  }

  /**
   * Get unprocessed email invoices
   */
  async getUnprocessedInvoices(): Promise<EmailInvoice[]> {
    // In a real implementation, this would fetch from a database
    // For now, return empty array
    return [];
  }

  /**
   * Mark an email invoice as processed
   */
  async markAsProcessed(emailInvoiceId: string, notes?: string): Promise<void> {
    // In a real implementation, this would update the database
    console.log(`📋 Marking email invoice ${emailInvoiceId} as processed`);
  }

  /**
   * Save email invoice to database
   */
  private async saveEmailInvoice(emailInvoice: EmailInvoice): Promise<void> {
    // In a real implementation, this would save to database
    console.log('💾 Saving email invoice:', emailInvoice);
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
    // In a real implementation, this would query the database
    return {
      total: 0,
      processed: 0,
      unprocessed: 0,
      byAccount: {
        steinpfleger: 0,
        wertvoll: 0,
        unknown: 0
      }
    };
  }
}

export const invoiceRecognitionService = new InvoiceRecognitionService();