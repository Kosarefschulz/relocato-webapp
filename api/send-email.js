// Vercel Serverless Function für E-Mail-Versand
// Diese Funktion sendet E-Mails über SMTP

const nodemailer = require('nodemailer');

const db = admin.firestore();

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, html, cc, bcc, replyTo, attachments } = req.body;

    // Validate required fields
    if (!to || !subject || !html) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, html'
      });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.ionos.de',
      port: 587,
      secure: false,
      auth: {
        user: process.env.IONOS_EMAIL_USER || 'bielefeld@relocato.de',
        pass: process.env.IONOS_EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Prepare email options
    const mailOptions = {
      from: `"Relocato Bielefeld" <${process.env.IONOS_EMAIL_USER || 'bielefeld@relocato.de'}>`,
      to,
      subject,
      html,
      cc,
      bcc,
      replyTo: replyTo || process.env.IONOS_EMAIL_USER || 'bielefeld@relocato.de',
      attachments: attachments?.map(att => ({
        filename: att.filename,
        content: att.content,
        encoding: att.encoding || 'base64'
      }))
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);

    // Store sent email in Firestore if we have authentication
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const userId = decodedToken.uid;
        
        // Store sent email
        await db.collection('emailClient').add({
          folder: 'Sent',
          from: mailOptions.from,
          to,
          cc,
          bcc,
          subject,
          html,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          userId,
          messageId: info.messageId
        });
      } catch (authError) {
        console.log('Auth verification failed, skipping Firestore storage:', authError.message);
      }
    }
    
    const response = {
      success: true,
      messageId: info.messageId,
      message: 'E-Mail wurde erfolgreich gesendet'
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}