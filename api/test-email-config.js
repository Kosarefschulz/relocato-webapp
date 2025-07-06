// Test endpoint to verify email configuration
module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check environment variables
  const config = {
    IONOS_EMAIL: process.env.IONOS_EMAIL || 'Not set',
    IONOS_PASSWORD: process.env.IONOS_PASSWORD ? 'Set (hidden)' : 'Not set',
    IONOS_SMTP_HOST: process.env.IONOS_SMTP_HOST || 'Not set',
    IONOS_SMTP_PORT: process.env.IONOS_SMTP_PORT || 'Not set',
    // Legacy variable names
    IONOS_EMAIL_USER: process.env.IONOS_EMAIL_USER || 'Not set',
    IONOS_EMAIL_PASS: process.env.IONOS_EMAIL_PASS ? 'Set (hidden)' : 'Not set',
    REACT_APP_EMAIL_USERNAME: process.env.REACT_APP_EMAIL_USERNAME || 'Not set',
    REACT_APP_EMAIL_PASSWORD: process.env.REACT_APP_EMAIL_PASSWORD ? 'Set (hidden)' : 'Not set',
    SMTP_USER: process.env.SMTP_USER || 'Not set',
    SMTP_PASS: process.env.SMTP_PASS ? 'Set (hidden)' : 'Not set',
    SMTP_HOST: process.env.SMTP_HOST || 'Not set',
    SMTP_PORT: process.env.SMTP_PORT || 'Not set',
    // Node environment
    NODE_ENV: process.env.NODE_ENV || 'Not set',
    VERCEL: process.env.VERCEL || 'Not set',
    VERCEL_ENV: process.env.VERCEL_ENV || 'Not set'
  };

  // Check which email variables are actually being used
  const emailUser = process.env.IONOS_EMAIL || process.env.IONOS_EMAIL_USER || process.env.REACT_APP_EMAIL_USERNAME || process.env.SMTP_USER;
  const emailPass = process.env.IONOS_PASSWORD || process.env.IONOS_EMAIL_PASS || process.env.REACT_APP_EMAIL_PASSWORD || process.env.SMTP_PASS;
  const smtpHost = process.env.IONOS_SMTP_HOST || process.env.SMTP_HOST || 'smtp.ionos.de';
  const smtpPort = process.env.IONOS_SMTP_PORT || process.env.SMTP_PORT || '587';

  const activeConfig = {
    email: emailUser || 'No email configured',
    password: emailPass ? 'Configured' : 'Not configured',
    host: smtpHost,
    port: smtpPort
  };

  return res.status(200).json({
    success: true,
    message: 'Email configuration check',
    environmentVariables: config,
    activeConfiguration: activeConfig,
    recommendation: !emailUser || !emailPass ? 
      'Email credentials are not properly configured. Please set IONOS_EMAIL and IONOS_PASSWORD environment variables in Vercel.' : 
      'Email credentials appear to be configured.'
  });
};