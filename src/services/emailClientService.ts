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

export interface SyncEmailsResult {
  success: boolean;
  count: number;
  folder: string;
}

class EmailClientService {
  // Cloud Functions
  private syncEmailsFunc = httpsCallable(functions, 'syncEmailsForClient');
  
  // Fallback to Vercel API if Firebase fails
  private useVercelFallback = false;
  private getFoldersFunc = httpsCallable(functions, 'getEmailFolders');
  private sendEmailFunc = httpsCallable(functions, 'sendEmailFromClient');

  /**
   * Sync emails from IONOS to Firebase
   */
  async syncEmails(folder: string = 'INBOX', limit: number = 50, forceSync: boolean = false): Promise<SyncEmailsResult> {
    try {
      console.log(`📧 Syncing emails from ${folder}...`);
      
      // Try Firebase function first
      if (!this.useVercelFallback) {
        try {
          const result = await this.syncEmailsFunc({ folder, limit, forceSync });
          return result.data as SyncEmailsResult;
        } catch (firebaseError: any) {
          console.warn('Firebase function failed, trying Vercel fallback...', firebaseError);
          this.useVercelFallback = true;
        }
      }
      
      // Fallback to Vercel API
      const auth = await import('./authService').then(m => m.auth);
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : null;
      
      const response = await fetch(`/api/email-sync?folder=${encodeURIComponent(folder)}&limit=${limit}&forceSync=${forceSync}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken && { 'Authorization': `Bearer ${idToken}` })
        },
      });
      
      if (!response.ok) {
        throw new Error(`Vercel API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        success: data.success,
        count: data.emails?.length || 0,
        folder: data.folder || folder
      };
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
      
      // Try Firebase function first
      if (!this.useVercelFallback) {
        try {
          const result = await this.getFoldersFunc({});
          return (result.data as any).folders || [];
        } catch (firebaseError: any) {
          console.warn('Firebase function failed, trying Vercel fallback...', firebaseError);
          this.useVercelFallback = true;
        }
      }
      
      // Fallback to Vercel API
      const auth = await import('./authService').then(m => m.auth);
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const idToken = await user.getIdToken();
      const response = await fetch('/api/email-folders', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
      });
      
      if (!response.ok) {
        throw new Error(`Vercel API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.folders || [];
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
      
      // Try Firebase function first
      if (!this.useVercelFallback) {
        try {
          const result = await this.sendEmailFunc(emailData);
          return result.data;
        } catch (firebaseError: any) {
          console.warn('Firebase function failed, trying Vercel fallback...', firebaseError);
          this.useVercelFallback = true;
        }
      }
      
      // Fallback to Vercel API
      const auth = await import('./authService').then(m => m.auth);
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : null;
      
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken && { 'Authorization': `Bearer ${idToken}` })
        },
        body: JSON.stringify(emailData)
      });
      
      if (!response.ok) {
        throw new Error(`Vercel API error: ${response.status}`);
      }
      
      return await response.json();
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
      console.log(`Marking email ${emailId} as ${isRead ? 'read' : 'unread'}`);
      
      const auth = await import('./authService').then(m => m.auth);
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const idToken = await user.getIdToken();
      const response = await fetch('/api/email-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          action: 'markAsRead',
          emailId,
          isRead
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
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
      
      const auth = await import('./authService').then(m => m.auth);
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const idToken = await user.getIdToken();
      const response = await fetch('/api/email-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          action: 'move',
          emailId,
          targetFolder
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
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
      
      const auth = await import('./authService').then(m => m.auth);
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const idToken = await user.getIdToken();
      const response = await fetch('/api/email-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          action: 'delete',
          emailId
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
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
      
      const auth = await import('./authService').then(m => m.auth);
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const idToken = await user.getIdToken();
      const params = new URLSearchParams({ query });
      if (folder) {
        params.append('folder', folder);
      }
      
      const response = await fetch(`/api/email-search?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error searching emails:', error);
      throw error;
    }
  }
}

export const emailClientService = new EmailClientService();