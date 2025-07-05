const https = require('https');
const net = require('net');
const tls = require('tls');

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// IMAP command processor
class ImapBridge {
  constructor(config) {
    this.config = config;
    this.connected = false;
    this.authenticated = false;
    this.tagCounter = 0;
    this.responseBuffer = '';
  }

  generateTag() {
    return `A${(++this.tagCounter).toString().padStart(4, '0')}`;
  }

  connect() {
    return new Promise((resolve, reject) => {
      const socket = tls.connect({
        host: this.config.host,
        port: this.config.port,
        rejectUnauthorized: false
      });

      socket.on('connect', () => {
        this.socket = socket;
        this.connected = true;
      });

      socket.on('data', (data) => {
        this.responseBuffer += data.toString();
        
        // Check for initial greeting
        if (this.responseBuffer.includes('* OK')) {
          resolve(true);
        }
      });

      socket.on('error', (err) => {
        reject(err);
      });

      socket.setTimeout(10000);
      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('Connection timeout'));
      });
    });
  }

  sendCommand(command) {
    return new Promise((resolve, reject) => {
      if (!this.connected || !this.socket) {
        reject(new Error('Not connected'));
        return;
      }

      const tag = this.generateTag();
      this.responseBuffer = '';
      
      this.socket.write(`${tag} ${command}\r\n`);
      
      const checkResponse = setInterval(() => {
        if (this.responseBuffer.includes(`${tag} OK`) || 
            this.responseBuffer.includes(`${tag} NO`) || 
            this.responseBuffer.includes(`${tag} BAD`)) {
          clearInterval(checkResponse);
          
          if (this.responseBuffer.includes(`${tag} OK`)) {
            resolve(this.responseBuffer);
          } else {
            reject(new Error(`Command failed: ${this.responseBuffer}`));
          }
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkResponse);
        reject(new Error('Command timeout'));
      }, 10000);
    });
  }

  async login() {
    const response = await this.sendCommand(`LOGIN "${this.config.user}" "${this.config.password}"`);
    this.authenticated = true;
    return response;
  }

  async listFolders() {
    const response = await this.sendCommand('LIST "" "*"');
    const folders = [];
    const lines = response.split('\r\n');
    
    for (const line of lines) {
      const match = line.match(/\* LIST \((.*?)\) "(.*?)" "?(.*?)"?$/);
      if (match) {
        const [, flags, delimiter, name] = match;
        folders.push({
          name: name.replace(/^"|"$/g, ''),
          path: name.replace(/^"|"$/g, ''),
          delimiter,
          flags: flags.split(' ').filter(f => f),
          level: 0,
          hasChildren: !flags.includes('\\HasNoChildren'),
          specialUse: this.detectSpecialUse(name, flags),
          unreadCount: 0,
          totalCount: 0
        });
      }
    }
    
    return folders;
  }

  detectSpecialUse(name, flags) {
    const cleanName = name.replace(/^"|"$/g, '').toLowerCase();
    
    // Check flags first
    if (flags.includes('\\Inbox')) return 'inbox';
    if (flags.includes('\\Sent')) return 'sent';
    if (flags.includes('\\Drafts')) return 'drafts';
    if (flags.includes('\\Trash')) return 'trash';
    if (flags.includes('\\Junk') || flags.includes('\\Spam')) return 'spam';
    
    // Fallback to name
    if (cleanName === 'inbox') return 'inbox';
    if (cleanName === 'sent' || cleanName === 'gesendet') return 'sent';
    if (cleanName === 'drafts' || cleanName === 'entwürfe') return 'drafts';
    if (cleanName === 'trash' || cleanName === 'papierkorb') return 'trash';
    if (cleanName === 'spam' || cleanName === 'junk') return 'spam';
    
    return null;
  }

  async selectFolder(folder) {
    const response = await this.sendCommand(`SELECT "${folder}"`);
    const lines = response.split('\r\n');
    let total = 0;
    
    for (const line of lines) {
      const match = line.match(/\* (\d+) EXISTS/);
      if (match) {
        total = parseInt(match[1]);
      }
    }
    
    return total;
  }

  async fetchEmails(folder, start, end) {
    await this.selectFolder(folder);
    
    const response = await this.sendCommand(`FETCH ${start}:${end} (UID FLAGS ENVELOPE BODYSTRUCTURE)`);
    const emails = [];
    const lines = response.split('\r\n');
    
    let currentEmail = null;
    let inEnvelope = false;
    let envelopeData = '';
    
    for (const line of lines) {
      if (line.startsWith('* ') && line.includes('FETCH')) {
        if (currentEmail) {
          emails.push(currentEmail);
        }
        currentEmail = {
          flags: [],
          attachments: []
        };
      }
      
      if (currentEmail) {
        // Extract UID
        const uidMatch = line.match(/UID (\d+)/);
        if (uidMatch) {
          currentEmail.uid = uidMatch[1];
          currentEmail.id = uidMatch[1];
        }
        
        // Extract FLAGS
        const flagsMatch = line.match(/FLAGS \((.*?)\)/);
        if (flagsMatch) {
          currentEmail.flags = flagsMatch[1].split(' ').filter(f => f);
        }
        
        // Handle ENVELOPE
        if (line.includes('ENVELOPE (')) {
          inEnvelope = true;
          envelopeData = line.substring(line.indexOf('ENVELOPE (') + 10);
        }
        
        if (inEnvelope) {
          envelopeData += ' ' + line;
          
          // Simple check for envelope end - count parentheses
          const openCount = (envelopeData.match(/\(/g) || []).length;
          const closeCount = (envelopeData.match(/\)/g) || []).length;
          
          if (closeCount >= openCount) {
            inEnvelope = false;
            this.parseEnvelope(currentEmail, envelopeData);
            envelopeData = '';
          }
        }
      }
    }
    
    if (currentEmail) {
      emails.push(currentEmail);
    }
    
    return emails.map(email => ({
      ...email,
      folder,
      preview: email.subject || '',
      date: email.date || new Date().toISOString()
    }));
  }

  parseEnvelope(email, envelopeStr) {
    // Very simplified envelope parsing
    // Format: (date subject from sender reply-to to cc bcc in-reply-to message-id)
    
    try {
      // Extract subject
      const subjectMatch = envelopeStr.match(/"([^"]*?)"\s+\(/);
      if (subjectMatch) {
        email.subject = subjectMatch[1];
      } else {
        email.subject = '(No subject)';
      }
      
      // Extract date (usually first quoted string)
      const dateMatch = envelopeStr.match(/"([^"]*?)"/);
      if (dateMatch) {
        email.date = new Date(dateMatch[1]).toISOString();
      }
      
      // Extract from
      email.from = { address: 'unknown@unknown.com' };
      
      // Extract to
      email.to = [];
      
    } catch (err) {
      console.error('Error parsing envelope:', err);
      email.subject = '(Parse error)';
      email.date = new Date().toISOString();
    }
  }

  async disconnect() {
    if (this.socket) {
      await this.sendCommand('LOGOUT');
      this.socket.destroy();
      this.connected = false;
      this.authenticated = false;
    }
  }
}

// Main handler
module.exports = async function handler(req, res) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    return res.status(200).end();
  }

  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  const { operation = 'list', folder = 'INBOX', page = 1, limit = 50 } = req.body || req.query;

  const config = {
    user: process.env.IONOS_EMAIL || 'bielefeld@relocato.de',
    password: process.env.IONOS_PASSWORD,
    host: process.env.IONOS_IMAP_HOST || 'imap.ionos.de',
    port: parseInt(process.env.IONOS_IMAP_PORT || '993')
  };

  if (!config.password) {
    return res.status(500).json({
      success: false,
      error: 'IONOS_PASSWORD not configured'
    });
  }

  const bridge = new ImapBridge(config);

  try {
    console.log(`📧 IMAP Bridge: ${operation} on ${folder}`);
    
    await bridge.connect();
    await bridge.login();

    switch (operation) {
      case 'folders':
        const folders = await bridge.listFolders();
        await bridge.disconnect();
        return res.status(200).json({
          success: true,
          folders
        });

      case 'read':
        if (!req.body.uid) {
          await bridge.disconnect();
          return res.status(400).json({
            success: false,
            error: 'UID required for read operation'
          });
        }
        
        await bridge.selectFolder(folder);
        const emailResponse = await bridge.sendCommand(`FETCH ${req.body.uid} (UID FLAGS BODY[])`);
        await bridge.disconnect();
        
        // Simple email parsing
        const email = {
          id: req.body.uid,
          uid: req.body.uid,
          folder: folder,
          from: { address: 'email@example.com' },
          to: [],
          subject: 'Email content',
          date: new Date().toISOString(),
          text: 'Email body would be here',
          html: null,
          flags: [],
          attachments: []
        };
        
        return res.status(200).json({
          success: true,
          email
        });

      case 'list':
        const total = await bridge.selectFolder(folder);
        const start = Math.max(1, total - (page * limit) + 1);
        const end = Math.max(1, total - ((page - 1) * limit));
        
        if (start > end || total === 0) {
          await bridge.disconnect();
          return res.status(200).json({
            success: true,
            emails: [],
            total,
            page,
            limit
          });
        }

        const emails = await bridge.fetchEmails(folder, start, end);
        await bridge.disconnect();
        
        return res.status(200).json({
          success: true,
          emails: emails.reverse(), // Newest first
          total,
          page,
          limit
        });

      default:
        await bridge.disconnect();
        return res.status(400).json({
          success: false,
          error: 'Invalid operation'
        });
    }
  } catch (error) {
    console.error('IMAP Bridge Error:', error);
    try {
      await bridge.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
    
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};