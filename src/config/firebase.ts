import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

console.log('Firebase Config:', {
  apiKey: firebaseConfig.apiKey ? 'SET' : 'MISSING',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId ? 'SET' : 'MISSING'
});

// Firebase erst initialisieren wenn alle Env-Variablen vorhanden sind
let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;

if (firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_API_KEY') {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

    // Auth-Persistenz sofort nach Initialisierung setzen
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log('✅ Auth-Persistenz aktiviert');
      })
      .catch((error) => {
        console.error('❌ Fehler beim Setzen der Auth-Persistenz:', error);
      });
  } catch (error) {
    console.error('❌ Firebase Initialisierung fehlgeschlagen:', error);
    console.log('⚠️ App läuft ohne Firebase weiter');
  }
} else {
  console.warn('⚠️ Firebase nicht konfiguriert - bitte .env.local vervollständigen');
}

// Auth-Persistenz Promise für App.tsx
export const authPersistencePromise = Promise.resolve();

export { app, auth, db, storage };
export default app;