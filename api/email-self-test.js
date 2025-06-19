// Email System Self-Test
const nodemailer = require('nodemailer');
const Imap = require('imap');

// Store test results
let lastTestResult = null;
let lastTestTime = null;

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const emailUser = process.env.SMTP_USER || 'bielefeld@relocato.de';
  const emailPass = process.env.SMTP_PASS || 'Bicm1308';
  
  // Return last test result if recent (< 5 minutes)
  if (lastTestResult && lastTestTime && (Date.now() - lastTestTime < 300000)) {
    return res.json({
      ...lastTestResult,
      cached: true,
      age: Math.floor((Date.now() - lastTestTime) / 1000) + 's'
    });
  }
  
  // Run new test
  const testResult = {
    timestamp: new Date().toISOString(),
    smtp: { status: 'testing' },
    imap: { status: 'testing' },
    overall: false
  };
  
  // Test SMTP
  try {
    const transporter = nodemailer.createTransporter({
      host: 'smtp.ionos.de',
      port: 587,
      secure: false,
      auth: {
        user: emailUser,
        pass: emailPass
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      }
    });
    
    await transporter.verify();
    testResult.smtp = {
      status: 'ok',
      message: 'SMTP connection successful'
    };
    
    // Send test email to self
    const testId = Date.now().toString(36);
    const info = await transporter.sendMail({
      from: emailUser,
      to: emailUser,
      subject: `Self-Test ${testId}`,
      text: 'This is an automated self-test email.',
      headers: {
        'X-Test-ID': testId
      }
    });
    
    testResult.smtp.testEmailId = testId;
    testResult.smtp.messageId = info.messageId;
  } catch (error) {
    testResult.smtp = {
      status: 'error',
      message: error.message
    };
  }
  
  // Test IMAP (with timeout)
  const imapTest = new Promise((resolve) => {
    const imap = new Imap({
      user: emailUser,
      password: emailPass,
      host: 'imap.ionos.de',
      port: 993,
      tls: true,
      tlsOptions: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      },
      connTimeout: 5000
    });
    
    const timeout = setTimeout(() => {
      imap.destroy();
      resolve({
        status: 'timeout',
        message: 'IMAP connection timeout'
      });
    }, 5000);
    
    imap.once('ready', () => {
      clearTimeout(timeout);
      imap.end();
      resolve({
        status: 'ok',
        message: 'IMAP connection successful'
      });
    });
    
    imap.once('error', (err) => {
      clearTimeout(timeout);
      resolve({
        status: 'error',
        message: err.message
      });
    });
    
    imap.connect();
  });
  
  testResult.imap = await imapTest;
  
  // Overall status
  testResult.overall = 
    testResult.smtp.status === 'ok' && 
    testResult.imap.status === 'ok';
  
  // Cache result
  lastTestResult = testResult;
  lastTestTime = Date.now();
  
  res.json(testResult);
}