// Script to reset password for production user
const { initializeApp } = require('firebase/app');
const { getAuth, sendPasswordResetEmail } = require('firebase/auth');

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

async function resetPassword() {
  const email = 'bielefeld@relocato.de';
  
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('✅ Password reset email sent to:', email);
    console.log('📧 Check your email inbox for the reset link');
    console.log('\nIf you don\'t receive the email:');
    console.log('1. Check your spam folder');
    console.log('2. Make sure the email address is correct');
    console.log('3. Try again in a few minutes');
  } catch (error) {
    console.error('Error:', error.message);
    if (error.code === 'auth/user-not-found') {
      console.log('\n❌ User not found. The account might not exist.');
      console.log('Try creating a new account instead.');
    }
  }
  
  process.exit(0);
}

resetPassword();