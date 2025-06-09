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

class EmailService {
  private config: SendGridConfig;

  constructor() {
    this.config = {
      apiKey: process.env.REACT_APP_SENDGRID_API_KEY || '',
      fromEmail: process.env.REACT_APP_SENDGRID_FROM_EMAIL || 'noreply@umzugsfirma.de'
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
    if (!this.config.apiKey) {
      console.warn('SendGrid nicht konfiguriert - Email wird simuliert');
      console.log('Email Details:', {
        to: emailData.to,
        subject: emailData.subject,
        content: emailData.content,
        hasAttachments: emailData.attachments ? emailData.attachments.length : 0
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    }

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
          name: 'Umzugsfirma'
        },
        content: [{
          type: 'text/plain',
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
        console.log('Email erfolgreich gesendet an:', emailData.to);
        return true;
      } else {
        const errorText = await response.text();
        console.error('SendGrid Fehler:', response.status, errorText);
        return false;
      }
    } catch (error) {
      console.error('Email-Versand Fehler:', error);
      return false;
    }
  }
}

const emailService = new EmailService();

export const sendEmail = emailService.sendEmail.bind(emailService);