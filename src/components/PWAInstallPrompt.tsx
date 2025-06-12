import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  IconButton,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
  useTheme,
  alpha,
} from '@mui/material';
import {
  GetApp as GetAppIcon,
  Close as CloseIcon,
  Smartphone as SmartphoneIcon,
  Speed as SpeedIcon,
  CloudOff as CloudOffIcon,
  CloudDone as CloudDoneIcon,
  Update as UpdateIcon,
} from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';
import pwaManager from '../utils/pwa';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface PWAPromptProps {
  position?: 'top' | 'bottom';
  variant?: 'banner' | 'card' | 'minimal';
}

const PWAInstallPrompt: React.FC<PWAPromptProps> = ({ 
  position = 'bottom',
  variant = 'card'
}) => {
  const theme = useTheme();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showOfflineSnackbar, setShowOfflineSnackbar] = useState(false);
  const [showOnlineSnackbar, setShowOnlineSnackbar] = useState(false);

  useEffect(() => {
    // Listen for PWA events
    const handleInstallable = (event: any) => {
      setShowInstallPrompt(event.detail.canInstall);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
    };

    const handleUpdateAvailable = () => {
      setShowUpdateDialog(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineSnackbar(true);
    };

    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineSnackbar(true);
      setShowOfflineSnackbar(false);
    };

    window.addEventListener('pwa:installable', handleInstallable);
    window.addEventListener('pwa:installed', handleInstalled);
    window.addEventListener('pwa:updateAvailable', handleUpdateAvailable);
    window.addEventListener('pwa:offline', handleOffline);
    window.addEventListener('pwa:online', handleOnline);

    // Initial state
    setIsInstalled(pwaManager.isAppInstalled());
    setIsOnline(pwaManager.isAppOnline());

    return () => {
      window.removeEventListener('pwa:installable', handleInstallable);
      window.removeEventListener('pwa:installed', handleInstalled);
      window.removeEventListener('pwa:updateAvailable', handleUpdateAvailable);
      window.removeEventListener('pwa:offline', handleOffline);
      window.removeEventListener('pwa:online', handleOnline);
    };
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const installed = await pwaManager.installApp();
      if (installed) {
        pwaManager.trackPWAUsage('app_installed');
      }
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleUpdateApp = () => {
    window.location.reload();
    setShowUpdateDialog(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    pwaManager.trackPWAUsage('install_prompt_dismissed');
    
    // Don't show again for 24 hours
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Check if user dismissed recently
  useEffect(() => {
    const dismissedTime = localStorage.getItem('pwa-install-dismissed');
    if (dismissedTime) {
      const timeDiff = Date.now() - parseInt(dismissedTime);
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      if (hoursDiff < 24) {
        setShowInstallPrompt(false);
      }
    }
  }, []);

  if (isInstalled || !showInstallPrompt) {
    return (
      <>
        {/* Connection Status */}
        <Snackbar
          open={showOfflineSnackbar}
          autoHideDuration={null}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            severity="warning" 
            icon={<CloudOffIcon />}
            sx={{ 
              backgroundColor: alpha(theme.palette.warning.main, 0.9),
              color: 'white',
              fontWeight: 600
            }}
          >
            Offline-Modus - Einige Funktionen sind eingeschränkt
          </Alert>
        </Snackbar>

        <Snackbar
          open={showOnlineSnackbar}
          autoHideDuration={3000}
          onClose={() => setShowOnlineSnackbar(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            severity="success" 
            icon={<CloudDoneIcon />}
            onClose={() => setShowOnlineSnackbar(false)}
          >
            Verbindung wiederhergestellt
          </Alert>
        </Snackbar>

        {/* Update Dialog */}
        <Dialog
          open={showUpdateDialog}
          TransitionComponent={Transition}
          keepMounted
          onClose={() => setShowUpdateDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <UpdateIcon color="primary" />
            App-Update verfügbar
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Eine neue Version von Relocato ist verfügbar. Aktualisieren Sie jetzt, 
              um die neuesten Funktionen und Verbesserungen zu erhalten.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Das Update enthält Leistungsverbesserungen, Fehlerbehebungen und neue Funktionen.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowUpdateDialog(false)}>
              Später
            </Button>
            <Button 
              variant="contained" 
              onClick={handleUpdateApp}
              startIcon={<UpdateIcon />}
            >
              Jetzt aktualisieren
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  // Render install prompt based on variant
  const renderPrompt = () => {
    switch (variant) {
      case 'banner':
        return (
          <Box
            sx={{
              position: 'fixed',
              [position]: 0,
              left: 0,
              right: 0,
              backgroundColor: theme.palette.primary.main,
              color: 'white',
              p: 2,
              zIndex: 1300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: theme.shadows[8],
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SmartphoneIcon />
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  Relocato App installieren
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Für bessere Performance und Offline-Zugriff
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                color="inherit"
                onClick={handleInstall}
                disabled={isInstalling}
                startIcon={<GetAppIcon />}
              >
                {isInstalling ? 'Installiere...' : 'Installieren'}
              </Button>
              <IconButton size="small" color="inherit" onClick={handleDismiss}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        );

      case 'minimal':
        return (
          <Box
            sx={{
              position: 'fixed',
              [position]: 20,
              right: 20,
              zIndex: 1300,
            }}
          >
            <Button
              variant="contained"
              onClick={handleInstall}
              disabled={isInstalling}
              startIcon={<GetAppIcon />}
              sx={{
                borderRadius: '50px',
                px: 3,
                py: 1.5,
                boxShadow: theme.shadows[8],
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[12],
                },
              }}
            >
              {isInstalling ? 'Installiere...' : 'App installieren'}
            </Button>
          </Box>
        );

      default: // card
        return (
          <Box
            sx={{
              position: 'fixed',
              [position]: 20,
              left: 20,
              right: 20,
              zIndex: 1300,
              '@media (min-width: 600px)': {
                left: 'auto',
                right: 20,
                maxWidth: 400,
              },
            }}
          >
            <Paper
              elevation={8}
              sx={{
                p: 3,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `radial-gradient(circle at top right, ${alpha('#fff', 0.1)} 0%, transparent 60%)`,
                },
              }}
            >
              <IconButton
                size="small"
                onClick={handleDismiss}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  color: 'inherit',
                  opacity: 0.7,
                  '&:hover': { opacity: 1 },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <SmartphoneIcon sx={{ fontSize: 32 }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Relocato installieren
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ mb: 3, opacity: 0.9, lineHeight: 1.5 }}>
                Installieren Sie die Relocato App für einen schnelleren Zugriff, 
                bessere Performance und Offline-Funktionalität.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SpeedIcon fontSize="small" />
                  <Typography variant="caption">Schneller</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CloudOffIcon fontSize="small" />
                  <Typography variant="caption">Offline</Typography>
                </Box>
              </Box>

              <Button
                fullWidth
                variant="contained"
                onClick={handleInstall}
                disabled={isInstalling}
                startIcon={<GetAppIcon />}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  fontWeight: 600,
                  py: 1.5,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    transform: 'translateY(-1px)',
                  },
                  '&:disabled': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                }}
              >
                {isInstalling ? 'Installiere App...' : 'Jetzt installieren'}
              </Button>
            </Paper>
          </Box>
        );
    }
  };

  return renderPrompt();
};

export default PWAInstallPrompt;