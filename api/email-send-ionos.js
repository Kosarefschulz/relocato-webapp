// Send email via IONOS SMTP - simplified version
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
    const { to, subject, text, html, content } = req.body;

    if (!to || !subject) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to and subject'
      });
    }

    // Get the actual content
    const emailText = text || content || 'No content';
    const emailHtml = html || `<p>${emailText}</p>`;

    console.log('📧 Preparing to send email:', {
      to,
      subject,
      hasText: !!emailText,
      hasHtml: !!emailHtml
    });

    // Create transporter with IONOS settings
    const transporter = nodemailer.createTransport({
      host: 'smtp.ionos.de',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: 'bielefeld@relocato.de',
        pass: 'Bicm1308'
      },
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      },
      debug: true, // Enable debug output
      logger: true // Log to console
    });

    // Verify connection
    try {
      await transporter.verify();
      console.log('✅ SMTP connection verified');
    } catch (verifyError) {
      console.error('❌ SMTP verification failed:', verifyError);
      // Continue anyway, sometimes verify fails but send works
    }

    // Send email
    const info = await transporter.sendMail({
      from: '"Relocato Bielefeld" <bielefeld@relocato.de>',
      to: to,
      subject: subject,
      text: emailText,
      html: emailHtml
    });

    console.log('✅ Email sent:', info);

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected
    });

  } catch (error) {
    console.error('❌ Email error:', error);
    
    // Check for specific error types
    let errorMessage = error.message;
    if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed. Please check SMTP credentials.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Failed to connect to SMTP server.';
    }

    return res.status(500).json({
      success: false,
      error: errorMessage,
      code: error.code,
      details: error.response || error.stack
    });
  }
};