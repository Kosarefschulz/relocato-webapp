// Simplified Email Client Service V2 with Firestore option
import { auth } from '../config/firebase';
// import { emailClientServiceFirestore } from './emailClientServiceFirestore';

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

// Check if we should use Firestore mode
const USE_FIRESTORE = false; // Set to true to use Firestore, false for HTTP

class EmailClientServiceV2 {
  private baseUrl = '';
  
  constructor() {
    // Check if we're on Firebase hosting or local development
    const hostname = window.location.hostname;
    if (hostname.includes('firebaseapp.com') || hostname.includes('web.app')) {
      // Production: Use Firebase Functions
      this.baseUrl = 'https://europe-west3-umzugsapp.cloudfunctions.net';
    } else if (hostname === 'localhost') {
      // Development: Use local proxy
      this.baseUrl = '/api';
    } else {
      // Fallback: Try Firebase Functions
      this.baseUrl = 'https://europe-west3-umzugsapp.cloudfunctions.net';
    }
  }
  
  async syncEmails(folder: string = 'INBOX', limit: number = 50): Promise<SyncEmailsResult> {
    // Use Firestore service if enabled
    // if (USE_FIRESTORE) {
    //   return emailClientServiceFirestore.syncEmails(folder, limit);
    // }
    
    try {
      console.log(`📧 Syncing emails from ${folder}...`);
      
      let response;
      
      if (this.baseUrl.includes('cloudfunctions.net')) {
        // Firebase Functions endpoint - try multiple endpoints with fallback
        try {
          // First try the real sync endpoint
          response = await fetch(`${this.baseUrl}/emailSyncReal?folder=${encodeURIComponent(folder)}&limit=${limit}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          // If real sync fails or times out, try the v2 endpoint
          if (!response.ok) {
            console.log('📧 Real email sync failed, trying v2 endpoint...');
            response = await fetch(`${this.baseUrl}/emailSyncV2?folder=${encodeURIComponent(folder)}&limit=${limit}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
            });
          }
          
          // If v2 also fails, fall back to mock data
          if (!response.ok) {
            console.log('📧 V2 email sync failed, using mock data...');
            response = await fetch(`${this.baseUrl}/emailMock?folder=${encodeURIComponent(folder)}&limit=${limit}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
            });
          }
        } catch (error) {
          // On any network error, try mock endpoint as final fallback
          console.log('📧 Email sync error, falling back to mock data...');
          try {
            response = await fetch(`${this.baseUrl}/emailMock?folder=${encodeURIComponent(folder)}&limit=${limit}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
            });
          } catch (mockError) {
            console.error('Even mock endpoint failed:', mockError);
            throw mockError;
          }
        }
      } else {
        // Local development endpoint
        response = await fetch(`${this.baseUrl}/email-sync-v2?folder=${encodeURIComponent(folder)}&limit=${limit}`);
        
        if (!response.ok) {
          // Fallback to v1 endpoint
          response = await fetch(`${this.baseUrl}/email-sync?folder=${encodeURIComponent(folder)}&limit=${limit}`);
        }
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
    // Use Firestore service if enabled
    if (USE_FIRESTORE) {
      // return emailClientServiceFirestore.getFolders();
      return ['INBOX', 'Sent', 'Drafts', 'Trash'];
    }
    
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
    // Use Firestore service if enabled
    if (USE_FIRESTORE) {
      // return emailClientServiceFirestore.markAsRead(emailId, isRead);
      return false;
    }
    
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
    // Use Firestore service if enabled
    if (USE_FIRESTORE) {
      // return emailClientServiceFirestore.deleteEmail(emailId);
      return false;
    }
    
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
    // Use Firestore service if enabled
    if (USE_FIRESTORE) {
      // return emailClientServiceFirestore.searchEmails(query, folder);
      return [];
    }
    
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