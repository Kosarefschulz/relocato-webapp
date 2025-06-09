const fs = require('fs');
const path = require('path');

console.log('🔄 Wechsle zu Firebase Authentication...');

// Backup current files
fs.copyFileSync('src/index.tsx', 'src/index.demo.tsx');
fs.copyFileSync('src/App.simple.tsx', 'src/App.demo.tsx');

// Switch to Firebase versions
if (fs.existsSync('src/App.firebase.tsx')) {
  fs.copyFileSync('src/App.firebase.tsx', 'src/App.tsx');
  console.log('✅ App.tsx auf Firebase umgestellt');
}

if (fs.existsSync('src/components/Login.firebase.tsx')) {
  fs.copyFileSync('src/components/Login.firebase.tsx', 'src/components/Login.tsx');
  console.log('✅ Login.tsx auf Firebase umgestellt');
}

if (fs.existsSync('src/components/Dashboard.firebase.tsx')) {
  fs.copyFileSync('src/components/Dashboard.firebase.tsx', 'src/components/Dashboard.tsx');
  console.log('✅ Dashboard.tsx auf Firebase umgestellt');
}

// Update index.tsx to use Firebase App
const indexContent = `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
`;

fs.writeFileSync('src/index.tsx', indexContent);
console.log('✅ index.tsx aktualisiert');

console.log('\n🎉 Firebase Authentication ist jetzt aktiv!');
console.log('\n📋 Nächste Schritte:');
console.log('1. Firebase-Projekt in .env konfigurieren');
console.log('2. Firebase Authentication in Console aktivieren');
console.log('3. Test-Benutzer anlegen');
console.log('4. npm start - App testen');
console.log('\n💡 Zurück zum Demo-Modus: node switch-to-demo.js');