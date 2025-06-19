// Simple test email sender
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // For testing, we'll use a third-party email service
  // that doesn't require complex setup
  const testEmail = {
    to: 'bielefeld@relocato.de',
    subject: `Test Email - ${new Date().toLocaleString('de-DE')}`,
    body: 'This is a test email from Relocato WebApp'
  };
  
  // For now, just return success
  // In production, this would actually send the email
  res.status(200).json({
    success: true,
    message: 'Test email would be sent',
    email: testEmail,
    timestamp: new Date().toISOString()
  });
}