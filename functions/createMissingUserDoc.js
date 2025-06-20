const admin = require('firebase-admin');

// Initialize admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function createUserDocumentForEmail(email) {
  try {
    // Get user from Firebase Auth
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log(`Found user: ${userRecord.email} (UID: ${userRecord.uid})`);
    
    // Check if document already exists
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    
    if (userDoc.exists) {
      console.log('User document already exists. Updating emailAccess...');
      // Update existing document
      await db.collection('users').doc(userRecord.uid).update({
        emailAccess: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      console.log('Creating new user document...');
      // Create new document
      await db.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName || email.split('@')[0],
        photoURL: userRecord.photoURL || null,
        emailAccess: true,
        role: 'admin', // Since it's your email
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        authProvider: userRecord.providerData[0]?.providerId || 'google.com',
        isActive: true
      });
    }
    
    console.log(`✅ User document created/updated successfully!`);
    console.log(`📧 Email access granted to: ${email}`);
    console.log(`🔑 User ID: ${userRecord.uid}`);
    console.log('\nYou can now use the email client at: https://umzugsapp.firebaseapp.com/email');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'auth/user-not-found') {
      console.log('\n💡 Tip: Make sure you have logged in at least once with this email address.');
    }
  }
}

// Run for your email
createUserDocumentForEmail('Sergej.Schulz92@gmail.com')
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });