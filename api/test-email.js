export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Test-Endpunkt um zu prüfen ob die API funktioniert
  if (req.method === 'GET') {
    res.status(200).json({
      success: true,
      message: 'E-Mail API ist erreichbar',
      env: {
        SMTP_HOST: process.env.SMTP_HOST ? '✓ gesetzt' : '✗ fehlt',
        SMTP_PORT: process.env.SMTP_PORT ? '✓ gesetzt' : '✗ fehlt',
        SMTP_USER: process.env.SMTP_USER ? '✓ gesetzt' : '✗ fehlt',
        SMTP_PASS: process.env.SMTP_PASS ? '✓ gesetzt' : '✗ fehlt',
        SMTP_FROM: process.env.SMTP_FROM ? '✓ gesetzt' : '✗ fehlt'
      }
    });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}