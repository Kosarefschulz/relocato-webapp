const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const multer = require('multer');

const app = express();

// CORS für alle Origins erlauben
app.use(cors({ origin: true }));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Multer für File-Uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

// Google Services
let driveService = null;
let sheetsService = null;

// Google Services initialisieren
async function initGoogleServices() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: functions.config().google?.client_email || process.env.GOOGLE_CLIENT_EMAIL,
        private_key: (functions.config().google?.private_key || process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
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
    return true;
  } catch (error) {
    console.error('❌ Google Services Initialisierung fehlgeschlagen:', error);
    return false;
  }
}

// SMTP Transporter
function createTransporter() {
  return nodemailer.createTransporter({
    host: functions.config().smtp?.host || 'smtp.ionos.de',
    port: parseInt(functions.config().smtp?.port || '587'),
    secure: false,
    auth: {
      user: functions.config().smtp?.user || 'bielefeld@relocato.de',
      pass: functions.config().smtp?.pass || 'Bicm1308'
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false
    }
  });
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend API läuft' });
});

// E-Mail senden
app.post('/api/send-email', async (req, res) => {
  try {
    const transporter = createTransporter();
    const { to, subject, content, attachments } = req.body;
    
    const mailOptions = {
      from: functions.config().smtp?.user || 'bielefeld@relocato.de',
      to,
      subject,
      html: content,
      attachments: attachments?.map(att => ({
        filename: att.filename,
        content: Buffer.from(att.content, 'base64')
      }))
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Quote Status Update
app.put('/api/quotes/:quoteId', async (req, res) => {
  try {
    if (!sheetsService) {
      await initGoogleServices();
    }

    const { quoteId } = req.params;
    const updates = req.body;
    const SHEETS_ID = functions.config().google?.sheets_id || '1F5qtOkOiMMLqzwqe1HoLvNxJLtPZlqt9S0w6D7-aXGg';

    // Lese aktuelle Quotes
    const response = await sheetsService.spreadsheets.values.get({
      spreadsheetId: SHEETS_ID,
      range: 'Quotes!A:N',
    });

    const rows = response.data.values || [];
    let rowIndex = -1;
    
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === quoteId) {
        rowIndex = i;
        break;
      }
    }

    if (rowIndex === -1) {
      return res.status(404).json({ success: false, error: 'Quote nicht gefunden' });
    }

    // Update die Zeile
    const currentRow = rows[rowIndex];
    if (updates.status !== undefined) currentRow[5] = updates.status;
    if (updates.price !== undefined) currentRow[4] = updates.price.toString();
    if (updates.comment !== undefined) currentRow[6] = updates.comment || '';
    if (updates.moveDate !== undefined) currentRow[7] = updates.moveDate || '';
    if (updates.volume !== undefined) currentRow[8] = (updates.volume || 0).toString();
    if (updates.distance !== undefined) currentRow[9] = (updates.distance || 0).toString();

    // Schreibe zurück
    await sheetsService.spreadsheets.values.update({
      spreadsheetId: SHEETS_ID,
      range: `Quotes!A${rowIndex + 1}:N${rowIndex + 1}`,
      valueInputOption: 'RAW',
      resource: { values: [currentRow] }
    });

    res.json({ success: true, message: 'Quote aktualisiert' });
  } catch (error) {
    console.error('Quote update error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// File Upload zu Google Drive
app.post('/api/upload', upload.array('files', 10), async (req, res) => {
  try {
    if (!driveService) {
      await initGoogleServices();
    }

    const { customerId, customerName } = req.body;
    const files = req.files;
    const FOLDER_ID = functions.config().google?.drive_folder_id || '1Q7hSlmX2PXtUiPihcwRB12gXC-pxIhnJ';

    // Erstelle Kundenordner
    const folderMetadata = {
      name: `${customerId}_${customerName}`,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [FOLDER_ID]
    };

    const folder = await driveService.files.create({
      resource: folderMetadata,
      fields: 'id'
    });

    // Lade Dateien hoch
    const uploadedFiles = [];
    for (const file of files) {
      const fileMetadata = {
        name: file.originalname,
        parents: [folder.data.id]
      };

      const media = {
        mimeType: file.mimetype,
        body: require('stream').Readable.from(file.buffer)
      };

      const uploadedFile = await driveService.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, name, webViewLink'
      });

      uploadedFiles.push({
        id: uploadedFile.data.id,
        name: uploadedFile.data.name,
        url: uploadedFile.data.webViewLink
      });
    }

    res.json({ success: true, files: uploadedFiles, folderId: folder.data.id });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Initialisiere Services beim Start
initGoogleServices();

// Exportiere als Firebase Function
exports.backendApi = functions
  .region('europe-west1')
  .runWith({
    timeoutSeconds: 300,
    memory: '1GB'
  })
  .https.onRequest(app);