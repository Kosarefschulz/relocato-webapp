import { supabase } from '../config/supabase';
import { Email } from '../types/email';

export interface PersistedEmail {
  id: string;
  uid: string;
  folder: string;
  from_address: string;
  from_name?: string;
  to_addresses?: any[];
  cc_addresses?: any[];
  bcc_addresses?: any[];
  subject?: string;
  date: string;
  flags: string[];
  text_content?: string;
  html_content?: string;
  attachments?: any[];
  raw_headers?: string;
  size?: number;
  message_id?: string;
  in_reply_to?: string;
  references?: string[];
  created_at: string;
  updated_at: string;
}

export const emailPersistenceService = {
  // Save email to database
  async saveEmail(email: Email, folder: string): Promise<void> {
    const { error } = await supabase
      .from('emails')
      .upsert({
        uid: email.uid || email.id,
        folder: folder,
        from_address: email.from?.address || 'unknown@unknown.com',
        from_name: email.from?.name,
        to_addresses: email.to || [],
        cc_addresses: email.cc || [],
        bcc_addresses: email.bcc || [],
        subject: email.subject,
        date: email.date,
        flags: email.flags || [],
        text_content: email.text,
        html_content: email.html,
        attachments: email.attachments || [],
        size: email.size,
        message_id: email.messageId,
        in_reply_to: email.inReplyTo,
        references: email.references
      }, {
        onConflict: 'uid,folder'
      });

    if (error) {
      console.error('Error saving email:', error);
      throw error;
    }
  },

  // Save multiple emails
  async saveEmails(emails: Email[], folder: string): Promise<void> {
    const emailData = emails.map(email => ({
      uid: email.uid || email.id,
      folder: folder,
      from_address: email.from?.address || 'unknown@unknown.com',
      from_name: email.from?.name,
      to_addresses: email.to || [],
      cc_addresses: email.cc || [],
      bcc_addresses: email.bcc || [],
      subject: email.subject,
      date: email.date,
      flags: email.flags || [],
      text_content: email.text,
      html_content: email.html,
      attachments: email.attachments || [],
      size: email.size,
      message_id: email.messageId,
      in_reply_to: email.inReplyTo,
      references: email.references
    }));

    const { error } = await supabase
      .from('emails')
      .upsert(emailData, {
        onConflict: 'uid,folder'
      });

    if (error) {
      console.error('Error saving emails:', error);
      throw error;
    }
  },

  // Get email from database
  async getEmail(uid: string, folder: string): Promise<PersistedEmail | null> {
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .eq('uid', uid)
      .eq('folder', folder)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error getting email:', error);
      throw error;
    }

    return data;
  },

  // Get emails for a folder
  async getEmails(folder: string, limit = 50, offset = 0): Promise<PersistedEmail[]> {
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .eq('folder', folder)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error getting emails:', error);
      throw error;
    }

    return data || [];
  },

  // Update email flags
  async updateEmailFlags(uid: string, folder: string, flags: string[]): Promise<void> {
    const { error } = await supabase
      .from('emails')
      .update({ flags })
      .eq('uid', uid)
      .eq('folder', folder);

    if (error) {
      console.error('Error updating email flags:', error);
      throw error;
    }
  },

  // Delete email
  async deleteEmail(uid: string, folder: string): Promise<void> {
    const { error } = await supabase
      .from('emails')
      .delete()
      .eq('uid', uid)
      .eq('folder', folder);

    if (error) {
      console.error('Error deleting email:', error);
      throw error;
    }
  },

  // Move email to another folder
  async moveEmail(uid: string, fromFolder: string, toFolder: string): Promise<void> {
    const { error } = await supabase
      .from('emails')
      .update({ folder: toFolder })
      .eq('uid', uid)
      .eq('folder', fromFolder);

    if (error) {
      console.error('Error moving email:', error);
      throw error;
    }
  },

  // Search emails
  async searchEmails(query: string, folder?: string): Promise<PersistedEmail[]> {
    let queryBuilder = supabase
      .from('emails')
      .select('*');

    if (folder) {
      queryBuilder = queryBuilder.eq('folder', folder);
    }

    // Search in subject, from_address, from_name, and text_content
    queryBuilder = queryBuilder.or(`subject.ilike.%${query}%,from_address.ilike.%${query}%,from_name.ilike.%${query}%,text_content.ilike.%${query}%`);

    const { data, error } = await queryBuilder
      .order('date', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error searching emails:', error);
      throw error;
    }

    return data || [];
  },

  // Get email count for folder
  async getEmailCount(folder: string): Promise<number> {
    const { count, error } = await supabase
      .from('emails')
      .select('*', { count: 'exact', head: true })
      .eq('folder', folder);

    if (error) {
      console.error('Error getting email count:', error);
      throw error;
    }

    return count || 0;
  },

  // Convert persisted email to Email type
  convertToEmail(persisted: PersistedEmail): Email {
    return {
      id: persisted.uid,
      uid: persisted.uid,
      from: {
        address: persisted.from_address,
        name: persisted.from_name || ''
      },
      to: persisted.to_addresses || [],
      cc: persisted.cc_addresses || [],
      bcc: persisted.bcc_addresses || [],
      subject: persisted.subject || '',
      date: persisted.date,
      flags: persisted.flags,
      text: persisted.text_content,
      html: persisted.html_content,
      attachments: persisted.attachments || [],
      size: persisted.size,
      messageId: persisted.message_id,
      inReplyTo: persisted.in_reply_to,
      references: persisted.references ? persisted.references.join(', ') : undefined,
      folder: persisted.folder
    };
  }
};