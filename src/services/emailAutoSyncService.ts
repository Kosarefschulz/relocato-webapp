import { supabase } from './supabaseService';
import { databaseService } from '../config/database.config';

export interface EmailSyncResult {
  success: boolean;
  downloaded: number;
  linked: number;
  errors: string[];
}

class EmailAutoSyncService {
  private syncInterval: number = 5 * 60 * 1000; // 5 Minuten
  private syncTimer: NodeJS.Timeout | null = null;
  private isSyncing: boolean = false;

  /**
   * Starte automatischen E-Mail-Sync
   */
  startAutoSync(): void {
    console.log('🔄 Starting automatic email sync (every 5 minutes)...');

    // Initial sync
    this.syncEmails();

    // Periodic sync
    this.syncTimer = setInterval(() => {
      this.syncEmails();
    }, this.syncInterval);
  }

  /**
   * Stoppe automatischen Sync
   */
  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('⏹️ Automatic email sync stopped');
    }
  }

  /**
   * Synchronisiere E-Mails von IONOS zu Supabase
   */
  async syncEmails(): Promise<EmailSyncResult> {
    if (this.isSyncing) {
      console.log('⏳ Sync already in progress, skipping...');
      return { success: false, downloaded: 0, linked: 0, errors: ['Sync in progress'] };
    }

    this.isSyncing = true;
    const result: EmailSyncResult = {
      success: true,
      downloaded: 0,
      linked: 0,
      errors: [],
    };

    try {
      console.log('📧 Starting email sync...');

      // Hole E-Mails von IONOS via Edge Function
      const { data, error } = await supabase.functions.invoke('email-list', {
        body: { folder: 'INBOX', limit: 100 },
      });

      if (error) {
        result.errors.push(`IMAP error: ${error.message}`);
        result.success = false;
        return result;
      }

      const emails = data?.emails || [];
      console.log(`📥 Fetched ${emails.length} emails from IONOS`);

      // Speichere E-Mails in Supabase
      for (const email of emails) {
        try {
          // Prüfe ob E-Mail bereits existiert
          const { data: existing } = await supabase
            .from('emails')
            .select('id')
            .eq('uid', email.uid)
            .eq('folder', 'INBOX')
            .single();

          if (existing) {
            console.log(`✓ Email ${email.uid} already exists`);
            continue;
          }

          // Speichere neue E-Mail
          const { error: insertError } = await supabase.from('emails').insert({
            uid: email.uid,
            folder: 'INBOX',
            from_address: email.from?.address || '',
            from_name: email.from?.name || '',
            to_addresses: email.to || [],
            subject: email.subject || '',
            date: email.date || new Date().toISOString(),
            flags: email.flags || [],
            text_content: email.text || '',
            html_content: email.html || '',
            message_id: email.messageId,
          });

          if (insertError) {
            result.errors.push(`Insert error for ${email.uid}: ${insertError.message}`);
          } else {
            result.downloaded++;

            // Versuche automatische Kundenzuordnung
            const linkedCustomerId = await this.autoLinkToCustomer(email);
            if (linkedCustomerId) {
              result.linked++;
            }
          }
        } catch (emailError: any) {
          result.errors.push(`Error processing email: ${emailError.message}`);
        }
      }

      console.log(`✅ Email sync completed: ${result.downloaded} new, ${result.linked} linked`);
    } catch (error: any) {
      console.error('❌ Email sync failed:', error);
      result.success = false;
      result.errors.push(error.message);
    } finally {
      this.isSyncing = false;
    }

    // Log Sync-Ergebnis
    await this.logSync(result);

    return result;
  }

  /**
   * Automatische Kunden-Zuordnung basierend auf E-Mail-Daten
   */
  private async autoLinkToCustomer(email: any): Promise<string | null> {
    try {
      const fromEmail = email.from?.address?.toLowerCase();
      if (!fromEmail) return null;

      // Hole alle Kunden
      const customers = await databaseService.getCustomers();

      // Match 1: Exakte E-Mail-Adresse
      let matchedCustomer = customers.find(
        (c) => c.email && c.email.toLowerCase() === fromEmail
      );

      if (!matchedCustomer) {
        // Match 2: Name im E-Mail-From
        const fromName = email.from?.name?.toLowerCase() || '';
        matchedCustomer = customers.find((c) => {
          const customerName = c.name.toLowerCase();
          return fromName.includes(customerName) || customerName.includes(fromName);
        });
      }

      if (!matchedCustomer) {
        // Match 3: Angebotsnummer im Betreff
        const subject = email.subject || '';
        const offerMatch = subject.match(/AG(\d+)/i);
        if (offerMatch) {
          // Suche Kunde mit diesem Angebot
          const { data: offer } = await supabase
            .from('offers')
            .select('customer_id')
            .eq('offer_number', `AG${offerMatch[1]}`)
            .single();

          if (offer?.customer_id) {
            matchedCustomer = customers.find((c) => c.id === offer.customer_id);
          }
        }
      }

      if (matchedCustomer) {
        console.log(`🔗 Auto-linking email to customer: ${matchedCustomer.name}`);

        // Erstelle Link
        const { error } = await supabase.from('email_customer_links').insert({
          email_id: email.uid,
          customer_id: matchedCustomer.id,
        });

        if (!error) {
          return matchedCustomer.id;
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Auto-link error:', error);
      return null;
    }
  }

  /**
   * Logge Sync-Ergebnis
   */
  private async logSync(result: EmailSyncResult): Promise<void> {
    try {
      await supabase.from('email_sync_logs').insert({
        synced_at: new Date().toISOString(),
        downloaded: result.downloaded,
        linked: result.linked,
        success: result.success,
        errors: result.errors,
      });
    } catch (error) {
      console.error('❌ Failed to log sync:', error);
    }
  }

  /**
   * Manuelle E-Mail-Zuordnung
   */
  async linkEmailToCustomer(emailId: string, customerId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('email_customer_links').insert({
        email_id: emailId,
        customer_id: customerId,
      });

      if (error) throw error;
      console.log(`✅ Email ${emailId} linked to customer ${customerId}`);
      return true;
    } catch (error) {
      console.error('❌ Manual link failed:', error);
      return false;
    }
  }

  /**
   * Hole alle E-Mails eines Kunden
   */
  async getCustomerEmails(customerId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('email_customer_links')
        .select(`
          email_id,
          emails (*)
        `)
        .eq('customer_id', customerId);

      if (error) throw error;

      return data?.map((link: any) => link.emails).filter(Boolean) || [];
    } catch (error) {
      console.error('❌ Error fetching customer emails:', error);
      return [];
    }
  }
}

export const emailAutoSyncService = new EmailAutoSyncService();
