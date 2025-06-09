const fs = require('fs');

console.log('📱 Wechsle zurück zur normalen Version...');

// Restore backup files
if (fs.existsSync('src/components/Dashboard.backup.tsx')) {
  fs.copyFileSync('src/components/Dashboard.backup.tsx', 'src/components/Dashboard.tsx');
  console.log('✅ Dashboard.tsx wiederhergestellt');
}

if (fs.existsSync('src/components/Login.backup.tsx')) {
  fs.copyFileSync('src/components/Login.backup.tsx', 'src/components/Login.tsx');
  console.log('✅ Login.tsx wiederhergestellt');
}

if (fs.existsSync('src/components/CustomerSearch.backup.tsx')) {
  fs.copyFileSync('src/components/CustomerSearch.backup.tsx', 'src/components/CustomerSearch.tsx');
  console.log('✅ CustomerSearch.tsx wiederhergestellt');
}

if (fs.existsSync('src/components/CreateQuote.backup.tsx')) {
  fs.copyFileSync('src/components/CreateQuote.backup.tsx', 'src/components/CreateQuote.tsx');
  console.log('✅ CreateQuote.tsx wiederhergestellt');
}

console.log('\n🎉 Normale Version ist jetzt aktiv!');
console.log('\n🔄 Zurück zu responsive: node switch-to-responsive.js');