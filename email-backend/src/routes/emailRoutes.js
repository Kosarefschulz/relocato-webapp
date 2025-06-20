const express = require('express');
const router = express.Router();
const multer = require('multer');
const emailController = require('../controllers/emailController');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_ATTACHMENT_SIZE) || 10 * 1024 * 1024 // 10MB
  }
});

// Get emails with pagination and search
router.get('/', emailController.getEmails);

// Get single email
router.get('/:id', emailController.getEmail);

// Send email
router.post('/send', upload.array('attachments', 10), emailController.sendEmail);

// Save draft
router.post('/draft', upload.array('attachments', 10), emailController.saveDraft);

// Update email flags
router.put('/:id/flags', emailController.updateFlags);

// Mark as read
router.put('/:id/read', emailController.markAsRead);

// Mark as unread
router.put('/:id/unread', emailController.markAsUnread);

// Star/unstar email
router.put('/:id/star', emailController.starEmail);

// Move email to folder
router.put('/:id/move', emailController.moveEmail);

// Delete email
router.delete('/:id', emailController.deleteEmail);

// Search emails
router.get('/search', emailController.searchEmails);

// Get email thread
router.get('/:id/thread', emailController.getEmailThread);

// Reply to email
router.post('/:id/reply', upload.array('attachments', 10), emailController.replyToEmail);

// Forward email
router.post('/:id/forward', upload.array('attachments', 10), emailController.forwardEmail);

module.exports = router;