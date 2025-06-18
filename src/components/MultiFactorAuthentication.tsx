import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Paper, Button, TextField, FormControl, InputLabel, Select, MenuItem, IconButton, Chip, List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction, Divider, useTheme, alpha, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Switch, FormControlLabel, Stepper, Step, StepLabel, StepContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Accordion, AccordionSummary, AccordionDetails, InputAdornment, OutlinedInput, FormHelperText } from '@mui/material';
import Grid from './GridCompat';
import {
  Security as SecurityIcon,
  PhoneAndroid as PhoneAndroidIcon,
  Email as EmailIcon,
  Key as KeyIcon,
  Sms as SmsIcon,
  QrCode2 as QrCodeIcon,
  VpnKey as VpnKeyIcon,
  Shield as ShieldIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  VerifiedUser as VerifiedUserIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  Devices as DeviceIcon,
  AccessTime as AccessTimeIcon,
  LocationOn as LocationIcon,
  Computer as ComputerIcon,
  Smartphone as SmartphoneIcon,
  Tablet as TabletIcon,
  Watch as WatchIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { format, addMinutes, differenceInMinutes } from 'date-fns';
import { de } from 'date-fns/locale';
import { AnimatedCard, SlideInContainer } from './MicroAnimations';

interface MFAMethod {
  id: string;
  type: 'totp' | 'sms' | 'email' | 'backup_codes' | 'hardware_token' | 'biometric';
  name: string;
  description: string;
  isEnabled: boolean;
  isPrimary: boolean;
  setupDate: Date;
  lastUsed?: Date;
  usageCount: number;
  configuration: {
    phoneNumber?: string;
    email?: string;
    secretKey?: string;
    backupCodes?: string[];
    deviceId?: string;
    publicKey?: string;
  };
  metadata: {
    deviceName?: string;
    deviceType?: 'mobile' | 'desktop' | 'hardware';
    appName?: string;
    qrCodeUrl?: string;
  };
  status: 'active' | 'inactive' | 'expired' | 'revoked';
}

interface MFASession {
  id: string;
  userId: string;
  challengeType: MFAMethod['type'];
  challengeCode: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'completed' | 'failed' | 'expired';
  ipAddress: string;
  userAgent: string;
  location?: string;
  createdAt: Date;
}

interface SecurityEvent {
  id: string;
  type: 'mfa_setup' | 'mfa_login' | 'mfa_failed' | 'method_disabled' | 'method_added' | 'suspicious_activity';
  userId: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  location?: string;
  metadata: Record<string, any>;
}

interface TrustedDevice {
  id: string;
  userId: string;
  deviceName: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  operatingSystem: string;
  fingerprint: string;
  ipAddress: string;
  location?: string;
  addedAt: Date;
  lastUsed: Date;
  isActive: boolean;
  trustExpiry?: Date;
}

interface BackupCode {
  code: string;
  isUsed: boolean;
  usedAt?: Date;
}

interface MultiFactorAuthenticationProps {
  userId?: string;
  onMFAEnabled?: (method: MFAMethod) => void;
  onMFADisabled?: (methodId: string) => void;
  onSecurityEvent?: (event: SecurityEvent) => void;
  requiredForLogin?: boolean;
}

const MultiFactorAuthentication: React.FC<MultiFactorAuthenticationProps> = ({
  userId = 'user_123',
  onMFAEnabled,
  onMFADisabled,
  onSecurityEvent,
  requiredForLogin = false,
}) => {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState(0);
  const [mfaMethods, setMfaMethods] = useState<MFAMethod[]>([]);
  const [activeSessions, setActiveSessions] = useState<MFASession[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);
  const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(false);
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] = useState(false);
  const [selectedMethodType, setSelectedMethodType] = useState<MFAMethod['type']>('totp');
  const [verificationCode, setVerificationCode] = useState('');
  const [setupStep, setSetupStep] = useState(0);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [backupCodes, setBackupCodes] = useState<BackupCode[]>([]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [secretKey, setSecretKey] = useState('');

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = () => {
    // Initialize sample MFA methods
    const sampleMethods: MFAMethod[] = [
      {
        id: 'totp-1',
        type: 'totp',
        name: 'Authenticator App',
        description: 'Google Authenticator, Authy oder ähnliche Apps',
        isEnabled: true,
        isPrimary: true,
        setupDate: new Date('2024-01-15'),
        lastUsed: new Date('2024-12-05'),
        usageCount: 87,
        configuration: {
          secretKey: 'JBSWY3DPEHPK3PXP',
        },
        metadata: {
          appName: 'Google Authenticator',
          deviceName: 'iPhone 14',
          deviceType: 'mobile',
        },
        status: 'active',
      },
      {
        id: 'sms-1',
        type: 'sms',
        name: 'SMS Verification',
        description: 'Bestätigungscode per SMS',
        isEnabled: true,
        isPrimary: false,
        setupDate: new Date('2024-01-20'),
        lastUsed: new Date('2024-11-28'),
        usageCount: 23,
        configuration: {
          phoneNumber: '+49 151 12345678',
        },
        metadata: {
          deviceType: 'mobile',
        },
        status: 'active',
      },
      {
        id: 'email-1',
        type: 'email',
        name: 'Email Verification',
        description: 'Bestätigungscode per E-Mail',
        isEnabled: false,
        isPrimary: false,
        setupDate: new Date('2024-02-01'),
        usageCount: 5,
        configuration: {
          email: 'user@example.com',
        },
        metadata: {},
        status: 'inactive',
      },
      {
        id: 'backup-1',
        type: 'backup_codes',
        name: 'Backup Codes',
        description: 'Einmalige Backup-Codes für Notfälle',
        isEnabled: true,
        isPrimary: false,
        setupDate: new Date('2024-01-15'),
        usageCount: 2,
        configuration: {
          backupCodes: [
            '123456789',
            '987654321',
            '456789123',
            '789123456',
            '321654987',
            '654987321',
            '147258369',
            '963852741',
          ],
        },
        metadata: {},
        status: 'active',
      },
    ];

    // Initialize sample security events
    const sampleEvents: SecurityEvent[] = [
      {
        id: 'event-1',
        type: 'mfa_login',
        userId,
        description: 'Erfolgreiche MFA-Anmeldung mit Authenticator App',
        severity: 'low',
        timestamp: new Date('2024-12-05T10:30:00'),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        location: 'Berlin, Deutschland',
        metadata: {
          method: 'totp',
          success: true,
        },
      },
      {
        id: 'event-2',
        type: 'mfa_failed',
        userId,
        description: 'Fehlgeschlagener MFA-Versuch - falscher Code',
        severity: 'medium',
        timestamp: new Date('2024-12-04T15:45:00'),
        ipAddress: '203.0.113.42',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        location: 'Hamburg, Deutschland',
        metadata: {
          method: 'totp',
          attempts: 3,
          reason: 'invalid_code',
        },
      },
      {
        id: 'event-3',
        type: 'mfa_setup',
        userId,
        description: 'Neue MFA-Methode hinzugefügt: SMS Verification',
        severity: 'low',
        timestamp: new Date('2024-01-20T09:15:00'),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        location: 'Berlin, Deutschland',
        metadata: {
          method: 'sms',
          phoneNumber: '+49 151 12345678',
        },
      },
    ];

    // Initialize trusted devices
    const sampleDevices: TrustedDevice[] = [
      {
        id: 'device-1',
        userId,
        deviceName: 'MacBook Pro',
        deviceType: 'desktop',
        browser: 'Chrome 119.0',
        operatingSystem: 'macOS 14.0',
        fingerprint: 'fp_abc123def456',
        ipAddress: '192.168.1.100',
        location: 'Berlin, Deutschland',
        addedAt: new Date('2024-01-15'),
        lastUsed: new Date('2024-12-05'),
        isActive: true,
        trustExpiry: new Date('2025-01-15'),
      },
      {
        id: 'device-2',
        userId,
        deviceName: 'iPhone 14',
        deviceType: 'mobile',
        browser: 'Safari 17.0',
        operatingSystem: 'iOS 17.0',
        fingerprint: 'fp_xyz789ghi012',
        ipAddress: '10.0.0.25',
        location: 'Berlin, Deutschland',
        addedAt: new Date('2024-02-10'),
        lastUsed: new Date('2024-12-03'),
        isActive: true,
      },
    ];

    setMfaMethods(sampleMethods);
    setSecurityEvents(sampleEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
    setTrustedDevices(sampleDevices);

    // Generate backup codes
    generateBackupCodes();
  };

  const generateBackupCodes = () => {
    const codes: BackupCode[] = [];
    for (let i = 0; i < 8; i++) {
      codes.push({
        code: Math.random().toString(36).substring(2, 11).toUpperCase(),
        isUsed: Math.random() > 0.8,
        usedAt: Math.random() > 0.8 ? new Date() : undefined,
      });
    }
    setBackupCodes(codes);
  };

  const setupMFAMethod = async () => {
    setIsSettingUp(true);

    // Simulate setup process
    setTimeout(() => {
      const newMethod: MFAMethod = {
        id: `${selectedMethodType}-${Date.now()}`,
        type: selectedMethodType,
        name: getMethodName(selectedMethodType),
        description: getMethodDescription(selectedMethodType),
        isEnabled: true,
        isPrimary: mfaMethods.filter(m => m.isEnabled).length === 0,
        setupDate: new Date(),
        usageCount: 0,
        configuration: getMethodConfiguration(),
        metadata: getMethodMetadata(),
        status: 'active',
      };

      setMfaMethods(prev => [...prev, newMethod]);
      onMFAEnabled?.(newMethod);

      // Add security event
      const event: SecurityEvent = {
        id: `event-${Date.now()}`,
        type: 'mfa_setup',
        userId,
        description: `Neue MFA-Methode hinzugefügt: ${newMethod.name}`,
        severity: 'low',
        timestamp: new Date(),
        ipAddress: '192.168.1.100',
        userAgent: navigator.userAgent,
        metadata: {
          method: newMethod.type,
        },
      };

      setSecurityEvents(prev => [event, ...prev]);
      onSecurityEvent?.(event);

      setIsSettingUp(false);
      setIsSetupDialogOpen(false);
      setSetupStep(0);
      
      alert(`${newMethod.name} erfolgreich eingerichtet!`);
    }, 2000);
  };

  const getMethodName = (type: MFAMethod['type']) => {
    switch (type) {
      case 'totp': return 'Authenticator App';
      case 'sms': return 'SMS Verification';
      case 'email': return 'Email Verification';
      case 'backup_codes': return 'Backup Codes';
      case 'hardware_token': return 'Hardware Token';
      case 'biometric': return 'Biometric';
      default: return 'Unknown Method';
    }
  };

  const getMethodDescription = (type: MFAMethod['type']) => {
    switch (type) {
      case 'totp': return 'Google Authenticator, Authy oder ähnliche Apps';
      case 'sms': return 'Bestätigungscode per SMS';
      case 'email': return 'Bestätigungscode per E-Mail';
      case 'backup_codes': return 'Einmalige Backup-Codes für Notfälle';
      case 'hardware_token': return 'Physischer Sicherheitsschlüssel';
      case 'biometric': return 'Fingerabdruck oder Gesichtserkennung';
      default: return '';
    }
  };

  const getMethodConfiguration = () => {
    switch (selectedMethodType) {
      case 'totp':
        return { secretKey: secretKey || 'JBSWY3DPEHPK3PXP' };
      case 'sms':
        return { phoneNumber };
      case 'email':
        return { email };
      case 'backup_codes':
        return { backupCodes: backupCodes.map(bc => bc.code) };
      default:
        return {};
    }
  };

  const getMethodMetadata = () => {
    switch (selectedMethodType) {
      case 'totp':
        return {
          appName: 'Google Authenticator',
          qrCodeUrl: `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="white"/><text x="100" y="100" text-anchor="middle" fill="black">QR Code</text></svg>`)}`,
        };
      default:
        return {};
    }
  };

  const toggleMFAMethod = (methodId: string) => {
    setMfaMethods(prev => prev.map(method => {
      if (method.id === methodId) {
        const updatedMethod = { ...method, isEnabled: !method.isEnabled };
        
        if (!updatedMethod.isEnabled) {
          onMFADisabled?.(methodId);
        }
        
        return updatedMethod;
      }
      return method;
    }));
  };

  const removeMFAMethod = (methodId: string) => {
    setMfaMethods(prev => prev.filter(m => m.id !== methodId));
    onMFADisabled?.(methodId);
  };

  const getMethodIcon = (type: MFAMethod['type']) => {
    switch (type) {
      case 'totp': return <VpnKeyIcon />;
      case 'sms': return <SmsIcon />;
      case 'email': return <EmailIcon />;
      case 'backup_codes': return <KeyIcon />;
      case 'hardware_token': return <ShieldIcon />;
      case 'biometric': return <VerifiedUserIcon />;
      default: return <SecurityIcon />;
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile': return <SmartphoneIcon />;
      case 'tablet': return <TabletIcon />;
      case 'desktop': return <ComputerIcon />;
      default: return <DeviceIcon />;
    }
  };

  const getSeverityColor = (severity: SecurityEvent['severity']) => {
    switch (severity) {
      case 'low': return 'info';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const renderMFAMethods = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          MFA-Methoden
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsSetupDialogOpen(true)}
        >
          Methode hinzufügen
        </Button>
      </Box>

      <Grid container spacing={3}>
        {mfaMethods.map((method, index) => (
          <Grid item xs={12} md={6} lg={4} key={method.id}>
            <AnimatedCard delay={index * 100}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {getMethodIcon(method.type)}
                  </Box>
                  
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {method.name}
                      </Typography>
                      {method.isPrimary && (
                        <Chip label="Primär" size="small" color="primary" />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {method.description}
                    </Typography>
                  </Box>
                  
                  <Switch
                    checked={method.isEnabled}
                    onChange={() => toggleMFAMethod(method.id)}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {method.usageCount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Verwendungen
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {format(method.setupDate, 'dd.MM.yy')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Eingerichtet
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {method.lastUsed ? format(method.lastUsed, 'dd.MM.yy') : 'Nie'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Zuletzt verwendet
                    </Typography>
                  </Box>
                </Box>
                
                {method.type === 'sms' && method.configuration.phoneNumber && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Telefon: {method.configuration.phoneNumber}
                  </Typography>
                )}
                
                {method.type === 'email' && method.configuration.email && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    E-Mail: {method.configuration.email}
                  </Typography>
                )}
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<SettingsIcon />}
                    fullWidth
                  >
                    Konfigurieren
                  </Button>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => removeMFAMethod(method.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </AnimatedCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderTrustedDevices = () => (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Vertrauenswürdige Geräte
      </Typography>
      
      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Gerät</TableCell>
              <TableCell>Browser/OS</TableCell>
              <TableCell>Standort</TableCell>
              <TableCell>Hinzugefügt</TableCell>
              <TableCell>Zuletzt verwendet</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trustedDevices.map((device) => (
              <TableRow key={device.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getDeviceIcon(device.deviceType)}
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {device.deviceName}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {device.browser}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {device.operatingSystem}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {device.location || 'Unbekannt'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {device.ipAddress}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {format(device.addedAt, 'dd.MM.yyyy HH:mm', { locale: de })}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {format(device.lastUsed, 'dd.MM.yyyy HH:mm', { locale: de })}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={device.isActive ? 'Aktiv' : 'Inaktiv'}
                    size="small"
                    color={device.isActive ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Entfernen">
                      <IconButton size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderSecurityEvents = () => (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Sicherheitsereignisse
      </Typography>
      
      <List>
        {securityEvents.map((event) => (
          <React.Fragment key={event.id}>
            <ListItem>
              <ListItemIcon>
                {event.severity === 'critical' || event.severity === 'high' ? (
                  <ErrorIcon color="error" />
                ) : event.severity === 'medium' ? (
                  <WarningIcon color="warning" />
                ) : (
                  <InfoIcon color="info" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={event.description}
                secondary={
                  <Box>
                    <Typography variant="caption" sx={{ display: 'block' }}>
                      {format(event.timestamp, 'dd.MM.yyyy HH:mm:ss', { locale: de })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {event.ipAddress} • {event.location || 'Unbekannter Standort'}
                    </Typography>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <Chip
                  label={event.severity.toUpperCase()}
                  size="small"
                  color={getSeverityColor(event.severity)}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>
    </Box>
  );

  const renderBackupCodes = () => (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Backup-Codes
      </Typography>
      
      <Alert severity="warning" sx={{ mb: 3 }}>
        Bewahren Sie diese Codes an einem sicheren Ort auf. Jeder Code kann nur einmal verwendet werden.
      </Alert>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {backupCodes.map((backup, index) => (
          <Grid item xs={6} sm={4} md={3} key={index}>
            <Paper
              elevation={1}
              sx={{
                p: 2,
                textAlign: 'center',
                backgroundColor: backup.isUsed ? alpha(theme.palette.grey[500], 0.1) : 'background.paper',
                textDecoration: backup.isUsed ? 'line-through' : 'none',
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  fontFamily: 'monospace',
                  color: backup.isUsed ? 'text.disabled' : 'text.primary',
                }}
              >
                {backup.code}
              </Typography>
              {backup.isUsed && backup.usedAt && (
                <Typography variant="caption" color="text.secondary">
                  Verwendet: {format(backup.usedAt, 'dd.MM.yy')}
                </Typography>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>
      
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={generateBackupCodes}
        >
          Neue Codes generieren
        </Button>
        <Button
          variant="outlined"
          startIcon={<VisibilityIcon />}
        >
          Codes drucken
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box>
      {/* Header */}
      <SlideInContainer>
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <SecurityIcon color="primary" />
              Multi-Factor Authentication
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label={mfaMethods.filter(m => m.isEnabled).length > 0 ? 'MFA Aktiv' : 'MFA Inaktiv'}
                color={mfaMethods.filter(m => m.isEnabled).length > 0 ? 'success' : 'error'}
                icon={mfaMethods.filter(m => m.isEnabled).length > 0 ? <LockIcon /> : <LockOpenIcon />}
              />
            </Box>
          </Box>
          
          <Typography variant="body1" color="text.secondary">
            Erhöhen Sie die Sicherheit Ihres Kontos mit Multi-Faktor-Authentifizierung
          </Typography>
        </Paper>
      </SlideInContainer>

      {/* Quick Stats */}
      <SlideInContainer delay={200}>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={1}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <ShieldIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {mfaMethods.filter(m => m.isEnabled).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Aktive MFA-Methoden
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={1}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <DeviceIcon color="success" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {trustedDevices.filter(d => d.isActive).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Vertrauenswürdige Geräte
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={1}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <HistoryIcon color="info" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {mfaMethods.reduce((sum, m) => sum + m.usageCount, 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Gesamt-Verwendungen
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={1}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <WarningIcon color="warning" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {securityEvents.filter(e => e.severity === 'high' || e.severity === 'critical').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sicherheitswarnungen
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </SlideInContainer>

      {/* Navigation Tabs */}
      <SlideInContainer delay={400}>
        <Paper elevation={2} sx={{ mb: 4 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
              <Button
                onClick={() => setSelectedTab(0)}
                sx={{
                  flex: 1,
                  py: 2,
                  color: selectedTab === 0 ? 'primary.main' : 'text.secondary',
                  borderBottom: selectedTab === 0 ? 2 : 0,
                  borderColor: 'primary.main',
                  borderRadius: 0,
                }}
                startIcon={<VpnKeyIcon />}
              >
                MFA-Methoden
              </Button>
              <Button
                onClick={() => setSelectedTab(1)}
                sx={{
                  flex: 1,
                  py: 2,
                  color: selectedTab === 1 ? 'primary.main' : 'text.secondary',
                  borderBottom: selectedTab === 1 ? 2 : 0,
                  borderColor: 'primary.main',
                  borderRadius: 0,
                }}
                startIcon={<DeviceIcon />}
              >
                Vertrauenswürdige Geräte
              </Button>
              <Button
                onClick={() => setSelectedTab(2)}
                sx={{
                  flex: 1,
                  py: 2,
                  color: selectedTab === 2 ? 'primary.main' : 'text.secondary',
                  borderBottom: selectedTab === 2 ? 2 : 0,
                  borderColor: 'primary.main',
                  borderRadius: 0,
                }}
                startIcon={<KeyIcon />}
              >
                Backup-Codes
              </Button>
              <Button
                onClick={() => setSelectedTab(3)}
                sx={{
                  flex: 1,
                  py: 2,
                  color: selectedTab === 3 ? 'primary.main' : 'text.secondary',
                  borderBottom: selectedTab === 3 ? 2 : 0,
                  borderColor: 'primary.main',
                  borderRadius: 0,
                }}
                startIcon={<HistoryIcon />}
              >
                Sicherheitsereignisse
              </Button>
            </Box>
          </Box>
        </Paper>
      </SlideInContainer>

      {/* Tab Content */}
      <SlideInContainer delay={600}>
        {selectedTab === 0 && renderMFAMethods()}
        {selectedTab === 1 && renderTrustedDevices()}
        {selectedTab === 2 && renderBackupCodes()}
        {selectedTab === 3 && renderSecurityEvents()}
      </SlideInContainer>

      {/* Setup Dialog */}
      <Dialog
        open={isSetupDialogOpen}
        onClose={() => setIsSetupDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Neue MFA-Methode einrichten
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={setupStep} orientation="vertical">
            <Step>
              <StepLabel>Methode auswählen</StepLabel>
              <StepContent>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>MFA-Methode</InputLabel>
                  <Select
                    value={selectedMethodType}
                    onChange={(e) => setSelectedMethodType(e.target.value as MFAMethod['type'])}
                  >
                    <MenuItem value="totp">Authenticator App (empfohlen)</MenuItem>
                    <MenuItem value="sms">SMS Verification</MenuItem>
                    <MenuItem value="email">Email Verification</MenuItem>
                    <MenuItem value="backup_codes">Backup Codes</MenuItem>
                  </Select>
                </FormControl>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={() => setSetupStep(1)}
                  >
                    Weiter
                  </Button>
                  <Button onClick={() => setIsSetupDialogOpen(false)}>
                    Abbrechen
                  </Button>
                </Box>
              </StepContent>
            </Step>
            
            <Step>
              <StepLabel>Konfiguration</StepLabel>
              <StepContent>
                {selectedMethodType === 'totp' && (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      Scannen Sie den QR-Code mit Ihrer Authenticator-App:
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                      <Paper elevation={1} sx={{ p: 2 }}>
                        <Box sx={{ width: 200, height: 200, backgroundColor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <QrCodeIcon sx={{ fontSize: 100, color: 'grey.500' }} />
                        </Box>
                      </Paper>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Geheimer Schlüssel (manuell): JBSWY3DPEHPK3PXP
                    </Typography>
                  </Box>
                )}
                
                {selectedMethodType === 'sms' && (
                  <TextField
                    fullWidth
                    label="Telefonnummer"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+49 151 12345678"
                    sx={{ mb: 2 }}
                  />
                )}
                
                {selectedMethodType === 'email' && (
                  <TextField
                    fullWidth
                    label="E-Mail-Adresse"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    sx={{ mb: 2 }}
                  />
                )}
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={() => setSetupStep(2)}
                  >
                    Weiter
                  </Button>
                  <Button onClick={() => setSetupStep(0)}>
                    Zurück
                  </Button>
                </Box>
              </StepContent>
            </Step>
            
            <Step>
              <StepLabel>Verifizierung</StepLabel>
              <StepContent>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Geben Sie den Code aus Ihrer App ein:
                </Typography>
                
                <TextField
                  fullWidth
                  label="Verifizierungscode"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="123456"
                  sx={{ mb: 2 }}
                />
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={setupMFAMethod}
                    disabled={isSettingUp || !verificationCode}
                    startIcon={isSettingUp ? <CircularProgress size={16} /> : undefined}
                  >
                    {isSettingUp ? 'Einrichten...' : 'Abschließen'}
                  </Button>
                  <Button onClick={() => setSetupStep(1)}>
                    Zurück
                  </Button>
                </Box>
              </StepContent>
            </Step>
          </Stepper>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default MultiFactorAuthentication;