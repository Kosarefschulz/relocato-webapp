import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, initializeFirestore, persistentLocalCache } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY?.trim(),
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: process.env.REACT_APP_FIREBASE_APP_ID?.trim(),
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID?.trim()
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
let functions: any = null;

if (firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_API_KEY') {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    
    // Initialize Firestore with persistent cache
    db = initializeFirestore(app, {
      localCache: persistentLocalCache()
    });
    
    storage = getStorage(app);
    functions = getFunctions(app, 'europe-west1');

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

export { app, auth, db, storage, functions };
export default app;