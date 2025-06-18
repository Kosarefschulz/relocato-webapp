import emailHistoryService from './emailHistoryService';

export interface EmailMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: Date;
  attachments?: any[];
}

export interface EmailSyncConfig {
  enabled: boolean;
  imapServer: string;
  imapPort: number;
  smtpServer: string;
  smtpPort: number;
  username: string;
  password: string;
  useSSL: boolean;
  syncInterval: number; // in Minuten
  lastSync?: Date;
}

class EmailSyncService {
  private config: EmailSyncConfig;
  private syncTimer?: NodeJS.Timeout;
  private isManualSync = false;

  constructor() {
    this.config = {
      enabled: false,
      imapServer: process.env.REACT_APP_IMAP_SERVER || 'mail.your-server.de',
      imapPort: parseInt(process.env.REACT_APP_IMAP_PORT || '993'),
      smtpServer: process.env.REACT_APP_SMTP_SERVER || 'mail.your-server.de', 
      smtpPort: parseInt(process.env.REACT_APP_SMTP_PORT || '465'),
      username: process.env.REACT_APP_EMAIL_USERNAME || '',
      password: process.env.REACT_APP_EMAIL_PASSWORD || '',
      useSSL: true,
      syncInterval: 15, // Alle 15 Minuten
      lastSync: undefined
    };

    // Nur aktivieren wenn Zugangsdaten vorhanden
    if (this.config.username && this.config.password) {
      this.config.enabled = true;
      this.startAutoSync();
    }
  }

  // Automatische Synchronisation starten
  private startAutoSync() {
    if (!this.config.enabled) return;

    // Initialer Sync nach 5 Sekunden
    setTimeout(() => this.syncEmails(), 5000);

    // Periodischer Sync
    this.syncTimer = setInterval(() => {
      this.syncEmails();
    }, this.config.syncInterval * 60 * 1000);
  }

  // Automatische Synchronisation stoppen
  stopAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }
  }

  // Manuelle E-Mail-Synchronisation
  async syncEmails(): Promise<{ success: boolean; newMessages: number; error?: string }> {
    if (!this.config.enabled) {
      return { success: false, newMessages: 0, error: 'E-Mail-Sync nicht konfiguriert' };
    }

    try {
      console.log('🔄 Starte E-Mail-Synchronisation...');

      // Da Browser keine direkten IMAP-Verbindungen unterstützen,
      // verwenden wir einen Backend-API-Call
      const API_URL = process.env.REACT_APP_API_URL || 'https://api.ruempel-schmiede.com';
      
      const response = await fetch(`${API_URL}/api/sync-emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        body: JSON.stringify({
          imapServer: this.config.imapServer,
          imapPort: this.config.imapPort,
          username: this.config.username,
          password: this.config.password,
          useSSL: this.config.useSSL,
          lastSync: this.config.lastSync?.toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`API-Fehler: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.emails) {
        let newMessageCount = 0;

        // Verarbeite empfangene E-Mails
        for (const emailData of data.emails) {
          // Versuche Kunde anhand E-Mail-Adresse zu identifizieren
          const customerId = await this.findCustomerByEmail(emailData.from);
          
          if (customerId) {
            emailHistoryService.addReceivedEmail(
              emailData.from,
              emailData.to,
              emailData.subject,
              emailData.content,
              customerId,
              new Date(emailData.date)
            );
            newMessageCount++;
          }
        }

        this.config.lastSync = new Date();
        this.saveConfig();

        console.log(`✅ E-Mail-Sync abgeschlossen: ${newMessageCount} neue Nachrichten`);
        return { success: true, newMessages: newMessageCount };
      }

      return { success: false, newMessages: 0, error: 'Keine neuen E-Mails' };

    } catch (error) {
      console.error('❌ E-Mail-Sync Fehler:', error);
      return { 
        success: false, 
        newMessages: 0, 
        error: error instanceof Error ? error.message : 'Unbekannter Fehler' 
      };
    }
  }

  // Kunde anhand E-Mail-Adresse finden
  private async findCustomerByEmail(email: string): Promise<string | null> {
    try {
      // Hier würde normalerweise eine Datenbankabfrage erfolgen
      // Für jetzt verwenden wir Google Sheets
      const { googleSheetsPublicService } = await import('./googleSheetsPublic');
      const customers = await googleSheetsPublicService.getCustomers();
      
      const customer = customers.find(c => 
        c.email && c.email.toLowerCase() === email.toLowerCase()
      );
      
      return customer?.id || null;
    } catch (error) {
      console.error('Fehler beim Suchen des Kunden:', error);
      return null;
    }
  }

  // Konfiguration speichern
  private saveConfig() {
    try {
      const configToSave = { ...this.config };
      // Passwort nicht im LocalStorage speichern
      delete (configToSave as any).password;
      localStorage.setItem('relocato_email_sync_config', JSON.stringify(configToSave));
    } catch (error) {
      console.error('Fehler beim Speichern der Sync-Konfiguration:', error);
    }
  }

  // E-Mail über SMTP senden (mit Backup in lokaler Historie)
  async sendEmailViaSMTP(
    to: string,
    subject: string,
    content: string,
    customerId: string,
    attachments?: { filename: string; content: string }[]
  ): Promise<boolean> {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'https://api.ruempel-schmiede.com';
      
      const response = await fetch(`${API_URL}/api/send-email-smtp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        body: JSON.stringify({
          smtpServer: this.config.smtpServer,
          smtpPort: this.config.smtpPort,
          username: this.config.username,
          password: this.config.password,
          useSSL: this.config.useSSL,
          to,
          subject,
          content,
          attachments
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // E-Mail in lokaler Historie speichern
        await emailHistoryService.sendEmail(to, subject, content, customerId, attachments?.map(att => ({
          id: `att_${Date.now()}`,
          filename: att.filename,
          contentType: 'application/octet-stream',
          size: att.content.length,
          content: att.content
        })));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('SMTP-Versand Fehler:', error);
      return false;
    }
  }

  // Status und Statistiken
  getStatus() {
    return {
      enabled: this.config.enabled,
      lastSync: this.config.lastSync,
      autoSyncActive: !!this.syncTimer,
      nextSync: this.syncTimer && this.config.lastSync 
        ? new Date(this.config.lastSync.getTime() + this.config.syncInterval * 60 * 1000)
        : null
    };
  }

  // Konfiguration aktualisieren
  updateConfig(newConfig: Partial<EmailSyncConfig>) {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.enabled && this.config.username && this.config.password) {
      this.stopAutoSync();
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }
    
    this.saveConfig();
  }

  // Demo-Modus: Simuliere eingehende E-Mails
  simulateIncomingEmail(customerId: string, customerEmail: string, customerName: string) {
    const demoEmails = [
      {
        subject: 'Rückfrage zum Umzugstermin',
        content: `Hallo,\n\nkönnen wir den Umzugstermin eventuell um eine Woche verschieben?\n\nViele Grüße\n${customerName}`
      },
      {
        subject: 'Zusätzliche Services gewünscht',
        content: `Guten Tag,\n\nich hätte gerne noch zusätzlich das Einpackservice dazu gebucht. Ist das möglich?\n\nMit freundlichen Grüßen\n${customerName}`
      },
      {
        subject: 'Dankeschön für das Angebot',
        content: `Liebe RELOCATO® Team,\n\nvielen Dank für das schnelle Angebot! Wir werden uns zeitnah melden.\n\nBeste Grüße\n${customerName}`
      }
    ];

    const randomEmail = demoEmails[Math.floor(Math.random() * demoEmails.length)];
    
    emailHistoryService.addReceivedEmail(
      customerEmail,
      'bielefeld@relocato.de',
      randomEmail.subject,
      randomEmail.content,
      customerId,
      new Date()
    );

    console.log('📧 Demo-E-Mail simuliert:', randomEmail.subject);
  }
}

export const emailSyncService = new EmailSyncService();