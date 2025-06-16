const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');
const { google } = require('googleapis');
const multer = require('multer');
const stream = require('stream');

// Umgebungsvariablen laden
dotenv.config();

const app = express();

// CORS konfigurieren für Ihre React-App - Erlaubt alle Vercel URLs
app.use(cors({
  origin: [
    'https://relocato.ruempel-schmiede.com',
    'https://ruempel-schmiede.com',
    'https://umzugs-webapp-jgns7q61s-sergej-schulzs-projects.vercel.app',
    'https://umzugs-webapp-1acwl6e1x-sergej-schulzs-projects.vercel.app',
    'http://localhost:3000',
    /\.vercel\.app$/  // Alle Vercel Preview URLs
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
}));

// JSON Body Parser mit größerem Limit für PDFs
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Multer für File-Uploads konfigurieren
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB Limit
  }
});

// Google Services Konfiguration
let driveService = null;
let sheetsService = null;
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '1F5qtOkOiMMLqzwqe1HoLvNxJLtPZlqt9S0w6D7-aXGg';

// Google Drive Service initialisieren
async function initGoogleDrive() {
  try {
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !GOOGLE_DRIVE_FOLDER_ID) {
      console.log('⚠️  Google Drive Credentials fehlen - verwende localStorage Fallback');
      return null;
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/spreadsheets'
      ],
    });

    const authClient = await auth.getClient();
    driveService = google.drive({ version: 'v3', auth: authClient });
    sheetsService = google.sheets({ version: 'v4', auth: authClient });
    
    console.log('✅ Google Services initialisiert');
    console.log('📁 Drive Ordner ID:', GOOGLE_DRIVE_FOLDER_ID);
    console.log('📊 Sheets ID:', GOOGLE_SHEETS_ID);
    
    return { driveService, sheetsService };
  } catch (error) {
    console.error('❌ Google Drive Initialisierung fehlgeschlagen:', error);
    return null;
  }
}

// Google Drive beim Start initialisieren
initGoogleDrive();

// IONOS SMTP Konfiguration
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.ionos.de',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465', // true für SSL, false für STARTTLS
  auth: {
    user: process.env.SMTP_USER, // Ihre vollständige IONOS E-Mail-Adresse
    pass: process.env.SMTP_PASS  // Ihr IONOS E-Mail-Passwort
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  }
};

// Nodemailer Transporter erstellen
let transporter;
try {
  transporter = nodemailer.createTransport(SMTP_CONFIG);
  
  // Verbindung testen
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ SMTP Verbindungsfehler:', error);
    } else {
      console.log('✅ SMTP Server ist bereit für E-Mails');
      console.log('📧 Von:', process.env.SMTP_FROM || SMTP_CONFIG.auth.user);
    }
  });
} catch (error) {
  console.error('❌ Fehler beim Erstellen des Transporters:', error);
}

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    smtp: transporter ? 'ready' : 'error',
    googleDrive: driveService ? 'ready' : 'not configured',
    from: process.env.SMTP_FROM || process.env.SMTP_USER
  });
});

// Google Drive Upload Endpoint
app.post('/api/upload-photo', upload.single('photo'), async (req, res) => {
  try {
    if (!driveService) {
      return res.status(503).json({ 
        success: false, 
        error: 'Google Drive Service nicht verfügbar' 
      });
    }

    const { customerId, customerName } = req.body;
    const file = req.file;

    if (!file || !customerId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Foto und Kunden-ID sind erforderlich' 
      });
    }

    // Erstelle Kundenordner falls nicht vorhanden
    const customerFolderName = `${customerName || customerId}_Fotos`;
    
    // Suche nach existierendem Ordner
    const folderSearchResponse = await driveService.files.list({
      q: `name='${customerFolderName}' and mimeType='application/vnd.google-apps.folder' and '${GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    let customerFolderId;
    
    if (folderSearchResponse.data.files.length > 0) {
      customerFolderId = folderSearchResponse.data.files[0].id;
    } else {
      // Erstelle neuen Ordner
      const folderMetadata = {
        name: customerFolderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [GOOGLE_DRIVE_FOLDER_ID]
      };
      
      const folder = await driveService.files.create({
        resource: folderMetadata,
        fields: 'id'
      });
      
      customerFolderId = folder.data.id;
      console.log(`📁 Neuer Kundenordner erstellt: ${customerFolderName}`);
    }

    // Upload Foto zu Google Drive
    const bufferStream = new stream.PassThrough();
    bufferStream.end(file.buffer);

    const fileMetadata = {
      name: `${Date.now()}_${file.originalname}`,
      parents: [customerFolderId]
    };

    const media = {
      mimeType: file.mimetype,
      body: bufferStream
    };

    const uploadResponse = await driveService.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink, webContentLink'
    });

    // Setze Berechtigung für öffentlichen Zugriff
    await driveService.permissions.create({
      fileId: uploadResponse.data.id,
      resource: {
        type: 'anyone',
        role: 'reader'
      }
    });

    console.log(`✅ Foto hochgeladen: ${uploadResponse.data.name}`);

    res.json({
      success: true,
      fileId: uploadResponse.data.id,
      fileName: uploadResponse.data.name,
      webViewLink: uploadResponse.data.webViewLink,
      webContentLink: uploadResponse.data.webContentLink
    });

  } catch (error) {
    console.error('❌ Upload fehlgeschlagen:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Google Drive Fotos abrufen Endpoint
app.get('/api/customer-photos/:customerId', async (req, res) => {
  try {
    if (!driveService) {
      return res.status(503).json({ 
        success: false, 
        error: 'Google Drive Service nicht verfügbar' 
      });
    }

    const { customerId } = req.params;
    
    // Suche Kundenordner
    const folderSearchResponse = await driveService.files.list({
      q: `name contains '${customerId}' and mimeType='application/vnd.google-apps.folder' and '${GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    if (folderSearchResponse.data.files.length === 0) {
      return res.json({ success: true, photos: [] });
    }

    const customerFolderId = folderSearchResponse.data.files[0].id;

    // Liste alle Fotos im Kundenordner
    const photosResponse = await driveService.files.list({
      q: `'${customerFolderId}' in parents and trashed=false and (mimeType contains 'image/')`,
      fields: 'files(id, name, webViewLink, webContentLink, createdTime, size)',
      orderBy: 'createdTime desc'
    });

    const photos = photosResponse.data.files.map(file => ({
      id: file.id,
      name: file.name,
      webViewLink: file.webViewLink,
      webContentLink: file.webContentLink,
      createdTime: file.createdTime,
      size: file.size
    }));

    res.json({ 
      success: true, 
      photos: photos 
    });

  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Fotos:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Google Drive Foto löschen Endpoint
app.delete('/api/delete-photo/:fileId', async (req, res) => {
  try {
    if (!driveService) {
      return res.status(503).json({ 
        success: false, 
        error: 'Google Drive Service nicht verfügbar' 
      });
    }

    const { fileId } = req.params;

    await driveService.files.delete({
      fileId: fileId
    });

    console.log(`🗑️  Foto gelöscht: ${fileId}`);

    res.json({ 
      success: true, 
      message: 'Foto erfolgreich gelöscht' 
    });

  } catch (error) {
    console.error('❌ Fehler beim Löschen:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Google Sheets Create Quote Endpoint
app.post('/api/quotes', async (req, res) => {
  try {
    if (!sheetsService) {
      return res.status(503).json({ 
        success: false, 
        error: 'Google Sheets Service nicht verfügbar' 
      });
    }

    const quote = req.body;

    // Lese aktuelle Quotes um die nächste Zeile zu bestimmen
    const response = await sheetsService.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: 'Quotes!A:N',
    });

    const rows = response.data.values || [];
    const nextRow = rows.length + 1;

    // Erstelle neue Zeile
    const newRow = [
      quote.id || `Q${Date.now()}`,
      quote.customerId || '',
      quote.customerName || '',
      new Date(quote.createdAt).toISOString(),
      (quote.price || 0).toString(),
      quote.status || 'draft',
      quote.comment || '',
      quote.moveDate || '',
      (quote.volume || 0).toString(),
      (quote.distance || 0).toString(),
      quote.fromAddress || '',
      quote.toAddress || '',
      JSON.stringify(quote.items || []),
      JSON.stringify(quote.services || [])
    ];

    // Füge neue Zeile hinzu
    await sheetsService.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: 'Quotes!A:N',
      valueInputOption: 'RAW',
      resource: {
        values: [newRow]
      }
    });

    console.log(`✅ Neue Quote ${quote.id} erstellt`);

    res.json({ 
      success: true, 
      message: 'Quote erfolgreich erstellt',
      quoteId: quote.id
    });

  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Quote:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Google Sheets Update Quote Endpoint
app.put('/api/quotes/:quoteId', async (req, res) => {
  try {
    if (!sheetsService) {
      return res.status(503).json({ 
        success: false, 
        error: 'Google Sheets Service nicht verfügbar' 
      });
    }

    const { quoteId } = req.params;
    const updates = req.body;

    // Lese aktuelle Quotes
    const response = await sheetsService.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: 'Quotes!A:N',
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Keine Quotes gefunden' 
      });
    }

    // Finde die Zeile mit der Quote ID
    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === quoteId) {
        rowIndex = i;
        break;
      }
    }

    if (rowIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Quote nicht gefunden' 
      });
    }

    // Update die Zeile
    const currentRow = rows[rowIndex];
    
    // Map updates to columns
    if (updates.status !== undefined) currentRow[5] = updates.status;
    if (updates.price !== undefined) currentRow[4] = updates.price.toString();
    if (updates.comment !== undefined) currentRow[6] = updates.comment || '';
    if (updates.moveDate !== undefined) currentRow[7] = updates.moveDate || '';
    if (updates.volume !== undefined) currentRow[8] = (updates.volume || 0).toString();
    if (updates.distance !== undefined) currentRow[9] = (updates.distance || 0).toString();
    if (updates.fromAddress !== undefined) currentRow[10] = updates.fromAddress || '';
    if (updates.toAddress !== undefined) currentRow[11] = updates.toAddress || '';
    if (updates.items !== undefined) currentRow[12] = JSON.stringify(updates.items || []);
    if (updates.services !== undefined) currentRow[13] = JSON.stringify(updates.services || []);

    // Schreibe zurück zu Google Sheets
    await sheetsService.spreadsheets.values.update({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: `Quotes!A${rowIndex + 1}:N${rowIndex + 1}`,
      valueInputOption: 'RAW',
      resource: {
        values: [currentRow]
      }
    });

    console.log(`✅ Quote ${quoteId} aktualisiert - Status: ${updates.status}`);

    res.json({ 
      success: true, 
      message: 'Quote erfolgreich aktualisiert' 
    });

  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren der Quote:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// E-Mail senden Endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, content, attachments, bcc } = req.body;
    
    if (!to || !subject || !content) {
      return res.status(400).json({ 
        success: false, 
        error: 'Fehlende Pflichtfelder: to, subject, content' 
      });
    }

    // E-Mail-Optionen vorbereiten
    const mailOptions = {
      from: `Relocato Umzugsservice <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      text: content,
      html: content.replace(/\n/g, '<br>'), // Einfache HTML-Konvertierung
      attachments: []
    };

    // BCC hinzufügen (für Gesendet-Ordner)
    if (bcc) {
      mailOptions.bcc = bcc;
      console.log('📋 BCC an:', bcc);
    }

    // PDF-Anhänge verarbeiten
    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        encoding: 'base64'
      }));
    }

    // E-Mail senden
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ E-Mail gesendet:', {
      messageId: info.messageId,
      to: to,
      subject: subject
    });

    res.json({ 
      success: true, 
      messageId: info.messageId,
      accepted: info.accepted
    });

  } catch (error) {
    console.error('❌ E-Mail Versand fehlgeschlagen:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// PDF-Download Endpoint für iOS-kompatible Downloads
app.post('/api/generate-pdf', async (req, res) => {
  try {
    const { html } = req.body;
    
    if (!html) {
      return res.status(400).json({ 
        success: false, 
        error: 'HTML content ist erforderlich' 
      });
    }

    // PDFShift API konfigurieren
    const PDFSHIFT_API_KEY = 'sk_14a4ecfc1ba71f54456ab30bf80897383eeb714e';
    const PDFSHIFT_API_URL = 'https://api.pdfshift.io/v3/convert/pdf';

    const options = {
      source: html,
      landscape: false,
      use_print: true,
      format: 'A4',
      margin: {
        top: '10mm',
        bottom: '10mm',
        left: '10mm',
        right: '10mm'
      }
    };

    const response = await axios.post(
      PDFSHIFT_API_URL,
      options,
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`api:${PDFSHIFT_API_KEY}`).toString('base64')}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );

    // Korrekte Headers für iOS PDF-Download setzen
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="Umzugsangebot.pdf"',
      'Content-Length': response.data.length,
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.send(Buffer.from(response.data));

  } catch (error) {
    console.error('❌ PDF-Generierung fehlgeschlagen:', error);
    res.status(500).json({ 
      success: false, 
      error: 'PDF-Generierung fehlgeschlagen',
      details: error.message
    });
  }
});

// Test-E-Mail Endpoint
app.post('/api/test-email', async (req, res) => {
  try {
    const testMail = {
      from: `RELOCATO® Test <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: req.body.to || process.env.SMTP_USER,
      subject: 'RELOCATO® Test-E-Mail',
      html: `
        <h2>RELOCATO® E-Mail-System Test</h2>
        <p>Diese Test-E-Mail wurde erfolgreich über IONOS SMTP gesendet!</p>
        <hr>
        <p><strong>Server-Informationen:</strong></p>
        <ul>
          <li>SMTP Host: ${SMTP_CONFIG.host}</li>
          <li>Port: ${SMTP_CONFIG.port}</li>
          <li>Von: ${process.env.SMTP_FROM || process.env.SMTP_USER}</li>
          <li>Zeit: ${new Date().toLocaleString('de-DE')}</li>
        </ul>
        <hr>
        <p>Mit freundlichen Grüßen<br>
        Ihr RELOCATO® Team</p>
      `
    };

    const info = await transporter.sendMail(testMail);
    
    res.json({ 
      success: true, 
      message: 'Test-E-Mail gesendet!',
      info: info
    });

  } catch (error) {
    console.error('❌ Test-E-Mail Fehler:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Fehlerbehandlung
app.use((err, req, res, next) => {
  console.error('Server Fehler:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Interner Serverfehler' 
  });
});

// Server starten
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 RELOCATO® E-Mail-Server läuft auf Port ${PORT}`);
  console.log(`📧 SMTP-Host: ${SMTP_CONFIG.host}`);
  console.log(`👤 SMTP-User: ${SMTP_CONFIG.auth.user || 'NICHT KONFIGURIERT'}`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM empfangen, Server wird heruntergefahren...');
  process.exit(0);
});