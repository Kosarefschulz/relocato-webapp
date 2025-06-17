const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { parseEmail } = require('./emailParser');

/**
 * Preview parsed data from a specific email
 */
exports.previewEmailData = functions
  .region('europe-west1')
  .runWith({
    timeoutSeconds: 30,
    memory: '256MB'
  })
  .https.onRequest(async (req, res) => {
    // CORS Headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    
    const seqno = parseInt(req.query.seqno);
    
    if (!seqno) {
      res.status(400).json({ success: false, error: 'Missing seqno parameter' });
      return;
    }
    
    const folder = 'erfolgreich verarbeitete Anfragen';
    
    console.log(`📧 Fetching email #${seqno} from ${folder}`);
    
    const config = {
      user: 'bielefeld@relocato.de',
      password: 'Bicm1308',
      host: 'imap.ionos.de',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    };
    
    const imap = new Imap(config);
    
    return new Promise((resolve) => {
      imap.once('ready', () => {
        console.log('✅ Connected to IONOS');
        
        imap.openBox(folder, true, (err, box) => {
          if (err) {
            res.json({ success: false, error: err.message });
            imap.end();
            return;
          }
          
          if (seqno > box.messages.total) {
            res.json({ success: false, error: 'Email not found' });
            imap.end();
            return;
          }
          
          const fetch = imap.fetch(seqno, {
            bodies: '',
            struct: true
          });
          
          fetch.on('message', (msg) => {
            msg.on('body', (stream) => {
              simpleParser(stream, (err, parsed) => {
                if (err) {
                  res.json({ success: false, error: err.message });
                  imap.end();
                  return;
                }
                
                try {
                  const emailData = {
                    from: parsed.from?.text || '',
                    to: parsed.to?.text || '',
                    subject: parsed.subject || '',
                    text: parsed.text || '',
                    html: parsed.html || '',
                    date: parsed.date || new Date()
                  };
                  
                  // Parse email to extract customer data
                  const parsedData = parseEmail(emailData);
                  
                  res.json({
                    success: true,
                    parsedData: {
                      name: parsedData.name,
                      firstName: parsedData.firstName,
                      lastName: parsedData.lastName,
                      email: parsedData.email,
                      phone: parsedData.phone,
                      moveDate: parsedData.moveDate,
                      fromAddress: parsedData.fromAddress,
                      toAddress: parsedData.toAddress,
                      apartment: parsedData.apartment,
                      services: parsedData.services,
                      distance: parsedData.distance,
                      source: parsedData.source,
                      notes: parsedData.notes
                    }
                  });
                  
                  imap.end();
                } catch (error) {
                  console.error('Error parsing email:', error);
                  res.json({ 
                    success: false, 
                    error: 'Failed to parse email data',
                    details: error.message 
                  });
                  imap.end();
                }
              });
            });
          });
        });
      });
      
      imap.once('error', (err) => {
        console.error('IMAP Error:', err);
        res.status(500).json({ success: false, error: err.message });
      });
      
      imap.connect();
    });
  });