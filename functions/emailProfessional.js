const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const cors = require('cors')({ origin: true });

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();
const auth = admin.auth();

// Email configuration from environment variables or functions config
const EMAIL_CONFIG = {
  user: functions.config().email?.user || process.env.EMAIL_USER || 'bielefeld@relocato.de',
  pass: functions.config().email?.pass || process.env.EMAIL_PASS || 'Bicm1308',
  imapHost: 'imap.ionos.de',
  imapPort: 993,
  smtpHost: 'smtp.ionos.de',
  smtpPort: 587
};

/**
 * Create SMTP transporter
 */
function createSMTPTransporter() {
  return nodemailer.createTransport({
    host: EMAIL_CONFIG.smtpHost,
    port: EMAIL_CONFIG.smtpPort,
    secure: false,
    auth: {
      user: EMAIL_CONFIG.user,
      pass: EMAIL_CONFIG.pass
    }
  });
}

/**
 * Middleware to check authentication
 */
async function checkAuth(context) {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  // Check if user has email access permissions
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!userDoc.exists || !userDoc.data().emailAccess) {
    throw new functions.https.HttpsError('permission-denied', 'User does not have email access');
  }
  
  return userDoc.data();
}

/**
 * Get folders from IMAP
 */
exports.getEmailFolders = functions
  .region('europe-west3')
  .https.onCall(async (data, context) => {
    await checkAuth(context);
    
    return new Promise((resolve, reject) => {
      const folders = [];
      
      const imap = new Imap({
        user: EMAIL_CONFIG.user,
        password: EMAIL_CONFIG.pass,
        host: EMAIL_CONFIG.imapHost,
        port: EMAIL_CONFIG.imapPort,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        connTimeout: 30000,
        authTimeout: 30000
      });
      
      imap.once('ready', () => {
        imap.getBoxes((err, boxes) => {
          if (err) {
            console.error('Error getting folders:', err);
            imap.end();
            reject(new functions.https.HttpsError('internal', 'Failed to get folders'));
            return;
          }
          
          // Parse folder structure
          const parseFolders = (obj, parent = '') => {
            for (const [name, box] of Object.entries(obj)) {
              if (typeof box === 'object' && box !== null && name !== 'attribs') {
                const fullPath = parent ? `${parent}${box.delimiter || '/'}${name}` : name;
                folders.push({
                  name: name,
                  path: fullPath,
                  attributes: box.attribs || [],
                  delimiter: box.delimiter || '/',
                  hasChildren: !!(box.children && Object.keys(box.children).length > 0)
                });
                
                if (box.children) {
                  parseFolders(box.children, fullPath);
                }
              }
            }
          };
          
          parseFolders(boxes);
          imap.end();
        });
      });
      
      imap.once('error', (err) => {
        console.error('IMAP error:', err);
        reject(new functions.https.HttpsError('internal', err.message));
      });
      
      imap.once('end', () => {
        resolve({ folders });
      });
      
      imap.connect();
    });
  });

/**
 * Get emails from a folder
 */
exports.getEmails = functions
  .region('europe-west3')
  .runWith({ timeoutSeconds: 300 })
  .https.onCall(async (data, context) => {
    await checkAuth(context);
    
    const {
      folder = 'INBOX',
      page = 1,
      limit = 50,
      search,
      sortBy = 'date',
      sortOrder = 'desc'
    } = data;
    
    return new Promise((resolve, reject) => {
      const emails = [];
      
      const imap = new Imap({
        user: EMAIL_CONFIG.user,
        password: EMAIL_CONFIG.pass,
        host: EMAIL_CONFIG.imapHost,
        port: EMAIL_CONFIG.imapPort,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        connTimeout: 30000,
        authTimeout: 30000
      });
      
      imap.once('ready', () => {
        imap.openBox(folder, true, async (err, box) => {
          if (err) {
            console.error('Error opening folder:', err);
            imap.end();
            reject(new functions.https.HttpsError('internal', 'Failed to open folder'));
            return;
          }
          
          const totalMessages = box.messages.total;
          if (totalMessages === 0) {
            imap.end();
            resolve({
              emails: [],
              total: 0,
              page,
              limit,
              folder
            });
            return;
          }
          
          // Calculate range for pagination
          const start = Math.max(1, totalMessages - (page * limit) + 1);
          const end = Math.max(1, totalMessages - ((page - 1) * limit));
          
          // Build search criteria if provided
          let searchCriteria = ['ALL'];
          if (search) {
            searchCriteria = [
              ['OR',
                ['SUBJECT', search],
                ['OR',
                  ['FROM', search],
                  ['TO', search]
                ]
              ]
            ];
          }
          
          imap.search(searchCriteria, (err, results) => {
            if (err) {
              console.error('Search error:', err);
              imap.end();
              reject(new functions.https.HttpsError('internal', 'Search failed'));
              return;
            }
            
            if (results.length === 0) {
              imap.end();
              resolve({
                emails: [],
                total: 0,
                page,
                limit,
                folder
              });
              return;
            }
            
            // Apply pagination to search results
            const sortedResults = sortOrder === 'desc' ? results.reverse() : results;
            const paginatedResults = sortedResults.slice((page - 1) * limit, page * limit);
            
            const fetch = imap.fetch(paginatedResults, {
              bodies: '',
              envelope: true,
              struct: true
            });
            
            fetch.on('message', (msg, seqno) => {
              const emailData = {
                uid: seqno,
                folder: folder
              };
              
              msg.on('body', (stream) => {
                simpleParser(stream, async (err, parsed) => {
                  if (err) {
                    console.error('Parse error:', err);
                    return;
                  }
                  
                  emailData.messageId = parsed.messageId;
                  emailData.from = parsed.from?.text || '';
                  emailData.to = parsed.to?.text || '';
                  emailData.cc = parsed.cc?.text || '';
                  emailData.bcc = parsed.bcc?.text || '';
                  emailData.subject = parsed.subject || '(Kein Betreff)';
                  emailData.date = parsed.date || new Date();
                  emailData.text = parsed.text || '';
                  emailData.html = parsed.html || parsed.textAsHtml || '';
                  emailData.attachments = parsed.attachments?.map(att => ({
                    filename: att.filename,
                    contentType: att.contentType,
                    size: att.size,
                    contentId: att.contentId
                  })) || [];
                  emailData.inReplyTo = parsed.inReplyTo;
                  emailData.references = parsed.references;
                  
                  emails.push(emailData);
                });
              });
              
              msg.once('attributes', (attrs) => {
                emailData.flags = attrs.flags;
                emailData.uid = attrs.uid;
                emailData.modseq = attrs.modseq;
              });
            });
            
            fetch.once('error', (err) => {
              console.error('Fetch error:', err);
              reject(new functions.https.HttpsError('internal', 'Fetch failed'));
            });
            
            fetch.once('end', () => {
              // Sort emails by date
              emails.sort((a, b) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
              });
              
              imap.end();
              
              resolve({
                emails,
                total: results.length,
                page,
                limit,
                folder
              });
            });
          });
        });
      });
      
      imap.once('error', (err) => {
        console.error('IMAP error:', err);
        reject(new functions.https.HttpsError('internal', err.message));
      });
      
      imap.connect();
    });
  });

/**
 * Get single email by ID
 */
exports.getEmail = functions
  .region('europe-west3')
  .https.onCall(async (data, context) => {
    await checkAuth(context);
    
    const { id, folder = 'INBOX' } = data;
    
    if (!id) {
      throw new functions.https.HttpsError('invalid-argument', 'Email ID is required');
    }
    
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: EMAIL_CONFIG.user,
        password: EMAIL_CONFIG.pass,
        host: EMAIL_CONFIG.imapHost,
        port: EMAIL_CONFIG.imapPort,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
      });
      
      imap.once('ready', () => {
        imap.openBox(folder, true, (err, box) => {
          if (err) {
            imap.end();
            reject(new functions.https.HttpsError('internal', 'Failed to open folder'));
            return;
          }
          
          const fetch = imap.fetch([id], {
            bodies: '',
            envelope: true,
            struct: true
          });
          
          let emailData = null;
          
          fetch.on('message', (msg, seqno) => {
            emailData = {
              uid: seqno,
              folder: folder
            };
            
            msg.on('body', (stream) => {
              simpleParser(stream, async (err, parsed) => {
                if (err) {
                  console.error('Parse error:', err);
                  return;
                }
                
                emailData.messageId = parsed.messageId;
                emailData.from = parsed.from?.text || '';
                emailData.to = parsed.to?.text || '';
                emailData.cc = parsed.cc?.text || '';
                emailData.bcc = parsed.bcc?.text || '';
                emailData.subject = parsed.subject || '(Kein Betreff)';
                emailData.date = parsed.date || new Date();
                emailData.text = parsed.text || '';
                emailData.html = parsed.html || parsed.textAsHtml || '';
                emailData.attachments = parsed.attachments?.map(att => ({
                  filename: att.filename,
                  contentType: att.contentType,
                  size: att.size,
                  content: att.content, // Include content for single email
                  contentId: att.contentId
                })) || [];
                emailData.inReplyTo = parsed.inReplyTo;
                emailData.references = parsed.references;
                emailData.headers = Object.fromEntries(parsed.headers);
              });
            });
            
            msg.once('attributes', (attrs) => {
              emailData.flags = attrs.flags;
              emailData.uid = attrs.uid;
            });
          });
          
          fetch.once('error', (err) => {
            console.error('Fetch error:', err);
            reject(new functions.https.HttpsError('internal', 'Fetch failed'));
          });
          
          fetch.once('end', () => {
            imap.end();
            
            if (!emailData) {
              reject(new functions.https.HttpsError('not-found', 'Email not found'));
            } else {
              resolve(emailData);
            }
          });
        });
      });
      
      imap.once('error', (err) => {
        console.error('IMAP error:', err);
        reject(new functions.https.HttpsError('internal', err.message));
      });
      
      imap.connect();
    });
  });

/**
 * Send email via SMTP
 */
exports.sendEmail = functions
  .region('europe-west3')
  .https.onCall(async (data, context) => {
    const user = await checkAuth(context);
    
    const {
      to,
      cc,
      bcc,
      subject,
      text,
      html,
      replyTo,
      inReplyTo,
      references,
      priority,
      attachments = []
    } = data;
    
    if (!to || !subject || (!text && !html)) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }
    
    try {
      const transporter = createSMTPTransporter();
      
      const mailOptions = {
        from: `"${user.displayName || 'Relocato'}" <${EMAIL_CONFIG.user}>`,
        to,
        cc,
        bcc,
        subject,
        text,
        html,
        replyTo: replyTo || EMAIL_CONFIG.user,
        inReplyTo,
        references,
        priority,
        attachments: attachments.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
          encoding: 'base64'
        }))
      };
      
      const info = await transporter.sendMail(mailOptions);
      
      // Store sent email in Firestore for history
      await db.collection('emailHistory').add({
        messageId: info.messageId,
        from: mailOptions.from,
        to,
        cc,
        bcc,
        subject,
        text,
        html,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        userId: context.auth.uid,
        status: 'sent',
        folder: 'Sent'
      });
      
      // Also store in emailClient collection for immediate access
      await db.collection('emailClient').add({
        messageId: info.messageId,
        from: mailOptions.from,
        to,
        cc,
        bcc,
        subject,
        text,
        html,
        date: new Date(),
        folder: 'Sent',
        flags: ['\\Seen'],
        userId: context.auth.uid
      });
      
      return {
        success: true,
        messageId: info.messageId,
        response: info.response
      };
    } catch (error) {
      console.error('Send email error:', error);
      throw new functions.https.HttpsError('internal', 'Failed to send email');
    }
  });

/**
 * Delete email
 */
exports.deleteEmail = functions
  .region('europe-west3')
  .https.onCall(async (data, context) => {
    await checkAuth(context);
    
    const { id, folder = 'INBOX' } = data;
    
    if (!id) {
      throw new functions.https.HttpsError('invalid-argument', 'Email ID is required');
    }
    
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: EMAIL_CONFIG.user,
        password: EMAIL_CONFIG.pass,
        host: EMAIL_CONFIG.imapHost,
        port: EMAIL_CONFIG.imapPort,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
      });
      
      imap.once('ready', () => {
        imap.openBox(folder, false, (err, box) => {
          if (err) {
            imap.end();
            reject(new functions.https.HttpsError('internal', 'Failed to open folder'));
            return;
          }
          
          imap.addFlags([id], '\\Deleted', (err) => {
            if (err) {
              imap.end();
              reject(new functions.https.HttpsError('internal', 'Failed to mark for deletion'));
              return;
            }
            
            imap.expunge((err) => {
              if (err) {
                console.error('Expunge error:', err);
              }
              
              imap.end();
              resolve({ success: true });
            });
          });
        });
      });
      
      imap.once('error', (err) => {
        console.error('IMAP error:', err);
        reject(new functions.https.HttpsError('internal', err.message));
      });
      
      imap.connect();
    });
  });

/**
 * Move email to another folder
 */
exports.moveEmail = functions
  .region('europe-west3')
  .https.onCall(async (data, context) => {
    await checkAuth(context);
    
    const { id, sourceFolder, targetFolder } = data;
    
    if (!id || !sourceFolder || !targetFolder) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }
    
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: EMAIL_CONFIG.user,
        password: EMAIL_CONFIG.pass,
        host: EMAIL_CONFIG.imapHost,
        port: EMAIL_CONFIG.imapPort,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
      });
      
      imap.once('ready', () => {
        imap.openBox(sourceFolder, false, (err, box) => {
          if (err) {
            imap.end();
            reject(new functions.https.HttpsError('internal', 'Failed to open source folder'));
            return;
          }
          
          imap.move([id], targetFolder, (err) => {
            if (err) {
              imap.end();
              reject(new functions.https.HttpsError('internal', 'Failed to move email'));
              return;
            }
            
            imap.end();
            resolve({ success: true });
          });
        });
      });
      
      imap.once('error', (err) => {
        console.error('IMAP error:', err);
        reject(new functions.https.HttpsError('internal', err.message));
      });
      
      imap.connect();
    });
  });

/**
 * Mark email as read
 */
exports.markAsRead = functions
  .region('europe-west3')
  .https.onCall(async (data, context) => {
    await checkAuth(context);
    
    const { id, folder = 'INBOX' } = data;
    
    if (!id) {
      throw new functions.https.HttpsError('invalid-argument', 'Email ID is required');
    }
    
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: EMAIL_CONFIG.user,
        password: EMAIL_CONFIG.pass,
        host: EMAIL_CONFIG.imapHost,
        port: EMAIL_CONFIG.imapPort,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
      });
      
      imap.once('ready', () => {
        imap.openBox(folder, false, (err, box) => {
          if (err) {
            imap.end();
            reject(new functions.https.HttpsError('internal', 'Failed to open folder'));
            return;
          }
          
          imap.addFlags([id], '\\Seen', (err) => {
            if (err) {
              imap.end();
              reject(new functions.https.HttpsError('internal', 'Failed to mark as read'));
              return;
            }
            
            imap.end();
            resolve({ success: true });
          });
        });
      });
      
      imap.once('error', (err) => {
        console.error('IMAP error:', err);
        reject(new functions.https.HttpsError('internal', err.message));
      });
      
      imap.connect();
    });
  });

/**
 * Mark email as unread
 */
exports.markAsUnread = functions
  .region('europe-west3')
  .https.onCall(async (data, context) => {
    await checkAuth(context);
    
    const { id, folder = 'INBOX' } = data;
    
    if (!id) {
      throw new functions.https.HttpsError('invalid-argument', 'Email ID is required');
    }
    
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: EMAIL_CONFIG.user,
        password: EMAIL_CONFIG.pass,
        host: EMAIL_CONFIG.imapHost,
        port: EMAIL_CONFIG.imapPort,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
      });
      
      imap.once('ready', () => {
        imap.openBox(folder, false, (err, box) => {
          if (err) {
            imap.end();
            reject(new functions.https.HttpsError('internal', 'Failed to open folder'));
            return;
          }
          
          imap.delFlags([id], '\\Seen', (err) => {
            if (err) {
              imap.end();
              reject(new functions.https.HttpsError('internal', 'Failed to mark as unread'));
              return;
            }
            
            imap.end();
            resolve({ success: true });
          });
        });
      });
      
      imap.once('error', (err) => {
        console.error('IMAP error:', err);
        reject(new functions.https.HttpsError('internal', err.message));
      });
      
      imap.connect();
    });
  });

/**
 * Search emails
 */
exports.searchEmails = functions
  .region('europe-west3')
  .runWith({ timeoutSeconds: 300 })
  .https.onCall(async (data, context) => {
    await checkAuth(context);
    
    const { query, folder = 'ALL', from, to, subject, dateFrom, dateTo } = data;
    
    return new Promise((resolve, reject) => {
      const emails = [];
      const foldersToSearch = folder === 'ALL' ? ['INBOX', 'Sent', 'Drafts', 'Trash'] : [folder];
      let processedFolders = 0;
      
      const searchFolder = (folderName) => {
        const imap = new Imap({
          user: EMAIL_CONFIG.user,
          password: EMAIL_CONFIG.pass,
          host: EMAIL_CONFIG.imapHost,
          port: EMAIL_CONFIG.imapPort,
          tls: true,
          tlsOptions: { rejectUnauthorized: false }
        });
        
        imap.once('ready', () => {
          imap.openBox(folderName, true, (err, box) => {
            if (err) {
              console.error(`Error opening ${folderName}:`, err);
              imap.end();
              processedFolders++;
              if (processedFolders === foldersToSearch.length) {
                resolve({ emails });
              }
              return;
            }
            
            // Build search criteria
            let criteria = [];
            if (query) criteria.push(['TEXT', query]);
            if (from) criteria.push(['FROM', from]);
            if (to) criteria.push(['TO', to]);
            if (subject) criteria.push(['SUBJECT', subject]);
            if (dateFrom) criteria.push(['SINCE', new Date(dateFrom)]);
            if (dateTo) criteria.push(['BEFORE', new Date(dateTo)]);
            
            if (criteria.length === 0) {
              criteria = ['ALL'];
            }
            
            imap.search(criteria.length === 1 ? criteria[0] : ['AND', ...criteria], (err, results) => {
              if (err) {
                console.error('Search error:', err);
                imap.end();
                processedFolders++;
                if (processedFolders === foldersToSearch.length) {
                  resolve({ emails });
                }
                return;
              }
              
              if (results.length === 0) {
                imap.end();
                processedFolders++;
                if (processedFolders === foldersToSearch.length) {
                  resolve({ emails });
                }
                return;
              }
              
              const fetch = imap.fetch(results.slice(0, 100), { // Limit to 100 results per folder
                bodies: '',
                envelope: true
              });
              
              fetch.on('message', (msg, seqno) => {
                const emailData = {
                  uid: seqno,
                  folder: folderName
                };
                
                msg.on('body', (stream) => {
                  simpleParser(stream, async (err, parsed) => {
                    if (err) {
                      console.error('Parse error:', err);
                      return;
                    }
                    
                    emailData.messageId = parsed.messageId;
                    emailData.from = parsed.from?.text || '';
                    emailData.to = parsed.to?.text || '';
                    emailData.subject = parsed.subject || '(Kein Betreff)';
                    emailData.date = parsed.date || new Date();
                    emailData.text = (parsed.text || '').substring(0, 200) + '...';
                    
                    emails.push(emailData);
                  });
                });
                
                msg.once('attributes', (attrs) => {
                  emailData.flags = attrs.flags;
                });
              });
              
              fetch.once('end', () => {
                imap.end();
                processedFolders++;
                if (processedFolders === foldersToSearch.length) {
                  // Sort by date descending
                  emails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                  resolve({ emails });
                }
              });
            });
          });
        });
        
        imap.once('error', (err) => {
          console.error('IMAP error:', err);
          processedFolders++;
          if (processedFolders === foldersToSearch.length) {
            resolve({ emails });
          }
        });
        
        imap.connect();
      };
      
      // Search each folder
      foldersToSearch.forEach(searchFolder);
    });
  });

/**
 * Sync emails periodically (can be triggered by Cloud Scheduler)
 */
exports.syncEmailsPeriodically = functions
  .region('europe-west3')
  .runWith({ timeoutSeconds: 540 })
  .pubsub.schedule('every 15 minutes')
  .onRun(async (context) => {
    console.log('Starting periodic email sync...');
    
    try {
      // Sync INBOX
      await syncFolderToFirestore('INBOX', 100);
      
      // Sync Sent
      await syncFolderToFirestore('Sent', 50);
      
      console.log('Email sync completed successfully');
    } catch (error) {
      console.error('Email sync failed:', error);
    }
  });

/**
 * Helper function to sync a folder to Firestore
 */
async function syncFolderToFirestore(folder, limit) {
  return new Promise((resolve, reject) => {
    const emails = [];
    
    const imap = new Imap({
      user: EMAIL_CONFIG.user,
      password: EMAIL_CONFIG.pass,
      host: EMAIL_CONFIG.imapHost,
      port: EMAIL_CONFIG.imapPort,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });
    
    imap.once('ready', () => {
      imap.openBox(folder, true, async (err, box) => {
        if (err) {
          imap.end();
          reject(err);
          return;
        }
        
        if (box.messages.total === 0) {
          imap.end();
          resolve();
          return;
        }
        
        // Get the most recent emails
        const start = Math.max(1, box.messages.total - limit + 1);
        const fetch = imap.seq.fetch(`${start}:*`, {
          bodies: 'HEADER',
          envelope: true
        });
        
        fetch.on('message', (msg, seqno) => {
          const emailData = {
            uid: seqno,
            folder: folder
          };
          
          msg.on('body', (stream, info) => {
            let buffer = '';
            stream.on('data', (chunk) => {
              buffer += chunk.toString('utf8');
            });
            stream.once('end', () => {
              const headers = Imap.parseHeader(buffer);
              emailData.messageId = headers['message-id']?.[0];
              emailData.from = headers.from?.[0];
              emailData.to = headers.to?.[0];
              emailData.subject = headers.subject?.[0] || '(Kein Betreff)';
              emailData.date = headers.date?.[0] ? new Date(headers.date[0]) : new Date();
            });
          });
          
          msg.once('attributes', (attrs) => {
            emailData.flags = attrs.flags;
            emailData.uid = attrs.uid;
          });
          
          msg.once('end', () => {
            emails.push(emailData);
          });
        });
        
        fetch.once('end', async () => {
          imap.end();
          
          // Store emails in Firestore
          const batch = db.batch();
          const emailsRef = db.collection('emailClient');
          
          for (const email of emails) {
            if (email.messageId) {
              const docRef = emailsRef.doc(`${folder}_${email.uid}`);
              batch.set(docRef, {
                ...email,
                syncedAt: admin.firestore.FieldValue.serverTimestamp()
              }, { merge: true });
            }
          }
          
          await batch.commit();
          console.log(`Synced ${emails.length} emails from ${folder}`);
          resolve();
        });
      });
    });
    
    imap.once('error', (err) => {
      console.error('IMAP error:', err);
      reject(err);
    });
    
    imap.connect();
  });
}

/**
 * Manual trigger for email sync
 */
exports.triggerEmailSync = functions
  .region('europe-west3')
  .https.onCall(async (data, context) => {
    await checkAuth(context);
    
    const { folders = ['INBOX', 'Sent'] } = data;
    
    try {
      for (const folder of folders) {
        await syncFolderToFirestore(folder, 100);
      }
      
      return { success: true, message: 'Sync completed' };
    } catch (error) {
      console.error('Sync error:', error);
      throw new functions.https.HttpsError('internal', 'Sync failed');
    }
  });