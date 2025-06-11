const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Lade die Umgebungsvariablen
require('dotenv').config();

async function setupGoogleDrive() {
  try {
    console.log('🚀 Google Drive Setup wird gestartet...\n');

    // Service Account Authentifizierung
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.REACT_APP_GOOGLE_DRIVE_CLIENT_EMAIL,
        private_key: process.env.REACT_APP_GOOGLE_DRIVE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // 1. Hauptordner erstellen
    console.log('📁 Erstelle Hauptordner "Relocato Kunden"...');
    
    const folderMetadata = {
      name: 'Relocato Kunden',
      mimeType: 'application/vnd.google-apps.folder',
    };

    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id, name, webViewLink',
    });

    console.log('✅ Ordner erstellt!');
    console.log(`   Name: ${folder.data.name}`);
    console.log(`   ID: ${folder.data.id}`);
    console.log(`   Link: ${folder.data.webViewLink}\n`);

    // 2. Ordner öffentlich zugänglich machen (optional)
    console.log('🔐 Setze Berechtigungen...');
    
    await drive.permissions.create({
      fileId: folder.data.id,
      requestBody: {
        role: 'writer',
        type: 'user',
        emailAddress: process.env.REACT_APP_GOOGLE_DRIVE_CLIENT_EMAIL,
      },
    });

    console.log('✅ Berechtigungen gesetzt!\n');

    // 3. Unterordner-Struktur erstellen
    console.log('📂 Erstelle Unterordner-Struktur...');
    
    const subfolders = ['A-F', 'G-L', 'M-R', 'S-Z', 'Demo'];
    
    for (const subfolder of subfolders) {
      const subfolderMetadata = {
        name: subfolder,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [folder.data.id],
      };

      await drive.files.create({
        requestBody: subfolderMetadata,
        fields: 'id, name',
      });
      
      console.log(`   ✅ ${subfolder} erstellt`);
    }

    // 4. .env Datei aktualisieren
    console.log('\n📝 Aktualisiere .env Datei...');
    
    const envPath = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent = envContent.replace(
      'REACT_APP_GOOGLE_DRIVE_FOLDER_ID=YOUR_FOLDER_ID_HERE',
      `REACT_APP_GOOGLE_DRIVE_FOLDER_ID=${folder.data.id}`
    );
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env Datei aktualisiert!\n');

    // 5. Erfolg!
    console.log('🎉 Google Drive Setup erfolgreich abgeschlossen!');
    console.log('\n📋 Zusammenfassung:');
    console.log(`   Hauptordner ID: ${folder.data.id}`);
    console.log(`   Ordner Link: ${folder.data.webViewLink}`);
    console.log('\n⚠️  WICHTIG: Fügen Sie diese Umgebungsvariablen auch in Vercel hinzu!');
    
  } catch (error) {
    console.error('❌ Fehler beim Setup:', error.message);
    
    if (error.message.includes('invalid_grant')) {
      console.log('\n💡 Tipp: Die Service Account Credentials sind möglicherweise ungültig.');
    } else if (error.message.includes('Permission denied')) {
      console.log('\n💡 Tipp: Aktivieren Sie die Google Drive API in der Google Cloud Console.');
    }
  }
}

// Script ausführen
setupGoogleDrive();