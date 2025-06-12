import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Tab,
  Tabs,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  CircularProgress,
  Checkbox,
  FormGroup,
  RadioGroup,
  Radio,
  FormLabel,
  Badge,
  Avatar,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Gavel as GavelIcon,
  Shield as ShieldIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  FileCopy as FileCopyIcon,
  History as HistoryIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  Description as DescriptionIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  ExpandMore as ExpandMoreIcon,
  Verified as VerifiedIcon,
  Report as ReportIcon,
  Policy as PolicyIcon,
  PrivacyTip as PrivacyTipIcon,
  Backup as BackupIcon,
  RestoreFromTrash as RestoreIcon,
  CancelPresentation as DenyIcon,
  TaskAlt as TaskAltIcon,
  AccountBox as AccountBoxIcon,
  ContactMail as ContactMailIcon,
  Fingerprint as FingerprintIcon,
  DataUsage as DataUsageIcon,
  Storage as StorageIcon,
  CloudDownload as CloudDownloadIcon,
} from '@mui/icons-material';
import { format, addDays, addMonths, differenceInDays, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AnimatedCard, SlideInContainer } from './MicroAnimations';

interface DataSubject {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: Date;
  address?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  customerNumber?: string;
  status: 'active' | 'inactive' | 'deleted' | 'anonymized';
  registeredAt: Date;
  lastLogin?: Date;
  consentRecords: ConsentRecord[];
  dataCategories: string[];
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
  retentionPeriod: number; // months
  scheduledDeletion?: Date;
  dataPortabilityRequests: DataPortabilityRequest[];
  accessRequests: AccessRequest[];
}

interface ConsentRecord {
  id: string;
  subjectId: string;
  purpose: string;
  category: 'marketing' | 'analytics' | 'functional' | 'essential' | 'third_party';
  status: 'granted' | 'withdrawn' | 'expired';
  grantedAt: Date;
  withdrawnAt?: Date;
  expiresAt?: Date;
  version: string;
  source: 'website' | 'email' | 'phone' | 'contract' | 'api';
  ipAddress?: string;
  userAgent?: string;
  evidence: {
    method: 'checkbox' | 'signature' | 'email_confirmation' | 'verbal' | 'contract_signing';
    details: string;
    documentUrl?: string;
  };
  processingActivities: string[];
  thirdParties?: string[];
}

interface DataPortabilityRequest {
  id: string;
  subjectId: string;
  requestedAt: Date;
  completedAt?: Date;
  status: 'pending' | 'processing' | 'completed' | 'rejected' | 'expired';
  requestedData: string[];
  format: 'json' | 'csv' | 'xml' | 'pdf';
  deliveryMethod: 'download' | 'email' | 'secure_link';
  downloadUrl?: string;
  expiresAt: Date;
  rejectionReason?: string;
  processingNotes?: string;
}

interface AccessRequest {
  id: string;
  subjectId: string;
  requestType: 'access' | 'rectification' | 'erasure' | 'restriction' | 'objection' | 'portability';
  requestedAt: Date;
  responseDeadline: Date;
  completedAt?: Date;
  status: 'pending' | 'in_review' | 'completed' | 'rejected' | 'requires_identity_verification';
  description: string;
  requestedData?: string[];
  correctionDetails?: Record<string, any>;
  legalBasis?: string;
  rejectionReason?: string;
  processingNotes?: string;
  assignedTo?: string;
  identityVerified: boolean;
  verificationMethod?: 'id_document' | 'email_confirmation' | 'phone_verification' | 'in_person';
  documents: string[];
}

interface ProcessingActivity {
  id: string;
  name: string;
  description: string;
  controller: string;
  processor?: string;
  purposes: string[];
  legalBasis: string[];
  dataCategories: string[];
  recipients: string[];
  retentionPeriod: string;
  securityMeasures: string[];
  riskAssessment: {
    level: 'low' | 'medium' | 'high' | 'very_high';
    description: string;
    mitigationMeasures: string[];
    lastReview: Date;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface DataBreach {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  breachType: 'confidentiality' | 'integrity' | 'availability' | 'combined';
  discoveredAt: Date;
  reportedAt?: Date;
  affectedSubjects: number;
  dataCategories: string[];
  causeCategory: 'technical' | 'human_error' | 'malicious' | 'natural_disaster' | 'system_failure';
  cause: string;
  impact: string;
  containmentMeasures: string[];
  notificationRequired: boolean;
  notificationDeadline?: Date;
  supervisoryAuthorityNotified: boolean;
  subjectsNotified: boolean;
  status: 'discovered' | 'investigating' | 'contained' | 'resolved' | 'reported';
  assignedTo: string;
  timeline: Array<{
    timestamp: Date;
    action: string;
    description: string;
    performedBy: string;
  }>;
}

interface ComplianceMetrics {
  totalSubjects: number;
  activeConsents: number;
  withdrawnConsents: number;
  pendingRequests: number;
  completedRequests: number;
  averageResponseTime: number; // hours
  complianceScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastAudit: Date;
  nextAudit: Date;
  dataBreaches: {
    total: number;
    thisMonth: number;
    resolved: number;
    pending: number;
  };
  retentionCompliance: {
    total: number;
    compliant: number;
    overdue: number;
    scheduledDeletion: number;
  };
}

interface GDPRComplianceToolsProps {
  onRequestSubmitted?: (request: AccessRequest) => void;
  onConsentChanged?: (consent: ConsentRecord) => void;
  onBreachReported?: (breach: DataBreach) => void;
  onDataExported?: (request: DataPortabilityRequest) => void;
}

const GDPRComplianceTools: React.FC<GDPRComplianceToolsProps> = ({
  onRequestSubmitted,
  onConsentChanged,
  onBreachReported,
  onDataExported,
}) => {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState(0);
  const [dataSubjects, setDataSubjects] = useState<DataSubject[]>([]);
  const [consentRecords, setConsentRecords] = useState<ConsentRecord[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [portabilityRequests, setPortabilityRequests] = useState<DataPortabilityRequest[]>([]);
  const [processingActivities, setProcessingActivities] = useState<ProcessingActivity[]>([]);
  const [dataBreaches, setDataBreaches] = useState<DataBreach[]>([]);
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<DataSubject | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [selectedBreach, setSelectedBreach] = useState<DataBreach | null>(null);
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isBreachDialogOpen, setIsBreachDialogOpen] = useState(false);
  const [isConsentDialogOpen, setIsConsentDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    status: 'all',
    dataCategory: 'all',
    legalBasis: 'all',
    consentStatus: 'all',
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    dateTo: new Date(),
  });

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = () => {
    // Initialize sample data subjects
    const sampleSubjects: DataSubject[] = [
      {
        id: 'subject-1',
        firstName: 'Max',
        lastName: 'Mustermann',
        email: 'max.mustermann@example.com',
        phone: '+49 30 12345678',
        dateOfBirth: new Date('1985-03-15'),
        address: {
          street: 'Musterstraße 123',
          city: 'Berlin',
          postalCode: '10115',
          country: 'Deutschland',
        },
        customerNumber: 'CUST-001',
        status: 'active',
        registeredAt: new Date('2023-01-15'),
        lastLogin: new Date('2024-12-05'),
        consentRecords: [],
        dataCategories: ['personal_data', 'contact_data', 'contract_data', 'payment_data'],
        legalBasis: 'contract',
        retentionPeriod: 84, // 7 years
        dataPortabilityRequests: [],
        accessRequests: [],
      },
      {
        id: 'subject-2',
        firstName: 'Anna',
        lastName: 'Schmidt',
        email: 'anna.schmidt@example.com',
        phone: '+49 30 98765432',
        status: 'active',
        registeredAt: new Date('2023-06-20'),
        lastLogin: new Date('2024-12-04'),
        consentRecords: [],
        dataCategories: ['personal_data', 'contact_data', 'marketing_data'],
        legalBasis: 'consent',
        retentionPeriod: 36, // 3 years
        scheduledDeletion: new Date('2026-06-20'),
        dataPortabilityRequests: [],
        accessRequests: [],
      },
      {
        id: 'subject-3',
        firstName: 'Thomas',
        lastName: 'Weber',
        email: 'thomas.weber@example.com',
        status: 'anonymized',
        registeredAt: new Date('2022-08-10'),
        consentRecords: [],
        dataCategories: ['anonymized_data'],
        legalBasis: 'legitimate_interests',
        retentionPeriod: 12,
        dataPortabilityRequests: [],
        accessRequests: [],
      },
    ];

    // Initialize consent records
    const sampleConsents: ConsentRecord[] = [
      {
        id: 'consent-1',
        subjectId: 'subject-1',
        purpose: 'Direktmarketing per E-Mail',
        category: 'marketing',
        status: 'granted',
        grantedAt: new Date('2023-01-15'),
        version: '1.0',
        source: 'website',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        evidence: {
          method: 'checkbox',
          details: 'Nutzer hat Checkbox für Marketing-E-Mails aktiviert',
        },
        processingActivities: ['email_marketing', 'newsletter'],
      },
      {
        id: 'consent-2',
        subjectId: 'subject-2',
        purpose: 'Analytics und Webseiten-Optimierung',
        category: 'analytics',
        status: 'withdrawn',
        grantedAt: new Date('2023-06-20'),
        withdrawnAt: new Date('2024-08-15'),
        version: '1.1',
        source: 'website',
        evidence: {
          method: 'checkbox',
          details: 'Nutzer hat Analytics-Tracking zugestimmt, später widerrufen',
        },
        processingActivities: ['web_analytics', 'user_behavior_tracking'],
        thirdParties: ['Google Analytics', 'Hotjar'],
      },
    ];

    // Initialize access requests
    const sampleRequests: AccessRequest[] = [
      {
        id: 'req-1',
        subjectId: 'subject-1',
        requestType: 'access',
        requestedAt: new Date('2024-11-25'),
        responseDeadline: new Date('2024-12-25'),
        status: 'pending',
        description: 'Anfrage auf Auskunft über gespeicherte personenbezogene Daten',
        identityVerified: false,
        documents: [],
      },
      {
        id: 'req-2',
        subjectId: 'subject-2',
        requestType: 'erasure',
        requestedAt: new Date('2024-11-20'),
        responseDeadline: new Date('2024-12-20'),
        completedAt: new Date('2024-11-28'),
        status: 'completed',
        description: 'Löschung aller personenbezogenen Daten nach Vertragsende',
        identityVerified: true,
        verificationMethod: 'email_confirmation',
        documents: ['deletion_confirmation.pdf'],
      },
      {
        id: 'req-3',
        subjectId: 'subject-1',
        requestType: 'rectification',
        requestedAt: new Date('2024-10-15'),
        responseDeadline: new Date('2024-11-15'),
        completedAt: new Date('2024-10-20'),
        status: 'completed',
        description: 'Korrektur der Adressdaten',
        correctionDetails: {
          address: 'Neue Adresse: Beispielstraße 456, 12345 Berlin',
        },
        identityVerified: true,
        verificationMethod: 'id_document',
        documents: ['address_correction.pdf'],
      },
    ];

    // Initialize processing activities
    const sampleActivities: ProcessingActivity[] = [
      {
        id: 'activity-1',
        name: 'Kundenverwaltung',
        description: 'Verwaltung von Kundenstammdaten für Vertragsabwicklung',
        controller: 'Relocato GmbH',
        purposes: ['Vertragserfüllung', 'Kundenbetreuung', 'Rechnungsstellung'],
        legalBasis: ['Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)'],
        dataCategories: ['Stammdaten', 'Kontaktdaten', 'Vertragsdaten'],
        recipients: ['Buchhaltung', 'Kundenservice'],
        retentionPeriod: '7 Jahre nach Vertragsende',
        securityMeasures: ['Verschlüsselung', 'Zugriffskontrolle', 'Backup'],
        riskAssessment: {
          level: 'medium',
          description: 'Moderate Risiken durch umfangreiche Kundendaten',
          mitigationMeasures: ['Regelmäßige Sicherheitsupdates', 'Mitarbeiterschulungen'],
          lastReview: new Date('2024-06-01'),
        },
        isActive: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2024-06-01'),
      },
      {
        id: 'activity-2',
        name: 'E-Mail Marketing',
        description: 'Versendung von Marketing-E-Mails an einwilligende Kunden',
        controller: 'Relocato GmbH',
        processor: 'Mailchimp (Intuit Inc.)',
        purposes: ['Direktmarketing', 'Kundenbindung'],
        legalBasis: ['Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)'],
        dataCategories: ['E-Mail-Adresse', 'Name', 'Präferenzen'],
        recipients: ['Marketing-Team', 'E-Mail Service Provider'],
        retentionPeriod: 'Bis zum Widerruf der Einwilligung',
        securityMeasures: ['TLS-Verschlüsselung', 'Opt-out Mechanismus'],
        riskAssessment: {
          level: 'low',
          description: 'Geringe Risiken bei freiwilliger Teilnahme',
          mitigationMeasures: ['Einfacher Abmeldeprozess', 'Transparente Datenschutzerklärung'],
          lastReview: new Date('2024-08-15'),
        },
        isActive: true,
        createdAt: new Date('2023-03-01'),
        updatedAt: new Date('2024-08-15'),
      },
    ];

    // Initialize data breaches
    const sampleBreaches: DataBreach[] = [
      {
        id: 'breach-1',
        title: 'Unauthorized Database Access',
        description: 'Unberechtigter Zugriff auf Kundendatenbank durch schwaches Passwort',
        severity: 'high',
        breachType: 'confidentiality',
        discoveredAt: new Date('2024-11-15T14:30:00'),
        reportedAt: new Date('2024-11-15T16:00:00'),
        affectedSubjects: 1250,
        dataCategories: ['Namen', 'E-Mail-Adressen', 'Telefonnummern'],
        causeCategory: 'human_error',
        cause: 'Schwaches Passwort eines Administrators',
        impact: 'Potentieller Zugriff auf Kundenkontaktdaten',
        containmentMeasures: [
          'Sofortige Passwort-Änderung',
          'Deaktivierung des betroffenen Accounts',
          'Sicherheitsüberprüfung aller Admin-Accounts',
        ],
        notificationRequired: true,
        notificationDeadline: new Date('2024-11-18T14:30:00'),
        supervisoryAuthorityNotified: true,
        subjectsNotified: false,
        status: 'contained',
        assignedTo: 'security@relocato.de',
        timeline: [
          {
            timestamp: new Date('2024-11-15T14:30:00'),
            action: 'Entdeckung',
            description: 'Verdächtige Datenbankzugriffe in Log-Dateien entdeckt',
            performedBy: 'IT-Admin',
          },
          {
            timestamp: new Date('2024-11-15T15:00:00'),
            action: 'Eindämmung',
            description: 'Betroffener Account deaktiviert',
            performedBy: 'Security Team',
          },
          {
            timestamp: new Date('2024-11-15T16:00:00'),
            action: 'Meldung',
            description: 'Datenschutzbehörde informiert',
            performedBy: 'Data Protection Officer',
          },
        ],
      },
    ];

    // Initialize metrics
    const sampleMetrics: ComplianceMetrics = {
      totalSubjects: sampleSubjects.length,
      activeConsents: sampleConsents.filter(c => c.status === 'granted').length,
      withdrawnConsents: sampleConsents.filter(c => c.status === 'withdrawn').length,
      pendingRequests: sampleRequests.filter(r => r.status === 'pending').length,
      completedRequests: sampleRequests.filter(r => r.status === 'completed').length,
      averageResponseTime: 72, // hours
      complianceScore: 87.5,
      riskLevel: 'medium',
      lastAudit: new Date('2024-06-01'),
      nextAudit: new Date('2025-06-01'),
      dataBreaches: {
        total: sampleBreaches.length,
        thisMonth: 1,
        resolved: 0,
        pending: 1,
      },
      retentionCompliance: {
        total: sampleSubjects.length,
        compliant: 2,
        overdue: 0,
        scheduledDeletion: 1,
      },
    };

    setDataSubjects(sampleSubjects);
    setConsentRecords(sampleConsents);
    setAccessRequests(sampleRequests.sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime()));
    setProcessingActivities(sampleActivities);
    setDataBreaches(sampleBreaches);
    setMetrics(sampleMetrics);
  };

  const processAccessRequest = async (requestId: string, action: 'approve' | 'reject', notes?: string) => {
    setIsProcessing(true);
    
    setTimeout(() => {
      setAccessRequests(prev => prev.map(request => {
        if (request.id === requestId) {
          return {
            ...request,
            status: action === 'approve' ? 'completed' : 'rejected',
            completedAt: new Date(),
            processingNotes: notes,
          };
        }
        return request;
      }));
      
      setIsProcessing(false);
      alert(`Anfrage erfolgreich ${action === 'approve' ? 'genehmigt' : 'abgelehnt'}!`);
    }, 2000);
  };

  const exportPersonalData = async (subjectId: string, format: 'json' | 'csv' | 'xml' | 'pdf') => {
    const subject = dataSubjects.find(s => s.id === subjectId);
    if (!subject) return;

    const newRequest: DataPortabilityRequest = {
      id: `export-${Date.now()}`,
      subjectId,
      requestedAt: new Date(),
      status: 'processing',
      requestedData: subject.dataCategories,
      format,
      deliveryMethod: 'download',
      expiresAt: addDays(new Date(), 7),
    };

    setPortabilityRequests(prev => [newRequest, ...prev]);

    // Simulate export process
    setTimeout(() => {
      const completedRequest = {
        ...newRequest,
        status: 'completed' as const,
        completedAt: new Date(),
        downloadUrl: `/exports/personal_data_${subjectId}_${Date.now()}.${format}`,
      };

      setPortabilityRequests(prev => prev.map(req => 
        req.id === newRequest.id ? completedRequest : req
      ));

      onDataExported?.(completedRequest);
      alert('Datenexport erfolgreich erstellt! Download-Link wurde generiert.');
    }, 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'completed': return 'success';
      case 'rejected': return 'error';
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'granted': return 'success';
      case 'withdrawn': return 'error';
      case 'expired': return 'warning';
      default: return 'default';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return theme.palette.success.main;
      case 'medium': return theme.palette.warning.main;
      case 'high': return theme.palette.error.main;
      case 'critical': return theme.palette.error.dark;
      default: return theme.palette.grey[500];
    }
  };

  const renderDataSubjectsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Betroffene Personen
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsSubjectDialogOpen(true)}
        >
          Person hinzufügen
        </Button>
      </Box>

      <Grid container spacing={3}>
        {dataSubjects.map((subject, index) => (
          <Grid item xs={12} md={6} lg={4} key={subject.id}>
            <AnimatedCard delay={index * 100}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
                    {subject.firstName[0]}{subject.lastName[0]}
                  </Avatar>
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {subject.status === 'anonymized' ? 'Anonymisiert' : `${subject.firstName} ${subject.lastName}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {subject.status === 'anonymized' ? 'Daten anonymisiert' : subject.email}
                    </Typography>
                  </Box>
                  
                  <Chip 
                    label={subject.status} 
                    size="small" 
                    color={getStatusColor(subject.status)}
                  />
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Rechtsgrundlage: {subject.legalBasis}
                  </Typography>
                  <br />
                  <Typography variant="caption" color="text.secondary">
                    Aufbewahrung: {subject.retentionPeriod} Monate
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Datenkategorien:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {subject.dataCategories.slice(0, 3).map(category => (
                      <Chip key={category} label={category.replace('_', ' ')} size="small" variant="outlined" />
                    ))}
                    {subject.dataCategories.length > 3 && (
                      <Chip label={`+${subject.dataCategories.length - 3}`} size="small" variant="outlined" />
                    )}
                  </Box>
                </Box>
                
                {subject.scheduledDeletion && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="caption">
                      Löschung geplant: {format(subject.scheduledDeletion, 'dd.MM.yyyy')}
                    </Typography>
                  </Alert>
                )}
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setSelectedSubject(subject);
                      setIsSubjectDialogOpen(true);
                    }}
                    fullWidth
                  >
                    Details
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => exportPersonalData(subject.id, 'json')}
                    disabled={subject.status === 'anonymized'}
                  >
                    Export
                  </Button>
                </Box>
              </CardContent>
            </AnimatedCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderAccessRequestsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Betroffenenrechte-Anfragen
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsRequestDialogOpen(true)}
        >
          Neue Anfrage
        </Button>
      </Box>

      <List>
        {accessRequests.map((request) => {
          const subject = dataSubjects.find(s => s.id === request.subjectId);
          const isOverdue = request.responseDeadline < new Date() && request.status === 'pending';
          
          return (
            <React.Fragment key={request.id}>
              <ListItem sx={{ px: 0 }}>
                <Paper elevation={isOverdue ? 3 : 1} sx={{ 
                  width: '100%', 
                  p: 2,
                  border: isOverdue ? `2px solid ${theme.palette.error.main}` : 'none'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        backgroundColor: alpha(
                          request.requestType === 'access' ? theme.palette.info.main :
                          request.requestType === 'erasure' ? theme.palette.error.main :
                          request.requestType === 'rectification' ? theme.palette.warning.main :
                          theme.palette.primary.main, 
                          0.1
                        ),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {request.requestType === 'access' ? <VisibilityIcon color="info" /> :
                       request.requestType === 'erasure' ? <DeleteIcon color="error" /> :
                       request.requestType === 'rectification' ? <EditIcon color="warning" /> :
                       <DescriptionIcon color="primary" />}
                    </Box>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {request.requestType.charAt(0).toUpperCase() + request.requestType.slice(1)} - {subject?.firstName} {subject?.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {request.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Eingegangen: {format(request.requestedAt, 'dd.MM.yyyy HH:mm')} • 
                        Frist: {format(request.responseDeadline, 'dd.MM.yyyy')}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ textAlign: 'right' }}>
                      <Chip
                        label={request.status}
                        size="small"
                        color={getStatusColor(request.status)}
                      />
                      {isOverdue && (
                        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                          ÜBERFÄLLIG
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  
                  {!request.identityVerified && request.status === 'pending' && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      Identitätsprüfung steht noch aus
                    </Alert>
                  )}
                  
                  {request.status === 'pending' && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<CheckIcon />}
                        onClick={() => processAccessRequest(request.id, 'approve')}
                        disabled={isProcessing}
                      >
                        Genehmigen
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<CloseIcon />}
                        onClick={() => processAccessRequest(request.id, 'reject')}
                        disabled={isProcessing}
                      >
                        Ablehnen
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={() => {
                          setSelectedRequest(request);
                          setIsRequestDialogOpen(true);
                        }}
                      >
                        Details
                      </Button>
                    </Box>
                  )}
                  
                  {request.status === 'completed' && request.completedAt && (
                    <Typography variant="caption" color="success.main">
                      Abgeschlossen am {format(request.completedAt, 'dd.MM.yyyy HH:mm')}
                    </Typography>
                  )}
                </Paper>
              </ListItem>
            </React.Fragment>
          );
        })}
      </List>
    </Box>
  );

  const renderConsentManagementTab = () => (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Einwilligungsverwaltung
      </Typography>
      
      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Person</TableCell>
              <TableCell>Zweck</TableCell>
              <TableCell>Kategorie</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Erteilt am</TableCell>
              <TableCell>Quelle</TableCell>
              <TableCell>Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {consentRecords.map((consent) => {
              const subject = dataSubjects.find(s => s.id === consent.subjectId);
              
              return (
                <TableRow key={consent.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {subject ? `${subject.firstName} ${subject.lastName}` : 'Unbekannt'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {subject?.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {consent.purpose}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={consent.category}
                      size="small"
                      color={
                        consent.category === 'essential' ? 'success' :
                        consent.category === 'marketing' ? 'warning' :
                        consent.category === 'analytics' ? 'info' : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={consent.status}
                      size="small"
                      color={getStatusColor(consent.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(consent.grantedAt, 'dd.MM.yyyy')}
                    </Typography>
                    {consent.withdrawnAt && (
                      <Typography variant="caption" color="text.secondary">
                        Widerrufen: {format(consent.withdrawnAt, 'dd.MM.yyyy')}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {consent.source}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Details">
                        <IconButton
                          size="small"
                          onClick={() => {
                            // Open consent details dialog
                            setIsConsentDialogOpen(true);
                          }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      {consent.status === 'granted' && (
                        <Tooltip title="Widerrufen">
                          <IconButton size="small" color="error">
                            <CloseIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderDataBreachesTab = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Datenschutzverletzungen
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<ReportIcon />}
          onClick={() => setIsBreachDialogOpen(true)}
          color="error"
        >
          Verletzung melden
        </Button>
      </Box>

      <Grid container spacing={3}>
        {dataBreaches.map((breach, index) => (
          <Grid item xs={12} key={breach.id}>
            <AnimatedCard delay={index * 100}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${getSeverityColor(breach.severity)} 0%, ${alpha(getSeverityColor(breach.severity), 0.8)} 100%)`,
                  color: 'white',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <ErrorIcon sx={{ fontSize: 40 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {breach.title}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {breach.description}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        Entdeckt: {format(breach.discoveredAt, 'dd.MM.yyyy HH:mm')}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {breach.severity.toUpperCase()}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        {breach.affectedSubjects} Betroffene
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {breach.breachType}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          Typ
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {breach.status}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          Status
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {breach.supervisoryAuthorityNotified ? 'Ja' : 'Nein'}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          Behörde informiert
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {breach.subjectsNotified ? 'Ja' : 'Nein'}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          Betroffene informiert
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  {breach.notificationDeadline && breach.notificationDeadline > new Date() && (
                    <Alert 
                      severity="warning" 
                      sx={{ 
                        mb: 2, 
                        backgroundColor: alpha('#fff', 0.1),
                        color: 'white',
                        '& .MuiAlert-icon': { color: 'white' }
                      }}
                    >
                      Meldepflicht bis {format(breach.notificationDeadline, 'dd.MM.yyyy HH:mm')}
                    </Alert>
                  )}
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setSelectedBreach(breach);
                        setIsBreachDialogOpen(true);
                      }}
                      sx={{
                        color: 'white',
                        borderColor: alpha('#fff', 0.5),
                        '&:hover': {
                          borderColor: 'white',
                          backgroundColor: alpha('#fff', 0.1),
                        },
                      }}
                    >
                      Details
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<HistoryIcon />}
                      sx={{
                        color: 'white',
                        borderColor: alpha('#fff', 0.5),
                        '&:hover': {
                          borderColor: 'white',
                          backgroundColor: alpha('#fff', 0.1),
                        },
                      }}
                    >
                      Timeline
                    </Button>
                  </Box>
                </CardContent>
              </Box>
            </AnimatedCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderComplianceOverview = () => {
    if (!metrics) return null;

    const complianceData = [
      { name: 'Datenschutz', score: metrics.complianceScore, color: theme.palette.primary.main },
      { name: 'Einwilligungen', score: (metrics.activeConsents / (metrics.activeConsents + metrics.withdrawnConsents)) * 100, color: theme.palette.success.main },
      { name: 'Anfragen', score: (metrics.completedRequests / (metrics.completedRequests + metrics.pendingRequests)) * 100, color: theme.palette.info.main },
      { name: 'Aufbewahrung', score: (metrics.retentionCompliance.compliant / metrics.retentionCompliance.total) * 100, color: theme.palette.warning.main },
    ];

    return (
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
          GDPR-Compliance Übersicht
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={1}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <PersonIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {metrics.totalSubjects}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Betroffene Personen
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
                  <CheckIcon color="success" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {metrics.activeConsents}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Aktive Einwilligungen
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
                  <ScheduleIcon color="warning" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {metrics.pendingRequests}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Offene Anfragen
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
                  <ReportIcon color="error" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {metrics.dataBreaches.pending}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Offene Verletzungen
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Compliance-Bewertung
              </Typography>
              
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={complianceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <RechartsTooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Score']} />
                    <Bar dataKey="score">
                      {complianceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Risikobewertung
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Gesamt-Compliance</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {metrics.complianceScore.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={metrics.complianceScore}
                  sx={{ height: 8, borderRadius: 4, mb: 2 }}
                />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Anfragebearbeitung</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {metrics.averageResponseTime}h Ø
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.max(0, 100 - (metrics.averageResponseTime / 72) * 100)}
                  color="info"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              
              <Alert severity={
                metrics.riskLevel === 'low' ? 'success' :
                metrics.riskLevel === 'medium' ? 'warning' :
                metrics.riskLevel === 'high' ? 'error' : 'error'
              }>
                Aktuelles Risiko-Level: <strong>{metrics.riskLevel.toUpperCase()}</strong>
              </Alert>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Box>
      {/* Header */}
      <SlideInContainer>
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <GavelIcon color="primary" />
              GDPR Compliance Tools
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label={`Compliance: ${metrics?.complianceScore.toFixed(1)}%`}
                color={metrics && metrics.complianceScore > 80 ? 'success' : 'warning'}
                icon={<ShieldIcon />}
              />
              <Chip
                label={`${metrics?.pendingRequests || 0} offene Anfragen`}
                color={metrics && metrics.pendingRequests > 0 ? 'warning' : 'success'}
                icon={<ScheduleIcon />}
              />
            </Box>
          </Box>
          
          <Typography variant="body1" color="text.secondary">
            Vollständige GDPR-Compliance-Verwaltung mit Betroffenenrechten, Einwilligungsmanagement und Datenschutzverletzungen
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
            <Tab label="Übersicht" icon={<AssessmentIcon />} />
            <Tab label="Betroffene Personen" icon={<PersonIcon />} />
            <Tab label="Anfragen" icon={<DescriptionIcon />} />
            <Tab label="Einwilligungen" icon={<CheckIcon />} />
            <Tab label="Datenschutzverletzungen" icon={<ReportIcon />} />
          </Tabs>
        </Paper>
      </SlideInContainer>

      {/* Tab Content */}
      <SlideInContainer delay={400}>
        {selectedTab === 0 && renderComplianceOverview()}
        {selectedTab === 1 && renderDataSubjectsTab()}
        {selectedTab === 2 && renderAccessRequestsTab()}
        {selectedTab === 3 && renderConsentManagementTab()}
        {selectedTab === 4 && renderDataBreachesTab()}
      </SlideInContainer>
    </Box>
  );
};

export default GDPRComplianceTools;