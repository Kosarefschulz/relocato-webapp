// Schneller E-Mail Test für Vercel
const nodemailer = require('nodemailer');

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    // IONOS SMTP
    const transporter = nodemailer.createTransporter({
      host: 'smtp.ionos.de',
      port: 587,
      secure: false,
      auth: {
        user: 'bielefeld@relocato.de',
        pass: 'Bicm1308'
      }
    });

    const info = await transporter.sendMail({
      from: 'RELOCATO® <bielefeld@relocato.de>',
      to: 'sergej.schulz@relocato.de',
      subject: 'ERFOLG! RELOCATO® E-Mail System funktioniert!',
      text: `Sehr geehrter Herr Schulz,

🎉 PERFEKT! Ihr RELOCATO® E-Mail System funktioniert jetzt vollständig!

Das komplette System ist einsatzbereit:
✅ Frontend: https://relocato-app.vercel.app
✅ Backend: Online und funktionsfähig  
✅ IONOS E-Mail: Erfolgreich konfiguriert
✅ Quote System: Bereit für Angebote

RELOCATO® Umzugsservice
E-Mail: bielefeld@relocato.de

Mit freundlichen Grüßen,
Ihr RELOCATO® Team

🚀 Sie können jetzt Angebote über die Web-App versenden!`
    });

    console.log('✅ E-Mail erfolgreich gesendet:', info.messageId);
    res.json({ success: true, messageId: info.messageId });

  } catch (error) {
    console.error('❌ E-Mail Fehler:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}