import { functions } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';

export interface EmailFolder {
  name: string;
  path: string;
  hasChildren: boolean;
}

export interface EmailAttachment {
  filename: string;
  contentType: string;
  size: number;
}

export interface Email {
  uid: string;
  folder: string;
  messageId?: string;
  from: string;
  to: string;
  subject: string;
  date: Date;
  text: string;
  html: string;
  attachments: EmailAttachment[];
  flags?: string[];
  isRead?: boolean;
  isStarred?: boolean;
}

export interface SendEmailData {
  to: string;
  subject: string;
  html: string;
  cc?: string;
  bcc?: string;
  replyTo?: string;
  attachments?: any[];
}

class EmailClientService {
  // Cloud Functions
  private syncEmailsFunc = httpsCallable(functions, 'syncEmailsForClient');
  private getFoldersFunc = httpsCallable(functions, 'getEmailFolders');
  private sendEmailFunc = httpsCallable(functions, 'sendEmailFromClient');

  /**
   * Sync emails from IONOS to Firebase
   */
  async syncEmails(folder: string = 'INBOX', limit: number = 50, forceSync: boolean = false) {
    try {
      console.log(`📧 Syncing emails from ${folder}...`);
      const result = await this.syncEmailsFunc({ folder, limit, forceSync });
      return result.data;
    } catch (error) {
      console.error('Error syncing emails:', error);
      throw error;
    }
  }

  /**
   * Get email folders from IONOS
   */
  async getFolders(): Promise<EmailFolder[]> {
    try {
      console.log('📁 Fetching email folders...');
      const result = await this.getFoldersFunc({});
      return (result.data as any).folders || [];
    } catch (error) {
      console.error('Error fetching folders:', error);
      throw error;
    }
  }

  /**
   * Send email via IONOS SMTP
   */
  async sendEmail(emailData: SendEmailData) {
    try {
      console.log('📤 Sending email...');
      const result = await this.sendEmailFunc(emailData);
      return result.data;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Mark email as read/unread
   */
  async markAsRead(emailId: string, isRead: boolean = true) {
    try {
      // This would typically update the IMAP flags
      // For now, we'll just update Firestore
      console.log(`Marking email ${emailId} as ${isRead ? 'read' : 'unread'}`);
      // Implementation would go here
    } catch (error) {
      console.error('Error marking email:', error);
      throw error;
    }
  }

  /**
   * Move email to folder
   */
  async moveToFolder(emailId: string, targetFolder: string) {
    try {
      console.log(`Moving email ${emailId} to ${targetFolder}`);
      // Implementation would go here
    } catch (error) {
      console.error('Error moving email:', error);
      throw error;
    }
  }

  /**
   * Delete email
   */
  async deleteEmail(emailId: string) {
    try {
      console.log(`Deleting email ${emailId}`);
      // Move to trash or mark for deletion
      await this.moveToFolder(emailId, 'Trash');
    } catch (error) {
      console.error('Error deleting email:', error);
      throw error;
    }
  }

  /**
   * Search emails
   */
  async searchEmails(query: string, folder?: string) {
    try {
      console.log(`Searching emails for: ${query}`);
      // Implementation would search through synced emails in Firestore
      // This is a placeholder for now
      return [];
    } catch (error) {
      console.error('Error searching emails:', error);
      throw error;
    }
  }
}

export const emailClientService = new EmailClientService();