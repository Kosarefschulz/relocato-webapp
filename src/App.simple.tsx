import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { modernTheme } from './styles/modernTheme';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CustomerSearch from './components/CustomerSearch';
import CreateQuote from './components/CreateQuote';
import NewCustomer from './components/NewCustomer';
import QuotesList from './components/QuotesList';
import CustomersList from './components/CustomersList';
import InvoicesList from './components/InvoicesList';
import GoogleSheetsTest from './components/GoogleSheetsTest';
import CustomerDetails from './components/CustomerDetails';

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
    <ThemeProvider theme={modernTheme}>
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
              path="/customer/:customerId" 
              element={isAuthenticated ? <CustomerDetails /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/invoices" 
              element={isAuthenticated ? <InvoicesList /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/test" 
              element={isAuthenticated ? <GoogleSheetsTest /> : <Navigate to="/login" />} 
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