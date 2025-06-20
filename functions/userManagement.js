const admin = require('firebase-admin');

// Initialize Firestore
const db = admin.firestore();

/**
 * Check if a user exists in the users collection
 * @param {string} uid - The user's UID
 * @returns {Promise<boolean>} - True if user exists, false otherwise
 */
async function userExists(uid) {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    return userDoc.exists;
  } catch (error) {
    console.error('Error checking if user exists:', error);
    return false;
  }
}

/**
 * Get user data from Firestore
 * @param {string} uid - The user's UID
 * @returns {Promise<Object|null>} - User data or null if not found
 */
async function getUser(uid) {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

/**
 * Update user's last login timestamp
 * @param {string} uid - The user's UID
 */
async function updateLastLogin(uid) {
  try {
    await db.collection('users').doc(uid).update({
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating last login:', error);
  }
}

/**
 * Check if an email has access based on domain or specific email list
 * @param {string} email - The email to check
 * @returns {boolean} - True if email has access, false otherwise
 */
function checkEmailAccess(email) {
  if (!email) return false;
  
  // Define allowed domains and specific emails
  const allowedDomains = ['relocato.de', 'umzugsapp.de'];
  const allowedEmails = ['admin@example.com', 'test@example.com', 'sergej.schulz92@gmail.com'];
  
  // Check domain
  const emailDomain = email.split('@')[1];
  if (allowedDomains.includes(emailDomain)) {
    return true;
  }
  
  // Check specific emails
  if (allowedEmails.includes(email.toLowerCase())) {
    return true;
  }
  
  return false;
}

/**
 * Grant email access to a user
 * @param {string} uid - The user's UID
 * @param {string} grantedBy - The UID of the admin granting access
 */
async function grantEmailAccess(uid, grantedBy) {
  try {
    await db.collection('users').doc(uid).update({
      emailAccess: true,
      role: 'admin',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: grantedBy,
      emailAccessGrantedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error granting email access:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Revoke email access from a user
 * @param {string} uid - The user's UID
 * @param {string} revokedBy - The UID of the admin revoking access
 */
async function revokeEmailAccess(uid, revokedBy) {
  try {
    await db.collection('users').doc(uid).update({
      emailAccess: false,
      role: 'user',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: revokedBy,
      emailAccessRevokedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error revoking email access:', error);
    return { success: false, error: error.message };
  }
}

/**
 * List all users with optional filters
 * @param {Object} filters - Filters for the query
 * @returns {Promise<Array>} - Array of user objects
 */
async function listUsers(filters = {}) {
  try {
    let query = db.collection('users');
    
    // Apply filters
    if (filters.emailAccess !== undefined) {
      query = query.where('emailAccess', '==', filters.emailAccess);
    }
    
    if (filters.role) {
      query = query.where('role', '==', filters.role);
    }
    
    if (filters.isActive !== undefined) {
      query = query.where('isActive', '==', filters.isActive);
    }
    
    // Order by creation date
    query = query.orderBy('createdAt', 'desc');
    
    const snapshot = await query.get();
    const users = [];
    
    snapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });
    
    return users;
  } catch (error) {
    console.error('Error listing users:', error);
    return [];
  }
}

/**
 * Ensure a user document exists (useful for migration or manual creation)
 * @param {Object} userData - User data to create/update
 */
async function ensureUserDocument(userData) {
  try {
    const { uid, email, displayName, photoURL } = userData;
    
    if (!uid) {
      throw new Error('UID is required');
    }
    
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      // Create new user document
      const hasEmailAccess = checkEmailAccess(email);
      
      await userRef.set({
        uid,
        email: email || null,
        displayName: displayName || null,
        photoURL: photoURL || null,
        emailAccess: hasEmailAccess,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
        authProvider: 'manual',
        isActive: true,
        role: hasEmailAccess ? 'admin' : 'user'
      });
      
      console.log('Created new user document:', uid);
    } else {
      // Update existing user document
      await userRef.update({
        email: email || userDoc.data().email,
        displayName: displayName || userDoc.data().displayName,
        photoURL: photoURL || userDoc.data().photoURL,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('Updated existing user document:', uid);
    }
    
    return { success: true, uid };
  } catch (error) {
    console.error('Error ensuring user document:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  userExists,
  getUser,
  updateLastLogin,
  checkEmailAccess,
  grantEmailAccess,
  revokeEmailAccess,
  listUsers,
  ensureUserDocument
};