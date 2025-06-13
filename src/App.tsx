import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CircularProgress, Box, Typography } from '@mui/material';
import { User } from 'firebase/auth';
import { authService } from './services/authService';
import { authPersistencePromise } from './config/firebase';
import { modernTheme } from './styles/modernTheme';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CustomerSearch from './components/CustomerSearch';
import CreateQuote from './components/CreateQuote';
import NewCustomer from './components/NewCustomer';
import QuotesList from './components/QuotesList';
import CustomersList from './components/CustomersList';
import CustomerDetails from './components/CustomerDetails.simple';
import InvoicesList from './components/InvoicesList';
import SalesPage from './pages/SalesPage';
import CalendarView from './components/CalendarView';

export const AuthContext = React.createContext<{
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}>({
  user: null,
  login: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
});

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string>('');

  useEffect(() => {
    console.log('🔄 App.tsx: Setting up auth state listener...');
    
    // Auth-State-Listener direkt starten
    const unsubscribe = authService.onAuthStateChange((user) => {
      console.log('👤 App.tsx: Auth state changed:', user ? `User: ${user.email}` : 'No user');
      setUser(user);
      setLoading(false);
      
      // User-State in localStorage speichern als Backup
      if (user) {
        localStorage.setItem('authUser', JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        }));
      } else {
        localStorage.removeItem('authUser');
      }
    });

    // Cleanup
    return () => {
      console.log('🛑 App.tsx: Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('App.tsx: Starting login process...');
      setAuthError('');
      const user = await authService.login({ email, password });
      console.log('App.tsx: Login successful, user:', user);
    } catch (error: any) {
      console.error('App.tsx: Login failed:', error);
      setAuthError(error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error: any) {
      console.error('Logout error:', error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setAuthError('');
      await authService.resetPassword(email);
    } catch (error: any) {
      setAuthError(error.message);
      throw error;
    }
  };

  if (loading) {
    return (
      <ThemeProvider theme={modernTheme}>
        <CssBaseline />
        <Box 
          display="flex" 
          flexDirection="column"
          justifyContent="center" 
          alignItems="center" 
          minHeight="100vh"
          gap={2}
        >
          <CircularProgress size={60} />
          <Typography variant="h6" color="text.secondary">
            Authentifizierung wird überprüft...
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={modernTheme}>
      <CssBaseline />
      <AuthContext.Provider value={{ user, login, logout, resetPassword }}>
        <Router>
          <Routes>
            {/* Auth Routes */}
            <Route 
              path="/login" 
              element={user ? <Navigate to="/dashboard" /> : <Login />} 
            />
            
            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={user ? <Dashboard /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/search-customer" 
              element={user ? <CustomerSearch /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/create-quote" 
              element={user ? <CreateQuote /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/create-quote/:customerId" 
              element={user ? <CreateQuote /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/new-customer" 
              element={user ? <NewCustomer /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/quotes" 
              element={user ? <QuotesList /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/customers" 
              element={user ? <CustomersList /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/invoices" 
              element={user ? <InvoicesList /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/sales" 
              element={user ? <SalesPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/calendar" 
              element={user ? <CalendarView /> : <Navigate to="/login" />} 
            />
            
            {/* Customer Detail Routes */}
            <Route 
              path="/customer-details/:customerId" 
              element={<CustomerDetails />} 
            />
            <Route 
              path="/edit-customer/:customerId" 
              element={<CustomerDetails />} 
            />
            
            {/* Default Routes */}
            <Route 
              path="/" 
              element={<Navigate to={user ? "/dashboard" : "/login"} />} 
            />
          </Routes>
        </Router>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}

export default App;