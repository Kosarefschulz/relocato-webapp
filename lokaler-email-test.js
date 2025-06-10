const nodemailer = require('nodemailer');

console.log('🚀 Starte RELOCATO® E-Mail Test...');

// IONOS SMTP Konfiguration
const transporter = nodemailer.createTransport({
  host: 'smtp.ionos.de',
  port: 587,
  secure: false,
  auth: {
    user: 'bielefeld@relocato.de',
    pass: 'Bicm1308'
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  }
});

// Test E-Mail senden
async function sendTestEmail() {
  try {
    console.log('📧 Sende Test-E-Mail...');
    
    const info = await transporter.sendMail({
      from: 'RELOCATO® <bielefeld@relocato.de>',
      to: 'sergej.schulz@relocato.de',
      subject: 'ERFOLG! RELOCATO® E-Mail System funktioniert lokal!',
      text: `Sehr geehrter Herr Schulz,

🎉 PERFEKT! Ihr RELOCATO® E-Mail System funktioniert!

Das wurde getestet:
✅ IONOS SMTP Verbindung
✅ E-Mail Versand
✅ Anmeldedaten korrekt

Ihre Web-App ist bereit für den Einsatz!

RELOCATO® Umzugsservice
E-Mail: bielefeld@relocato.de

Mit freundlichen Grüßen,
Ihr RELOCATO® Team

🚀 System ist vollständig einsatzbereit!`
    });

    console.log('✅ E-Mail erfolgreich gesendet!');
    console.log('📬 Message ID:', info.messageId);
    console.log('📨 Gesendet an:', info.accepted);
    console.log('');
    console.log('🎯 Prüfen Sie jetzt Ihr E-Mail Postfach: sergej.schulz@relocato.de');
    
  } catch (error) {
    console.error('❌ E-Mail Fehler:', error.message);
    console.log('');
    console.log('🔧 Mögliche Lösungen:');
    console.log('1. Prüfen Sie Ihre IONOS Zugangsdaten');
    console.log('2. Prüfen Sie Ihre Internetverbindung');
    console.log('3. Kontaktieren Sie IONOS Support');
  }
}

// Test ausführen
sendTestEmail();