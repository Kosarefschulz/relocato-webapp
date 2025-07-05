// Send email via IONOS SMTP using nodemailer
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
    const { to, subject, content, html, attachments } = req.body;

    if (!to || !subject || (!content && !html)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, and content/html'
      });
    }

    // IONOS SMTP configuration
    const transporter = nodemailer.createTransport({
      host: process.env.IONOS_SMTP_HOST || 'smtp.ionos.de',
      port: parseInt(process.env.IONOS_SMTP_PORT || '587'),
      secure: false, // false for STARTTLS
      auth: {
        user: process.env.IONOS_EMAIL || 'bielefeld@relocato.de',
        pass: process.env.IONOS_PASSWORD
      },
      tls: {
        rejectUnauthorized: false, // Accept self-signed certificates
        ciphers: 'SSLv3'
      }
    });

    console.log(`📧 Sending email to ${to} with subject: ${subject}`);

    // Prepare email options
    const mailOptions = {
      from: `"Relocato Bielefeld" <${process.env.IONOS_EMAIL || 'bielefeld@relocato.de'}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject: subject,
      text: content || '',
      html: html || content || '',
      attachments: attachments || []
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully:', info.messageId);

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response
    });

  } catch (error) {
    console.error('❌ Email send error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      command: error.command
    });
  }
};