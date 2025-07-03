import { supabase } from '../config/supabase';
import emailHistoryService, { EmailRecord } from './emailHistoryService';

export interface SupabaseEmailRecord {
  id: string;
  customer_id: string;
  recipient: string;
  subject: string;
  type: string;
  status: 'sent' | 'failed' | 'pending';
  sent_at: string;
  created_at: string;
}

class EmailHistoryServiceSupabase {
  private migrationCompleted = false;

  constructor() {
    // Auto-migrate on first use
    this.migrateLocalStorageToSupabase();
  }

  /**
   * Migrate existing localStorage email history to Supabase
   */
  private async migrateLocalStorageToSupabase(): Promise<void> {
    if (this.migrationCompleted) return;

    try {
      console.log('🔄 Starting email history migration from localStorage to Supabase...');

      // Get all existing localStorage records
      const localRecords = emailHistoryService.getEmailHistory();
      
      if (localRecords.length === 0) {
        console.log('✅ No local email records to migrate');
        this.migrationCompleted = true;
        return;
      }

      console.log(`📧 Found ${localRecords.length} email records to migrate`);

      // Transform to Supabase format
      const supabaseRecords = localRecords.map(record => ({
        customer_id: record.customerId,
        recipient: record.to,
        subject: record.subject,
        type: record.templateType,
        status: record.status as 'sent' | 'failed',
        sent_at: record.sentAt,
        created_at: record.sentAt
      }));

      // Insert in batches of 100
      const batchSize = 100;
      let migratedCount = 0;

      for (let i = 0; i < supabaseRecords.length; i += batchSize) {
        const batch = supabaseRecords.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('email_history')
          .insert(batch);

        if (error) {
          console.error(`❌ Failed to migrate batch ${i / batchSize + 1}:`, error);
          // Continue with next batch instead of failing completely
        } else {
          migratedCount += batch.length;
          console.log(`✅ Migrated batch ${i / batchSize + 1}: ${batch.length} records`);
        }
      }

      console.log(`✅ Email history migration completed: ${migratedCount}/${localRecords.length} records migrated`);
      
      // Keep localStorage as backup for now - don't clear it yet
      // emailHistoryService.clearHistory();
      
      this.migrationCompleted = true;
    } catch (error) {
      console.error('❌ Email history migration failed:', error);
      // Fall back to localStorage if migration fails
    }
  }

  /**
   * Save email record to Supabase
   */
  async saveEmailRecord(record: Omit<EmailRecord, 'id'>): Promise<EmailRecord | null> {
    try {
      const supabaseRecord = {
        customer_id: record.customerId,
        recipient: record.to,
        subject: record.subject,
        type: record.templateType,
        status: record.status as 'sent' | 'failed',
        sent_at: record.sentAt
      };

      const { data, error } = await supabase
        .from('email_history')
        .insert(supabaseRecord)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to save email record to Supabase:', error);
        // Fallback to localStorage
        return emailHistoryService.saveEmailRecord(record);
      }

      // Transform back to local format
      const emailRecord: EmailRecord = {
        id: data.id,
        customerId: data.customer_id,
        customerName: record.customerName,
        to: data.recipient,
        subject: data.subject,
        templateType: data.type,
        sentAt: data.sent_at,
        status: data.status,
        errorMessage: record.errorMessage
      };

      console.log('✅ Email record saved to Supabase');
      return emailRecord;
    } catch (error) {
      console.error('❌ Error saving email record:', error);
      // Fallback to localStorage
      return emailHistoryService.saveEmailRecord(record);
    }
  }

  /**
   * Get all email history from Supabase
   */
  async getEmailHistory(limit: number = 1000): Promise<EmailRecord[]> {
    try {
      const { data, error } = await supabase
        .from('email_history')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Failed to fetch email history from Supabase:', error);
        // Fallback to localStorage
        return emailHistoryService.getEmailHistory();
      }

      // Transform to local format
      const records: EmailRecord[] = data.map(record => ({
        id: record.id,
        customerId: record.customer_id,
        customerName: 'Unknown', // Would need to join with customers table
        to: record.recipient,
        subject: record.subject,
        templateType: record.type,
        sentAt: record.sent_at,
        status: record.status,
      }));

      return records;
    } catch (error) {
      console.error('❌ Error fetching email history:', error);
      // Fallback to localStorage
      return emailHistoryService.getEmailHistory();
    }
  }

  /**
   * Get email records for a specific customer
   */
  async getCustomerEmails(customerId: string): Promise<EmailRecord[]> {
    try {
      const { data, error } = await supabase
        .from('email_history')
        .select('*')
        .eq('customer_id', customerId)
        .order('sent_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to fetch customer emails from Supabase:', error);
        // Fallback to localStorage
        return emailHistoryService.getCustomerEmails(customerId);
      }

      // Transform to local format
      const records: EmailRecord[] = data.map(record => ({
        id: record.id,
        customerId: record.customer_id,
        customerName: 'Unknown',
        to: record.recipient,
        subject: record.subject,
        templateType: record.type,
        sentAt: record.sent_at,
        status: record.status,
      }));

      return records;
    } catch (error) {
      console.error('❌ Error fetching customer emails:', error);
      // Fallback to localStorage
      return emailHistoryService.getCustomerEmails(customerId);
    }
  }

  /**
   * Get email statistics from Supabase
   */
  async getEmailStats() {
    try {
      // Get total count
      const { count: totalCount, error: countError } = await supabase
        .from('email_history')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      // Get status breakdown
      const { data: statusData, error: statusError } = await supabase
        .from('email_history')
        .select('status')
        .eq('status', 'sent');

      if (statusError) throw statusError;

      // Get recent statistics
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [
        { count: last24HoursCount },
        { count: last7DaysCount },
        { count: last30DaysCount }
      ] = await Promise.all([
        supabase.from('email_history').select('*', { count: 'exact', head: true })
          .gte('sent_at', last24Hours.toISOString()),
        supabase.from('email_history').select('*', { count: 'exact', head: true })
          .gte('sent_at', last7Days.toISOString()),
        supabase.from('email_history').select('*', { count: 'exact', head: true })
          .gte('sent_at', last30Days.toISOString())
      ]);

      const stats = {
        total: totalCount || 0,
        sent: statusData?.length || 0,
        failed: (totalCount || 0) - (statusData?.length || 0),
        byTemplate: {}, // Would need aggregation query
        last24Hours: last24HoursCount || 0,
        last7Days: last7DaysCount || 0,
        last30Days: last30DaysCount || 0
      };

      return stats;
    } catch (error) {
      console.error('❌ Error fetching email stats:', error);
      // Fallback to localStorage
      return emailHistoryService.getEmailStats();
    }
  }

  /**
   * Add received email record
   */
  async addReceivedEmail(
    from: string,
    to: string,
    subject: string,
    customerId: string,
    customerName: string,
    date: Date = new Date()
  ): Promise<void> {
    const record: Omit<EmailRecord, 'id'> = {
      customerId,
      customerName,
      to: from,
      subject,
      templateType: 'received',
      sentAt: date.toISOString(),
      status: 'sent'
    };

    await this.saveEmailRecord(record);
  }

  /**
   * Clear all email history (both Supabase and localStorage)
   */
  async clearHistory(): Promise<void> {
    try {
      // Clear Supabase
      const { error } = await supabase
        .from('email_history')
        .delete()
        .neq('id', ''); // Delete all records

      if (error) {
        console.error('❌ Failed to clear Supabase email history:', error);
      } else {
        console.log('✅ Supabase email history cleared');
      }

      // Clear localStorage
      emailHistoryService.clearHistory();
      console.log('✅ LocalStorage email history cleared');
    } catch (error) {
      console.error('❌ Error clearing email history:', error);
    }
  }

  /**
   * Check if migration is needed and completed
   */
  isMigrationCompleted(): boolean {
    return this.migrationCompleted;
  }

  /**
   * Force re-migration (for testing/recovery)
   */
  async forceMigration(): Promise<void> {
    this.migrationCompleted = false;
    await this.migrateLocalStorageToSupabase();
  }
}

// Export singleton instance
export const emailHistoryServiceSupabase = new EmailHistoryServiceSupabase();
export default emailHistoryServiceSupabase;