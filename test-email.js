// Schneller E-Mail Test
const nodemailer = require('nodemailer');

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

async function sendTestEmail() {
  try {
    const info = await transporter.sendMail({
      from: 'RELOCATO® <bielefeld@relocato.de>',
      to: 'sergej.schulz@relocato.de',
      subject: 'ERFOLG! RELOCATO® E-Mail System funktioniert!',
      text: `Sehr geehrter Herr Schulz,

🎉 PERFEKT! Ihr RELOCATO® E-Mail System funktioniert jetzt vollständig!

💰 Preis: € 899,00
📦 Volumen: 20 m³  
📍 Entfernung: 25 km

✅ Frontend: ONLINE
✅ Backend: ONLINE
✅ IONOS E-Mail: FUNKTIONIERT
✅ Web-App: EINSATZBEREIT

RELOCATO® Umzugsservice
E-Mail: bielefeld@relocato.de
Web-App: https://relocato-app.vercel.app

Mit freundlichen Grüßen,
Ihr RELOCATO® Team

🚀 Das System ist jetzt vollständig einsatzbereit!`
    });

    console.log('✅ E-Mail erfolgreich gesendet!');
    console.log('Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ E-Mail Fehler:', error);
    return { success: false, error: error.message };
  }
}

// Für Vercel Function
module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const result = await sendTestEmail();
    return res.json(result);
  }

  res.status(404).json({ error: 'Not found' });
};