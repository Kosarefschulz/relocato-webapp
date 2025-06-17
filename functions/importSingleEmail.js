const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { parseEmail } = require('./emailParser');

// Import helper functions from importAllEmails
const { generateCustomerNumber, createAutomaticQuote } = require('./importAllEmails');

/**
 * Import a single email by sequence number
 */
exports.importSingleEmail = functions
  .region('europe-west1')
  .runWith({
    timeoutSeconds: 60,
    memory: '512MB'
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
    
    const { seqno } = req.body;
    
    if (!seqno) {
      res.status(400).json({ success: false, error: 'Missing seqno parameter' });
      return;
    }
    
    const folder = 'erfolgreich verarbeitete Anfragen';
    const db = admin.firestore();
    
    console.log(`📧 Importing email #${seqno} from ${folder}`);
    
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
              simpleParser(stream, async (err, parsed) => {
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
                  
                  // Parse email
                  const customer = parseEmail(emailData);
                  
                  // Validate customer data
                  if (!customer.name || customer.name === 'Unbekannt') {
                    res.json({ 
                      success: false, 
                      error: 'Could not extract customer name from email' 
                    });
                    imap.end();
                    return;
                  }
                  
                  // Check if customer already exists
                  if (customer.email) {
                    const existingQuery = await db.collection('customers')
                      .where('email', '==', customer.email)
                      .limit(1)
                      .get();
                    
                    if (!existingQuery.empty) {
                      const existing = existingQuery.docs[0].data();
                      res.json({ 
                        success: false, 
                        error: 'Customer already exists',
                        customerNumber: existing.customerNumber
                      });
                      imap.end();
                      return;
                    }
                  }
                  
                  // Generate customer number
                  customer.customerNumber = await generateCustomerNumber(db, emailData.date);
                  customer.id = customer.customerNumber;
                  
                  // Save to Firestore
                  await db.collection('customers').doc(customer.id).set({
                    ...customer,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    importedFrom: 'email-single-import',
                    importDate: new Date()
                  });
                  
                  // Create automatic quote
                  await createAutomaticQuote(customer, db);
                  
                  console.log(`✅ Customer ${customer.customerNumber} imported successfully`);
                  
                  res.json({
                    success: true,
                    customerNumber: customer.customerNumber,
                    customer: {
                      name: customer.name,
                      email: customer.email,
                      phone: customer.phone
                    }
                  });
                  
                  imap.end();
                } catch (error) {
                  console.error('Error importing email:', error);
                  res.json({ 
                    success: false, 
                    error: 'Failed to import email',
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

