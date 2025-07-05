import { supabase } from '../config/supabase';
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
  private readonly RULES_TABLE = 'follow_up_rules';
  private readonly SCHEDULED_TABLE = 'scheduled_follow_ups';

  /**
   * Initialisiert die Standard Follow-up Regeln
   */
  async initializeDefaultRules(): Promise<void> {
    try {
      const { data: existingRules, error } = await supabase
        .from(this.RULES_TABLE)
        .select('id')
        .limit(1);

      if (error) throw error;

      if (!existingRules || existingRules.length === 0) {
        console.log('Initialisiere Standard Follow-up Regeln...');
        
        // Get follow-up email template
        const templates = await emailTemplateService.getAllTemplates();
        const followUpTemplate = templates.find(t => t.category === 'follow_up' && t.isActive);
        
        if (followUpTemplate) {
          const rulesToInsert = DEFAULT_FOLLOW_UP_RULES.map(rule => ({
            ...rule,
            email_template_id: followUpTemplate.id,
            sent_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));

          const { error: insertError } = await supabase
            .from(this.RULES_TABLE)
            .insert(rulesToInsert);

          if (insertError) throw insertError;
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
    try {
      const { data, error } = await supabase
        .from(this.RULES_TABLE)
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(rule => ({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        isActive: rule.is_active,
        triggerEvent: rule.trigger_event,
        delayDays: rule.delay_days,
        emailTemplateId: rule.email_template_id,
        conditions: rule.conditions,
        createdAt: new Date(rule.created_at),
        updatedAt: new Date(rule.updated_at),
        lastRunAt: rule.last_run_at ? new Date(rule.last_run_at) : undefined,
        sentCount: rule.sent_count
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
    try {
      const { data, error } = await supabase
        .from(this.RULES_TABLE)
        .insert({
          name: rule.name,
          description: rule.description,
          is_active: rule.isActive,
          trigger_event: rule.triggerEvent,
          delay_days: rule.delayDays,
          email_template_id: rule.emailTemplateId,
          conditions: rule.conditions,
          sent_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Fehler beim Erstellen der Follow-up Regel:', error);
      throw error;
    }
  }

  /**
   * Aktualisiert eine Follow-up Regel
   */
  async updateRule(id: string, updates: Partial<FollowUpRule>): Promise<void> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.triggerEvent !== undefined) updateData.trigger_event = updates.triggerEvent;
      if (updates.delayDays !== undefined) updateData.delay_days = updates.delayDays;
      if (updates.emailTemplateId !== undefined) updateData.email_template_id = updates.emailTemplateId;
      if (updates.conditions !== undefined) updateData.conditions = updates.conditions;
      if (updates.sentCount !== undefined) updateData.sent_count = updates.sentCount;
      if (updates.lastRunAt !== undefined) updateData.last_run_at = updates.lastRunAt.toISOString();

      const { error } = await supabase
        .from(this.RULES_TABLE)
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Follow-up Regel:', error);
      throw error;
    }
  }

  /**
   * Löscht eine Follow-up Regel
   */
  async deleteRule(id: string): Promise<void> {
    try {
      // Cancel all scheduled follow-ups for this rule
      const { error: updateError } = await supabase
        .from(this.SCHEDULED_TABLE)
        .update({ status: 'cancelled' })
        .eq('rule_id', id)
        .eq('status', 'pending');
      
      if (updateError) throw updateError;

      // Delete the rule
      const { error: deleteError } = await supabase
        .from(this.RULES_TABLE)
        .delete()
        .eq('id', id);
      
      if (deleteError) throw deleteError;
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

        const { error } = await supabase
          .from(this.SCHEDULED_TABLE)
          .insert({
            rule_id: rule.id,
            customer_id: customer.id,
            customer_name: customer.name,
            customer_email: customer.email!,
            quote_id: quote?.id,
            scheduled_for: scheduledDate.toISOString(),
            status: 'pending',
            attempts: 0,
            created_at: new Date().toISOString()
          });

        if (error) throw error;

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
    try {
      const now = new Date();
      const { data: followUps, error } = await supabase
        .from(this.SCHEDULED_TABLE)
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_for', now.toISOString());
      
      if (error) throw error;
      
      console.log(`${followUps?.length || 0} fällige Follow-ups gefunden`);

      for (const followUpData of (followUps || [])) {
        const followUp: ScheduledFollowUp = {
          id: followUpData.id,
          ruleId: followUpData.rule_id,
          customerId: followUpData.customer_id,
          customerName: followUpData.customer_name,
          customerEmail: followUpData.customer_email,
          quoteId: followUpData.quote_id,
          scheduledFor: new Date(followUpData.scheduled_for),
          status: followUpData.status,
          attempts: followUpData.attempts,
          lastAttemptAt: followUpData.last_attempt_at ? new Date(followUpData.last_attempt_at) : undefined,
          error: followUpData.error,
          createdAt: new Date(followUpData.created_at)
        };

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
    try {
      // Get the rule
      const { data: ruleData, error: ruleError } = await supabase
        .from(this.RULES_TABLE)
        .select('*')
        .eq('id', followUp.ruleId)
        .single();
      
      if (ruleError || !ruleData) {
        throw new Error('Follow-up Regel nicht gefunden');
      }

      const rule: FollowUpRule = {
        id: ruleData.id,
        name: ruleData.name,
        description: ruleData.description,
        isActive: ruleData.is_active,
        triggerEvent: ruleData.trigger_event,
        delayDays: ruleData.delay_days,
        emailTemplateId: ruleData.email_template_id,
        conditions: ruleData.conditions,
        createdAt: new Date(ruleData.created_at),
        updatedAt: new Date(ruleData.updated_at),
        lastRunAt: ruleData.last_run_at ? new Date(ruleData.last_run_at) : undefined,
        sentCount: ruleData.sent_count
      };

      // Get email template
      const template = await emailTemplateService.getTemplate(rule.emailTemplateId);
      if (!template) {
        throw new Error('E-Mail-Vorlage nicht gefunden');
      }

      // Get customer data
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', followUp.customerId)
        .single();
      
      if (customerError || !customerData) {
        throw new Error('Kunde nicht gefunden');
      }

      const customer = { id: customerData.id, ...customerData } as Customer;

      // Prepare variables
      const variables: Record<string, string> = {
        customerName: customer.name,
        customerEmail: customer.email || '',
        customerPhone: customer.phone || '',
        employeeName: 'Thomas Schmidt' // TODO: Get from current user
      };

      // Get quote data if available
      if (followUp.quoteId) {
        const { data: quoteData } = await supabase
          .from('quotes')
          .select('*')
          .eq('id', followUp.quoteId)
          .single();
        
        if (quoteData) {
          variables.quoteNumber = followUp.quoteId;
          variables.quotePrice = `€ ${quoteData.price.toFixed(2)}`;
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
      await supabase
        .from(this.SCHEDULED_TABLE)
        .update({
          status: 'sent',
          last_attempt_at: new Date().toISOString()
        })
        .eq('id', followUp.id!);

      // Update rule sent count
      await supabase
        .from(this.RULES_TABLE)
        .update({
          sent_count: (rule.sentCount || 0) + 1,
          last_run_at: new Date().toISOString()
        })
        .eq('id', rule.id!);

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
      await supabase
        .from(this.SCHEDULED_TABLE)
        .update({
          status: 'failed',
          attempts: followUp.attempts + 1,
          last_attempt_at: new Date().toISOString(),
          error: error.message
        })
        .eq('id', followUp.id!);
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
    try {
      let query = supabase
        .from(this.SCHEDULED_TABLE)
        .select('id')
        .eq('rule_id', ruleId)
        .eq('customer_id', customerId)
        .eq('status', 'pending');

      if (quoteId) {
        query = query.eq('quote_id', quoteId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('Fehler beim Prüfen existierender Follow-ups:', error);
      return false;
    }
  }

  /**
   * Holt alle geplanten Follow-ups
   */
  async getScheduledFollowUps(status?: ScheduledFollowUp['status']): Promise<ScheduledFollowUp[]> {
    try {
      let query = supabase
        .from(this.SCHEDULED_TABLE)
        .select('*')
        .order('scheduled_for', { ascending: true });
      
      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        ruleId: item.rule_id,
        customerId: item.customer_id,
        customerName: item.customer_name,
        customerEmail: item.customer_email,
        quoteId: item.quote_id,
        scheduledFor: new Date(item.scheduled_for),
        status: item.status,
        attempts: item.attempts,
        lastAttemptAt: item.last_attempt_at ? new Date(item.last_attempt_at) : undefined,
        error: item.error,
        createdAt: new Date(item.created_at)
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
    try {
      const { error } = await supabase
        .from(this.SCHEDULED_TABLE)
        .update({ status: 'cancelled' })
        .eq('id', id);
      
      if (error) throw error;
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