const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { parseEmail } = require('./emailParser');
const { showEmails } = require('./showEmails');
const { scheduledEmailCheck } = require('./scheduledEmailCheck');
const { backendApi } = require('./backendApi');
const { importAllEmails } = require('./importAllEmails');
const { importAllCustomers } = require('./importAllCustomers');
const { processFollowUps, triggerFollowUpProcessor } = require('./followUpProcessor');
const { scheduledCustomerImport, triggerCustomerImport } = require('./automaticEmailImporter');
const { retryFailedImports } = require('./retryFailedImports');
const { handleWebhook } = require('./webhookHandlerSimple');
const { getEmailsWithStatus } = require('./getEmailsWithStatus');
const { previewEmailData } = require('./previewEmailData');
const { importSingleEmail } = require('./importSingleEmail');
const { syncEmailsForClient, getEmailFolders, sendEmailFromClient } = require('./emailClientSync');
const { addTestEmails, clearTestEmails } = require('./addTestEmails');

// Firebase Admin initialisieren - nur wenn noch nicht initialisiert
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Exportiere andere Funktionen
exports.showEmails = showEmails;
// TEMPORARILY DISABLED FOR CLEANUP
// exports.scheduledEmailCheck = scheduledEmailCheck;
exports.backendApi = backendApi;
exports.importAllEmails = importAllEmails;
exports.importAllCustomers = importAllCustomers;
exports.processFollowUps = processFollowUps;
exports.triggerFollowUpProcessor = triggerFollowUpProcessor;
// TEMPORARILY DISABLED FOR CLEANUP
// exports.scheduledCustomerImport = scheduledCustomerImport;
exports.triggerCustomerImport = triggerCustomerImport;
exports.retryFailedImports = retryFailedImports;
exports.handleWebhook = handleWebhook;
exports.getEmailsWithStatus = getEmailsWithStatus;
exports.previewEmailData = previewEmailData;
exports.importSingleEmail = importSingleEmail;
// Disabled to prevent duplicate email storage
// exports.syncEmailsForClient = syncEmailsForClient;
// exports.getEmailFolders = getEmailFolders;
// exports.sendEmailFromClient = sendEmailFromClient;
exports.addTestEmails = addTestEmails;
exports.clearTestEmails = clearTestEmails;

/**
 * Firebase Auth Trigger: Creates user document when new user signs up
 * This function triggers when a user is created through any auth method (Google, Email, etc.)
 * and automatically creates a corresponding document in the users collection
 */
exports.createUserDocument = functions
  .region('europe-west1')
  .auth.user()
  .onCreate(async (user) => {
    console.log('🆕 New user created:', user.uid, user.email);
    
    try {
      // Define allowed email domains and specific email addresses
      const allowedDomains = ['relocato.de', 'umzugsapp.de'];
      const allowedEmails = ['admin@example.com', 'test@example.com', 'sergej.schulz92@gmail.com']; // Add specific allowed emails here
      
      // Check if user email has access
      let hasEmailAccess = false;
      
      if (user.email) {
        // Check if email matches allowed domains
        const emailDomain = user.email.split('@')[1];
        if (allowedDomains.includes(emailDomain)) {
          hasEmailAccess = true;
        }
        
        // Check if email is in allowed emails list
        if (allowedEmails.includes(user.email.toLowerCase())) {
          hasEmailAccess = true;
        }
      }
      
      // Create user document data
      const userData = {
        uid: user.uid,
        email: user.email || null,
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
        emailAccess: hasEmailAccess,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
        authProvider: user.providerData?.[0]?.providerId || 'unknown',
        isActive: true,
        role: hasEmailAccess ? 'admin' : 'user' // Assign admin role if has email access
      };
      
      // Save to Firestore users collection with UID as document ID
      await db.collection('users').doc(user.uid).set(userData);
      
      console.log('✅ User document created successfully:', {
        uid: user.uid,
        email: user.email,
        emailAccess: hasEmailAccess
      });
      
      // Optional: Send welcome email for new users
      if (user.email && hasEmailAccess) {
        await db.collection('emailHistory').add({
          to: user.email,
          subject: 'Willkommen bei Relocato Admin',
          content: `Hallo ${user.displayName || 'Admin'},\n\nIhr Account wurde erfolgreich erstellt und Sie haben Zugriff auf die E-Mail-Funktionen.\n\nBeste Grüße,\nRelocato Team`,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'pending',
          source: 'auth-trigger',
          userId: user.uid
        });
      }
      
    } catch (error) {
      console.error('❌ Error creating user document:', error);
      
      // Log error for debugging
      await db.collection('errors').add({
        type: 'user-creation-error',
        userId: user.uid,
        email: user.email,
        error: error.message,
        stack: error.stack,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });

/**
 * HTTP Trigger: Manually grant or revoke email access for a user
 * This can be called by admins to update user permissions
 */
exports.updateUserEmailAccess = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    // Check if the caller is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to call this function'
      );
    }
    
    // Check if the caller has admin privileges
    const callerDoc = await db.collection('users').doc(context.auth.uid).get();
    const callerData = callerDoc.data();
    
    if (!callerData || callerData.role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admins can update user email access'
      );
    }
    
    // Validate input
    const { userId, emailAccess } = data;
    
    if (!userId || typeof emailAccess !== 'boolean') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'userId and emailAccess (boolean) are required'
      );
    }
    
    try {
      // Update user document
      await db.collection('users').doc(userId).update({
        emailAccess: emailAccess,
        role: emailAccess ? 'admin' : 'user',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: context.auth.uid
      });
      
      console.log(`✅ Updated email access for user ${userId} to ${emailAccess}`);
      
      return {
        success: true,
        userId: userId,
        emailAccess: emailAccess
      };
      
    } catch (error) {
      console.error('❌ Error updating email access:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to update user email access'
      );
    }
  });

/**
 * HTTP Trigger: Create user document for existing authenticated users
 * This is useful for migration or when users signed up before this function was deployed
 */
exports.createUserDocumentManually = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    // Check if the caller is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to call this function'
      );
    }
    
    const { ensureUserDocument } = require('./userManagement');
    
    try {
      // Get current user data from auth context
      const userData = {
        uid: context.auth.uid,
        email: context.auth.token.email || null,
        displayName: context.auth.token.name || null,
        photoURL: context.auth.token.picture || null
      };
      
      // Ensure user document exists
      const result = await ensureUserDocument(userData);
      
      if (result.success) {
        console.log('✅ User document created/updated manually:', context.auth.uid);
        return {
          success: true,
          message: 'User document created/updated successfully',
          uid: context.auth.uid
        };
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error('❌ Error creating user document manually:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to create user document'
      );
    }
  });

/**
 * HTTP Trigger: List all users (admin only)
 */
exports.listUsers = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    // Check if the caller is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to call this function'
      );
    }
    
    // Check if the caller has admin privileges
    const callerDoc = await db.collection('users').doc(context.auth.uid).get();
    const callerData = callerDoc.data();
    
    if (!callerData || callerData.role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admins can list users'
      );
    }
    
    const { listUsers } = require('./userManagement');
    
    try {
      // Get filters from request data
      const filters = data.filters || {};
      const users = await listUsers(filters);
      
      return {
        success: true,
        users: users,
        count: users.length
      };
      
    } catch (error) {
      console.error('❌ Error listing users:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to list users'
      );
    }
  });

/**
 * Test-Version: Verarbeitet die letzten 50 E-Mails aus einem Ordner
 */
exports.checkEmails = functions
  .region('europe-west1')
  .https.onRequest(async (req, res) => {
    // CORS Header setzen
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    // Preflight request handling
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    
    console.log('📧 Starte E-Mail-Prüfung (Test-Modus)...');
    
    // Parameter aus der URL
    const folder = req.query.folder || 'INBOX'; // Standard: INBOX, kann aber z.B. "Anfragen" sein
    const limit = parseInt(req.query.limit) || 50; // Standard: 50 E-Mails
    const testMode = req.query.test === 'true'; // Test-Modus: verarbeitet auch alte E-Mails
    
    console.log(`📂 Prüfe Ordner: ${folder}`);
    console.log(`📊 Limit: ${limit} E-Mails`);
    console.log(`🧪 Test-Modus: ${testMode ? 'AN' : 'AUS'}`);
    
    try {
      const processedEmails = await checkIONOSInbox(folder, limit, testMode, req);
      console.log(`✅ ${processedEmails} E-Mails erfolgreich verarbeitet`);
      
      res.json({
        success: true,
        processed: processedEmails,
        folder: folder,
        limit: limit,
        testMode: testMode,
        message: `${processedEmails} E-Mails verarbeitet`
      });
    } catch (error) {
      console.error('❌ Fehler bei E-Mail-Prüfung:', error);
      
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

/**
 * IMAP Verbindung zu IONOS und E-Mail-Verarbeitung
 */
async function checkIONOSInbox(folderName, maxEmails, testMode, req) {
  // E-Mail Konfiguration
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
  let processedCount = 0;
  
  return new Promise((resolve, reject) => {
    // Verbindung hergestellt
    imap.once('ready', () => {
      console.log('✅ Mit IONOS verbunden');
      
      // Erst alle Ordner auflisten
      imap.getBoxes((err, boxes) => {
        if (err) {
          console.error('Fehler beim Abrufen der Ordner:', err);
        } else {
          console.log('📁 Verfügbare Ordner:');
          logBoxes(boxes);
        }
        
        // Dann den gewünschten Ordner öffnen
        imap.openBox(folderName, false, async (err, box) => {
          if (err) {
            console.error(`❌ Konnte Ordner "${folderName}" nicht öffnen:`, err);
            
            // Versuche INBOX als Fallback
            if (folderName !== 'INBOX') {
              console.log('📂 Versuche INBOX als Fallback...');
              imap.openBox('INBOX', false, async (err2, box2) => {
                if (err2) {
                  reject(err2);
                  return;
                }
                processFolder(box2, 'INBOX');
              });
              return;
            }
            
            reject(err);
            return;
          }
          
          processFolder(box, folderName);
        });
      });
      
      async function processFolder(box, currentFolder) {
        console.log(`📬 ${box.messages.total} E-Mails im Ordner "${currentFolder}"`);
        
        if (box.messages.total === 0) {
          imap.end();
          resolve(0);
          return;
        }
        
        // Suche E-Mails
        let searchCriteria;
        if (testMode) {
          // Test-Modus: ALLE E-Mails (für Debugging)
          const allEmails = req.query.all === 'true';
          if (allEmails) {
            console.log('🎯 Test-Modus: ALLE E-Mails');
            searchCriteria = ['ALL']; // Alle E-Mails
          } else {
            // Im Test-Modus: Suche nach allen E-Mails im Ordner ohne FROM-Filter
            // Da die E-Mails in "erfolgreich verarbeitete Anfragen" liegen,
            // könnten sie von anderen Absendern kommen
            console.log('🎯 Test-Modus: Alle E-Mails ohne Absender-Filter');
            searchCriteria = ['ALL'];
          }
        } else {
          // Normal-Modus: Nur ungelesene von heute
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          searchCriteria = [
            'UNSEEN',
            ['SINCE', today],
            ['OR',
              ['OR',
                ['FROM', 'immoscout24'],
                ['FROM', 'immobilienscout24']
              ],
              ['OR',
                ['FROM', 'umzug365'],
                ['FROM', 'umzug-365']
              ]
            ]
          ];
        }
        
        imap.search(searchCriteria, async (err, results) => {
          if (err) {
            reject(err);
            return;
          }
          
          console.log(`📨 ${results.length} relevante E-Mails gefunden`);
          
          if (results.length === 0) {
            imap.end();
            resolve(0);
            return;
          }
          
          // Begrenze auf maxEmails
          const emailsToProcess = results.slice(-maxEmails); // Nimm die neuesten
          console.log(`📧 Verarbeite ${emailsToProcess.length} E-Mails (von ${results.length} gefunden)`);
          
          // Lade E-Mails
          const fetch = imap.fetch(emailsToProcess, { 
            bodies: '',
            markSeen: !testMode // Im Test-Modus nicht als gelesen markieren
          });
          
          // Verarbeite jede E-Mail
          fetch.on('message', (msg, seqno) => {
            console.log(`📧 Verarbeite E-Mail #${seqno}`);
            
            msg.on('body', (stream, info) => {
              simpleParser(stream, async (err, parsed) => {
                if (err) {
                  console.error('Parse error:', err);
                  return;
                }
                
                try {
                  console.log(`📬 E-Mail von: ${parsed.from?.text}`);
                  console.log(`📬 Betreff: ${parsed.subject}`);
                  console.log(`📅 Datum: ${parsed.date}`);
                  
                  // Parse E-Mail-Inhalt
                  const emailData = {
                    from: parsed.from?.text || '',
                    to: parsed.to?.text || '',
                    subject: parsed.subject || '',
                    text: parsed.text || '',
                    html: parsed.html || '',
                    date: parsed.date || new Date()
                  };
                  
                  // Extrahiere Kundendaten
                  const customer = parseEmail(emailData);
                  
                  // Debug-Ausgabe
                  console.log('📋 Extrahierte Kundendaten:', JSON.stringify(customer, null, 2));
                  
                  // Validierung
                  if (!customer.name || customer.name === 'Unbekannt') {
                    console.warn('⚠️ Kein Name gefunden, überspringe E-Mail');
                    // Speichere trotzdem in failedEmails für Debug
                    await db.collection('failedEmails').add({
                      from: parsed.from?.text,
                      subject: parsed.subject,
                      date: parsed.date,
                      reason: 'Kein Name gefunden',
                      extractedData: customer,
                      // Don't store full email content
                      headers: {
                        contentType: parsed.headers?.get('content-type'),
                        messageId: parsed.messageId
                      },
                      timestamp: admin.firestore.FieldValue.serverTimestamp(),
                      folder: currentFolder
                    });
                    return;
                  }
                  
                  // Im Test-Modus: Füge Test-Prefix hinzu
                  if (testMode) {
                    customer.name = `[TEST] ${customer.name}`;
                    customer.notes = `TEST-IMPORT vom ${new Date().toLocaleDateString('de-DE')}. ${customer.notes || ''}`;
                  }
                  
                  // Prüfe ob Kunde schon existiert (basierend auf E-Mail)
                  if (customer.email) {
                    const existingCustomer = await checkExistingCustomer(customer.email);
                    if (existingCustomer && !testMode) {
                      console.log(`⚠️ Kunde existiert bereits: ${existingCustomer.customerNumber}`);
                      
                      // Erstelle trotzdem neues Angebot für existierenden Kunden
                      await createAutomaticQuote({
                        ...customer,
                        id: existingCustomer.id,
                        customerNumber: existingCustomer.customerNumber
                      });
                      
                      processedCount++;
                      return;
                    }
                  }
                  
                  // Generiere neue Kundennummer
                  customer.customerNumber = await generateCustomerNumber();
                  customer.id = customer.customerNumber;
                  
                  // Speichere in Firestore
                  await db.collection('customers').doc(customer.id).set({
                    ...customer,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    isTestImport: testMode
                  });
                  
                  console.log(`✅ Neuer Kunde angelegt: ${customer.customerNumber} - ${customer.name}`);
                  
                  // Erstelle automatisches Angebot
                  const quote = await createAutomaticQuote(customer);
                  console.log(`✅ Angebot erstellt: ${quote.id}`);
                  
                  // Im Test-Modus keine Willkommens-E-Mail senden
                  if (!testMode && customer.email) {
                    await sendWelcomeEmail(customer, quote);
                  }
                  
                  processedCount++;
                  
                } catch (error) {
                  console.error('❌ Fehler bei Verarbeitung:', error);
                  
                  // Speichere fehlgeschlagene E-Mail zur manuellen Prüfung
                  await db.collection('failedEmails').add({
                    from: parsed.from?.text,
                    subject: parsed.subject,
                    date: parsed.date,
                    // Don't store email text content
                    error: error.message,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    folder: currentFolder
                  });
                }
              });
            });
          });
          
          // Alle E-Mails verarbeitet
          fetch.once('end', () => {
            console.log('✅ Alle E-Mails verarbeitet');
            imap.end();
            resolve(processedCount);
          });
        });
      }
    });
    
    // Fehlerbehandlung
    imap.once('error', (err) => {
      console.error('❌ IMAP Fehler:', err);
      reject(err);
    });
    
    // Verbindung beendet
    imap.once('end', () => {
      console.log('📪 IMAP Verbindung geschlossen');
    });
    
    // Verbindung herstellen
    console.log('🔌 Verbinde mit IONOS...');
    imap.connect();
  });
}

/**
 * Hilfsfunktion zum Anzeigen der Ordnerstruktur
 */
function logBoxes(boxes, prefix = '') {
  for (const boxName in boxes) {
    console.log(`${prefix}📁 ${boxName}`);
    if (boxes[boxName].children) {
      logBoxes(boxes[boxName].children, prefix + '  ');
    }
  }
}

/**
 * Prüft ob ein Kunde bereits existiert
 */
async function checkExistingCustomer(email) {
  const snapshot = await db.collection('customers')
    .where('email', '==', email)
    .limit(1)
    .get();
  
  if (!snapshot.empty) {
    return snapshot.docs[0].data();
  }
  
  return null;
}

/**
 * Generiert eine eindeutige Kundennummer
 */
async function generateCustomerNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  // Hole den Counter für diesen Monat
  const counterRef = db.collection('counters').doc(`customers_${year}_${month}`);
  
  const newNumber = await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(counterRef);
    
    let counter = 1;
    if (doc.exists) {
      counter = (doc.data().value || 0) + 1;
    }
    
    transaction.set(counterRef, { value: counter });
    
    return `K${year}${month}${String(counter).padStart(3, '0')}`;
  });
  
  return newNumber;
}

/**
 * Erstellt automatisch ein Angebot
 */
async function createAutomaticQuote(customer) {
  // Basis-Preisberechnung
  const basePrice = 450; // Grundpreis
  const pricePerRoom = 150; // Pro Zimmer
  const pricePerSqm = 8; // Pro m²
  const pricePerFloor = 50; // Pro Etage ohne Aufzug
  
  let price = basePrice;
  
  // Berechne basierend auf Zimmern
  if (customer.apartment?.rooms) {
    price += customer.apartment.rooms * pricePerRoom;
  }
  
  // Berechne basierend auf Fläche
  if (customer.apartment?.area) {
    price += customer.apartment.area * pricePerSqm;
  }
  
  // Etagen-Zuschlag
  if (customer.apartment?.floor > 0 && !customer.apartment?.hasElevator) {
    price += customer.apartment.floor * pricePerFloor;
  }
  
  // Volumen-Schätzung
  const volumePerRoom = 12; // m³ pro Zimmer
  const volume = (customer.apartment?.rooms || 3) * volumePerRoom;
  
  // Generiere Angebots-ID
  const quoteId = `Q${Date.now()}_${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  
  const quote = {
    id: quoteId,
    customerId: customer.id,
    customerName: customer.name,
    price: Math.round(price),
    status: 'draft',
    comment: `Automatisch erstelltes Angebot basierend auf ${customer.source} Anfrage.\n\nKunde: ${customer.name}\nUmzugstermin: ${customer.moveDate || 'Noch offen'}\nVon: ${customer.fromAddress}\nNach: ${customer.toAddress}`,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'email-parser',
    volume: volume,
    distance: 25, // Standard, kann später berechnet werden
    moveDate: customer.moveDate,
    fromAddress: customer.fromAddress,
    toAddress: customer.toAddress,
    services: ['Umzug', 'Be- und Entladung'],
    items: [
      { name: 'Umzugsservice', quantity: 1, price: basePrice },
      { name: `${customer.apartment?.rooms || 3} Zimmer`, quantity: customer.apartment?.rooms || 3, price: pricePerRoom },
      { name: `${customer.apartment?.area || 0} m²`, quantity: customer.apartment?.area || 0, price: pricePerSqm }
    ]
  };
  
  // Speichere Angebot
  await db.collection('quotes').doc(quoteId).set(quote);
  
  return quote;
}

/**
 * Sendet Willkommens-E-Mail
 */
async function sendWelcomeEmail(customer, quote) {
  // E-Mail-Daten für Historie
  const emailData = {
    to: customer.email,
    subject: 'Ihre Umzugsanfrage bei Relocato - Angebot folgt in Kürze',
    content: `
Sehr geehrte/r ${customer.name},

vielen Dank für Ihre Umzugsanfrage! Wir haben Ihre Daten erhalten und arbeiten bereits an Ihrem persönlichen Angebot.

IHRE ANFRAGE-DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Kundennummer: ${customer.customerNumber}
• Umzugstermin: ${customer.moveDate || 'Noch offen'}
• Von: ${customer.fromAddress}
• Nach: ${customer.toAddress}
• Wohnfläche: ${customer.apartment?.area || 'Nicht angegeben'} m²
• Zimmer: ${customer.apartment?.rooms || 'Nicht angegeben'}

VORLÄUFIGE PREISSCHÄTZUNG:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Geschätzter Preis: ab ${quote.price} € (inkl. MwSt.)

WAS PASSIERT ALS NÄCHSTES?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Wir prüfen Ihre Anfrage im Detail
2. Sie erhalten innerhalb von 24 Stunden ein verbindliches Angebot
3. Optional: Kostenlose Vor-Ort-Besichtigung

Bei Fragen erreichen Sie uns unter:
📞 Telefon: 0521 1200551-0
📧 E-Mail: info@relocato.de

Mit freundlichen Grüßen
Ihr Relocato Team

--
RELOCATO® Umzugsservice
Detmolder Str. 234a
33605 Bielefeld
www.relocato.de
    `,
    customerId: customer.id,
    customerName: customer.name,
    templateType: 'welcome_auto',
    quoteId: quote.id
  };
  
  // Speichere in E-Mail-Historie
  await db.collection('emailHistory').add({
    ...emailData,
    sentAt: admin.firestore.FieldValue.serverTimestamp(),
    status: 'pending', // Wird auf 'sent' gesetzt wenn tatsächlich versendet
    source: 'email-parser'
  });
  
  console.log(`📧 Willkommens-E-Mail vorbereitet für: ${customer.email}`);
}

// Import automatic email importer functions (they export themselves)
require('./automaticEmailImporter');

// Email sync functions
const { emailSync, emailSyncV2 } = require('./emailSync');
exports.emailSync = emailSync;
exports.emailSyncV2 = emailSyncV2;

// Mock email function for demo
const { emailMock } = require('./emailMockData');
exports.emailMock = emailMock;

// Real email sync function
const { emailSyncReal } = require('./emailSyncReal');
exports.emailSyncReal = emailSyncReal;


// Scheduled email sync to Firestore - DISABLED to prevent duplicate email storage
// const { scheduledEmailSync, triggerEmailSync, cleanupOldEmails } = require('./scheduledEmailSync');
// exports.scheduledEmailSync = scheduledEmailSync;
// exports.cleanupOldEmails = cleanupOldEmails;

// Professional Email Client Functions
const emailProfessional = require('./emailProfessional');
exports.getEmailFolders = emailProfessional.getEmailFolders;
exports.getEmails = emailProfessional.getEmails;
exports.getEmail = emailProfessional.getEmail;
exports.sendEmail = emailProfessional.sendEmail;
exports.deleteEmail = emailProfessional.deleteEmail;
exports.moveEmail = emailProfessional.moveEmail;
exports.markAsRead = emailProfessional.markAsRead;
exports.markAsUnread = emailProfessional.markAsUnread;
exports.searchEmails = emailProfessional.searchEmails;
exports.syncEmailsPeriodically = emailProfessional.syncEmailsPeriodically;
exports.triggerEmailSync = emailProfessional.triggerEmailSync;

// Email Data Cleanup Functions
const { cleanupEmailData, getEmailDataStats } = require('./cleanupEmailData');
exports.cleanupEmailData = cleanupEmailData;
exports.getEmailDataStats = getEmailDataStats;

// Delete All Customers Function (WARNING: Dangerous!)
const { deleteAllCustomers } = require('./deleteAllCustomers');
exports.deleteAllCustomers = deleteAllCustomers;

// Import 300 Customers Function
const { import300Customers } = require('./import300Customers');
exports.import300Customers = import300Customers;

// Import Recent Customers Function
const { importRecentCustomers } = require('./importRecentCustomers');
exports.importRecentCustomers = importRecentCustomers;

// Import from Google Sheets Function
const { importFromGoogleSheets } = require('./importFromGoogleSheets');
exports.importFromGoogleSheets = importFromGoogleSheets;

// Scheduled Google Sheets Import
const { scheduledSheetsImport, triggerSheetsImport } = require('./scheduledSheetsImport');
exports.scheduledSheetsImport = scheduledSheetsImport;
exports.triggerSheetsImport = triggerSheetsImport;

// Calendar Import Functions
const { importFromCalendarCSV } = require('./importFromCalendarCSV');
exports.importFromCalendarCSV = importFromCalendarCSV;

const { importFromICS } = require('./importFromICS');
exports.importFromICS = importFromICS;

const { importICSToCalendar } = require('./importICSToCalendar');
exports.importICSToCalendar = importICSToCalendar;