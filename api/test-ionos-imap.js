const Imap = require('imap');
const { simpleParser } = require('mailparser');

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

  console.log('🔍 Testing IONOS IMAP connection...');

  const config = {
    user: 'bielefeld@relocato.de',
    password: 'Bicm1308',
    host: 'imap.ionos.de',
    port: 993,
    tls: true,
    tlsOptions: { 
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    },
    connTimeout: 10000,
    authTimeout: 10000
  };

  const emails = [];
  let totalEmails = 0;

  try {
    await new Promise((resolve, reject) => {
      const imap = new Imap(config);
      
      imap.once('ready', () => {
        console.log('✅ IMAP connected successfully');
        
        imap.openBox('INBOX', true, (err, box) => {
          if (err) {
            console.error('❌ Failed to open INBOX:', err);
            reject(err);
            return;
          }
          
          console.log(`📧 INBOX opened. Total messages: ${box.messages.total}`);
          totalEmails = box.messages.total;
          
          if (totalEmails === 0) {
            imap.end();
            resolve({ emails: [], totalEmails: 0 });
            return;
          }
          
          // Fetch last 20 emails
          const fetchRange = Math.max(1, totalEmails - 19) + ':' + totalEmails;
          const fetch = imap.seq.fetch(fetchRange, {
            bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
            struct: true
          });
          
          fetch.on('message', (msg, seqno) => {
            let header = '';
            
            msg.on('body', (stream) => {
              stream.on('data', (chunk) => {
                header += chunk.toString('utf8');
              });
              
              stream.once('end', () => {
                const parsedHeader = Imap.parseHeader(header);
                emails.push({
                  seqno,
                  from: parsedHeader.from ? parsedHeader.from[0] : 'Unknown',
                  to: parsedHeader.to ? parsedHeader.to[0] : 'Unknown',
                  subject: parsedHeader.subject ? parsedHeader.subject[0] : 'No subject',
                  date: parsedHeader.date ? parsedHeader.date[0] : 'Unknown date',
                  hasAttachments: false // Would need to check structure for this
                });
              });
            });
          });
          
          fetch.once('error', (err) => {
            console.error('❌ Fetch error:', err);
            reject(err);
          });
          
          fetch.once('end', () => {
            console.log(`✅ Fetched ${emails.length} emails`);
            imap.end();
          });
        });
      });
      
      imap.once('error', (err) => {
        console.error('❌ IMAP error:', err);
        reject(err);
      });
      
      imap.once('end', () => {
        console.log('📪 IMAP connection ended');
        resolve({ emails, totalEmails });
      });
      
      imap.connect();
    });
    
    // Sort emails by date (newest first)
    emails.reverse();
    
    res.status(200).json({
      success: true,
      totalEmails,
      emails,
      message: `Successfully connected to IONOS IMAP. Found ${totalEmails} emails.`
    });
    
  } catch (error) {
    console.error('❌ IMAP test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to connect to IONOS IMAP server',
      details: {
        host: config.host,
        port: config.port,
        user: config.user,
        errorCode: error.code || 'UNKNOWN'
      }
    });
  }
}