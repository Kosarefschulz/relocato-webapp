// Einfacher Test-Endpoint ohne externe Dependencies
export default function handler(req, res) {
  // Content-Type Header explizit setzen
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  // OPTIONS request handling
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Test response
  const response = {
    status: 'success',
    message: 'API Route funktioniert korrekt!',
    timestamp: new Date().toISOString(),
    method: req.method,
    headers: req.headers,
    env: {
      hasEmailUser: !!process.env.VITE_EMAIL_USER,
      hasEmailPass: !!process.env.VITE_EMAIL_PASS,
      nodeEnv: process.env.NODE_ENV
    }
  };
  
  return res.status(200).json(response);
}