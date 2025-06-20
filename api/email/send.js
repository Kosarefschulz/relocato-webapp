const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // No auth check for now - we're using dummy auth

    // Get email data from request body
    const { to, cc, bcc, subject, text, html, attachments, replyTo } = req.body;

    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, and text or html' });
    }

    // SMTP Configuration
    const transporter = nodemailer.createTransport({
      host: process.env.IONOS_SMTP_HOST || 'smtp.ionos.de',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.IONOS_EMAIL || 'bielefeld@relocato.de',
        pass: process.env.IONOS_PASSWORD || 'Bicm1308'
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Prepare email options
    const mailOptions = {
      from: process.env.IONOS_EMAIL || 'bielefeld@relocato.de',
      to: Array.isArray(to) ? to.join(', ') : to,
      subject: subject,
      text: text,
      html: html,
      headers: {
        'X-Sent-Via': 'Relocato Email Client',
        'X-Priority': '3'
      }
    };

    // Add optional fields
    if (cc) mailOptions.cc = Array.isArray(cc) ? cc.join(', ') : cc;
    if (bcc) mailOptions.bcc = Array.isArray(bcc) ? bcc.join(', ') : bcc;
    if (replyTo) mailOptions.replyTo = replyTo;

    // Handle attachments
    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType,
        encoding: att.encoding || 'base64'
      }));
    }

    // Send email
    const info = await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response
    });

  } catch (error) {
    console.error('Error in send API:', error);
    return res.status(500).json({ 
      error: 'Failed to send email', 
      details: error.message 
    });
  }
};