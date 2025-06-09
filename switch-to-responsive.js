const fs = require('fs');

console.log('📱 Wechsle zu responsivem Design...');

// Backup current files
if (fs.existsSync('src/components/Dashboard.tsx')) {
  fs.copyFileSync('src/components/Dashboard.tsx', 'src/components/Dashboard.backup.tsx');
}
if (fs.existsSync('src/components/Login.tsx')) {
  fs.copyFileSync('src/components/Login.tsx', 'src/components/Login.backup.tsx');
}
if (fs.existsSync('src/components/CustomerSearch.tsx')) {
  fs.copyFileSync('src/components/CustomerSearch.tsx', 'src/components/CustomerSearch.backup.tsx');
}
if (fs.existsSync('src/components/CreateQuote.tsx')) {
  fs.copyFileSync('src/components/CreateQuote.tsx', 'src/components/CreateQuote.backup.tsx');
}

// Switch to responsive versions
if (fs.existsSync('src/components/Dashboard.responsive.tsx')) {
  fs.copyFileSync('src/components/Dashboard.responsive.tsx', 'src/components/Dashboard.tsx');
  console.log('✅ Dashboard.tsx auf responsive umgestellt');
}

if (fs.existsSync('src/components/Login.responsive.tsx')) {
  fs.copyFileSync('src/components/Login.responsive.tsx', 'src/components/Login.tsx');
  console.log('✅ Login.tsx auf responsive umgestellt');
}

if (fs.existsSync('src/components/CustomerSearch.responsive.tsx')) {
  fs.copyFileSync('src/components/CustomerSearch.responsive.tsx', 'src/components/CustomerSearch.tsx');
  console.log('✅ CustomerSearch.tsx auf responsive umgestellt');
}

if (fs.existsSync('src/components/CreateQuote.responsive.tsx')) {
  fs.copyFileSync('src/components/CreateQuote.responsive.tsx', 'src/components/CreateQuote.tsx');
  console.log('✅ CreateQuote.tsx auf responsive umgestellt');
}

// Update App to use responsive theme
const appContent = `import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import responsiveTheme from './styles/theme';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CustomerSearch from './components/CustomerSearch';
import CreateQuote from './components/CreateQuote';
import NewCustomer from './components/NewCustomer';
import QuotesList from './components/QuotesList';
import CustomersList from './components/CustomersList';

export const AuthContext = React.createContext<{
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}>({
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = () => setIsAuthenticated(true);
  const logout = () => setIsAuthenticated(false);

  return (
    <ThemeProvider theme={responsiveTheme}>
      <CssBaseline />
      <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
        <Router>
          <Routes>
            <Route 
              path="/login" 
              element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} 
            />
            <Route 
              path="/dashboard" 
              element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/search-customer" 
              element={isAuthenticated ? <CustomerSearch /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/create-quote" 
              element={isAuthenticated ? <CreateQuote /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/new-customer" 
              element={isAuthenticated ? <NewCustomer /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/quotes" 
              element={isAuthenticated ? <QuotesList /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/customers" 
              element={isAuthenticated ? <CustomersList /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/" 
              element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} 
            />
          </Routes>
        </Router>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}

export default App;
`;

fs.writeFileSync('src/App.simple.tsx', appContent);
console.log('✅ App.simple.tsx mit responsivem Theme aktualisiert');

console.log('\n🎉 Responsive Design ist jetzt aktiv!');
console.log('\n📱 Neue Features:');
console.log('- Touch-optimierte Buttons (min. 48px)');
console.log('- Mobile-First Layout');
console.log('- Responsive Typography');
console.log('- Touch-freundliche Navigation');
console.log('- Mobile AppBar und FABs');
console.log('- Optimierte Formulare für iOS/Android');
console.log('\n💡 Tipp: Teste die App im Browser Dev-Tools mit verschiedenen Geräten!');
console.log('\n🔄 Zurück zur normalen Version: node switch-to-normal.js');