import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CircularProgress, Box } from '@mui/material';
import { User } from 'firebase/auth';
import { authService } from './services/authService';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CustomerSearch from './components/CustomerSearch';
import CreateQuote from './components/CreateQuote';
import NewCustomer from './components/NewCustomer';
import QuotesList from './components/QuotesList';
import CustomersList from './components/CustomersList';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          minHeight: 44,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          '& .MuiInputBase-input': {
            minHeight: '1.4375em',
          },
        },
      },
    },
  },
});

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
    const unsubscribe = authService.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setAuthError('');
      await authService.login({ email, password });
    } catch (error: any) {
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
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="100vh"
        >
          <CircularProgress size={60} />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthContext.Provider value={{ user, login, logout, resetPassword }}>
        <Router>
          <Routes>
            <Route 
              path="/login" 
              element={user ? <Navigate to="/dashboard" /> : <Login />} 
            />
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