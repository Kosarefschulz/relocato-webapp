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

    // Get the actual content - handle when content is HTML
    const emailHtml = html || content || `<div style="font-family: Arial, sans-serif;">${text || 'No content'}</div>`;
    const emailText = text || (typeof content === 'string' && !content.includes('<') ? content : 'Please view HTML version');

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

    // Prepare mail options
    const mailOptions = {
      from: `"Relocato Bielefeld" <${IONOS_EMAIL}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject: subject,
      text: emailText,
      html: emailHtml
    };

    // Handle attachments properly
    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments.map(att => {
        // Handle base64 encoded content
        if (att.content && typeof att.content === 'string') {
          return {
            filename: att.filename,
            content: Buffer.from(att.content, 'base64'),
            encoding: 'base64'
          };
        }
        return att;
      });
    }

    // Send email
    const info = await transporter.sendMail(mailOptions);

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
    console.error('Full error details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    
    // More detailed error response
    let errorMessage = error.message;
    if (error.code === 'EAUTH') {
      errorMessage = 'SMTP authentication failed. Please check credentials.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Failed to connect to SMTP server.';
    } else if (error.responseCode === 554) {
      errorMessage = 'Email rejected by server. Check recipient address and content.';
    }
    
    return res.status(500).json({
      success: false,
      error: errorMessage,
      code: error.code,
      response: error.response,
      responseCode: error.responseCode,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};