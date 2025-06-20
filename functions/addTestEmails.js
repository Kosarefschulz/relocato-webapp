const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Firebase Admin initialisieren - nur wenn noch nicht initialisiert
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * Fügt Test-E-Mails zur emailClient Collection hinzu
 * Dies ist eine temporäre Funktion zum Testen der E-Mail-Anzeige
 */
exports.addTestEmails = functions
  .region('europe-west1')
  .https.onRequest(async (req, res) => {
    try {
      console.log('Starting to add test emails...');
      
      const testEmails = [
        {
          uid: 1001,
          seqno: 1,
          flags: ['\\Seen'],
          from: 'kunde1@example.com',
          to: 'info@umzugsservice.com',
          subject: 'Anfrage für Umzug im Januar',
          date: new Date('2025-01-15T10:30:00').toISOString(),
          preview: 'Sehr geehrte Damen und Herren, ich interessiere mich für Ihre Umzugsservices...',
          body: 'Sehr geehrte Damen und Herren,\n\nich interessiere mich für Ihre Umzugsservices. Wir planen einen Umzug Ende Januar von Berlin nach München.\n\nKönnten Sie mir bitte ein Angebot zusenden?\n\nMit freundlichen Grüßen\nMax Mustermann',
          textContent: 'Sehr geehrte Damen und Herren,\n\nich interessiere mich für Ihre Umzugsservices. Wir planen einen Umzug Ende Januar von Berlin nach München.\n\nKönnten Sie mir bitte ein Angebot zusenden?\n\nMit freundlichen Grüßen\nMax Mustermann',
          htmlContent: '<p>Sehr geehrte Damen und Herren,</p><p>ich interessiere mich für Ihre Umzugsservices. Wir planen einen Umzug Ende Januar von Berlin nach München.</p><p>Könnten Sie mir bitte ein Angebot zusenden?</p><p>Mit freundlichen Grüßen<br>Max Mustermann</p>',
          folder: 'INBOX',
          isRead: true,
          isFlagged: false,
          isDraft: false,
          isDeleted: false,
          attachments: []
        },
        {
          uid: 1002,
          seqno: 2,
          flags: [],
          from: 'info@wohnungsverwaltung-berlin.de',
          to: 'info@umzugsservice.com',
          subject: 'Umzugsanfrage für 3 Wohnungen',
          date: new Date('2025-01-18T14:15:00').toISOString(),
          preview: 'Guten Tag, wir benötigen für drei unserer Mieter Umzugsservices...',
          body: 'Guten Tag,\n\nwir benötigen für drei unserer Mieter Umzugsservices im Februar.\n\nDetails:\n- Wohnung 1: 2-Zimmer, 65qm, 3. Stock\n- Wohnung 2: 3-Zimmer, 85qm, EG\n- Wohnung 3: 1-Zimmer, 45qm, 2. Stock\n\nBitte senden Sie uns ein Sammelangebot.\n\nMfG\nHausverwaltung Berlin GmbH',
          textContent: 'Guten Tag,\n\nwir benötigen für drei unserer Mieter Umzugsservices im Februar.\n\nDetails:\n- Wohnung 1: 2-Zimmer, 65qm, 3. Stock\n- Wohnung 2: 3-Zimmer, 85qm, EG\n- Wohnung 3: 1-Zimmer, 45qm, 2. Stock\n\nBitte senden Sie uns ein Sammelangebot.\n\nMfG\nHausverwaltung Berlin GmbH',
          htmlContent: '<p>Guten Tag,</p><p>wir benötigen für drei unserer Mieter Umzugsservices im Februar.</p><p>Details:<br>- Wohnung 1: 2-Zimmer, 65qm, 3. Stock<br>- Wohnung 2: 3-Zimmer, 85qm, EG<br>- Wohnung 3: 1-Zimmer, 45qm, 2. Stock</p><p>Bitte senden Sie uns ein Sammelangebot.</p><p>MfG<br>Hausverwaltung Berlin GmbH</p>',
          folder: 'INBOX',
          isRead: false,
          isFlagged: true,
          isDraft: false,
          isDeleted: false,
          attachments: []
        },
        {
          uid: 1003,
          seqno: 3,
          flags: ['\\Seen', '\\Answered'],
          from: 'info@umzugsservice.com',
          to: 'kunde1@example.com',
          subject: 'Re: Anfrage für Umzug im Januar',
          date: new Date('2025-01-16T09:00:00').toISOString(),
          preview: 'Sehr geehrter Herr Mustermann, vielen Dank für Ihre Anfrage...',
          body: 'Sehr geehrter Herr Mustermann,\n\nvielen Dank für Ihre Anfrage.\n\nGerne erstellen wir Ihnen ein individuelles Angebot für Ihren Umzug von Berlin nach München.\n\nFür eine genaue Kalkulation benötigen wir noch folgende Informationen:\n- Größe der Wohnung (qm und Zimmeranzahl)\n- Etage (mit/ohne Aufzug)\n- Gewünschter Umzugstermin\n- Benötigen Sie Verpackungsmaterial?\n\nMit freundlichen Grüßen\nIhr Umzugsteam',
          textContent: 'Sehr geehrter Herr Mustermann,\n\nvielen Dank für Ihre Anfrage.\n\nGerne erstellen wir Ihnen ein individuelles Angebot für Ihren Umzug von Berlin nach München.\n\nFür eine genaue Kalkulation benötigen wir noch folgende Informationen:\n- Größe der Wohnung (qm und Zimmeranzahl)\n- Etage (mit/ohne Aufzug)\n- Gewünschter Umzugstermin\n- Benötigen Sie Verpackungsmaterial?\n\nMit freundlichen Grüßen\nIhr Umzugsteam',
          htmlContent: '<p>Sehr geehrter Herr Mustermann,</p><p>vielen Dank für Ihre Anfrage.</p><p>Gerne erstellen wir Ihnen ein individuelles Angebot für Ihren Umzug von Berlin nach München.</p><p>Für eine genaue Kalkulation benötigen wir noch folgende Informationen:<br>- Größe der Wohnung (qm und Zimmeranzahl)<br>- Etage (mit/ohne Aufzug)<br>- Gewünschter Umzugstermin<br>- Benötigen Sie Verpackungsmaterial?</p><p>Mit freundlichen Grüßen<br>Ihr Umzugsteam</p>',
          folder: 'Sent',
          isRead: true,
          isFlagged: false,
          isDraft: false,
          isDeleted: false,
          attachments: []
        },
        {
          uid: 1004,
          seqno: 4,
          flags: ['\\Draft'],
          from: 'info@umzugsservice.com',
          to: 'neukunde@gmail.com',
          subject: 'Ihr Umzugsangebot',
          date: new Date('2025-01-19T11:00:00').toISOString(),
          preview: 'Sehr geehrte Frau Schmidt, anbei erhalten Sie unser Angebot...',
          body: 'Sehr geehrte Frau Schmidt,\n\nanbei erhalten Sie unser Angebot für Ihren geplanten Umzug.\n\n[ENTWURF - NOCH NICHT GESENDET]',
          textContent: 'Sehr geehrte Frau Schmidt,\n\nanbei erhalten Sie unser Angebot für Ihren geplanten Umzug.\n\n[ENTWURF - NOCH NICHT GESENDET]',
          htmlContent: '<p>Sehr geehrte Frau Schmidt,</p><p>anbei erhalten Sie unser Angebot für Ihren geplanten Umzug.</p><p><strong>[ENTWURF - NOCH NICHT GESENDET]</strong></p>',
          folder: 'Drafts',
          isRead: true,
          isFlagged: false,
          isDraft: true,
          isDeleted: false,
          attachments: []
        },
        {
          uid: 1005,
          seqno: 5,
          flags: ['\\Seen'],
          from: 'familie.mueller@t-online.de',
          to: 'info@umzugsservice.com',
          subject: 'Dringende Umzugsanfrage - Notfall',
          date: new Date('2025-01-19T16:45:00').toISOString(),
          preview: 'Hallo, wir brauchen dringend Hilfe beim Umzug nächste Woche...',
          body: 'Hallo,\n\nwir brauchen dringend Hilfe beim Umzug nächste Woche.\n\nUnser bisheriger Umzugsservice ist abgesprungen und wir müssen bis zum 25.01. aus der Wohnung raus.\n\n4-Zimmer-Wohnung, 95qm, 2. Stock mit Aufzug\nVon: Berlin-Mitte\nNach: Berlin-Spandau\n\nKönnen Sie uns helfen?\n\nBitte melden Sie sich schnellstmöglich!\n\nVG\nFamilie Müller\nTel: 0171-1234567',
          textContent: 'Hallo,\n\nwir brauchen dringend Hilfe beim Umzug nächste Woche.\n\nUnser bisheriger Umzugsservice ist abgesprungen und wir müssen bis zum 25.01. aus der Wohnung raus.\n\n4-Zimmer-Wohnung, 95qm, 2. Stock mit Aufzug\nVon: Berlin-Mitte\nNach: Berlin-Spandau\n\nKönnen Sie uns helfen?\n\nBitte melden Sie sich schnellstmöglich!\n\nVG\nFamilie Müller\nTel: 0171-1234567',
          htmlContent: '<p>Hallo,</p><p>wir brauchen dringend Hilfe beim Umzug nächste Woche.</p><p>Unser bisheriger Umzugsservice ist abgesprungen und wir müssen bis zum 25.01. aus der Wohnung raus.</p><p>4-Zimmer-Wohnung, 95qm, 2. Stock mit Aufzug<br>Von: Berlin-Mitte<br>Nach: Berlin-Spandau</p><p>Können Sie uns helfen?</p><p><strong>Bitte melden Sie sich schnellstmöglich!</strong></p><p>VG<br>Familie Müller<br>Tel: 0171-1234567</p>',
          folder: 'INBOX',
          isRead: true,
          isFlagged: true,
          isDraft: false,
          isDeleted: false,
          attachments: []
        },
        {
          uid: 1006,
          seqno: 6,
          flags: ['\\Seen'],
          from: 'buchung@moebelhaus-berlin.de',
          to: 'info@umzugsservice.com',
          subject: 'Kooperationsanfrage - Möbeltransport',
          date: new Date('2025-01-17T10:00:00').toISOString(),
          preview: 'Sehr geehrte Damen und Herren, wir suchen einen zuverlässigen Partner...',
          body: 'Sehr geehrte Damen und Herren,\n\nwir suchen einen zuverlässigen Partner für Möbeltransporte unserer Kunden.\n\nWir verkaufen monatlich ca. 50-80 große Möbelstücke, die geliefert und teilweise montiert werden müssen.\n\nHätten Sie Interesse an einer langfristigen Kooperation?\n\nBei Interesse melden Sie sich bitte für ein persönliches Gespräch.\n\nMit freundlichen Grüßen\nMöbelhaus Berlin GmbH\nGeschäftsführung',
          textContent: 'Sehr geehrte Damen und Herren,\n\nwir suchen einen zuverlässigen Partner für Möbeltransporte unserer Kunden.\n\nWir verkaufen monatlich ca. 50-80 große Möbelstücke, die geliefert und teilweise montiert werden müssen.\n\nHätten Sie Interesse an einer langfristigen Kooperation?\n\nBei Interesse melden Sie sich bitte für ein persönliches Gespräch.\n\nMit freundlichen Grüßen\nMöbelhaus Berlin GmbH\nGeschäftsführung',
          htmlContent: '<p>Sehr geehrte Damen und Herren,</p><p>wir suchen einen zuverlässigen Partner für Möbeltransporte unserer Kunden.</p><p>Wir verkaufen monatlich ca. 50-80 große Möbelstücke, die geliefert und teilweise montiert werden müssen.</p><p>Hätten Sie Interesse an einer langfristigen Kooperation?</p><p>Bei Interesse melden Sie sich bitte für ein persönliches Gespräch.</p><p>Mit freundlichen Grüßen<br>Möbelhaus Berlin GmbH<br>Geschäftsführung</p>',
          folder: 'INBOX',
          isRead: true,
          isFlagged: false,
          isDraft: false,
          isDeleted: false,
          attachments: [
            {
              filename: 'Kooperationskonzept.pdf',
              contentType: 'application/pdf',
              size: 245632,
              contentId: 'attachment-1'
            }
          ]
        },
        {
          uid: 1007,
          seqno: 7,
          flags: ['\\Deleted'],
          from: 'spam@spammer.com',
          to: 'info@umzugsservice.com',
          subject: 'GEWINNSPIEL - Sie haben gewonnen!',
          date: new Date('2025-01-14T22:30:00').toISOString(),
          preview: 'Herzlichen Glückwunsch! Sie haben 1.000.000 Euro gewonnen...',
          body: 'Herzlichen Glückwunsch! Sie haben 1.000.000 Euro gewonnen...\n\n[SPAM - GELÖSCHT]',
          textContent: 'Herzlichen Glückwunsch! Sie haben 1.000.000 Euro gewonnen...\n\n[SPAM - GELÖSCHT]',
          htmlContent: '<p>Herzlichen Glückwunsch! Sie haben 1.000.000 Euro gewonnen...</p><p>[SPAM - GELÖSCHT]</p>',
          folder: 'Trash',
          isRead: false,
          isFlagged: false,
          isDraft: false,
          isDeleted: true,
          attachments: []
        },
        {
          uid: 1008,
          seqno: 8,
          flags: ['\\Seen'],
          from: 'peter.wagner@gmail.com',
          to: 'info@umzugsservice.com',
          subject: 'Beschwerde - Umzug vom 10.01.',
          date: new Date('2025-01-11T08:30:00').toISOString(),
          preview: 'Sehr geehrte Damen und Herren, ich möchte mich über den Umzug beschweren...',
          body: 'Sehr geehrte Damen und Herren,\n\nich möchte mich über den Umzug vom 10.01. beschweren.\n\nDie Mitarbeiter kamen 2 Stunden zu spät und haben meine Kommode beschädigt.\n\nIch erwarte eine Stellungnahme und Schadensersatz.\n\nMit freundlichen Grüßen\nPeter Wagner',
          textContent: 'Sehr geehrte Damen und Herren,\n\nich möchte mich über den Umzug vom 10.01. beschweren.\n\nDie Mitarbeiter kamen 2 Stunden zu spät und haben meine Kommode beschädigt.\n\nIch erwarte eine Stellungnahme und Schadensersatz.\n\nMit freundlichen Grüßen\nPeter Wagner',
          htmlContent: '<p>Sehr geehrte Damen und Herren,</p><p>ich möchte mich über den Umzug vom 10.01. beschweren.</p><p>Die Mitarbeiter kamen 2 Stunden zu spät und haben meine Kommode beschädigt.</p><p>Ich erwarte eine Stellungnahme und Schadensersatz.</p><p>Mit freundlichen Grüßen<br>Peter Wagner</p>',
          folder: 'INBOX',
          isRead: true,
          isFlagged: true,
          isDraft: false,
          isDeleted: false,
          attachments: [
            {
              filename: 'Schaden_Kommode.jpg',
              contentType: 'image/jpeg',
              size: 1843200,
              contentId: 'attachment-2'
            }
          ]
        },
        {
          uid: 1009,
          seqno: 9,
          flags: ['\\Seen', '\\Answered'],
          from: 'info@umzugsservice.com',
          to: 'peter.wagner@gmail.com',
          subject: 'Re: Beschwerde - Umzug vom 10.01.',
          date: new Date('2025-01-11T10:15:00').toISOString(),
          preview: 'Sehr geehrter Herr Wagner, es tut uns sehr leid...',
          body: 'Sehr geehrter Herr Wagner,\n\nes tut uns sehr leid, dass es bei Ihrem Umzug zu Problemen gekommen ist.\n\nWir nehmen Ihre Beschwerde sehr ernst und werden den Vorfall umgehend untersuchen.\n\nUnser Schadensmanagement wird sich heute noch bei Ihnen melden, um die Schadensregulierung zu besprechen.\n\nNochmals entschuldigen wir uns für die Unannehmlichkeiten.\n\nMit freundlichen Grüßen\nIhr Umzugsteam\nKundenservice',
          textContent: 'Sehr geehrter Herr Wagner,\n\nes tut uns sehr leid, dass es bei Ihrem Umzug zu Problemen gekommen ist.\n\nWir nehmen Ihre Beschwerde sehr ernst und werden den Vorfall umgehend untersuchen.\n\nUnser Schadensmanagement wird sich heute noch bei Ihnen melden, um die Schadensregulierung zu besprechen.\n\nNochmals entschuldigen wir uns für die Unannehmlichkeiten.\n\nMit freundlichen Grüßen\nIhr Umzugsteam\nKundenservice',
          htmlContent: '<p>Sehr geehrter Herr Wagner,</p><p>es tut uns sehr leid, dass es bei Ihrem Umzug zu Problemen gekommen ist.</p><p>Wir nehmen Ihre Beschwerde sehr ernst und werden den Vorfall umgehend untersuchen.</p><p>Unser Schadensmanagement wird sich heute noch bei Ihnen melden, um die Schadensregulierung zu besprechen.</p><p>Nochmals entschuldigen wir uns für die Unannehmlichkeiten.</p><p>Mit freundlichen Grüßen<br>Ihr Umzugsteam<br>Kundenservice</p>',
          folder: 'Sent',
          isRead: true,
          isFlagged: false,
          isDraft: false,
          isDeleted: false,
          attachments: []
        },
        {
          uid: 1010,
          seqno: 10,
          flags: [],
          from: 'anna.schmidt@web.de',
          to: 'info@umzugsservice.com',
          subject: 'Vielen Dank für den tollen Service!',
          date: new Date('2025-01-12T14:20:00').toISOString(),
          preview: 'Liebes Umzugsteam, ich möchte mich herzlich bedanken...',
          body: 'Liebes Umzugsteam,\n\nich möchte mich herzlich für den reibungslosen Umzug gestern bedanken!\n\nIhre Mitarbeiter waren pünktlich, freundlich und sehr professionell. Alles wurde sicher transportiert und nichts wurde beschädigt.\n\nIch werde Sie auf jeden Fall weiterempfehlen!\n\nViele Grüße\nAnna Schmidt',
          textContent: 'Liebes Umzugsteam,\n\nich möchte mich herzlich für den reibungslosen Umzug gestern bedanken!\n\nIhre Mitarbeiter waren pünktlich, freundlich und sehr professionell. Alles wurde sicher transportiert und nichts wurde beschädigt.\n\nIch werde Sie auf jeden Fall weiterempfehlen!\n\nViele Grüße\nAnna Schmidt',
          htmlContent: '<p>Liebes Umzugsteam,</p><p>ich möchte mich herzlich für den reibungslosen Umzug gestern bedanken!</p><p>Ihre Mitarbeiter waren pünktlich, freundlich und sehr professionell. Alles wurde sicher transportiert und nichts wurde beschädigt.</p><p>Ich werde Sie auf jeden Fall weiterempfehlen!</p><p>Viele Grüße<br>Anna Schmidt</p>',
          folder: 'INBOX',
          isRead: false,
          isFlagged: false,
          isDraft: false,
          isDeleted: false,
          attachments: []
        }
      ];

      // Batch für bessere Performance
      const batch = db.batch();
      let addedCount = 0;

      for (const email of testEmails) {
        const docRef = db.collection('emailClient').doc();
        batch.set(docRef, {
          ...email,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          testEmail: true // Markierung, dass es sich um Test-E-Mails handelt
        });
        addedCount++;
      }

      // Batch commit
      await batch.commit();

      console.log(`Successfully added ${addedCount} test emails`);
      
      res.status(200).json({
        success: true,
        message: `Successfully added ${addedCount} test emails to emailClient collection`,
        emailsAdded: addedCount,
        folders: ['INBOX', 'Sent', 'Drafts', 'Trash']
      });

    } catch (error) {
      console.error('Error adding test emails:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

/**
 * Löscht alle Test-E-Mails aus der emailClient Collection
 */
exports.clearTestEmails = functions
  .region('europe-west1')
  .https.onRequest(async (req, res) => {
    try {
      console.log('Clearing test emails...');
      
      // Finde alle Test-E-Mails
      const snapshot = await db.collection('emailClient')
        .where('testEmail', '==', true)
        .get();

      if (snapshot.empty) {
        return res.status(200).json({
          success: true,
          message: 'No test emails found to delete',
          deletedCount: 0
        });
      }

      // Batch-Löschung für bessere Performance
      const batch = db.batch();
      let deleteCount = 0;

      snapshot.forEach(doc => {
        batch.delete(doc.ref);
        deleteCount++;
      });

      await batch.commit();

      console.log(`Successfully deleted ${deleteCount} test emails`);
      
      res.status(200).json({
        success: true,
        message: `Successfully deleted ${deleteCount} test emails`,
        deletedCount: deleteCount
      });

    } catch (error) {
      console.error('Error clearing test emails:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });