// Einfacher Test ohne Dependencies

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const emailUser = process.env.IONOS_EMAIL_USER || process.env.REACT_APP_EMAIL_USERNAME || process.env.SMTP_USER;
  const emailPass = process.env.IONOS_EMAIL_PASS || process.env.REACT_APP_EMAIL_PASSWORD || process.env.SMTP_PASS;

  // Test 1: Environment Check
  if (req.query.check === 'env') {
    return res.json({
      status: 'ok',
      hasCredentials: !!(emailUser && emailPass),
      user: emailUser ? emailUser.substring(0, 10) + '...' : 'NOT SET',
      envVars: Object.keys(process.env).filter(k => 
        k.includes('EMAIL') || k.includes('SMTP') || k.includes('IONOS')
      ).map(k => ({
        key: k,
        hasValue: !!process.env[k]
      }))
    });
  }

  // Test 2: Send via fetch to backend
  if (req.query.action === 'send-via-backend') {
    try {
      const backendUrl = 'https://backend-puce-one.vercel.app/api/send-email';
      
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: emailUser,
          subject: `Test from Vercel - ${new Date().toLocaleString('de-DE')}`,
          html: `<h2>✅ Email Test Successful!</h2>
                 <p>This email was sent via the backend service.</p>
                 <p>Time: ${new Date().toLocaleString('de-DE')}</p>`
        })
      });

      const result = await response.json();
      return res.json({
        success: response.ok,
        backend: backendUrl,
        result: result
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Test 3: Direct SMTP (using net module)
  if (req.query.action === 'test-smtp') {
    const net = require('net');
    
    return new Promise((resolve) => {
      const client = net.createConnection({
        port: 587,
        host: 'smtp.ionos.de'
      }, () => {
        client.end();
        res.json({ success: true, message: 'SMTP port is reachable' });
        resolve();
      });
      
      client.on('error', (err) => {
        res.status(500).json({ success: false, error: err.message });
        resolve();
      });
      
      client.setTimeout(5000, () => {
        client.destroy();
        res.status(504).json({ success: false, error: 'Connection timeout' });
        resolve();
      });
    });
  }

  // Default
  res.json({
    message: 'Email Test API',
    endpoints: [
      '/api/test-email-simple?check=env',
      '/api/test-email-simple?action=send-via-backend',
      '/api/test-email-simple?action=test-smtp'
    ]
  });
}