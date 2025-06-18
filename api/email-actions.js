// Vercel Serverless Function für E-Mail-Aktionen
// Diese Funktion behandelt verschiedene E-Mail-Aktionen wie markieren, verschieben, löschen

import Imap from 'imap';
import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authentication
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - missing or invalid authorization header'
    });
  }

  try {
    // Verify the ID token
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const { action, emailId, targetFolder, isRead } = req.body;

    if (!action || !emailId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: action, emailId'
      });
    }

    let result;
    switch (action) {
      case 'markAsRead':
        result = await markEmailAsRead(emailId, isRead !== false, userId);
        break;
      case 'move':
        if (!targetFolder) {
          return res.status(400).json({
            success: false,
            error: 'Missing targetFolder for move action'
          });
        }
        result = await moveEmail(emailId, targetFolder, userId);
        break;
      case 'delete':
        result = await deleteEmail(emailId, userId);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: `Unknown action: ${action}`
        });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Email action error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

/**
 * Mark email as read/unread in IMAP and Firestore
 */
async function markEmailAsRead(emailId, isRead, userId) {
  try {
    // Update in Firestore
    const emailRef = db.collection('emailClient').doc(emailId);
    await emailRef.update({
      isRead,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // TODO: Also update in IMAP server
    // This would require fetching the email's UID and folder from Firestore
    // then connecting to IMAP and updating the flags

    return {
      success: true,
      message: `Email marked as ${isRead ? 'read' : 'unread'}`
    };
  } catch (error) {
    throw new Error(`Failed to mark email: ${error.message}`);
  }
}

/**
 * Move email to another folder
 */
async function moveEmail(emailId, targetFolder, userId) {
  try {
    // Update in Firestore
    const emailRef = db.collection('emailClient').doc(emailId);
    await emailRef.update({
      folder: targetFolder,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // TODO: Also move in IMAP server
    // This would require fetching the email's UID and current folder from Firestore
    // then connecting to IMAP and moving the message

    return {
      success: true,
      message: `Email moved to ${targetFolder}`
    };
  } catch (error) {
    throw new Error(`Failed to move email: ${error.message}`);
  }
}

/**
 * Delete email (move to Trash)
 */
async function deleteEmail(emailId, userId) {
  try {
    // Move to Trash folder
    return await moveEmail(emailId, 'Trash', userId);
  } catch (error) {
    throw new Error(`Failed to delete email: ${error.message}`);
  }
}