import { Customer } from '../types';

export interface EmailThread {
  id: string;
  customerId: string;
  subject: string;
  messages: EmailMessage[];
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'archived';
}

export interface EmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  content: string;
  contentType: 'text' | 'html';
  timestamp: Date;
  direction: 'sent' | 'received';
  attachments?: EmailAttachment[];
  status: 'sent' | 'delivered' | 'read' | 'failed';
  messageId?: string;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  url?: string;
  content?: string; // base64 für kleine Dateien
}

export interface EmailAccount {
  id: string;
  email: string;
  name: string;
  imapServer: string;
  imapPort: number;
  smtpServer: string;
  smtpPort: number;
  username: string;
  password: string;
  useSSL: boolean;
  isDefault: boolean;
}

class EmailHistoryService {
  private threads: EmailThread[] = [];
  private messages: EmailMessage[] = [];
  private emailAccounts: EmailAccount[] = [];

  constructor() {
    this.loadFromStorage();
    this.initializeEmailAccounts();
  }

  // E-Mail-Konten initialisieren
  private initializeEmailAccounts() {
    if (this.emailAccounts.length === 0) {
      // Standard RELOCATO® E-Mail-Konto
      this.emailAccounts.push({
        id: 'relocato-bielefeld',
        email: 'bielefeld@relocato.de',
        name: 'RELOCATO® Bielefeld',
        imapServer: 'mail.your-server.de', // Wird über Umgebungsvariablen konfiguriert
        imapPort: 993,
        smtpServer: 'mail.your-server.de',
        smtpPort: 465,
        username: process.env.REACT_APP_EMAIL_USERNAME || 'bielefeld@relocato.de',
        password: process.env.REACT_APP_EMAIL_PASSWORD || '',
        useSSL: true,
        isDefault: true
      });
    }
  }

  // Speichern in LocalStorage (später durch echte Datenbank ersetzen)
  private saveToStorage() {
    localStorage.setItem('relocato_email_threads', JSON.stringify(this.threads));
    localStorage.setItem('relocato_email_messages', JSON.stringify(this.messages));
  }

  // Laden aus LocalStorage
  private loadFromStorage() {
    try {
      const threadsData = localStorage.getItem('relocato_email_threads');
      const messagesData = localStorage.getItem('relocato_email_messages');
      
      if (threadsData) {
        this.threads = JSON.parse(threadsData).map((thread: any) => ({
          ...thread,
          createdAt: new Date(thread.createdAt),
          updatedAt: new Date(thread.updatedAt)
        }));
      }
      
      if (messagesData) {
        this.messages = JSON.parse(messagesData).map((message: any) => ({
          ...message,
          timestamp: new Date(message.timestamp)
        }));
      }
    } catch (error) {
      console.error('Fehler beim Laden der E-Mail-Historie:', error);
    }
  }

  // Neue E-Mail senden und in Historie speichern
  async sendEmail(to: string, subject: string, content: string, customerId: string, attachments?: EmailAttachment[]): Promise<boolean> {
    try {
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const threadId = this.findOrCreateThread(customerId, subject);
      
      const message: EmailMessage = {
        id: messageId,
        threadId,
        from: this.emailAccounts[0].email,
        to: [to],
        subject,
        content,
        contentType: 'html',
        timestamp: new Date(),
        direction: 'sent',
        attachments,
        status: 'sent',
        messageId
      };

      // E-Mail über bestehenden Service senden
      const { sendEmail } = await import('./emailService');
      const success = await sendEmail({
        to,
        subject,
        content,
        attachments: attachments?.map(att => ({
          filename: att.filename,
          content: new Blob([att.content || ''], { type: att.contentType })
        }))
      });

      if (success) {
        this.messages.push(message);
        this.updateThread(threadId, message);
        this.saveToStorage();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Fehler beim Senden der E-Mail:', error);
      return false;
    }
  }

  // Thread finden oder erstellen
  private findOrCreateThread(customerId: string, subject: string): string {
    // Suche nach existierendem Thread mit ähnlichem Betreff
    let thread = this.threads.find(t => 
      t.customerId === customerId && 
      (t.subject === subject || this.isRelatedSubject(t.subject, subject))
    );

    if (!thread) {
      const threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      thread = {
        id: threadId,
        customerId,
        subject,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      };
      this.threads.push(thread);
    }

    return thread.id;
  }

  // Ähnliche Betreffs erkennen (Re:, Fwd:, etc.)
  private isRelatedSubject(subject1: string, subject2: string): boolean {
    const normalize = (s: string) => s.replace(/^(Re:|Fwd:|AW:|WG:)\s*/i, '').trim().toLowerCase();
    return normalize(subject1) === normalize(subject2);
  }

  // Thread aktualisieren
  private updateThread(threadId: string, message: EmailMessage) {
    const thread = this.threads.find(t => t.id === threadId);
    if (thread) {
      thread.updatedAt = new Date();
      thread.messages = this.getMessagesForThread(threadId);
    }
  }

  // E-Mail-Historie für Kunde abrufen
  getEmailHistoryForCustomer(customerId: string): EmailThread[] {
    return this.threads
      .filter(thread => thread.customerId === customerId)
      .map(thread => ({
        ...thread,
        messages: this.getMessagesForThread(thread.id)
      }))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  // Nachrichten für Thread abrufen
  getMessagesForThread(threadId: string): EmailMessage[] {
    return this.messages
      .filter(message => message.threadId === threadId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  // Empfangene E-Mail hinzufügen (würde normalerweise über IMAP-Sync kommen)
  addReceivedEmail(from: string, to: string, subject: string, content: string, customerId: string, timestamp?: Date): void {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const threadId = this.findOrCreateThread(customerId, subject);
    
    const message: EmailMessage = {
      id: messageId,
      threadId,
      from,
      to: [to],
      subject,
      content,
      contentType: 'html',
      timestamp: timestamp || new Date(),
      direction: 'received',
      status: 'read',
      messageId
    };

    this.messages.push(message);
    this.updateThread(threadId, message);
    this.saveToStorage();
  }

  // Statistiken für Dashboard
  getEmailStats(customerId?: string) {
    const relevantMessages = customerId 
      ? this.messages.filter(m => {
          const thread = this.threads.find(t => t.id === m.threadId);
          return thread?.customerId === customerId;
        })
      : this.messages;

    return {
      totalMessages: relevantMessages.length,
      sentMessages: relevantMessages.filter(m => m.direction === 'sent').length,
      receivedMessages: relevantMessages.filter(m => m.direction === 'received').length,
      activeThreads: this.threads.filter(t => 
        t.status === 'active' && (!customerId || t.customerId === customerId)
      ).length
    };
  }

  // Mock-Daten für Demo hinzufügen
  addMockData(customerId: string, customerEmail: string, customerName: string) {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Simuliere historische E-Mails
    this.addReceivedEmail(
      customerEmail,
      'bielefeld@relocato.de',
      'Anfrage für Umzug',
      `Hallo,\n\nich würde gerne ein Angebot für einen Umzug erhalten.\n\nMit freundlichen Grüßen\n${customerName}`,
      customerId,
      lastWeek
    );

    // Antwort gesendet
    const threadId = this.findOrCreateThread(customerId, 'Anfrage für Umzug');
    this.messages.push({
      id: `msg_demo_${Date.now()}`,
      threadId,
      from: 'bielefeld@relocato.de',
      to: [customerEmail],
      subject: 'Re: Anfrage für Umzug',
      content: `Sehr geehrte/r ${customerName},\n\nvielen Dank für Ihre Anfrage. Gerne erstellen wir Ihnen ein individuelles Angebot.\n\nMit freundlichen Grüßen\nIhr RELOCATO® Team Bielefeld`,
      contentType: 'html',
      timestamp: new Date(lastWeek.getTime() + 2 * 60 * 60 * 1000),
      direction: 'sent',
      status: 'delivered'
    });

    this.saveToStorage();
  }
}

export const emailHistoryService = new EmailHistoryService();