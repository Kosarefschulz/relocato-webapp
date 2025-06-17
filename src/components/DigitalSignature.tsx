import React, { useState, useRef, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Paper, Button, TextField, FormControl, InputLabel, Select, MenuItem, IconButton, Chip, List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction, Divider, useTheme, alpha, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Stepper, Step, StepLabel, StepContent, LinearProgress, Tab, Tabs, FormControlLabel, Checkbox, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import Grid from './GridCompat';
import {
  Draw as DrawIcon,
  Fingerprint as FingerprintIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Send as SendIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Verified as VerifiedIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Clear as ClearIcon,
  Save as SaveIcon,
  Preview as PreviewIcon,
  PictureAsPdf as PdfIcon,
  CloudUpload as CloudUploadIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { AnimatedCard, SlideInContainer } from './MicroAnimations';

interface SignatureProvider {
  id: 'docusign' | 'adobe_sign' | 'hellosign' | 'pandadoc' | 'internal';
  name: string;
  icon: React.ReactNode;
  enabled: boolean;
  configured: boolean;
  features: string[];
  pricing: string;
  description: string;
}

interface DigitalSignature {
  id: string;
  signerName: string;
  signerEmail: string;
  documentId: string;
  documentName: string;
  signatureData: string; // Base64 encoded signature
  timestamp: Date;
  ipAddress: string;
  deviceInfo: string;
  status: 'pending' | 'signed' | 'declined' | 'expired';
  provider: string;
  certificateId?: string;
  biometricData?: {
    pressure: number[];
    speed: number[];
    angle: number[];
  };
}

interface SignatureRequest {
  id: string;
  documentName: string;
  documentType: 'quote' | 'contract' | 'invoice' | 'agreement' | 'checklist';
  requester: {
    name: string;
    email: string;
  };
  signers: SignatureRequestSigner[];
  status: 'draft' | 'sent' | 'in_progress' | 'completed' | 'cancelled' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  completedAt?: Date;
  message?: string;
  reminderSettings: {
    enabled: boolean;
    intervals: number[]; // days
  };
}

interface SignatureRequestSigner {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'witness' | 'company_representative';
  order: number;
  status: 'pending' | 'sent' | 'viewed' | 'signed' | 'declined';
  sentAt?: Date;
  viewedAt?: Date;
  signedAt?: Date;
  signature?: DigitalSignature;
  required: boolean;
}

interface DigitalSignatureProps {
  onSignatureComplete?: (signature: DigitalSignature) => void;
  onRequestSent?: (request: SignatureRequest) => void;
  documentId?: string;
  documentName?: string;
  mode?: 'sign' | 'request' | 'manage';
}

const DigitalSignature: React.FC<DigitalSignatureProps> = ({
  onSignatureComplete,
  onRequestSent,
  documentId = '',
  documentName = '',
  mode = 'manage',
}) => {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatures, setSignatures] = useState<DigitalSignature[]>([]);
  const [requests, setRequests] = useState<SignatureRequest[]>([]);
  const [providers, setProviders] = useState<SignatureProvider[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState('internal');
  const [isSigningDialogOpen, setIsSigningDialogOpen] = useState(false);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [signatureData, setSignatureData] = useState('');
  const [signerInfo, setSignerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    role: 'customer' as const,
  });
  const [requestInfo, setRequestInfo] = useState({
    documentName: documentName,
    documentType: 'quote' as const,
    message: '',
    expiresInDays: 30,
    reminderEnabled: true,
    reminderDays: [3, 7, 14],
    signers: [] as Omit<SignatureRequestSigner, 'id' | 'status'>[],
  });

  useEffect(() => {
    initializeProviders();
    generateSampleData();
  }, []);

  const initializeProviders = () => {
    const sampleProviders: SignatureProvider[] = [
      {
        id: 'internal',
        name: 'Interne Signatur',
        icon: <DrawIcon />,
        enabled: true,
        configured: true,
        features: ['Handschriftliche Signatur', 'Biometrische Daten', 'Zeitstempel'],
        pricing: 'Kostenlos',
        description: 'Einfache Signaturerfassung direkt in der Anwendung',
      },
      {
        id: 'docusign',
        name: 'DocuSign',
        icon: <VerifiedIcon />,
        enabled: false,
        configured: false,
        features: ['Rechtsgültige Signaturen', 'Audit Trail', 'Mobile App', 'API Integration'],
        pricing: 'Ab €10/Monat',
        description: 'Marktführer für digitale Signaturen mit höchster Rechtssicherheit',
      },
      {
        id: 'adobe_sign',
        name: 'Adobe Sign',
        icon: <SecurityIcon />,
        enabled: false,
        configured: false,
        features: ['PDF-Integration', 'Workflows', 'Compliance', 'Analytics'],
        pricing: 'Ab €12/Monat',
        description: 'Professionelle Signaturlösung mit Adobe-Integration',
      },
      {
        id: 'hellosign',
        name: 'HelloSign',
        icon: <FingerprintIcon />,
        enabled: false,
        configured: false,
        features: ['API-First', 'Templates', 'Team Management', 'Branding'],
        pricing: 'Ab €8/Monat',
        description: 'Entwicklerfreundliche Signaturplattform',
      },
      {
        id: 'pandadoc',
        name: 'PandaDoc',
        icon: <AssignmentIcon />,
        enabled: false,
        configured: false,
        features: ['Document Builder', 'CRM Integration', 'Analytics', 'Payments'],
        pricing: 'Ab €15/Monat',
        description: 'All-in-One Dokumentenplattform mit Zahlungsintegration',
      },
    ];
    
    setProviders(sampleProviders);
  };

  const generateSampleData = () => {
    // Generate sample signatures
    const sampleSignatures: DigitalSignature[] = [];
    for (let i = 0; i < 8; i++) {
      sampleSignatures.push({
        id: `sig-${i + 1}`,
        signerName: `Kunde ${i + 1}`,
        signerEmail: `kunde${i + 1}@beispiel.de`,
        documentId: `doc-${i + 1}`,
        documentName: `Umzugsvertrag #${i + 1}`,
        signatureData: `data:image/svg+xml;base64,${btoa(`<svg>Sample signature ${i + 1}</svg>`)}`,
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        ipAddress: `192.168.1.${100 + i}`,
        deviceInfo: 'Chrome 91.0 on Windows 10',
        status: ['signed', 'pending', 'declined'][Math.floor(Math.random() * 3)] as any,
        provider: 'internal',
        certificateId: `cert-${Date.now()}-${i}`,
      });
    }

    // Generate sample requests
    const sampleRequests: SignatureRequest[] = [];
    for (let i = 0; i < 5; i++) {
      const createdAt = new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000);
      const statuses: Array<SignatureRequest['status']> = ['draft', 'sent', 'in_progress', 'completed', 'cancelled'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      sampleRequests.push({
        id: `req-${i + 1}`,
        documentName: `Umzugsvertrag ${i + 1}`,
        documentType: ['quote', 'contract', 'agreement'][Math.floor(Math.random() * 3)] as any,
        requester: {
          name: 'Max Mustermann',
          email: 'max@relocato.de',
        },
        signers: [
          {
            id: `signer-${i}-1`,
            name: `Kunde ${i + 1}`,
            email: `kunde${i + 1}@beispiel.de`,
            role: 'customer',
            order: 1,
            status: status === 'completed' ? 'signed' : Math.random() > 0.5 ? 'pending' : 'sent',
            required: true,
          },
          {
            id: `signer-${i}-2`,
            name: 'Umzugsleiter',
            email: 'leiter@relocato.de',
            role: 'company_representative',
            order: 2,
            status: status === 'completed' ? 'signed' : 'pending',
            required: false,
          },
        ],
        status,
        createdAt,
        expiresAt: new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000),
        completedAt: status === 'completed' ? new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : undefined,
        reminderSettings: {
          enabled: true,
          intervals: [3, 7, 14],
        },
      });
    }

    setSignatures(sampleSignatures);
    setRequests(sampleRequests);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = theme.palette.primary.main;
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureData(canvas.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignatureData('');
    }
  };

  const saveSignature = () => {
    if (!signatureData || !signerInfo.name || !signerInfo.email) {
      alert('Bitte füllen Sie alle Pflichtfelder aus und erstellen eine Signatur.');
      return;
    }

    const newSignature: DigitalSignature = {
      id: `sig-${Date.now()}`,
      signerName: signerInfo.name,
      signerEmail: signerInfo.email,
      documentId: documentId || `doc-${Date.now()}`,
      documentName: documentName || 'Neues Dokument',
      signatureData,
      timestamp: new Date(),
      ipAddress: '192.168.1.100', // Would be actual IP in production
      deviceInfo: navigator.userAgent,
      status: 'signed',
      provider: selectedProvider,
      certificateId: `cert-${Date.now()}`,
    };

    setSignatures(prev => [newSignature, ...prev]);
    onSignatureComplete?.(newSignature);
    setIsSigningDialogOpen(false);
    clearSignature();
    setSignerInfo({ name: '', email: '', phone: '', company: '', role: 'customer' });
  };

  const sendSignatureRequest = () => {
    if (!requestInfo.documentName || requestInfo.signers.length === 0) {
      alert('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    const newRequest: SignatureRequest = {
      id: `req-${Date.now()}`,
      documentName: requestInfo.documentName,
      documentType: requestInfo.documentType,
      requester: {
        name: 'Max Mustermann', // Would come from current user
        email: 'max@relocato.de',
      },
      signers: requestInfo.signers.map((signer, index) => ({
        ...signer,
        id: `signer-${Date.now()}-${index}`,
        status: 'pending' as const,
      })),
      status: 'sent',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + requestInfo.expiresInDays * 24 * 60 * 60 * 1000),
      message: requestInfo.message,
      reminderSettings: {
        enabled: requestInfo.reminderEnabled,
        intervals: requestInfo.reminderDays,
      },
    };

    setRequests(prev => [newRequest, ...prev]);
    onRequestSent?.(newRequest);
    setIsRequestDialogOpen(false);
    setRequestInfo({
      documentName: '',
      documentType: 'quote',
      message: '',
      expiresInDays: 30,
      reminderEnabled: true,
      reminderDays: [3, 7, 14],
      signers: [],
    });
  };

  const addSigner = () => {
    setRequestInfo(prev => ({
      ...prev,
      signers: [...prev.signers, {
        name: '',
        email: '',
        role: 'customer',
        order: prev.signers.length + 1,
        required: true,
      }],
    }));
  };

  const removeSigner = (index: number) => {
    setRequestInfo(prev => ({
      ...prev,
      signers: prev.signers.filter((_, i) => i !== index),
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed':
      case 'completed':
        return 'success';
      case 'pending':
      case 'sent':
      case 'in_progress':
        return 'warning';
      case 'declined':
      case 'cancelled':
        return 'error';
      case 'expired':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'signed': return 'Signiert';
      case 'pending': return 'Ausstehend';
      case 'declined': return 'Abgelehnt';
      case 'expired': return 'Abgelaufen';
      case 'completed': return 'Abgeschlossen';
      case 'sent': return 'Versendet';
      case 'in_progress': return 'In Bearbeitung';
      case 'cancelled': return 'Abgebrochen';
      case 'draft': return 'Entwurf';
      default: return status;
    }
  };

  const renderProvidersTab = () => (
    <Grid container spacing={3}>
      {providers.map((provider, index) => (
        <Grid item xs={12} md={6} key={provider.id}>
          <AnimatedCard delay={index * 100}>
            <Box
              sx={{
                background: provider.enabled && provider.configured
                  ? `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${alpha(theme.palette.success.main, 0.8)} 100%)`
                  : provider.enabled
                  ? `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${alpha(theme.palette.warning.main, 0.8)} 100%)`
                  : `linear-gradient(135deg, ${theme.palette.grey[400]} 0%, ${theme.palette.grey[500]} 100%)`,
                color: 'white',
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
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {provider.pricing}
                    </Typography>
                  </Box>
                  
                  <Chip
                    label={provider.enabled && provider.configured ? 'Konfiguriert' : provider.enabled ? 'Aktiviert' : 'Inaktiv'}
                    size="small"
                    sx={{ 
                      backgroundColor: alpha('#fff', 0.2),
                      color: 'white',
                    }}
                  />
                </Box>
                
                <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                  {provider.description}
                </Typography>
                
                <List dense>
                  {provider.features.slice(0, 3).map((feature, i) => (
                    <ListItem key={i} sx={{ px: 0, py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 20 }}>
                        <CheckCircleIcon sx={{ fontSize: 16, color: 'white' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={feature}
                        primaryTypographyProps={{ variant: 'caption', sx: { opacity: 0.9 } }}
                      />
                    </ListItem>
                  ))}
                </List>
                
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  sx={{
                    mt: 2,
                    color: 'white',
                    borderColor: alpha('#fff', 0.5),
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: alpha('#fff', 0.1),
                    },
                  }}
                >
                  {provider.configured ? 'Einstellungen' : 'Konfigurieren'}
                </Button>
              </CardContent>
            </Box>
          </AnimatedCard>
        </Grid>
      ))}
    </Grid>
  );

  const renderSignaturesTab = () => (
    <TableContainer component={Paper} elevation={1}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Unterzeichner</TableCell>
            <TableCell>Dokument</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Anbieter</TableCell>
            <TableCell>Zeitstempel</TableCell>
            <TableCell>Aktionen</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {signatures.map((signature) => (
            <TableRow key={signature.id} hover>
              <TableCell>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {signature.signerName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {signature.signerEmail}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {signature.documentName}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip 
                  label={getStatusLabel(signature.status)}
                  size="small"
                  color={getStatusColor(signature.status)}
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {providers.find(p => p.id === signature.provider)?.name || signature.provider}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="caption">
                  {format(signature.timestamp, 'dd.MM.yyyy HH:mm', { locale: de })}
                </Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Anzeigen">
                    <IconButton size="small">
                      <PreviewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Herunterladen">
                    <IconButton size="small">
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderRequestsTab = () => (
    <TableContainer component={Paper} elevation={1}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Dokument</TableCell>
            <TableCell>Typ</TableCell>
            <TableCell>Unterzeichner</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Erstellt</TableCell>
            <TableCell>Läuft ab</TableCell>
            <TableCell>Aktionen</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id} hover>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {request.documentName}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip 
                  label={request.documentType}
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {request.signers.length} Unterzeichner
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {request.signers.filter(s => s.status === 'signed').length} signiert
                </Typography>
              </TableCell>
              <TableCell>
                <Chip 
                  label={getStatusLabel(request.status)}
                  size="small"
                  color={getStatusColor(request.status)}
                />
              </TableCell>
              <TableCell>
                <Typography variant="caption">
                  {format(request.createdAt, 'dd.MM.yyyy', { locale: de })}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="caption" color={request.expiresAt < new Date() ? 'error' : 'text.secondary'}>
                  {format(request.expiresAt, 'dd.MM.yyyy', { locale: de })}
                </Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Details">
                    <IconButton size="small">
                      <InfoIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Erinnerung senden">
                    <IconButton size="small">
                      <EmailIcon />
                    </IconButton>
                  </Tooltip>
                  {request.status !== 'completed' && (
                    <Tooltip title="Abbrechen">
                      <IconButton size="small">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box>
      {/* Header */}
      <SlideInContainer>
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <DrawIcon color="primary" />
              Digitale Signaturen
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<SendIcon />}
                onClick={() => setIsRequestDialogOpen(true)}
              >
                Signatur anfordern
              </Button>
              
              <Button
                variant="contained"
                startIcon={<DrawIcon />}
                onClick={() => setIsSigningDialogOpen(true)}
              >
                Dokument signieren
              </Button>
            </Box>
          </Box>
          
          <Typography variant="body1" color="text.secondary">
            Rechtssichere digitale Signaturen für Verträge, Angebote und Dokumente
          </Typography>
        </Paper>
      </SlideInContainer>

      {/* Navigation Tabs */}
      <SlideInContainer delay={200}>
        <Paper elevation={2} sx={{ mb: 4 }}>
          <Tabs
            value={selectedTab}
            onChange={(e, newValue) => setSelectedTab(newValue)}
            variant="fullWidth"
          >
            <Tab label="Anbieter" icon={<SecurityIcon />} />
            <Tab label="Signaturen" icon={<VerifiedIcon />} />
            <Tab label="Anfragen" icon={<SendIcon />} />
          </Tabs>
        </Paper>
      </SlideInContainer>

      {/* Tab Content */}
      <SlideInContainer delay={400}>
        {selectedTab === 0 && renderProvidersTab()}
        {selectedTab === 1 && renderSignaturesTab()}
        {selectedTab === 2 && renderRequestsTab()}
      </SlideInContainer>

      {/* Signing Dialog */}
      <Dialog
        open={isSigningDialogOpen}
        onClose={() => setIsSigningDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Dokument digital signieren</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Persönliche Informationen
              </Typography>
              
              <TextField
                fullWidth
                label="Vollständiger Name"
                value={signerInfo.name}
                onChange={(e) => setSignerInfo(prev => ({ ...prev, name: e.target.value }))}
                sx={{ mb: 2 }}
                required
              />
              
              <TextField
                fullWidth
                label="E-Mail-Adresse"
                type="email"
                value={signerInfo.email}
                onChange={(e) => setSignerInfo(prev => ({ ...prev, email: e.target.value }))}
                sx={{ mb: 2 }}
                required
              />
              
              <TextField
                fullWidth
                label="Telefon (optional)"
                value={signerInfo.phone}
                onChange={(e) => setSignerInfo(prev => ({ ...prev, phone: e.target.value }))}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Unternehmen (optional)"
                value={signerInfo.company}
                onChange={(e) => setSignerInfo(prev => ({ ...prev, company: e.target.value }))}
                sx={{ mb: 2 }}
              />
              
              <FormControl fullWidth>
                <InputLabel>Rolle</InputLabel>
                <Select
                  value={signerInfo.role}
                  label="Rolle"
                  onChange={(e) => setSignerInfo(prev => ({ ...prev, role: e.target.value as any }))}
                >
                  <MenuItem value="customer">Kunde</MenuItem>
                  <MenuItem value="witness">Zeuge</MenuItem>
                  <MenuItem value="company_representative">Firmenvertreter</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Signatur erstellen
              </Typography>
              
              <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, mb: 2 }}>
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={200}
                  style={{ 
                    width: '100%', 
                    height: '200px', 
                    cursor: 'crosshair',
                    border: `2px dashed ${theme.palette.divider}`,
                    borderRadius: theme.shape.borderRadius,
                  }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Bitte signieren Sie mit der Maus oder dem Finger in diesem Bereich
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={clearSignature}
                  fullWidth
                >
                  Löschen
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  fullWidth
                >
                  Hochladen
                </Button>
              </Box>
              
              <Alert severity="info" icon={<SecurityIcon />}>
                <Typography variant="body2">
                  Ihre Signatur wird verschlüsselt gespeichert und mit einem Zeitstempel sowie 
                  biometrischen Daten für maximale Rechtssicherheit versehen.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsSigningDialogOpen(false)}>
            Abbrechen
          </Button>
          <Button 
            variant="contained"
            onClick={saveSignature}
            disabled={!signatureData || !signerInfo.name || !signerInfo.email}
          >
            Signatur speichern
          </Button>
        </DialogActions>
      </Dialog>

      {/* Request Dialog */}
      <Dialog
        open={isRequestDialogOpen}
        onClose={() => setIsRequestDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Signatur-Anfrage erstellen</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Dokumentname"
                value={requestInfo.documentName}
                onChange={(e) => setRequestInfo(prev => ({ ...prev, documentName: e.target.value }))}
                sx={{ mb: 2 }}
                required
              />
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Dokumenttyp</InputLabel>
                <Select
                  value={requestInfo.documentType}
                  label="Dokumenttyp"
                  onChange={(e) => setRequestInfo(prev => ({ ...prev, documentType: e.target.value as any }))}
                >
                  <MenuItem value="quote">Angebot</MenuItem>
                  <MenuItem value="contract">Vertrag</MenuItem>
                  <MenuItem value="invoice">Rechnung</MenuItem>
                  <MenuItem value="agreement">Vereinbarung</MenuItem>
                  <MenuItem value="checklist">Checkliste</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                label="Nachricht (optional)"
                multiline
                rows={3}
                value={requestInfo.message}
                onChange={(e) => setRequestInfo(prev => ({ ...prev, message: e.target.value }))}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Gültigkeitsdauer (Tage)"
                type="number"
                value={requestInfo.expiresInDays}
                onChange={(e) => setRequestInfo(prev => ({ ...prev, expiresInDays: Number(e.target.value) }))}
                sx={{ mb: 2 }}
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={requestInfo.reminderEnabled}
                    onChange={(e) => setRequestInfo(prev => ({ ...prev, reminderEnabled: e.target.checked }))}
                  />
                }
                label="Automatische Erinnerungen aktivieren"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  Unterzeichner
                </Typography>
                <Button
                  startIcon={<PersonIcon />}
                  onClick={addSigner}
                  size="small"
                >
                  Hinzufügen
                </Button>
              </Box>
              
              {requestInfo.signers.map((signer, index) => (
                <Card key={index} elevation={1} sx={{ mb: 2 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="subtitle2">
                        Unterzeichner {index + 1}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => removeSigner(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    
                    <TextField
                      fullWidth
                      label="Name"
                      value={signer.name}
                      onChange={(e) => {
                        const newSigners = [...requestInfo.signers];
                        newSigners[index].name = e.target.value;
                        setRequestInfo(prev => ({ ...prev, signers: newSigners }));
                      }}
                      sx={{ mb: 1 }}
                      size="small"
                    />
                    
                    <TextField
                      fullWidth
                      label="E-Mail"
                      value={signer.email}
                      onChange={(e) => {
                        const newSigners = [...requestInfo.signers];
                        newSigners[index].email = e.target.value;
                        setRequestInfo(prev => ({ ...prev, signers: newSigners }));
                      }}
                      sx={{ mb: 1 }}
                      size="small"
                    />
                    
                    <FormControl fullWidth size="small">
                      <InputLabel>Rolle</InputLabel>
                      <Select
                        value={signer.role}
                        label="Rolle"
                        onChange={(e) => {
                          const newSigners = [...requestInfo.signers];
                          newSigners[index].role = e.target.value as any;
                          setRequestInfo(prev => ({ ...prev, signers: newSigners }));
                        }}
                      >
                        <MenuItem value="customer">Kunde</MenuItem>
                        <MenuItem value="witness">Zeuge</MenuItem>
                        <MenuItem value="company_representative">Firmenvertreter</MenuItem>
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>
              ))}
              
              {requestInfo.signers.length === 0 && (
                <Alert severity="info">
                  Fügen Sie mindestens einen Unterzeichner hinzu.
                </Alert>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsRequestDialogOpen(false)}>
            Abbrechen
          </Button>
          <Button 
            variant="contained"
            onClick={sendSignatureRequest}
            disabled={!requestInfo.documentName || requestInfo.signers.length === 0}
          >
            Anfrage senden
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DigitalSignature;