const nodemailer = require('nodemailer');
const emailConfig = require('../config/emailConfig');
const { v4: uuidv4 } = require('uuid');

class SmtpService {
  constructor() {
    this.transporter = nodemailer.createTransport(emailConfig.smtp);
  }

  async sendEmail(emailData) {
    const {
      to,
      cc,
      bcc,
      subject,
      text,
      html,
      attachments = [],
      replyTo,
      inReplyTo,
      references,
      priority
    } = emailData;

    const messageId = `<${uuidv4()}@${emailConfig.smtp.auth.user.split('@')[1]}>`;

    const mailOptions = {
      from: emailConfig.smtp.auth.user,
      to,
      cc,
      bcc,
      subject,
      text,
      html,
      attachments: attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType,
        cid: att.cid
      })),
      messageId,
      date: new Date(),
      headers: {
        'X-Priority': priority || '3'
      }
    };

    if (replyTo) mailOptions.replyTo = replyTo;
    if (inReplyTo) mailOptions.inReplyTo = inReplyTo;
    if (references) mailOptions.references = references;

    try {
      const info = await this.transporter.sendMail(mailOptions);
      
      // Save to sent folder
      await this.saveToSentFolder({
        ...mailOptions,
        messageId: info.messageId
      });

      return {
        success: true,
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
        response: info.response
      };
    } catch (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async saveDraft(draftData) {
    const {
      to,
      cc,
      bcc,
      subject,
      text,
      html,
      attachments = []
    } = draftData;

    const draft = {
      id: uuidv4(),
      from: emailConfig.smtp.auth.user,
      to,
      cc,
      bcc,
      subject,
      text,
      html,
      attachments,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Here you would save to IMAP Drafts folder
    // For now, we'll store in memory or database
    return draft;
  }

  async saveToSentFolder(emailData) {
    // This would connect to IMAP and save the sent email
    // Implementation depends on IMAP service integration
    console.log('Saving to sent folder:', emailData.subject);
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      return { connected: true };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }
}

module.exports = SmtpService;