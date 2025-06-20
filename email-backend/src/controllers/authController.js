const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/auth');
const SmtpService = require('../services/smtpService');
const ImapService = require('../services/imapService');

// Login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // For this implementation, we'll use the email credentials directly
    // In production, you'd have proper user management
    if (email !== process.env.EMAIL_USER) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate user object
    const user = {
      id: '1',
      email: email
    };

    // Generate token
    const token = generateToken(user);

    res.json({
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

// Logout
exports.logout = async (req, res, next) => {
  try {
    // Disconnect IMAP if needed
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// Refresh token
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    // Implementation for refresh token
    const newToken = generateToken(req.user);
    
    res.json({ token: newToken });
  } catch (error) {
    next(error);
  }
};

// Verify connection
exports.verifyConnection = async (req, res, next) => {
  try {
    const smtpService = new SmtpService();
    const smtpStatus = await smtpService.verifyConnection();
    
    const imapService = new ImapService();
    let imapStatus = { connected: false };
    
    try {
      await imapService.connect();
      imapStatus = { connected: true };
      imapService.disconnect();
    } catch (error) {
      imapStatus = { connected: false, error: error.message };
    }

    res.json({
      smtp: smtpStatus,
      imap: imapStatus
    });
  } catch (error) {
    next(error);
  }
};