const fs = require('fs');

console.log('🔄 Wechsle zu Demo-Modus...');

// Switch back to demo versions
if (fs.existsSync('src/App.demo.tsx')) {
  fs.copyFileSync('src/App.demo.tsx', 'src/App.simple.tsx');
  console.log('✅ Demo App wiederhergestellt');
}

// Update index.tsx to use demo App
const indexContent = `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.simple';
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
console.log('✅ index.tsx auf Demo umgestellt');

console.log('\n🎉 Demo-Modus ist jetzt aktiv!');
console.log('\n📋 Features im Demo-Modus:');
console.log('- Login mit beliebigen Daten');
console.log('- Mock-Daten für Kunden/Angebote');
console.log('- Alle UI-Funktionen verfügbar');
console.log('\n💡 Zurück zu Firebase: node switch-to-firebase.js');