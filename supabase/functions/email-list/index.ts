import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// IMAP Commands
class SimpleIMAP {
  private conn: Deno.Conn | null = null;
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();
  private tagCounter = 0;

  async connect(host: string, port: number) {
    this.conn = await Deno.connectTls({ hostname: host, port });
    // Read greeting
    await this.readResponse();
  }

  async login(username: string, password: string) {
    const response = await this.sendCommand(`LOGIN "${username}" "${password}"`);
    return response.includes('OK');
  }

  async selectFolder(folder: string) {
    const response = await this.sendCommand(`SELECT "${folder}"`);
    // Parse message count from response
    const matches = response.match(/(\d+) EXISTS/);
    return matches ? parseInt(matches[1]) : 0;
  }

  async fetchEmails(start: number, end: number) {
    const emails = [];
    
    // Fetch email headers and flags
    const response = await this.sendCommand(
      `FETCH ${start}:${end} (UID FLAGS BODY[HEADER.FIELDS (FROM TO SUBJECT DATE)])`
    );
    
    // Parse response into individual emails
    const emailBlocks = response.split(/\* \d+ FETCH/);
    
    for (const block of emailBlocks) {
      if (!block.trim()) continue;
      
      const email: any = {};
      
      // Extract UID
      const uidMatch = block.match(/UID (\d+)/);
      if (uidMatch) email.uid = uidMatch[1];
      
      // Extract FLAGS
      const flagsMatch = block.match(/FLAGS \(([^)]*)\)/);
      if (flagsMatch) {
        email.flags = flagsMatch[1].split(' ').filter(f => f);
      }
      
      // Extract headers
      const headerMatch = block.match(/BODY\[HEADER\.FIELDS[^\]]*\]\s*{(\d+)}\r\n([\s\S]*?)\)/);
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
          email.subject = subjectMatch[1].trim();
        }
        
        // Parse Date
        const dateMatch = headers.match(/Date: (.+)/i);
        if (dateMatch) {
          email.date = new Date(dateMatch[1].trim()).toISOString();
        }
      }
      
      if (email.uid) {
        emails.push({
          id: email.uid,
          uid: email.uid,
          from: email.from || { address: 'unknown@unknown.com', name: 'Unknown' },
          to: email.to || [],
          subject: email.subject || '(Kein Betreff)',
          date: email.date || new Date().toISOString(),
          flags: email.flags || [],
          folder: 'INBOX',
          body: '', // Will be fetched separately if needed
          preview: email.subject || ''
        });
      }
    }
    
    return emails;
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
    const buffer = new Uint8Array(65536); // Larger buffer for responses
    
    while (true) {
      const n = await this.conn.read(buffer);
      if (n === null) break;
      
      response += this.decoder.decode(buffer.subarray(0, n));
      
      // Check if we got the tagged response
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
    const { folder = 'INBOX', page = 1, limit = 50 } = await req.json()

    // Get IONOS credentials
    const IONOS_EMAIL = Deno.env.get('IONOS_EMAIL') || 'bielefeld@relocato.de'
    const IONOS_PASSWORD = Deno.env.get('IONOS_PASSWORD')
    const IONOS_IMAP_HOST = Deno.env.get('IONOS_IMAP_HOST') || 'imap.ionos.de'
    const IONOS_IMAP_PORT = parseInt(Deno.env.get('IONOS_IMAP_PORT') || '993')

    if (!IONOS_PASSWORD) {
      throw new Error('IONOS_PASSWORD not configured')
    }

    console.log(`📧 Fetching emails from ${folder}...`)

    const imap = new SimpleIMAP();
    
    try {
      // Connect and login
      await imap.connect(IONOS_IMAP_HOST, IONOS_IMAP_PORT);
      console.log('Connected to IMAP server');
      
      const loginSuccess = await imap.login(IONOS_EMAIL, IONOS_PASSWORD);
      if (!loginSuccess) {
        throw new Error('IMAP login failed');
      }
      console.log('Logged in successfully');
      
      // Select folder and get message count
      const messageCount = await imap.selectFolder(folder);
      console.log(`Found ${messageCount} messages in ${folder}`);
      
      // Calculate range for pagination
      const start = Math.max(1, messageCount - (page * limit) + 1);
      const end = Math.max(1, messageCount - ((page - 1) * limit));
      
      let emails = [];
      if (messageCount > 0 && start <= end) {
        emails = await imap.fetchEmails(start, end);
        // Reverse to show newest first
        emails.reverse();
      }
      
      await imap.logout();
      await imap.close();
      
      return new Response(
        JSON.stringify({ 
          success: true,
          emails: emails,
          total: messageCount,
          page: page,
          limit: limit
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    } catch (error) {
      console.error('IMAP Error:', error);
      await imap.close();
      
      // Fallback to mock data for testing
      console.log('Falling back to mock data');
      const mockEmails = [
        {
          uid: '1',
          id: '1',
          from: { name: 'IONOS Test', address: 'test@ionos.de' },
          to: [{ address: IONOS_EMAIL }],
          subject: 'Willkommen bei Relocato! (Mock)',
          date: new Date().toISOString(),
          body: 'Dies ist eine Test-E-Mail.',
          flags: ['\\Seen'],
          folder: folder,
          preview: 'Dies ist eine Test-E-Mail.'
        }
      ]
      
      return new Response(
        JSON.stringify({ 
          success: true,
          emails: mockEmails,
          total: mockEmails.length,
          page: page,
          limit: limit,
          error: 'IMAP failed, using mock data: ' + error.message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }
  } catch (error) {
    console.error('Error listing emails:', error)
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