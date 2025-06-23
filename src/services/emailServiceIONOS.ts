// IONOS Email Service - nutzt die funktionierende IONOS-Konfiguration

// Import types from email.ts
import { Email as EmailType, Folder } from '../types/email';

// Simplified email for API responses
interface SimpleEmail {
  id: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  body?: string;
  html?: string;
  flags: string[];
  folder: string;
  attachments?: any[];
}

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

class IONOSEmailService {
  private baseUrl: string = '/api/email';

  // Get folders
  async getFolders(): Promise<Folder[]> {
    try {
      console.log('📁 Fetching folders...');
      const response = await fetch(`${this.baseUrl}/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        console.error('❌ Folders API error:', response.status, response.statusText);
        throw new Error('Failed to get folders');
      }
      
      const data = await response.json();
      console.log('📂 Folders API response:', data);
      // Map to Folder type with proper specialUse
      return (data.folders || []).map((folder: any) => ({
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
      return [];
    }
  }

  // Get emails
  async getEmails(folder: string = 'INBOX', page: number = 1, limit: number = 50): Promise<{ emails: EmailType[], total: number }> {
    try {
      console.log('📧 Fetching emails:', { folder, page, limit });
      const response = await fetch(`${this.baseUrl}/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder, page, limit })
      });
      
      if (!response.ok) {
        console.error('❌ Email API error:', response.status, response.statusText);
        throw new Error('Failed to get emails');
      }
      
      const data = await response.json();
      console.log('📬 Email API response:', data);
      // Convert API response to EmailType
      const emails: EmailType[] = (data.emails || []).map((email: any) => ({
        id: email.id,
        uid: email.id,
        folder: email.folder,
        from: email.from || { address: 'unknown@email.com', name: 'Unknown' },
        to: email.to || [],
        cc: email.cc || [],
        subject: email.subject || '',
        date: email.date,
        text: email.text || email.body,
        html: email.html,
        snippet: email.snippet || '',
        flags: email.flags || [],
        attachments: email.attachments || []
      }));
      
      return {
        emails,
        total: data.total || 0
      };
    } catch (error) {
      console.error('Error getting emails:', error);
      return { emails: [], total: 0 };
    }
  }

  // Get single email
  async getEmail(uid: string, folder: string = 'INBOX'): Promise<EmailType | null> {
    try {
      const response = await fetch(`${this.baseUrl}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, folder })
      });
      
      if (!response.ok) throw new Error('Failed to get email');
      
      const data = await response.json();
      if (!data.email) return null;
      
      const email = data.email;
      // Convert to EmailType
      return {
        id: email.id,
        uid: email.id,
        folder: email.folder,
        from: email.from || { address: 'unknown@email.com', name: 'Unknown' },
        to: email.to || [],
        cc: email.cc || [],
        subject: email.subject || '',
        date: email.date,
        text: email.text || email.body,
        html: email.html,
        snippet: email.snippet || '',
        flags: email.flags || [],
        attachments: email.attachments || []
      };
    } catch (error) {
      console.error('Error getting email, returning mock data:', error);
      
      // Return mock email data with full content
      return {
        id: uid,
        uid: uid,
        folder: folder,
        from: { address: 'noreply@clockin.de', name: 'Neue Korrektur' },
        to: [{ address: 'bielefeld@relocato.de', name: 'Relocato Bielefeld' }],
        cc: [],
        subject: 'Neue Korrektur',
        date: new Date().toISOString(),
        text: `Dies ist eine Demo-E-Mail.
        
Der E-Mail-Server ist derzeit nicht erreichbar, daher wird dieser Beispielinhalt angezeigt.

Um die vollständige E-Mail-Funktionalität zu nutzen, stellen Sie sicher, dass:
1. Der E-Mail-Server läuft (npm run start:email)
2. Die API-Endpunkte korrekt konfiguriert sind
3. Die IONOS-Zugangsdaten in der .env Datei hinterlegt sind

Mit freundlichen Grüßen
Ihr Relocato Team`,
        html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Dies ist eine Demo-E-Mail</h2>
          <p>Der E-Mail-Server ist derzeit nicht erreichbar, daher wird dieser Beispielinhalt angezeigt.</p>
          <p>Um die vollständige E-Mail-Funktionalität zu nutzen, stellen Sie sicher, dass:</p>
          <ol>
            <li>Der E-Mail-Server läuft (npm run start:email)</li>
            <li>Die API-Endpunkte korrekt konfiguriert sind</li>
            <li>Die IONOS-Zugangsdaten in der .env Datei hinterlegt sind</li>
          </ol>
          <p>Mit freundlichen Grüßen<br>Ihr Relocato Team</p>
        </div>`,
        snippet: 'Dies ist eine Demo-E-Mail...',
        flags: ['SEEN'],
        attachments: [
          {
            filename: 'beispiel.pdf',
            size: 1024,
            contentType: 'application/pdf'
          }
        ]
      };
    }
  }

  // Send email
  async sendEmail(to: string, subject: string, content: string, attachments?: any[]): Promise<boolean> {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          subject,
          content,
          html: content,
          attachments
        })
      });
      
      if (!response.ok) throw new Error('Failed to send email');
      
      const data = await response.json();
      return data.success || false;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  // Mark as read
  async markAsRead(uid: string, folder: string = 'INBOX'): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, folder })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error marking as read:', error);
      return false;
    }
  }

  // Mark as unread
  async markAsUnread(uid: string, folder: string = 'INBOX'): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/mark-unread`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, folder })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error marking as unread:', error);
      return false;
    }
  }

  // Delete email
  async deleteEmail(uid: string, folder: string = 'INBOX'): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, folder })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error deleting email:', error);
      return false;
    }
  }

  // Move email
  async moveEmail(uid: string, fromFolder: string, toFolder: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, fromFolder, toFolder })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error moving email:', error);
      return false;
    }
  }

  // Star/unstar email
  async toggleStar(uid: string, folder: string = 'INBOX', starred: boolean): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/star`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, folder, starred })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error toggling star:', error);
      return false;
    }
  }

  // Search emails
  async searchEmails(query: string, folder: string = 'INBOX'): Promise<EmailType[]> {
    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, folder })
      });
      
      if (!response.ok) throw new Error('Failed to search emails');
      
      const data = await response.json();
      return data.emails || [];
    } catch (error) {
      console.error('Error searching emails:', error);
      return [];
    }
  }

  // Event handlers (for compatibility)
  on(event: string, callback: Function) {
    console.log('Event listeners not implemented in IONOS service');
  }

  off(event: string, callback: Function) {
    console.log('Event listeners not implemented in IONOS service');
  }

  disconnect() {
    console.log('No persistent connection to disconnect');
  }
}

export const ionosEmailService = new IONOSEmailService();