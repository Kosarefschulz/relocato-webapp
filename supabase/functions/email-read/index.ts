import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Decode MIME encoded strings (e.g., =?utf-8?q?text?=)
function decodeMimeString(str: string): string {
  if (!str) return str;
  
  // Handle encoded-word format: =?charset?encoding?encoded-text?=
  return str.replace(/=\?([^?]+)\?([BQ])\?([^?]+)\?=/gi, (match, charset, encoding, encodedText) => {
    try {
      if (encoding.toUpperCase() === 'Q') {
        // Quoted-Printable decoding
        let decoded = encodedText.replace(/_/g, ' ');
        decoded = decoded.replace(/=([0-9A-F]{2})/gi, (m, hex) => String.fromCharCode(parseInt(hex, 16)));
        return decoded;
      } else if (encoding.toUpperCase() === 'B') {
        // Base64 decoding
        const buffer = Uint8Array.from(atob(encodedText), c => c.charCodeAt(0));
        return new TextDecoder(charset).decode(buffer);
      }
    } catch (e) {
      console.error('Failed to decode MIME string:', e);
    }
    return match;
  });
}

// Simple IMAP class (same as in email-list)
class SimpleIMAP {
  private conn: Deno.Conn | null = null;
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();
  private tagCounter = 0;

  async connect(host: string, port: number) {
    this.conn = await Deno.connectTls({ hostname: host, port });
    await this.readResponse();
  }

  async login(username: string, password: string) {
    const response = await this.sendCommand(`LOGIN "${username}" "${password}"`);
    return response.includes('OK');
  }

  async selectFolder(folder: string) {
    const response = await this.sendCommand(`SELECT "${folder}"`);
    const matches = response.match(/(\d+) EXISTS/);
    return matches ? parseInt(matches[1]) : 0;
  }

  async fetchEmailByUid(uid: string) {
    // Fetch complete email including body
    const response = await this.sendCommand(
      `UID FETCH ${uid} (UID FLAGS BODY[HEADER] BODY[TEXT])`
    );
    
    const email: any = { uid };
    
    // Extract FLAGS
    const flagsMatch = response.match(/FLAGS \(([^)]*)\)/);
    if (flagsMatch) {
      email.flags = flagsMatch[1].split(' ').filter(f => f);
    }
    
    // Extract headers
    const headerMatch = response.match(/BODY\[HEADER\]\s*{(\d+)}\r\n([\s\S]*?)(?=\r\n\)|\r\nBODY)/);
    if (headerMatch) {
      const headers = headerMatch[2];
      
      // Parse From
      const fromMatch = headers.match(/From: (.+)/i);
      if (fromMatch) {
        const from = fromMatch[1].trim();
        const emailMatch = from.match(/<(.+)>/);
        const nameMatch = from.match(/^"?([^"<]+)"?\s*</);
        email.from = {
          address: emailMatch ? emailMatch[1] : from,
          name: nameMatch ? nameMatch[1].trim() : ''
        };
      }
      
      // Parse To
      const toMatch = headers.match(/To: (.+)/i);
      if (toMatch) {
        email.to = [{ address: toMatch[1].trim() }];
      }
      
      // Parse Subject
      const subjectMatch = headers.match(/Subject: (.+)/i);
      if (subjectMatch) {
        email.subject = decodeMimeString(subjectMatch[1].trim());
      }
      
      // Parse Date
      const dateMatch = headers.match(/Date: (.+)/i);
      if (dateMatch) {
        email.date = new Date(dateMatch[1].trim()).toISOString();
      }
    }
    
    // Extract body
    const bodyMatch = response.match(/BODY\[TEXT\]\s*{(\d+)}\r\n([\s\S]*?)(?=\r\n\)|\r\n\* )/);
    if (bodyMatch) {
      email.body = bodyMatch[2];
      email.text = bodyMatch[2];
      
      // Simple HTML detection
      if (email.body.includes('<html') || email.body.includes('<body')) {
        email.html = email.body;
      }
    }
    
    return {
      id: email.uid,
      uid: email.uid,
      from: email.from || { address: 'unknown@unknown.com', name: 'Unknown' },
      to: email.to || [],
      subject: email.subject || '(Kein Betreff)',
      date: email.date || new Date().toISOString(),
      flags: email.flags || [],
      body: email.body || '',
      text: email.text || email.body || '',
      html: email.html,
      folder: 'INBOX'
    };
  }

  async logout() {
    await this.sendCommand('LOGOUT');
  }

  async close() {
    if (this.conn) {
      this.conn.close();
    }
  }

  private async sendCommand(command: string): Promise<string> {
    if (!this.conn) throw new Error('Not connected');
    
    const tag = `A${++this.tagCounter}`;
    const fullCommand = `${tag} ${command}\r\n`;
    
    await this.conn.write(this.encoder.encode(fullCommand));
    
    let response = '';
    const buffer = new Uint8Array(65536);
    
    while (true) {
      const n = await this.conn.read(buffer);
      if (n === null) break;
      
      response += this.decoder.decode(buffer.subarray(0, n));
      
      if (response.includes(`${tag} OK`) || response.includes(`${tag} NO`) || response.includes(`${tag} BAD`)) {
        break;
      }
    }
    
    return response;
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
    const { uid, folder = 'INBOX' } = await req.json()

    if (!uid) {
      throw new Error('Email UID is required')
    }

    // Get IONOS credentials
    const IONOS_EMAIL = Deno.env.get('IONOS_EMAIL') || 'bielefeld@relocato.de'
    const IONOS_PASSWORD = Deno.env.get('IONOS_PASSWORD')
    const IONOS_IMAP_HOST = Deno.env.get('IONOS_IMAP_HOST') || 'imap.ionos.de'
    const IONOS_IMAP_PORT = parseInt(Deno.env.get('IONOS_IMAP_PORT') || '993')

    if (!IONOS_PASSWORD) {
      throw new Error('IONOS_PASSWORD not configured')
    }

    console.log(`📧 Fetching email ${uid} from ${folder}...`)

    const imap = new SimpleIMAP();
    
    try {
      // Connect and login
      await imap.connect(IONOS_IMAP_HOST, IONOS_IMAP_PORT);
      const loginSuccess = await imap.login(IONOS_EMAIL, IONOS_PASSWORD);
      if (!loginSuccess) {
        throw new Error('IMAP login failed');
      }
      
      // Select folder
      await imap.selectFolder(folder);
      
      // Fetch the email
      const email = await imap.fetchEmailByUid(uid);
      
      await imap.logout();
      await imap.close();
      
      return new Response(
        JSON.stringify({ 
          success: true,
          email: email
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    } catch (error) {
      console.error('IMAP Error:', error);
      await imap.close();
      
      // Return error instead of mock data
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `IMAP connection failed: ${error.message}`,
          details: {
            host: IONOS_IMAP_HOST,
            port: IONOS_IMAP_PORT,
            user: IONOS_EMAIL,
            message: 'Please check /email-debug for detailed diagnostics'
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        },
      )
    }
  } catch (error) {
    console.error('Error reading email:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})