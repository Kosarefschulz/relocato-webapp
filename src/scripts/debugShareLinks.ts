import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, query, where, Timestamp } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function listAllShareLinks() {
  console.log('🔍 Lade alle ShareLinks aus Firebase...\n');
  
  try {
    const shareLinksCollection = collection(db, 'shareLinks');
    const snapshot = await getDocs(shareLinksCollection);
    
    console.log(`📊 Gefunden: ${snapshot.size} ShareLinks\n`);
    
    let index = 0;
    snapshot.forEach((doc) => {
      index++;
      const data = doc.data();
      console.log(`\n--- ShareLink ${index} ---`);
      console.log(`ID: ${doc.id}`);
      console.log(`Token: ${data.token}`);
      console.log(`Customer ID: ${data.customerId}`);
      console.log(`Quote ID: ${data.quoteId}`);
      console.log(`Created By: ${data.createdBy || 'N/A'}`);
      console.log(`Created At: ${data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt}`);
      console.log(`Expires At: ${data.expiresAt?.toDate ? data.expiresAt.toDate() : data.expiresAt}`);
      console.log(`Has Arbeitsschein: ${!!data.arbeitsscheinHTML}`);
      console.log(`Used At: ${data.usedAt?.toDate ? data.usedAt.toDate() : 'Not used yet'}`);
    });
  } catch (error) {
    console.error('❌ Fehler beim Laden der ShareLinks:', error);
  }
}

async function findShareLinkByToken(token: string) {
  console.log(`\n🔍 Suche ShareLink mit Token: ${token}\n`);
  
  try {
    const shareLinksCollection = collection(db, 'shareLinks');
    const q = query(shareLinksCollection, where('token', '==', token));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('❌ Kein ShareLink mit diesem Token gefunden');
    } else {
      console.log('✅ ShareLink gefunden:');
      const doc = snapshot.docs[0];
      const data = doc.data();
      console.log(`ID: ${doc.id}`);
      console.log(`Customer ID: ${data.customerId}`);
      console.log(`Quote ID: ${data.quoteId}`);
      console.log(`Expires At: ${data.expiresAt?.toDate ? data.expiresAt.toDate() : data.expiresAt}`);
    }
  } catch (error) {
    console.error('❌ Fehler bei der Suche:', error);
  }
}

async function createTestShareLink() {
  console.log('\n🔧 Erstelle Test-ShareLink...\n');
  
  try {
    const shareLinksCollection = collection(db, 'shareLinks');
    
    // Generate test token
    const token = `TEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const testData = {
      customerId: 'TEST_CUSTOMER_123',
      quoteId: 'TEST_QUOTE_456',
      token: token,
      expiresAt: Timestamp.fromDate(expiresAt),
      createdAt: Timestamp.now(),
      createdBy: 'debug-script',
      arbeitsscheinHTML: '<h1>Test Arbeitsschein</h1>',
      arbeitsscheinData: JSON.stringify({ test: true })
    };
    
    const docRef = await addDoc(shareLinksCollection, testData);
    
    console.log('✅ Test-ShareLink erstellt:');
    console.log(`Document ID: ${docRef.id}`);
    console.log(`Token: ${token}`);
    console.log(`Test-URL: http://localhost:3000/share/${token}`);
  } catch (error) {
    console.error('❌ Fehler beim Erstellen des Test-ShareLinks:', error);
  }
}

async function deleteExpiredShareLinks() {
  console.log('\n🗑️  Lösche abgelaufene ShareLinks...\n');
  
  try {
    const shareLinksCollection = collection(db, 'shareLinks');
    const now = new Date();
    const q = query(shareLinksCollection, where('expiresAt', '<', Timestamp.fromDate(now)));
    const snapshot = await getDocs(q);
    
    console.log(`📊 Gefunden: ${snapshot.size} abgelaufene ShareLinks`);
    
    // Note: Actual deletion is commented out for safety
    // Uncomment the following lines to actually delete expired links
    /*
    const deletions = snapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletions);
    console.log(`✅ ${snapshot.size} abgelaufene ShareLinks gelöscht`);
    */
    
    console.log('ℹ️  Löschung ist deaktiviert. Entkommentieren Sie den Code zum Aktivieren.');
  } catch (error) {
    console.error('❌ Fehler beim Löschen:', error);
  }
}

// Main execution
async function main() {
  console.log('=== ShareLink Debug Tool ===\n');
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'list':
      await listAllShareLinks();
      break;
    case 'find':
      const token = args[1];
      if (!token) {
        console.error('❌ Bitte Token angeben: npm run debug:sharelinks find <token>');
      } else {
        await findShareLinkByToken(token);
      }
      break;
    case 'create-test':
      await createTestShareLink();
      break;
    case 'clean':
      await deleteExpiredShareLinks();
      break;
    default:
      console.log('Verfügbare Befehle:');
      console.log('  npm run debug:sharelinks list         - Alle ShareLinks anzeigen');
      console.log('  npm run debug:sharelinks find <token> - ShareLink mit Token suchen');
      console.log('  npm run debug:sharelinks create-test  - Test-ShareLink erstellen');
      console.log('  npm run debug:sharelinks clean        - Abgelaufene ShareLinks anzeigen');
  }
  
  process.exit(0);
}

main().catch(console.error);