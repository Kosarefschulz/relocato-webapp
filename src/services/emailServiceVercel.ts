import { supabase } from '../config/supabase';
import { Email, Folder } from '../types/email';

interface EmailListResponse {
  emails: Email[];
  total: number;
  page: number;
  limit: number;
}

class EmailServiceVercel {
  private baseUrl: string;
  
  constructor() {
    // Use relative URLs for Vercel deployment
    this.baseUrl = '/api/email';
  }

  private async getAuthToken(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('User not authenticated');
    }
    
    return session.access_token;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.getAuthToken();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Get email folders
  async getFolders(): Promise<Folder[]> {
    const data = await this.request('/folders');
    return data.folders;
  }

  // Get emails from a folder
  async getEmails(params: {
    folder?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<EmailListResponse> {
    const queryParams = new URLSearchParams({
      folder: params.folder || 'INBOX',
      page: (params.page || 1).toString(),
      limit: (params.limit || 50).toString(),
      ...(params.search && { search: params.search }),
    });

    return this.request(`/list?${queryParams}`);
  }

  // Get a single email
  async getEmail(id: string, folder: string = 'INBOX'): Promise<Email> {
    const queryParams = new URLSearchParams({ id, folder });
    return this.request(`/read?${queryParams}`);
  }

  // Send an email
  async sendEmail(emailData: {
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: Array<{
      filename: string;
      content: string;
      contentType: string;
    }>;
    replyTo?: string;
  }): Promise<any> {
    return this.request('/send', {
      method: 'POST',
      body: JSON.stringify(emailData),
    });
  }

  // Mark email as read
  async markAsRead(id: string, folder: string = 'INBOX'): Promise<void> {
    await this.request('/mark-read', {
      method: 'POST',
      body: JSON.stringify({ id, folder }),
    });
  }

  // Mark email as unread
  async markAsUnread(id: string, folder: string = 'INBOX'): Promise<void> {
    await this.request('/mark-unread', {
      method: 'POST',
      body: JSON.stringify({ id, folder }),
    });
  }

  // Delete an email
  async deleteEmail(id: string, folder: string = 'INBOX'): Promise<void> {
    const queryParams = new URLSearchParams({ id, folder });
    await this.request(`/delete?${queryParams}`, {
      method: 'DELETE',
    });
  }

  // Move email to another folder
  async moveEmail(id: string, fromFolder: string, toFolder: string): Promise<void> {
    await this.request('/move', {
      method: 'POST',
      body: JSON.stringify({ id, fromFolder, toFolder }),
    });
  }

  // Star/unstar email
  async starEmail(id: string, folder: string, starred: boolean): Promise<void> {
    await this.request('/star', {
      method: 'POST',
      body: JSON.stringify({ id, folder, starred }),
    });
  }

  // Search emails
  async searchEmails(query: string, folder?: string): Promise<EmailListResponse> {
    return this.getEmails({ search: query, folder });
  }

  // Event emitter compatibility (for WebSocket replacement)
  on(event: string, callback: Function): void {
    // In Vercel, we'll use polling or server-sent events instead
    console.log(`Event listener registered for: ${event}`);
  }

  disconnect(): void {
    // No persistent connection to disconnect in Vercel
  }
}

export const emailService = new EmailServiceVercel();