interface EmailData {
  to: string;
  subject: string;
  content: string;
  attachments?: {
    filename: string;
    content: Blob;
  }[];
}

interface SendGridConfig {
  apiKey: string;
  fromEmail: string;
}

// Hilfsfunktion für Attachments
const processAttachments = async (attachments: { filename: string; content: Blob }[]) => {
  const processed = [];
  
  for (const attachment of attachments) {
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve) => {
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.readAsDataURL(attachment.content);
    });
    
    processed.push({
      filename: attachment.filename,
      content: base64,
      encoding: 'base64'
    });
  }
  
  return processed;
};

class EmailService {
  private config: SendGridConfig;
  private useVercelApi: boolean;

  constructor() {
    this.config = {
      apiKey: process.env.REACT_APP_SENDGRID_API_KEY || '',
      fromEmail: process.env.REACT_APP_SENDGRID_FROM_EMAIL || 'noreply@umzugsfirma.de'
    };
    // Verwende Vercel API wenn auf Vercel deployed
    this.useVercelApi = window.location.hostname.includes('vercel.app') || 
                       window.location.hostname === 'relocato.ruempel-schmiede.com';
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
    // Verwende IONOS SMTP über Vercel API wenn verfügbar
    if (this.useVercelApi) {
      try {
        console.log('📧 Sende E-Mail über Vercel API...');
        
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: emailData.to,
            subject: emailData.subject,
            content: emailData.content,
            attachments: emailData.attachments ? await processAttachments(emailData.attachments) : undefined,
            bcc: 'bielefeld@relocato.de' // Kopie für Gesendet-Ordner
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error('❌ E-Mail-Versand fehlgeschlagen:', errorData);
          // Fallback zu SendGrid oder Simulation
          return this.sendEmailFallback(emailData);
        }
        
        const result = await response.json();
        console.log('✅ E-Mail erfolgreich gesendet:', result);
        return true;
        
      } catch (error) {
        console.error('❌ Vercel API Fehler:', error);
        // Fallback zu SendGrid oder Simulation
        return this.sendEmailFallback(emailData);
      }
    }
    
    // Fallback zu SendGrid oder Simulation
    return this.sendEmailFallback(emailData);
  }

  private async sendEmailFallback(emailData: EmailData): Promise<boolean> {
    // SendGrid wenn konfiguriert
    if (this.config.apiKey) {
      try {
        const attachments = [];
        
        if (emailData.attachments) {
          for (const attachment of emailData.attachments) {
            const base64Content = await this.blobToBase64(attachment.content);
            attachments.push({
              content: base64Content,
              filename: attachment.filename,
              type: 'application/pdf',
              disposition: 'attachment'
            });
          }
        }

        const emailPayload = {
          personalizations: [{
            to: [{ email: emailData.to }],
            subject: emailData.subject
          }],
          from: { 
            email: this.config.fromEmail,
            name: 'Relocato Bielefeld'
          },
          content: [{
            type: 'text/html',
            value: emailData.content
          }],
          attachments: attachments.length > 0 ? attachments : undefined
        };

        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(emailPayload)
        });

        if (response.ok) {
          console.log('✅ Email via SendGrid erfolgreich gesendet an:', emailData.to);
          return true;
        } else {
          const errorText = await response.text();
          console.error('SendGrid Fehler:', response.status, errorText);
          return false;
        }
      } catch (error) {
        console.error('SendGrid Fehler:', error);
        return false;
      }
    }

    // Simulation wenn nichts konfiguriert
    console.warn('📧 E-Mail wird simuliert (keine API konfiguriert)');
    console.log('Email Details:', {
      to: emailData.to,
      subject: emailData.subject,
      content: emailData.content.substring(0, 100) + '...',
      hasAttachments: emailData.attachments ? emailData.attachments.length : 0
    });
    
    // Simuliere Verzögerung
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  }
}

const emailService = new EmailService();

export const sendEmail = async (emailData: EmailData): Promise<boolean> => {
  try {
    // Verwende direkt die IONOS API
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: emailData.to,
        subject: emailData.subject,
        content: emailData.content,
        html: emailData.content,
        attachments: emailData.attachments ? await processAttachments(emailData.attachments) : undefined,
        bcc: 'bielefeld@relocato.de' // Kopie für Gesendet-Ordner
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('❌ E-Mail-Versand fehlgeschlagen:', errorData);
      return false;
    }
    
    const result = await response.json();
    console.log('✅ E-Mail erfolgreich gesendet:', result);
    return true;
    
  } catch (error) {
    console.error('❌ E-Mail Fehler:', error);
    return false;
  }
};