import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  IconButton,
  InputAdornment,
  Link,
  useTheme,
  alpha,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  Login as LoginIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { glassmorphism } from '../styles/modernTheme';
// Import AuthContext - will be provided by parent app
const AuthContext = React.createContext<any>(null);

const MotionBox = motion(Box);
const MotionPaper = motion(Paper);

const Login: React.FC = () => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (auth.login.length === 0) {
        // App.simple context
        await auth.login();
      } else {
        // App context with Firebase
        await auth.login(email, password);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Anmeldung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  // Animated background shapes
  const BackgroundShapes = () => (
    <Box sx={{ position: 'fixed', inset: 0, overflow: 'hidden', zIndex: -1 }}>
      <motion.div
        style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '40%',
          height: '40%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.3)} 0%, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 30, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <motion.div
        style={{
          position: 'absolute',
          bottom: '-15%',
          left: '-15%',
          width: '50%',
          height: '50%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.2)} 0%, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -40, 0],
          y: [0, 40, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </Box>
  );

  return (
    <>
      <BackgroundShapes />
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            py: 4,
          }}
        >
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Logo/Title */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 4,
                    background: `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                    boxShadow: `0px 12px 32px ${alpha(theme.palette.secondary.main, 0.3)}`,
                  }}
                >
                  <Typography variant="h3" sx={{ color: 'white', fontWeight: 800 }}>
                    R
                  </Typography>
                </Box>
              </motion.div>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                Willkommen zurück
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Melden Sie sich an, um fortzufahren
              </Typography>
            </Box>

            {/* Login Form */}
            <MotionPaper
              elevation={0}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              sx={{
                p: 4,
                ...glassmorphism.light,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              }}
            >
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                </motion.div>
              )}

              <form onSubmit={handleSubmit}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="E-Mail Adresse"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Passwort"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                          onClick={handleClickShowPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 3 }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    mb: 2,
                    py: 1.5,
                    background: `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
                    boxShadow: `0px 8px 24px ${alpha(theme.palette.secondary.main, 0.3)}`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                      boxShadow: `0px 12px 32px ${alpha(theme.palette.secondary.main, 0.4)}`,
                    },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    <>
                      <LoginIcon sx={{ mr: 1 }} />
                      Anmelden
                    </>
                  )}
                </Button>

                <Box sx={{ textAlign: 'center' }}>
                  <Link
                    component="button"
                    type="button"
                    variant="body2"
                    onClick={() => {
                      // Handle password reset
                      if (auth.resetPassword) {
                        const resetEmail = prompt('Geben Sie Ihre E-Mail-Adresse ein:');
                        if (resetEmail) {
                          auth.resetPassword(resetEmail)
                            .then(() => {
                              alert('E-Mail zum Zurücksetzen des Passworts wurde gesendet!');
                            })
                            .catch((err: any) => {
                              setError(err.message);
                            });
                        }
                      }
                    }}
                    sx={{
                      textDecoration: 'none',
                      color: theme.palette.secondary.main,
                      fontWeight: 500,
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Passwort vergessen?
                  </Link>
                </Box>
              </form>
            </MotionPaper>

            {/* Demo Mode Info */}
            {auth.login.length === 0 && (
              <MotionBox
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                sx={{ mt: 3, textAlign: 'center' }}
              >
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  <Typography variant="body2">
                    Demo-Modus: Klicken Sie auf "Anmelden" ohne Eingaben
                  </Typography>
                </Alert>
              </MotionBox>
            )}
          </MotionBox>
        </Box>
      </Container>
    </>
  );
};

export default Login;