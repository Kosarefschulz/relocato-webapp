// Vercel Serverless Function für E-Mail-Suche
// Diese Funktion durchsucht gesyncte E-Mails in Firestore

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

  if (req.method !== 'GET') {
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

    const { query, folder } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Missing search query'
      });
    }

    console.log(`🔍 Searching emails for: ${query}${folder ? ` in folder: ${folder}` : ''}`);

    // Build Firestore query
    let emailsQuery = db.collection('emailClient')
      .where('userId', '==', userId);

    if (folder) {
      emailsQuery = emailsQuery.where('folder', '==', folder);
    }

    // Get all emails for the user
    const snapshot = await emailsQuery.get();
    
    // Search through emails locally
    const searchLower = query.toLowerCase();
    const results = [];

    snapshot.forEach(doc => {
      const email = { id: doc.id, ...doc.data() };
      
      // Search in various fields
      const searchableText = [
        email.subject || '',
        email.from || '',
        email.to || '',
        email.text || '',
        email.html || ''
      ].join(' ').toLowerCase();

      if (searchableText.includes(searchLower)) {
        results.push({
          uid: email.uid,
          folder: email.folder,
          messageId: email.messageId,
          from: email.from,
          to: email.to,
          subject: email.subject,
          date: email.date,
          text: email.text ? email.text.substring(0, 200) + '...' : '',
          isRead: email.isRead,
          isStarred: email.isStarred
        });
      }
    });

    console.log(`✅ Found ${results.length} emails matching query`);

    res.status(200).json({
      success: true,
      results,
      count: results.length
    });
  } catch (error) {
    console.error('Email search error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}