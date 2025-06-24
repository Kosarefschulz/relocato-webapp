import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore';

export interface EmailTemplate {
  id?: string;
  name: string;
  subject: string;
  content: string;
  category: 'quote' | 'invoice' | 'follow_up' | 'reminder' | 'confirmation' | 'welcome' | 'custom';
  variables: string[]; // e.g., ['customerName', 'moveDate', 'price']
  isActive: boolean;
  isSystem: boolean; // System templates can't be deleted
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  description?: string;
  attachmentTypes?: string[]; // e.g., ['quote_pdf', 'invoice_pdf', 'terms']
}

export interface EmailVariable {
  key: string;
  label: string;
  description: string;
  example: string;
  required: boolean;
}

// Verfügbare Variablen für E-Mail-Vorlagen
export const AVAILABLE_VARIABLES: EmailVariable[] = [
  {
    key: '{{customerName}}',
    label: 'Kundenname',
    description: 'Der vollständige Name des Kunden',
    example: 'Max Mustermann',
    required: true
  },
  {
    key: '{{customerEmail}}',
    label: 'Kunden E-Mail',
    description: 'Die E-Mail-Adresse des Kunden',
    example: 'max@example.com',
    required: false
  },
  {
    key: '{{customerPhone}}',
    label: 'Kunden Telefon',
    description: 'Die Telefonnummer des Kunden',
    example: '+49 123 456789',
    required: false
  },
  {
    key: '{{moveDate}}',
    label: 'Umzugsdatum',
    description: 'Das geplante Datum des Umzugs',
    example: '15.02.2025',
    required: false
  },
  {
    key: '{{fromAddress}}',
    label: 'Von Adresse',
    description: 'Die aktuelle Adresse des Kunden',
    example: 'Musterstraße 1, 12345 Musterstadt',
    required: false
  },
  {
    key: '{{toAddress}}',
    label: 'Nach Adresse',
    description: 'Die neue Adresse des Kunden',
    example: 'Beispielweg 2, 54321 Beispielstadt',
    required: false
  },
  {
    key: '{{quoteNumber}}',
    label: 'Angebotsnummer',
    description: 'Die eindeutige Angebotsnummer',
    example: 'A-2025-001',
    required: false
  },
  {
    key: '{{quotePrice}}',
    label: 'Angebotspreis',
    description: 'Der Gesamtpreis des Angebots',
    example: '€ 1.250,00',
    required: false
  },
  {
    key: '{{invoiceNumber}}',
    label: 'Rechnungsnummer',
    description: 'Die eindeutige Rechnungsnummer',
    example: 'R-2025-001',
    required: false
  },
  {
    key: '{{currentDate}}',
    label: 'Aktuelles Datum',
    description: 'Das heutige Datum',
    example: '16.01.2025',
    required: false
  },
  {
    key: '{{companyName}}',
    label: 'Firmenname',
    description: 'Der Name Ihrer Firma',
    example: 'RELOCATO® Bielefeld',
    required: false
  },
  {
    key: '{{companyPhone}}',
    label: 'Firmen Telefon',
    description: 'Die Telefonnummer Ihrer Firma',
    example: '(0521) 1200551-0',
    required: false
  },
  {
    key: '{{companyEmail}}',
    label: 'Firmen E-Mail',
    description: 'Die E-Mail-Adresse Ihrer Firma',
    example: 'bielefeld@relocato.de',
    required: false
  },
  {
    key: '{{employeeName}}',
    label: 'Mitarbeitername',
    description: 'Der Name des zuständigen Mitarbeiters',
    example: 'Thomas Schmidt',
    required: false
  },
  {
    key: '{{quoteValidUntil}}',
    label: 'Angebot gültig bis',
    description: 'Das Ablaufdatum des Angebots',
    example: '30.01.2025',
    required: false
  },
  {
    key: '{{confirmationUrl}}',
    label: 'Bestätigungs-URL',
    description: 'Der Link zur Online-Angebotsbestätigung',
    example: 'https://app.relocato.de/quote-confirmation/abc123',
    required: false
  }
];

// Standard-E-Mail-Vorlagen
const DEFAULT_TEMPLATES: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Angebot versenden',
    subject: 'Ihr Umzugsangebot von {{companyName}}',
    content: `Sehr geehrte/r {{customerName}},

vielen Dank für Ihre Anfrage. Anbei erhalten Sie Ihr persönliches Umzugsangebot.

**Details Ihres Umzugs:**
- Umzugsdatum: {{moveDate}}
- Von: {{fromAddress}}
- Nach: {{toAddress}}
- Gesamtpreis: {{quotePrice}}

**Online-Bestätigung:**
Sie können Ihr Angebot bequem online einsehen und bestätigen:
{{confirmationUrl}}

Ihr Angebot ist gültig bis: {{quoteValidUntil}}

Bei Fragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen
{{employeeName}}
{{companyName}}

Tel: {{companyPhone}}
E-Mail: {{companyEmail}}`,
    category: 'quote',
    variables: ['customerName', 'moveDate', 'fromAddress', 'toAddress', 'quotePrice', 'confirmationUrl', 'quoteValidUntil', 'employeeName', 'companyName', 'companyPhone', 'companyEmail'],
    isActive: true,
    isSystem: true,
    createdBy: 'system',
    description: 'Standard-Vorlage für den Versand von Umzugsangeboten',
    attachmentTypes: ['quote_pdf']
  },
  {
    name: 'Rechnung versenden',
    subject: 'Ihre Rechnung von {{companyName}} - {{invoiceNumber}}',
    content: `Sehr geehrte/r {{customerName}},

anbei erhalten Sie Ihre Rechnung für den durchgeführten Umzug.

**Rechnungsdetails:**
- Rechnungsnummer: {{invoiceNumber}}
- Rechnungsdatum: {{currentDate}}
- Gesamtbetrag: {{quotePrice}}

Bitte überweisen Sie den Betrag innerhalb von 14 Tagen auf unser Konto.

Vielen Dank für Ihr Vertrauen!

Mit freundlichen Grüßen
{{companyName}}

Tel: {{companyPhone}}
E-Mail: {{companyEmail}}`,
    category: 'invoice',
    variables: ['customerName', 'invoiceNumber', 'currentDate', 'quotePrice', 'companyName', 'companyPhone', 'companyEmail'],
    isActive: true,
    isSystem: true,
    createdBy: 'system',
    description: 'Standard-Vorlage für den Versand von Rechnungen',
    attachmentTypes: ['invoice_pdf']
  },
  {
    name: 'Erinnerung Umzugstermin',
    subject: 'Erinnerung: Ihr Umzug am {{moveDate}}',
    content: `Sehr geehrte/r {{customerName}},

wir möchten Sie daran erinnern, dass Ihr Umzug am {{moveDate}} stattfindet.

**Wichtige Informationen:**
- Startzeit: 8:00 Uhr
- Startadresse: {{fromAddress}}
- Zieladresse: {{toAddress}}

**Bitte denken Sie daran:**
- Alle Kartons sollten gepackt und beschriftet sein
- Wertgegenstände separat transportieren
- Parkplätze für den Umzugswagen freihalten

Bei Fragen erreichen Sie uns unter {{companyPhone}}.

Wir freuen uns auf einen reibungslosen Umzug!

Mit freundlichen Grüßen
{{companyName}}`,
    category: 'reminder',
    variables: ['customerName', 'moveDate', 'fromAddress', 'toAddress', 'companyPhone', 'companyName'],
    isActive: true,
    isSystem: true,
    createdBy: 'system',
    description: 'Erinnerung an bevorstehenden Umzugstermin'
  },
  {
    name: 'Bestätigung Umzugstermin',
    subject: 'Bestätigung: Ihr Umzugstermin am {{moveDate}}',
    content: `Sehr geehrte/r {{customerName}},

hiermit bestätigen wir Ihren Umzugstermin:

**Terminbestätigung:**
- Datum: {{moveDate}}
- Startzeit: 8:00 Uhr
- Von: {{fromAddress}}
- Nach: {{toAddress}}
- Angebotsnummer: {{quoteNumber}}

Unser Team wird pünktlich bei Ihnen sein. 

Sollten Sie noch Fragen haben oder Änderungen vornehmen müssen, kontaktieren Sie uns bitte umgehend.

Mit freundlichen Grüßen
{{employeeName}}
{{companyName}}

Tel: {{companyPhone}}
E-Mail: {{companyEmail}}`,
    category: 'confirmation',
    variables: ['customerName', 'moveDate', 'fromAddress', 'toAddress', 'quoteNumber', 'employeeName', 'companyName', 'companyPhone', 'companyEmail'],
    isActive: true,
    isSystem: true,
    createdBy: 'system',
    description: 'Bestätigung eines vereinbarten Umzugstermins'
  },
  {
    name: 'Follow-Up nach Angebot',
    subject: 'Rückfrage zu Ihrem Umzugsangebot',
    content: `Sehr geehrte/r {{customerName}},

vor einigen Tagen haben wir Ihnen ein Angebot für Ihren geplanten Umzug zugesandt.

Gerne möchten wir nachfragen, ob Sie noch Fragen zu unserem Angebot haben oder weitere Informationen benötigen.

Wir stehen Ihnen für ein persönliches Gespräch gerne zur Verfügung und können das Angebot auch an Ihre individuellen Wünsche anpassen.

Sie erreichen uns unter {{companyPhone}} oder per E-Mail an {{companyEmail}}.

Wir freuen uns auf Ihre Rückmeldung!

Mit freundlichen Grüßen
{{employeeName}}
{{companyName}}`,
    category: 'follow_up',
    variables: ['customerName', 'companyPhone', 'companyEmail', 'employeeName', 'companyName'],
    isActive: true,
    isSystem: true,
    createdBy: 'system',
    description: 'Nachfass-E-Mail nach Angebotsversand'
  }
];

class EmailTemplateService {
  private readonly COLLECTION_NAME = 'emailTemplates';

  /**
   * Initialisiert die Standard-Vorlagen
   */
  async initializeDefaultTemplates(): Promise<void> {
    if (!db) return;

    try {
      const templatesRef = collection(db, this.COLLECTION_NAME);
      const snapshot = await getDocs(templatesRef);

      // Wenn noch keine Vorlagen existieren, füge die Standard-Vorlagen hinzu
      if (snapshot.empty) {
        console.log('Initialisiere Standard-E-Mail-Vorlagen...');
        
        for (const template of DEFAULT_TEMPLATES) {
          await addDoc(templatesRef, {
            ...template,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          });
        }
        
        console.log('Standard-E-Mail-Vorlagen erfolgreich initialisiert');
      }
    } catch (error) {
      console.error('Fehler beim Initialisieren der Standard-Vorlagen:', error);
    }
  }

  /**
   * Holt alle E-Mail-Vorlagen
   */
  async getAllTemplates(): Promise<EmailTemplate[]> {
    if (!db) return [];

    try {
      const templatesRef = collection(db, this.COLLECTION_NAME);
      const q = query(templatesRef, orderBy('category'), orderBy('name'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      } as EmailTemplate));
    } catch (error) {
      console.error('Fehler beim Abrufen der E-Mail-Vorlagen:', error);
      return [];
    }
  }

  /**
   * Holt aktive Vorlagen einer bestimmten Kategorie
   */
  async getTemplatesByCategory(category: EmailTemplate['category']): Promise<EmailTemplate[]> {
    if (!db) return [];

    try {
      const templatesRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        templatesRef, 
        where('category', '==', category),
        where('isActive', '==', true),
        orderBy('name')
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      } as EmailTemplate));
    } catch (error) {
      console.error('Fehler beim Abrufen der Vorlagen nach Kategorie:', error);
      return [];
    }
  }

  /**
   * Holt eine spezifische E-Mail-Vorlage
   */
  async getTemplate(id: string): Promise<EmailTemplate | null> {
    if (!db) return null;

    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate() || new Date(),
          updatedAt: docSnap.data().updatedAt?.toDate() || new Date()
        } as EmailTemplate;
      }
      return null;
    } catch (error) {
      console.error('Fehler beim Abrufen der E-Mail-Vorlage:', error);
      return null;
    }
  }

  /**
   * Erstellt eine neue E-Mail-Vorlage
   */
  async createTemplate(template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!db) throw new Error('Keine Datenbankverbindung');

    try {
      // Extrahiere verwendete Variablen aus dem Content
      const usedVariables = this.extractVariables(template.content + ' ' + template.subject);

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...template,
        variables: usedVariables,
        isSystem: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      return docRef.id;
    } catch (error) {
      console.error('Fehler beim Erstellen der E-Mail-Vorlage:', error);
      throw error;
    }
  }

  /**
   * Aktualisiert eine E-Mail-Vorlage
   */
  async updateTemplate(id: string, updates: Partial<EmailTemplate>): Promise<void> {
    if (!db) throw new Error('Keine Datenbankverbindung');

    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      
      // Wenn Content oder Subject aktualisiert werden, extrahiere neue Variablen
      if (updates.content || updates.subject) {
        const template = await this.getTemplate(id);
        if (template) {
          const content = updates.content || template.content;
          const subject = updates.subject || template.subject;
          updates.variables = this.extractVariables(content + ' ' + subject);
        }
      }

      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren der E-Mail-Vorlage:', error);
      throw error;
    }
  }

  /**
   * Löscht eine E-Mail-Vorlage (nur nicht-System-Vorlagen)
   */
  async deleteTemplate(id: string): Promise<void> {
    if (!db) throw new Error('Keine Datenbankverbindung');

    try {
      const template = await this.getTemplate(id);
      if (template?.isSystem) {
        throw new Error('System-Vorlagen können nicht gelöscht werden');
      }

      await deleteDoc(doc(db, this.COLLECTION_NAME, id));
    } catch (error) {
      console.error('Fehler beim Löschen der E-Mail-Vorlage:', error);
      throw error;
    }
  }

  /**
   * Dupliziert eine E-Mail-Vorlage
   */
  async duplicateTemplate(id: string, newName: string): Promise<string> {
    const template = await this.getTemplate(id);
    if (!template) throw new Error('Vorlage nicht gefunden');

    const { id: _, createdAt, updatedAt, ...templateData } = template;
    
    return await this.createTemplate({
      ...templateData,
      name: newName,
      isSystem: false,
      createdBy: 'user'
    });
  }

  /**
   * Ersetzt Variablen in einer Vorlage mit tatsächlichen Werten
   */
  replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    
    // Ersetze alle Variablen
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    });

    // Ersetze System-Variablen
    result = result.replace(/{{currentDate}}/g, new Date().toLocaleDateString('de-DE'));
    result = result.replace(/{{companyName}}/g, 'RELOCATO® Bielefeld');
    result = result.replace(/{{companyPhone}}/g, '(0521) 1200551-0');
    result = result.replace(/{{companyEmail}}/g, 'bielefeld@relocato.de');

    return result;
  }

  /**
   * Extrahiert verwendete Variablen aus dem Template-Text
   */
  extractVariables(text: string): string[] {
    const regex = /{{(\w+)}}/g;
    const matches = text.match(regex) || [];
    const variables = matches.map(match => match.replace(/{{|}}/g, ''));
    return [...new Set(variables)]; // Entferne Duplikate
  }

  /**
   * Validiert eine E-Mail-Vorlage
   */
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

    // Prüfe, ob alle verwendeten Variablen bekannt sind
    if (template.content || template.subject) {
      const usedVars = this.extractVariables((template.content || '') + ' ' + (template.subject || ''));
      const knownVars = AVAILABLE_VARIABLES.map(v => v.key.replace(/{{|}}/g, ''));
      
      usedVars.forEach(varName => {
        if (!knownVars.includes(varName)) {
          errors.push(`Unbekannte Variable: {{${varName}}}`);
        }
      });
    }

    return errors;
  }
}

export default new EmailTemplateService();