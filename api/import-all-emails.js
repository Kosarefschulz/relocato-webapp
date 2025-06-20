const admin = require('firebase-admin');
const Imap = require('imap');
const { simpleParser } = require('mailparser');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID
  });
}

const db = admin.firestore();

// Email parser function
function parseEmailForCustomer(email) {
  const customer = {
    name: '',
    email: email.from?.text || '',
    phone: '',
    movingDate: '',
    fromAddress: '',
    toAddress: '',
    apartment: {
      rooms: 0,
      area: 0,
      floor: 0,
      hasElevator: false
    },
    services: [],
    createdAt: email.date || new Date(),
    source: 'email',
    emailSubject: email.subject || '',
    emailContent: email.text || email.html || ''
  };

  // Extract phone number
  const phoneMatch = (email.text || '').match(/(\+49|0)[\d\s\-\/\(\)]+\d/);
  if (phoneMatch) {
    customer.phone = phoneMatch[0].replace(/\s/g, '');
  }

  // Extract moving date
  const datePatterns = [
    /(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{2,4})/,
    /(\d{1,2})\.(\d{1,2})\.(\d{2,4})/
  ];
  
  for (const pattern of datePatterns) {
    const match = (email.text || '').match(pattern);
    if (match) {
      const [_, day, month, year] = match;
      const fullYear = year.length === 2 ? '20' + year : year;
      customer.movingDate = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      break;
    }
  }

  // Extract addresses
  const addressPattern = /von\s+(.+?)\s+nach\s+(.+?)(?:\.|,|\n|$)/i;
  const addressMatch = (email.text || '').match(addressPattern);
  if (addressMatch) {
    customer.fromAddress = addressMatch[1].trim();
    customer.toAddress = addressMatch[2].trim();
  }

  // Extract name from email if not found
  if (!customer.name && email.from?.value?.[0]?.name) {
    customer.name = email.from.value[0].name;
  }

  return customer;
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { dateFrom, dateTo, skipDuplicates = true } = req.body;

  console.log('📧 Starting email import...');
  console.log('Date range:', dateFrom, 'to', dateTo);

  const config = {
    user: 'bielefeld@relocato.de',
    password: 'Bicm1308',
    host: 'imap.ionos.de',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    connTimeout: 30000,
    authTimeout: 30000
  };

  const importStats = {
    totalEmails: 0,
    processedEmails: 0,
    newCustomers: 0,
    duplicates: 0,
    errors: 0,
    customers: []
  };

  try {
    await new Promise((resolve, reject) => {
      const imap = new Imap(config);
      
      imap.once('ready', () => {
        console.log('✅ Connected to IONOS');
        
        imap.openBox('INBOX', false, async (err, box) => {
          if (err) {
            reject(err);
            return;
          }
          
          // Build search criteria
          let searchCriteria = ['ALL'];
          
          if (dateFrom) {
            searchCriteria.push(['SINCE', new Date(dateFrom).toISOString().split('T')[0]]);
          }
          
          if (dateTo) {
            searchCriteria.push(['BEFORE', new Date(dateTo).toISOString().split('T')[0]]);
          }
          
          console.log('Search criteria:', searchCriteria);
          
          imap.search(searchCriteria, async (err, results) => {
            if (err) {
              reject(err);
              return;
            }
            
            if (!results || results.length === 0) {
              console.log('📭 No emails found');
              imap.end();
              resolve(importStats);
              return;
            }
            
            importStats.totalEmails = results.length;
            console.log(`📧 Found ${results.length} emails to process`);
            
            // Process emails
            const fetch = imap.fetch(results, { 
              bodies: '', 
              markSeen: false 
            });
            
            const emailPromises = [];
            
            fetch.on('message', (msg, seqno) => {
              const emailPromise = new Promise((resolveEmail) => {
                msg.on('body', (stream, info) => {
                  simpleParser(stream, async (err, parsed) => {
                    if (err) {
                      console.error('Parse error:', err);
                      importStats.errors++;
                      resolveEmail();
                      return;
                    }
                    
                    try {
                      // Parse customer from email
                      const customer = parseEmailForCustomer(parsed);
                      
                      // Check for duplicates
                      if (skipDuplicates && customer.email) {
                        const existingCustomer = await db.collection('customers')
                          .where('email', '==', customer.email)
                          .limit(1)
                          .get();
                        
                        if (!existingCustomer.empty) {
                          importStats.duplicates++;
                          resolveEmail();
                          return;
                        }
                      }
                      
                      // Save customer
                      const docRef = await db.collection('customers').add({
                        ...customer,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        importedAt: admin.firestore.FieldValue.serverTimestamp(),
                        importSource: 'manual-import'
                      });
                      
                      importStats.newCustomers++;
                      importStats.customers.push({
                        id: docRef.id,
                        ...customer
                      });
                      
                      importStats.processedEmails++;
                      resolveEmail();
                      
                    } catch (error) {
                      console.error('Error processing email:', error);
                      importStats.errors++;
                      resolveEmail();
                    }
                  });
                });
              });
              
              emailPromises.push(emailPromise);
            });
            
            fetch.once('error', (err) => {
              console.error('Fetch error:', err);
              reject(err);
            });
            
            fetch.once('end', async () => {
              console.log('⏳ Waiting for all emails to be processed...');
              await Promise.all(emailPromises);
              console.log('✅ All emails processed');
              imap.end();
              resolve(importStats);
            });
          });
        });
      });
      
      imap.once('error', (err) => {
        console.error('IMAP Error:', err);
        reject(err);
      });
      
      imap.connect();
    });
    
    // Update import metadata
    await db.collection('system').doc('import_metadata').set({
      lastManualImport: admin.firestore.FieldValue.serverTimestamp(),
      lastManualImportStats: importStats
    }, { merge: true });
    
    res.status(200).json({
      success: true,
      ...importStats,
      message: `Successfully imported ${importStats.newCustomers} new customers`
    });
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Import failed',
      ...importStats
    });
  }
}