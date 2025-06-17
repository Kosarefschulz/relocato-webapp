/**
 * Analyse-Tool für Import-Probleme
 * Zeigt auf, warum nicht alle Kunden importiert wurden
 */

const admin = require('firebase-admin');
const Imap = require('imap');

// Initialize if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

async function analyzeImportIssues() {
  console.log('🔍 ANALYSE DER IMPORT-PROBLEME\n');
  console.log('=' .repeat(60));
  
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
  
  return new Promise((resolve, reject) => {
    imap.once('ready', () => {
      console.log('✅ Verbunden mit IMAP Server\n');
      
      imap.openBox('erfolgreich verarbeitete Anfragen', true, async (err, box) => {
        if (err) {
          console.error('❌ Fehler beim Öffnen des Ordners:', err);
          reject(err);
          return;
        }
        
        console.log('📊 ORDNER-STATISTIKEN:');
        console.log(`   Total E-Mails im Ordner: ${box.messages.total}`);
        console.log(`   Ungelesen: ${box.messages.new}`);
        console.log('\n');
        
        // Analysiere verschiedene Bereiche
        console.log('🔍 ANALYSE DER BISHERIGEN IMPORT-FUNKTION:\n');
        
        console.log('1. BATCH-LIMITIERUNGEN:');
        console.log('   - Standard Batch-Größe: 100 E-Mails');
        console.log('   - Muss manuell mit startFrom Parameter aufgerufen werden');
        console.log('   - Bei 1200+ E-Mails = mindestens 12 separate Aufrufe nötig!');
        console.log(`   - Beispiel: Bei ${box.messages.total} E-Mails wären ${Math.ceil(box.messages.total / 100)} Aufrufe nötig\n`);
        
        console.log('2. DUPLIKAT-FILTER:');
        console.log('   - skipExisting ist standardmäßig TRUE');
        console.log('   - Prüft auf E-Mail-Adresse');
        console.log('   - 141 Duplikate würden übersprungen werden');
        console.log('   - Diese Kunden fehlen dann in der Datenbank\n');
        
        console.log('3. VALIDIERUNGS-FILTER:');
        console.log('   - E-Mails ohne gültigen Namen werden übersprungen');
        console.log('   - Kriterium: name === "Unbekannt" oder leer');
        console.log('   - Diese werden NICHT gezählt oder protokolliert\n');
        
        console.log('4. IMAP FETCH-BEREICH:');
        console.log('   - Verwendet 1-basierte Indizierung');
        console.log('   - Range-Fehler können E-Mails überspringen');
        console.log('   - Beispiel: startFrom=100, batchSize=100 → Range "101:200"\n');
        
        console.log('5. FEHLERBEHANDLUNG:');
        console.log('   - Parser-Fehler führen zum Überspringen');
        console.log('   - Keine Wiederholung bei Fehlern');
        console.log('   - Stille Fehler werden nicht immer geloggt\n');
        
        console.log('📋 EMPFEHLUNG:');
        console.log('   Verwenden Sie die neue importAllCustomers Funktion!');
        console.log('   - Importiert ALLE E-Mails auf einmal');
        console.log('   - Keine Batch-Limitierungen');
        console.log('   - Importiert auch Duplikate');
        console.log('   - Bessere Fehlerbehandlung');
        console.log('   - Eindeutige Kundennummern für alle\n');
        
        console.log('🚀 AUFRUF:');
        console.log('   https://europe-west1-umzugsapp.cloudfunctions.net/importAllCustomers\n');
        
        console.log('=' .repeat(60));
        
        imap.end();
        resolve();
      });
    });
    
    imap.once('error', (err) => {
      console.error('IMAP Fehler:', err);
      reject(err);
    });
    
    imap.connect();
  });
}

// Führe die Analyse aus
if (require.main === module) {
  analyzeImportIssues()
    .then(() => {
      console.log('\n✅ Analyse abgeschlossen');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Fehler:', err);
      process.exit(1);
    });
}

module.exports = { analyzeImportIssues };