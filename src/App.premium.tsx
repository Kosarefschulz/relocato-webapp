import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';

import Dashboard from './components/Dashboard';
import CustomerSearch from './components/CustomerSearch';
import CreateQuote from './components/CreateQuote';
import NewCustomer from './components/NewCustomer';
import QuotesList from './components/QuotesList';
import CustomersList from './components/CustomersList';
import CustomerDetails from './components/CustomerDetails';
import InvoicesList from './components/InvoicesList';

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
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Immer eingeloggt

  const login = () => setIsAuthenticated(true);
  const logout = () => setIsAuthenticated(false);

  return (
    <ThemeProvider>
      <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
        <Router>
          <Routes>
            <Route 
              path="/login" 
              element={<Navigate to="/dashboard" />} 
            />
            <Route 
              path="/dashboard" 
              element={<Dashboard />} 
            />
            <Route 
              path="/search-customer" 
              element={<CustomerSearch />} 
            />
            <Route 
              path="/create-quote" 
              element={<CreateQuote />} 
            />
            <Route 
              path="/new-customer" 
              element={<NewCustomer />} 
            />
            <Route 
              path="/quotes" 
              element={<QuotesList />} 
            />
            <Route 
              path="/customers" 
              element={<CustomersList />} 
            />
            <Route 
              path="/customer/:customerId" 
              element={<CustomerDetails />} 
            />
            <Route 
              path="/invoices" 
              element={<InvoicesList />} 
            />
            <Route 
              path="/" 
              element={<Navigate to="/dashboard" />} 
            />
          </Routes>
        </Router>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}

export default App;