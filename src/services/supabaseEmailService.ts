import { supabase } from '../config/supabase';

interface EmailData {
  to: string;
  subject: string;
  content: string;
  customerId?: string;
  templateType?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

interface SupabaseEmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

class SupabaseEmailService {
  private config: SupabaseEmailConfig;

  constructor() {
    // Use existing IONOS configuration from environment variables
    this.config = {
      host: process.env.REACT_APP_SMTP_HOST || 'smtp.ionos.de',
      port: parseInt(process.env.REACT_APP_SMTP_PORT || '587'),
      user: process.env.REACT_APP_SMTP_USER || 'bielefeld@relocato.de',
      pass: process.env.REACT_APP_SMTP_PASS || 'Bicm1308',
      from: process.env.REACT_APP_SMTP_FROM || 'bielefeld@relocato.de'
    };

    console.log('🔧 Supabase Email Service initialized with IONOS SMTP:', {
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      from: this.config.from
    });
  }

  /**
   * Send email via Supabase Edge Function
   */
  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      console.log('📧 Sending email via Supabase Edge Function...', {
        to: emailData.to,
        subject: emailData.subject,
        templateType: emailData.templateType
      });

      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: emailData.to,
          subject: emailData.subject,
          content: emailData.content,
          config: this.config,
          attachments: emailData.attachments
        }
      });

      if (error) {
        console.error('❌ Supabase Edge Function error:', error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Unknown error occurred');
      }

      console.log('✅ Email sent successfully via Supabase');

      // Save email to history
      if (emailData.customerId) {
        await this.saveEmailHistory(emailData);
      }

      return true;
    } catch (error) {
      console.error('❌ Failed to send email via Supabase:', error);
      return false;
    }
  }

  /**
   * Save email to Supabase email_history table
   */
  private async saveEmailHistory(emailData: EmailData): Promise<void> {
    try {
      console.log('💾 Saving email to history...', {
        customerId: emailData.customerId,
        recipient: emailData.to
      });

      const { error } = await supabase
        .from('email_history')
        .insert({
          customer_id: emailData.customerId!,
          recipient: emailData.to,
          subject: emailData.subject,
          type: emailData.templateType || 'custom',
          status: 'sent',
          sent_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Failed to save email history:', error);
        throw error;
      }

      console.log('✅ Email history saved successfully');
    } catch (error) {
      console.error('❌ Error saving email history:', error);
      // Don't throw - email was sent successfully, just history save failed
    }
  }

  /**
   * Get email history for a customer
   */
  async getEmailHistory(customerId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('email_history')
        .select('*')
        .eq('customer_id', customerId)
        .order('sent_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to fetch email history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error fetching email history:', error);
      return [];
    }
  }

  /**
   * Get all email history with pagination
   */
  async getAllEmailHistory(limit: number = 50, offset: number = 0): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('email_history')
        .select('*')
        .order('sent_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ Failed to fetch all email history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error fetching all email history:', error);
      return [];
    }
  }

  /**
   * Send quote email with PDF attachment
   */
  async sendQuoteEmail(
    customerId: string,
    customerEmail: string,
    customerName: string,
    quoteData: any,
    pdfContent?: string
  ): Promise<boolean> {
    const subject = `Kostenvoranschlag für Ihren Umzug - ${customerName}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c5aa0;">Ihr Kostenvoranschlag von Rümpel-Schmiede</h2>
        
        <p>Sehr geehrte/r ${customerName},</p>
        
        <p>vielen Dank für Ihr Interesse an unseren Umzugsdienstleistungen. Anbei finden Sie Ihren persönlichen Kostenvoranschlag.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Zusammenfassung:</h3>
          <p><strong>Gesamtpreis:</strong> ${quoteData.price || 'Auf Anfrage'} €</p>
          <p><strong>Umzugstermin:</strong> ${quoteData.moveDate || 'Nach Vereinbarung'}</p>
          <p><strong>Von:</strong> ${quoteData.moveFrom || ''}</p>
          <p><strong>Nach:</strong> ${quoteData.moveTo || ''}</p>
        </div>
        
        <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung. Sie können uns unter folgenden Kontaktdaten erreichen:</p>
        
        <div style="background-color: #e9ecef; padding: 15px; border-radius: 8px;">
          <p><strong>Rümpel-Schmiede</strong><br>
          Telefon: <a href="tel:+4952149074580">0521 49074580</a><br>
          E-Mail: <a href="mailto:bielefeld@relocato.de">bielefeld@relocato.de</a><br>
          Web: <a href="https://relocato.ruempel-schmiede.com">relocato.ruempel-schmiede.com</a></p>
        </div>
        
        <p>Wir freuen uns auf Ihren Auftrag!</p>
        
        <p>Mit freundlichen Grüßen<br>
        Ihr Team von Rümpel-Schmiede</p>
      </div>
    `;

    const attachments = pdfContent ? [{
      filename: `Kostenvoranschlag_${customerName.replace(/\s+/g, '_')}.pdf`,
      content: pdfContent,
      contentType: 'application/pdf'
    }] : undefined;

    return await this.sendEmail({
      to: customerEmail,
      subject,
      content: htmlContent,
      customerId,
      templateType: 'quote',
      attachments
    });
  }

  /**
   * Send confirmation email
   */
  async sendConfirmationEmail(
    customerId: string,
    customerEmail: string,
    customerName: string,
    confirmationData: any
  ): Promise<boolean> {
    const subject = `Auftragsbestätigung - ${customerName}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Auftragsbestätigung - Rümpel-Schmiede</h2>
        
        <p>Sehr geehrte/r ${customerName},</p>
        
        <p>vielen Dank für Ihren Auftrag! Wir bestätigen hiermit Ihre Buchung:</p>
        
        <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h3 style="margin-top: 0; color: #155724;">Auftragsdaten:</h3>
          <p><strong>Umzugstermin:</strong> ${confirmationData.moveDate || 'Nach Vereinbarung'}</p>
          <p><strong>Von:</strong> ${confirmationData.moveFrom || ''}</p>
          <p><strong>Nach:</strong> ${confirmationData.moveTo || ''}</p>
          <p><strong>Gesamtpreis:</strong> ${confirmationData.price || 'Auf Anfrage'} €</p>
        </div>
        
        <p>Wir werden uns rechtzeitig vor dem Umzugstermin bei Ihnen melden, um die letzten Details zu besprechen.</p>
        
        <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung:</p>
        
        <div style="background-color: #e9ecef; padding: 15px; border-radius: 8px;">
          <p><strong>Rümpel-Schmiede</strong><br>
          Telefon: <a href="tel:+4952149074580">0521 49074580</a><br>
          E-Mail: <a href="mailto:bielefeld@relocato.de">bielefeld@relocato.de</a></p>
        </div>
        
        <p>Vielen Dank für Ihr Vertrauen!</p>
        
        <p>Mit freundlichen Grüßen<br>
        Ihr Team von Rümpel-Schmiede</p>
      </div>
    `;

    return await this.sendEmail({
      to: customerEmail,
      subject,
      content: htmlContent,
      customerId,
      templateType: 'confirmation'
    });
  }

  /**
   * Test email connection
   */
  async testConnection(): Promise<boolean> {
    try {
      return await this.sendEmail({
        to: this.config.from,
        subject: 'Supabase Email Service Test',
        content: '<p>This is a test email from Supabase Email Service.</p>',
        templateType: 'test'
      });
    } catch (error) {
      console.error('❌ Email connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const supabaseEmailService = new SupabaseEmailService();
export default supabaseEmailService;