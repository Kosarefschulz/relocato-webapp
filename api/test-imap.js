module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({
    success: true,
    message: 'Test IMAP endpoint is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    body: req.body,
    env: {
      hasEmail: !!process.env.IONOS_EMAIL,
      hasPassword: !!process.env.IONOS_PASSWORD,
      hasHost: !!process.env.IONOS_IMAP_HOST,
      hasPort: !!process.env.IONOS_IMAP_PORT
    }
  });
};