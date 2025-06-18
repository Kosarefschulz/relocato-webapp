// Service für E-Mail-Historie
export interface EmailRecord {
  id: string;
  customerId: string;
  customerName: string;
  to: string;
  subject: string;
  templateType: string;
  sentAt: string;
  status: 'sent' | 'failed';
  errorMessage?: string;
}

class EmailHistoryService {
  private readonly STORAGE_KEY = 'emailHistory';

  // E-Mail-Record speichern
  saveEmailRecord(record: Omit<EmailRecord, 'id'>) {
    const history = this.getEmailHistory();
    const newRecord: EmailRecord = {
      ...record,
      id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    history.unshift(newRecord); // Neueste zuerst
    
    // Behalte nur die letzten 1000 E-Mails
    if (history.length > 1000) {
      history.splice(1000);
    }
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    return newRecord;
  }

  // Alle E-Mail-Records abrufen
  getEmailHistory(): EmailRecord[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Fehler beim Laden der E-Mail-Historie:', error);
      return [];
    }
  }

  // E-Mail-Records für einen Kunden abrufen
  getCustomerEmails(customerId: string): EmailRecord[] {
    const history = this.getEmailHistory();
    return history.filter(record => record.customerId === customerId);
  }

  // E-Mail-Records nach Template-Typ filtern
  getEmailsByTemplate(templateType: string): EmailRecord[] {
    const history = this.getEmailHistory();
    return history.filter(record => record.templateType === templateType);
  }

  // Statistiken abrufen
  getEmailStats() {
    const history = this.getEmailHistory();
    const stats = {
      total: history.length,
      sent: history.filter(r => r.status === 'sent').length,
      failed: history.filter(r => r.status === 'failed').length,
      byTemplate: {} as Record<string, number>,
      last24Hours: 0,
      last7Days: 0,
      last30Days: 0
    };

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    history.forEach(record => {
      // Template-Statistiken
      stats.byTemplate[record.templateType] = (stats.byTemplate[record.templateType] || 0) + 1;
      
      // Zeit-Statistiken
      const sentTime = new Date(record.sentAt).getTime();
      if (now - sentTime <= day) stats.last24Hours++;
      if (now - sentTime <= 7 * day) stats.last7Days++;
      if (now - sentTime <= 30 * day) stats.last30Days++;
    });

    return stats;
  }

  // Historie löschen (optional)
  clearHistory() {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Add received email record
  addReceivedEmail(
    from: string,
    to: string,
    subject: string,
    customerId: string,
    customerName: string,
    date: Date = new Date()
  ) {
    const record: Omit<EmailRecord, 'id'> = {
      customerId,
      customerName,
      to: from, // In received emails, 'to' is the sender
      subject,
      templateType: 'received',
      sentAt: date.toISOString(),
      status: 'sent'
    };
    
    this.saveEmailRecord(record);
  }

  // Send email and record in history
  sendEmail(
    to: string,
    subject: string,
    content: string,
    customerId: string,
    attachments?: any[]
  ) {
    // This method is for compatibility - just save the record
    const customerName = 'Unknown'; // Would need to be passed in or looked up
    const record: Omit<EmailRecord, 'id'> = {
      customerId,
      customerName,
      to,
      subject,
      templateType: 'custom',
      sentAt: new Date().toISOString(),
      status: 'sent'
    };
    
    this.saveEmailRecord(record);
  }
}

const emailHistoryService = new EmailHistoryService();
export default emailHistoryService;