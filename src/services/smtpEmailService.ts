import emailHistoryService from './emailHistoryService';

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
    console.log('🚀 Backend erkannt - sende echte E-Mail...');

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

      console.log('📮 Sende E-Mail via IONOS SMTP...');
      console.log('Von:', this.config.from);
      console.log('An:', emailData.to);
      console.log('Betreff:', emailData.subject);
      
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
        console.log('✅ E-Mail erfolgreich gesendet via IONOS SMTP');
        console.log('Message ID:', result.messageId);
        
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
}

const smtpEmailService = new SMTPEmailService();

export const sendEmailViaSMTP = smtpEmailService.sendEmail.bind(smtpEmailService);