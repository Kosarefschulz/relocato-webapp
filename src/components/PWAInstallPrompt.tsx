import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  IconButton,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  GetApp as InstallIcon,
  Close as CloseIcon,
  PhoneIphone as PhoneIcon,
  Laptop as LaptopIcon,
  OfflinePin as OfflineIcon,
  NotificationsActive as NotificationsIcon,
  PhotoCamera as CameraIcon,
  Sync as SyncIcon,
  Apple as AppleIcon,
  Android as AndroidIcon
} from '@mui/icons-material';
import { isAppInstalled, showInstallPrompt, enableNotifications } from '../serviceWorkerRegistration';

const PWAInstallPrompt: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [installAvailable, setInstallAvailable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  
  useEffect(() => {
    // Check if already installed
    if (isAppInstalled()) {
      console.log('PWA is already installed');
      return;
    }

    // Check for iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Show install prompt after 30 seconds if not installed
    const timer = setTimeout(() => {
      if (!isAppInstalled()) {
        setShowPrompt(true);
      }
    }, 30000);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallAvailable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    const result = await showInstallPrompt();
    if (result === 'accepted') {
      setShowPrompt(false);
      // Show notification prompt after install
      setTimeout(() => {
        if (Notification.permission === 'default') {
          setShowNotificationPrompt(true);
        }
      }, 2000);
    }
  };

  const handleEnableNotifications = async () => {
    const subscription = await enableNotifications();
    if (subscription) {
      setNotificationPermission('granted');
      setShowNotificationPrompt(false);
    }
  };

  const features = [
    {
      icon: <OfflineIcon />,
      title: 'Offline-Zugriff',
      description: 'Arbeiten Sie auch ohne Internetverbindung'
    },
    {
      icon: <NotificationsIcon />,
      title: 'Push-Benachrichtigungen',
      description: 'Erhalten Sie wichtige Updates in Echtzeit'
    },
    {
      icon: <CameraIcon />,
      title: 'Kamera-Integration',
      description: 'Fotos direkt in der App aufnehmen'
    },
    {
      icon: <SyncIcon />,
      title: 'Automatische Synchronisation',
      description: 'Daten werden automatisch synchronisiert'
    }
  ];

  const IOSInstructions = () => (
    <Dialog open={showIOSInstructions} onClose={() => setShowIOSInstructions(false)} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <AppleIcon sx={{ mr: 1 }} />
          iOS Installation
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" paragraph>
          Um RELOCATO auf Ihrem iPhone oder iPad zu installieren:
        </Typography>
        <List>
          <ListItem>
            <ListItemText 
              primary="1. Tippen Sie auf das Teilen-Symbol"
              secondary="Unten in der Mitte der Safari-Leiste"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary='2. Wählen Sie "Zum Home-Bildschirm"'
              secondary="Scrollen Sie in der Liste nach unten"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="3. Tippen Sie auf Hinzufügen"
              secondary="Die App wird auf Ihrem Home-Bildschirm installiert"
            />
          </ListItem>
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowIOSInstructions(false)}>Verstanden</Button>
      </DialogActions>
    </Dialog>
  );

  if (isAppInstalled()) {
    return null;
  }

  return (
    <>
      {/* Main Install Dialog */}
      <Dialog 
        open={showPrompt} 
        onClose={() => setShowPrompt(false)}
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center">
              <InstallIcon sx={{ mr: 1 }} />
              RELOCATO als App installieren
            </Box>
            <IconButton onClick={() => setShowPrompt(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Installieren Sie RELOCATO als App für die beste Erfahrung!
          </Alert>
          
          <Typography variant="body1" paragraph>
            Mit der RELOCATO App können Sie:
          </Typography>
          
          <List>
            {features.map((feature, index) => (
              <ListItem key={index}>
                <ListItemIcon>{feature.icon}</ListItemIcon>
                <ListItemText 
                  primary={feature.title}
                  secondary={feature.description}
                />
              </ListItem>
            ))}
          </List>
          
          <Box display="flex" justifyContent="center" mt={2}>
            {isMobile ? <PhoneIcon fontSize="large" /> : <LaptopIcon fontSize="large" />}
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowPrompt(false)}>
            Später
          </Button>
          <Button 
            onClick={handleInstall} 
            variant="contained" 
            startIcon={isIOS ? <AppleIcon /> : <InstallIcon />}
          >
            {isIOS ? 'Installationsanleitung' : 'Jetzt installieren'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* iOS Instructions */}
      <IOSInstructions />

      {/* Notification Permission Dialog */}
      <Dialog 
        open={showNotificationPrompt} 
        onClose={() => setShowNotificationPrompt(false)}
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <NotificationsIcon sx={{ mr: 1 }} />
            Benachrichtigungen aktivieren
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body1" paragraph>
            Möchten Sie Benachrichtigungen aktivieren, um über wichtige Updates informiert zu werden?
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon><NotificationsIcon /></ListItemIcon>
              <ListItemText 
                primary="Neue Kundenanfragen"
                secondary="Sofortige Benachrichtigung bei neuen Anfragen"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><NotificationsIcon /></ListItemIcon>
              <ListItemText 
                primary="Terminerinnerungen"
                secondary="Verpassen Sie keine wichtigen Termine"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><NotificationsIcon /></ListItemIcon>
              <ListItemText 
                primary="Status-Updates"
                secondary="Bleiben Sie über Änderungen informiert"
              />
            </ListItem>
          </List>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowNotificationPrompt(false)}>
            Später
          </Button>
          <Button 
            onClick={handleEnableNotifications} 
            variant="contained" 
            startIcon={<NotificationsIcon />}
          >
            Benachrichtigungen aktivieren
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Install Button (if available) */}
      {installAvailable && !showPrompt && (
        <Box
          position="fixed"
          bottom={theme.spacing(2)}
          right={theme.spacing(2)}
          zIndex={1200}
        >
          <Button
            variant="contained"
            color="primary"
            startIcon={<InstallIcon />}
            onClick={() => setShowPrompt(true)}
            sx={{
              borderRadius: 20,
              boxShadow: theme.shadows[4]
            }}
          >
            App installieren
          </Button>
        </Box>
      )}
    </>
  );
};

export default PWAInstallPrompt;