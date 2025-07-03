// Email Template Service Stub - Firebase disabled
// This provides empty implementations for backward compatibility

export interface EmailTemplate {
  id?: string;
  name: string;
  subject: string;
  content: string;
  description?: string;
  type: 'quote' | 'invoice' | 'followup' | 'general' | 'reminder' | 'confirmation' | 'follow_up' | 'welcome' | 'custom';
  category: 'quote' | 'invoice' | 'followup' | 'general' | 'reminder' | 'confirmation' | 'follow_up' | 'welcome' | 'custom';
  variables: string[];
  isDefault: boolean;
  isSystem: boolean;
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt?: Date;
}

class EmailTemplateService {
  private logDisabled(operation: string) {
    console.log(`⚠️ Email template operation "${operation}" called but Firebase is disabled - templates not available`);
  }

  async getAllTemplates(): Promise<EmailTemplate[]> {
    this.logDisabled('getAllTemplates');
    // Return some default templates for basic functionality
    return [
      {
        id: 'default-quote',
        name: 'Standard Quote Template',
        subject: 'Ihr Umzugsangebot',
        content: 'Vielen Dank für Ihre Anfrage. Anbei finden Sie Ihr Angebot.',
        description: 'Standard template for quote emails',
        type: 'quote',
        category: 'quote',
        variables: ['customerName', 'price'],
        isDefault: true,
        isSystem: true,
        isActive: true,
        createdAt: new Date()
      }
    ];
  }

  async getTemplatesByType(type: string): Promise<EmailTemplate[]> {
    this.logDisabled('getTemplatesByType');
    const allTemplates = await this.getAllTemplates();
    return allTemplates.filter(t => t.type === type);
  }

  async getTemplate(id: string): Promise<EmailTemplate | null> {
    this.logDisabled('getTemplate');
    const templates = await this.getAllTemplates();
    return templates.find(t => t.id === id) || null;
  }

  async createTemplate(template: Partial<EmailTemplate> & { name: string; subject: string; content: string; category: EmailTemplate['category'] }): Promise<string> {
    this.logDisabled('createTemplate');
    console.log('📝 Would create template:', template.name);
    return 'stub-template-id';
  }

  async updateTemplate(id: string, updates: Partial<EmailTemplate>): Promise<void> {
    this.logDisabled('updateTemplate');
    console.log('📝 Would update template:', id);
  }

  async deleteTemplate(id: string): Promise<void> {
    this.logDisabled('deleteTemplate');
    console.log('📝 Would delete template:', id);
  }

  async getDefaultTemplate(type: string): Promise<EmailTemplate | null> {
    this.logDisabled('getDefaultTemplate');
    const templates = await this.getTemplatesByType(type);
    return templates.find(t => t.isDefault) || null;
  }

  async setDefaultTemplate(id: string, type: string): Promise<void> {
    this.logDisabled('setDefaultTemplate');
    console.log('📝 Would set default template:', id, 'for type:', type);
  }

  // Template variable processing
  processTemplate(template: EmailTemplate, variables: Record<string, any>): { subject: string; content: string } {
    let processedSubject = template.subject;
    let processedContent = template.content;

    // Simple variable replacement
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      processedSubject = processedSubject.replace(new RegExp(placeholder, 'g'), String(value));
      processedContent = processedContent.replace(new RegExp(placeholder, 'g'), String(value));
    });

    return {
      subject: processedSubject,
      content: processedContent
    };
  }

  extractVariables(text: string): string[] {
    const matches = text.match(/\{\{([^}]+)\}\}/g);
    if (!matches) return [];
    return matches.map(match => match.replace(/[{}]/g, ''));
  }

  async initializeDefaultTemplates(): Promise<void> {
    this.logDisabled('initializeDefaultTemplates');
    console.log('📝 Would initialize default email templates');
  }

  async duplicateTemplate(id: string, newName: string): Promise<string> {
    this.logDisabled('duplicateTemplate');
    console.log('📝 Would duplicate template:', id, 'with name:', newName);
    return 'stub-duplicated-template-id';
  }

  validateTemplate(template: Partial<EmailTemplate>): string[] {
    const errors: string[] = [];
    
    if (!template.name?.trim()) {
      errors.push('Name ist erforderlich');
    }
    
    if (!template.subject?.trim()) {
      errors.push('Betreff ist erforderlich');
    }
    
    if (!template.content?.trim()) {
      errors.push('Inhalt ist erforderlich');
    }
    
    if (!template.category) {
      errors.push('Kategorie ist erforderlich');
    }
    
    return errors;
  }

  replaceVariables(text: string, variables: Record<string, any>): string {
    let result = text;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    });
    
    return result;
  }
}

// Available variables for email templates
export const AVAILABLE_VARIABLES = [
  { key: 'customerName', description: 'Name des Kunden', example: 'Max Mustermann' },
  { key: 'customerEmail', description: 'E-Mail des Kunden', example: 'max@example.com' },
  { key: 'customerPhone', description: 'Telefonnummer des Kunden', example: '+49 123 456789' },
  { key: 'customerAddress', description: 'Adresse des Kunden', example: 'Musterstraße 123, 12345 Berlin' },
  { key: 'quotePrice', description: 'Angebotspreis', example: '€ 1.250,00' },
  { key: 'quoteId', description: 'Angebots-ID', example: 'AN-2024-001' },
  { key: 'quoteDate', description: 'Angebotsdatum', example: '15.03.2024' },
  { key: 'movingDate', description: 'Umzugsdatum', example: '20.03.2024' },
  { key: 'invoiceNumber', description: 'Rechnungsnummer', example: 'RE-2024-001' },
  { key: 'invoiceDate', description: 'Rechnungsdatum', example: '25.03.2024' },
  { key: 'totalAmount', description: 'Gesamtbetrag', example: '€ 1.487,50' },
  { key: 'dueDate', description: 'Fälligkeitsdatum', example: '08.04.2024' },
  { key: 'companyName', description: 'Firmenname', example: 'Umzüge GmbH' },
  { key: 'companyPhone', description: 'Firmentelefon', example: '+49 30 123456' },
  { key: 'companyEmail', description: 'Firmen-E-Mail', example: 'info@umzuege.de' },
  { key: 'companyAddress', description: 'Firmenadresse', example: 'Hauptstraße 1, 10115 Berlin' }
];

const emailTemplateService = new EmailTemplateService();
export default emailTemplateService;