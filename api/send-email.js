// Vercel Serverless Function für E-Mail-Versand
// Diese Funktion sendet E-Mails über SMTP

const nodemailer = require('nodemailer');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
  if (serviceAccount.project_id) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID
    });
  }
}

const db = admin.apps.length > 0 ? admin.firestore() : null;

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
    const { to, subject, content, html, cc, bcc, replyTo, attachments } = req.body;
    
    // Support both 'content' and 'html' for backwards compatibility
    const emailHtml = html || content;

    // Validate required fields
    if (!to || !subject || !emailHtml) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, content/html'
      });
    }

    // Get email credentials from environment
    const emailUser = process.env.IONOS_EMAIL_USER || process.env.REACT_APP_EMAIL_USERNAME || process.env.SMTP_USER;
    const emailPass = process.env.IONOS_EMAIL_PASS || process.env.REACT_APP_EMAIL_PASSWORD || process.env.SMTP_PASS;
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ionos.de',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      }
    });

    // Prepare email options
    const mailOptions = {
      from: `"Relocato Bielefeld" <${emailUser}>`,
      to,
      subject,
      html: emailHtml,
      cc,
      bcc,
      replyTo: replyTo || emailUser || 'bielefeld@relocato.de',
      attachments: attachments?.map(att => ({
        filename: att.filename,
        content: att.content,
        encoding: att.encoding || 'base64'
      }))
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);

    // Store sent email in Firestore if database is available
    if (db) {
      try {
        await db.collection('emailClient').add({
          folder: 'Sent',
          from: mailOptions.from,
          to,
          cc,
          bcc,
          subject,
          html: emailHtml,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          messageId: info.messageId
        });
      } catch (dbError) {
        console.log('Failed to store email in Firestore:', dbError.message);
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