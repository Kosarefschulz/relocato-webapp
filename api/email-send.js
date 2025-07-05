// Send email via IONOS SMTP
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

    // Use Supabase to send email
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = 'https://kmxipuaqierjqaikuimi.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteGlwdWFxaWVyanFhaWt1aW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MjU2NDUsImV4cCI6MjA2NjAwMTY0NX0.2S3cAnBh4zDFFQNpJ-VN17YrSJXyclyFjywN2izuPaU';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    console.log(`📧 Sending email to ${to} with subject: ${subject}`);

    // Call Supabase send-email function
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to,
        subject,
        text: content,
        html: html || content,
        attachments
      }
    });

    if (error) {
      console.error('❌ Error sending email:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      data
    });

  } catch (error) {
    console.error('Email send error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};