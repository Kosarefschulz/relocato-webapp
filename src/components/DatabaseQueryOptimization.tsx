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
  Badge,
  Avatar,
  TablePagination,
} from '@mui/material';
import {
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Memory as MemoryIcon,
  Timer as TimerIcon,
  Assignment as QueryIcon,
  Build as OptimizeIcon,
  Insights as InsightsIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Code as CodeIcon,
  Timeline as TimelineIcon,
  DataUsage as DataUsageIcon,
  Update as UpdateIcon,
  AutoFixHigh as AutoFixIcon,
  BugReport as BugReportIcon,
  ExpandMore as ExpandMoreIcon,
  Tune as TuneIcon,
  Description as DescriptionIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  ShowChart as ShowChartIcon,
  TableChart as TableChartIcon,
  CompareArrows as CompareIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  GetApp as ExportIcon,
  CloudUpload as CloudUploadIcon,
  Database as DatabaseIcon,
  MonitorHeart as MonitorIcon,
} from '@mui/icons-material';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

interface QueryPerformanceMetrics {
  id: string;
  query: string;
  queryType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'JOIN' | 'AGGREGATE';
  table: string;
  executionTime: number; // milliseconds
  rowsAffected: number;
  indexesUsed: string[];
  cpuUsage: number; // percentage
  memoryUsage: number; // MB
  diskIO: number; // MB/s
  frequency: number; // executions per hour
  lastExecuted: Date;
  status: 'optimal' | 'slow' | 'critical' | 'error';
  optimizationPotential: number; // percentage
  estimatedImprovement: number; // milliseconds saved
  complexity: 'low' | 'medium' | 'high' | 'very_high';
  cacheHitRate: number; // percentage
  lockWaitTime: number; // milliseconds
  planCost: number;
  actualCost: number;
}

interface DatabaseIndex {
  id: string;
  name: string;
  table: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gist' | 'gin' | 'brin';
  isUnique: boolean;
  size: number; // MB
  usage: number; // times used per hour
  effectiveness: number; // percentage
  lastUsed: Date;
  createdAt: Date;
  status: 'active' | 'unused' | 'redundant' | 'suggested';
  impactScore: number; // 0-100
  maintenanceCost: number; // relative cost
  selectivity: number; // percentage
}

interface OptimizationSuggestion {
  id: string;
  type: 'index_creation' | 'index_removal' | 'query_rewrite' | 'table_partitioning' | 'schema_normalization' | 'caching_strategy';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  estimatedImpact: {
    performanceGain: number; // percentage
    timeReduction: number; // milliseconds
    resourceSavings: number; // percentage
    complexityReduction: number; // percentage
  };
  implementationEffort: 'low' | 'medium' | 'high' | 'very_high';
  riskLevel: 'low' | 'medium' | 'high';
  affectedQueries: string[];
  affectedTables: string[];
  sqlCode?: string;
  rollbackPlan?: string;
  testingRequired: boolean;
  estimatedDowntime: number; // minutes
  dependencies: string[];
  status: 'pending' | 'approved' | 'implementing' | 'completed' | 'rejected';
  createdAt: Date;
  implementedAt?: Date;
  reviewedBy?: string;
}

interface DatabaseTable {
  id: string;
  name: string;
  schema: string;
  rows: number;
  size: number; // MB
  averageRowSize: number; // bytes
  indexes: DatabaseIndex[];
  queryFrequency: number; // queries per hour
  lastAnalyzed: Date;
  fragmentationLevel: number; // percentage
  growthRate: number; // rows per day
  hotspots: string[]; // frequently accessed columns
  partitioned: boolean;
  compressionRatio: number; // percentage
  lockContention: number; // conflicts per hour
  statistics: {
    selectQueries: number;
    insertQueries: number;
    updateQueries: number;
    deleteQueries: number;
  };
}

interface QueryExecutionPlan {
  id: string;
  queryId: string;
  planType: 'sequential_scan' | 'index_scan' | 'bitmap_scan' | 'nested_loop' | 'hash_join' | 'merge_join';
  estimatedCost: number;
  actualCost: number;
  estimatedRows: number;
  actualRows: number;
  estimatedTime: number;
  actualTime: number;
  bufferHits: number;
  bufferReads: number;
  tempBuffersUsed: number;
  operations: PlanOperation[];
  explanation: string;
  optimizationTips: string[];
}

interface PlanOperation {
  id: string;
  operation: string;
  table?: string;
  index?: string;
  cost: number;
  rows: number;
  time: number;
  children: PlanOperation[];
}

interface PerformanceMonitoring {
  timestamp: Date;
  totalQueries: number;
  avgResponseTime: number;
  slowQueries: number;
  errorRate: number;
  cacheHitRate: number;
  connectionCount: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  lockWaitTime: number;
  deadlocks: number;
  indexScans: number;
  sequentialScans: number;
}

interface DatabaseQueryOptimizationProps {
  onOptimizationApplied?: (suggestion: OptimizationSuggestion) => void;
  onQueryAnalyzed?: (metrics: QueryPerformanceMetrics) => void;
  onIndexCreated?: (index: DatabaseIndex) => void;
  onPerformanceAlert?: (alert: any) => void;
}

const DatabaseQueryOptimization: React.FC<DatabaseQueryOptimizationProps> = ({
  onOptimizationApplied,
  onQueryAnalyzed,
  onIndexCreated,
  onPerformanceAlert,
}) => {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState(0);
  const [queryMetrics, setQueryMetrics] = useState<QueryPerformanceMetrics[]>([]);
  const [databaseIndexes, setDatabaseIndexes] = useState<DatabaseIndex[]>([]);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [databaseTables, setDatabaseTables] = useState<DatabaseTable[]>([]);
  const [executionPlans, setExecutionPlans] = useState<QueryExecutionPlan[]>([]);
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceMonitoring[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<QueryPerformanceMetrics | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<OptimizationSuggestion | null>(null);
  const [selectedTable, setSelectedTable] = useState<DatabaseTable | null>(null);
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);
  const [isOptimizationDialogOpen, setIsOptimizationDialogOpen] = useState(false);
  const [isQueryDialogOpen, setIsQueryDialogOpen] = useState(false);
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [autoOptimization, setAutoOptimization] = useState(false);
  const [queryFilter, setQueryFilter] = useState('all');
  const [performanceFilter, setPerformanceFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<'executionTime' | 'frequency' | 'optimization'>('executionTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    initializeData();
    const monitoringInterval = setInterval(() => {
      if (isMonitoring) {
        updatePerformanceMetrics();
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(monitoringInterval);
  }, [isMonitoring]);

  const initializeData = () => {
    // Initialize sample query metrics
    const sampleQueries: QueryPerformanceMetrics[] = [
      {
        id: 'query-1',
        query: 'SELECT c.*, q.price FROM customers c JOIN quotes q ON c.id = q.customer_id WHERE c.status = \'active\' ORDER BY q.created_at DESC',
        queryType: 'JOIN',
        table: 'customers',
        executionTime: 2500,
        rowsAffected: 1250,
        indexesUsed: ['idx_customers_status', 'idx_quotes_customer_id'],
        cpuUsage: 85,
        memoryUsage: 120,
        diskIO: 15.2,
        frequency: 45,
        lastExecuted: new Date(Date.now() - 5 * 60 * 1000),
        status: 'slow',
        optimizationPotential: 75,
        estimatedImprovement: 1800,
        complexity: 'high',
        cacheHitRate: 65,
        lockWaitTime: 200,
        planCost: 1200.5,
        actualCost: 1850.3,
      },
      {
        id: 'query-2',
        query: 'SELECT COUNT(*) FROM invoices WHERE status = \'pending\' AND due_date < NOW()',
        queryType: 'AGGREGATE',
        table: 'invoices',
        executionTime: 450,
        rowsAffected: 1,
        indexesUsed: ['idx_invoices_status_due_date'],
        cpuUsage: 25,
        memoryUsage: 45,
        diskIO: 3.2,
        frequency: 120,
        lastExecuted: new Date(Date.now() - 2 * 60 * 1000),
        status: 'optimal',
        optimizationPotential: 15,
        estimatedImprovement: 50,
        complexity: 'low',
        cacheHitRate: 92,
        lockWaitTime: 10,
        planCost: 125.2,
        actualCost: 140.8,
      },
      {
        id: 'query-3',
        query: 'UPDATE customers SET last_contact = NOW() WHERE email IN (SELECT email FROM newsletter_subscribers)',
        queryType: 'UPDATE',
        table: 'customers',
        executionTime: 8500,
        rowsAffected: 3200,
        indexesUsed: ['idx_customers_email'],
        cpuUsage: 95,
        memoryUsage: 250,
        diskIO: 45.8,
        frequency: 12,
        lastExecuted: new Date(Date.now() - 15 * 60 * 1000),
        status: 'critical',
        optimizationPotential: 90,
        estimatedImprovement: 6800,
        complexity: 'very_high',
        cacheHitRate: 35,
        lockWaitTime: 1500,
        planCost: 2800.7,
        actualCost: 4200.9,
      },
      {
        id: 'query-4',
        query: 'SELECT * FROM quotes WHERE customer_id = ? AND status = \'draft\'',
        queryType: 'SELECT',
        table: 'quotes',
        executionTime: 120,
        rowsAffected: 15,
        indexesUsed: ['idx_quotes_customer_status'],
        cpuUsage: 15,
        memoryUsage: 25,
        diskIO: 1.2,
        frequency: 300,
        lastExecuted: new Date(Date.now() - 1 * 60 * 1000),
        status: 'optimal',
        optimizationPotential: 5,
        estimatedImprovement: 8,
        complexity: 'low',
        cacheHitRate: 98,
        lockWaitTime: 2,
        planCost: 25.4,
        actualCost: 28.1,
      },
      {
        id: 'query-5',
        query: 'INSERT INTO audit_log (user_id, action, timestamp, details) VALUES (?, ?, NOW(), ?)',
        queryType: 'INSERT',
        table: 'audit_log',
        executionTime: 180,
        rowsAffected: 1,
        indexesUsed: [],
        cpuUsage: 20,
        memoryUsage: 15,
        diskIO: 2.1,
        frequency: 500,
        lastExecuted: new Date(Date.now() - 30 * 1000),
        status: 'optimal',
        optimizationPotential: 10,
        estimatedImprovement: 15,
        complexity: 'low',
        cacheHitRate: 85,
        lockWaitTime: 5,
        planCost: 15.2,
        actualCost: 18.7,
      },
    ];

    // Initialize sample database indexes
    const sampleIndexes: DatabaseIndex[] = [
      {
        id: 'idx-1',
        name: 'idx_customers_status',
        table: 'customers',
        columns: ['status'],
        type: 'btree',
        isUnique: false,
        size: 12.5,
        usage: 150,
        effectiveness: 85,
        lastUsed: new Date(Date.now() - 5 * 60 * 1000),
        createdAt: new Date('2023-01-15'),
        status: 'active',
        impactScore: 85,
        maintenanceCost: 15,
        selectivity: 25,
      },
      {
        id: 'idx-2',
        name: 'idx_quotes_customer_id',
        table: 'quotes',
        columns: ['customer_id'],
        type: 'btree',
        isUnique: false,
        size: 8.2,
        usage: 200,
        effectiveness: 92,
        lastUsed: new Date(Date.now() - 2 * 60 * 1000),
        createdAt: new Date('2023-02-01'),
        status: 'active',
        impactScore: 92,
        maintenanceCost: 12,
        selectivity: 45,
      },
      {
        id: 'idx-3',
        name: 'idx_old_unused_index',
        table: 'temp_data',
        columns: ['old_column'],
        type: 'btree',
        isUnique: false,
        size: 25.8,
        usage: 0,
        effectiveness: 0,
        lastUsed: new Date('2023-06-15'),
        createdAt: new Date('2022-12-01'),
        status: 'unused',
        impactScore: 5,
        maintenanceCost: 35,
        selectivity: 85,
      },
      {
        id: 'idx-4',
        name: 'idx_invoices_status_due_date',
        table: 'invoices',
        columns: ['status', 'due_date'],
        type: 'btree',
        isUnique: false,
        size: 15.6,
        usage: 180,
        effectiveness: 88,
        lastUsed: new Date(Date.now() - 3 * 60 * 1000),
        createdAt: new Date('2023-03-10'),
        status: 'active',
        impactScore: 88,
        maintenanceCost: 18,
        selectivity: 35,
      },
      {
        id: 'idx-5',
        name: 'suggested_customers_email_created',
        table: 'customers',
        columns: ['email', 'created_at'],
        type: 'btree',
        isUnique: false,
        size: 0,
        usage: 0,
        effectiveness: 0,
        lastUsed: new Date(),
        createdAt: new Date(),
        status: 'suggested',
        impactScore: 78,
        maintenanceCost: 22,
        selectivity: 95,
      },
    ];

    // Initialize optimization suggestions
    const sampleSuggestions: OptimizationSuggestion[] = [
      {
        id: 'suggestion-1',
        type: 'index_creation',
        priority: 'high',
        title: 'Erstelle Index für Newsletter-Abfrage',
        description: 'Ein zusammengesetzter Index auf customers(email, created_at) würde die Newsletter-Performance um 75% verbessern',
        estimatedImpact: {
          performanceGain: 75,
          timeReduction: 6800,
          resourceSavings: 45,
          complexityReduction: 30,
        },
        implementationEffort: 'low',
        riskLevel: 'low',
        affectedQueries: ['query-3'],
        affectedTables: ['customers'],
        sqlCode: 'CREATE INDEX CONCURRENTLY idx_customers_email_created ON customers (email, created_at);',
        rollbackPlan: 'DROP INDEX IF EXISTS idx_customers_email_created;',
        testingRequired: true,
        estimatedDowntime: 0,
        dependencies: [],
        status: 'pending',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'suggestion-2',
        type: 'index_removal',
        priority: 'medium',
        title: 'Entferne ungenutzten Index',
        description: 'Der Index idx_old_unused_index wird seit 6 Monaten nicht verwendet und verbraucht 25MB Speicher',
        estimatedImpact: {
          performanceGain: 5,
          timeReduction: 100,
          resourceSavings: 15,
          complexityReduction: 20,
        },
        implementationEffort: 'low',
        riskLevel: 'low',
        affectedQueries: [],
        affectedTables: ['temp_data'],
        sqlCode: 'DROP INDEX IF EXISTS idx_old_unused_index;',
        rollbackPlan: 'CREATE INDEX idx_old_unused_index ON temp_data (old_column);',
        testingRequired: false,
        estimatedDowntime: 0,
        dependencies: [],
        status: 'approved',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'suggestion-3',
        type: 'query_rewrite',
        priority: 'critical',
        title: 'Optimiere Customer-Quote Join',
        description: 'Die JOIN-Abfrage kann durch Subquery-Eliminierung und bessere WHERE-Klausel-Reihenfolge optimiert werden',
        estimatedImpact: {
          performanceGain: 70,
          timeReduction: 1800,
          resourceSavings: 40,
          complexityReduction: 25,
        },
        implementationEffort: 'medium',
        riskLevel: 'medium',
        affectedQueries: ['query-1'],
        affectedTables: ['customers', 'quotes'],
        sqlCode: `SELECT c.*, q.price 
FROM customers c 
INNER JOIN quotes q ON c.id = q.customer_id 
WHERE c.status = 'active' 
  AND q.created_at = (SELECT MAX(created_at) FROM quotes q2 WHERE q2.customer_id = c.id)
ORDER BY q.created_at DESC;`,
        rollbackPlan: 'Revert to original query structure',
        testingRequired: true,
        estimatedDowntime: 5,
        dependencies: ['idx_quotes_customer_created'],
        status: 'pending',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'suggestion-4',
        type: 'table_partitioning',
        priority: 'medium',
        title: 'Partitioniere Audit-Log Tabelle',
        description: 'Partitionierung der audit_log Tabelle nach Datum würde Abfragen und Wartung verbessern',
        estimatedImpact: {
          performanceGain: 60,
          timeReduction: 2500,
          resourceSavings: 35,
          complexityReduction: 15,
        },
        implementationEffort: 'high',
        riskLevel: 'medium',
        affectedQueries: ['query-5'],
        affectedTables: ['audit_log'],
        sqlCode: `-- Create partitioned table structure
CREATE TABLE audit_log_partitioned (
  LIKE audit_log INCLUDING ALL
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions
CREATE TABLE audit_log_2024_12 PARTITION OF audit_log_partitioned 
FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');`,
        rollbackPlan: 'Migrate data back to single table structure',
        testingRequired: true,
        estimatedDowntime: 60,
        dependencies: ['backup_audit_log'],
        status: 'pending',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'suggestion-5',
        type: 'caching_strategy',
        priority: 'high',
        title: 'Implementiere Query Result Caching',
        description: 'Häufig ausgeführte Abfragen sollten zwischengespeichert werden, um die Datenbankbelastung zu reduzieren',
        estimatedImpact: {
          performanceGain: 85,
          timeReduction: 3200,
          resourceSavings: 60,
          complexityReduction: 40,
        },
        implementationEffort: 'medium',
        riskLevel: 'low',
        affectedQueries: ['query-2', 'query-4'],
        affectedTables: ['invoices', 'quotes'],
        sqlCode: '-- Implement Redis caching layer for frequent queries',
        rollbackPlan: 'Disable caching layer, direct database access',
        testingRequired: true,
        estimatedDowntime: 15,
        dependencies: ['redis_setup', 'cache_invalidation_logic'],
        status: 'approved',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
    ];

    // Initialize database tables
    const sampleTables: DatabaseTable[] = [
      {
        id: 'table-1',
        name: 'customers',
        schema: 'public',
        rows: 15420,
        size: 156.8,
        averageRowSize: 1024,
        indexes: sampleIndexes.filter(idx => idx.table === 'customers'),
        queryFrequency: 450,
        lastAnalyzed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        fragmentationLevel: 15,
        growthRate: 120,
        hotspots: ['email', 'status', 'created_at'],
        partitioned: false,
        compressionRatio: 25,
        lockContention: 5,
        statistics: {
          selectQueries: 380,
          insertQueries: 45,
          updateQueries: 20,
          deleteQueries: 5,
        },
      },
      {
        id: 'table-2',
        name: 'quotes',
        schema: 'public',
        rows: 8750,
        size: 98.4,
        averageRowSize: 1152,
        indexes: sampleIndexes.filter(idx => idx.table === 'quotes'),
        queryFrequency: 320,
        lastAnalyzed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        fragmentationLevel: 8,
        growthRate: 85,
        hotspots: ['customer_id', 'status', 'price'],
        partitioned: false,
        compressionRatio: 30,
        lockContention: 3,
        statistics: {
          selectQueries: 280,
          insertQueries: 30,
          updateQueries: 8,
          deleteQueries: 2,
        },
      },
      {
        id: 'table-3',
        name: 'audit_log',
        schema: 'public',
        rows: 125000,
        size: 580.2,
        averageRowSize: 512,
        indexes: [],
        queryFrequency: 520,
        lastAnalyzed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        fragmentationLevel: 35,
        growthRate: 2400,
        hotspots: ['timestamp', 'user_id', 'action'],
        partitioned: false,
        compressionRatio: 15,
        lockContention: 12,
        statistics: {
          selectQueries: 20,
          insertQueries: 480,
          updateQueries: 15,
          deleteQueries: 5,
        },
      },
    ];

    // Initialize performance history
    const samplePerformanceHistory: PerformanceMonitoring[] = Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000),
      totalQueries: Math.floor(Math.random() * 1000) + 500,
      avgResponseTime: Math.floor(Math.random() * 500) + 100,
      slowQueries: Math.floor(Math.random() * 50) + 5,
      errorRate: Math.random() * 5,
      cacheHitRate: Math.random() * 20 + 75,
      connectionCount: Math.floor(Math.random() * 100) + 50,
      cpuUsage: Math.random() * 40 + 20,
      memoryUsage: Math.random() * 30 + 40,
      diskUsage: Math.random() * 50 + 30,
      lockWaitTime: Math.random() * 200 + 50,
      deadlocks: Math.floor(Math.random() * 5),
      indexScans: Math.floor(Math.random() * 300) + 200,
      sequentialScans: Math.floor(Math.random() * 100) + 20,
    }));

    setQueryMetrics(sampleQueries);
    setDatabaseIndexes(sampleIndexes);
    setOptimizationSuggestions(sampleSuggestions);
    setDatabaseTables(sampleTables);
    setPerformanceHistory(samplePerformanceHistory);
  };

  const updatePerformanceMetrics = () => {
    const newMetric: PerformanceMonitoring = {
      timestamp: new Date(),
      totalQueries: Math.floor(Math.random() * 1000) + 500,
      avgResponseTime: Math.floor(Math.random() * 500) + 100,
      slowQueries: Math.floor(Math.random() * 50) + 5,
      errorRate: Math.random() * 5,
      cacheHitRate: Math.random() * 20 + 75,
      connectionCount: Math.floor(Math.random() * 100) + 50,
      cpuUsage: Math.random() * 40 + 20,
      memoryUsage: Math.random() * 30 + 40,
      diskUsage: Math.random() * 50 + 30,
      lockWaitTime: Math.random() * 200 + 50,
      deadlocks: Math.floor(Math.random() * 5),
      indexScans: Math.floor(Math.random() * 300) + 200,
      sequentialScans: Math.floor(Math.random() * 100) + 20,
    };

    setPerformanceHistory(prev => [...prev.slice(1), newMetric]);
  };

  const runQueryAnalysis = async (queryId?: string) => {
    setIsAnalysisRunning(true);
    
    try {
      // Simulate analysis process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      if (queryId) {
        // Analyze specific query
        setQueryMetrics(prev => prev.map(query => {
          if (query.id === queryId) {
            return {
              ...query,
              lastExecuted: new Date(),
              status: query.executionTime > 1000 ? 'slow' : 'optimal',
              cacheHitRate: Math.min(100, query.cacheHitRate + Math.random() * 10),
            };
          }
          return query;
        }));
      } else {
        // Analyze all queries
        setQueryMetrics(prev => prev.map(query => ({
          ...query,
          lastExecuted: new Date(),
          cacheHitRate: Math.min(100, query.cacheHitRate + Math.random() * 5),
        })));
      }
      
      onQueryAnalyzed?.(queryMetrics[0]);
    } catch (error) {
      console.error('Query analysis failed:', error);
    } finally {
      setIsAnalysisRunning(false);
    }
  };

  const implementOptimization = async (suggestionId: string) => {
    const suggestion = optimizationSuggestions.find(s => s.id === suggestionId);
    if (!suggestion) return;

    try {
      // Simulate implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setOptimizationSuggestions(prev => prev.map(s => {
        if (s.id === suggestionId) {
          return {
            ...s,
            status: 'completed',
            implementedAt: new Date(),
          };
        }
        return s;
      }));

      // Apply performance improvements
      if (suggestion.type === 'index_creation') {
        const newIndex: DatabaseIndex = {
          id: `idx-new-${Date.now()}`,
          name: suggestion.affectedTables[0] + '_optimized_idx',
          table: suggestion.affectedTables[0],
          columns: ['email', 'created_at'],
          type: 'btree',
          isUnique: false,
          size: 0.1,
          usage: 0,
          effectiveness: 0,
          lastUsed: new Date(),
          createdAt: new Date(),
          status: 'active',
          impactScore: 85,
          maintenanceCost: 15,
          selectivity: 90,
        };
        
        setDatabaseIndexes(prev => [...prev, newIndex]);
        onIndexCreated?.(newIndex);
      }

      // Update affected queries
      suggestion.affectedQueries.forEach(queryId => {
        setQueryMetrics(prev => prev.map(query => {
          if (query.id === queryId) {
            return {
              ...query,
              executionTime: Math.max(50, query.executionTime - suggestion.estimatedImpact.timeReduction),
              status: 'optimal',
              optimizationPotential: Math.max(5, query.optimizationPotential - suggestion.estimatedImpact.performanceGain),
              cacheHitRate: Math.min(100, query.cacheHitRate + 15),
            };
          }
          return query;
        }));
      });

      onOptimizationApplied?.(suggestion);
      alert(`Optimierung "${suggestion.title}" erfolgreich implementiert!`);
    } catch (error) {
      console.error('Optimization implementation failed:', error);
      alert('Fehler bei der Implementierung der Optimierung.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'success';
      case 'slow': return 'warning';
      case 'critical': return 'error';
      case 'error': return 'error';
      case 'active': return 'success';
      case 'unused': return 'warning';
      case 'redundant': return 'error';
      case 'suggested': return 'info';
      case 'pending': return 'warning';
      case 'approved': return 'info';
      case 'completed': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredQueries = useMemo(() => {
    return queryMetrics
      .filter(query => {
        const matchesFilter = queryFilter === 'all' || query.status === queryFilter;
        const matchesSearch = searchTerm === '' || 
          query.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
          query.table.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
      })
      .sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
  }, [queryMetrics, queryFilter, searchTerm, sortBy, sortOrder]);

  const latestMetrics = performanceHistory[performanceHistory.length - 1];

  const renderOverviewTab = () => (
    <Grid container spacing={3}>
      {/* Key Performance Indicators */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Performance-Übersicht
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)` }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        Durchschn. Antwortzeit
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {latestMetrics?.avgResponseTime || 0}ms
                      </Typography>
                    </Box>
                    <SpeedIcon sx={{ fontSize: 40, color: 'success.main' }} />
                  </Box>
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      size="small"
                      label={latestMetrics?.avgResponseTime < 200 ? 'Sehr gut' : latestMetrics?.avgResponseTime < 500 ? 'Gut' : 'Verbesserungsbedarf'}
                      color={latestMetrics?.avgResponseTime < 200 ? 'success' : latestMetrics?.avgResponseTime < 500 ? 'warning' : 'error'}
                    />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)` }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        Cache Hit Rate
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {latestMetrics?.cacheHitRate.toFixed(1) || 0}%
                      </Typography>
                    </Box>
                    <MemoryIcon sx={{ fontSize: 40, color: 'info.main' }} />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={latestMetrics?.cacheHitRate || 0}
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)` }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        Langsame Abfragen
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {queryMetrics.filter(q => q.status === 'slow' || q.status === 'critical').length}
                      </Typography>
                    </Box>
                    <WarningIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    von {queryMetrics.length} Abfragen
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)` }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        Optimierungen
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {optimizationSuggestions.filter(s => s.status === 'pending' || s.status === 'approved').length}
                      </Typography>
                    </Box>
                    <AutoFixIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    verfügbar
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </Grid>

      {/* Performance Charts */}
      <Grid item xs={12} md={8}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Performance-Verlauf (24h)
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={performanceHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(value) => new Date(value).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <RechartsTooltip 
                  labelFormatter={(value) => new Date(value).toLocaleString('de-DE')}
                  formatter={(value, name) => [
                    typeof value === 'number' ? value.toFixed(1) : value,
                    name === 'avgResponseTime' ? 'Antwortzeit (ms)' :
                    name === 'cacheHitRate' ? 'Cache Hit Rate (%)' :
                    name === 'slowQueries' ? 'Langsame Abfragen' :
                    name === 'cpuUsage' ? 'CPU-Auslastung (%)' : name
                  ]}
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="avgResponseTime"
                  stackId="1"
                  stroke={theme.palette.primary.main}
                  fill={alpha(theme.palette.primary.main, 0.3)}
                  name="Antwortzeit"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cacheHitRate"
                  stroke={theme.palette.success.main}
                  strokeWidth={2}
                  name="Cache Hit Rate"
                />
                <Bar
                  yAxisId="left"
                  dataKey="slowQueries"
                  fill={theme.palette.warning.main}
                  name="Langsame Abfragen"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>

      {/* System Resources */}
      <Grid item xs={12} md={4}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            System-Ressourcen
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">CPU-Auslastung</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {latestMetrics?.cpuUsage.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={latestMetrics?.cpuUsage || 0}
              color={latestMetrics?.cpuUsage > 80 ? 'error' : latestMetrics?.cpuUsage > 60 ? 'warning' : 'primary'}
              sx={{ height: 8, borderRadius: 4, mb: 2 }}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Speicher-Auslastung</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {latestMetrics?.memoryUsage.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={latestMetrics?.memoryUsage || 0}
              color={latestMetrics?.memoryUsage > 80 ? 'error' : latestMetrics?.memoryUsage > 60 ? 'warning' : 'success'}
              sx={{ height: 8, borderRadius: 4, mb: 2 }}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Festplatten-Auslastung</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {latestMetrics?.diskUsage.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={latestMetrics?.diskUsage || 0}
              color={latestMetrics?.diskUsage > 80 ? 'error' : latestMetrics?.diskUsage > 60 ? 'warning' : 'info'}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
          
          <Alert 
            severity={
              (latestMetrics?.cpuUsage > 80 || latestMetrics?.memoryUsage > 80) ? 'error' :
              (latestMetrics?.cpuUsage > 60 || latestMetrics?.memoryUsage > 60) ? 'warning' : 'success'
            }
          >
            {(latestMetrics?.cpuUsage > 80 || latestMetrics?.memoryUsage > 80) 
              ? 'Hohe Ressourcenauslastung - Optimierung empfohlen'
              : (latestMetrics?.cpuUsage > 60 || latestMetrics?.memoryUsage > 60)
                ? 'Mittlere Ressourcenauslastung - Überwachung fortsetzen'
                : 'Ressourcenauslastung optimal'
            }
          </Alert>
        </Paper>
      </Grid>

      {/* Recent Optimization Opportunities */}
      <Grid item xs={12}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Aktuelle Optimierungsmöglichkeiten
            </Typography>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => runQueryAnalysis()}
              disabled={isAnalysisRunning}
            >
              Analyse ausführen
            </Button>
          </Box>
          
          <List>
            {optimizationSuggestions
              .filter(s => s.status === 'pending' || s.status === 'approved')
              .slice(0, 5)
              .map((suggestion) => (
                <React.Fragment key={suggestion.id}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          bgcolor: alpha(theme.palette[getPriorityColor(suggestion.priority) as keyof typeof theme.palette].main, 0.1),
                          color: theme.palette[getPriorityColor(suggestion.priority) as keyof typeof theme.palette].main,
                        }}
                      >
                        {suggestion.type === 'index_creation' ? <AutoFixIcon /> :
                         suggestion.type === 'index_removal' ? <DeleteIcon /> :
                         suggestion.type === 'query_rewrite' ? <CodeIcon /> :
                         suggestion.type === 'table_partitioning' ? <TableChartIcon /> :
                         suggestion.type === 'caching_strategy' ? <MemoryIcon /> : <TuneIcon />}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {suggestion.title}
                          </Typography>
                          <Chip
                            label={suggestion.priority}
                            size="small"
                            color={getPriorityColor(suggestion.priority) as any}
                          />
                          <Chip
                            label={suggestion.status}
                            size="small"
                            color={getStatusColor(suggestion.status) as any}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            {suggestion.description}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                              Performance: +{suggestion.estimatedImpact.performanceGain}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Zeit: -{suggestion.estimatedImpact.timeReduction}ms
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Aufwand: {suggestion.implementationEffort}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setSelectedSuggestion(suggestion);
                            setIsOptimizationDialogOpen(true);
                          }}
                        >
                          Details
                        </Button>
                        {suggestion.status === 'approved' && (
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() => implementOptimization(suggestion.id)}
                          >
                            Implementieren
                          </Button>
                        )}
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
          </List>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderQueryAnalysisTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Query-Performance Analyse
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => runQueryAnalysis()}
            disabled={isAnalysisRunning}
          >
            {isAnalysisRunning ? 'Analysiere...' : 'Alle analysieren'}
          </Button>
          <FormControlLabel
            control={
              <Switch
                checked={isMonitoring}
                onChange={(e) => setIsMonitoring(e.target.checked)}
              />
            }
            label="Live-Monitoring"
          />
        </Box>
      </Box>

      {/* Filters */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={queryFilter}
                label="Status"
                onChange={(e) => setQueryFilter(e.target.value)}
              >
                <MenuItem value="all">Alle</MenuItem>
                <MenuItem value="optimal">Optimal</MenuItem>
                <MenuItem value="slow">Langsam</MenuItem>
                <MenuItem value="critical">Kritisch</MenuItem>
                <MenuItem value="error">Fehler</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Sortierung</InputLabel>
              <Select
                value={sortBy}
                label="Sortierung"
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <MenuItem value="executionTime">Ausführungszeit</MenuItem>
                <MenuItem value="frequency">Häufigkeit</MenuItem>
                <MenuItem value="optimization">Optimierungspotential</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Reihenfolge</InputLabel>
              <Select
                value={sortOrder}
                label="Reihenfolge"
                onChange={(e) => setSortOrder(e.target.value as any)}
              >
                <MenuItem value="desc">Absteigend</MenuItem>
                <MenuItem value="asc">Aufsteigend</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={12} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<ExportIcon />}
                size="small"
                fullWidth
              >
                Export
              </Button>
              <Button
                variant="outlined"
                startIcon={<SettingsIcon />}
                size="small"
                fullWidth
              >
                Einstellungen
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Query List */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Abfrage</TableCell>
              <TableCell>Typ</TableCell>
              <TableCell>Tabelle</TableCell>
              <TableCell>Ausführungszeit</TableCell>
              <TableCell>Häufigkeit</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Optimierungspotential</TableCell>
              <TableCell>Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredQueries
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((query) => (
                <TableRow key={query.id} hover>
                  <TableCell sx={{ maxWidth: 300 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'monospace',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {query.query}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Zuletzt: {query.lastExecuted.toLocaleTimeString('de-DE')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={query.queryType}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{query.table}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="body2"
                        color={query.executionTime > 1000 ? 'error' : query.executionTime > 500 ? 'warning.main' : 'text.primary'}
                        sx={{ fontWeight: 600 }}
                      >
                        {query.executionTime}ms
                      </Typography>
                      {query.executionTime > 1000 && <WarningIcon color="error" sx={{ fontSize: 16 }} />}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {query.frequency}/h
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={query.status}
                      size="small"
                      color={getStatusColor(query.status) as any}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={query.optimizationPotential}
                        sx={{ width: 60, height: 6 }}
                        color={query.optimizationPotential > 70 ? 'warning' : query.optimizationPotential > 40 ? 'info' : 'success'}
                      />
                      <Typography variant="caption">
                        {query.optimizationPotential}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Analysieren">
                        <IconButton
                          size="small"
                          onClick={() => runQueryAnalysis(query.id)}
                          disabled={isAnalysisRunning}
                        >
                          <AnalyticsIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Details">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedQuery(query);
                            setIsQueryDialogOpen(true);
                          }}
                        >
                          <InsightsIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Optimieren">
                        <IconButton
                          size="small"
                          color="primary"
                          disabled={query.optimizationPotential < 20}
                        >
                          <OptimizeIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredQueries.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Zeilen pro Seite:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} von ${count}`}
        />
      </TableContainer>
    </Box>
  );

  const renderIndexManagementTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Index-Verwaltung
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            // Open index creation dialog
          }}
        >
          Index erstellen
        </Button>
      </Box>

      {/* Index Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <DataUsageIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {databaseIndexes.filter(idx => idx.status === 'active').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Aktive Indizes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <WarningIcon color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {databaseIndexes.filter(idx => idx.status === 'unused').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ungenutzte Indizes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <StorageIcon color="info" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {formatBytes(databaseIndexes.reduce((sum, idx) => sum + idx.size * 1024 * 1024, 0))}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Gesamtgröße
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <InsightsIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {databaseIndexes.filter(idx => idx.status === 'suggested').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Vorgeschlagen
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Index List */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Tabelle</TableCell>
              <TableCell>Spalten</TableCell>
              <TableCell>Typ</TableCell>
              <TableCell>Größe</TableCell>
              <TableCell>Nutzung</TableCell>
              <TableCell>Effektivität</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {databaseIndexes.map((index) => (
              <TableRow key={index.id} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {index.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Erstellt: {index.createdAt.toLocaleDateString('de-DE')}
                  </Typography>
                </TableCell>
                <TableCell>{index.table}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {index.columns.map(column => (
                      <Chip key={column} label={column} size="small" variant="outlined" />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={index.type.toUpperCase()}
                    size="small"
                    variant="outlined"
                  />
                  {index.isUnique && (
                    <Chip
                      label="UNIQUE"
                      size="small"
                      color="info"
                      sx={{ ml: 0.5 }}
                    />
                  )}
                </TableCell>
                <TableCell>
                  {index.status === 'suggested' ? '-' : formatBytes(index.size * 1024 * 1024)}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {index.usage}/h
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Zuletzt: {index.lastUsed.toLocaleDateString('de-DE')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={index.effectiveness}
                      sx={{ width: 60, height: 6 }}
                      color={index.effectiveness > 80 ? 'success' : index.effectiveness > 50 ? 'warning' : 'error'}
                    />
                    <Typography variant="caption">
                      {index.effectiveness}%
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={index.status}
                    size="small"
                    color={getStatusColor(index.status) as any}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Details">
                      <IconButton size="small">
                        <InsightsIcon />
                      </IconButton>
                    </Tooltip>
                    {index.status === 'unused' && (
                      <Tooltip title="Löschen">
                        <IconButton size="small" color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {index.status === 'suggested' && (
                      <Tooltip title="Erstellen">
                        <IconButton size="small" color="success">
                          <CheckCircleIcon />
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
    </Box>
  );

  const renderOptimizationSuggestionsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Optimierungsvorschläge
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={autoOptimization}
              onChange={(e) => setAutoOptimization(e.target.checked)}
            />
          }
          label="Auto-Optimierung"
        />
      </Box>

      <Grid container spacing={3}>
        {optimizationSuggestions.map((suggestion, index) => (
          <Grid item xs={12} key={suggestion.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                sx={{
                  border: suggestion.priority === 'critical' ? `2px solid ${theme.palette.error.main}` :
                         suggestion.priority === 'high' ? `2px solid ${theme.palette.warning.main}` : 'none'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {suggestion.title}
                        </Typography>
                        <Chip
                          label={suggestion.priority}
                          size="small"
                          color={getPriorityColor(suggestion.priority) as any}
                        />
                        <Chip
                          label={suggestion.status}
                          size="small"
                          color={getStatusColor(suggestion.status) as any}
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {suggestion.description}
                      </Typography>
                      
                      {/* Impact Metrics */}
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ textAlign: 'center', p: 1, backgroundColor: alpha(theme.palette.success.main, 0.1), borderRadius: 1 }}>
                            <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
                              +{suggestion.estimatedImpact.performanceGain}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Performance
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ textAlign: 'center', p: 1, backgroundColor: alpha(theme.palette.info.main, 0.1), borderRadius: 1 }}>
                            <Typography variant="h6" color="info.main" sx={{ fontWeight: 'bold' }}>
                              -{suggestion.estimatedImpact.timeReduction}ms
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Zeit-Ersparnis
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ textAlign: 'center', p: 1, backgroundColor: alpha(theme.palette.warning.main, 0.1), borderRadius: 1 }}>
                            <Typography variant="h6" color="warning.main" sx={{ fontWeight: 'bold' }}>
                              -{suggestion.estimatedImpact.resourceSavings}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Ressourcen
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ textAlign: 'center', p: 1, backgroundColor: alpha(theme.palette.primary.main, 0.1), borderRadius: 1 }}>
                            <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                              {suggestion.implementationEffort}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Aufwand
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                      
                      {/* Affected Tables and Queries */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          Betroffene Tabellen:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                          {suggestion.affectedTables.map(table => (
                            <Chip key={table} label={table} size="small" variant="outlined" />
                          ))}
                        </Box>
                        
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          Betroffene Abfragen: {suggestion.affectedQueries.length}
                        </Typography>
                      </Box>
                      
                      {suggestion.estimatedDowntime > 0 && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          Geschätzte Ausfallzeit: {suggestion.estimatedDowntime} Minuten
                        </Alert>
                      )}
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSelectedSuggestion(suggestion);
                          setIsOptimizationDialogOpen(true);
                        }}
                      >
                        Details
                      </Button>
                      
                      {suggestion.status === 'pending' && (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircleIcon />}
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
                        </>
                      )}
                      
                      {suggestion.status === 'approved' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          startIcon={<PlayIcon />}
                          onClick={() => implementOptimization(suggestion.id)}
                        >
                          Implementieren
                        </Button>
                      )}
                      
                      {suggestion.status === 'completed' && suggestion.implementedAt && (
                        <Typography variant="caption" color="success.main" sx={{ textAlign: 'center' }}>
                          Implementiert am {suggestion.implementedAt.toLocaleDateString('de-DE')}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderTableAnalysisTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        Tabellen-Analyse
      </Typography>
      
      <Grid container spacing={3}>
        {databaseTables.map((table, index) => (
          <Grid item xs={12} md={6} lg={4} key={table.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        {table.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Schema: {table.schema}
                      </Typography>
                    </Box>
                    <Chip
                      label={table.partitioned ? 'Partitioniert' : 'Standard'}
                      size="small"
                      color={table.partitioned ? 'success' : 'default'}
                    />
                  </Box>
                  
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Zeilen
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {table.rows.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Größe
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {formatBytes(table.size * 1024 * 1024)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Abfragen/h
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {table.queryFrequency}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Fragmentierung
                      </Typography>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 'bold',
                          color: table.fragmentationLevel > 25 ? 'error.main' : table.fragmentationLevel > 15 ? 'warning.main' : 'success.main'
                        }}
                      >
                        {table.fragmentationLevel}%
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Hotspots:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {table.hotspots.map(hotspot => (
                        <Chip key={hotspot} label={hotspot} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                  
                  {table.fragmentationLevel > 25 && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      Hohe Fragmentierung - VACUUM empfohlen
                    </Alert>
                  )}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setSelectedTable(table);
                        setIsTableDialogOpen(true);
                      }}
                    >
                      Details
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<RefreshIcon />}
                    >
                      Analysieren
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  return (
    <Box>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <DatabaseIcon color="primary" />
              Database Query Optimization
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label={`${queryMetrics.filter(q => q.status === 'optimal').length}/${queryMetrics.length} optimal`}
                color={queryMetrics.filter(q => q.status === 'optimal').length / queryMetrics.length > 0.8 ? 'success' : 'warning'}
                icon={<SpeedIcon />}
              />
              <Chip
                label={`${optimizationSuggestions.filter(s => s.status === 'pending').length} Optimierungen`}
                color={optimizationSuggestions.filter(s => s.status === 'pending').length > 0 ? 'warning' : 'success'}
                icon={<OptimizeIcon />}
              />
              <Chip
                label={isMonitoring ? 'Live' : 'Pausiert'}
                color={isMonitoring ? 'success' : 'default'}
                icon={<MonitorIcon />}
              />
            </Box>
          </Box>
          
          <Typography variant="body1" color="text.secondary">
            Umfassende Datenbankoptimierung mit Performance-Monitoring, Query-Analyse und automatischen Verbesserungsvorschlägen
          </Typography>
        </Paper>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Paper elevation={2} sx={{ mb: 4 }}>
          <Tabs
            value={selectedTab}
            onChange={(e, newValue) => setSelectedTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Übersicht" icon={<AssessmentIcon />} />
            <Tab label="Query-Analyse" icon={<QueryIcon />} />
            <Tab label="Index-Verwaltung" icon={<DataUsageIcon />} />
            <Tab label="Optimierungen" icon={<OptimizeIcon />} />
            <Tab label="Tabellen-Analyse" icon={<TableChartIcon />} />
          </Tabs>
        </Paper>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {selectedTab === 0 && renderOverviewTab()}
        {selectedTab === 1 && renderQueryAnalysisTab()}
        {selectedTab === 2 && renderIndexManagementTab()}
        {selectedTab === 3 && renderOptimizationSuggestionsTab()}
        {selectedTab === 4 && renderTableAnalysisTab()}
      </motion.div>

      {/* Dialogs */}
      <Dialog
        open={isQueryDialogOpen}
        onClose={() => setIsQueryDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Query-Details</DialogTitle>
        <DialogContent>
          {selectedQuery && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="h6" gutterBottom>
                SQL-Abfrage
              </Typography>
              <Paper sx={{ p: 2, mb: 3, backgroundColor: theme.palette.grey[100] }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                  {selectedQuery.query}
                </Typography>
              </Paper>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Performance-Metriken
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Ausführungszeit" 
                        secondary={`${selectedQuery.executionTime}ms`} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="CPU-Auslastung" 
                        secondary={`${selectedQuery.cpuUsage}%`} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Speicherverbrauch" 
                        secondary={`${selectedQuery.memoryUsage}MB`} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Cache Hit Rate" 
                        secondary={`${selectedQuery.cacheHitRate}%`} 
                      />
                    </ListItem>
                  </List>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Verwendete Indizes
                  </Typography>
                  <List dense>
                    {selectedQuery.indexesUsed.map((index, i) => (
                      <ListItem key={i}>
                        <ListItemIcon>
                          <DataUsageIcon />
                        </ListItemIcon>
                        <ListItemText primary={index} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsQueryDialogOpen(false)}>
            Schließen
          </Button>
          <Button variant="contained" onClick={() => selectedQuery && runQueryAnalysis(selectedQuery.id)}>
            Analysieren
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isOptimizationDialogOpen}
        onClose={() => setIsOptimizationDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Optimierungsdetails</DialogTitle>
        <DialogContent>
          {selectedSuggestion && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="h6" gutterBottom>
                {selectedSuggestion.title}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {selectedSuggestion.description}
              </Typography>
              
              {selectedSuggestion.sqlCode && (
                <>
                  <Typography variant="h6" gutterBottom>
                    SQL-Code
                  </Typography>
                  <Paper sx={{ p: 2, mb: 3, backgroundColor: theme.palette.grey[100] }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                      {selectedSuggestion.sqlCode}
                    </Typography>
                  </Paper>
                </>
              )}
              
              <Typography variant="h6" gutterBottom>
                Auswirkungen
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    Performance-Gewinn: +{selectedSuggestion.estimatedImpact.performanceGain}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    Zeit-Ersparnis: -{selectedSuggestion.estimatedImpact.timeReduction}ms
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    Ressourcen-Ersparnis: -{selectedSuggestion.estimatedImpact.resourceSavings}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    Implementierungsaufwand: {selectedSuggestion.implementationEffort}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsOptimizationDialogOpen(false)}>
            Schließen
          </Button>
          {selectedSuggestion?.status === 'approved' && (
            <Button 
              variant="contained" 
              onClick={() => {
                implementOptimization(selectedSuggestion.id);
                setIsOptimizationDialogOpen(false);
              }}
            >
              Implementieren
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DatabaseQueryOptimization;