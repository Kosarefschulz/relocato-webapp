const ImapService = require('../services/imapService');
const SmtpService = require('../services/smtpService');

const imapService = new ImapService();
const smtpService = new SmtpService();

// Get emails with pagination
exports.getEmails = async (req, res, next) => {
  try {
    const {
      folder = 'INBOX',
      page = 1,
      limit = 50,
      search,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    const emails = await imapService.getEmails(folder, {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      sortBy,
      sortOrder
    });

    res.json(emails);
  } catch (error) {
    next(error);
  }
};

// Get single email
exports.getEmail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { folder = 'INBOX' } = req.query;

    const email = await imapService.getEmail(folder, id);
    
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    res.json(email);
  } catch (error) {
    next(error);
  }
};

// Send email
exports.sendEmail = async (req, res, next) => {
  try {
    const {
      to,
      cc,
      bcc,
      subject,
      text,
      html,
      replyTo,
      inReplyTo,
      references,
      priority
    } = req.body;

    const attachments = req.files?.map(file => ({
      filename: file.originalname,
      content: file.buffer,
      contentType: file.mimetype
    })) || [];

    const result = await smtpService.sendEmail({
      to,
      cc,
      bcc,
      subject,
      text,
      html,
      attachments,
      replyTo,
      inReplyTo,
      references,
      priority
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`user-${req.user.id}`).emit('email-sent', result);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Save draft
exports.saveDraft = async (req, res, next) => {
  try {
    const draftData = req.body;
    const attachments = req.files?.map(file => ({
      filename: file.originalname,
      content: file.buffer,
      contentType: file.mimetype
    })) || [];

    const draft = await smtpService.saveDraft({
      ...draftData,
      attachments
    });

    res.json(draft);
  } catch (error) {
    next(error);
  }
};

// Update email flags
exports.updateFlags = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { folder = 'INBOX', flags } = req.body;

    // Implementation for updating multiple flags
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// Mark as read
exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { folder = 'INBOX' } = req.body;

    await imapService.markAsRead(folder, id);

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`user-${req.user.id}`).emit('email-read', { id, folder });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// Mark as unread
exports.markAsUnread = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { folder = 'INBOX' } = req.body;

    await imapService.markAsUnread(folder, id);

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`user-${req.user.id}`).emit('email-unread', { id, folder });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// Star/unstar email
exports.starEmail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { folder = 'INBOX', starred } = req.body;

    if (starred) {
      await imapService.flagEmail(folder, id, '\\Flagged');
    } else {
      await imapService.unflagEmail(folder, id, '\\Flagged');
    }

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`user-${req.user.id}`).emit('email-starred', { id, folder, starred });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// Move email
exports.moveEmail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sourceFolder, targetFolder } = req.body;

    await imapService.moveEmail(sourceFolder, targetFolder, id);

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`user-${req.user.id}`).emit('email-moved', { id, sourceFolder, targetFolder });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// Delete email
exports.deleteEmail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { folder = 'INBOX' } = req.query;

    await imapService.deleteEmail(folder, id);

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`user-${req.user.id}`).emit('email-deleted', { id, folder });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// Search emails
exports.searchEmails = async (req, res, next) => {
  try {
    const { q, folder = 'INBOX', from, to, subject } = req.query;

    let criteria = [];
    if (q) criteria.push(['TEXT', q]);
    if (from) criteria.push(['FROM', from]);
    if (to) criteria.push(['TO', to]);
    if (subject) criteria.push(['SUBJECT', subject]);

    const results = await imapService.searchEmails(folder, criteria);
    res.json(results);
  } catch (error) {
    next(error);
  }
};

// Get email thread
exports.getEmailThread = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Implementation for getting email thread/conversation
    res.json({ thread: [] });
  } catch (error) {
    next(error);
  }
};

// Reply to email
exports.replyToEmail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const replyData = req.body;
    
    // Get original email for references
    const originalEmail = await imapService.getEmail('INBOX', id);
    
    const result = await smtpService.sendEmail({
      ...replyData,
      inReplyTo: originalEmail.parsed.messageId,
      references: originalEmail.parsed.references 
        ? `${originalEmail.parsed.references} ${originalEmail.parsed.messageId}`
        : originalEmail.parsed.messageId
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Forward email
exports.forwardEmail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const forwardData = req.body;
    
    // Get original email
    const originalEmail = await imapService.getEmail('INBOX', id);
    
    const result = await smtpService.sendEmail({
      ...forwardData,
      subject: `Fwd: ${originalEmail.parsed.subject}`,
      attachments: originalEmail.parsed.attachments || []
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};