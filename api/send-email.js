// Vercel Serverless Function für E-Mail-Versand
// Diese Funktion sendet E-Mails direkt über IONOS SMTP

const nodemailer = require('nodemailer');

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

    // Get email credentials from environment with fallback
    const emailUser = process.env.IONOS_EMAIL || 'bielefeld@relocato.de';
    const emailPass = process.env.IONOS_PASSWORD || 'Bicm1308';
    const smtpHost = process.env.IONOS_SMTP_HOST || 'smtp.ionos.de';
    const smtpPort = parseInt(process.env.IONOS_SMTP_PORT || '587');
    
    console.log('📧 Sending email via IONOS SMTP...');
    console.log('Configuration:', {
      host: smtpHost,
      port: smtpPort,
      user: emailUser,
      to: to,
      subject: subject
    });
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      }
    });

    // Prepare email options
    const mailOptions = {
      from: `"Relocato Bielefeld" <${emailUser}>`,
      to,
      subject,
      html: emailHtml,
      cc,
      bcc: bcc || 'bielefeld@relocato.de', // Always BCC to have a copy
      replyTo: replyTo || emailUser,
      attachments: attachments?.map(att => {
        // Handle base64 encoded content
        if (att.content && typeof att.content === 'string' && att.content.length > 0) {
          return {
            filename: att.filename,
            content: Buffer.from(att.content, 'base64'),
            encoding: 'base64'
          };
        }
        return {
          filename: att.filename,
          content: att.content,
          encoding: att.encoding || 'base64'
        };
      })
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    
    const response = {
      success: true,
      messageId: info.messageId,
      message: 'E-Mail wurde erfolgreich gesendet'
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Send email error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      details: {
        code: error.code,
        response: error.response
      }
    });
  }
}