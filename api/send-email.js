export default async function handler(req, res) {
  // CORS Headers setzen
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Nur POST erlauben
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { to, subject, content, attachments, bcc } = req.body;
    
    if (!to || !subject || !content) {
      res.status(400).json({ 
        success: false, 
        error: 'Fehlende Pflichtfelder: to, subject, content' 
      });
      return;
    }

    // Dynamisches Import von nodemailer
    const nodemailer = await import('nodemailer').then(m => m.default);

    // IONOS SMTP Konfiguration
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ionos.de',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // false für STARTTLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // E-Mail-Optionen
    const mailOptions = {
      from: `Relocato Bielefeld <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      text: content.replace(/<[^>]*>/g, ''), // HTML zu Text
      html: content,
      attachments: []
    };

    // BCC hinzufügen
    if (bcc) {
      mailOptions.bcc = bcc;
    }

    // Anhänge verarbeiten
    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        encoding: 'base64'
      }));
    }

    // E-Mail senden
    const info = await transporter.sendMail(mailOptions);
    
    console.log('E-Mail erfolgreich gesendet:', info);
    
    res.status(200).json({
      success: true,
      messageId: info.messageId,
      response: info.response
    });

  } catch (error) {
    console.error('E-Mail Fehler:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Fehler beim E-Mail-Versand'
    });
  }
}