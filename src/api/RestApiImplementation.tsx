import React, { useState, useEffect, useMemo } from 'react';
import { Box, Card, CardContent, Typography, Paper, Button, TextField, FormControl, InputLabel, Select, MenuItem, IconButton, Chip, List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction, Divider, useTheme, alpha, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Switch, FormControlLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress, Tab, Tabs, CircularProgress, Badge } from '@mui/material';
import Grid from '../components/GridCompat';
import {
  Api as ApiIcon,
  Code as CodeIcon,
  Storage as StorageIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Router as RouterIcon,
  Dns as DnsIcon,
  Cloud as CloudIcon,
  Monitor as MonitorIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  VpnKey as KeyIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  BugReport as BugIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  NetworkCheck as NetworkIcon,
  Memory as MemoryIcon,
  Cached as CachedIcon,
} from '@mui/icons-material';
import { format, addDays, addHours, differenceInMilliseconds } from 'date-fns';
import { de } from 'date-fns/locale';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AnimatedCard, SlideInContainer } from '../components/MicroAnimations';

interface ApiRoute {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  handler: string;
  middleware: string[];
  status: 'active' | 'inactive' | 'deprecated' | 'error';
  description: string;
  lastAccess: Date;
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
  version: string;
  rateLimiting: {
    enabled: boolean;
    requests: number;
    window: string;
    remaining: number;
  };
  authentication: {
    required: boolean;
    type: 'bearer' | 'apikey' | 'oauth2' | 'basic';
    scopes?: string[];
  };
  caching: {
    enabled: boolean;
    ttl: number;
    strategy: 'memory' | 'redis' | 'cdn';
  };
}

interface ApiMiddleware {
  id: string;
  name: string;
  type: 'authentication' | 'authorization' | 'validation' | 'logging' | 'caching' | 'rate_limiting' | 'cors' | 'compression';
  enabled: boolean;
  config: Record<string, any>;
  order: number;
  description: string;
  routes: string[];
  performance: {
    averageExecutionTime: number;
    totalExecutions: number;
    errorCount: number;
  };
}

interface ApiMetrics {
  id: string;
  timestamp: Date;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  userAgent: string;
  ipAddress: string;
  userId?: string;
  errorMessage?: string;
}

interface ApiServer {
  id: string;
  name: string;
  url: string;
  environment: 'development' | 'staging' | 'production';
  status: 'online' | 'offline' | 'maintenance' | 'error';
  version: string;
  uptime: number;
  lastHealthCheck: Date;
  metrics: {
    requestsPerSecond: number;
    averageResponseTime: number;
    errorRate: number;
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
  };
  deployment: {
    lastDeployed: Date;
    deployedBy: string;
    gitCommit: string;
    buildNumber: string;
  };
}

interface RestApiImplementationProps {
  onRouteCreated?: (route: ApiRoute) => void;
  onMiddlewareUpdated?: (middleware: ApiMiddleware) => void;
  onServerDeployed?: (server: ApiServer) => void;
}

const RestApiImplementation: React.FC<RestApiImplementationProps> = ({
  onRouteCreated,
  onMiddlewareUpdated,
  onServerDeployed,
}) => {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState(0);
  const [routes, setRoutes] = useState<ApiRoute[]>([]);
  const [middleware, setMiddleware] = useState<ApiMiddleware[]>([]);
  const [metrics, setMetrics] = useState<ApiMetrics[]>([]);
  const [servers, setServers] = useState<ApiServer[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<ApiRoute | null>(null);
  const [selectedMiddleware, setSelectedMiddleware] = useState<ApiMiddleware | null>(null);
  const [isRouteDialogOpen, setIsRouteDialogOpen] = useState(false);
  const [isMiddlewareDialogOpen, setIsMiddlewareDialogOpen] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    status: 'all',
    method: 'all',
    middleware: 'all',
    environment: 'all',
  });

  useEffect(() => {
    initializeApiImplementation();
    
    // Simulate real-time metrics updates
    const metricsInterval = setInterval(updateMetrics, 5000);
    const serverInterval = setInterval(updateServerMetrics, 10000);
    
    return () => {
      clearInterval(metricsInterval);
      clearInterval(serverInterval);
    };
  }, []);

  const initializeApiImplementation = () => {
    // Initialize middleware
    const apiMiddleware: ApiMiddleware[] = [
      {
        id: 'auth-jwt',
        name: 'JWT Authentication',
        type: 'authentication',
        enabled: true,
        config: {
          secret: 'jwt_secret_key',
          expiresIn: '24h',
          issuer: 'relocato-api',
          algorithm: 'HS256',
        },
        order: 1,
        description: 'JSON Web Token based authentication middleware',
        routes: ['*'],
        performance: {
          averageExecutionTime: 2.5,
          totalExecutions: 15420,
          errorCount: 23,
        },
      },
      {
        id: 'rate-limiter',
        name: 'Rate Limiting',
        type: 'rate_limiting',
        enabled: true,
        config: {
          windowMs: 900000, // 15 minutes
          max: 100,
          message: 'Too many requests from this IP',
          standardHeaders: true,
          legacyHeaders: false,
        },
        order: 2,
        description: 'Prevent API abuse with configurable rate limiting',
        routes: ['*'],
        performance: {
          averageExecutionTime: 0.8,
          totalExecutions: 25680,
          errorCount: 156,
        },
      },
      {
        id: 'cors-handler',
        name: 'CORS Handler',
        type: 'cors',
        enabled: true,
        config: {
          origin: ['https://app.relocato.de', 'https://relocato.de'],
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
          allowedHeaders: ['Content-Type', 'Authorization'],
          credentials: true,
        },
        order: 3,
        description: 'Cross-Origin Resource Sharing configuration',
        routes: ['*'],
        performance: {
          averageExecutionTime: 0.3,
          totalExecutions: 28934,
          errorCount: 0,
        },
      },
      {
        id: 'request-validator',
        name: 'Request Validation',
        type: 'validation',
        enabled: true,
        config: {
          validateHeaders: true,
          validateParams: true,
          validateBody: true,
          strictMode: true,
        },
        order: 4,
        description: 'Validate incoming requests against OpenAPI schema',
        routes: ['/api/v1/customers', '/api/v1/quotes', '/api/v1/bookings'],
        performance: {
          averageExecutionTime: 5.2,
          totalExecutions: 12340,
          errorCount: 234,
        },
      },
      {
        id: 'redis-cache',
        name: 'Redis Caching',
        type: 'caching',
        enabled: true,
        config: {
          host: 'localhost',
          port: 6379,
          defaultTTL: 300,
          keyPrefix: 'relocato:api:',
        },
        order: 5,
        description: 'Redis-based response caching for improved performance',
        routes: ['/api/v1/customers', '/api/v1/analytics'],
        performance: {
          averageExecutionTime: 1.2,
          totalExecutions: 8960,
          errorCount: 12,
        },
      },
      {
        id: 'request-logger',
        name: 'Request Logger',
        type: 'logging',
        enabled: true,
        config: {
          format: 'combined',
          level: 'info',
          logErrors: true,
          logSuccess: true,
        },
        order: 6,
        description: 'Comprehensive request and response logging',
        routes: ['*'],
        performance: {
          averageExecutionTime: 0.5,
          totalExecutions: 34567,
          errorCount: 0,
        },
      },
    ];

    // Initialize API routes
    const apiRoutes: ApiRoute[] = [
      {
        id: 'customers-list',
        path: '/api/v1/customers',
        method: 'GET',
        handler: 'CustomerController.list',
        middleware: ['auth-jwt', 'rate-limiter', 'cors-handler', 'redis-cache', 'request-logger'],
        status: 'active',
        description: 'Retrieve paginated list of customers',
        lastAccess: new Date(),
        requestCount: 1250,
        averageResponseTime: 85,
        errorRate: 0.8,
        version: 'v1',
        rateLimiting: {
          enabled: true,
          requests: 100,
          window: '15m',
          remaining: 87,
        },
        authentication: {
          required: true,
          type: 'bearer',
          scopes: ['customers:read'],
        },
        caching: {
          enabled: true,
          ttl: 300,
          strategy: 'redis',
        },
      },
      {
        id: 'customers-create',
        path: '/api/v1/customers',
        method: 'POST',
        handler: 'CustomerController.create',
        middleware: ['auth-jwt', 'rate-limiter', 'cors-handler', 'request-validator', 'request-logger'],
        status: 'active',
        description: 'Create a new customer',
        lastAccess: addHours(new Date(), -2),
        requestCount: 340,
        averageResponseTime: 120,
        errorRate: 2.1,
        version: 'v1',
        rateLimiting: {
          enabled: true,
          requests: 10,
          window: '1m',
          remaining: 7,
        },
        authentication: {
          required: true,
          type: 'bearer',
          scopes: ['customers:write'],
        },
        caching: {
          enabled: false,
          ttl: 0,
          strategy: 'memory',
        },
      },
      {
        id: 'customers-detail',
        path: '/api/v1/customers/{id}',
        method: 'GET',
        handler: 'CustomerController.getById',
        middleware: ['auth-jwt', 'rate-limiter', 'cors-handler', 'redis-cache', 'request-logger'],
        status: 'active',
        description: 'Get customer by ID',
        lastAccess: addHours(new Date(), -1),
        requestCount: 890,
        averageResponseTime: 65,
        errorRate: 1.2,
        version: 'v1',
        rateLimiting: {
          enabled: true,
          requests: 100,
          window: '15m',
          remaining: 95,
        },
        authentication: {
          required: true,
          type: 'bearer',
          scopes: ['customers:read'],
        },
        caching: {
          enabled: true,
          ttl: 600,
          strategy: 'redis',
        },
      },
      {
        id: 'quotes-create',
        path: '/api/v1/quotes',
        method: 'POST',
        handler: 'QuoteController.create',
        middleware: ['auth-jwt', 'rate-limiter', 'cors-handler', 'request-validator', 'request-logger'],
        status: 'active',
        description: 'Generate a new moving quote',
        lastAccess: addHours(new Date(), -3),
        requestCount: 156,
        averageResponseTime: 280,
        errorRate: 3.2,
        version: 'v1',
        rateLimiting: {
          enabled: true,
          requests: 5,
          window: '1m',
          remaining: 3,
        },
        authentication: {
          required: true,
          type: 'bearer',
          scopes: ['quotes:write'],
        },
        caching: {
          enabled: false,
          ttl: 0,
          strategy: 'memory',
        },
      },
      {
        id: 'analytics-overview',
        path: '/api/v1/analytics/overview',
        method: 'GET',
        handler: 'AnalyticsController.overview',
        middleware: ['auth-jwt', 'rate-limiter', 'cors-handler', 'redis-cache', 'request-logger'],
        status: 'active',
        description: 'Get business analytics overview',
        lastAccess: addHours(new Date(), -4),
        requestCount: 89,
        averageResponseTime: 450,
        errorRate: 0.5,
        version: 'v1',
        rateLimiting: {
          enabled: true,
          requests: 30,
          window: '1m',
          remaining: 28,
        },
        authentication: {
          required: true,
          type: 'bearer',
          scopes: ['analytics:read'],
        },
        caching: {
          enabled: true,
          ttl: 900,
          strategy: 'redis',
        },
      },
      {
        id: 'auth-login',
        path: '/api/v1/auth/login',
        method: 'POST',
        handler: 'AuthController.login',
        middleware: ['rate-limiter', 'cors-handler', 'request-validator', 'request-logger'],
        status: 'active',
        description: 'User authentication endpoint',
        lastAccess: addHours(new Date(), -1),
        requestCount: 67,
        averageResponseTime: 180,
        errorRate: 5.8,
        version: 'v1',
        rateLimiting: {
          enabled: true,
          requests: 5,
          window: '1m',
          remaining: 4,
        },
        authentication: {
          required: false,
          type: 'bearer',
        },
        caching: {
          enabled: false,
          ttl: 0,
          strategy: 'memory',
        },
      },
    ];

    // Initialize servers
    const apiServers: ApiServer[] = [
      {
        id: 'dev-server',
        name: 'Development Server',
        url: 'https://api-dev.relocato.de',
        environment: 'development',
        status: 'online',
        version: 'v1.2.3-dev',
        uptime: 99.2,
        lastHealthCheck: new Date(),
        metrics: {
          requestsPerSecond: 2.3,
          averageResponseTime: 145,
          errorRate: 1.8,
          cpuUsage: 35,
          memoryUsage: 68,
          diskUsage: 45,
        },
        deployment: {
          lastDeployed: addDays(new Date(), -2),
          deployedBy: 'developer@relocato.de',
          gitCommit: 'a1b2c3d4',
          buildNumber: '123',
        },
      },
      {
        id: 'staging-server',
        name: 'Staging Server',
        url: 'https://api-staging.relocato.de',
        environment: 'staging',
        status: 'online',
        version: 'v1.2.2',
        uptime: 99.8,
        lastHealthCheck: addHours(new Date(), -1),
        metrics: {
          requestsPerSecond: 8.7,
          averageResponseTime: 98,
          errorRate: 0.5,
          cpuUsage: 45,
          memoryUsage: 72,
          diskUsage: 38,
        },
        deployment: {
          lastDeployed: addDays(new Date(), -5),
          deployedBy: 'ci/cd@relocato.de',
          gitCommit: 'e5f6g7h8',
          buildNumber: '118',
        },
      },
      {
        id: 'prod-server',
        name: 'Production Server',
        url: 'https://api.relocato.de',
        environment: 'production',
        status: 'online',
        version: 'v1.2.1',
        uptime: 99.95,
        lastHealthCheck: new Date(),
        metrics: {
          requestsPerSecond: 45.2,
          averageResponseTime: 78,
          errorRate: 0.2,
          cpuUsage: 58,
          memoryUsage: 74,
          diskUsage: 42,
        },
        deployment: {
          lastDeployed: addDays(new Date(), -7),
          deployedBy: 'release@relocato.de',
          gitCommit: 'i9j0k1l2',
          buildNumber: '115',
        },
      },
    ];

    // Generate sample metrics
    const sampleMetrics: ApiMetrics[] = [];
    for (let i = 0; i < 100; i++) {
      const route = apiRoutes[Math.floor(Math.random() * apiRoutes.length)];
      sampleMetrics.push({
        id: `metric-${i}`,
        timestamp: addHours(new Date(), -Math.random() * 24),
        endpoint: route.path,
        method: route.method,
        statusCode: Math.random() > 0.95 ? (Math.random() > 0.5 ? 400 : 500) : 200,
        responseTime: Math.random() * 300 + 50,
        requestSize: Math.random() * 5000 + 100,
        responseSize: Math.random() * 10000 + 500,
        userAgent: 'Relocato Mobile App v2.1.0',
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userId: Math.random() > 0.3 ? `user_${Math.floor(Math.random() * 1000)}` : undefined,
        errorMessage: Math.random() > 0.95 ? 'Internal server error' : undefined,
      });
    }

    setMiddleware(apiMiddleware);
    setRoutes(apiRoutes);
    setServers(apiServers);
    setMetrics(sampleMetrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
  };

  const updateMetrics = () => {
    // Simulate real-time metrics updates
    setMetrics(prev => {
      const newMetric: ApiMetrics = {
        id: `metric-${Date.now()}`,
        timestamp: new Date(),
        endpoint: '/api/v1/customers',
        method: 'GET',
        statusCode: Math.random() > 0.95 ? 500 : 200,
        responseTime: Math.random() * 200 + 50,
        requestSize: Math.random() * 2000 + 100,
        responseSize: Math.random() * 8000 + 500,
        userAgent: 'Relocato Web App v1.5.0',
        ipAddress: `10.0.0.${Math.floor(Math.random() * 255)}`,
        userId: `user_${Math.floor(Math.random() * 1000)}`,
      };
      
      return [newMetric, ...prev.slice(0, 99)];
    });
  };

  const updateServerMetrics = () => {
    setServers(prev => prev.map(server => ({
      ...server,
      metrics: {
        ...server.metrics,
        requestsPerSecond: server.metrics.requestsPerSecond + (Math.random() - 0.5) * 2,
        averageResponseTime: Math.max(50, server.metrics.averageResponseTime + (Math.random() - 0.5) * 10),
        errorRate: Math.max(0, server.metrics.errorRate + (Math.random() - 0.5) * 0.1),
        cpuUsage: Math.min(100, Math.max(0, server.metrics.cpuUsage + (Math.random() - 0.5) * 5)),
        memoryUsage: Math.min(100, Math.max(0, server.metrics.memoryUsage + (Math.random() - 0.5) * 3)),
      },
      lastHealthCheck: new Date(),
    })));
  };

  const deployToServer = async (serverId: string) => {
    setIsDeploying(true);
    
    // Simulate deployment process
    setTimeout(() => {
      setServers(prev => prev.map(server => 
        server.id === serverId 
          ? {
              ...server,
              deployment: {
                lastDeployed: new Date(),
                deployedBy: 'admin@relocato.de',
                gitCommit: Math.random().toString(36).substring(7),
                buildNumber: (parseInt(server.deployment.buildNumber) + 1).toString(),
              },
              version: `v1.2.${parseInt(server.deployment.buildNumber) + 1}`,
            }
          : server
      ));
      
      setIsDeploying(false);
      onServerDeployed?.(servers.find(s => s.id === serverId)!);
      alert('Deployment erfolgreich abgeschlossen!');
    }, 3000);
  };

  const generateApiCode = async () => {
    setIsGeneratingCode(true);
    
    // Simulate code generation
    setTimeout(() => {
      setIsGeneratingCode(false);
      alert('API Code erfolgreich generiert! Download bereit.');
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'online': return 'success';
      case 'inactive': case 'offline': return 'default';
      case 'deprecated': case 'maintenance': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return theme.palette.info.main;
      case 'POST': return theme.palette.success.main;
      case 'PUT': return theme.palette.warning.main;
      case 'PATCH': return theme.palette.warning.light;
      case 'DELETE': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  const filteredRoutes = useMemo(() => {
    return routes.filter(route => {
      const statusMatch = filterCriteria.status === 'all' || route.status === filterCriteria.status;
      const methodMatch = filterCriteria.method === 'all' || route.method === filterCriteria.method;
      
      return statusMatch && methodMatch;
    });
  }, [routes, filterCriteria]);

  const renderRoutesTab = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          API Routes
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<CodeIcon />}
            onClick={generateApiCode}
            disabled={isGeneratingCode}
          >
            {isGeneratingCode ? 'Generiere...' : 'Code generieren'}
          </Button>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsRouteDialogOpen(true)}
          >
            Neue Route
          </Button>
        </Box>
      </Box>
      
      {/* Filters */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
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
                <MenuItem value="deprecated">Deprecated</MenuItem>
                <MenuItem value="error">Fehler</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Method</InputLabel>
              <Select
                value={filterCriteria.method}
                onChange={(e) => setFilterCriteria(prev => ({ ...prev, method: e.target.value }))}
              >
                <MenuItem value="all">Alle</MenuItem>
                <MenuItem value="GET">GET</MenuItem>
                <MenuItem value="POST">POST</MenuItem>
                <MenuItem value="PUT">PUT</MenuItem>
                <MenuItem value="PATCH">PATCH</MenuItem>
                <MenuItem value="DELETE">DELETE</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              {filteredRoutes.length} von {routes.length} Routen
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Route</TableCell>
              <TableCell>Handler</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Requests</TableCell>
              <TableCell align="right">Avg. Response</TableCell>
              <TableCell align="right">Error Rate</TableCell>
              <TableCell>Auth</TableCell>
              <TableCell>Cache</TableCell>
              <TableCell>Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRoutes.map((route) => (
              <TableRow key={route.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={route.method}
                      size="small"
                      sx={{
                        backgroundColor: alpha(getMethodColor(route.method), 0.1),
                        color: getMethodColor(route.method),
                        fontWeight: 'bold',
                        minWidth: 60,
                      }}
                    />
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {route.path}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {route.handler}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={route.status.toUpperCase()}
                    size="small"
                    color={getStatusColor(route.status)}
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {route.requestCount.toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {route.averageResponseTime}ms
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography 
                    variant="body2"
                    sx={{ 
                      color: route.errorRate > 5 ? 'error.main' : 
                             route.errorRate > 2 ? 'warning.main' : 'success.main' 
                    }}
                  >
                    {route.errorRate.toFixed(1)}%
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {route.authentication.required ? (
                      <LockIcon sx={{ fontSize: 16, color: 'success.main' }} />
                    ) : (
                      <PublicIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                    )}
                    <Typography variant="caption">
                      {route.authentication.type}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {route.caching.enabled ? (
                      <CachedIcon sx={{ fontSize: 16, color: 'info.main' }} />
                    ) : (
                      <span>-</span>
                    )}
                    {route.caching.enabled && (
                      <Typography variant="caption">
                        {route.caching.ttl}s
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Details">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedRoute(route);
                          setIsRouteDialogOpen(true);
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
                    <Tooltip title="Testen">
                      <IconButton size="small">
                        <PlayIcon />
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

  const renderMiddlewareTab = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Middleware
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsMiddlewareDialogOpen(true)}
        >
          Neue Middleware
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {middleware.map((mw, index) => (
          <Grid item xs={12} md={6} lg={4} key={mw.id}>
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
                    {mw.type === 'authentication' && <LockIcon color="primary" />}
                    {mw.type === 'rate_limiting' && <SpeedIcon color="primary" />}
                    {mw.type === 'validation' && <CheckCircleIcon color="primary" />}
                    {mw.type === 'caching' && <CachedIcon color="primary" />}
                    {mw.type === 'logging' && <MonitorIcon color="primary" />}
                    {mw.type === 'cors' && <PublicIcon color="primary" />}
                  </Box>
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {mw.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {mw.type.replace('_', ' ').toUpperCase()}
                    </Typography>
                  </Box>
                  
                  <Switch
                    checked={mw.enabled}
                    onChange={(e) => {
                      const updatedMiddleware = { ...mw, enabled: e.target.checked };
                      setMiddleware(prev => prev.map(m => m.id === mw.id ? updatedMiddleware : m));
                      onMiddlewareUpdated?.(updatedMiddleware);
                    }}
                  />
                </Box>
                
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {mw.description}
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {mw.performance.totalExecutions.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Ausführungen
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {mw.performance.averageExecutionTime.toFixed(1)}ms
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Ø Zeit
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {mw.performance.errorCount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Fehler
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setSelectedMiddleware(mw);
                      setIsMiddlewareDialogOpen(true);
                    }}
                    fullWidth
                  >
                    Konfigurieren
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

  const renderServersTab = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Server Management
        </Typography>
        
        <Button
          variant="contained"
          startIcon={isDeploying ? <CircularProgress size={16} color="inherit" /> : <CloudIcon />}
          onClick={() => deployToServer('prod-server')}
          disabled={isDeploying}
        >
          {isDeploying ? 'Deploying...' : 'Deploy zu Prod'}
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {servers.map((server, index) => (
          <Grid item xs={12} key={server.id}>
            <AnimatedCard delay={index * 100}>
              <Box
                sx={{
                  background: server.status === 'online'
                    ? `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${alpha(theme.palette.success.main, 0.8)} 100%)`
                    : server.status === 'error'
                    ? `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${alpha(theme.palette.error.main, 0.8)} 100%)`
                    : `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${alpha(theme.palette.warning.main, 0.8)} 100%)`,
                  color: 'white',
                }}
              >
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <CloudIcon sx={{ fontSize: 40 }} />
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {server.name}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            {server.environment.toUpperCase()}
                          </Typography>
                          <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            {server.url}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Status:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {server.status.toUpperCase()}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Version:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {server.version}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Uptime:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {server.uptime.toFixed(2)}%
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                        Performance Metrics
                      </Typography>
                      
                      <Box sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption">CPU Usage</Typography>
                          <Typography variant="caption">{server.metrics.cpuUsage}%</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={server.metrics.cpuUsage}
                          sx={{
                            '& .MuiLinearProgress-bar': { backgroundColor: alpha('#fff', 0.8) },
                            backgroundColor: alpha('#fff', 0.2),
                          }}
                        />
                      </Box>
                      
                      <Box sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption">Memory Usage</Typography>
                          <Typography variant="caption">{server.metrics.memoryUsage}%</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={server.metrics.memoryUsage}
                          sx={{
                            '& .MuiLinearProgress-bar': { backgroundColor: alpha('#fff', 0.8) },
                            backgroundColor: alpha('#fff', 0.2),
                          }}
                        />
                      </Box>
                      
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption">Disk Usage</Typography>
                          <Typography variant="caption">{server.metrics.diskUsage}%</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={server.metrics.diskUsage}
                          sx={{
                            '& .MuiLinearProgress-bar': { backgroundColor: alpha('#fff', 0.8) },
                            backgroundColor: alpha('#fff', 0.2),
                          }}
                        />
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                        API Metrics
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption">Requests/sec:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {server.metrics.requestsPerSecond.toFixed(1)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption">Avg Response:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {server.metrics.averageResponseTime.toFixed(0)}ms
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="caption">Error Rate:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {server.metrics.errorRate.toFixed(2)}%
                        </Typography>
                      </Box>
                      
                      <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mb: 1 }}>
                        Last deployed: {format(server.deployment.lastDeployed, 'dd.MM.yyyy HH:mm', { locale: de })}
                      </Typography>
                      
                      <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>
                        Build: {server.deployment.buildNumber} ({server.deployment.gitCommit})
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => deployToServer(server.id)}
                      disabled={isDeploying}
                      sx={{
                        color: 'white',
                        borderColor: alpha('#fff', 0.5),
                        '&:hover': { borderColor: 'white', backgroundColor: alpha('#fff', 0.1) },
                      }}
                    >
                      Deploy
                    </Button>
                    
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{
                        color: 'white',
                        borderColor: alpha('#fff', 0.5),
                        '&:hover': { borderColor: 'white', backgroundColor: alpha('#fff', 0.1) },
                      }}
                    >
                      Logs
                    </Button>
                    
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{
                        color: 'white',
                        borderColor: alpha('#fff', 0.5),
                        '&:hover': { borderColor: 'white', backgroundColor: alpha('#fff', 0.1) },
                      }}
                    >
                      Monitor
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

  const renderMetricsTab = () => {
    const hourlyData = metrics.reduce((acc, metric) => {
      const hour = format(metric.timestamp, 'HH:00');
      const existing = acc.find(item => item.hour === hour);
      
      if (existing) {
        existing.requests += 1;
        existing.totalResponseTime += metric.responseTime;
        existing.errors += metric.statusCode >= 400 ? 1 : 0;
        existing.avgResponseTime = existing.totalResponseTime / existing.requests;
      } else {
        acc.push({
          hour,
          requests: 1,
          totalResponseTime: metric.responseTime,
          avgResponseTime: metric.responseTime,
          errors: metric.statusCode >= 400 ? 1 : 0,
        });
      }
      
      return acc;
    }, [] as Array<{ hour: string; requests: number; totalResponseTime: number; avgResponseTime: number; errors: number }>);

    return (
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
          API Metrics & Monitoring
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={1}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TimelineIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {metrics.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Requests
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
                  <SpeedIcon color="success" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {Math.round(metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length)}ms
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Response Time
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
                  <ErrorIcon color="error" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {((metrics.filter(m => m.statusCode >= 400).length / metrics.length) * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Error Rate
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
                  <NetworkIcon color="info" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {(metrics.reduce((sum, m) => sum + m.requestSize, 0) / 1024 / 1024).toFixed(1)}MB
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Data Transferred
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
                Hourly Request Volume
              </Typography>
              
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="requests"
                      stroke={theme.palette.primary.main}
                      fill={alpha(theme.palette.primary.main, 0.3)}
                      name="Requests"
                    />
                    <Area
                      type="monotone"
                      dataKey="errors"
                      stroke={theme.palette.error.main}
                      fill={alpha(theme.palette.error.main, 0.3)}
                      name="Errors"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Recent Errors
              </Typography>
              
              <List dense>
                {metrics.filter(m => m.statusCode >= 400).slice(0, 5).map((metric) => (
                  <ListItem key={metric.id}>
                    <ListItemIcon>
                      <ErrorIcon color="error" sx={{ fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${metric.method} ${metric.endpoint}`}
                      secondary={
                        <Box>
                          <Typography variant="caption">
                            Status: {metric.statusCode}
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block' }}>
                            {format(metric.timestamp, 'HH:mm:ss')}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
            
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Top Endpoints
              </Typography>
              
              <Box>
                {Object.entries(
                  metrics.reduce((acc, m) => {
                    acc[m.endpoint] = (acc[m.endpoint] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                )
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([endpoint, count]) => (
                    <Box key={endpoint} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {endpoint}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {count}
                      </Typography>
                    </Box>
                  ))}
              </Box>
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
              <RouterIcon color="primary" />
              REST API Implementation
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<MonitorIcon />}
              >
                Health Check
              </Button>
              
              <Button
                variant="contained"
                startIcon={<SettingsIcon />}
              >
                API Settings
              </Button>
            </Box>
          </Box>
          
          <Typography variant="body1" color="text.secondary">
            Comprehensive REST API implementation with middleware, monitoring, and deployment management
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
            <Tab label="Routes" icon={<RouterIcon />} />
            <Tab label="Middleware" icon={<SettingsIcon />} />
            <Tab label="Servers" icon={<CloudIcon />} />
            <Tab label="Metrics" icon={<AssessmentIcon />} />
          </Tabs>
        </Paper>
      </SlideInContainer>

      {/* Tab Content */}
      <SlideInContainer delay={400}>
        {selectedTab === 0 && renderRoutesTab()}
        {selectedTab === 1 && renderMiddlewareTab()}
        {selectedTab === 2 && renderServersTab()}
        {selectedTab === 3 && renderMetricsTab()}
      </SlideInContainer>
    </Box>
  );
};

export default RestApiImplementation;