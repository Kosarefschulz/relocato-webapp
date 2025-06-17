import { collection, doc, setDoc, deleteDoc, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

interface DemoEmail {
  from: string;
  fromName: string;
  to: string;
  subject: string;
  body: string;
  date: Date;
  folder: string;
  isRead: boolean;
  isStarred: boolean;
  isImported: boolean;
  attachments?: {
    filename: string;
    size: number;
  }[];
  labels?: string[];
}

const demoEmails: DemoEmail[] = [
  {
    from: 'max.mueller@gmail.com',
    fromName: 'Max Müller',
    to: 'bielefeld@relocato.de',
    subject: 'Anfrage für Umzug am 15. März',
    body: `
      <p>Sehr geehrtes RELOCATO Team,</p>
      <p>ich plane meinen Umzug für den 15. März 2024 und würde gerne ein Angebot von Ihnen erhalten.</p>
      <p><strong>Details zum Umzug:</strong></p>
      <ul>
        <li>Von: Hauptstraße 123, 33602 Bielefeld</li>
        <li>Nach: Nebenstraße 456, 33604 Bielefeld</li>
        <li>Wohnung: 3 Zimmer, 85qm, 2. Stock (mit Aufzug)</li>
        <li>Besonderheiten: Klavier vorhanden</li>
      </ul>
      <p>Ich benötige auch Unterstützung beim Verpacken und würde gerne wissen, ob Sie Umzugskartons zur Verfügung stellen.</p>
      <p>Meine Telefonnummer für Rückfragen: 0521 123456</p>
      <p>Mit freundlichen Grüßen<br>Max Müller</p>
    `,
    date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    folder: 'inbox',
    isRead: false,
    isStarred: true,
    isImported: false,
    labels: ['Umzugsanfrage', 'Priorität']
  },
  {
    from: 'anna.schmidt@web.de',
    fromName: 'Anna Schmidt',
    to: 'bielefeld@relocato.de',
    subject: 'Rückfrage zu Ihrem Angebot',
    body: `
      <p>Hallo liebes Team,</p>
      <p>vielen Dank für Ihr Angebot vom letzten Dienstag. Ich hätte noch ein paar Fragen:</p>
      <ol>
        <li>Ist im Preis auch das Auf- und Abbauen der Möbel enthalten?</li>
        <li>Wie viele Mitarbeiter werden beim Umzug dabei sein?</li>
        <li>Gibt es eine Versicherung für eventuelle Schäden?</li>
      </ol>
      <p>Außerdem würde ich gerne wissen, ob der Termin am 22. März noch verfügbar ist.</p>
      <p>Beste Grüße<br>Anna Schmidt</p>
    `,
    date: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    folder: 'inbox',
    isRead: true,
    isStarred: false,
    isImported: true,
    labels: ['Nachfrage']
  },
  {
    from: 'peter.wagner@outlook.com',
    fromName: 'Peter Wagner',
    to: 'bielefeld@relocato.de',
    subject: 'Umzugstermin verschieben',
    body: `
      <p>Guten Tag,</p>
      <p>leider muss ich meinen bereits vereinbarten Umzugstermin am 10. März verschieben.</p>
      <p>Grund ist eine Verzögerung bei der Wohnungsübergabe. Wäre es möglich, den Umzug auf den 17. März zu verlegen?</p>
      <p>Ich hoffe, das stellt kein Problem dar. Bitte lassen Sie mich wissen, ob dieser neue Termin für Sie machbar ist.</p>
      <p>Mit freundlichen Grüßen<br>Peter Wagner<br>Tel: 0521 789012</p>
    `,
    date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    folder: 'inbox',
    isRead: false,
    isStarred: true,
    isImported: false,
    labels: ['Terminänderung', 'Wichtig']
  },
  {
    from: 'info@umzugsportal.de',
    fromName: 'Umzugsportal.de',
    to: 'bielefeld@relocato.de',
    subject: 'Neue Umzugsanfrage über unser Portal',
    body: `
      <p>Sehr geehrte Damen und Herren,</p>
      <p>über unser Portal wurde eine neue Umzugsanfrage für Sie generiert:</p>
      <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0;">
        <p><strong>Kunde:</strong> Sarah Klein<br>
        <strong>E-Mail:</strong> sarah.klein@gmx.de<br>
        <strong>Telefon:</strong> 0160 9876543<br>
        <strong>Umzugsdatum:</strong> 01.04.2024<br>
        <strong>Von:</strong> Bielefeld, 33613<br>
        <strong>Nach:</strong> Paderborn, 33098<br>
        <strong>Wohnungsgröße:</strong> 2 Zimmer, 65qm</p>
      </div>
      <p>Bitte kontaktieren Sie den Kunden zeitnah für weitere Details.</p>
      <p>Mit freundlichen Grüßen<br>Ihr Umzugsportal.de Team</p>
    `,
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    folder: 'inbox',
    isRead: true,
    isStarred: false,
    isImported: false,
    labels: ['Portal-Anfrage']
  },
  {
    from: 'bielefeld@relocato.de',
    fromName: 'RELOCATO Bielefeld',
    to: 'max.mueller@gmail.com',
    subject: 'Ihr Umzugsangebot - RELOCATO Bielefeld',
    body: `
      <p>Sehr geehrter Herr Müller,</p>
      <p>vielen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen folgendes Angebot für Ihren Umzug:</p>
      <h3>Umzugsdetails:</h3>
      <ul>
        <li>Datum: 15. März 2024</li>
        <li>Von: Hauptstraße 123, 33602 Bielefeld</li>
        <li>Nach: Nebenstraße 456, 33604 Bielefeld</li>
      </ul>
      <h3>Leistungen:</h3>
      <ul>
        <li>Kompletter Umzugsservice inkl. Verpackung</li>
        <li>Transport Ihres Klaviers mit Spezialausrüstung</li>
        <li>Bereitstellung von Umzugskartons</li>
        <li>3 erfahrene Mitarbeiter</li>
      </ul>
      <p><strong>Gesamtpreis: 1.250,00 EUR</strong> (inkl. MwSt.)</p>
      <p>Das Angebot ist 14 Tage gültig. Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
      <p>Mit freundlichen Grüßen<br>Ihr RELOCATO Team</p>
    `,
    date: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    folder: 'sent',
    isRead: true,
    isStarred: false,
    isImported: false,
    attachments: [
      { filename: 'Angebot_Mueller_15032024.pdf', size: 245632 }
    ],
    labels: ['Angebot']
  },
  {
    from: 'julia.becker@yahoo.de',
    fromName: 'Julia Becker',
    to: 'bielefeld@relocato.de',
    subject: 'Danke für den tollen Service!',
    body: `
      <p>Liebes RELOCATO Team,</p>
      <p>ich möchte mich herzlich für den reibungslosen Umzug letzte Woche bedanken!</p>
      <p>Ihre Mitarbeiter waren pünktlich, professionell und sehr sorgfältig mit unseren Möbeln. 
      Besonders beeindruckt hat mich, wie vorsichtig mit unserem antiken Schrank umgegangen wurde.</p>
      <p>Ich werde Sie definitiv weiterempfehlen!</p>
      <p>Viele Grüße<br>Julia Becker</p>
    `,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    folder: 'inbox',
    isRead: true,
    isStarred: true,
    isImported: false,
    labels: ['Feedback', 'Positiv']
  },
  {
    from: 'thomas.meyer@t-online.de',
    fromName: 'Thomas Meyer',
    to: 'bielefeld@relocato.de',
    subject: 'Umzug Büro - Kostenvoranschlag gewünscht',
    body: `
      <p>Sehr geehrte Damen und Herren,</p>
      <p>wir planen den Umzug unseres Büros und benötigen einen Kostenvoranschlag.</p>
      <h4>Eckdaten:</h4>
      <ul>
        <li>Aktuelle Adresse: Geschäftsstraße 10, 33602 Bielefeld</li>
        <li>Neue Adresse: Industrieweg 25, 33689 Bielefeld</li>
        <li>Bürofläche: ca. 200qm</li>
        <li>Mitarbeiter: 15 Arbeitsplätze</li>
        <li>Besonderheiten: Server-Raum, Tresor, empfindliche IT-Equipment</li>
        <li>Gewünschter Zeitraum: April 2024 (vorzugsweise Wochenende)</li>
      </ul>
      <p>Bitte senden Sie uns ein detailliertes Angebot zu. Gerne können Sie auch einen Besichtigungstermin vereinbaren.</p>
      <p>Mit freundlichen Grüßen<br>Thomas Meyer<br>Geschäftsführer<br>Meyer & Partner GmbH<br>Tel: 0521 456789</p>
    `,
    date: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    folder: 'inbox',
    isRead: false,
    isStarred: false,
    isImported: false,
    labels: ['Büroumzug', 'Großauftrag']
  },
  {
    from: 'umzug@sparkasse-bielefeld.de',
    fromName: 'Sparkasse Bielefeld',
    to: 'bielefeld@relocato.de',
    subject: 'Zahlungsbestätigung - Rechnung #2024-0142',
    body: `
      <p>Sehr geehrte Damen und Herren,</p>
      <p>hiermit bestätigen wir den Zahlungseingang für Ihre Rechnung:</p>
      <table style="border-collapse: collapse; margin: 10px 0;">
        <tr><td style="padding: 5px;"><strong>Rechnungsnummer:</strong></td><td>2024-0142</td></tr>
        <tr><td style="padding: 5px;"><strong>Betrag:</strong></td><td>1.850,00 EUR</td></tr>
        <tr><td style="padding: 5px;"><strong>Eingangsdatum:</strong></td><td>${new Date().toLocaleDateString('de-DE')}</td></tr>
      </table>
      <p>Vielen Dank für die gute Zusammenarbeit.</p>
      <p>Mit freundlichen Grüßen<br>Sparkasse Bielefeld<br>Buchhaltung</p>
    `,
    date: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    folder: 'inbox',
    isRead: true,
    isStarred: false,
    isImported: false,
    labels: ['Zahlung', 'Erledigt']
  }
];

export const emailDemoService = {
  async generateDemoEmails(): Promise<void> {
    console.log('🎨 Generating demo emails...');
    
    try {
      const batch: any[] = [];
      
      for (const email of demoEmails) {
        const emailRef = doc(collection(db, 'emails'));
        const emailData = {
          ...email,
          id: emailRef.id,
          messageId: `demo-${emailRef.id}@relocato.de`,
          createdAt: Timestamp.fromDate(email.date),
          updatedAt: Timestamp.now()
        };
        
        await setDoc(emailRef, emailData);
        batch.push(emailData);
      }
      
      console.log(`✅ Generated ${batch.length} demo emails`);
    } catch (error) {
      console.error('❌ Error generating demo emails:', error);
      throw error;
    }
  },

  async clearDemoEmails(): Promise<void> {
    console.log('🗑️ Clearing demo emails...');
    
    try {
      const emailsCollection = collection(db, 'emails');
      const snapshot = await getDocs(emailsCollection);
      
      const deletePromises = snapshot.docs
        .filter(doc => doc.data().messageId?.startsWith('demo-'))
        .map(doc => deleteDoc(doc.ref));
      
      await Promise.all(deletePromises);
      
      console.log(`✅ Cleared ${deletePromises.length} demo emails`);
    } catch (error) {
      console.error('❌ Error clearing demo emails:', error);
      throw error;
    }
  }
};