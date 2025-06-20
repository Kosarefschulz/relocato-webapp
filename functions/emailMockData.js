const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });

// Mock email data for demonstration
const mockEmails = [
  {
    uid: 1,
    seqno: 1,
    flags: ['\\Seen'],
    from: 'max.mustermann@gmail.com',
    to: 'bielefeld@relocato.de',
    subject: 'Umzugsanfrage für April 2024',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    preview: 'Sehr geehrte Damen und Herren, ich plane einen Umzug von Bielefeld nach Paderborn...',
    body: `Sehr geehrte Damen und Herren,

ich plane einen Umzug von Bielefeld nach Paderborn im April 2024. 

Details:
- Aktuelle Wohnung: 3 Zimmer, 85qm, 2. OG mit Aufzug
- Neue Wohnung: 4 Zimmer, 95qm, EG
- Gewünschter Termin: 15.04.2024

Kontakt:
Max Mustermann
Tel: 0521 123456
Email: max.mustermann@gmail.com

Bitte senden Sie mir ein Angebot zu.

Mit freundlichen Grüßen
Max Mustermann`,
    attachments: []
  },
  {
    uid: 2,
    seqno: 2,
    flags: [],
    from: 'anna.schmidt@firma-xyz.de',
    to: 'bielefeld@relocato.de',
    subject: 'Büroumzug - Anfrage für Kostenvoranschlag',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    preview: 'Guten Tag, unsere Firma plant einen Umzug innerhalb von Bielefeld...',
    body: `Guten Tag,

unsere Firma plant einen Umzug innerhalb von Bielefeld.

Eckdaten:
- Von: Jöllenbecker Str. 123, 33613 Bielefeld
- Nach: Detmolder Str. 456, 33604 Bielefeld  
- Umfang: 25 Arbeitsplätze, Serverraum, Archiv
- Zeitraum: Mai 2024

Ansprechpartnerin:
Anna Schmidt
Firma XYZ GmbH
Tel: 0521 987654

Können Sie uns ein detailliertes Angebot zusenden?

Beste Grüße
Anna Schmidt`,
    attachments: [{
      filename: 'grundriss_neu.pdf',
      size: 245789,
      contentType: 'application/pdf'
    }]
  },
  {
    uid: 3,
    seqno: 3,
    flags: ['\\Seen'],
    from: 'peter.mueller@web.de',
    to: 'bielefeld@relocato.de',
    subject: 'Kleine Wohnung - Umzug innerhalb Bielefeld',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    preview: 'Hallo, ich ziehe nächsten Monat innerhalb von Bielefeld um...',
    body: `Hallo,

ich ziehe nächsten Monat innerhalb von Bielefeld um:
- Von: 2-Zimmer-Wohnung, 55qm (3. OG ohne Aufzug)
- Nach: 2-Zimmer-Wohnung, 60qm (1. OG)
- Termin: flexibel im März

Kontakt: 0172 1234567

Brauche ich einen Halteverbotszone?

Viele Grüße
Peter Müller`,
    attachments: []
  },
  {
    uid: 4,
    seqno: 4,
    flags: [],
    from: 'sarah.weber@gmx.de',
    to: 'bielefeld@relocato.de',
    subject: 'Umzug mit Einlagerung',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    preview: 'Sehr geehrtes Relocato-Team, ich benötige Ihre Hilfe bei einem Umzug mit Zwischenlagerung...',
    body: `Sehr geehrtes Relocato-Team,

ich benötige Ihre Hilfe bei einem Umzug mit Zwischenlagerung.

Situation:
- Auszug aus 4-Zimmer-Wohnung Ende März
- Einzug in neue Wohnung erst Mitte Mai
- Benötige Lagerraum für 6 Wochen

Adresse: Artur-Ladebeck-Str. 89, 33602 Bielefeld

Können Sie mir ein Komplettangebot machen?

Mit freundlichen Grüßen
Sarah Weber
Tel: 0521 445566`,
    attachments: []
  },
  {
    uid: 5,
    seqno: 5,
    flags: ['\\Seen', '\\Flagged'],
    from: 'info@immobilien-bielefeld.de',
    to: 'bielefeld@relocato.de',
    subject: 'Kundenanfrage - Familie Becker',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    preview: 'Guten Tag, ich leite Ihnen eine Anfrage unseres Kunden weiter...',
    body: `Guten Tag,

ich leite Ihnen eine Anfrage unseres Kunden weiter:

Familie Becker
- Umzug von Hamburg nach Bielefeld
- 5-Zimmer-Haus zu 4-Zimmer-Wohnung
- Termin: Juni 2024
- Kontakt: 040 123456

Die Familie wünscht ein Komplettpaket inkl. Verpackung.

Mit freundlichen Grüßen
Immobilien Bielefeld GmbH`,
    attachments: []
  }
];

// Simple mock function that returns demo emails
exports.emailMock = functions
  .region('europe-west3')
  .https.onRequest((req, res) => {
  cors(req, res, () => {
    const { folder = 'INBOX', limit = '50' } = req.query;
    
    // Filter emails based on folder
    let filteredEmails = [...mockEmails];
    
    if (folder === 'Sent') {
      // For sent folder, reverse the from/to
      filteredEmails = mockEmails.map(email => ({
        ...email,
        from: 'bielefeld@relocato.de',
        to: email.from,
        subject: 'Re: ' + email.subject
      }));
    }
    
    // Limit results
    const limitNum = parseInt(limit);
    filteredEmails = filteredEmails.slice(0, limitNum);
    
    res.json({
      emails: filteredEmails,
      folder: folder,
      count: filteredEmails.length,
      timestamp: new Date().toISOString(),
      source: 'firebase-mock'
    });
  });
});