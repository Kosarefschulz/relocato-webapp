// IONOS Email Service - nutzt Supabase für alle E-Mail-Operationen

// Import types from email.ts
import { Email as EmailType, Folder } from '../types/email';
import { supabase } from '../config/supabase';

// Helper function to map folder names to specialUse
function mapSpecialUse(name: string, specialUse?: string): 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | null {
  const lowerName = name.toLowerCase();
  
  if (specialUse) {
    const lowerSpecial = specialUse.toLowerCase();
    if (lowerSpecial === 'inbox' || lowerSpecial === '\\inbox') return 'inbox';
    if (lowerSpecial === 'sent' || lowerSpecial === '\\sent') return 'sent';
    if (lowerSpecial === 'drafts' || lowerSpecial === '\\drafts') return 'drafts';
    if (lowerSpecial === 'trash' || lowerSpecial === '\\trash') return 'trash';
    if (lowerSpecial === 'spam' || lowerSpecial === '\\spam' || lowerSpecial === 'junk') return 'spam';
  }
  
  // Fallback to name matching
  if (lowerName === 'inbox') return 'inbox';
  if (lowerName === 'sent' || lowerName === 'sent items' || lowerName === 'gesendet') return 'sent';
  if (lowerName === 'drafts' || lowerName === 'entwürfe') return 'drafts';
  if (lowerName === 'trash' || lowerName === 'papierkorb' || lowerName === 'deleted') return 'trash';
  if (lowerName === 'spam' || lowerName === 'junk') return 'spam';
  
  return null;
}

// Helper function to parse email addresses
function parseEmailAddress(emailStr: string | any): { name?: string; address: string } {
  if (typeof emailStr === 'object' && emailStr !== null) {
    return emailStr;
  }
  
  if (typeof emailStr !== 'string') {
    return { address: 'unknown@unknown.com' };
  }
  
  // Parse "Name <email@example.com>" format
  const match = emailStr.match(/^(.+)\s*<(.+)>$/);
  if (match) {
    return { name: match[1].trim(), address: match[2].trim() };
  }
  
  // Just an email address
  return { address: emailStr.trim() };
}

class IONOSEmailService {
  constructor() {
    console.log('📧 IONOS Email Service initialized with Vercel/Supabase backend');
  }

  // Get folders - try Vercel API first, then Supabase
  async getFolders(): Promise<Folder[]> {
    try {
      console.log('📁 Fetching folders via Vercel API...');
      
      // Try Vercel API first for direct IMAP
      const response = await fetch('/api/email-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'folders' })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.folders) {
          console.log('✅ Got folders from Vercel IMAP');
          return data.folders.map((folder: any) => ({
            name: folder.name,
            path: folder.path,
            delimiter: folder.delimiter || '/',
            flags: folder.flags || [],
            level: folder.level || 0,
            hasChildren: folder.hasChildren || false,
            specialUse: mapSpecialUse(folder.name, folder.specialUse),
            unreadCount: folder.unreadCount || 0,
            totalCount: folder.totalCount || 0
          }));
        }
      }
      
      console.log('⚠️ Vercel API failed, trying Supabase...');
      
      // Fall back to Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('email-folders', {
        method: 'GET'
      });

      if (error) {
        console.error('❌ Error fetching folders:', error);
        // Return default folders as fallback
        return [
          { name: 'INBOX', path: 'INBOX', delimiter: '/', flags: [], level: 0, hasChildren: false, specialUse: 'inbox', unreadCount: 0, totalCount: 0 },
          { name: 'Sent', path: 'Sent', delimiter: '/', flags: [], level: 0, hasChildren: false, specialUse: 'sent', unreadCount: 0, totalCount: 0 },
          { name: 'Drafts', path: 'Drafts', delimiter: '/', flags: [], level: 0, hasChildren: false, specialUse: 'drafts', unreadCount: 0, totalCount: 0 },
          { name: 'Trash', path: 'Trash', delimiter: '/', flags: [], level: 0, hasChildren: false, specialUse: 'trash', unreadCount: 0, totalCount: 0 },
          { name: 'Spam', path: 'Spam', delimiter: '/', flags: [], level: 0, hasChildren: false, specialUse: 'spam', unreadCount: 0, totalCount: 0 }
        ];
      }
      
      // Map to Folder type with proper specialUse
      return (data?.folders || []).map((folder: any) => ({
        name: folder.name,
        path: folder.path,
        delimiter: folder.delimiter || '/',
        flags: folder.flags || [],
        level: folder.level || 0,
        hasChildren: folder.hasChildren || false,
        specialUse: mapSpecialUse(folder.name, folder.specialUse),
        unreadCount: folder.unreadCount || 0,
        totalCount: folder.totalCount || 0
      }));
    } catch (error) {
      console.error('Error getting folders:', error);
      // Return default folders as fallback
      return [
        { name: 'INBOX', path: 'INBOX', delimiter: '/', flags: [], level: 0, hasChildren: false, specialUse: 'inbox', unreadCount: 0, totalCount: 0 },
        { name: 'Sent', path: 'Sent', delimiter: '/', flags: [], level: 0, hasChildren: false, specialUse: 'sent', unreadCount: 0, totalCount: 0 },
        { name: 'Drafts', path: 'Drafts', delimiter: '/', flags: [], level: 0, hasChildren: false, specialUse: 'drafts', unreadCount: 0, totalCount: 0 },
        { name: 'Trash', path: 'Trash', delimiter: '/', flags: [], level: 0, hasChildren: false, specialUse: 'trash', unreadCount: 0, totalCount: 0 },
        { name: 'Spam', path: 'Spam', delimiter: '/', flags: [], level: 0, hasChildren: false, specialUse: 'spam', unreadCount: 0, totalCount: 0 }
      ];
    }
  }

  // Get emails - try Vercel API first, then Supabase
  async getEmails(folder: string = 'INBOX', page: number = 1, limit: number = 50): Promise<{ emails: EmailType[], total: number }> {
    try {
      console.log('📧 Fetching emails via Vercel API:', { folder, page, limit });
      
      // Try Vercel API first for direct IMAP
      const response = await fetch('/api/email-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'list', folder, page, limit })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.emails) {
          console.log('✅ Got emails from Vercel IMAP:', { count: data.emails.length });
          return this.transformEmailResponse(data, folder);
        }
      }
      
      console.log('⚠️ Vercel API failed, trying Supabase...');
      
      // Try database first, fallback to IMAP
      const { data, error } = await supabase.functions.invoke('email-list-db', {
        body: { folder, page, limit }
      });

      if (error) {
        console.error('📊 Database failed, trying IMAP...', error);
        // If database fails, try IMAP
        const { data: imapData, error: imapError } = await supabase.functions.invoke('email-list', {
          body: { folder, page, limit }
        });
        
        if (imapError) {
          console.error('❌ IMAP also failed:', imapError);
          return { emails: [], total: 0 };
        }
        
        console.log('📬 IMAP Email response:', { count: imapData?.emails?.length || 0 });
        return this.transformEmailResponse(imapData, folder);
      }
      
      console.log('📬 Database Email response:', { count: data?.emails?.length || 0 });
      return this.transformEmailResponse(data, folder);
    } catch (error) {
      console.error('Error getting emails:', error);
      return { emails: [], total: 0 };
    }
  }

  // Get single email - try Vercel API first, then Supabase
  async getEmail(uid: string, folder: string = 'INBOX'): Promise<EmailType | null> {
    try {
      console.log('📧 Fetching single email via Vercel API:', { uid, folder });
      
      // Try Vercel API first for direct IMAP
      const response = await fetch('/api/email-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'read', uid, folder })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.email) {
          console.log('✅ Got email from Vercel IMAP');
          const email = data.email;
          return {
            id: email.uid || email.id,
            uid: email.uid || email.id,
            folder: email.folder || folder,
            from: parseEmailAddress(email.from),
            to: Array.isArray(email.to) ? email.to.map((addr: any) => parseEmailAddress(addr)) : [],
            cc: email.cc || [],
            subject: email.subject || '',
            date: email.date,
            text: email.text || email.body,
            html: email.html,
            textAsHtml: email.textAsHtml || (email.body ? `<pre>${email.body}</pre>` : undefined),
            snippet: email.snippet || '',
            flags: email.flags || [],
            attachments: email.attachments || []
          };
        }
      }
      
      console.log('⚠️ Vercel API failed, trying Supabase...');
      
      const { data, error } = await supabase.functions.invoke('email-read', {
        body: { uid, folder }
      });

      if (error) {
        console.error('❌ Error fetching email:', error);
        return null;
      }
      
      if (!data?.email) return null;
      
      const email = data.email;
      // Convert to EmailType
      return {
        id: email.uid || email.id,
        uid: email.uid || email.id,
        folder: email.folder || folder,
        from: parseEmailAddress(email.from),
        to: Array.isArray(email.to) ? email.to.map((addr: string) => parseEmailAddress(addr)) : [],
        cc: email.cc || [],
        subject: email.subject || '',
        date: email.date,
        text: email.text || email.body,
        html: email.html,
        textAsHtml: email.textAsHtml || (email.body ? `<pre>${email.body}</pre>` : undefined),
        snippet: email.snippet || '',
        flags: email.flags || [],
        attachments: email.attachments || []
      };
    } catch (error) {
      console.error('Error getting email:', error);
      return null;
    }
  }

  // Send email via Supabase
  async sendEmail(to: string, subject: string, content: string, attachments?: any[]): Promise<boolean> {
    try {
      console.log('📧 Sending email via Supabase...');
      
      // Use new function that also stores in database
      const { data, error } = await supabase.functions.invoke('email-send-and-store', {
        body: {
          to,
          subject,
          content,
          html: content,
          attachments
        }
      });

      if (error) {
        console.error('❌ Error sending email:', error);
        return false;
      }
      
      return data?.success || false;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  // Mark as read - try Vercel first, then Supabase
  async markAsRead(uid: string, folder: string = 'INBOX'): Promise<boolean> {
    try {
      // Try Vercel API first
      const response = await fetch('/api/email-mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, folder, read: true })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('✅ Marked as read via Vercel');
          return true;
        }
      }

      // Fall back to Supabase
      const { data, error } = await supabase.functions.invoke('email-mark-read', {
        body: { uid, folder, read: true }
      });

      if (error) {
        console.error('❌ Error marking as read:', error);
        return false;
      }
      
      return data?.success || false;
    } catch (error) {
      console.error('Error marking as read:', error);
      return false;
    }
  }

  // Mark as unread - try Vercel first, then Supabase
  async markAsUnread(uid: string, folder: string = 'INBOX'): Promise<boolean> {
    try {
      // Try Vercel API first
      const response = await fetch('/api/email-mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, folder, read: false })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('✅ Marked as unread via Vercel');
          return true;
        }
      }

      // Fall back to Supabase
      const { data, error } = await supabase.functions.invoke('email-mark-read', {
        body: { uid, folder, read: false }
      });

      if (error) {
        console.error('❌ Error marking as unread:', error);
        return false;
      }
      
      return data?.success || false;
    } catch (error) {
      console.error('Error marking as unread:', error);
      return false;
    }
  }

  // Delete email - try Vercel first, then Supabase
  async deleteEmail(uid: string, folder: string = 'INBOX'): Promise<boolean> {
    try {
      // Try Vercel API first
      const response = await fetch('/api/email-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', emailId: uid, folder })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('✅ Email deleted via Vercel');
          return true;
        }
      }

      // Fall back to Supabase
      const { data, error } = await supabase.functions.invoke('email-delete', {
        body: { uid, folder }
      });

      if (error) {
        console.error('❌ Error deleting email:', error);
        return false;
      }
      
      return data?.success || false;
    } catch (error) {
      console.error('Error deleting email:', error);
      return false;
    }
  }

  // Move email via Supabase
  async moveEmail(uid: string, fromFolder: string, toFolder: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('email-move', {
        body: { uid, fromFolder, toFolder }
      });

      if (error) {
        console.error('❌ Error moving email:', error);
        return false;
      }
      
      return data?.success || false;
    } catch (error) {
      console.error('Error moving email:', error);
      return false;
    }
  }

  // Star/unstar email via Supabase
  async toggleStar(uid: string, folder: string = 'INBOX', starred: boolean): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('email-star', {
        body: { uid, folder, starred }
      });

      if (error) {
        console.error('❌ Error toggling star:', error);
        return false;
      }
      
      return data?.success || false;
    } catch (error) {
      console.error('Error toggling star:', error);
      return false;
    }
  }

  // Search emails via Supabase
  async searchEmails(query: string, folder: string = 'INBOX'): Promise<EmailType[]> {
    try {
      const { data, error } = await supabase.functions.invoke('email-search', {
        body: { query, folder }
      });

      if (error) {
        console.error('❌ Error searching emails:', error);
        return [];
      }
      
      // Transform search results
      return (data?.emails || []).map((email: any) => ({
        id: email.uid || email.id,
        uid: email.uid || email.id,
        folder: email.folder || folder,
        from: parseEmailAddress(email.from),
        to: Array.isArray(email.to) ? email.to.map((addr: string) => parseEmailAddress(addr)) : [],
        cc: email.cc || [],
        subject: email.subject || '',
        date: email.date,
        text: email.text || email.body,
        html: email.html,
        snippet: email.snippet || '',
        flags: email.flags || [],
        attachments: email.attachments || []
      }));
    } catch (error) {
      console.error('Error searching emails:', error);
      return [];
    }
  }

  // Event handlers (for compatibility)
  on(event: string, callback: Function) {
    console.log('Event listeners not implemented in Supabase service');
  }

  off(event: string, callback: Function) {
    console.log('Event listeners not implemented in Supabase service');
  }

  disconnect() {
    console.log('No persistent connection to disconnect');
  }

  // Helper method to transform email response
  private transformEmailResponse(data: any, folder: string): { emails: EmailType[], total: number } {
    const transformedEmails = (data?.emails || []).map((email: any) => ({
      id: email.uid || email.id,
      uid: email.uid || email.id,
      folder: folder,
      subject: email.subject || 'No subject',
      from: parseEmailAddress(email.from),
      to: Array.isArray(email.to) ? email.to.map((addr: string) => parseEmailAddress(addr)) : [],
      cc: email.cc || [],
      date: email.date,
      text: email.body || email.text,
      html: email.html,
      textAsHtml: email.body ? `<pre>${email.body}</pre>` : undefined,
      preview: email.preview || email.snippet,
      flags: email.flags || [],
      attachments: email.attachments || []
    }));
    
    return {
      emails: transformedEmails,
      total: data?.total || transformedEmails.length
    };
  }
}

export const ionosEmailService = new IONOSEmailService();