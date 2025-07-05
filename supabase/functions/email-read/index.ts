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

// Parse MIME multipart body
function parseMimeBody(mimeBody: string): { text?: string; html?: string } {
  const result: { text?: string; html?: string } = {};
  
  // First check if this is a multipart message by looking for Content-Type header
  const contentTypeMatch = mimeBody.match(/Content-Type:\s*([^;\r\n]+)(?:;\s*(.+?))?(?:\r\n|$)/i);
  if (!contentTypeMatch) {
    // No Content-Type header, treat as plain text
    return { text: mimeBody };
  }
  
  const mainContentType = contentTypeMatch[1].toLowerCase().trim();
  const contentTypeParams = contentTypeMatch[2] || '';
  
  // Extract boundary from Content-Type header
  const boundaryMatch = contentTypeParams.match(/boundary=["']?([^"'\r\n]+)["']?/i);
  
  if (!mainContentType.includes('multipart') || !boundaryMatch) {
    // Not multipart, check if it's text or html
    if (mainContentType.includes('text/html')) {
      // Extract body after headers
      const bodyMatch = mimeBody.match(/\r\n\r\n([\s\S]+)$/);
      return { html: bodyMatch ? bodyMatch[1] : mimeBody };
    } else {
      // Plain text or other
      const bodyMatch = mimeBody.match(/\r\n\r\n([\s\S]+)$/);
      return { text: bodyMatch ? bodyMatch[1] : mimeBody };
    }
  }
  
  const boundary = boundaryMatch[1];
  // Split by boundary, being careful with regex special characters
  const escapedBoundary = boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = mimeBody.split(new RegExp(`--${escapedBoundary}(?:--)?`));
  
  for (const part of parts) {
    // Skip empty parts
    if (!part.trim()) continue;
    
    // Find content type in this part
    const partContentTypeMatch = part.match(/Content-Type:\s*([^;\r\n]+)/i);
    if (!partContentTypeMatch) continue;
    
    const partContentType = partContentTypeMatch[1].toLowerCase().trim();
    
    // Find content transfer encoding
    const encodingMatch = part.match(/Content-Transfer-Encoding:\s*([^\r\n]+)/i);
    const encoding = encodingMatch ? encodingMatch[1].toLowerCase().trim() : '7bit';
    
    // Extract body (after double CRLF or double LF)
    const bodyMatch = part.match(/(?:\r\n\r\n|\n\n)([\s\S]+)$/);
    if (!bodyMatch) continue;
    
    let content = bodyMatch[1];
    
    // Remove any trailing boundary markers
    content = content.replace(/\r?\n--[^\r\n]+--\s*$/, '');
    
    // Decode based on transfer encoding
    if (encoding === 'base64') {
      try {
        // Remove all whitespace from base64
        const cleanBase64 = content.replace(/[\s\r\n]/g, '');
        const decoded = atob(cleanBase64);
        // Convert to proper UTF-8
        const bytes = Uint8Array.from(decoded, c => c.charCodeAt(0));
        content = new TextDecoder('utf-8').decode(bytes);
      } catch (e) {
        console.error('Base64 decode error:', e);
      }
    } else if (encoding === 'quoted-printable') {
      // Handle soft line breaks
      content = content.replace(/=\r?\n/g, '');
      // Decode hex sequences
      content = content.replace(/=([0-9A-F]{2})/gi, (m, hex) => 
        String.fromCharCode(parseInt(hex, 16))
      );
    }
    
    // Store based on content type
    if (partContentType.includes('text/plain') && !result.text) {
      result.text = content.trim();
    } else if (partContentType.includes('text/html') && !result.html) {
      result.html = content.trim();
    }
  }
  
  return result;
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
      const rawBody = bodyMatch[2];
      email.body = rawBody;
      
      // Check if the body already contains MIME headers (Content-Type, etc)
      // If it does, we need to parse it differently
      if (rawBody.match(/^Content-Type:/im)) {
        // Body includes headers, parse as complete MIME message
        const parsed = parseMimeBody(rawBody);
        email.text = parsed.text || '';
        email.html = parsed.html || '';
      } else {
        // Check if we have Content-Type from main headers
        const mainContentTypeMatch = response.match(/Content-Type:\s*([^;\r\n]+)(?:;\s*(.+?))?(?:\r\n|$)/i);
        if (mainContentTypeMatch && mainContentTypeMatch[1].toLowerCase().includes('multipart')) {
          // It's multipart but headers might be in the HEADER section
          // Try to parse the body as multipart
          const parsed = parseMimeBody(rawBody);
          email.text = parsed.text || rawBody;
          email.html = parsed.html || '';
        } else {
          // Simple message, body is the content
          email.text = rawBody;
          email.html = '';
        }
      }
      
      // If we have text but no HTML, create simple HTML
      if (!email.html && email.text) {
        // Escape HTML entities and convert newlines
        const escapedText = email.text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')
          .replace(/\n/g, '<br>\n');
        email.html = `<div style="font-family: Arial, sans-serif; white-space: pre-wrap;">${escapedText}</div>`;
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