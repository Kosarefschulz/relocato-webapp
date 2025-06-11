const { google } = require('googleapis');
require('dotenv').config();

async function shareFolderWithUser() {
  try {
    console.log('🔗 Teile Google Drive Ordner...\n');

    // Service Account Authentifizierung
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.REACT_APP_GOOGLE_DRIVE_CLIENT_EMAIL,
        private_key: process.env.REACT_APP_GOOGLE_DRIVE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });
    const folderId = process.env.REACT_APP_GOOGLE_DRIVE_FOLDER_ID;

    // WICHTIG: Ändern Sie diese E-Mail zu Ihrer Google Account E-Mail!
    const YOUR_EMAIL = 'sergej.schulz92@gmail.com'; // <-- HIER IHRE E-MAIL EINTRAGEN!
    
    console.log('📧 Teile Ordner mit:', YOUR_EMAIL);
    console.log('📁 Ordner ID:', folderId);

    // Berechtigung für Ihre E-Mail hinzufügen
    await drive.permissions.create({
      fileId: folderId,
      requestBody: {
        role: 'writer', // oder 'owner' für volle Kontrolle
        type: 'user',
        emailAddress: YOUR_EMAIL,
      },
    });

    console.log('\n✅ Erfolgreich geteilt!');
    console.log('\n📋 Nächste Schritte:');
    console.log('1. Öffnen Sie Google Drive');
    console.log('2. Schauen Sie unter "Für mich freigegeben"');
    console.log('3. Der Ordner "Relocato Kunden" sollte dort sein');
    console.log('\nDirektlink: https://drive.google.com/drive/folders/' + folderId);
    
  } catch (error) {
    console.error('❌ Fehler:', error.message);
    
    if (error.message.includes('notFound')) {
      console.log('\n💡 Der Ordner wurde nicht gefunden. Prüfen Sie die Ordner-ID in .env');
    } else if (error.message.includes('forbidden')) {
      console.log('\n💡 Keine Berechtigung. Der Service Account hat möglicherweise keine Rechte zum Teilen.');
    }
  }
}

// Script ausführen
console.log('⚠️  WICHTIG: Ändern Sie zuerst YOUR_EMAIL in dieser Datei zu Ihrer Gmail-Adresse!\n');
console.log('Wenn Sie das getan haben, führen Sie das Script erneut aus.\n');

// Kommentieren Sie diese Zeile aus, nachdem Sie Ihre E-Mail eingetragen haben:
// console.log('Script wurde nicht ausgeführt - bitte E-Mail eintragen!');

// Entkommentieren Sie diese Zeile, nachdem Sie Ihre E-Mail eingetragen haben:
shareFolderWithUser();