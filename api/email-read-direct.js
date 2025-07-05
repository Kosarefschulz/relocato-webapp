// Direct email read endpoint that calls Supabase
module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { uid, folder = 'INBOX' } = req.body || req.query;

  if (!uid) {
    return res.status(400).json({
      success: false,
      error: 'Email UID is required'
    });
  }

  try {
    // Call Supabase Edge Function directly
    const supabaseUrl = 'https://kmxipuaqierjqaikuimi.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteGlwdWFxaWVyanFhaWt1aW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MjU2NDUsImV4cCI6MjA2NjAwMTY0NX0.2S3cAnBh4zDFFQNpJ-VN17YrSJXyclyFjywN2izuPaU';
    
    const response = await fetch(`${supabaseUrl}/functions/v1/email-read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({ uid, folder })
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to read email');
    }

    // Return the email with proper structure
    const email = data.email;
    return res.status(200).json({
      success: true,
      email: {
        id: email.uid || email.id,
        uid: email.uid || email.id,
        folder: email.folder || folder,
        from: email.from,
        to: email.to,
        cc: email.cc || [],
        subject: email.subject,
        date: email.date,
        text: email.text || email.body || '',
        html: email.html || (email.text ? `<pre>${email.text}</pre>` : ''),
        textAsHtml: email.html || (email.text ? `<pre>${email.text}</pre>` : ''),
        body: email.body || email.text || '',
        flags: email.flags || [],
        attachments: email.attachments || []
      }
    });

  } catch (error) {
    console.error('Error reading email:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};