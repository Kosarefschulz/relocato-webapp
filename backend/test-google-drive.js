const { google } = require('googleapis');
require('dotenv').config();

async function testGoogleDrive() {
  console.log('🧪 Teste Google Drive Integration...\n');

  try {
    // Prüfe ob alle Environment Variables gesetzt sind
    console.log('📋 Environment Check:');
    console.log('✓ Client Email:', process.env.GOOGLE_CLIENT_EMAIL ? '✅' : '❌');
    console.log('✓ Private Key:', process.env.GOOGLE_PRIVATE_KEY ? '✅' : '❌');
    console.log('✓ Folder ID:', process.env.GOOGLE_DRIVE_FOLDER_ID ? '✅' : '❌');
    console.log('\n');

    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_DRIVE_FOLDER_ID) {
      throw new Error('Fehlende Environment Variables!');
    }

    // Google Auth initialisieren
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const authClient = await auth.getClient();
    const drive = google.drive({ version: 'v3', auth: authClient });
    
    console.log('✅ Google Drive Service initialisiert\n');

    // Teste Zugriff auf den Ordner
    console.log('📁 Teste Zugriff auf Ordner...');
    const folderResponse = await drive.files.get({
      fileId: process.env.GOOGLE_DRIVE_FOLDER_ID,
      fields: 'id, name, mimeType'
    });

    console.log('✅ Ordner gefunden:', folderResponse.data.name);
    console.log('   ID:', folderResponse.data.id);
    console.log('\n');

    // Erstelle Test-Textdatei
    console.log('📝 Erstelle Test-Datei...');
    const fileMetadata = {
      name: `Test_${new Date().toISOString()}.txt`,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID]
    };

    const media = {
      mimeType: 'text/plain',
      body: 'Dies ist eine Test-Datei von Relocato Backend'
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink'
    });

    console.log('✅ Test-Datei erstellt:', file.data.name);
    console.log('   Link:', file.data.webViewLink);
    console.log('\n');

    // Liste Dateien im Ordner
    console.log('📋 Dateien im Ordner:');
    const listResponse = await drive.files.list({
      q: `'${process.env.GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed=false`,
      fields: 'files(id, name, createdTime)',
      orderBy: 'createdTime desc',
      pageSize: 5
    });

    listResponse.data.files.forEach(file => {
      console.log(`   - ${file.name} (${new Date(file.createdTime).toLocaleString('de-DE')})`);
    });

    console.log('\n🎉 Google Drive Integration funktioniert einwandfrei!');
    console.log('📌 Der Service Account hat Zugriff auf den Ordner.');
    console.log('📌 Dateien können hochgeladen und aufgelistet werden.');

  } catch (error) {
    console.error('\n❌ Fehler:', error.message);
    
    if (error.code === 404) {
      console.log('\n💡 Der Ordner wurde nicht gefunden. Prüfen Sie:');
      console.log('   1. Ist die Ordner-ID korrekt?');
      console.log('   2. Hat der Service Account Zugriff auf den Ordner?');
      console.log('\n📧 Service Account Email:', process.env.GOOGLE_CLIENT_EMAIL);
      console.log('   Diese Email muss Zugriff auf den Ordner haben!');
    } else if (error.code === 403) {
      console.log('\n💡 Keine Berechtigung. Der Service Account hat keinen Zugriff.');
      console.log('   Teilen Sie den Ordner mit:', process.env.GOOGLE_CLIENT_EMAIL);
    }
  }
}

// Test ausführen
testGoogleDrive();