import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Simple SMTP client implementation
class SimpleSMTP {
  private conn: Deno.Conn | null = null;
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  async connect(host: string, port: number) {
    this.conn = await Deno.connect({ hostname: host, port });
    await this.readResponse(); // Read initial greeting
  }

  async startTLS() {
    await this.sendCommand('STARTTLS');
    if (!this.conn) throw new Error('No connection');
    this.conn = await Deno.startTls(this.conn, { hostname: 'smtp.ionos.de' });
  }

  async ehlo(domain: string) {
    await this.sendCommand(`EHLO ${domain}`);
  }

  async auth(username: string, password: string) {
    await this.sendCommand('AUTH LOGIN');
    await this.sendCommand(btoa(username));
    const response = await this.sendCommand(btoa(password));
    return response.includes('235');
  }

  async mailFrom(email: string) {
    await this.sendCommand(`MAIL FROM:<${email}>`);
  }

  async rcptTo(email: string) {
    await this.sendCommand(`RCPT TO:<${email}>`);
  }

  async data(content: string) {
    await this.sendCommand('DATA');
    await this.sendCommand(content);
    await this.sendCommand('.');
  }

  async quit() {
    await this.sendCommand('QUIT');
  }

  async close() {
    if (this.conn) {
      this.conn.close();
    }
  }

  private async sendCommand(command: string): Promise<string> {
    if (!this.conn) throw new Error('Not connected');
    
    await this.conn.write(this.encoder.encode(command + '\r\n'));
    return await this.readResponse();
  }

  private async readResponse(): Promise<string> {
    if (!this.conn) throw new Error('Not connected');
    
    const buffer = new Uint8Array(1024);
    const n = await this.conn.read(buffer);
    if (n === null) return '';
    
    return this.decoder.decode(buffer.subarray(0, n));
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, content, html, attachments } = await req.json()

    // Get IONOS credentials
    const IONOS_EMAIL = Deno.env.get('IONOS_EMAIL') || 'bielefeld@relocato.de'
    const IONOS_PASSWORD = Deno.env.get('IONOS_PASSWORD') || 'Bicm1308'
    const IONOS_SMTP_HOST = Deno.env.get('IONOS_SMTP_HOST') || 'smtp.ionos.de'
    const IONOS_SMTP_PORT = parseInt(Deno.env.get('IONOS_SMTP_PORT') || '587')

    console.log('📧 Sending email via IONOS SMTP v2...')

    const smtp = new SimpleSMTP();
    
    try {
      // Connect and establish secure connection
      await smtp.connect(IONOS_SMTP_HOST, IONOS_SMTP_PORT);
      await smtp.startTLS();
      await smtp.ehlo('relocato.de');
      
      // Authenticate
      const authSuccess = await smtp.auth(IONOS_EMAIL, IONOS_PASSWORD);
      if (!authSuccess) {
        throw new Error('Authentication failed');
      }
      
      // Send email
      await smtp.mailFrom(IONOS_EMAIL);
      
      const recipients = Array.isArray(to) ? to : [to];
      for (const recipient of recipients) {
        await smtp.rcptTo(recipient);
      }
      
      // Prepare email content
      const boundary = `----=_NextPart_${Date.now()}`;
      const headers = [
        `From: Relocato Bielefeld <${IONOS_EMAIL}>`,
        `To: ${recipients.join(', ')}`,
        `Subject: ${subject}`,
        `Date: ${new Date().toUTCString()}`,
        `MIME-Version: 1.0`,
      ];
      
      if (html) {
        headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
      } else {
        headers.push('Content-Type: text/plain; charset=utf-8');
      }
      
      let emailContent = headers.join('\r\n') + '\r\n\r\n';
      
      if (html) {
        emailContent += `--${boundary}\r\n`;
        emailContent += 'Content-Type: text/plain; charset=utf-8\r\n\r\n';
        emailContent += content || 'This email requires HTML support.' + '\r\n\r\n';
        emailContent += `--${boundary}\r\n`;
        emailContent += 'Content-Type: text/html; charset=utf-8\r\n\r\n';
        emailContent += html + '\r\n\r\n';
        emailContent += `--${boundary}--`;
      } else {
        emailContent += content || '';
      }
      
      await smtp.data(emailContent);
      await smtp.quit();
      await smtp.close();
      
      console.log('✅ Email sent successfully!')
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email sent successfully',
          details: {
            from: IONOS_EMAIL,
            to: recipients,
            subject: subject
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    } catch (error) {
      await smtp.close();
      throw error;
    }
  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})