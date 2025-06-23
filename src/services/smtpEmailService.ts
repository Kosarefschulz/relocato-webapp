import emailHistoryService from './emailHistoryService';
import followUpService from './followUpService';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface EmailData {
  to: string;
  subject: string;
  content: string;
  attachments?: {
    filename: string;
    content: Blob;
  }[];
  bcc?: string; // Blindkopie für Gesendet-Ordner
  customerId?: string;
  customerName?: string;
  templateType?: string;
  quoteId?: string; // For follow-up scheduling
}

interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

class SMTPEmailService {
  private config: SMTPConfig;

  constructor() {
    // IONOS SMTP Konfiguration
    this.config = {
      host: process.env.REACT_APP_SMTP_HOST || 'smtp.ionos.de',
      port: parseInt(process.env.REACT_APP_SMTP_PORT || '587'),
      secure: process.env.REACT_APP_SMTP_SECURE === 'true', // true für 465, false für 587
      user: process.env.REACT_APP_SMTP_USER || '',
      pass: process.env.REACT_APP_SMTP_PASS || '',
      from: process.env.REACT_APP_SMTP_FROM || 'info@ihre-domain.de'
    };
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    // Da wir im Browser sind, müssen wir einen Backend-Endpunkt verwenden
    // Für die Entwicklung simulieren wir den E-Mail-Versand
    
    // Backend ist verfügbar - direkt zur E-Mail senden

    try {
      // Für Production: Backend-API Endpunkt aufrufen
      // Der würde dann Nodemailer mit IONOS SMTP verwenden
      
      const attachments = [];
      if (emailData.attachments) {
        for (const attachment of emailData.attachments) {
          const base64Content = await this.blobToBase64(attachment.content);
          attachments.push({
            filename: attachment.filename,
            content: base64Content,
            encoding: 'base64'
          });
        }
      }

      // API-URL für Vercel Hosting
      const API_URL = process.env.REACT_APP_API_URL || 'https://api.ruempel-schmiede.com';
      
      // E-Mail über Backend senden (einfaches Format)
      const response = await fetch(`${API_URL}/api/send-email`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        body: JSON.stringify({
          to: emailData.to,
          subject: emailData.subject,
          content: emailData.content,
          attachments: attachments,
          bcc: emailData.bcc || this.config.from // BCC an Absender für Gesendet-Ordner
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // E-Mail in Historie speichern
        if (emailData.customerId) {
          emailHistoryService.saveEmailRecord({
            customerId: emailData.customerId,
            customerName: emailData.customerName || '',
            to: emailData.to,
            subject: emailData.subject,
            templateType: emailData.templateType || 'custom',
            sentAt: new Date().toISOString(),
            status: 'sent'
          });

          // Schedule follow-ups based on email type
          this.scheduleFollowUps(emailData);
        }
        
        return true;
      } else {
        console.error('❌ E-Mail-Versand fehlgeschlagen:', result.error);
        
        // Fehlgeschlagene E-Mail in Historie speichern
        if (emailData.customerId) {
          emailHistoryService.saveEmailRecord({
            customerId: emailData.customerId,
            customerName: emailData.customerName || '',
            to: emailData.to,
            subject: emailData.subject,
            templateType: emailData.templateType || 'custom',
            sentAt: new Date().toISOString(),
            status: 'failed',
            errorMessage: result.error
          });
        }
        
        return false;
      }

    } catch (error) {
      console.error('❌ SMTP E-Mail-Versand Fehler:', error);
      return false;
    }
  }

  private async scheduleFollowUps(emailData: EmailData): Promise<void> {
    try {
      // Only schedule follow-ups for quote emails
      if (emailData.templateType === 'quote' && emailData.customerId && emailData.quoteId) {
        // Get customer data
        if (!db) return;
        
        const customerDoc = await getDoc(doc(db, 'customers', emailData.customerId));
        if (!customerDoc.exists()) return;
        
        const customer = { id: customerDoc.id, ...customerDoc.data() } as any;
        
        // Get quote data
        const quoteDoc = await getDoc(doc(db, 'quotes', emailData.quoteId));
        if (!quoteDoc.exists()) return;
        
        const quote = { id: quoteDoc.id, ...quoteDoc.data() } as any;
        
        // Schedule follow-ups
        await followUpService.scheduleFollowUp('quote_sent', customer, quote);
      }
    } catch (error) {
      console.error('Fehler beim Planen der Follow-ups:', error);
      // Don't throw - we don't want to fail the email send
    }
  }
}

const smtpEmailService = new SMTPEmailService();

export const sendEmailViaSMTP = smtpEmailService.sendEmail.bind(smtpEmailService);