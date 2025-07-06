// Direct email sending with hardcoded credentials as fallback
const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { to, subject, text, html, content, attachments } = req.body;

    if (!to || !subject) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to and subject'
      });
    }

    // Get credentials with fallback
    const IONOS_EMAIL = process.env.IONOS_EMAIL || 'bielefeld@relocato.de';
    const IONOS_PASSWORD = process.env.IONOS_PASSWORD || 'Bicm1308';
    const IONOS_HOST = process.env.IONOS_SMTP_HOST || 'smtp.ionos.de';
    const IONOS_PORT = parseInt(process.env.IONOS_SMTP_PORT || '587');

    console.log('📧 Email configuration:', {
      host: IONOS_HOST,
      port: IONOS_PORT,
      user: IONOS_EMAIL,
      hasPassword: !!IONOS_PASSWORD
    });

    // Get the actual content
    const emailText = text || content || 'No content';
    const emailHtml = html || `<div style="font-family: Arial, sans-serif;">${emailText.replace(/\n/g, '<br>')}</div>`;

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: IONOS_HOST,
      port: IONOS_PORT,
      secure: false,
      auth: {
        user: IONOS_EMAIL,
        pass: IONOS_PASSWORD
      },
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      }
    });

    // Send email
    const info = await transporter.sendMail({
      from: `"Relocato Bielefeld" <${IONOS_EMAIL}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject: subject,
      text: emailText,
      html: emailHtml,
      attachments: attachments || []
    });

    console.log('✅ Email sent successfully:', info.messageId);

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected
    });

  } catch (error) {
    console.error('❌ Email sending failed:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};