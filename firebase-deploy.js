const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Firebase E-Mail Parser Deployment Script');
console.log('==========================================\n');

// Prüfe ob wir eingeloggt sind
exec('firebase projects:list', (error, stdout, stderr) => {
  if (error) {
    console.log('❌ Sie sind nicht bei Firebase eingeloggt.');
    console.log('📝 Bitte führen Sie zuerst aus:\n');
    console.log('   firebase login\n');
    console.log('Danach führen Sie dieses Script erneut aus:\n');
    console.log('   node firebase-deploy.js\n');
    process.exit(1);
  }

  console.log('✅ Firebase Login gefunden\n');
  
  // Setze Functions Config
  console.log('⚙️  Setze IONOS Konfiguration...');
  exec('firebase functions:config:set ionos.email="bielefeld@relocato.de" ionos.password="Bicm1308"', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Fehler beim Setzen der Konfiguration:', error);
      return;
    }
    
    console.log('✅ Konfiguration gesetzt\n');
    
    // Deploye Functions
    console.log('🚀 Deploye Firebase Functions...');
    console.log('Dies kann 2-3 Minuten dauern...\n');
    
    const deploy = exec('firebase deploy --only functions');
    
    deploy.stdout.on('data', (data) => {
      process.stdout.write(data);
    });
    
    deploy.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
    
    deploy.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Functions erfolgreich deployed!\n');
        console.log('📧 E-Mail Parser läuft jetzt!');
        console.log('============================\n');
        console.log('Der Parser prüft alle 5 Minuten Ihr Postfach bielefeld@relocato.de\n');
        console.log('📊 Logs anzeigen:');
        console.log('   firebase functions:log --follow\n');
        console.log('🧪 Test-E-Mail senden an: bielefeld@relocato.de');
        console.log('   Betreff: Umzugsanfrage von ImmoScout24');
        console.log('   (Siehe IONOS_EMAIL_PARSER_ANLEITUNG.md für Beispiel)\n');
      } else {
        console.log('\n❌ Deploy fehlgeschlagen!');
        console.log('Bitte prüfen Sie die Fehler oben.\n');
      }
    });
  });
});