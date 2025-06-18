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
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { Customer, Quote } from '../types';
import emailTemplateService from './emailTemplateService';
import { sendEmailViaSMTP } from './smtpEmailService';
import emailHistoryService from './emailHistoryService';
import { generatePDF } from './pdfService';

export interface FollowUpRule {
  id?: string;
  name: string;
  description: string;
  isActive: boolean;
  triggerEvent: 'quote_sent' | 'quote_viewed' | 'invoice_sent' | 'customer_created' | 'custom';
  delayDays: number; // Days after trigger event
  emailTemplateId: string;
  conditions?: {
    quoteStatus?: string[];
    customerPriority?: string[];
    minQuoteValue?: number;
    maxQuoteValue?: number;
  };
  createdAt: Date;
  updatedAt: Date;
  lastRunAt?: Date;
  sentCount: number;
}

export interface ScheduledFollowUp {
  id?: string;
  ruleId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  quoteId?: string;
  scheduledFor: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  attempts: number;
  lastAttemptAt?: Date;
  error?: string;
  createdAt: Date;
}

// Standard Follow-up Regeln
const DEFAULT_FOLLOW_UP_RULES: Omit<FollowUpRule, 'id' | 'createdAt' | 'updatedAt' | 'lastRunAt' | 'sentCount'>[] = [
  {
    name: 'Follow-up nach Angebotsversand',
    description: 'Automatische Nachfrage 3 Tage nach Angebotsversand',
    isActive: true,
    triggerEvent: 'quote_sent',
    delayDays: 3,
    emailTemplateId: '', // Will be set during initialization
    conditions: {
      quoteStatus: ['sent', 'viewed']
    }
  },
  {
    name: 'Zweite Erinnerung',
    description: 'Zweite Nachfrage 7 Tage nach Angebotsversand',
    isActive: true,
    triggerEvent: 'quote_sent',
    delayDays: 7,
    emailTemplateId: '', // Will be set during initialization
    conditions: {
      quoteStatus: ['sent', 'viewed']
    }
  },
  {
    name: 'Letzte Chance Erinnerung',
    description: 'Finale Nachfrage vor Ablauf des Angebots',
    isActive: true,
    triggerEvent: 'quote_sent',
    delayDays: 12,
    emailTemplateId: '', // Will be set during initialization
    conditions: {
      quoteStatus: ['sent', 'viewed']
    }
  }
];

class FollowUpService {
  private readonly RULES_COLLECTION = 'followUpRules';
  private readonly SCHEDULED_COLLECTION = 'scheduledFollowUps';

  /**
   * Initialisiert die Standard Follow-up Regeln
   */
  async initializeDefaultRules(): Promise<void> {
    if (!db) return;

    try {
      const rulesRef = collection(db, this.RULES_COLLECTION);
      const snapshot = await getDocs(rulesRef);

      if (snapshot.empty) {
        console.log('Initialisiere Standard Follow-up Regeln...');
        
        // Get follow-up email template
        const templates = await emailTemplateService.getAllTemplates();
        const followUpTemplate = templates.find(t => t.category === 'follow_up' && t.isActive);
        
        if (followUpTemplate) {
          for (const rule of DEFAULT_FOLLOW_UP_RULES) {
            await addDoc(rulesRef, {
              ...rule,
              emailTemplateId: followUpTemplate.id,
              sentCount: 0,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now()
            });
          }
        }
        
        console.log('Standard Follow-up Regeln erfolgreich initialisiert');
      }
    } catch (error) {
      console.error('Fehler beim Initialisieren der Follow-up Regeln:', error);
    }
  }

  /**
   * Holt alle Follow-up Regeln
   */
  async getAllRules(): Promise<FollowUpRule[]> {
    if (!db) return [];

    try {
      const rulesRef = collection(db, this.RULES_COLLECTION);
      const snapshot = await getDocs(rulesRef);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        lastRunAt: doc.data().lastRunAt?.toDate()
      } as FollowUpRule));
    } catch (error) {
      console.error('Fehler beim Abrufen der Follow-up Regeln:', error);
      return [];
    }
  }

  /**
   * Erstellt eine neue Follow-up Regel
   */
  async createRule(rule: Omit<FollowUpRule, 'id' | 'createdAt' | 'updatedAt' | 'lastRunAt' | 'sentCount'>): Promise<string> {
    if (!db) throw new Error('Keine Datenbankverbindung');

    try {
      const docRef = await addDoc(collection(db, this.RULES_COLLECTION), {
        ...rule,
        sentCount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      return docRef.id;
    } catch (error) {
      console.error('Fehler beim Erstellen der Follow-up Regel:', error);
      throw error;
    }
  }

  /**
   * Aktualisiert eine Follow-up Regel
   */
  async updateRule(id: string, updates: Partial<FollowUpRule>): Promise<void> {
    if (!db) throw new Error('Keine Datenbankverbindung');

    try {
      const docRef = doc(db, this.RULES_COLLECTION, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Follow-up Regel:', error);
      throw error;
    }
  }

  /**
   * Löscht eine Follow-up Regel
   */
  async deleteRule(id: string): Promise<void> {
    if (!db) throw new Error('Keine Datenbankverbindung');

    try {
      await deleteDoc(doc(db, this.RULES_COLLECTION, id));
      
      // Cancel all scheduled follow-ups for this rule
      const scheduledRef = collection(db, this.SCHEDULED_COLLECTION);
      const q = query(scheduledRef, where('ruleId', '==', id), where('status', '==', 'pending'));
      const snapshot = await getDocs(q);
      
      for (const doc of snapshot.docs) {
        await updateDoc(doc.ref, { status: 'cancelled' });
      }
    } catch (error) {
      console.error('Fehler beim Löschen der Follow-up Regel:', error);
      throw error;
    }
  }

  /**
   * Plant ein Follow-up basierend auf einem Trigger-Event
   */
  async scheduleFollowUp(
    triggerEvent: FollowUpRule['triggerEvent'],
    customer: Customer,
    quote?: Quote
  ): Promise<void> {
    if (!db) return;

    try {
      // Get active rules for this trigger
      const rules = await this.getAllRules();
      const activeRules = rules.filter(r => 
        r.isActive && 
        r.triggerEvent === triggerEvent
      );

      for (const rule of activeRules) {
        // Check conditions
        if (!this.checkConditions(rule, customer, quote)) {
          continue;
        }

        // Check if follow-up already scheduled
        const existingFollowUp = await this.getExistingFollowUp(
          rule.id!,
          customer.id!,
          quote?.id
        );

        if (existingFollowUp) {
          console.log('Follow-up bereits geplant für Kunde:', customer.id);
          continue;
        }

        // Schedule follow-up
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + rule.delayDays);

        await addDoc(collection(db, this.SCHEDULED_COLLECTION), {
          ruleId: rule.id,
          customerId: customer.id,
          customerName: customer.name,
          customerEmail: customer.email!,
          quoteId: quote?.id,
          scheduledFor: Timestamp.fromDate(scheduledDate),
          status: 'pending',
          attempts: 0,
          createdAt: Timestamp.now()
        });

        console.log(`Follow-up geplant für ${customer.name} am ${scheduledDate.toLocaleDateString('de-DE')}`);
      }
    } catch (error) {
      console.error('Fehler beim Planen des Follow-ups:', error);
    }
  }

  /**
   * Verarbeitet alle fälligen Follow-ups
   */
  async processPendingFollowUps(): Promise<void> {
    if (!db) return;

    try {
      const now = new Date();
      const scheduledRef = collection(db, this.SCHEDULED_COLLECTION);
      const q = query(
        scheduledRef,
        where('status', '==', 'pending'),
        where('scheduledFor', '<=', Timestamp.fromDate(now))
      );
      
      const snapshot = await getDocs(q);
      console.log(`${snapshot.size} fällige Follow-ups gefunden`);

      for (const doc of snapshot.docs) {
        const followUp = {
          id: doc.id,
          ...doc.data(),
          scheduledFor: doc.data().scheduledFor.toDate(),
          createdAt: doc.data().createdAt.toDate()
        } as ScheduledFollowUp;

        await this.sendFollowUp(followUp);
      }
    } catch (error) {
      console.error('Fehler beim Verarbeiten der Follow-ups:', error);
    }
  }

  /**
   * Sendet ein einzelnes Follow-up
   */
  private async sendFollowUp(followUp: ScheduledFollowUp): Promise<void> {
    if (!db) return;

    try {
      // Get the rule
      const ruleDoc = await getDoc(doc(db, this.RULES_COLLECTION, followUp.ruleId));
      if (!ruleDoc.exists()) {
        throw new Error('Follow-up Regel nicht gefunden');
      }

      const rule = { id: ruleDoc.id, ...ruleDoc.data() } as FollowUpRule;

      // Get email template
      const template = await emailTemplateService.getTemplate(rule.emailTemplateId);
      if (!template) {
        throw new Error('E-Mail-Vorlage nicht gefunden');
      }

      // Get customer data
      const customerDoc = await getDoc(doc(db, 'customers', followUp.customerId));
      if (!customerDoc.exists()) {
        throw new Error('Kunde nicht gefunden');
      }

      const customer = { id: customerDoc.id, ...customerDoc.data() } as Customer;

      // Prepare variables
      const variables: Record<string, string> = {
        customerName: customer.name,
        customerEmail: customer.email || '',
        customerPhone: customer.phone || '',
        employeeName: 'Thomas Schmidt' // TODO: Get from current user
      };

      // Get quote data if available
      if (followUp.quoteId) {
        const quoteDoc = await getDoc(doc(db, 'quotes', followUp.quoteId));
        if (quoteDoc.exists()) {
          const quote = quoteDoc.data();
          variables.quoteNumber = followUp.quoteId;
          variables.quotePrice = `€ ${quote.price.toFixed(2)}`;
        }
      }

      // Process template
      const subject = emailTemplateService.replaceVariables(template.subject, variables);
      const content = emailTemplateService.replaceVariables(template.content, variables);

      // Send email
      const emailData = {
        to: followUp.customerEmail,
        subject,
        content,
        customerId: followUp.customerId,
        customerName: followUp.customerName,
        templateType: 'follow_up'
      };

      await sendEmailViaSMTP(emailData);

      // Update follow-up status
      await updateDoc(doc(db, this.SCHEDULED_COLLECTION, followUp.id!), {
        status: 'sent',
        lastAttemptAt: Timestamp.now()
      });

      // Update rule sent count
      await updateDoc(doc(db, this.RULES_COLLECTION, rule.id!), {
        sentCount: (rule.sentCount || 0) + 1,
        lastRunAt: Timestamp.now()
      });

      // Save to email history
      await emailHistoryService.saveEmailRecord({
        customerId: followUp.customerId,
        customerName: followUp.customerName,
        to: followUp.customerEmail,
        subject,
        templateType: 'follow_up',
        sentAt: new Date().toISOString(),
        status: 'sent'
      });

      console.log(`Follow-up erfolgreich gesendet an ${followUp.customerEmail}`);
    } catch (error: any) {
      console.error('Fehler beim Senden des Follow-ups:', error);
      
      // Update follow-up with error
      await updateDoc(doc(db, this.SCHEDULED_COLLECTION, followUp.id!), {
        status: 'failed',
        attempts: followUp.attempts + 1,
        lastAttemptAt: Timestamp.now(),
        error: error.message
      });
    }
  }

  /**
   * Prüft, ob die Bedingungen für ein Follow-up erfüllt sind
   */
  private checkConditions(
    rule: FollowUpRule,
    customer: Customer,
    quote?: Quote
  ): boolean {
    if (!rule.conditions) return true;

    // Check quote status
    if (rule.conditions.quoteStatus && quote) {
      if (!rule.conditions.quoteStatus.includes(quote.status)) {
        return false;
      }
    }

    // Check customer priority
    if (rule.conditions.customerPriority && customer.priority) {
      if (!rule.conditions.customerPriority.includes(customer.priority)) {
        return false;
      }
    }

    // Check quote value
    if (quote) {
      if (rule.conditions.minQuoteValue && quote.price < rule.conditions.minQuoteValue) {
        return false;
      }
      if (rule.conditions.maxQuoteValue && quote.price > rule.conditions.maxQuoteValue) {
        return false;
      }
    }

    return true;
  }

  /**
   * Prüft, ob bereits ein Follow-up geplant ist
   */
  private async getExistingFollowUp(
    ruleId: string,
    customerId: string,
    quoteId?: string
  ): Promise<boolean> {
    if (!db) return false;

    try {
      const scheduledRef = collection(db, this.SCHEDULED_COLLECTION);
      let q = query(
        scheduledRef,
        where('ruleId', '==', ruleId),
        where('customerId', '==', customerId),
        where('status', '==', 'pending')
      );

      if (quoteId) {
        q = query(q, where('quoteId', '==', quoteId));
      }

      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Fehler beim Prüfen existierender Follow-ups:', error);
      return false;
    }
  }

  /**
   * Holt alle geplanten Follow-ups
   */
  async getScheduledFollowUps(status?: ScheduledFollowUp['status']): Promise<ScheduledFollowUp[]> {
    if (!db) return [];

    try {
      const scheduledRef = collection(db, this.SCHEDULED_COLLECTION);
      let q = query(scheduledRef, orderBy('scheduledFor', 'asc'));
      
      if (status) {
        q = query(q, where('status', '==', status));
      }

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        scheduledFor: doc.data().scheduledFor.toDate(),
        createdAt: doc.data().createdAt.toDate(),
        lastAttemptAt: doc.data().lastAttemptAt?.toDate()
      } as ScheduledFollowUp));
    } catch (error) {
      console.error('Fehler beim Abrufen der geplanten Follow-ups:', error);
      return [];
    }
  }

  /**
   * Storniert ein geplantes Follow-up
   */
  async cancelScheduledFollowUp(id: string): Promise<void> {
    if (!db) throw new Error('Keine Datenbankverbindung');

    try {
      await updateDoc(doc(db, this.SCHEDULED_COLLECTION, id), {
        status: 'cancelled'
      });
    } catch (error) {
      console.error('Fehler beim Stornieren des Follow-ups:', error);
      throw error;
    }
  }

  /**
   * Führt einen manuellen Follow-up Lauf durch
   */
  async runManualCheck(): Promise<number> {
    console.log('Starte manuellen Follow-up Check...');
    await this.processPendingFollowUps();
    
    const pending = await this.getScheduledFollowUps('pending');
    console.log(`${pending.length} Follow-ups sind noch ausstehend`);
    
    return pending.length;
  }
}

export default new FollowUpService();