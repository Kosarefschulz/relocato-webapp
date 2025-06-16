const functions = require('firebase-functions');
const https = require('https');

/**
 * Scheduled function that runs every 5 minutes to check emails
 */
exports.scheduledEmailCheck = functions
  .region('europe-west1')
  .pubsub
  .schedule('every 5 minutes')
  .timeZone('Europe/Berlin')
  .onRun(async (context) => {
    console.log('🕐 Automatische E-Mail-Prüfung gestartet');
    
    return new Promise((resolve, reject) => {
      // Rufe die checkEmails Funktion auf
      const options = {
        hostname: 'europe-west1-umzugsapp.cloudfunctions.net',
        path: '/checkEmails',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            
            if (result.success) {
              console.log(`✅ ${result.processed} E-Mails verarbeitet`);
              resolve(result);
            } else {
              console.error('❌ Fehler bei E-Mail-Prüfung:', result.error);
              reject(new Error(result.error));
            }
          } catch (error) {
            console.error('❌ Fehler beim Parsen der Antwort:', error);
            reject(error);
          }
        });
      });
      
      req.on('error', (error) => {
        console.error('❌ Fehler beim Aufruf der checkEmails Funktion:', error);
        reject(error);
      });
      
      req.end();
    });
  });