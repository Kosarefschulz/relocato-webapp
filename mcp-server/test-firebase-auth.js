import admin from 'firebase-admin';
import { readFileSync } from 'fs';

console.log('Testing Firebase Authentication...');

try {
  // Load service account
  const serviceAccount = JSON.parse(
    readFileSync('/Users/sergejschulz/Desktop/main/umzugs-webapp/serviceAccountKey.json', 'utf8')
  );
  
  console.log('Service Account loaded successfully');
  console.log('Project ID:', serviceAccount.project_id);
  console.log('Client Email:', serviceAccount.client_email);
  
  // Initialize Firebase Admin
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  console.log('Firebase Admin initialized');
  
  // Test Firestore connection
  const db = admin.firestore();
  console.log('Firestore instance created');
  
  // Try to read from a collection
  const testRead = await db.collection('customers').limit(1).get();
  console.log('Successfully connected to Firestore!');
  console.log('Test read returned', testRead.size, 'documents');
  
  // Test write permission
  const testDoc = {
    test: true,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    message: 'MCP Server connection test'
  };
  
  const writeResult = await db.collection('test').add(testDoc);
  console.log('Test write successful, document ID:', writeResult.id);
  
  // Clean up test document
  await writeResult.delete();
  console.log('Test document cleaned up');
  
  console.log('\n✅ All tests passed! Firebase authentication is working correctly.');
  
} catch (error) {
  console.error('\n❌ Firebase authentication failed:');
  console.error('Error type:', error.code);
  console.error('Error message:', error.message);
  console.error('Full error:', error);
}

process.exit(0);