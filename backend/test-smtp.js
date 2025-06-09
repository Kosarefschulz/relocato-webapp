const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('🧪 IONOS SMTP Verbindungstest...\n');

// SMTP Konfiguration anzeigen
console.log('📧 Konfiguration:');
console.log(`Host: ${process.env.SMTP_HOST}`);
console.log(`Port: ${process.env.SMTP_PORT}`);
console.log(`User: ${process.env.SMTP_USER}`);
console.log(`From: ${process.env.SMTP_FROM || process.env.SMTP_USER}`);
console.log('---\n');

// Transporter erstellen
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ionos.de',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  }
});

// Verbindung testen
console.log('🔌 Teste Verbindung...');
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Verbindung fehlgeschlagen:', error.message);
    console.error('\nMögliche Lösungen:');
    console.error('1. Prüfen Sie Benutzername und Passwort');
    console.error('2. Stellen Sie sicher, dass die E-Mail-Adresse existiert');
    console.error('3. Prüfen Sie die IONOS Firewall-Einstellungen');
    console.error('4. Versuchen Sie Port 465 statt 587');
    process.exit(1);
  } else {
    console.log('✅ SMTP-Verbindung erfolgreich!');
    console.log('\n📮 Sende Test-E-Mail...');
    
    // Test-E-Mail senden
    const mailOptions = {
      from: `RELOCATO® Test <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: 'IONOS SMTP Test erfolgreich',
      html: `
        <h2>✅ IONOS SMTP funktioniert!</h2>
        <p>Diese E-Mail wurde erfolgreich über Ihren IONOS SMTP-Server gesendet.</p>
        <hr>
        <p><strong>Konfiguration:</strong></p>
        <ul>
          <li>Host: ${process.env.SMTP_HOST}</li>
          <li>Port: ${process.env.SMTP_PORT}</li>
          <li>Von: ${process.env.SMTP_FROM || process.env.SMTP_USER}</li>
        </ul>
        <p>Ihr E-Mail-Backend ist bereit für den Einsatz!</p>
      `
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('❌ E-Mail-Versand fehlgeschlagen:', error.message);
      } else {
        console.log('✅ Test-E-Mail erfolgreich gesendet!');
        console.log('Message ID:', info.messageId);
        console.log('\n🎉 Ihr IONOS SMTP ist vollständig konfiguriert!');
      }
      process.exit(0);
    });
  }
});