import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface MockEmailData {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  date: Date;
  folder: string;
  isRead: boolean;
  isStarred: boolean;
  attachments?: any[];
}

const mockEmailTemplates: Partial<MockEmailData>[] = [
  {
    from: 'max.mustermann@gmail.com',
    subject: 'Umzugsanfrage für April 2024',
    text: `Sehr geehrte Damen und Herren,

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
    folder: 'inbox',
    isRead: false,
    isStarred: false
  },
  {
    from: 'anna.schmidt@firma-xyz.de',
    subject: 'Büroumzug - Anfrage für Kostenvoranschlag',
    text: `Guten Tag,

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
    folder: 'inbox',
    isRead: true,
    isStarred: true
  },
  {
    from: 'peter.mueller@web.de',
    subject: 'Kleine Wohnung - Umzug innerhalb Bielefeld',
    text: `Hallo,

ich ziehe nächsten Monat innerhalb von Bielefeld um:
- Von: 2-Zimmer-Wohnung, 55qm (3. OG ohne Aufzug)
- Nach: 2-Zimmer-Wohnung, 60qm (1. OG)
- Termin: flexibel im März

Kontakt: 0172 1234567

Brauche ich einen Halteverbotszone?

Viele Grüße
Peter Müller`,
    folder: 'inbox',
    isRead: false,
    isStarred: false
  },
  {
    from: 'sarah.weber@gmx.de',
    subject: 'Umzug mit Einlagerung',
    text: `Sehr geehrtes Relocato-Team,

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
    folder: 'inbox',
    isRead: true,
    isStarred: false
  },
  {
    from: 'info@immobilien-bielefeld.de',
    subject: 'Kundenanfrage - Familie Becker',
    text: `Guten Tag,

ich leite Ihnen eine Anfrage unseres Kunden weiter:

Familie Becker
- Umzug von Hamburg nach Bielefeld
- 5-Zimmer-Haus zu 4-Zimmer-Wohnung
- Termin: Juni 2024
- Kontakt: 040 123456

Die Familie wünscht ein Komplettpaket inkl. Verpackung.

Mit freundlichen Grüßen
Immobilien Bielefeld GmbH`,
    folder: 'inbox',
    isRead: false,
    isStarred: true
  }
];

export async function loadMockEmailsToFirestore(): Promise<number> {
  try {
    const emailsCollection = collection(db, 'emailClient');
    let count = 0;
    
    // Generate 20 mock emails with variations
    for (let i = 0; i < 20; i++) {
      const template = mockEmailTemplates[i % mockEmailTemplates.length];
      const daysAgo = Math.floor(Math.random() * 30);
      const date = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000));
      
      const emailData = {
        ...template,
        to: 'bielefeld@relocato.de',
        date: Timestamp.fromDate(date),
        uid: `mock-${Date.now()}-${i}`,
        messageId: `<mock-${Date.now()}-${i}@example.com>`,
        threadId: `thread-${Math.floor(i / 3)}`, // Group some emails in threads
        // Add some variation
        isRead: i < 10 ? template.isRead : Math.random() > 0.5,
        isStarred: template.isStarred && Math.random() > 0.3,
        // Add HTML version
        html: `<html><body>${template.text?.replace(/\n/g, '<br>')}</body></html>`
      };
      
      const docRef = doc(emailsCollection);
      await setDoc(docRef, emailData);
      count++;
    }
    
    console.log(`✅ Loaded ${count} mock emails to Firestore`);
    return count;
  } catch (error) {
    console.error('Error loading mock emails:', error);
    throw error;
  }
}

// Function to generate a single mock email on demand
export function generateMockEmail(index: number = 0): MockEmailData {
  const template = mockEmailTemplates[index % mockEmailTemplates.length];
  const date = new Date(Date.now() - (Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000));
  
  return {
    from: template.from!,
    to: 'bielefeld@relocato.de',
    subject: template.subject!,
    text: template.text!,
    html: `<html><body>${template.text?.replace(/\n/g, '<br>')}</body></html>`,
    date: date,
    folder: template.folder!,
    isRead: template.isRead!,
    isStarred: template.isStarred!,
    attachments: []
  };
}