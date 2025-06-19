// Simplified Email Client Service V2
import { auth } from '../config/firebase';

export interface Email {
  uid: number;
  seqno: number;
  flags: string[];
  from: string;
  to: string;
  subject: string;
  date: string;
  preview?: string;
  body?: string;
  attachments?: any[];
}

export interface SyncEmailsResult {
  success: boolean;
  emails?: Email[];
  count: number;
  folder: string;
}

class EmailClientServiceV2 {
  private baseUrl = '/api';
  
  async syncEmails(folder: string = 'INBOX', limit: number = 50): Promise<SyncEmailsResult> {
    try {
      console.log(`📧 Syncing emails from ${folder}...`);
      
      // Try v2 endpoint (mock data for now)
      let response = await fetch(`${this.baseUrl}/email-sync-v2?folder=${encodeURIComponent(folder)}&limit=${limit}`);
      
      if (!response.ok) {
        // Fallback to v1 endpoint
        response = await fetch(`${this.baseUrl}/email-sync?folder=${encodeURIComponent(folder)}&limit=${limit}`);
      }
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        success: true,
        emails: data.emails || [],
        count: data.count || 0,
        folder: data.folder || folder
      };
    } catch (error) {
      console.error('Error syncing emails:', error);
      return {
        success: false,
        count: 0,
        folder: folder
      };
    }
  }
  
  async sendEmail(emailData: {
    to: string;
    subject: string;
    body: string;
    attachments?: any[];
  }): Promise<{ success: boolean; messageId?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.body,
          attachments: emailData.attachments
        })
      });
      
      if (!response.ok) {
        throw new Error(`Send email error: ${response.status}`);
      }
      
      const result = await response.json();
      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false
      };
    }
  }
  
  async getFolders(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/email-folders`);
      
      if (!response.ok) {
        throw new Error(`Get folders error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.folders || ['INBOX', 'Sent', 'Drafts', 'Trash'];
    } catch (error) {
      console.error('Error getting folders:', error);
      return ['INBOX', 'Sent', 'Drafts', 'Trash'];
    }
  }
  
  async markAsRead(emailId: string, isRead: boolean): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/email-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: isRead ? 'markAsRead' : 'markAsUnread',
          emailId: emailId,
          isRead: isRead
        })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error marking email:', error);
      return false;
    }
  }
  
  async deleteEmail(emailId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/email-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'delete',
          emailId: emailId
        })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error deleting email:', error);
      return false;
    }
  }
  
  async searchEmails(query: string, folder: string = 'all'): Promise<Email[]> {
    try {
      const response = await fetch(`${this.baseUrl}/email-search?query=${encodeURIComponent(query)}&folder=${encodeURIComponent(folder)}`);
      
      if (!response.ok) {
        throw new Error(`Search error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.emails || [];
    } catch (error) {
      console.error('Error searching emails:', error);
      return [];
    }
  }
}

export const emailClientServiceV2 = new EmailClientServiceV2();