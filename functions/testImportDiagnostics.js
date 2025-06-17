/**
 * Diagnose-Tool für Import-Probleme
 * Zeigt detailliert, was mit E-Mails passiert
 */

const admin = require('firebase-admin');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { parseEmail } = require('./emailParser');

if (!admin.apps.length) {
  admin.initializeApp();
}

async function runDiagnostics() {
  console.log('🔬 IMPORT-DIAGNOSE TOOL\n');
  console.log('=' .repeat(80));
  
  const config = {
    user: 'bielefeld@relocato.de',
    password: 'Bicm1308',
    host: 'imap.ionos.de',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    connTimeout: 30000,
    authTimeout: 30000
  };
  
  const imap = new Imap(config);
  const db = admin.firestore();
  
  // Statistiken
  const stats = {
    totalEmails: 0,
    parsedSuccessfully: 0,
    withValidName: 0,
    withoutName: 0,
    withEmail: 0,
    withoutEmail: 0,
    uniqueEmails: new Set(),
    duplicateEmails: [],
    parseErrors: [],
    sampleCustomers: []
  };
  
  return new Promise((resolve, reject) => {
    imap.once('ready', () => {
      console.log('✅ Verbunden mit IMAP Server\n');
      
      imap.openBox('erfolgreich verarbeitete Anfragen', true, async (err, box) => {
        if (err) {
          reject(err);
          return;
        }
        
        stats.totalEmails = box.messages.total;
        console.log(`📬 ${box.messages.total} E-Mails im Ordner\n`);
        
        // Teste die ersten 200 E-Mails als Stichprobe
        const sampleSize = Math.min(200, box.messages.total);
        console.log(`🔍 Analysiere ${sampleSize} E-Mails als Stichprobe...\n`);
        
        const fetch = imap.fetch(`1:${sampleSize}`, { 
          bodies: '',
          markSeen: false
        });
        
        const emailPromises = [];
        let processed = 0;
        
        fetch.on('message', (msg, seqno) => {
          const emailPromise = new Promise((resolveEmail) => {
            let emailBuffer = '';
            
            msg.on('body', (stream) => {
              stream.on('data', (chunk) => {
                emailBuffer += chunk.toString('utf8');
              });
              
              stream.once('end', async () => {
                processed++;
                if (processed % 50 === 0) {
                  console.log(`   Verarbeitet: ${processed}/${sampleSize}`);
                }
                
                try {
                  const parsed = await simpleParser(emailBuffer);
                  const emailData = {
                    from: parsed.from?.text || '',
                    to: parsed.to?.text || '',
                    subject: parsed.subject || '',
                    text: parsed.text || '',
                    html: parsed.html || '',
                    date: parsed.date || new Date()
                  };
                  
                  // Parse mit unserem Parser
                  const customer = parseEmail(emailData);
                  stats.parsedSuccessfully++;
                  
                  // Analysiere Ergebnis
                  if (customer.name && customer.name !== 'Unbekannt') {
                    stats.withValidName++;
                  } else {
                    stats.withoutName++;
                  }
                  
                  if (customer.email) {
                    stats.withEmail++;
                    if (stats.uniqueEmails.has(customer.email)) {
                      stats.duplicateEmails.push(customer.email);
                    } else {
                      stats.uniqueEmails.add(customer.email);
                    }
                  } else {
                    stats.withoutEmail++;
                  }
                  
                  // Speichere einige Beispiele
                  if (stats.sampleCustomers.length < 5) {
                    stats.sampleCustomers.push({
                      seqno,
                      name: customer.name,
                      email: customer.email,
                      phone: customer.phone,
                      source: customer.source
                    });
                  }
                  
                } catch (error) {
                  stats.parseErrors.push({
                    seqno,
                    error: error.message
                  });
                }
                
                resolveEmail();
              });
            });
          });
          
          emailPromises.push(emailPromise);
        });
        
        fetch.once('end', async () => {
          await Promise.all(emailPromises);
          
          // Zeige Ergebnisse
          console.log('\n' + '=' .repeat(80));
          console.log('📊 ANALYSE-ERGEBNISSE:\n');
          
          console.log('GESAMT-STATISTIKEN:');
          console.log(`   E-Mails im Ordner: ${stats.totalEmails}`);
          console.log(`   Analysierte Stichprobe: ${sampleSize}`);
          console.log(`   Erfolgreich geparst: ${stats.parsedSuccessfully}`);
          console.log(`   Parse-Fehler: ${stats.parseErrors.length}\n`);
          
          console.log('KUNDEN-DATEN:');
          console.log(`   Mit gültigem Namen: ${stats.withValidName} (${(stats.withValidName/sampleSize*100).toFixed(1)}%)`);
          console.log(`   Ohne Namen: ${stats.withoutName} (${(stats.withoutName/sampleSize*100).toFixed(1)}%)`);
          console.log(`   Mit E-Mail: ${stats.withEmail} (${(stats.withEmail/sampleSize*100).toFixed(1)}%)`);
          console.log(`   Ohne E-Mail: ${stats.withoutEmail} (${(stats.withoutEmail/sampleSize*100).toFixed(1)}%)\n`);
          
          console.log('DUPLIKATE:');
          console.log(`   Eindeutige E-Mail-Adressen: ${stats.uniqueEmails.size}`);
          console.log(`   Duplikate gefunden: ${stats.duplicateEmails.length}`);
          
          // Hochrechnung
          const duplicateRate = stats.duplicateEmails.length / sampleSize;
          const estimatedDuplicates = Math.round(stats.totalEmails * duplicateRate);
          console.log(`   Geschätzte Duplikate gesamt: ~${estimatedDuplicates}\n`);
          
          console.log('BEISPIEL-KUNDEN:');
          stats.sampleCustomers.forEach((customer, i) => {
            console.log(`   ${i+1}. #${customer.seqno}: ${customer.name} | ${customer.email || 'keine E-Mail'} | ${customer.source}`);
          });
          
          if (stats.parseErrors.length > 0) {
            console.log('\nPARSE-FEHLER (erste 5):');
            stats.parseErrors.slice(0, 5).forEach(err => {
              console.log(`   #${err.seqno}: ${err.error}`);
            });
          }
          
          // Prüfe bestehende Kunden in Firestore
          console.log('\n🔍 Prüfe bestehende Kunden in Firestore...');
          const customersSnapshot = await db.collection('customers').count().get();
          const customerCount = customersSnapshot.data().count;
          console.log(`   Aktuelle Kunden in DB: ${customerCount}`);
          console.log(`   Fehlende Kunden: ~${stats.totalEmails - customerCount}`);
          
          console.log('\n💡 EMPFEHLUNGEN:');
          console.log('   1. Verwenden Sie importAllCustomers für vollständigen Import');
          console.log('   2. Die Funktion importiert ALLE Kunden, auch Duplikate');
          console.log('   3. Duplikate können später manuell bereinigt werden');
          console.log('   4. Jeder Kunde erhält eine eindeutige Kundennummer\n');
          
          console.log('🚀 IMPORT STARTEN:');
          console.log('   firebase deploy --only functions:importAllCustomers');
          console.log('   Dann: https://europe-west1-umzugsapp.cloudfunctions.net/importAllCustomers\n');
          
          console.log('=' .repeat(80));
          
          imap.end();
          resolve(stats);
        });
      });
    });
    
    imap.once('error', (err) => {
      console.error('IMAP Fehler:', err);
      reject(err);
    });
    
    imap.connect();
  });
}

// Run diagnostics
if (require.main === module) {
  runDiagnostics()
    .then(() => {
      console.log('\n✅ Diagnose abgeschlossen');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Fehler:', err);
      process.exit(1);
    });
}

module.exports = { runDiagnostics };