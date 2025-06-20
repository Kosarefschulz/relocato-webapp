/**
 * Test-Skript für die Email Client Funktionen
 * 
 * Verwendung:
 * 1. Firebase Functions lokal starten: npm run serve
 * 2. In einem anderen Terminal: node testEmailClient.js
 */

const fetch = require('node-fetch');

// Basis-URL für lokale Firebase Functions
const BASE_URL = 'http://localhost:5001/umzugsapp/europe-west1';

// Für Production:
// const BASE_URL = 'https://europe-west1-umzugsapp.cloudfunctions.net';

async function addTestEmails() {
  console.log('Adding test emails...');
  try {
    const response = await fetch(`${BASE_URL}/addTestEmails`);
    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

async function clearTestEmails() {
  console.log('Clearing test emails...');
  try {
    const response = await fetch(`${BASE_URL}/clearTestEmails`);
    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Führe die gewünschte Aktion aus
const action = process.argv[2];

if (action === 'add') {
  addTestEmails();
} else if (action === 'clear') {
  clearTestEmails();
} else {
  console.log('Usage: node testEmailClient.js [add|clear]');
  console.log('  add   - Add test emails to Firestore');
  console.log('  clear - Clear all test emails from Firestore');
}