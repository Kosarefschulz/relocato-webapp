// Email Service for Supabase Edge Functions with IONOS
import { supabase } from './supabase';

export interface EmailFolder {
  name: string;
  path: string;
  delimiter?: string;
  flags?: string[];
  level?: number;
  hasChildren?: boolean;
  specialUse?: 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | null;
  unreadCount?: number;
  totalCount?: number;
}

export interface EmailMessage {
  id: string;
  uid: string;
  folder: string;
  subject: string;
  from: { name?: string; address: string }[];
  to: { name?: string; address: string }[];
  cc?: { name?: string; address: string }[];
  bcc?: { name?: string; address: string }[];
  date: Date;
  flags: string[];
  unread: boolean;
  bodyText?: string;
  bodyHtml?: string;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  messageId?: string;
  inReplyTo?: string;
  references?: string[];
}

export interface EmailAttachment {
  filename: string;
  contentType: string;
  size: number;
  contentId?: string;
  data?: string; // base64 encoded
}

export interface SendEmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
  replyTo?: string;
}

class EmailService {
  constructor() {
    console.log('📧 Email Service initialized with Supabase Edge Functions');
  }

  /**
   * Get email folders from IONOS via Supabase Edge Function
   */
  async getFolders(): Promise<EmailFolder[]> {
    try {
      console.log('📁 Fetching email folders...');
      
      const { data, error } = await supabase.functions.invoke('email-folders', {
        body: {}
      });

      if (error) {
        console.error('❌ Error fetching folders:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch folders');
      }

      console.log('✅ Folders fetched successfully:', data.folders.length);
      return data.folders;
    } catch (error) {
      console.error('❌ Email folders fetch failed:', error);
      throw error;
    }
  }

  /**
   * Get emails from a specific folder
   */
  async getEmails(folderPath: string = 'INBOX', limit: number = 50): Promise<EmailMessage[]> {
    try {
      console.log(`📬 Fetching emails from folder: ${folderPath}`);
      
      const { data, error } = await supabase.functions.invoke('email-list', {
        body: {
          folder: folderPath,
          limit,
          page: 1
        }
      });

      if (error) {
        console.error('❌ Error fetching emails:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch emails');
      }

      console.log(`✅ ${data.emails.length} emails fetched from ${folderPath}`);
      return data.emails.map((email: any) => this.transformEmailMessage(email));
    } catch (error) {
      console.error('❌ Email fetch failed:', error);
      throw error;
    }
  }

  /**
   * Get a single email by UID
   */
  async getEmail(folderPath: string, uid: string): Promise<EmailMessage | null> {
    try {
      console.log(`📧 Fetching email ${uid} from ${folderPath}`);
      
      const { data, error } = await supabase.functions.invoke('email-read', {
        body: {
          folder: folderPath,
          uid
        }
      });

      if (error) {
        console.error('❌ Error fetching email:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch email');
      }

      return this.transformEmailMessage(data.email);
    } catch (error) {
      console.error('❌ Email fetch failed:', error);
      return null;
    }
  }

  /**
   * Send an email via IONOS SMTP
   */
  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    try {
      console.log('📤 Sending email...', { to: options.to, subject: options.subject });
      
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: Array.isArray(options.to) ? options.to : [options.to],
          cc: options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : undefined,
          bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : undefined,
          subject: options.subject,
          text: options.text,
          html: options.html,
          attachments: options.attachments,
          replyTo: options.replyTo
        }
      });

      if (error) {
        console.error('❌ Error sending email:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to send email');
      }

      console.log('✅ Email sent successfully');
      return true;
    } catch (error) {
      console.error('❌ Email send failed:', error);
      throw error;
    }
  }

  /**
   * Mark email as read/unread
   */
  async markAsRead(folderPath: string, uid: string, read: boolean = true): Promise<boolean> {
    try {
      console.log(`📧 Marking email ${uid} as ${read ? 'read' : 'unread'}`);
      
      const { data, error } = await supabase.functions.invoke('email-mark-read', {
        body: {
          folder: folderPath,
          uid,
          read
        }
      });

      if (error) {
        console.error('❌ Error marking email:', error);
        throw error;
      }

      return data.success;
    } catch (error) {
      console.error('❌ Mark email failed:', error);
      return false;
    }
  }

  /**
   * Delete an email (move to trash)
   */
  async deleteEmail(folderPath: string, uid: string): Promise<boolean> {
    try {
      console.log(`🗑️ Deleting email ${uid} from ${folderPath}`);
      
      const { data, error } = await supabase.functions.invoke('email-delete', {
        body: {
          folder: folderPath,
          uid
        }
      });

      if (error) {
        console.error('❌ Error deleting email:', error);
        throw error;
      }

      return data.success;
    } catch (error) {
      console.error('❌ Delete email failed:', error);
      return false;
    }
  }

  /**
   * Move email to another folder
   */
  async moveEmail(fromFolder: string, toFolder: string, uid: string): Promise<boolean> {
    try {
      console.log(`📁 Moving email ${uid} from ${fromFolder} to ${toFolder}`);
      
      const { data, error } = await supabase.functions.invoke('email-move', {
        body: {
          fromFolder,
          toFolder,
          uid
        }
      });

      if (error) {
        console.error('❌ Error moving email:', error);
        throw error;
      }

      return data.success;
    } catch (error) {
      console.error('❌ Move email failed:', error);
      return false;
    }
  }

  /**
   * Search emails
   */
  async searchEmails(folderPath: string = 'INBOX', query: string, limit: number = 50): Promise<EmailMessage[]> {
    try {
      console.log(`🔍 Searching emails in ${folderPath} for: ${query}`);
      
      const { data, error } = await supabase.functions.invoke('email-search', {
        body: {
          folder: folderPath,
          query,
          limit
        }
      });

      if (error) {
        console.error('❌ Error searching emails:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to search emails');
      }

      return data.emails.map((email: any) => this.transformEmailMessage(email));
    } catch (error) {
      console.error('❌ Email search failed:', error);
      return [];
    }
  }

  /**
   * Send quote email with PDF attachment
   */
  async sendQuoteEmail(
    customerEmail: string, 
    customerName: string, 
    quoteId: string, 
    pdfBlob: Blob
  ): Promise<boolean> {
    try {
      console.log(`📧 Sending quote email to ${customerEmail}`);

      // Convert blob to base64
      const pdfBase64 = await this.blobToBase64(pdfBlob);

      const emailOptions: SendEmailOptions = {
        to: customerEmail,
        subject: `Ihr Umzugsangebot von RELOCATO - ${quoteId}`,
        html: this.generateQuoteEmailHTML(customerName, quoteId),
        attachments: [{
          filename: `Angebot_${quoteId}.pdf`,
          contentType: 'application/pdf',
          size: pdfBlob.size,
          data: pdfBase64
        }]
      };

      return await this.sendEmail(emailOptions);
    } catch (error) {
      console.error('❌ Quote email failed:', error);
      throw error;
    }
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Remove data:application/pdf;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private generateQuoteEmailHTML(customerName: string, quoteId: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ihr Umzugsangebot</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #8BC34A; font-size: 32px; margin: 0;">RELOCATO®</h1>
          <div style="height: 3px; background: #8BC34A; margin: 10px 0;"></div>
        </div>
        
        <h2>Lieber ${customerName},</h2>
        
        <p>vielen Dank für Ihr Vertrauen in unsere Umzugsdienstleistungen.</p>
        
        <p>Im Anhang finden Sie Ihr persönliches Angebot mit der Nummer <strong>${quoteId}</strong>.</p>
        
        <p>Unsere Leistungen umfassen:</p>
        <ul>
          <li>Professionelle Verpackung und Transport</li>
          <li>Versicherungsschutz für Ihren Hausrat</li>
          <li>Erfahrenes und geschultes Personal</li>
          <li>Moderne Transportfahrzeuge</li>
        </ul>
        
        <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung:</p>
        <p>
          <strong>Telefon:</strong> (0521) 1200551-0<br>
          <strong>E-Mail:</strong> bielefeld@relocato.de
        </p>
        
        <p>Wir freuen uns auf Ihren Auftrag!</p>
        
        <p>Mit freundlichen Grüßen<br>
        Ihr RELOCATO® Team Bielefeld</p>
        
        <div style="border-top: 1px solid #ccc; margin-top: 30px; padding-top: 20px; font-size: 12px; color: #666;">
          <p>RELOCATO® Bielefeld | Albrechtstraße 27, 33615 Bielefeld</p>
          <p>Tel: (0521) 1200551-0 | E-Mail: bielefeld@relocato.de | Web: www.relocato.de</p>
        </div>
      </body>
      </html>
    `;
  }

  private transformEmailMessage(rawEmail: any): EmailMessage {
    return {
      id: rawEmail.id || rawEmail.uid,
      uid: rawEmail.uid,
      folder: rawEmail.folder || 'INBOX',
      subject: rawEmail.subject || '(Kein Betreff)',
      from: this.parseEmailAddresses(rawEmail.from),
      to: this.parseEmailAddresses(rawEmail.to),
      cc: rawEmail.cc ? this.parseEmailAddresses(rawEmail.cc) : undefined,
      bcc: rawEmail.bcc ? this.parseEmailAddresses(rawEmail.bcc) : undefined,
      date: new Date(rawEmail.date),
      flags: rawEmail.flags || [],
      unread: !rawEmail.flags?.includes('\\Seen'),
      bodyText: rawEmail.bodyText,
      bodyHtml: rawEmail.bodyHtml,
      attachments: rawEmail.attachments,
      headers: rawEmail.headers,
      messageId: rawEmail.messageId,
      inReplyTo: rawEmail.inReplyTo,
      references: rawEmail.references
    };
  }

  private parseEmailAddresses(addresses: any): { name?: string; address: string }[] {
    if (!addresses) return [];
    if (Array.isArray(addresses)) return addresses;
    if (typeof addresses === 'string') {
      return [{ address: addresses }];
    }
    return [addresses];
  }
}

export const emailService = new EmailService();