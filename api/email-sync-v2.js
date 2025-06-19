// Optimized Email Sync for Vercel
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { folder = 'INBOX', limit = '10' } = req.query;
  
  // Mock data for now to test the connection
  const mockEmails = [
    {
      uid: 1,
      seqno: 1,
      flags: ['\\Seen'],
      from: 'test@example.com',
      to: 'bielefeld@relocato.de',
      subject: 'Test Email 1',
      date: new Date().toISOString(),
      preview: 'This is a test email'
    },
    {
      uid: 2,
      seqno: 2,
      flags: [],
      from: 'kunde@test.de',
      to: 'bielefeld@relocato.de',
      subject: 'Umzugsanfrage',
      date: new Date(Date.now() - 86400000).toISOString(),
      preview: 'Ich interessiere mich für einen Umzug'
    }
  ];
  
  // Return mock data immediately
  res.status(200).json({
    emails: mockEmails.slice(0, parseInt(limit)),
    folder: folder,
    count: mockEmails.length,
    timestamp: new Date().toISOString(),
    source: 'mock'
  });
  
  // TODO: Implement real IMAP sync after fixing the timeout issues
}