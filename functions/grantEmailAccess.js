const admin = require('firebase-admin');

// Initialize admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function grantEmailAccess(email) {
  try {
    // Find user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Grant email access
    await db.collection('users').doc(userRecord.uid).set({
      email: email,
      emailAccess: true,
      grantedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log(`✅ Email access granted to: ${email} (UID: ${userRecord.uid})`);
  } catch (error) {
    console.error(`❌ Error granting access to ${email}:`, error.message);
  }
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.log('Usage: node grantEmailAccess.js <email>');
  console.log('Example: node grantEmailAccess.js admin@relocato.de');
  process.exit(1);
}

// Grant access
grantEmailAccess(email).then(() => process.exit(0));