const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Imap = require('imap');
const { simpleParser } = require('mailparser');

/**
 * Test-Function: Zeigt die letzten E-Mails mit Details
 */
exports.showEmails = functions
  .region('europe-west1')
  .https.onRequest(async (req, res) => {
    const folder = req.query.folder || 'INBOX';
    const limit = parseInt(req.query.limit) || 5;
    
    console.log(`📧 Zeige E-Mails aus Ordner: ${folder}`);
    
    const config = {
      user: 'bielefeld@relocato.de',
      password: 'Bicm1308',
      host: 'imap.ionos.de',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    };
    
    const emails = [];
    const imap = new Imap(config);
    
    return new Promise((resolve) => {
      imap.once('ready', () => {
        console.log('✅ Verbunden');
        
        imap.openBox(folder, true, (err, box) => {
          if (err) {
            res.json({ error: err.message, folder });
            imap.end();
            return;
          }
          
          console.log(`📬 ${box.messages.total} E-Mails im Ordner`);
          
          if (box.messages.total === 0) {
            res.json({ folder, total: 0, emails: [] });
            imap.end();
            return;
          }
          
          // Hole die neuesten E-Mails
          const start = Math.max(1, box.messages.total - limit + 1);
          const fetch = imap.fetch(`${start}:${box.messages.total}`, {
            bodies: '',
            struct: true
          });
          
          fetch.on('message', (msg, seqno) => {
            msg.on('body', (stream) => {
              simpleParser(stream, (err, parsed) => {
                if (!err) {
                  // Prüfe ob es eine relevante E-Mail ist
                  const isRelevant = 
                    parsed.from?.text?.toLowerCase().includes('immoscout24') ||
                    parsed.from?.text?.toLowerCase().includes('umzug365') ||
                    parsed.from?.text?.toLowerCase().includes('umzug-365') ||
                    parsed.text?.includes('Anfrage #') ||
                    parsed.text?.includes('Voraussichtlicher Umzugstag:');
                  
                  emails.push({
                    seqno,
                    from: parsed.from?.text,
                    subject: parsed.subject,
                    date: parsed.date,
                    isRelevant,
                    preview: parsed.text?.substring(0, 200) + '...',
                    hasName: parsed.text?.match(/Name:\s*(.+?)(?:\n|$)/) ? true : false
                  });
                }
              });
            });
          });
          
          fetch.once('end', () => {
            console.log(`✅ ${emails.length} E-Mails geladen`);
            res.json({
              folder,
              total: box.messages.total,
              showing: emails.length,
              relevant: emails.filter(e => e.isRelevant).length,
              emails: emails.reverse() // Neueste zuerst
            });
            imap.end();
          });
        });
      });
      
      imap.once('error', (err) => {
        res.status(500).json({ error: err.message });
      });
      
      imap.connect();
    });
  });