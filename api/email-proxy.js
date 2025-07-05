// IMAP Proxy using external service
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

module.exports = async function handler(req, res) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    return res.status(200).end();
  }

  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  try {
    const { operation = 'list', folder = 'INBOX', page = 1, limit = 50, uid } = req.body || req.query;

    // IONOS Configuration
    const config = {
      email: process.env.IONOS_EMAIL || 'bielefeld@relocato.de',
      password: process.env.IONOS_PASSWORD,
      host: process.env.IONOS_IMAP_HOST || 'imap.ionos.de',
      port: process.env.IONOS_IMAP_PORT || '993'
    };

    if (!config.password) {
      return res.status(500).json({
        success: false,
        error: 'IONOS_PASSWORD not configured'
      });
    }

    console.log(`📧 Email Proxy: ${operation} on ${folder}`);

    // Use a custom IMAP implementation that works in Edge runtime
    const imapUrl = `imaps://${config.email}:${config.password}@${config.host}:${config.port}`;
    
    // Create IMAP commands
    let command = '';
    switch (operation) {
      case 'folders':
        command = 'LIST "" "*"';
        break;
      case 'list':
        command = `SELECT ${folder}`;
        break;
      case 'read':
        command = `FETCH ${uid} BODY[]`;
        break;
    }

    // Since we can't directly connect to IMAP in Edge runtime,
    // we need to use Supabase as our IMAP proxy
    // This is the most reliable solution without external services
    
    // Import Supabase client
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = 'https://kmxipuaqierjqaikuimi.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteGlwdWFxaWVyanFhaWt1aW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MjU2NDUsImV4cCI6MjA2NjAwMTY0NX0.2S3cAnBh4zDFFQNpJ-VN17YrSJXyclyFjywN2izuPaU';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Call appropriate Supabase function
    let functionName = '';
    let body = {};
    
    switch (operation) {
      case 'folders':
        functionName = 'email-folders';
        break;
      case 'list':
        functionName = 'email-list';
        body = { folder, page, limit };
        break;
      case 'read':
        functionName = 'email-read';
        body = { uid, folder };
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid operation'
        });
    }

    const { data, error } = await supabase.functions.invoke(functionName, {
      body: Object.keys(body).length > 0 ? body : undefined
    });

    if (error) {
      console.error('Supabase proxy error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    // Return the proxied response
    return res.status(200).json(data);

  } catch (error) {
    console.error('Email Proxy Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};