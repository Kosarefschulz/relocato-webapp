// Lokaler Email Test
const nodemailer = require('nodemailer');
const Imap = require('imap');
require('dotenv').config({ path: '.env.production' });

console.log('🧪 Lokaler Email Test\n');

// Get credentials
const emailUser = process.env.REACT_APP_EMAIL_USERNAME || 'bielefeld@relocato.de';
const emailPass = process.env.REACT_APP_EMAIL_PASSWORD || 'Bicm1308';

console.log(`📧 Email: ${emailUser}`);
console.log(`🔑 Pass: ${emailPass.substring(0, 3)}***\n`);

async function testSMTP() {
  console.log('📤 Teste SMTP...');
  
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

  try {
    await transporter.verify();
    console.log('✅ SMTP Verbindung erfolgreich!');
    
    const info = await transporter.sendMail({
      from: `RELOCATO® <${emailUser}>`,
      to: emailUser,
      subject: `Test Email - ${new Date().toLocaleString('de-DE')}`,
      text: 'Email funktioniert!',
      html: '<h2>✅ Email funktioniert!</h2>'
    });
    
    console.log('✅ Email gesendet! Message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ SMTP Fehler:', error.message);
    return false;
  }
}

async function testIMAP() {
  console.log('\n📥 Teste IMAP...');
  
  return new Promise((resolve) => {
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
      connTimeout: 10000
    });

    imap.once('ready', () => {
      console.log('✅ IMAP Verbindung erfolgreich!');
      
      imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          console.error('❌ Fehler beim Öffnen der Inbox:', err.message);
          imap.end();
          resolve(false);
          return;
        }
        
        console.log(`✅ Inbox geöffnet! ${box.messages.total} Nachrichten`);
        imap.end();
        resolve(true);
      });
    });

    imap.once('error', (err) => {
      console.error('❌ IMAP Fehler:', err.message);
      resolve(false);
    });

    imap.connect();
  });
}

// Run tests
(async () => {
  const smtpOk = await testSMTP();
  const imapOk = await testIMAP();
  
  console.log('\n📊 Zusammenfassung:');
  console.log(`SMTP: ${smtpOk ? '✅ OK' : '❌ FEHLER'}`);
  console.log(`IMAP: ${imapOk ? '✅ OK' : '❌ FEHLER'}`);
  
  if (smtpOk && imapOk) {
    console.log('\n🎉 Email-System funktioniert vollständig!');
  } else {
    console.log('\n⚠️  Email-System hat Probleme!');
  }
})();