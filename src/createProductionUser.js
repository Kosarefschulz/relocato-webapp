// Script to create a new admin user in production
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Firebase configuration (Production)
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

async function createAdminUser() {
  // Try different email addresses
  const accounts = [
    { email: 'admin@ruempel-schmiede.com', password: 'Admin2024!' },
    { email: 'admin@relocato.de', password: 'Admin2024!' },
    { email: 'test@ruempel-schmiede.com', password: 'Test2024!' }
  ];
  
  for (const account of accounts) {
    try {
      console.log(`\n🔄 Trying to create user: ${account.email}`);
      
      // Try to create user
      const userCredential = await createUserWithEmailAndPassword(auth, account.email, account.password);
      const user = userCredential.user;
      
      console.log('✅ User created successfully:', user.email);
      
      // Add user profile to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: 'Admin User',
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
      console.log('\n🎉 SUCCESS! Login credentials:');
      console.log('📧 Email:', account.email);
      console.log('🔐 Password:', account.password);
      console.log('🌐 URL: https://relocato.ruempel-schmiede.com/login');
      
      return; // Exit after successful creation
      
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('ℹ️  User already exists, trying to login...');
        
        try {
          await signInWithEmailAndPassword(auth, account.email, account.password);
          console.log('✅ Login successful!');
          console.log('\n🎉 Use these credentials:');
          console.log('📧 Email:', account.email);
          console.log('🔐 Password:', account.password);
          console.log('🌐 URL: https://relocato.ruempel-schmiede.com/login');
          return;
        } catch (loginError) {
          console.log('❌ Login failed:', loginError.message);
        }
      } else {
        console.log('❌ Error:', error.message);
      }
    }
  }
  
  // If all attempts failed, try with the original account
  console.log('\n🔄 Trying original account...');
  try {
    await signInWithEmailAndPassword(auth, 'bielefeld@relocato.de', 'Bicm1308');
    console.log('✅ Original account works!');
    console.log('\n🎉 Use these credentials:');
    console.log('📧 Email: bielefeld@relocato.de');
    console.log('🔐 Password: Bicm1308');
  } catch (error) {
    console.log('❌ Original account also failed:', error.message);
  }
  
  process.exit(0);
}

createAdminUser();