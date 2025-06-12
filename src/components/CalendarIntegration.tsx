import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Button,
  IconButton,
  Switch,
  FormControlLabel,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  useTheme,
  alpha,
  Tooltip,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Google as GoogleIcon,
  Apple as AppleIcon,
  Microsoft as MicrosoftIcon,
  Sync as SyncIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Event as EventIcon,
  Notifications as NotificationsIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import MovingCalendar from './MovingCalendar';
import { AnimatedCard, SlideInContainer } from './MicroAnimations';

interface CalendarProvider {
  id: string;
  name: string;
  icon: React.ReactNode;
  connected: boolean;
  lastSync: Date | null;
  syncEnabled: boolean;
  calendarCount: number;
  color: string;
}

interface SyncSettings {
  autoSync: boolean;
  syncInterval: number; // in minutes
  conflictResolution: 'local' | 'remote' | 'prompt';
  notifications: boolean;
  reminderSettings: {
    enabled: boolean;
    defaultTime: number; // minutes before event
  };
}

interface CalendarIntegrationProps {
  onEventSync?: (events: any[]) => void;
}

const CalendarIntegration: React.FC<CalendarIntegrationProps> = ({ onEventSync }) => {
  const theme = useTheme();
  const [providers, setProviders] = useState<CalendarProvider[]>([]);
  const [settings, setSettings] = useState<SyncSettings>({
    autoSync: false,
    syncInterval: 15,
    conflictResolution: 'prompt',
    notifications: true,
    reminderSettings: {
      enabled: true,
      defaultTime: 30,
    },
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    initializeProviders();
    loadSettings();
  }, []);

  const initializeProviders = () => {
    const mockProviders: CalendarProvider[] = [
      {
        id: 'google',
        name: 'Google Calendar',
        icon: <GoogleIcon />,
        connected: false,
        lastSync: null,
        syncEnabled: true,
        calendarCount: 0,
        color: '#4285f4',
      },
      {
        id: 'outlook',
        name: 'Microsoft Outlook',
        icon: <MicrosoftIcon />,
        connected: false,
        lastSync: null,
        syncEnabled: false,
        calendarCount: 0,
        color: '#0078d4',
      },
      {
        id: 'apple',
        name: 'Apple iCloud',
        icon: <AppleIcon />,
        connected: false,
        lastSync: null,
        syncEnabled: false,
        calendarCount: 0,
        color: '#000000',
      },
    ];
    setProviders(mockProviders);
  };

  const loadSettings = () => {
    const saved = localStorage.getItem('relocato-calendar-settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading calendar settings:', error);
      }
    }
  };

  const saveSettings = (newSettings: SyncSettings) => {
    setSettings(newSettings);
    localStorage.setItem('relocato-calendar-settings', JSON.stringify(newSettings));
  };

  const handleConnect = async (providerId: string) => {
    setIsConnecting(providerId);

    // Simulate connection process
    setTimeout(() => {
      setProviders(prev => prev.map(provider => 
        provider.id === providerId 
          ? { 
              ...provider, 
              connected: true, 
              lastSync: new Date(),
              calendarCount: Math.floor(Math.random() * 5) + 1 
            }
          : provider
      ));
      setIsConnecting(null);
      
      // Show success notification
      alert(`Erfolgreich mit ${providers.find(p => p.id === providerId)?.name} verbunden!`);
    }, 2000);
  };

  const handleDisconnect = (providerId: string) => {
    setProviders(prev => prev.map(provider => 
      provider.id === providerId 
        ? { 
            ...provider, 
            connected: false, 
            lastSync: null,
            syncEnabled: false,
            calendarCount: 0 
          }
        : provider
    ));
  };

  const handleSync = async () => {
    setSyncStatus('syncing');
    
    // Simulate sync process
    setTimeout(() => {
      const connectedProviders = providers.filter(p => p.connected && p.syncEnabled);
      
      if (connectedProviders.length > 0) {
        // Update last sync time for connected providers
        setProviders(prev => prev.map(provider => 
          provider.connected && provider.syncEnabled
            ? { ...provider, lastSync: new Date() }
            : provider
        ));
        
        setLastSyncTime(new Date());
        setSyncStatus('success');
        
        // Generate mock events for sync
        const mockEvents = generateMockSyncEvents();
        onEventSync?.(mockEvents);
      } else {
        setSyncStatus('error');
      }
      
      // Reset status after 3 seconds
      setTimeout(() => setSyncStatus('idle'), 3000);
    }, 2000);
  };

  const generateMockSyncEvents = () => {
    return [
      {
        id: 'sync-1',
        title: 'Kundentermin - Beratung',
        start: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        end: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 1 hour
        source: 'google',
      },
      {
        id: 'sync-2',
        title: 'Team Meeting',
        start: new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after tomorrow
        end: new Date(Date.now() + 48 * 60 * 60 * 1000 + 30 * 60 * 1000), // 30 minutes
        source: 'outlook',
      },
    ];
  };

  const toggleProviderSync = (providerId: string, enabled: boolean) => {
    setProviders(prev => prev.map(provider => 
      provider.id === providerId 
        ? { ...provider, syncEnabled: enabled }
        : provider
    ));
  };

  const exportCalendar = () => {
    // Create ICS file content
    const icsContent = generateICSContent();
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relocato-calendar.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateICSContent = () => {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Relocato GmbH//Relocato Calendar//DE
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Relocato Umzugstermine
X-WR-TIMEZONE:Europe/Berlin
BEGIN:VEVENT
UID:example-event-${timestamp}
DTSTART:${timestamp}
DTEND:${timestamp}
SUMMARY:Beispiel Umzugstermin
DESCRIPTION:Automatisch generierter Kalender-Export von Relocato
LOCATION:Berlin, Deutschland
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
  };

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <SyncIcon className="rotating" />;
      case 'success':
        return <CheckIcon color="success" />;
      case 'error':
        return <CloseIcon color="error" />;
      default:
        return <SyncIcon />;
    }
  };

  const getStatusMessage = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'Synchronisiere...';
      case 'success':
        return 'Synchronisation erfolgreich';
      case 'error':
        return 'Synchronisation fehlgeschlagen';
      default:
        return lastSyncTime ? `Letzte Sync: ${lastSyncTime.toLocaleTimeString()}` : 'Noch nicht synchronisiert';
    }
  };

  return (
    <Box>
      {/* Header */}
      <SlideInContainer>
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon color="primary" />
              Kalender-Integration
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Kalender exportieren">
                <IconButton onClick={exportCalendar}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Einstellungen">
                <IconButton onClick={() => setIsSettingsOpen(true)}>
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
              
              <Button
                variant="contained"
                startIcon={getStatusIcon()}
                onClick={handleSync}
                disabled={syncStatus === 'syncing' || !providers.some(p => p.connected && p.syncEnabled)}
              >
                Synchronisieren
              </Button>
            </Box>
          </Box>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Verbinden Sie Ihre externen Kalender für automatische Synchronisation von Umzugsterminen
          </Typography>
          
          <Alert severity="info" icon={<InfoIcon />}>
            {getStatusMessage()}
          </Alert>
        </Paper>
      </SlideInContainer>

      {/* Calendar Providers */}
      <SlideInContainer delay={200}>
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            Kalender-Anbieter
          </Typography>
          
          <Grid container spacing={3}>
            {providers.map((provider, index) => (
              <Grid item xs={12} md={4} key={provider.id}>
                <AnimatedCard delay={index * 100}>
                  <Box
                    sx={{
                      background: provider.connected 
                        ? `linear-gradient(135deg, ${provider.color} 0%, ${alpha(provider.color, 0.8)} 100%)`
                        : `linear-gradient(135deg, ${theme.palette.grey[300]} 0%, ${theme.palette.grey[400]} 100%)`,
                      color: provider.connected ? 'white' : 'text.secondary',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Box sx={{ fontSize: 40 }}>
                          {provider.icon}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {provider.name}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.8 }}>
                            {provider.connected 
                              ? `${provider.calendarCount} Kalender verbunden`
                              : 'Nicht verbunden'
                            }
                          </Typography>
                        </Box>
                        
                        <Chip
                          label={provider.connected ? 'Verbunden' : 'Getrennt'}
                          color={provider.connected ? 'success' : 'default'}
                          size="small"
                          sx={{ 
                            color: provider.connected ? 'white' : 'inherit',
                            backgroundColor: provider.connected ? alpha('#fff', 0.2) : alpha('#000', 0.1)
                          }}
                        />
                      </Box>
                      
                      {provider.connected && (
                        <Box sx={{ mb: 2 }}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={provider.syncEnabled}
                                onChange={(e) => toggleProviderSync(provider.id, e.target.checked)}
                                sx={{
                                  '& .MuiSwitch-thumb': {
                                    backgroundColor: 'white',
                                  },
                                  '& .MuiSwitch-track': {
                                    backgroundColor: alpha('#fff', 0.3),
                                  },
                                }}
                              />
                            }
                            label="Synchronisation aktiv"
                            sx={{ color: 'inherit' }}
                          />
                          
                          {provider.lastSync && (
                            <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.8 }}>
                              Letzte Sync: {provider.lastSync.toLocaleString()}
                            </Typography>
                          )}
                        </Box>
                      )}
                      
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {provider.connected ? (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleDisconnect(provider.id)}
                            sx={{
                              color: 'inherit',
                              borderColor: alpha('#fff', 0.5),
                              '&:hover': {
                                borderColor: '#fff',
                                backgroundColor: alpha('#fff', 0.1),
                              },
                            }}
                          >
                            Trennen
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleConnect(provider.id)}
                            disabled={isConnecting === provider.id}
                            sx={{
                              backgroundColor: alpha('#fff', 0.2),
                              color: 'inherit',
                              '&:hover': {
                                backgroundColor: alpha('#fff', 0.3),
                              },
                            }}
                          >
                            {isConnecting === provider.id ? 'Verbinde...' : 'Verbinden'}
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Box>
                </AnimatedCard>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </SlideInContainer>

      {/* Integration Features */}
      <SlideInContainer delay={400}>
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            Integration Features
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card elevation={1}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <SyncIcon color="primary" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Automatische Synchronisation
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Umzugstermine werden automatisch mit externen Kalendern synchronisiert
                      </Typography>
                    </Box>
                  </Box>
                  
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <CheckIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Bidirektionale Synchronisation" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Konfliktauflösung" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Echtzeit-Updates" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card elevation={1}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <NotificationsIcon color="primary" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Smart Benachrichtigungen
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Intelligente Erinnerungen und Benachrichtigungen für Termine
                      </Typography>
                    </Box>
                  </Box>
                  
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <CheckIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Anpassbare Erinnerungszeiten" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Multi-Channel Benachrichtigungen" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Eskalationsregeln" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card elevation={1}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <DownloadIcon color="primary" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Import & Export
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Einfacher Import und Export von Kalenderdaten
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button size="small" startIcon={<DownloadIcon />} onClick={exportCalendar}>
                      ICS Export
                    </Button>
                    <Button size="small" startIcon={<UploadIcon />}>
                      CSV Import
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card elevation={1}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <EventIcon color="primary" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Event-Mapping
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Intelligente Zuordnung von Kalendereinträgen zu Umzugsterminen
                      </Typography>
                    </Box>
                  </Box>
                  
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <CheckIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Automatische Kategorisierung" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Kundeninformationen-Extraktion" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Adress-Parsing" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      </SlideInContainer>

      {/* Integrated Calendar */}
      <SlideInContainer delay={600}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            Integrierter Kalender
          </Typography>
          <MovingCalendar />
        </Paper>
      </SlideInContainer>

      {/* Settings Dialog */}
      <Dialog
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Kalender-Einstellungen</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Synchronisation
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.autoSync}
                  onChange={(e) => saveSettings({ ...settings, autoSync: e.target.checked })}
                />
              }
              label="Automatische Synchronisation aktivieren"
              sx={{ mb: 2, display: 'block' }}
            />
            
            <TextField
              fullWidth
              label="Synchronisations-Intervall (Minuten)"
              type="number"
              value={settings.syncInterval}
              onChange={(e) => saveSettings({ ...settings, syncInterval: Number(e.target.value) })}
              sx={{ mb: 3 }}
            />
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" sx={{ mb: 2 }}>
              Benachrichtigungen
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications}
                  onChange={(e) => saveSettings({ ...settings, notifications: e.target.checked })}
                />
              }
              label="Benachrichtigungen aktivieren"
              sx={{ mb: 2, display: 'block' }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.reminderSettings.enabled}
                  onChange={(e) => saveSettings({ 
                    ...settings, 
                    reminderSettings: { ...settings.reminderSettings, enabled: e.target.checked }
                  })}
                />
              }
              label="Standard-Erinnerungen aktivieren"
              sx={{ mb: 2, display: 'block' }}
            />
            
            <TextField
              fullWidth
              label="Standard-Erinnerungszeit (Minuten vor Termin)"
              type="number"
              value={settings.reminderSettings.defaultTime}
              onChange={(e) => saveSettings({ 
                ...settings, 
                reminderSettings: { ...settings.reminderSettings, defaultTime: Number(e.target.value) }
              })}
              disabled={!settings.reminderSettings.enabled}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsSettingsOpen(false)}>
            Schließen
          </Button>
        </DialogActions>
      </Dialog>

      <style jsx global>{`
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .rotating {
          animation: rotate 1s linear infinite;
        }
      `}</style>
    </Box>
  );
};

export default CalendarIntegration;