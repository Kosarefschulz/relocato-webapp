const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // First, try to proxy to local email server if running
  app.use(
    ['/api/email-sync', '/api/email-sync-v2'],
    createProxyMiddleware({
      target: 'http://localhost:3002',
      changeOrigin: true,
      onError: (err, req, res) => {
        console.log('Local email server not running, falling back to mock data');
        
        // Fallback to mock data if local server is not running
        const { folder = 'INBOX', limit = '50' } = req.query;
        const mockEmails = generateMockEmails(parseInt(limit));
        
        res.json({
          emails: mockEmails,
          folder: folder,
          count: mockEmails.length,
          timestamp: new Date().toISOString(),
          source: 'local-mock-fallback'
        });
      }
    })
  );
  
  // Proxy other API requests to Vercel backend
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://umzugsapp.vercel.app',
      changeOrigin: true,
      secure: true,
      headers: {
        'x-forwarded-host': 'localhost:3001'
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('Proxying to Vercel:', req.method, req.url);
      }
    })
  );
};

function generateMockEmails(count) {
  const senders = [
    { email: 'max.mustermann@gmail.com', name: 'Max Mustermann' },
    { email: 'anna.schmidt@web.de', name: 'Anna Schmidt' },
    { email: 'peter.mueller@outlook.com', name: 'Peter Müller' },
    { email: 'sarah.weber@gmx.de', name: 'Sarah Weber' },
    { email: 'thomas.becker@t-online.de', name: 'Thomas Becker' }
  ];

  const subjects = [
    'Umzugsanfrage für nächsten Monat',
    'Anfrage: Umzug von Bielefeld nach Paderborn',
    'Kostenvoranschlag für Umzug erwünscht',
    'Terminanfrage für Besichtigung',
    'Umzug im März - Bitte um Angebot',
    'Frage zu Ihren Umzugsleistungen',
    'Büroumzug - Anfrage',
    'Privatumzug mit Einlagerung'
  ];

  const bodies = [
    `Sehr geehrte Damen und Herren,

ich plane einen Umzug von Bielefeld nach Paderborn im nächsten Monat. 
Die Wohnung hat 3 Zimmer mit etwa 85qm. 

Folgende Details:
- Auszug: Musterstraße 123, 33602 Bielefeld (2. OG mit Aufzug)
- Einzug: Neue Straße 456, 33098 Paderborn (EG)
- Gewünschter Termin: 15.03.2024

Bitte senden Sie mir ein Angebot zu.

Mit freundlichen Grüßen
Max Mustermann
Tel: 0521 123456`,
    
    `Guten Tag,

wir benötigen Unterstützung bei unserem Büroumzug.

Details:
- Ca. 20 Arbeitsplätze
- Von: Bielefeld Innenstadt
- Nach: Bielefeld Brackwede
- Zeitraum: April 2024

Können Sie uns ein Angebot erstellen?

Beste Grüße
Anna Schmidt
Firma XYZ GmbH`,

    `Hallo,

ich interessiere mich für Ihre Umzugsleistungen. Ich ziehe von einer 2-Zimmer-Wohnung 
in eine 3-Zimmer-Wohnung innerhalb von Bielefeld.

Gibt es die Möglichkeit einer Besichtigung?

Viele Grüße
Peter Müller`
  ];

  const emails = [];
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const sender = senders[Math.floor(Math.random() * senders.length)];
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const body = bodies[Math.floor(Math.random() * bodies.length)];
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date(now - (daysAgo * 24 * 60 * 60 * 1000));
    
    emails.push({
      uid: i + 1,
      seqno: i + 1,
      flags: Math.random() > 0.5 ? ['\\Seen'] : [],
      from: `"${sender.name}" <${sender.email}>`,
      to: 'bielefeld@relocato.de',
      subject: subject,
      date: date.toISOString(),
      preview: body.substring(0, 150) + '...',
      body: body,
      messageId: `<${Date.now()}-${i}@example.com>`,
      attachments: Math.random() > 0.7 ? [
        {
          filename: 'grundriss.pdf',
          size: 245789,
          contentType: 'application/pdf'
        }
      ] : []
    });
  }
  
  return emails.sort((a, b) => new Date(b.date) - new Date(a.date));
}