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
  Checkbox,
  Tab,
  Tabs,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TreeView,
  TreeItem,
  Avatar,
  AvatarGroup,
  Badge,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  LinearProgress,
} from '@mui/material';
import {
  Security as SecurityIcon,
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Key as KeyIcon,
  Shield as ShieldIcon,
  Verified as VerifiedIcon,
  SupervisorAccount as SupervisorIcon,
  ManageAccounts as ManageAccountsIcon,
  AccountCircle as AccountCircleIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Assignment as AssignmentIcon,
  Description as DescriptionIcon,
  Business as BusinessIcon,
  Dashboard as DashboardIcon,
  Assessment as AssessmentIcon,
  Receipt as ReceiptIcon,
  Schedule as ScheduleIcon,
  LocalShipping as LocalShippingIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  Article as ArticleIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { AnimatedCard, SlideInContainer } from './MicroAnimations';

interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'execute' | 'manage';
  scope: 'global' | 'department' | 'team' | 'own';
  category: string;
  isSystemCritical: boolean;
  dependencies?: string[];
  metadata: {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    auditRequired: boolean;
    temporaryGrant: boolean;
    maxDuration?: number; // hours
  };
}

interface Role {
  id: string;
  name: string;
  description: string;
  type: 'system' | 'custom';
  isActive: boolean;
  permissions: string[];
  userCount: number;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  inheritsFrom?: string[];
  restrictions: {
    ipWhitelist?: string[];
    timeRestrictions?: {
      allowedHours: string[];
      allowedDays: string[];
      timezone: string;
    };
    sessionTimeout?: number; // minutes
    maxConcurrentSessions?: number;
  };
  metadata: {
    department?: string;
    level: number;
    canDelegate: boolean;
    requiresMFA: boolean;
  };
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  roles: string[];
  directPermissions: string[];
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  department: string;
  position: string;
  manager?: string;
  joinDate: Date;
  lastLogin?: Date;
  sessionInfo?: {
    isOnline: boolean;
    lastActivity: Date;
    ipAddress: string;
    deviceInfo: string;
  };
  temporaryAccess?: {
    permissions: string[];
    expiresAt: Date;
    grantedBy: string;
    reason: string;
  };
}

interface AccessRequest {
  id: string;
  userId: string;
  requestType: 'role' | 'permission' | 'temporary_access';
  targetRoleId?: string;
  targetPermissions?: string[];
  reason: string;
  justification: string;
  requestedBy: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewComments?: string;
  expiresAt?: Date;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  details: string;
  result: 'success' | 'failure' | 'blocked';
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  riskScore?: number;
  metadata: Record<string, any>;
}

interface RoleBasedAccessControlProps {
  currentUser?: User;
  onRoleAssigned?: (userId: string, roleId: string) => void;
  onPermissionGranted?: (userId: string, permissionId: string) => void;
  onAccessRequestSubmitted?: (request: AccessRequest) => void;
  onAuditEvent?: (event: AuditLog) => void;
}

const RoleBasedAccessControl: React.FC<RoleBasedAccessControlProps> = ({
  currentUser,
  onRoleAssigned,
  onPermissionGranted,
  onAccessRequestSubmitted,
  onAuditEvent,
}) => {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState(0);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [isAccessRequestDialogOpen, setIsAccessRequestDialogOpen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<string[]>(['permissions']);
  const [filterCriteria, setFilterCriteria] = useState({
    department: 'all',
    status: 'all',
    role: 'all',
  });

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = () => {
    // Initialize permissions with detailed structure
    const samplePermissions: Permission[] = [
      // Dashboard permissions
      {
        id: 'dashboard.view',
        name: 'Dashboard anzeigen',
        description: 'Zugriff auf das Haupt-Dashboard',
        resource: 'dashboard',
        action: 'read',
        scope: 'global',
        category: 'dashboard',
        isSystemCritical: false,
        metadata: {
          riskLevel: 'low',
          auditRequired: false,
          temporaryGrant: false,
        },
      },
      {
        id: 'dashboard.analytics',
        name: 'Analytics Dashboard',
        description: 'Zugriff auf detaillierte Analytics und Berichte',
        resource: 'dashboard',
        action: 'read',
        scope: 'department',
        category: 'dashboard',
        isSystemCritical: false,
        metadata: {
          riskLevel: 'medium',
          auditRequired: true,
          temporaryGrant: false,
        },
      },
      // Customer permissions
      {
        id: 'customers.view',
        name: 'Kunden anzeigen',
        description: 'Kundendaten einsehen',
        resource: 'customers',
        action: 'read',
        scope: 'department',
        category: 'customers',
        isSystemCritical: false,
        metadata: {
          riskLevel: 'medium',
          auditRequired: true,
          temporaryGrant: false,
        },
      },
      {
        id: 'customers.create',
        name: 'Kunden erstellen',
        description: 'Neue Kunden anlegen',
        resource: 'customers',
        action: 'create',
        scope: 'department',
        category: 'customers',
        isSystemCritical: false,
        dependencies: ['customers.view'],
        metadata: {
          riskLevel: 'medium',
          auditRequired: true,
          temporaryGrant: false,
        },
      },
      {
        id: 'customers.edit',
        name: 'Kunden bearbeiten',
        description: 'Kundendaten ändern',
        resource: 'customers',
        action: 'update',
        scope: 'department',
        category: 'customers',
        isSystemCritical: false,
        dependencies: ['customers.view'],
        metadata: {
          riskLevel: 'high',
          auditRequired: true,
          temporaryGrant: false,
        },
      },
      {
        id: 'customers.delete',
        name: 'Kunden löschen',
        description: 'Kunden unwiderruflich löschen',
        resource: 'customers',
        action: 'delete',
        scope: 'global',
        category: 'customers',
        isSystemCritical: true,
        dependencies: ['customers.view', 'customers.edit'],
        metadata: {
          riskLevel: 'critical',
          auditRequired: true,
          temporaryGrant: false,
        },
      },
      // Quote permissions
      {
        id: 'quotes.view',
        name: 'Angebote anzeigen',
        description: 'Angebote einsehen',
        resource: 'quotes',
        action: 'read',
        scope: 'team',
        category: 'quotes',
        isSystemCritical: false,
        metadata: {
          riskLevel: 'low',
          auditRequired: false,
          temporaryGrant: false,
        },
      },
      {
        id: 'quotes.create',
        name: 'Angebote erstellen',
        description: 'Neue Angebote erstellen',
        resource: 'quotes',
        action: 'create',
        scope: 'team',
        category: 'quotes',
        isSystemCritical: false,
        dependencies: ['quotes.view', 'customers.view'],
        metadata: {
          riskLevel: 'medium',
          auditRequired: true,
          temporaryGrant: false,
        },
      },
      {
        id: 'quotes.approve',
        name: 'Angebote genehmigen',
        description: 'Angebote freigeben und genehmigen',
        resource: 'quotes',
        action: 'execute',
        scope: 'department',
        category: 'quotes',
        isSystemCritical: false,
        dependencies: ['quotes.view', 'quotes.create'],
        metadata: {
          riskLevel: 'high',
          auditRequired: true,
          temporaryGrant: false,
        },
      },
      // Invoice permissions
      {
        id: 'invoices.view',
        name: 'Rechnungen anzeigen',
        description: 'Rechnungen einsehen',
        resource: 'invoices',
        action: 'read',
        scope: 'department',
        category: 'invoices',
        isSystemCritical: false,
        metadata: {
          riskLevel: 'medium',
          auditRequired: true,
          temporaryGrant: false,
        },
      },
      {
        id: 'invoices.create',
        name: 'Rechnungen erstellen',
        description: 'Neue Rechnungen erstellen',
        resource: 'invoices',
        action: 'create',
        scope: 'department',
        category: 'invoices',
        isSystemCritical: false,
        dependencies: ['invoices.view'],
        metadata: {
          riskLevel: 'high',
          auditRequired: true,
          temporaryGrant: false,
        },
      },
      {
        id: 'invoices.payment',
        name: 'Zahlungen verbuchen',
        description: 'Zahlungseingänge verbuchen',
        resource: 'invoices',
        action: 'update',
        scope: 'department',
        category: 'invoices',
        isSystemCritical: true,
        dependencies: ['invoices.view'],
        metadata: {
          riskLevel: 'critical',
          auditRequired: true,
          temporaryGrant: false,
        },
      },
      // System permissions
      {
        id: 'system.admin',
        name: 'System-Administration',
        description: 'Vollzugriff auf Systemeinstellungen',
        resource: 'system',
        action: 'manage',
        scope: 'global',
        category: 'system',
        isSystemCritical: true,
        metadata: {
          riskLevel: 'critical',
          auditRequired: true,
          temporaryGrant: false,
        },
      },
      {
        id: 'users.manage',
        name: 'Benutzer verwalten',
        description: 'Benutzer und Rollen verwalten',
        resource: 'users',
        action: 'manage',
        scope: 'global',
        category: 'system',
        isSystemCritical: true,
        metadata: {
          riskLevel: 'critical',
          auditRequired: true,
          temporaryGrant: false,
        },
      },
      {
        id: 'audit.view',
        name: 'Audit-Logs einsehen',
        description: 'Zugriff auf Audit-Protokolle',
        resource: 'audit',
        action: 'read',
        scope: 'global',
        category: 'system',
        isSystemCritical: false,
        metadata: {
          riskLevel: 'high',
          auditRequired: true,
          temporaryGrant: false,
        },
      },
    ];

    // Initialize roles
    const sampleRoles: Role[] = [
      {
        id: 'admin',
        name: 'Administrator',
        description: 'Vollzugriff auf alle Funktionen',
        type: 'system',
        isActive: true,
        permissions: samplePermissions.map(p => p.id),
        userCount: 2,
        createdAt: new Date('2024-01-01'),
        createdBy: 'system',
        updatedAt: new Date('2024-01-01'),
        updatedBy: 'system',
        restrictions: {
          ipWhitelist: ['192.168.1.0/24'],
          sessionTimeout: 480,
          maxConcurrentSessions: 2,
        },
        metadata: {
          level: 10,
          canDelegate: true,
          requiresMFA: true,
        },
      },
      {
        id: 'manager',
        name: 'Manager',
        description: 'Führungskraft mit erweiterten Rechten',
        type: 'system',
        isActive: true,
        permissions: [
          'dashboard.view',
          'dashboard.analytics',
          'customers.view',
          'customers.create',
          'customers.edit',
          'quotes.view',
          'quotes.create',
          'quotes.approve',
          'invoices.view',
          'invoices.create',
          'audit.view',
        ],
        userCount: 5,
        createdAt: new Date('2024-01-01'),
        createdBy: 'system',
        updatedAt: new Date('2024-01-01'),
        updatedBy: 'system',
        restrictions: {
          sessionTimeout: 360,
          maxConcurrentSessions: 3,
        },
        metadata: {
          level: 7,
          canDelegate: true,
          requiresMFA: true,
        },
      },
      {
        id: 'employee',
        name: 'Mitarbeiter',
        description: 'Standard-Mitarbeiter mit Grundrechten',
        type: 'system',
        isActive: true,
        permissions: [
          'dashboard.view',
          'customers.view',
          'quotes.view',
          'quotes.create',
          'invoices.view',
        ],
        userCount: 25,
        createdAt: new Date('2024-01-01'),
        createdBy: 'system',
        updatedAt: new Date('2024-01-01'),
        updatedBy: 'system',
        restrictions: {
          sessionTimeout: 240,
          maxConcurrentSessions: 1,
        },
        metadata: {
          level: 3,
          canDelegate: false,
          requiresMFA: false,
        },
      },
      {
        id: 'accountant',
        name: 'Buchhalter',
        description: 'Spezialisiert auf Finanz- und Rechnungswesen',
        type: 'custom',
        isActive: true,
        permissions: [
          'dashboard.view',
          'dashboard.analytics',
          'customers.view',
          'invoices.view',
          'invoices.create',
          'invoices.payment',
          'audit.view',
        ],
        userCount: 3,
        createdAt: new Date('2024-02-15'),
        createdBy: 'admin@relocato.de',
        updatedAt: new Date('2024-02-15'),
        updatedBy: 'admin@relocato.de',
        restrictions: {
          sessionTimeout: 300,
          maxConcurrentSessions: 1,
        },
        metadata: {
          department: 'Finance',
          level: 5,
          canDelegate: false,
          requiresMFA: true,
        },
      },
      {
        id: 'sales',
        name: 'Vertrieb',
        description: 'Vertriebsmitarbeiter mit Kunden- und Angebotsfokus',
        type: 'custom',
        isActive: true,
        permissions: [
          'dashboard.view',
          'customers.view',
          'customers.create',
          'customers.edit',
          'quotes.view',
          'quotes.create',
        ],
        userCount: 8,
        createdAt: new Date('2024-02-20'),
        createdBy: 'admin@relocato.de',
        updatedAt: new Date('2024-02-20'),
        updatedBy: 'admin@relocato.de',
        restrictions: {
          sessionTimeout: 480,
          maxConcurrentSessions: 2,
        },
        metadata: {
          department: 'Sales',
          level: 4,
          canDelegate: false,
          requiresMFA: false,
        },
      },
    ];

    // Initialize users
    const sampleUsers: User[] = [
      {
        id: 'user-1',
        firstName: 'Max',
        lastName: 'Mustermann',
        email: 'max.mustermann@relocato.de',
        roles: ['admin'],
        directPermissions: [],
        status: 'active',
        department: 'IT',
        position: 'IT-Administrator',
        joinDate: new Date('2023-01-15'),
        lastLogin: new Date('2024-12-06T09:30:00'),
        sessionInfo: {
          isOnline: true,
          lastActivity: new Date(),
          ipAddress: '192.168.1.100',
          deviceInfo: 'Chrome 119.0 / Windows 10',
        },
      },
      {
        id: 'user-2',
        firstName: 'Anna',
        lastName: 'Schmidt',
        email: 'anna.schmidt@relocato.de',
        roles: ['manager'],
        directPermissions: ['customers.delete'],
        status: 'active',
        department: 'Operations',
        position: 'Operations Manager',
        manager: 'user-1',
        joinDate: new Date('2023-03-10'),
        lastLogin: new Date('2024-12-06T08:15:00'),
        sessionInfo: {
          isOnline: true,
          lastActivity: new Date('2024-12-06T10:45:00'),
          ipAddress: '192.168.1.105',
          deviceInfo: 'Safari 17.0 / macOS 14.0',
        },
      },
      {
        id: 'user-3',
        firstName: 'Thomas',
        lastName: 'Weber',
        email: 'thomas.weber@relocato.de',
        roles: ['accountant'],
        directPermissions: [],
        status: 'active',
        department: 'Finance',
        position: 'Buchhalter',
        manager: 'user-2',
        joinDate: new Date('2023-06-01'),
        lastLogin: new Date('2024-12-05T16:30:00'),
        sessionInfo: {
          isOnline: false,
          lastActivity: new Date('2024-12-05T17:00:00'),
          ipAddress: '192.168.1.110',
          deviceInfo: 'Chrome 119.0 / Windows 11',
        },
      },
      {
        id: 'user-4',
        firstName: 'Sarah',
        lastName: 'Müller',
        email: 'sarah.mueller@relocato.de',
        roles: ['sales', 'employee'],
        directPermissions: [],
        status: 'active',
        department: 'Sales',
        position: 'Vertriebsmitarbeiterin',
        manager: 'user-2',
        joinDate: new Date('2023-09-15'),
        lastLogin: new Date('2024-12-06T07:45:00'),
        sessionInfo: {
          isOnline: true,
          lastActivity: new Date('2024-12-06T11:20:00'),
          ipAddress: '192.168.1.115',
          deviceInfo: 'Firefox 120.0 / Windows 10',
        },
      },
      {
        id: 'user-5',
        firstName: 'Michael',
        lastName: 'Klein',
        email: 'michael.klein@relocato.de',
        roles: ['employee'],
        directPermissions: [],
        status: 'inactive',
        department: 'Operations',
        position: 'Umzugshelfer',
        manager: 'user-2',
        joinDate: new Date('2024-01-10'),
        lastLogin: new Date('2024-11-28T14:20:00'),
        temporaryAccess: {
          permissions: ['quotes.approve'],
          expiresAt: new Date('2024-12-15'),
          grantedBy: 'user-2',
          reason: 'Vertretung während Urlaub',
        },
      },
    ];

    // Initialize access requests
    const sampleAccessRequests: AccessRequest[] = [
      {
        id: 'req-1',
        userId: 'user-4',
        requestType: 'permission',
        targetPermissions: ['quotes.approve'],
        reason: 'Benötige Genehmigungsrechte für Großkunden-Angebote',
        justification: 'Als Senior Vertriebsmitarbeiterin sollte ich eigenständig Angebote bis 10.000€ genehmigen können',
        requestedBy: 'user-4',
        requestedAt: new Date('2024-12-05T14:30:00'),
        status: 'pending',
        urgency: 'medium',
      },
      {
        id: 'req-2',
        userId: 'user-5',
        requestType: 'temporary_access',
        targetPermissions: ['invoices.view', 'invoices.create'],
        reason: 'Vertretung in der Buchhaltung',
        justification: 'Thomas Weber ist krank, ich übernehme temporär seine Aufgaben',
        requestedBy: 'user-2',
        requestedAt: new Date('2024-12-04T09:15:00'),
        status: 'approved',
        reviewedBy: 'user-1',
        reviewedAt: new Date('2024-12-04T10:00:00'),
        reviewComments: 'Genehmigt für 1 Woche',
        expiresAt: new Date('2024-12-11T23:59:59'),
        urgency: 'high',
      },
    ];

    // Initialize audit logs
    const sampleAuditLogs: AuditLog[] = [
      {
        id: 'audit-1',
        userId: 'user-2',
        action: 'PERMISSION_GRANTED',
        resource: 'users.manage',
        details: 'Berechtigung "Benutzer verwalten" an user-4 vergeben',
        result: 'success',
        timestamp: new Date('2024-12-06T10:30:00'),
        ipAddress: '192.168.1.105',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        sessionId: 'sess_abc123',
        riskScore: 7,
        metadata: {
          targetUserId: 'user-4',
          permissionId: 'users.manage',
          grantType: 'temporary',
        },
      },
      {
        id: 'audit-2',
        userId: 'user-1',
        action: 'ROLE_ASSIGNED',
        resource: 'roles',
        details: 'Rolle "Manager" an user-2 zugewiesen',
        result: 'success',
        timestamp: new Date('2024-12-05T16:45:00'),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        sessionId: 'sess_def456',
        riskScore: 5,
        metadata: {
          targetUserId: 'user-2',
          roleId: 'manager',
        },
      },
      {
        id: 'audit-3',
        userId: 'user-3',
        action: 'ACCESS_DENIED',
        resource: 'customers.delete',
        details: 'Zugriff auf Kundenlöschung verweigert - unzureichende Berechtigung',
        result: 'blocked',
        timestamp: new Date('2024-12-05T14:20:00'),
        ipAddress: '192.168.1.110',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        sessionId: 'sess_ghi789',
        riskScore: 3,
        metadata: {
          attemptedResource: 'customers.delete',
          customerId: 'cust_123',
        },
      },
    ];

    setPermissions(samplePermissions);
    setRoles(sampleRoles);
    setUsers(sampleUsers);
    setAccessRequests(sampleAccessRequests.sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime()));
    setAuditLogs(sampleAuditLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
  };

  const getUserPermissions = (userId: string): Permission[] => {
    const user = users.find(u => u.id === userId);
    if (!user) return [];

    const allPermissions = new Set<string>();

    // Add permissions from roles
    user.roles.forEach(roleId => {
      const role = roles.find(r => r.id === roleId);
      if (role) {
        role.permissions.forEach(permId => allPermissions.add(permId));
      }
    });

    // Add direct permissions
    user.directPermissions.forEach(permId => allPermissions.add(permId));

    // Add temporary permissions
    if (user.temporaryAccess && user.temporaryAccess.expiresAt > new Date()) {
      user.temporaryAccess.permissions.forEach(permId => allPermissions.add(permId));
    }

    return permissions.filter(p => allPermissions.has(p.id));
  };

  const getRiskLevel = (userId: string): 'low' | 'medium' | 'high' | 'critical' => {
    const userPermissions = getUserPermissions(userId);
    const criticalCount = userPermissions.filter(p => p.metadata.riskLevel === 'critical').length;
    const highCount = userPermissions.filter(p => p.metadata.riskLevel === 'high').length;

    if (criticalCount > 0) return 'critical';
    if (highCount > 3) return 'high';
    if (highCount > 0 || userPermissions.length > 10) return 'medium';
    return 'low';
  };

  const getPermissionsByCategory = () => {
    return permissions.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const departmentMatch = filterCriteria.department === 'all' || user.department === filterCriteria.department;
      const statusMatch = filterCriteria.status === 'all' || user.status === filterCriteria.status;
      const roleMatch = filterCriteria.role === 'all' || user.roles.includes(filterCriteria.role);
      
      return departmentMatch && statusMatch && roleMatch;
    });
  }, [users, filterCriteria]);

  const renderRolesTab = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Rollen verwalten
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsRoleDialogOpen(true)}
        >
          Neue Rolle
        </Button>
      </Box>

      <Grid container spacing={3}>
        {roles.map((role, index) => (
          <Grid item xs={12} md={6} lg={4} key={role.id}>
            <AnimatedCard delay={index * 100}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      backgroundColor: alpha(
                        role.type === 'system' ? theme.palette.primary.main : theme.palette.secondary.main, 
                        0.1
                      ),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {role.type === 'system' ? (
                      <AdminIcon color="primary" />
                    ) : (
                      <GroupIcon color="secondary" />
                    )}
                  </Box>
                  
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {role.name}
                      </Typography>
                      <Chip 
                        label={role.type} 
                        size="small" 
                        color={role.type === 'system' ? 'primary' : 'secondary'}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {role.description}
                    </Typography>
                  </Box>
                  
                  <Switch checked={role.isActive} />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {role.userCount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Benutzer
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {role.permissions.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Berechtigungen
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {role.metadata.level}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Level
                    </Typography>
                  </Box>
                </Box>
                
                {role.metadata.requiresMFA && (
                  <Chip 
                    label="MFA erforderlich" 
                    size="small" 
                    color="warning" 
                    icon={<ShieldIcon />}
                    sx={{ mb: 2 }}
                  />
                )}
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setSelectedRole(role);
                      setIsRoleDialogOpen(true);
                    }}
                    fullWidth
                  >
                    Details
                  </Button>
                  <IconButton size="small">
                    <EditIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </AnimatedCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderUsersTab = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Benutzer verwalten
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsUserDialogOpen(true)}
        >
          Neuer Benutzer
        </Button>
      </Box>

      {/* Filters */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Abteilung</InputLabel>
              <Select
                value={filterCriteria.department}
                onChange={(e) => setFilterCriteria(prev => ({ ...prev, department: e.target.value }))}
              >
                <MenuItem value="all">Alle</MenuItem>
                <MenuItem value="IT">IT</MenuItem>
                <MenuItem value="Operations">Operations</MenuItem>
                <MenuItem value="Finance">Finance</MenuItem>
                <MenuItem value="Sales">Sales</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterCriteria.status}
                onChange={(e) => setFilterCriteria(prev => ({ ...prev, status: e.target.value }))}
              >
                <MenuItem value="all">Alle</MenuItem>
                <MenuItem value="active">Aktiv</MenuItem>
                <MenuItem value="inactive">Inaktiv</MenuItem>
                <MenuItem value="suspended">Gesperrt</MenuItem>
                <MenuItem value="pending">Ausstehend</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Rolle</InputLabel>
              <Select
                value={filterCriteria.role}
                onChange={(e) => setFilterCriteria(prev => ({ ...prev, role: e.target.value }))}
              >
                <MenuItem value="all">Alle</MenuItem>
                {roles.map(role => (
                  <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              {filteredUsers.length} von {users.length} Benutzern
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Benutzer</TableCell>
              <TableCell>Rollen</TableCell>
              <TableCell>Abteilung</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Risiko-Level</TableCell>
              <TableCell>Letzte Anmeldung</TableCell>
              <TableCell>Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ width: 40, height: 40 }}>
                      {user.firstName[0]}{user.lastName[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {user.firstName} {user.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.email}
                      </Typography>
                      {user.sessionInfo?.isOnline && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <Box 
                            sx={{ 
                              width: 8, 
                              height: 8, 
                              borderRadius: '50%', 
                              backgroundColor: 'success.main' 
                            }} 
                          />
                          <Typography variant="caption" color="success.main">
                            Online
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {user.roles.map(roleId => {
                      const role = roles.find(r => r.id === roleId);
                      return role ? (
                        <Chip
                          key={roleId}
                          label={role.name}
                          size="small"
                          color={role.type === 'system' ? 'primary' : 'secondary'}
                        />
                      ) : null;
                    })}
                    {user.directPermissions.length > 0 && (
                      <Chip
                        label={`+${user.directPermissions.length} direkt`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {user.department}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user.position}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.status}
                    size="small"
                    color={
                      user.status === 'active' ? 'success' :
                      user.status === 'inactive' ? 'default' :
                      user.status === 'suspended' ? 'error' : 'warning'
                    }
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={getRiskLevel(user.id)}
                    size="small"
                    color={
                      getRiskLevel(user.id) === 'critical' ? 'error' :
                      getRiskLevel(user.id) === 'high' ? 'warning' :
                      getRiskLevel(user.id) === 'medium' ? 'info' : 'success'
                    }
                  />
                </TableCell>
                <TableCell>
                  {user.lastLogin ? (
                    <Typography variant="body2">
                      {format(user.lastLogin, 'dd.MM.yyyy HH:mm', { locale: de })}
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
                          setSelectedUser(user);
                          setIsUserDialogOpen(true);
                        }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Bearbeiten">
                      <IconButton size="small">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Sperren">
                      <IconButton size="small" color="error">
                        <LockIcon />
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

  const renderPermissionsTab = () => {
    const permissionsByCategory = getPermissionsByCategory();

    return (
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
          Berechtigungen verwalten
        </Typography>

        {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
          <Accordion key={category} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                  {category}
                </Typography>
                <Chip 
                  label={`${categoryPermissions.length} Berechtigungen`} 
                  size="small" 
                  color="primary"
                />
                <Box sx={{ flex: 1 }} />
                <Chip
                  label={`${categoryPermissions.filter(p => p.isSystemCritical).length} kritisch`}
                  size="small"
                  color="error"
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Aktion</TableCell>
                      <TableCell>Bereich</TableCell>
                      <TableCell>Risiko</TableCell>
                      <TableCell>Kritisch</TableCell>
                      <TableCell>Abhängigkeiten</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categoryPermissions.map((permission) => (
                      <TableRow key={permission.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {permission.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {permission.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={permission.action} 
                            size="small" 
                            color={
                              permission.action === 'delete' ? 'error' :
                              permission.action === 'create' || permission.action === 'update' ? 'warning' :
                              'default'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {permission.scope}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={permission.metadata.riskLevel}
                            size="small"
                            color={
                              permission.metadata.riskLevel === 'critical' ? 'error' :
                              permission.metadata.riskLevel === 'high' ? 'warning' :
                              permission.metadata.riskLevel === 'medium' ? 'info' : 'success'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {permission.isSystemCritical ? (
                            <WarningIcon color="error" />
                          ) : (
                            <CheckIcon color="success" />
                          )}
                        </TableCell>
                        <TableCell>
                          {permission.dependencies && permission.dependencies.length > 0 ? (
                            <Tooltip title={permission.dependencies.join(', ')}>
                              <Chip 
                                label={`${permission.dependencies.length} abhängig`} 
                                size="small" 
                                variant="outlined"
                              />
                            </Tooltip>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              Keine
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  };

  const renderAccessRequestsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Zugriffsanfragen
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsAccessRequestDialogOpen(true)}
        >
          Neue Anfrage
        </Button>
      </Box>

      <List>
        {accessRequests.map((request) => {
          const user = users.find(u => u.id === request.userId);
          const reviewer = request.reviewedBy ? users.find(u => u.id === request.reviewedBy) : null;
          
          return (
            <React.Fragment key={request.id}>
              <ListItem sx={{ px: 0 }}>
                <Paper elevation={1} sx={{ width: '100%', p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar>
                      {user ? `${user.firstName[0]}${user.lastName[0]}` : '?'}
                    </Avatar>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {user ? `${user.firstName} ${user.lastName}` : 'Unbekannter Benutzer'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {request.requestType === 'role' ? 'Rollenanfrage' :
                         request.requestType === 'permission' ? 'Berechtigungsanfrage' :
                         'Temporärer Zugriff'}
                      </Typography>
                    </Box>
                    
                    <Chip
                      label={request.status}
                      size="small"
                      color={
                        request.status === 'approved' ? 'success' :
                        request.status === 'rejected' ? 'error' :
                        request.status === 'expired' ? 'default' : 'warning'
                      }
                    />
                    
                    <Chip
                      label={request.urgency}
                      size="small"
                      color={
                        request.urgency === 'critical' ? 'error' :
                        request.urgency === 'high' ? 'warning' : 'info'
                      }
                    />
                  </Box>
                  
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Grund:</strong> {request.reason}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>Begründung:</strong> {request.justification}
                  </Typography>
                  
                  {request.targetPermissions && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        Angeforderte Berechtigungen:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {request.targetPermissions.map(permId => {
                          const permission = permissions.find(p => p.id === permId);
                          return permission ? (
                            <Chip
                              key={permId}
                              label={permission.name}
                              size="small"
                              variant="outlined"
                            />
                          ) : null;
                        })}
                      </Box>
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Angefragt: {format(request.requestedAt, 'dd.MM.yyyy HH:mm', { locale: de })}
                      {request.expiresAt && ` • Läuft ab: ${format(request.expiresAt, 'dd.MM.yyyy', { locale: de })}`}
                    </Typography>
                    
                    {request.status === 'pending' && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckIcon />}
                        >
                          Genehmigen
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<CloseIcon />}
                        >
                          Ablehnen
                        </Button>
                      </Box>
                    )}
                  </Box>
                  
                  {request.reviewComments && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        <strong>Reviewer-Kommentar:</strong> {request.reviewComments}
                      </Typography>
                      {reviewer && (
                        <Typography variant="caption" color="text.secondary">
                          Bearbeitet von {reviewer.firstName} {reviewer.lastName} am {format(request.reviewedAt!, 'dd.MM.yyyy HH:mm')}
                        </Typography>
                      )}
                    </Alert>
                  )}
                </Paper>
              </ListItem>
            </React.Fragment>
          );
        })}
      </List>
    </Box>
  );

  const renderAuditTab = () => (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Audit-Protokoll
      </Typography>
      
      <List>
        {auditLogs.map((log) => {
          const user = users.find(u => u.id === log.userId);
          
          return (
            <React.Fragment key={log.id}>
              <ListItem>
                <ListItemIcon>
                  {log.result === 'success' ? (
                    <CheckIcon color="success" />
                  ) : log.result === 'blocked' ? (
                    <LockIcon color="error" />
                  ) : (
                    <WarningIcon color="warning" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {log.action}
                      </Typography>
                      <Chip 
                        label={log.resource} 
                        size="small" 
                        variant="outlined"
                      />
                      {log.riskScore && log.riskScore > 5 && (
                        <Chip
                          label={`Risiko: ${log.riskScore}/10`}
                          size="small"
                          color={log.riskScore > 7 ? 'error' : 'warning'}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        {log.details}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user ? `${user.firstName} ${user.lastName}` : 'Unbekannter Benutzer'} • 
                        {format(log.timestamp, 'dd.MM.yyyy HH:mm:ss', { locale: de })} • 
                        {log.ipAddress}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Chip
                    label={log.result}
                    size="small"
                    color={
                      log.result === 'success' ? 'success' :
                      log.result === 'blocked' ? 'error' : 'warning'
                    }
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
            </React.Fragment>
          );
        })}
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
              <ManageAccountsIcon color="primary" />
              Role-Based Access Control
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label={`${users.filter(u => u.status === 'active').length} aktive Benutzer`}
                color="success"
                icon={<PeopleIcon />}
              />
              <Chip
                label={`${roles.length} Rollen`}
                color="primary"
                icon={<GroupIcon />}
              />
            </Box>
          </Box>
          
          <Typography variant="body1" color="text.secondary">
            Umfassendes Rollen- und Berechtigungsmanagement mit granularer Zugriffskontrolle
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
                  <GroupIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {roles.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Rollen definiert
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
                      {permissions.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Berechtigungen
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
                  <AssignmentIcon color="warning" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {accessRequests.filter(r => r.status === 'pending').length}
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
                  <WarningIcon color="error" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {auditLogs.filter(l => l.result === 'blocked').length}
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

      {/* Navigation Tabs */}
      <SlideInContainer delay={400}>
        <Paper elevation={2} sx={{ mb: 4 }}>
          <Tabs
            value={selectedTab}
            onChange={(e, newValue) => setSelectedTab(newValue)}
            variant="fullWidth"
          >
            <Tab label="Rollen" icon={<GroupIcon />} />
            <Tab label="Benutzer" icon={<PeopleIcon />} />
            <Tab label="Berechtigungen" icon={<KeyIcon />} />
            <Tab label="Anfragen" icon={<AssignmentIcon />} />
            <Tab label="Audit" icon={<DescriptionIcon />} />
          </Tabs>
        </Paper>
      </SlideInContainer>

      {/* Tab Content */}
      <SlideInContainer delay={600}>
        {selectedTab === 0 && renderRolesTab()}
        {selectedTab === 1 && renderUsersTab()}
        {selectedTab === 2 && renderPermissionsTab()}
        {selectedTab === 3 && renderAccessRequestsTab()}
        {selectedTab === 4 && renderAuditTab()}
      </SlideInContainer>
    </Box>
  );
};

export default RoleBasedAccessControl;