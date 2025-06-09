interface EmailData {
  to: string;
  subject: string;
  content: string;
  attachments?: {
    filename: string;
    content: Blob;
  }[];
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
    
    // Prüfe ob Backend verfügbar ist
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    
    try {
      const healthCheck = await fetch(`${API_URL}/api/health`);
      if (!healthCheck.ok) {
        throw new Error('Backend nicht verfügbar');
      }
    } catch (error) {
      console.warn('⚠️ Backend nicht verfügbar - E-Mail wird simuliert');
      console.log('📧 E-Mail würde gesendet werden:', {
        to: emailData.to,
        subject: emailData.subject,
        from: 'Relocato Umzugsservice <bielefeld@relocato.de>',
        hasAttachments: emailData.attachments ? emailData.attachments.length : 0
      });
      
      console.log('💡 Um echte E-Mails zu senden:');
      console.log('1. Backend online deployen');
      console.log('2. Oder lokales Backend im Terminal starten: cd backend && npm start');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    }

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

      const payload = {
        smtp: {
          host: this.config.host,
          port: this.config.port,
          secure: this.config.secure,
          auth: {
            user: this.config.user,
            pass: this.config.pass
          }
        },
        message: {
          from: `RELOCATO® <${this.config.from}>`,
          to: emailData.to,
          subject: emailData.subject,
          text: emailData.content,
          attachments: attachments
        }
      };

      console.log('📮 Sende E-Mail via IONOS SMTP...');
      console.log('Von:', this.config.from);
      console.log('An:', emailData.to);
      console.log('Betreff:', emailData.subject);
      
      // API-URL bestimmen (Development oder Production)
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      
      // E-Mail über Backend senden
      const response = await fetch(`${API_URL}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailData.to,
          subject: emailData.subject,
          content: emailData.content,
          attachments: attachments
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ E-Mail erfolgreich gesendet via IONOS SMTP');
        console.log('Message ID:', result.messageId);
        return true;
      } else {
        console.error('❌ E-Mail-Versand fehlgeschlagen:', result.error);
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