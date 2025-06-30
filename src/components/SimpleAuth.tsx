import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Paper,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Lock as LockIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';

interface SimpleAuthProps {
  children: React.ReactNode;
}

const CORRECT_PASSWORD = 'Relocato2024'; // Kann später in Umgebungsvariable verschoben werden
const AUTH_STORAGE_KEY = 'relocato_auth_token';
const AUTH_EXPIRY_HOURS = 24; // Token läuft nach 24 Stunden ab

const SimpleAuth: React.FC<SimpleAuthProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  
  // Liste der öffentlichen Routen
  const publicRoutes = [
    '/quote-confirmation/',
    '/share/',
    '/shared-customer/'
  ];
  
  // Prüfe ob aktuelle Route öffentlich ist
  const isPublicRoute = publicRoutes.some(route => location.pathname.includes(route));

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        const now = new Date().getTime();
        
        // Check if token is still valid
        if (authData.expiry && authData.expiry > now) {
          setIsAuthenticated(true);
        } else {
          // Token expired, remove it
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } catch (e) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setLoading(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password === CORRECT_PASSWORD) {
      // Create auth token with expiry
      const authData = {
        token: btoa(password + new Date().getTime()), // Simple token
        expiry: new Date().getTime() + (AUTH_EXPIRY_HOURS * 60 * 60 * 1000)
      };
      
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
      setIsAuthenticated(true);
      setPassword('');
    } else {
      setError('Falsches Passwort');
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        bgcolor: 'background.default'
      }}>
        <Typography>Lade...</Typography>
      </Box>
    );
  }

  // Wenn es eine öffentliche Route ist, zeige den Inhalt ohne Auth
  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2
      }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            maxWidth: 400, 
            width: '100%',
            textAlign: 'center'
          }}
        >
          <Box sx={{ mb: 3 }}>
            <LockIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              RELOCATO®
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Umzugsverwaltung
            </Typography>
          </Box>

          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              label="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!error}
              helperText={error}
              sx={{ mb: 3 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              autoFocus
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={!password}
            >
              Anmelden
            </Button>
          </form>

          <Box sx={{ mt: 3 }}>
            <Alert severity="info">
              Bitte geben Sie das Passwort ein, um auf die App zuzugreifen.
            </Alert>
          </Box>
        </Paper>
      </Box>
    );
  }

  return <>{children}</>;
};

export default SimpleAuth;