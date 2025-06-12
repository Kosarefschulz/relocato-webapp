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
  Tab,
  Tabs,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Badge,
  Avatar,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Key as KeyIcon,
  Shield as ShieldIcon,
  VpnKey as VpnKeyIcon,
  Storage as StorageIcon,
  Database as DatabaseIcon,
  CloudQueue as CloudIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  InsertDriveFile as FileIcon,
  Backup as BackupIcon,
  Restore as RestoreIcon,
  Sync as SyncIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ExpandMore as ExpandMoreIcon,
  VerifiedUser as VerifiedUserIcon,
  Gavel as ComplianceIcon,
  CopyAll as CopyAllIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Memory as MemoryIcon,
  Computer as ComputerIcon,
  PhoneAndroid as PhoneAndroidIcon,
  Fingerprint as FingerprintIcon,
} from '@mui/icons-material';
import { format, addDays, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AnimatedCard, SlideInContainer } from './MicroAnimations';

interface EncryptionKey {
  id: string;
  name: string;
  type: 'AES-256' | 'AES-128' | 'ChaCha20' | 'RSA-2048' | 'RSA-4096' | 'ECDSA-P256' | 'ECDSA-P384';
  purpose: 'data_encryption' | 'key_encryption' | 'signature' | 'authentication' | 'transport';
  status: 'active' | 'inactive' | 'revoked' | 'expired' | 'pending_rotation';
  createdAt: Date;
  expiresAt?: Date;
  lastUsed?: Date;
  usageCount: number;
  keySize: number; // bits
  algorithm: string;
  rotation: {
    enabled: boolean;
    interval: number; // days
    lastRotation?: Date;
    nextRotation?: Date;
  };
  metadata: {
    creator: string;
    description: string;
    tags: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    complianceRequirements: string[];
    backupLocations: string[];
  };
  permissions: {
    canEncrypt: string[]; // user IDs
    canDecrypt: string[]; // user IDs
    canRotate: string[]; // user IDs
    canRevoke: string[]; // user IDs
  };
}

interface EncryptedDataset {
  id: string;
  name: string;
  description: string;
  dataType: 'customer_data' | 'financial_data' | 'employee_data' | 'system_logs' | 'backups' | 'documents' | 'communications';
  location: string;
  size: number; // bytes
  recordCount: number;
  encryptionKeyId: string;
  encryptionMethod: 'field_level' | 'table_level' | 'database_level' | 'file_level';
  encryptedAt: Date;
  lastAccessed?: Date;
  accessCount: number;
  status: 'encrypted' | 'decrypting' | 'encrypting' | 'error' | 'pending';
  complianceLevel: 'basic' | 'enhanced' | 'strict' | 'critical';
  retentionPolicy: {
    retentionPeriod: number; // days
    autoDelete: boolean;
    archiveBeforeDelete: boolean;
  };
  metadata: {
    classification: 'public' | 'internal' | 'confidential' | 'restricted';
    owner: string;
    department: string;
    tags: string[];
    relatedDatasets: string[];
  };
}

interface EncryptionPolicy {
  id: string;
  name: string;
  description: string;
  dataTypes: string[];
  encryptionRequirements: {
    algorithm: string;
    keySize: number;
    rotationInterval: number; // days
    backupEncryption: boolean;
    transitEncryption: boolean;
    fieldLevelEncryption: string[]; // field names
  };
  complianceStandards: string[]; // GDPR, HIPAA, SOX, etc.
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  approvedBy?: string;
  effectiveDate: Date;
  expirationDate?: Date;
}

interface EncryptionMetrics {
  totalDatasets: number;
  encryptedDatasets: number;
  totalDataSize: number;
  encryptedDataSize: number;
  encryptionCoverage: number; // percentage
  averageEncryptionTime: number; // seconds
  keyRotationCompliance: number; // percentage
  complianceScore: number; // 0-100
  riskAssessment: {
    lowRisk: number;
    mediumRisk: number;
    highRisk: number;
    criticalRisk: number;
  };
  performanceImpact: {
    querySlowdown: number; // percentage
    storageOverhead: number; // percentage
    cpuUtilization: number; // percentage
  };
}

interface EncryptionAuditEvent {
  id: string;
  timestamp: Date;
  eventType: 'key_created' | 'key_rotated' | 'key_revoked' | 'data_encrypted' | 'data_decrypted' | 'access_granted' | 'access_denied' | 'policy_violated';
  userId: string;
  resourceId: string;
  resourceType: 'key' | 'dataset' | 'policy';
  action: string;
  result: 'success' | 'failure' | 'blocked';
  details: string;
  riskScore: number; // 0-10
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, any>;
}

interface DataEncryptionAtRestProps {
  onEncryptionCompleted?: (dataset: EncryptedDataset) => void;
  onKeyRotated?: (key: EncryptionKey) => void;
  onPolicyViolation?: (event: EncryptionAuditEvent) => void;
  onComplianceAlert?: (alert: any) => void;
}

const DataEncryptionAtRest: React.FC<DataEncryptionAtRestProps> = ({
  onEncryptionCompleted,
  onKeyRotated,
  onPolicyViolation,
  onComplianceAlert,
}) => {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState(0);
  const [encryptionKeys, setEncryptionKeys] = useState<EncryptionKey[]>([]);
  const [encryptedDatasets, setEncryptedDatasets] = useState<EncryptedDataset[]>([]);
  const [encryptionPolicies, setEncryptionPolicies] = useState<EncryptionPolicy[]>([]);
  const [metrics, setMetrics] = useState<EncryptionMetrics | null>(null);
  const [auditEvents, setAuditEvents] = useState<EncryptionAuditEvent[]>([]);
  const [isKeyDialogOpen, setIsKeyDialogOpen] = useState(false);
  const [isPolicyDialogOpen, setIsPolicyDialogOpen] = useState(false);
  const [isEncryptionDialogOpen, setIsEncryptionDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<EncryptionKey | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<EncryptedDataset | null>(null);
  const [isRotatingKeys, setIsRotatingKeys] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);

  useEffect(() => {
    initializeData();
    const interval = setInterval(updateMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const initializeData = () => {
    // Initialize encryption keys
    const sampleKeys: EncryptionKey[] = [
      {
        id: 'key-master-001',
        name: 'Master Data Encryption Key',
        type: 'AES-256',
        purpose: 'data_encryption',
        status: 'active',
        createdAt: new Date('2024-01-15'),
        expiresAt: new Date('2025-01-15'),
        lastUsed: new Date('2024-12-06T10:30:00'),
        usageCount: 15420,
        keySize: 256,
        algorithm: 'AES-256-GCM',
        rotation: {
          enabled: true,
          interval: 90,
          lastRotation: new Date('2024-10-15'),
          nextRotation: new Date('2025-01-13'),
        },
        metadata: {
          creator: 'security@relocato.de',
          description: 'Haupt-Verschlüsselungsschlüssel für Kundendaten',
          tags: ['master', 'customer-data', 'production'],
          riskLevel: 'critical',
          complianceRequirements: ['GDPR', 'ISO-27001'],
          backupLocations: ['hsm-primary', 'hsm-backup', 'offline-vault'],
        },
        permissions: {
          canEncrypt: ['user-1', 'user-2', 'service-1'],
          canDecrypt: ['user-1', 'user-2'],
          canRotate: ['user-1'],
          canRevoke: ['user-1'],
        },
      },
      {
        id: 'key-finance-001',
        name: 'Financial Data Key',
        type: 'AES-256',
        purpose: 'data_encryption',
        status: 'active',
        createdAt: new Date('2024-02-01'),
        expiresAt: new Date('2025-02-01'),
        lastUsed: new Date('2024-12-06T09:15:00'),
        usageCount: 8934,
        keySize: 256,
        algorithm: 'AES-256-CBC',
        rotation: {
          enabled: true,
          interval: 60,
          lastRotation: new Date('2024-11-01'),
          nextRotation: new Date('2024-12-31'),
        },
        metadata: {
          creator: 'finance@relocato.de',
          description: 'Verschlüsselung für Finanz- und Rechnungsdaten',
          tags: ['finance', 'invoices', 'payments'],
          riskLevel: 'critical',
          complianceRequirements: ['SOX', 'PCI-DSS'],
          backupLocations: ['hsm-primary', 'offline-vault'],
        },
        permissions: {
          canEncrypt: ['user-1', 'user-3', 'service-2'],
          canDecrypt: ['user-1', 'user-3'],
          canRotate: ['user-1'],
          canRevoke: ['user-1'],
        },
      },
      {
        id: 'key-backup-001',
        name: 'Backup Encryption Key',
        type: 'ChaCha20',
        purpose: 'data_encryption',
        status: 'active',
        createdAt: new Date('2024-03-01'),
        lastUsed: new Date('2024-12-05T23:30:00'),
        usageCount: 2156,
        keySize: 256,
        algorithm: 'ChaCha20-Poly1305',
        rotation: {
          enabled: true,
          interval: 30,
          lastRotation: new Date('2024-11-20'),
          nextRotation: new Date('2024-12-20'),
        },
        metadata: {
          creator: 'backup@relocato.de',
          description: 'Verschlüsselung für System-Backups',
          tags: ['backup', 'system', 'automated'],
          riskLevel: 'high',
          complianceRequirements: ['ISO-27001'],
          backupLocations: ['hsm-backup', 'offline-vault'],
        },
        permissions: {
          canEncrypt: ['user-1', 'service-backup'],
          canDecrypt: ['user-1'],
          canRotate: ['user-1'],
          canRevoke: ['user-1'],
        },
      },
      {
        id: 'key-transport-001',
        name: 'Transport Layer Key',
        type: 'ECDSA-P256',
        purpose: 'transport',
        status: 'active',
        createdAt: new Date('2024-01-10'),
        expiresAt: new Date('2025-01-10'),
        lastUsed: new Date(),
        usageCount: 45678,
        keySize: 256,
        algorithm: 'ECDSA-P256',
        rotation: {
          enabled: true,
          interval: 180,
          lastRotation: new Date('2024-07-10'),
          nextRotation: new Date('2025-01-07'),
        },
        metadata: {
          creator: 'network@relocato.de',
          description: 'TLS-Zertifikat für sichere Datenübertragung',
          tags: ['tls', 'transport', 'certificate'],
          riskLevel: 'high',
          complianceRequirements: ['TLS-1.3'],
          backupLocations: ['cert-store', 'hsm-backup'],
        },
        permissions: {
          canEncrypt: ['service-web', 'service-api'],
          canDecrypt: ['service-web', 'service-api'],
          canRotate: ['user-1'],
          canRevoke: ['user-1'],
        },
      },
    ];

    // Initialize encrypted datasets
    const sampleDatasets: EncryptedDataset[] = [
      {
        id: 'dataset-customers',
        name: 'Kundendatenbank',
        description: 'Alle Kundenstammdaten inkl. persönlicher Informationen',
        dataType: 'customer_data',
        location: 'database://prod/customers',
        size: 2147483648, // 2GB
        recordCount: 12500,
        encryptionKeyId: 'key-master-001',
        encryptionMethod: 'field_level',
        encryptedAt: new Date('2024-01-15T10:00:00'),
        lastAccessed: new Date('2024-12-06T11:30:00'),
        accessCount: 5642,
        status: 'encrypted',
        complianceLevel: 'critical',
        retentionPolicy: {
          retentionPeriod: 2555, // 7 years
          autoDelete: false,
          archiveBeforeDelete: true,
        },
        metadata: {
          classification: 'confidential',
          owner: 'data-protection@relocato.de',
          department: 'Operations',
          tags: ['gdpr', 'personal-data', 'production'],
          relatedDatasets: ['dataset-quotes', 'dataset-invoices'],
        },
      },
      {
        id: 'dataset-financial',
        name: 'Finanzdaten',
        description: 'Rechnungen, Zahlungen und Buchhaltungsdaten',
        dataType: 'financial_data',
        location: 'database://prod/finance',
        size: 1073741824, // 1GB
        recordCount: 8750,
        encryptionKeyId: 'key-finance-001',
        encryptionMethod: 'table_level',
        encryptedAt: new Date('2024-02-01T14:30:00'),
        lastAccessed: new Date('2024-12-06T09:15:00'),
        accessCount: 3421,
        status: 'encrypted',
        complianceLevel: 'critical',
        retentionPolicy: {
          retentionPeriod: 3650, // 10 years
          autoDelete: false,
          archiveBeforeDelete: true,
        },
        metadata: {
          classification: 'restricted',
          owner: 'finance@relocato.de',
          department: 'Finance',
          tags: ['sox', 'pci-dss', 'audit'],
          relatedDatasets: ['dataset-customers'],
        },
      },
      {
        id: 'dataset-employees',
        name: 'Mitarbeiterdaten',
        description: 'HR-Daten, Gehälter und Personalakten',
        dataType: 'employee_data',
        location: 'database://prod/hr',
        size: 536870912, // 512MB
        recordCount: 45,
        encryptionKeyId: 'key-master-001',
        encryptionMethod: 'field_level',
        encryptedAt: new Date('2024-01-20T16:00:00'),
        lastAccessed: new Date('2024-12-05T15:45:00'),
        accessCount: 892,
        status: 'encrypted',
        complianceLevel: 'critical',
        retentionPolicy: {
          retentionPeriod: 2920, // 8 years
          autoDelete: false,
          archiveBeforeDelete: true,
        },
        metadata: {
          classification: 'restricted',
          owner: 'hr@relocato.de',
          department: 'HR',
          tags: ['employee-data', 'payroll', 'confidential'],
          relatedDatasets: [],
        },
      },
      {
        id: 'dataset-backups',
        name: 'System-Backups',
        description: 'Tägliche Vollbackups aller Systeme',
        dataType: 'backups',
        location: 'storage://backup/daily',
        size: 21474836480, // 20GB
        recordCount: 1,
        encryptionKeyId: 'key-backup-001',
        encryptionMethod: 'file_level',
        encryptedAt: new Date('2024-12-06T02:00:00'),
        lastAccessed: new Date('2024-12-06T02:30:00'),
        accessCount: 180,
        status: 'encrypted',
        complianceLevel: 'enhanced',
        retentionPolicy: {
          retentionPeriod: 90,
          autoDelete: true,
          archiveBeforeDelete: false,
        },
        metadata: {
          classification: 'internal',
          owner: 'backup@relocato.de',
          department: 'IT',
          tags: ['backup', 'automated', 'nightly'],
          relatedDatasets: ['dataset-customers', 'dataset-financial', 'dataset-employees'],
        },
      },
    ];

    // Initialize encryption policies
    const samplePolicies: EncryptionPolicy[] = [
      {
        id: 'policy-gdpr',
        name: 'GDPR Compliance Policy',
        description: 'Verschlüsselungsrichtlinien für GDPR-konforme Datenverarbeitung',
        dataTypes: ['customer_data', 'employee_data'],
        encryptionRequirements: {
          algorithm: 'AES-256-GCM',
          keySize: 256,
          rotationInterval: 90,
          backupEncryption: true,
          transitEncryption: true,
          fieldLevelEncryption: ['email', 'phone', 'address', 'payment_info'],
        },
        complianceStandards: ['GDPR', 'ISO-27001'],
        isActive: true,
        priority: 1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        createdBy: 'compliance@relocato.de',
        approvedBy: 'ceo@relocato.de',
        effectiveDate: new Date('2024-01-01'),
      },
      {
        id: 'policy-financial',
        name: 'Financial Data Protection Policy',
        description: 'Spezielle Verschlüsselungsanforderungen für Finanzdaten',
        dataTypes: ['financial_data'],
        encryptionRequirements: {
          algorithm: 'AES-256-CBC',
          keySize: 256,
          rotationInterval: 60,
          backupEncryption: true,
          transitEncryption: true,
          fieldLevelEncryption: ['account_number', 'amount', 'payment_method'],
        },
        complianceStandards: ['SOX', 'PCI-DSS'],
        isActive: true,
        priority: 1,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01'),
        createdBy: 'finance@relocato.de',
        approvedBy: 'cfo@relocato.de',
        effectiveDate: new Date('2024-02-01'),
      },
      {
        id: 'policy-backup',
        name: 'Backup Encryption Policy',
        description: 'Verschlüsselungsstandards für System-Backups',
        dataTypes: ['backups', 'system_logs'],
        encryptionRequirements: {
          algorithm: 'ChaCha20-Poly1305',
          keySize: 256,
          rotationInterval: 30,
          backupEncryption: true,
          transitEncryption: true,
          fieldLevelEncryption: [],
        },
        complianceStandards: ['ISO-27001'],
        isActive: true,
        priority: 2,
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-03-01'),
        createdBy: 'it@relocato.de',
        approvedBy: 'cto@relocato.de',
        effectiveDate: new Date('2024-03-01'),
      },
    ];

    // Initialize metrics
    const sampleMetrics: EncryptionMetrics = {
      totalDatasets: sampleDatasets.length,
      encryptedDatasets: sampleDatasets.filter(d => d.status === 'encrypted').length,
      totalDataSize: sampleDatasets.reduce((sum, d) => sum + d.size, 0),
      encryptedDataSize: sampleDatasets.filter(d => d.status === 'encrypted').reduce((sum, d) => sum + d.size, 0),
      encryptionCoverage: 100,
      averageEncryptionTime: 2.3,
      keyRotationCompliance: 85.7,
      complianceScore: 94.2,
      riskAssessment: {
        lowRisk: 1,
        mediumRisk: 0,
        highRisk: 1,
        criticalRisk: 2,
      },
      performanceImpact: {
        querySlowdown: 8.5,
        storageOverhead: 12.3,
        cpuUtilization: 5.2,
      },
    };

    // Initialize audit events
    const sampleAuditEvents: EncryptionAuditEvent[] = [
      {
        id: 'audit-1',
        timestamp: new Date('2024-12-06T10:30:00'),
        eventType: 'data_decrypted',
        userId: 'user-2',
        resourceId: 'dataset-customers',
        resourceType: 'dataset',
        action: 'DECRYPT_CUSTOMER_DATA',
        result: 'success',
        details: 'Kundendaten für Report-Generierung entschlüsselt',
        riskScore: 3,
        ipAddress: '192.168.1.105',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        metadata: {
          recordCount: 150,
          queryType: 'analytics',
        },
      },
      {
        id: 'audit-2',
        timestamp: new Date('2024-12-06T02:00:00'),
        eventType: 'data_encrypted',
        userId: 'service-backup',
        resourceId: 'dataset-backups',
        resourceType: 'dataset',
        action: 'ENCRYPT_BACKUP',
        result: 'success',
        details: 'Nightly backup erfolgreich verschlüsselt',
        riskScore: 1,
        ipAddress: '10.0.0.50',
        userAgent: 'BackupService/2.1.0',
        metadata: {
          backupSize: '20GB',
          encryptionTime: '45s',
        },
      },
      {
        id: 'audit-3',
        timestamp: new Date('2024-12-05T16:20:00'),
        eventType: 'access_denied',
        userId: 'user-4',
        resourceId: 'dataset-financial',
        resourceType: 'dataset',
        action: 'DECRYPT_FINANCIAL_DATA',
        result: 'blocked',
        details: 'Zugriff auf Finanzdaten verweigert - unzureichende Berechtigung',
        riskScore: 7,
        ipAddress: '192.168.1.115',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        metadata: {
          deniedReason: 'insufficient_permissions',
          requestedData: 'invoice_amounts',
        },
      },
      {
        id: 'audit-4',
        timestamp: new Date('2024-11-20T09:00:00'),
        eventType: 'key_rotated',
        userId: 'user-1',
        resourceId: 'key-backup-001',
        resourceType: 'key',
        action: 'ROTATE_ENCRYPTION_KEY',
        result: 'success',
        details: 'Backup-Verschlüsselungsschlüssel erfolgreich rotiert',
        riskScore: 2,
        ipAddress: '192.168.1.100',
        userAgent: 'KeyManagement/1.0.0',
        metadata: {
          oldKeyId: 'key-backup-001-old',
          newKeyId: 'key-backup-001',
          rotationType: 'scheduled',
        },
      },
    ];

    setEncryptionKeys(sampleKeys);
    setEncryptedDatasets(sampleDatasets);
    setEncryptionPolicies(samplePolicies);
    setMetrics(sampleMetrics);
    setAuditEvents(sampleAuditEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
  };

  const updateMetrics = () => {
    // Simulate real-time metrics updates
    setMetrics(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        performanceImpact: {
          ...prev.performanceImpact,
          cpuUtilization: Math.max(0, Math.min(100, prev.performanceImpact.cpuUtilization + (Math.random() - 0.5) * 2)),
        },
      };
    });
  };

  const rotateKey = async (keyId: string) => {
    setIsRotatingKeys(true);
    
    // Simulate key rotation process
    setTimeout(() => {
      setEncryptionKeys(prev => prev.map(key => {
        if (key.id === keyId) {
          const rotatedKey = {
            ...key,
            rotation: {
              ...key.rotation,
              lastRotation: new Date(),
              nextRotation: addDays(new Date(), key.rotation.interval),
            },
            usageCount: 0, // Reset usage count after rotation
          };
          
          // Add audit event
          const auditEvent: EncryptionAuditEvent = {
            id: `audit-${Date.now()}`,
            timestamp: new Date(),
            eventType: 'key_rotated',
            userId: 'user-1',
            resourceId: keyId,
            resourceType: 'key',
            action: 'ROTATE_ENCRYPTION_KEY',
            result: 'success',
            details: `Verschlüsselungsschlüssel ${key.name} erfolgreich rotiert`,
            riskScore: 2,
            ipAddress: '192.168.1.100',
            userAgent: navigator.userAgent,
            metadata: {
              rotationType: 'manual',
              previousRotation: key.rotation.lastRotation,
            },
          };
          
          setAuditEvents(prev => [auditEvent, ...prev]);
          onKeyRotated?.(rotatedKey);
          
          return rotatedKey;
        }
        return key;
      }));
      
      setIsRotatingKeys(false);
      alert('Schlüssel erfolgreich rotiert!');
    }, 3000);
  };

  const encryptDataset = async (datasetId: string) => {
    setIsEncrypting(true);
    
    // Simulate encryption process
    setTimeout(() => {
      setEncryptedDatasets(prev => prev.map(dataset => {
        if (dataset.id === datasetId) {
          const encryptedDataset = {
            ...dataset,
            status: 'encrypted' as const,
            encryptedAt: new Date(),
          };
          
          onEncryptionCompleted?.(encryptedDataset);
          return encryptedDataset;
        }
        return dataset;
      }));
      
      setIsEncrypting(false);
      alert('Dataset erfolgreich verschlüsselt!');
    }, 5000);
  };

  const getKeyStatusColor = (status: EncryptionKey['status']) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'revoked': return 'error';
      case 'expired': return 'error';
      case 'pending_rotation': return 'warning';
      default: return 'default';
    }
  };

  const getDatasetStatusColor = (status: EncryptedDataset['status']) => {
    switch (status) {
      case 'encrypted': return 'success';
      case 'encrypting': return 'warning';
      case 'decrypting': return 'warning';
      case 'error': return 'error';
      case 'pending': return 'info';
      default: return 'default';
    }
  };

  const formatBytes = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const renderKeysTab = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Verschlüsselungsschlüssel
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => rotateKey('key-master-001')}
            disabled={isRotatingKeys}
          >
            {isRotatingKeys ? 'Rotiere...' : 'Schlüssel rotieren'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsKeyDialogOpen(true)}
          >
            Neuer Schlüssel
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {encryptionKeys.map((key, index) => (
          <Grid item xs={12} md={6} lg={4} key={key.id}>
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
                    <KeyIcon color="primary" />
                  </Box>
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {key.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label={key.type} size="small" color="primary" />
                      <Chip 
                        label={key.status} 
                        size="small" 
                        color={getKeyStatusColor(key.status)}
                      />
                    </Box>
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {key.metadata.description}
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Risiko-Level:
                  </Typography>
                  <Chip
                    label={key.metadata.riskLevel}
                    size="small"
                    color={
                      key.metadata.riskLevel === 'critical' ? 'error' :
                      key.metadata.riskLevel === 'high' ? 'warning' :
                      key.metadata.riskLevel === 'medium' ? 'info' : 'success'
                    }
                    sx={{ ml: 1 }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {key.keySize}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Bit
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {key.usageCount.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Verwendungen
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {key.rotation.nextRotation ? differenceInDays(key.rotation.nextRotation, new Date()) : '∞'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Tage bis Rotation
                    </Typography>
                  </Box>
                </Box>
                
                {key.metadata.complianceRequirements.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Compliance:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {key.metadata.complianceRequirements.map(req => (
                        <Chip key={req} label={req} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setSelectedKey(key);
                      setIsKeyDialogOpen(true);
                    }}
                    fullWidth
                  >
                    Details
                  </Button>
                  <IconButton
                    size="small"
                    onClick={() => rotateKey(key.id)}
                    disabled={isRotatingKeys}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </AnimatedCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderDatasetsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Verschlüsselte Datensätze
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<LockIcon />}
          onClick={() => setIsEncryptionDialogOpen(true)}
        >
          Dataset verschlüsseln
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Dataset</TableCell>
              <TableCell>Typ</TableCell>
              <TableCell>Größe</TableCell>
              <TableCell>Verschlüsselung</TableCell>
              <TableCell>Compliance</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Letzer Zugriff</TableCell>
              <TableCell>Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {encryptedDatasets.map((dataset) => {
              const encryptionKey = encryptionKeys.find(k => k.id === dataset.encryptionKeyId);
              
              return (
                <TableRow key={dataset.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DatabaseIcon color="primary" />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {dataset.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {dataset.recordCount.toLocaleString()} Datensätze
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={dataset.dataType.replace('_', ' ')}
                      size="small"
                      color={
                        dataset.dataType === 'financial_data' ? 'error' :
                        dataset.dataType === 'customer_data' ? 'warning' :
                        dataset.dataType === 'employee_data' ? 'info' : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatBytes(dataset.size)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {encryptionKey?.type || 'Unknown'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {dataset.encryptionMethod.replace('_', ' ')}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={dataset.complianceLevel}
                      size="small"
                      color={
                        dataset.complianceLevel === 'critical' ? 'error' :
                        dataset.complianceLevel === 'strict' ? 'warning' :
                        dataset.complianceLevel === 'enhanced' ? 'info' : 'success'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={dataset.status}
                      size="small"
                      color={getDatasetStatusColor(dataset.status)}
                    />
                  </TableCell>
                  <TableCell>
                    {dataset.lastAccessed ? (
                      <Typography variant="body2">
                        {format(dataset.lastAccessed, 'dd.MM.yyyy HH:mm', { locale: de })}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Nie
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Details">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedDataset(dataset);
                            setIsEncryptionDialogOpen(true);
                          }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Re-encrypt">
                        <IconButton
                          size="small"
                          onClick={() => encryptDataset(dataset.id)}
                          disabled={isEncrypting}
                        >
                          <RefreshIcon />
                        </IconButton>
                      </Tooltip>
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

  const renderPoliciesTab = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Verschlüsselungsrichtlinien
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsPolicyDialogOpen(true)}
        >
          Neue Richtlinie
        </Button>
      </Box>

      <Grid container spacing={3}>
        {encryptionPolicies.map((policy, index) => (
          <Grid item xs={12} key={policy.id}>
            <AnimatedCard delay={index * 100}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <ComplianceIcon color="primary" />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {policy.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {policy.description}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        label={`Priorität ${policy.priority}`}
                        size="small"
                        color={policy.priority === 1 ? 'error' : 'info'}
                      />
                      <Chip
                        label={policy.isActive ? 'Aktiv' : 'Inaktiv'}
                        size="small"
                        color={policy.isActive ? 'success' : 'default'}
                      />
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Betroffene Datentypen:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                        {policy.dataTypes.map(type => (
                          <Chip key={type} label={type.replace('_', ' ')} size="small" />
                        ))}
                      </Box>
                      
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Compliance Standards:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {policy.complianceStandards.map(standard => (
                          <Chip key={standard} label={standard} size="small" color="info" />
                        ))}
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Verschlüsselungsanforderungen:
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemText
                            primary="Algorithmus"
                            secondary={policy.encryptionRequirements.algorithm}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Schlüsselgröße"
                            secondary={`${policy.encryptionRequirements.keySize} Bit`}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Rotation"
                            secondary={`Alle ${policy.encryptionRequirements.rotationInterval} Tage`}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Backup-Verschlüsselung"
                            secondary={policy.encryptionRequirements.backupEncryption ? 'Erforderlich' : 'Optional'}
                          />
                        </ListItem>
                      </List>
                    </Grid>
                  </Grid>
                  
                  {policy.encryptionRequirements.fieldLevelEncryption.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Felder mit Verschlüsselung auf Feldebene:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {policy.encryptionRequirements.fieldLevelEncryption.map(field => (
                          <Chip key={field} label={field} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            </AnimatedCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderAnalyticsTab = () => {
    if (!metrics) return null;

    const riskData = [
      { name: 'Niedrig', value: metrics.riskAssessment.lowRisk, color: theme.palette.success.main },
      { name: 'Mittel', value: metrics.riskAssessment.mediumRisk, color: theme.palette.info.main },
      { name: 'Hoch', value: metrics.riskAssessment.highRisk, color: theme.palette.warning.main },
      { name: 'Kritisch', value: metrics.riskAssessment.criticalRisk, color: theme.palette.error.main },
    ];

    return (
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
          Verschlüsselungs-Analytics
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={1}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <DatabaseIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {metrics.encryptionCoverage.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Verschlüsselungsabdeckung
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
                  <VerifiedUserIcon color="success" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {metrics.complianceScore.toFixed(1)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Compliance Score
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
                  <RefreshIcon color="info" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {metrics.keyRotationCompliance.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Schlüssel-Rotation
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
                  <SpeedIcon color="warning" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {metrics.averageEncryptionTime.toFixed(1)}s
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ø Verschlüsselungszeit
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Risiko-Verteilung
              </Typography>
              
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {riskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Performance-Impact
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Query-Verlangsamung: {metrics.performanceImpact.querySlowdown.toFixed(1)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={metrics.performanceImpact.querySlowdown}
                  sx={{ height: 8, borderRadius: 4, mb: 2 }}
                />
                
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Storage-Overhead: {metrics.performanceImpact.storageOverhead.toFixed(1)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={metrics.performanceImpact.storageOverhead}
                  color="warning"
                  sx={{ height: 8, borderRadius: 4, mb: 2 }}
                />
                
                <Typography variant="body2" sx={{ mb: 1 }}>
                  CPU-Auslastung: {metrics.performanceImpact.cpuUtilization.toFixed(1)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={metrics.performanceImpact.cpuUtilization}
                  color="success"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              
              <Alert severity="info">
                Die Performance-Auswirkungen liegen im akzeptablen Bereich. 
                Verschlüsselung verursacht minimal zusätzliche Latenz.
              </Alert>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderAuditTab = () => (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Verschlüsselungs-Audit
      </Typography>
      
      <List>
        {auditEvents.map((event) => (
          <React.Fragment key={event.id}>
            <ListItem>
              <ListItemIcon>
                {event.result === 'success' ? (
                  <CheckCircleIcon color="success" />
                ) : event.result === 'blocked' ? (
                  <LockIcon color="error" />
                ) : (
                  <WarningIcon color="warning" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {event.eventType.replace('_', ' ').toUpperCase()}
                    </Typography>
                    <Chip 
                      label={event.resourceType} 
                      size="small" 
                      variant="outlined"
                    />
                    {event.riskScore > 5 && (
                      <Chip
                        label={`Risiko: ${event.riskScore}/10`}
                        size="small"
                        color={event.riskScore > 7 ? 'error' : 'warning'}
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      {event.details}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {format(event.timestamp, 'dd.MM.yyyy HH:mm:ss', { locale: de })} • 
                      User: {event.userId} • 
                      IP: {event.ipAddress}
                    </Typography>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <Chip
                  label={event.result}
                  size="small"
                  color={
                    event.result === 'success' ? 'success' :
                    event.result === 'blocked' ? 'error' : 'warning'
                  }
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>
    </Box>
  );

  return (
    <Box>
      {/* Header */}
      <SlideInContainer>
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <LockIcon color="primary" />
              Data Encryption at Rest
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label={`${metrics?.encryptionCoverage.toFixed(1)}% verschlüsselt`}
                color="success"
                icon={<ShieldIcon />}
              />
              <Chip
                label={`${encryptionKeys.filter(k => k.status === 'active').length} aktive Schlüssel`}
                color="primary"
                icon={<KeyIcon />}
              />
            </Box>
          </Box>
          
          <Typography variant="body1" color="text.secondary">
            Umfassende Datenverschlüsselung im Ruhezustand mit automatischem Schlüsselmanagement und Compliance-Überwachung
          </Typography>
        </Paper>
      </SlideInContainer>

      {/* Quick Stats */}
      {metrics && (
        <SlideInContainer delay={200}>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={1}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <StorageIcon color="primary" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {formatBytes(metrics.encryptedDataSize)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Verschlüsselte Daten
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
                    <KeyIcon color="success" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {encryptionKeys.filter(k => k.status === 'active').length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Aktive Schlüssel
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
                    <ComplianceIcon color="info" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {encryptionPolicies.filter(p => p.isActive).length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Aktive Richtlinien
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
                        {auditEvents.filter(e => e.result === 'blocked').length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Blockierte Zugriffe
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </SlideInContainer>
      )}

      {/* Navigation Tabs */}
      <SlideInContainer delay={400}>
        <Paper elevation={2} sx={{ mb: 4 }}>
          <Tabs
            value={selectedTab}
            onChange={(e, newValue) => setSelectedTab(newValue)}
            variant="fullWidth"
          >
            <Tab label="Schlüssel" icon={<KeyIcon />} />
            <Tab label="Datensätze" icon={<DatabaseIcon />} />
            <Tab label="Richtlinien" icon={<ComplianceIcon />} />
            <Tab label="Analytics" icon={<AssessmentIcon />} />
            <Tab label="Audit" icon={<TimelineIcon />} />
          </Tabs>
        </Paper>
      </SlideInContainer>

      {/* Tab Content */}
      <SlideInContainer delay={600}>
        {selectedTab === 0 && renderKeysTab()}
        {selectedTab === 1 && renderDatasetsTab()}
        {selectedTab === 2 && renderPoliciesTab()}
        {selectedTab === 3 && renderAnalyticsTab()}
        {selectedTab === 4 && renderAuditTab()}
      </SlideInContainer>
    </Box>
  );
};

export default DataEncryptionAtRest;