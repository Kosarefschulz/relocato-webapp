// Script to create a test user
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDCeOBZw96klWFkolRQMnhr5DG4Ol2eMjY",
  authDomain: "umzugsapp.firebaseapp.com",
  projectId: "umzugsapp",
  storageBucket: "umzugsapp.firebasestorage.app",
  messagingSenderId: "130199132038",
  appId: "1:130199132038:web:3be72ffeb2b1f55be93e07"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createTestUser() {
  const email = 'test@relocato.de';
  const password = 'Test123!';
  
  try {
    // Create user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('✅ User created successfully:', user.email);
    
    // Add user profile to Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      displayName: 'Test User',
      role: 'admin',
      createdAt: new Date().toISOString(),
      permissions: {
        canCreateQuotes: true,
        canViewAllCustomers: true,
        canEditSettings: true,
        canManageUsers: true
      }
    });
    
    console.log('✅ User profile created in Firestore');
    console.log('\n📧 Login credentials:');
    console.log('Email:', email);
    console.log('Password:', password);
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️  User already exists');
      console.log('\n📧 Try logging in with:');
      console.log('Email:', email);
      console.log('Password:', password);
    } else {
      console.error('Error creating user:', error.message);
    }
  }
  
  process.exit(0);
}

createTestUser();