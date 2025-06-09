import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App.simple';
import { useResponsive } from '../hooks/useResponsive';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Link,
  InputAdornment,
  IconButton,
  useTheme
} from '@mui/material';
import { 
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  Business as BusinessIcon
} from '@mui/icons-material';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const { isMobile, getTextFieldProps, getButtonProps, getViewportHeight } = useResponsive();
  const theme = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Demo-Login - akzeptiert jede Email/Passwort-Kombination
      if (email && password) {
        await new Promise(resolve => setTimeout(resolve, 500));
        login();
        navigate('/dashboard');
      } else {
        setError('Bitte füllen Sie alle Felder aus.');
      }
    } catch (err: any) {
      setError('Login fehlgeschlagen. Bitte überprüfen Sie Ihre Zugangsdaten.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: isMobile ? getViewportHeight() : '100vh',
        background: isMobile 
          ? 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)'
          : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        display: 'flex',
        alignItems: 'center',
        py: { xs: 0, sm: 4 }
      }}
    >
      <Container 
        component="main" 
        maxWidth="xs"
        sx={{
          px: { xs: 2, sm: 3 }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Logo/Icon Section */}
          <Paper
            elevation={isMobile ? 0 : 8}
            sx={{
              padding: { xs: 3, sm: 4 },
              width: '100%',
              borderRadius: { xs: 0, sm: 3 },
              background: isMobile ? 'rgba(255,255,255,0.95)' : '#ffffff',
              backdropFilter: isMobile ? 'blur(10px)' : 'none',
              border: isMobile ? '1px solid rgba(255,255,255,0.2)' : 'none',
              ...(isMobile && {
                marginTop: 4,
                marginBottom: 4
              })
            }}
          >
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 64,
                  height: 64,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #1976d2, #1565c0)',
                  mb: 2,
                  boxShadow: 2
                }}
              >
                <BusinessIcon sx={{ fontSize: 32, color: 'white' }} />
              </Box>
              
              <Typography 
                component="h1" 
                variant={isMobile ? "h5" : "h4"} 
                sx={{ 
                  fontWeight: 600,
                  color: 'primary.main',
                  mb: 0.5
                }}
              >
                Umzugs-Angebote
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
              >
                Berater-Login
              </Typography>
            </Box>
            
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 2,
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                {error}
              </Alert>
            )}
            
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                required
                fullWidth
                id="email"
                label="Email-Adresse"
                name="email"
                autoComplete="email"
                autoFocus={!isMobile} // Verhindert Keyboard auf Mobile
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 2 }}
                {...getTextFieldProps()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                required
                fullWidth
                name="password"
                label="Passwort"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 3 }}
                {...getTextFieldProps()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={togglePasswordVisibility}
                        edge="end"
                        size={isMobile ? "large" : "medium"}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                {...getButtonProps()}
                sx={{ 
                  mb: 2,
                  background: 'linear-gradient(135deg, #1976d2, #1565c0)',
                  boxShadow: 2,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
                    boxShadow: 3,
                  },
                  '&:disabled': {
                    background: 'rgba(0,0,0,0.12)',
                  }
                }}
              >
                {loading ? (
                  <CircularProgress 
                    size={isMobile ? 28 : 24} 
                    color="inherit" 
                  />
                ) : (
                  'Anmelden'
                )}
              </Button>
              
              <Box textAlign="center">
                <Link
                  component="button"
                  variant="body2"
                  onClick={(e) => {
                    e.preventDefault();
                    // Passwort vergessen Funktion
                  }}
                  sx={{ 
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    }
                  }}
                >
                  Passwort vergessen?
                </Link>
              </Box>
            </Box>

            {/* Demo Info */}
            <Box 
              sx={{ 
                mt: 3, 
                p: 2, 
                backgroundColor: 'info.lighter',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'info.light'
              }}
            >
              <Typography 
                variant="caption" 
                color="info.dark"
                sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  display: 'block',
                  textAlign: 'center'
                }}
              >
                Demo-Modus: Beliebige Email & Passwort verwenden
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;