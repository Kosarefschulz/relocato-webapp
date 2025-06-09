const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Service Account Credentials
const credentials = require('./src/config/google-credentials.json');

async function setupGoogleSheets() {
  try {
    console.log('🚀 Starte Google Sheets Setup...');

    // Google Auth initialisieren
    const auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Neues Spreadsheet erstellen
    console.log('📊 Erstelle neues Spreadsheet...');
    const createResponse = await sheets.spreadsheets.create({
      resource: {
        properties: {
          title: 'Umzugs-Kunden-Datenbank'
        },
        sheets: [
          {
            properties: {
              title: 'Kunden',
              gridProperties: {
                rowCount: 1000,
                columnCount: 13
              }
            }
          },
          {
            properties: {
              title: 'Angebote',
              gridProperties: {
                rowCount: 1000,
                columnCount: 8
              }
            }
          }
        ]
      }
    });

    const spreadsheetId = createResponse.data.spreadsheetId;
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
    
    console.log(`✅ Spreadsheet erstellt!`);
    console.log(`📋 ID: ${spreadsheetId}`);
    console.log(`🔗 URL: ${spreadsheetUrl}`);

    // Header für Kunden-Tab setzen
    console.log('📝 Setze Kunden-Header...');
    const customerHeaders = [
      'id', 'name', 'email', 'phone', 'movingDate', 
      'fromAddress', 'toAddress', 'rooms', 'area', 
      'floor', 'hasElevator', 'services', 'notes'
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: 'Kunden!A1:M1',
      valueInputOption: 'RAW',
      resource: {
        values: [customerHeaders]
      }
    });

    // Header für Angebote-Tab setzen
    console.log('📝 Setze Angebote-Header...');
    const quoteHeaders = [
      'id', 'customerId', 'customerName', 'price', 
      'comment', 'createdAt', 'createdBy', 'status'
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: 'Angebote!A1:H1',
      valueInputOption: 'RAW',
      resource: {
        values: [quoteHeaders]
      }
    });

    // Beispiel-Kunden hinzufügen
    console.log('👥 Füge Beispiel-Kunden hinzu...');
    const sampleCustomers = [
      [
        '1', 'Max Mustermann', 'max@example.com', '+49 123 456789', '2024-02-15',
        'Musterstraße 1, 12345 Berlin', 'Beispielweg 2, 54321 Hamburg', 
        '3', '75', '2', 'TRUE', 'Umzug, Verpackung, Montage', 'Klaviertransport erforderlich'
      ],
      [
        '2', 'Maria Schmidt', 'maria@example.com', '+49 987 654321', '2024-03-01',
        'Hauptstraße 10, 10117 Berlin', 'Nebenstraße 5, 80331 München',
        '2', '55', '4', 'FALSE', 'Umzug, Verpackung', ''
      ],
      [
        '3', 'Hans Weber', 'hans@example.com', '+49 555 123456', '2024-01-20',
        'Gartenstraße 15, 01067 Dresden', 'Parkweg 8, 50667 Köln',
        '4', '95', '1', 'TRUE', 'Umzug, Verpackung, Montage, Einlagerung', 'Viele Bücher'
      ]
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: 'Kunden!A:M',
      valueInputOption: 'RAW',
      resource: {
        values: sampleCustomers
      }
    });

    // Beispiel-Angebote hinzufügen
    console.log('💰 Füge Beispiel-Angebote hinzu...');
    const sampleQuotes = [
      [
        '1', '1', 'Max Mustermann', '1250.00', 'Klaviertransport inklusive',
        new Date('2024-01-15').toISOString(), 'demo-user', 'sent'
      ],
      [
        '2', '2', 'Maria Schmidt', '890.00', '',
        new Date('2024-01-14').toISOString(), 'demo-user', 'accepted'
      ]
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: 'Angebote!A:H',
      valueInputOption: 'RAW',
      resource: {
        values: sampleQuotes
      }
    });

    // .env Datei aktualisieren
    console.log('⚙️ Aktualisiere .env Datei...');
    const envPath = path.join(__dirname, '.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Google Sheets Konfiguration hinzufügen/aktualisieren
    const googleSheetsConfig = `
# Google Sheets Konfiguration
REACT_APP_GOOGLE_SHEETS_ID=${spreadsheetId}
REACT_APP_GOOGLE_SHEETS_ENABLED=true
`;

    // Entferne alte Google Sheets Konfiguration falls vorhanden
    envContent = envContent.replace(/\n# Google Sheets Konfiguration[\s\S]*?(?=\n[A-Z]|\n$|$)/g, '');
    envContent = envContent.replace(/REACT_APP_GOOGLE_SHEETS_ID=.*/g, '');
    envContent = envContent.replace(/REACT_APP_GOOGLE_SHEETS_ENABLED=.*/g, '');

    // Füge neue Konfiguration hinzu
    envContent += googleSheetsConfig;

    fs.writeFileSync(envPath, envContent);

    console.log('🎉 Google Sheets Setup abgeschlossen!');
    console.log('');
    console.log('📋 Nächste Schritte:');
    console.log('1. Öffne das Spreadsheet:', spreadsheetUrl);
    console.log('2. Starte die App neu: npm start');
    console.log('3. Teste die Funktionen: Kunde suchen, Neuer Kunde, etc.');
    console.log('');
    console.log('ℹ️  Die App verwendet jetzt automatisch Google Sheets für Kundendaten!');

  } catch (error) {
    console.error('❌ Fehler beim Setup:', error);
    
    if (error.message.includes('permission')) {
      console.log('');
      console.log('🔧 Mögliche Lösungen:');
      console.log('1. Überprüfe, ob die Google Sheets API aktiviert ist');
      console.log('2. Stelle sicher, dass der Service Account die richtigen Berechtigungen hat');
      console.log('3. Überprüfe die Credentials in src/config/google-credentials.json');
    }
  }
}

// Script ausführen
setupGoogleSheets();