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

// Firebase is disabled - app now uses Supabase only
console.log('⚠️ Firebase disabled - app is now Supabase-only');

// Firebase services are disabled
let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;
let functions: any = null;

// All Firebase services are intentionally disabled
console.log('ℹ️ All Firebase services are disabled. App uses Supabase for all data operations.');

// Auth-Persistenz Promise für App.tsx
export const authPersistencePromise = Promise.resolve();

export { app, auth, db, storage, functions };
export default app;