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
  CircularProgress,
  Checkbox,
  FormGroup,
  Badge,
  Avatar,
  TablePagination,
  Slider,
  FormHelperText,
  RadioGroup,
  Radio,
  FormLabel,
} from '@mui/material';
import {
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  CloudDownload as CloudIcon,
  Storage as StorageIcon,
  Timer as TimerIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Analytics as AnalyticsIcon,
  Cached as CachedIcon,
  FlashOn as FlashOnIcon,
  HourglassEmpty as HourglassIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  DataUsage as DataUsageIcon,
  Update as UpdateIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  ShowChart as ShowChartIcon,
  Timeline as TimelineIcon,
  Layers as LayersIcon,
  AccountTree as TreeIcon,
  CompareArrows as CompareIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  GetApp as ExportIcon,
  Tune as TuneIcon,
  MonitorHeart as MonitorIcon,
  Security as SecurityIcon,
  LockClock as LockClockIcon,
  AccessTime as AccessTimeIcon,
  CloudQueue as CloudQueueIcon,
  ClearAll as ClearAllIcon,
} from '@mui/icons-material';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, RadialBarChart, RadialBar } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

interface CacheEntry {
  id: string;
  key: string;
  value: any;
  type: 'query_result' | 'api_response' | 'computed_data' | 'static_asset' | 'session_data' | 'user_preference';
  size: number; // bytes
  hits: number;
  misses: number;
  hitRate: number; // percentage
  lastAccessed: Date;
  createdAt: Date;
  expiresAt?: Date;
  ttl: number; // seconds
  compressionRatio: number; // percentage
  accessFrequency: number; // accesses per hour
  cost: number; // computation cost saved
  tags: string[];
  dependencies: string[];
  invalidated: boolean;
  strategy: CacheStrategy;
  layer: CacheLayer;
}

interface CacheLayer {
  id: string;
  name: string;
  type: 'memory' | 'redis' | 'database' | 'cdn' | 'browser' | 'edge';
  capacity: number; // bytes
  used: number; // bytes
  entries: number;
  hitRate: number;
  latency: number; // milliseconds
  throughput: number; // operations per second
  isActive: boolean;
  configuration: CacheConfiguration;
  policies: CachePolicy[];
  healthScore: number; // 0-100
  lastMaintenance: Date;
  nextMaintenance: Date;
  alerts: CacheAlert[];
}

interface CacheStrategy {
  id: string;
  name: string;
  type: 'lru' | 'lfu' | 'fifo' | 'lifo' | 'ttl' | 'write_through' | 'write_back' | 'write_around';
  description: string;
  evictionPolicy: string;
  consistency: 'eventual' | 'strong' | 'weak';
  replicationFactor: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  performanceScore: number;
  costEfficiency: number;
  complexity: 'low' | 'medium' | 'high';
  recommendedFor: string[];
}

interface CachePolicy {
  id: string;
  name: string;
  conditions: PolicyCondition[];
  actions: PolicyAction[];
  priority: number;
  isActive: boolean;
  triggeredCount: number;
  lastTriggered?: Date;
  effectivenessScore: number;
}

interface PolicyCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'regex';
  value: any;
}

interface PolicyAction {
  type: 'evict' | 'refresh' | 'compress' | 'replicate' | 'alert' | 'invalidate';
  parameters: Record<string, any>;
}

interface CacheConfiguration {
  maxSize: number;
  maxEntries: number;
  defaultTtl: number;
  compressionThreshold: number;
  evictionPercentage: number;
  replicationEnabled: boolean;
  compressionAlgorithm: 'gzip' | 'lz4' | 'snappy' | 'zstd';
  serialization: 'json' | 'msgpack' | 'protobuf' | 'avro';
  monitoring: {
    metricsEnabled: boolean;
    alertThresholds: AlertThresholds;
    reportingInterval: number;
  };
  security: {
    encryptionKey?: string;
    accessControl: boolean;
    auditLogging: boolean;
  };
}

interface AlertThresholds {
  hitRateMin: number;
  latencyMax: number;
  memoryUsageMax: number;
  errorRateMax: number;
}

interface CacheAlert {
  id: string;
  type: 'performance' | 'capacity' | 'error' | 'security' | 'maintenance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  actions: string[];
}

interface CacheMetrics {
  timestamp: Date;
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  averageLatency: number;
  throughput: number;
  memoryUsage: number;
  diskUsage: number;
  networkTraffic: number;
  errorCount: number;
  evictions: number;
  compressionRatio: number;
  costSavings: number;
}

interface CacheOptimization {
  id: string;
  type: 'configuration' | 'strategy' | 'policy' | 'hardware' | 'algorithm';
  title: string;
  description: string;
  currentValue: any;
  recommendedValue: any;
  estimatedImpact: {
    performanceGain: number; // percentage
    latencyReduction: number; // milliseconds
    hitRateImprovement: number; // percentage
    costSavings: number; // percentage
  };
  implementation: {
    effort: 'low' | 'medium' | 'high';
    risk: 'low' | 'medium' | 'high';
    downtime: number; // minutes
    rollbackPlan: string;
  };
  status: 'pending' | 'approved' | 'implementing' | 'completed' | 'rejected';
  createdAt: Date;
  implementedAt?: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface CacheStrategyImplementationProps {
  onCacheConfigured?: (config: CacheConfiguration) => void;
  onCacheCleared?: (layer: string) => void;
  onOptimizationApplied?: (optimization: CacheOptimization) => void;
  onAlertTriggered?: (alert: CacheAlert) => void;
}

const CacheStrategyImplementation: React.FC<CacheStrategyImplementationProps> = ({
  onCacheConfigured,
  onCacheCleared,
  onOptimizationApplied,
  onAlertTriggered,
}) => {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState(0);
  const [cacheEntries, setCacheEntries] = useState<CacheEntry[]>([]);
  const [cacheLayers, setCacheLayers] = useState<CacheLayer[]>([]);
  const [cacheStrategies, setCacheStrategies] = useState<CacheStrategy[]>([]);
  const [cachePolicies, setCachePolicies] = useState<CachePolicy[]>([]);
  const [cacheMetrics, setCacheMetrics] = useState<CacheMetrics[]>([]);
  const [cacheOptimizations, setCacheOptimizations] = useState<CacheOptimization[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<CacheAlert[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<CacheEntry | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<CacheLayer | null>(null);
  const [selectedOptimization, setSelectedOptimization] = useState<CacheOptimization | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [autoOptimization, setAutoOptimization] = useState(false);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);
  const [isOptimizationDialogOpen, setIsOptimizationDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [layerFilter, setLayerFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'hits' | 'size' | 'lastAccessed' | 'hitRate'>('hits');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    initializeData();
    const metricsInterval = setInterval(() => {
      if (isMonitoring) {
        updateMetrics();
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(metricsInterval);
  }, [isMonitoring]);

  const initializeData = () => {
    // Initialize cache strategies
    const sampleStrategies: CacheStrategy[] = [
      {
        id: 'strategy-1',
        name: 'LRU with TTL',
        type: 'lru',
        description: 'Least Recently Used mit Time-To-Live für optimale Memory-Nutzung',
        evictionPolicy: 'Least Recently Used',
        consistency: 'eventual',
        replicationFactor: 2,
        compressionEnabled: true,
        encryptionEnabled: false,
        performanceScore: 85,
        costEfficiency: 90,
        complexity: 'medium',
        recommendedFor: ['query_results', 'api_responses', 'computed_data'],
      },
      {
        id: 'strategy-2',
        name: 'Write-Through Cache',
        type: 'write_through',
        description: 'Konsistente Schreibvorgänge mit sofortiger Persistierung',
        evictionPolicy: 'LRU',
        consistency: 'strong',
        replicationFactor: 3,
        compressionEnabled: true,
        encryptionEnabled: true,
        performanceScore: 75,
        costEfficiency: 70,
        complexity: 'high',
        recommendedFor: ['user_preferences', 'session_data', 'critical_data'],
      },
      {
        id: 'strategy-3',
        name: 'CDN Edge Caching',
        type: 'ttl',
        description: 'Geografisch verteiltes Caching für statische Assets',
        evictionPolicy: 'TTL-based',
        consistency: 'weak',
        replicationFactor: 1,
        compressionEnabled: true,
        encryptionEnabled: false,
        performanceScore: 95,
        costEfficiency: 95,
        complexity: 'low',
        recommendedFor: ['static_assets', 'images', 'css', 'javascript'],
      },
    ];

    // Initialize cache layers
    const sampleLayers: CacheLayer[] = [
      {
        id: 'layer-1',
        name: 'Application Memory',
        type: 'memory',
        capacity: 512 * 1024 * 1024, // 512MB
        used: 345 * 1024 * 1024, // 345MB
        entries: 1250,
        hitRate: 92.5,
        latency: 0.1,
        throughput: 50000,
        isActive: true,
        configuration: {
          maxSize: 512 * 1024 * 1024,
          maxEntries: 10000,
          defaultTtl: 3600,
          compressionThreshold: 1024,
          evictionPercentage: 10,
          replicationEnabled: false,
          compressionAlgorithm: 'lz4',
          serialization: 'msgpack',
          monitoring: {
            metricsEnabled: true,
            alertThresholds: {
              hitRateMin: 80,
              latencyMax: 10,
              memoryUsageMax: 90,
              errorRateMax: 1,
            },
            reportingInterval: 60,
          },
          security: {
            accessControl: false,
            auditLogging: true,
          },
        },
        policies: [],
        healthScore: 95,
        lastMaintenance: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        nextMaintenance: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
        alerts: [],
      },
      {
        id: 'layer-2',
        name: 'Redis Cache',
        type: 'redis',
        capacity: 2 * 1024 * 1024 * 1024, // 2GB
        used: 1.2 * 1024 * 1024 * 1024, // 1.2GB
        entries: 8500,
        hitRate: 87.2,
        latency: 1.5,
        throughput: 25000,
        isActive: true,
        configuration: {
          maxSize: 2 * 1024 * 1024 * 1024,
          maxEntries: 50000,
          defaultTtl: 7200,
          compressionThreshold: 512,
          evictionPercentage: 15,
          replicationEnabled: true,
          compressionAlgorithm: 'gzip',
          serialization: 'json',
          monitoring: {
            metricsEnabled: true,
            alertThresholds: {
              hitRateMin: 75,
              latencyMax: 5,
              memoryUsageMax: 85,
              errorRateMax: 0.5,
            },
            reportingInterval: 30,
          },
          security: {
            encryptionKey: 'redis-encryption-key',
            accessControl: true,
            auditLogging: true,
          },
        },
        policies: [],
        healthScore: 88,
        lastMaintenance: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        nextMaintenance: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000),
        alerts: [
          {
            id: 'alert-1',
            type: 'performance',
            severity: 'medium',
            message: 'Hit Rate unter dem Schwellenwert (87.2% < 90%)',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            resolved: false,
            actions: ['Increase TTL', 'Review eviction policy', 'Analyze access patterns'],
          },
        ],
      },
      {
        id: 'layer-3',
        name: 'CDN Edge',
        type: 'cdn',
        capacity: 10 * 1024 * 1024 * 1024, // 10GB
        used: 6.8 * 1024 * 1024 * 1024, // 6.8GB
        entries: 15000,
        hitRate: 96.8,
        latency: 15,
        throughput: 100000,
        isActive: true,
        configuration: {
          maxSize: 10 * 1024 * 1024 * 1024,
          maxEntries: 100000,
          defaultTtl: 86400, // 24 hours
          compressionThreshold: 256,
          evictionPercentage: 5,
          replicationEnabled: true,
          compressionAlgorithm: 'gzip',
          serialization: 'protobuf',
          monitoring: {
            metricsEnabled: true,
            alertThresholds: {
              hitRateMin: 95,
              latencyMax: 50,
              memoryUsageMax: 80,
              errorRateMax: 0.1,
            },
            reportingInterval: 300,
          },
          security: {
            accessControl: true,
            auditLogging: false,
          },
        },
        policies: [],
        healthScore: 98,
        lastMaintenance: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        nextMaintenance: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000),
        alerts: [],
      },
    ];

    // Initialize cache entries
    const sampleEntries: CacheEntry[] = Array.from({ length: 50 }, (_, i) => ({
      id: `entry-${i + 1}`,
      key: `cache_key_${i + 1}`,
      value: `cached_data_${i + 1}`,
      type: ['query_result', 'api_response', 'computed_data', 'static_asset', 'session_data'][Math.floor(Math.random() * 5)] as any,
      size: Math.floor(Math.random() * 1024 * 1024) + 1024, // 1KB - 1MB
      hits: Math.floor(Math.random() * 1000) + 10,
      misses: Math.floor(Math.random() * 100) + 1,
      hitRate: 0,
      lastAccessed: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      expiresAt: Math.random() > 0.3 ? new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000) : undefined,
      ttl: Math.floor(Math.random() * 7200) + 300, // 5min - 2h
      compressionRatio: Math.floor(Math.random() * 50) + 20,
      accessFrequency: Math.floor(Math.random() * 100) + 1,
      cost: Math.random() * 100,
      tags: [`tag_${Math.floor(Math.random() * 5) + 1}`],
      dependencies: [],
      invalidated: Math.random() > 0.9,
      strategy: sampleStrategies[Math.floor(Math.random() * sampleStrategies.length)],
      layer: sampleLayers[Math.floor(Math.random() * sampleLayers.length)],
    })).map(entry => ({
      ...entry,
      hitRate: (entry.hits / (entry.hits + entry.misses)) * 100,
    }));

    // Initialize cache metrics
    const sampleMetrics: CacheMetrics[] = Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000),
      totalRequests: Math.floor(Math.random() * 10000) + 5000,
      cacheHits: Math.floor(Math.random() * 8000) + 4000,
      cacheMisses: Math.floor(Math.random() * 2000) + 500,
      hitRate: 0,
      averageLatency: Math.random() * 10 + 1,
      throughput: Math.floor(Math.random() * 5000) + 2000,
      memoryUsage: Math.random() * 30 + 60,
      diskUsage: Math.random() * 20 + 50,
      networkTraffic: Math.random() * 1000 + 500,
      errorCount: Math.floor(Math.random() * 10),
      evictions: Math.floor(Math.random() * 50),
      compressionRatio: Math.random() * 20 + 70,
      costSavings: Math.random() * 500 + 200,
    })).map(metric => ({
      ...metric,
      hitRate: (metric.cacheHits / metric.totalRequests) * 100,
    }));

    // Initialize cache optimizations
    const sampleOptimizations: CacheOptimization[] = [
      {
        id: 'opt-1',
        type: 'configuration',
        title: 'Erhöhe Memory Cache Größe',
        description: 'Vergrößerung des Memory Cache von 512MB auf 1GB für bessere Hit Rate',
        currentValue: '512MB',
        recommendedValue: '1GB',
        estimatedImpact: {
          performanceGain: 15,
          latencyReduction: 2.5,
          hitRateImprovement: 8,
          costSavings: 12,
        },
        implementation: {
          effort: 'low',
          risk: 'low',
          downtime: 5,
          rollbackPlan: 'Revert memory allocation to previous size',
        },
        status: 'pending',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        priority: 'high',
      },
      {
        id: 'opt-2',
        type: 'strategy',
        title: 'Implementiere Write-Behind Cache',
        description: 'Umstellung auf Write-Behind für bessere Write-Performance bei Session-Daten',
        currentValue: 'Write-Through',
        recommendedValue: 'Write-Behind',
        estimatedImpact: {
          performanceGain: 25,
          latencyReduction: 8,
          hitRateImprovement: 5,
          costSavings: 20,
        },
        implementation: {
          effort: 'medium',
          risk: 'medium',
          downtime: 15,
          rollbackPlan: 'Switch back to write-through caching',
        },
        status: 'approved',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        priority: 'medium',
      },
      {
        id: 'opt-3',
        type: 'algorithm',
        title: 'Upgrade zu LZ4 Kompression',
        description: 'Wechsel von GZIP zu LZ4 für bessere Kompressionsgeschwindigkeit',
        currentValue: 'GZIP',
        recommendedValue: 'LZ4',
        estimatedImpact: {
          performanceGain: 18,
          latencyReduction: 3.2,
          hitRateImprovement: 2,
          costSavings: 8,
        },
        implementation: {
          effort: 'low',
          risk: 'low',
          downtime: 0,
          rollbackPlan: 'Revert compression algorithm configuration',
        },
        status: 'pending',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        priority: 'medium',
      },
    ];

    setCacheStrategies(sampleStrategies);
    setCacheLayers(sampleLayers);
    setCacheEntries(sampleEntries);
    setCacheMetrics(sampleMetrics);
    setCacheOptimizations(sampleOptimizations);
    setActiveAlerts(sampleLayers.flatMap(layer => layer.alerts));
  };

  const updateMetrics = () => {
    const newMetric: CacheMetrics = {
      timestamp: new Date(),
      totalRequests: Math.floor(Math.random() * 10000) + 5000,
      cacheHits: Math.floor(Math.random() * 8000) + 4000,
      cacheMisses: Math.floor(Math.random() * 2000) + 500,
      hitRate: 0,
      averageLatency: Math.random() * 10 + 1,
      throughput: Math.floor(Math.random() * 5000) + 2000,
      memoryUsage: Math.random() * 30 + 60,
      diskUsage: Math.random() * 20 + 50,
      networkTraffic: Math.random() * 1000 + 500,
      errorCount: Math.floor(Math.random() * 10),
      evictions: Math.floor(Math.random() * 50),
      compressionRatio: Math.random() * 20 + 70,
      costSavings: Math.random() * 500 + 200,
    };
    newMetric.hitRate = (newMetric.cacheHits / newMetric.totalRequests) * 100;

    setCacheMetrics(prev => [...prev.slice(1), newMetric]);
  };

  const clearCache = async (layerId?: string) => {
    try {
      if (layerId) {
        // Clear specific layer
        setCacheLayers(prev => prev.map(layer => {
          if (layer.id === layerId) {
            return {
              ...layer,
              used: 0,
              entries: 0,
              hitRate: 0,
            };
          }
          return layer;
        }));
        
        setCacheEntries(prev => prev.filter(entry => entry.layer.id !== layerId));
        onCacheCleared?.(layerId);
      } else {
        // Clear all caches
        setCacheLayers(prev => prev.map(layer => ({
          ...layer,
          used: 0,
          entries: 0,
          hitRate: 0,
        })));
        
        setCacheEntries([]);
        onCacheCleared?.('all');
      }
      
      alert('Cache erfolgreich geleert!');
    } catch (error) {
      console.error('Cache clear failed:', error);
      alert('Fehler beim Leeren des Cache.');
    }
  };

  const implementOptimization = async (optimizationId: string) => {
    const optimization = cacheOptimizations.find(opt => opt.id === optimizationId);
    if (!optimization) return;

    try {
      setIsAnalyzing(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setCacheOptimizations(prev => prev.map(opt => {
        if (opt.id === optimizationId) {
          return {
            ...opt,
            status: 'completed',
            implementedAt: new Date(),
          };
        }
        return opt;
      }));

      // Apply performance improvements
      setCacheLayers(prev => prev.map(layer => ({
        ...layer,
        hitRate: Math.min(100, layer.hitRate + optimization.estimatedImpact.hitRateImprovement),
        latency: Math.max(0.1, layer.latency - optimization.estimatedImpact.latencyReduction),
        healthScore: Math.min(100, layer.healthScore + 5),
      })));

      onOptimizationApplied?.(optimization);
      alert(`Optimierung "${optimization.title}" erfolgreich implementiert!`);
    } catch (error) {
      console.error('Optimization implementation failed:', error);
      alert('Fehler bei der Implementierung der Optimierung.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const refreshCache = async (entryId?: string) => {
    try {
      if (entryId) {
        setCacheEntries(prev => prev.map(entry => {
          if (entry.id === entryId) {
            return {
              ...entry,
              lastAccessed: new Date(),
              invalidated: false,
            };
          }
          return entry;
        }));
      } else {
        setCacheEntries(prev => prev.map(entry => ({
          ...entry,
          lastAccessed: new Date(),
          invalidated: false,
        })));
      }
      
      alert('Cache erfolgreich aktualisiert!');
    } catch (error) {
      console.error('Cache refresh failed:', error);
      alert('Fehler beim Aktualisieren des Cache.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'completed': return 'success';
      case 'pending': case 'approved': return 'warning';
      case 'implementing': return 'info';
      case 'rejected': case 'error': return 'error';
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

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredEntries = useMemo(() => {
    return cacheEntries
      .filter(entry => {
        const matchesSearch = searchTerm === '' || 
          entry.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesLayer = layerFilter === 'all' || entry.layer.type === layerFilter;
        const matchesType = typeFilter === 'all' || entry.type === typeFilter;
        return matchesSearch && matchesLayer && matchesType;
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
  }, [cacheEntries, searchTerm, layerFilter, typeFilter, sortBy, sortOrder]);

  const latestMetrics = cacheMetrics[cacheMetrics.length - 1];
  const totalCacheSize = cacheLayers.reduce((sum, layer) => sum + layer.used, 0);
  const totalCacheCapacity = cacheLayers.reduce((sum, layer) => sum + layer.capacity, 0);
  const averageHitRate = cacheLayers.reduce((sum, layer) => sum + layer.hitRate, 0) / cacheLayers.length;

  const renderOverviewTab = () => (
    <Grid container spacing={3}>
      {/* Key Performance Indicators */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Cache-Performance Übersicht
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)` }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        Hit Rate
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {averageHitRate.toFixed(1)}%
                      </Typography>
                    </Box>
                    <CachedIcon sx={{ fontSize: 40, color: 'success.main' }} />
                  </Box>
                  <Box sx={{ mt: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={averageHitRate}
                      color={averageHitRate > 90 ? 'success' : averageHitRate > 75 ? 'warning' : 'error'}
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
                        Latenz
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {latestMetrics?.averageLatency.toFixed(1) || 0}ms
                      </Typography>
                    </Box>
                    <TimerIcon sx={{ fontSize: 40, color: 'info.main' }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Durchschnitt
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
                        Speichernutzung
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {((totalCacheSize / totalCacheCapacity) * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                    <MemoryIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {formatBytes(totalCacheSize)} / {formatBytes(totalCacheCapacity)}
                  </Typography>
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
                        Aktive Alerts
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {activeAlerts.filter(alert => !alert.resolved).length}
                      </Typography>
                    </Box>
                    <WarningIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Benötigen Aufmerksamkeit
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </Grid>

      {/* Cache Layers Overview */}
      <Grid item xs={12} md={8}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Cache-Layer Status
          </Typography>
          <Grid container spacing={2}>
            {cacheLayers.map((layer, index) => (
              <Grid item xs={12} sm={6} md={4} key={layer.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    sx={{ 
                      height: '100%',
                      cursor: 'pointer',
                      '&:hover': { boxShadow: theme.shadows[4] }
                    }}
                    onClick={() => {
                      setSelectedLayer(layer);
                      setIsConfigDialogOpen(true);
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Avatar
                          sx={{
                            bgcolor: layer.isActive ? 'success.main' : 'grey.500',
                            width: 32,
                            height: 32,
                          }}
                        >
                          {layer.type === 'memory' ? <MemoryIcon /> :
                           layer.type === 'redis' ? <StorageIcon /> :
                           layer.type === 'cdn' ? <CloudIcon /> : <CachedIcon />}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                            {layer.name}
                          </Typography>
                          <Chip
                            label={layer.isActive ? 'Aktiv' : 'Inaktiv'}
                            size="small"
                            color={layer.isActive ? 'success' : 'default'}
                          />
                        </Box>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption">Hit Rate</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {layer.hitRate.toFixed(1)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={layer.hitRate}
                          color={layer.hitRate > 90 ? 'success' : layer.hitRate > 75 ? 'warning' : 'error'}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption">Speicher</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {((layer.used / layer.capacity) * 100).toFixed(1)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(layer.used / layer.capacity) * 100}
                          color={(layer.used / layer.capacity) > 0.8 ? 'error' : (layer.used / layer.capacity) > 0.6 ? 'warning' : 'primary'}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', justify: 'space-between', align: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          Latenz: {layer.latency}ms
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {layer.entries} Einträge
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Grid>

      {/* Performance Charts */}
      <Grid item xs={12} md={4}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Hit Rate Verteilung
          </Typography>
          <Box sx={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cacheLayers.map(layer => ({
                    name: layer.name,
                    value: layer.hitRate,
                    fill: layer.hitRate > 90 ? theme.palette.success.main :
                          layer.hitRate > 75 ? theme.palette.warning.main : theme.palette.error.main,
                  }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                />
                <RechartsTooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Hit Rate']} />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>

      {/* Performance Trends */}
      <Grid item xs={12}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Performance-Trends (24h)
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={cacheMetrics}>
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
                    name === 'hitRate' ? 'Hit Rate (%)' :
                    name === 'averageLatency' ? 'Latenz (ms)' :
                    name === 'throughput' ? 'Durchsatz (ops/s)' :
                    name === 'memoryUsage' ? 'Speicher (%)' : name
                  ]}
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="hitRate"
                  stackId="1"
                  stroke={theme.palette.success.main}
                  fill={alpha(theme.palette.success.main, 0.3)}
                  name="Hit Rate"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="averageLatency"
                  stroke={theme.palette.info.main}
                  strokeWidth={2}
                  name="Latenz"
                />
                <Bar
                  yAxisId="left"
                  dataKey="memoryUsage"
                  fill={theme.palette.primary.main}
                  name="Speichernutzung"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>

      {/* Active Alerts */}
      {activeAlerts.filter(alert => !alert.resolved).length > 0 && (
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Aktive Warnungen
            </Typography>
            <List>
              {activeAlerts
                .filter(alert => !alert.resolved)
                .map((alert) => (
                  <React.Fragment key={alert.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <WarningIcon sx={{ color: getSeverityColor(alert.severity) }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {alert.message}
                            </Typography>
                            <Chip
                              label={alert.severity}
                              size="small"
                              sx={{ backgroundColor: getSeverityColor(alert.severity), color: 'white' }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {alert.timestamp.toLocaleString('de-DE')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Empfohlene Aktionen: {alert.actions.join(', ')}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setActiveAlerts(prev => prev.map(a => 
                              a.id === alert.id ? { ...a, resolved: true, resolvedAt: new Date() } : a
                            ));
                          }}
                        >
                          Lösen
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
            </List>
          </Paper>
        </Grid>
      )}
    </Grid>
  );

  const renderCacheEntriesTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Cache-Einträge Verwaltung
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refreshCache()}
          >
            Alle aktualisieren
          </Button>
          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            color="warning"
            onClick={() => clearCache()}
          >
            Cache leeren
          </Button>
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
              <InputLabel>Layer</InputLabel>
              <Select
                value={layerFilter}
                label="Layer"
                onChange={(e) => setLayerFilter(e.target.value)}
              >
                <MenuItem value="all">Alle</MenuItem>
                <MenuItem value="memory">Memory</MenuItem>
                <MenuItem value="redis">Redis</MenuItem>
                <MenuItem value="cdn">CDN</MenuItem>
                <MenuItem value="database">Database</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Typ</InputLabel>
              <Select
                value={typeFilter}
                label="Typ"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="all">Alle</MenuItem>
                <MenuItem value="query_result">Query Result</MenuItem>
                <MenuItem value="api_response">API Response</MenuItem>
                <MenuItem value="computed_data">Computed Data</MenuItem>
                <MenuItem value="static_asset">Static Asset</MenuItem>
                <MenuItem value="session_data">Session Data</MenuItem>
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
                <MenuItem value="hits">Hits</MenuItem>
                <MenuItem value="size">Größe</MenuItem>
                <MenuItem value="lastAccessed">Zuletzt verwendet</MenuItem>
                <MenuItem value="hitRate">Hit Rate</MenuItem>
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
          <Grid item xs={12} sm={12} md={1}>
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              size="small"
              fullWidth
            >
              Export
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Cache Entries Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Schlüssel</TableCell>
              <TableCell>Typ</TableCell>
              <TableCell>Layer</TableCell>
              <TableCell>Größe</TableCell>
              <TableCell>Hits</TableCell>
              <TableCell>Hit Rate</TableCell>
              <TableCell>Zuletzt verwendet</TableCell>
              <TableCell>TTL</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEntries
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((entry) => (
                <TableRow key={entry.id} hover>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'monospace',
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {entry.key}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                      {entry.tags.map(tag => (
                        <Chip key={tag} label={tag} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={entry.type.replace('_', ' ')}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {entry.layer.type === 'memory' ? <MemoryIcon /> :
                       entry.layer.type === 'redis' ? <StorageIcon /> :
                       entry.layer.type === 'cdn' ? <CloudIcon /> : <CachedIcon />}
                      <Typography variant="body2">
                        {entry.layer.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{formatBytes(entry.size)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {entry.hits}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {entry.misses} misses
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={entry.hitRate}
                        sx={{ width: 60, height: 6 }}
                        color={entry.hitRate > 80 ? 'success' : entry.hitRate > 60 ? 'warning' : 'error'}
                      />
                      <Typography variant="caption">
                        {entry.hitRate.toFixed(1)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {entry.lastAccessed.toLocaleDateString('de-DE')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {entry.lastAccessed.toLocaleTimeString('de-DE')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {entry.expiresAt 
                        ? `${Math.max(0, Math.floor((entry.expiresAt.getTime() - Date.now()) / 1000))}s`
                        : 'Kein TTL'
                      }
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={entry.invalidated ? 'Invalidiert' : 'Gültig'}
                      size="small"
                      color={entry.invalidated ? 'error' : 'success'}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Details">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedEntry(entry);
                            setIsEntryDialogOpen(true);
                          }}
                        >
                          <InfoIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Aktualisieren">
                        <IconButton
                          size="small"
                          onClick={() => refreshCache(entry.id)}
                        >
                          <RefreshIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Löschen">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setCacheEntries(prev => prev.filter(e => e.id !== entry.id));
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredEntries.length}
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

  const renderCacheStrategiesTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        Cache-Strategien
      </Typography>
      
      <Grid container spacing={3}>
        {cacheStrategies.map((strategy, index) => (
          <Grid item xs={12} md={6} lg={4} key={strategy.id}>
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
                        {strategy.name}
                      </Typography>
                      <Chip
                        label={strategy.type.toUpperCase()}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                    <Chip
                      label={strategy.complexity}
                      size="small"
                      color={strategy.complexity === 'low' ? 'success' : strategy.complexity === 'medium' ? 'warning' : 'error'}
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {strategy.description}
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 1, backgroundColor: alpha(theme.palette.success.main, 0.1), borderRadius: 1 }}>
                        <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
                          {strategy.performanceScore}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Performance
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 1, backgroundColor: alpha(theme.palette.info.main, 0.1), borderRadius: 1 }}>
                        <Typography variant="h6" color="info.main" sx={{ fontWeight: 'bold' }}>
                          {strategy.costEfficiency}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Kosteneffizienz
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Empfohlen für:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {strategy.recommendedFor.slice(0, 3).map(usage => (
                        <Chip key={usage} label={usage.replace('_', ' ')} size="small" variant="outlined" />
                      ))}
                      {strategy.recommendedFor.length > 3 && (
                        <Chip label={`+${strategy.recommendedFor.length - 3}`} size="small" variant="outlined" />
                      )}
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" fullWidth>
                      Details
                    </Button>
                    <Button size="small" variant="contained" fullWidth>
                      Anwenden
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

  const renderOptimizationsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Cache-Optimierungen
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
        {cacheOptimizations.map((optimization, index) => (
          <Grid item xs={12} key={optimization.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                sx={{
                  border: optimization.priority === 'critical' ? `2px solid ${theme.palette.error.main}` :
                         optimization.priority === 'high' ? `2px solid ${theme.palette.warning.main}` : 'none'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {optimization.title}
                        </Typography>
                        <Chip
                          label={optimization.priority}
                          size="small"
                          color={optimization.priority === 'critical' ? 'error' : optimization.priority === 'high' ? 'warning' : 'info'}
                        />
                        <Chip
                          label={optimization.status}
                          size="small"
                          color={getStatusColor(optimization.status) as any}
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {optimization.description}
                      </Typography>
                      
                      {/* Impact Metrics */}
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ textAlign: 'center', p: 1, backgroundColor: alpha(theme.palette.success.main, 0.1), borderRadius: 1 }}>
                            <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
                              +{optimization.estimatedImpact.performanceGain}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Performance
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ textAlign: 'center', p: 1, backgroundColor: alpha(theme.palette.info.main, 0.1), borderRadius: 1 }}>
                            <Typography variant="h6" color="info.main" sx={{ fontWeight: 'bold' }}>
                              -{optimization.estimatedImpact.latencyReduction}ms
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Latenz
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ textAlign: 'center', p: 1, backgroundColor: alpha(theme.palette.warning.main, 0.1), borderRadius: 1 }}>
                            <Typography variant="h6" color="warning.main" sx={{ fontWeight: 'bold' }}>
                              +{optimization.estimatedImpact.hitRateImprovement}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Hit Rate
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ textAlign: 'center', p: 1, backgroundColor: alpha(theme.palette.primary.main, 0.1), borderRadius: 1 }}>
                            <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                              {optimization.implementation.effort}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Aufwand
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                      
                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Aktuell: {optimization.currentValue}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Empfohlen: {optimization.recommendedValue}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Ausfallzeit: {optimization.implementation.downtime}min
                        </Typography>
                      </Box>
                      
                      {optimization.implementation.downtime > 10 && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          Hohe Ausfallzeit erforderlich: {optimization.implementation.downtime} Minuten
                        </Alert>
                      )}
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSelectedOptimization(optimization);
                          setIsOptimizationDialogOpen(true);
                        }}
                      >
                        Details
                      </Button>
                      
                      {optimization.status === 'pending' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircleIcon />}
                        >
                          Genehmigen
                        </Button>
                      )}
                      
                      {optimization.status === 'approved' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          startIcon={<FlashOnIcon />}
                          onClick={() => implementOptimization(optimization.id)}
                          disabled={isAnalyzing}
                        >
                          {isAnalyzing ? <CircularProgress size={16} /> : 'Implementieren'}
                        </Button>
                      )}
                      
                      {optimization.status === 'completed' && optimization.implementedAt && (
                        <Typography variant="caption" color="success.main" sx={{ textAlign: 'center' }}>
                          Implementiert am {optimization.implementedAt.toLocaleDateString('de-DE')}
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
              <CachedIcon color="primary" />
              Caching Strategy Implementation
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label={`${averageHitRate.toFixed(1)}% Hit Rate`}
                color={averageHitRate > 90 ? 'success' : averageHitRate > 75 ? 'warning' : 'error'}
                icon={<SpeedIcon />}
              />
              <Chip
                label={`${cacheLayers.filter(l => l.isActive).length}/${cacheLayers.length} Aktiv`}
                color={cacheLayers.every(l => l.isActive) ? 'success' : 'warning'}
                icon={<LayersIcon />}
              />
              <Chip
                label={isMonitoring ? 'Live' : 'Pausiert'}
                color={isMonitoring ? 'success' : 'default'}
                icon={<MonitorIcon />}
              />
            </Box>
          </Box>
          
          <Typography variant="body1" color="text.secondary">
            Intelligente Cache-Verwaltung mit Multi-Layer-Strategien, Performance-Optimierung und automatischen Verbesserungsvorschlägen
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
            <Tab label="Cache-Einträge" icon={<StorageIcon />} />
            <Tab label="Strategien" icon={<TreeIcon />} />
            <Tab label="Optimierungen" icon={<TuneIcon />} />
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
        {selectedTab === 1 && renderCacheEntriesTab()}
        {selectedTab === 2 && renderCacheStrategiesTab()}
        {selectedTab === 3 && renderOptimizationsTab()}
      </motion.div>

      {/* Dialogs */}
      <Dialog
        open={isEntryDialogOpen}
        onClose={() => setIsEntryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Cache-Eintrag Details</DialogTitle>
        <DialogContent>
          {selectedEntry && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    {selectedEntry.key}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip label={selectedEntry.type} size="small" />
                    <Chip label={selectedEntry.layer.name} size="small" color="primary" />
                    <Chip 
                      label={selectedEntry.invalidated ? 'Invalidiert' : 'Gültig'} 
                      size="small" 
                      color={selectedEntry.invalidated ? 'error' : 'success'} 
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Performance-Metriken
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Hits" 
                        secondary={selectedEntry.hits} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Misses" 
                        secondary={selectedEntry.misses} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Hit Rate" 
                        secondary={`${selectedEntry.hitRate.toFixed(1)}%`} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Größe" 
                        secondary={formatBytes(selectedEntry.size)} 
                      />
                    </ListItem>
                  </List>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Zeitstempel
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Erstellt" 
                        secondary={selectedEntry.createdAt.toLocaleString('de-DE')} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Zuletzt verwendet" 
                        secondary={selectedEntry.lastAccessed.toLocaleString('de-DE')} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Läuft ab" 
                        secondary={selectedEntry.expiresAt?.toLocaleString('de-DE') || 'Kein TTL'} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Kompression" 
                        secondary={`${selectedEntry.compressionRatio}%`} 
                      />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEntryDialogOpen(false)}>
            Schließen
          </Button>
          <Button variant="contained" onClick={() => selectedEntry && refreshCache(selectedEntry.id)}>
            Aktualisieren
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
          {selectedOptimization && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="h6" gutterBottom>
                {selectedOptimization.title}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {selectedOptimization.description}
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Auswirkungen
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Performance-Gewinn" 
                        secondary={`+${selectedOptimization.estimatedImpact.performanceGain}%`} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Latenz-Reduzierung" 
                        secondary={`-${selectedOptimization.estimatedImpact.latencyReduction}ms`} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Hit Rate Verbesserung" 
                        secondary={`+${selectedOptimization.estimatedImpact.hitRateImprovement}%`} 
                      />
                    </ListItem>
                  </List>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Implementierung
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Aufwand" 
                        secondary={selectedOptimization.implementation.effort} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Risiko" 
                        secondary={selectedOptimization.implementation.risk} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Ausfallzeit" 
                        secondary={`${selectedOptimization.implementation.downtime} Minuten`} 
                      />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
              
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Rollback-Plan
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedOptimization.implementation.rollbackPlan}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsOptimizationDialogOpen(false)}>
            Schließen
          </Button>
          {selectedOptimization?.status === 'approved' && (
            <Button 
              variant="contained" 
              onClick={() => {
                implementOptimization(selectedOptimization.id);
                setIsOptimizationDialogOpen(false);
              }}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? 'Implementiere...' : 'Implementieren'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CacheStrategyImplementation;