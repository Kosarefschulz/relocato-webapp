import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Button,
  Alert,
  LinearProgress,
  IconButton,
  Collapse,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
  Email as EmailIcon,
  Cloud as CloudIcon,
  Lock as LockIcon,
  Sync as SyncIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { healthCheckService, SystemHealth, HealthCheckResult } from '../services/healthCheckService';

const getServiceIcon = (serviceName: string) => {
  if (serviceName.includes('Database')) return <StorageIcon />;
  if (serviceName.includes('Auth')) return <LockIcon />;
  if (serviceName.includes('Email')) return <EmailIcon />;
  if (serviceName.includes('Storage')) return <CloudIcon />;
  if (serviceName.includes('Edge')) return <SpeedIcon />;
  if (serviceName.includes('Realtime')) return <SyncIcon />;
  return <CheckCircleIcon />;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'online': return 'success';
    case 'offline': return 'error';
    case 'error': return 'warning';
    default: return 'default';
  }
};

const getOverallIcon = (status: string) => {
  switch (status) {
    case 'healthy': return <CheckCircleIcon color="success" />;
    case 'degraded': return <WarningIcon color="warning" />;
    case 'offline': return <ErrorIcon color="error" />;
    default: return <ErrorIcon />;
  }
};

const SystemHealthMonitor: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [monitoring, setMonitoring] = useState(false);

  useEffect(() => {
    // Initial load
    loadHealth();

    // Subscribe to health updates
    const unsubscribe = healthCheckService.onHealthUpdate((newHealth) => {
      setHealth(newHealth);
    });

    // Check if monitoring is already active
    setMonitoring(healthCheckService.isMonitoring());

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (autoRefresh && !monitoring) {
      interval = setInterval(() => {
        runHealthCheck();
      }, refreshInterval * 60 * 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval, monitoring]);

  const loadHealth = async () => {
    const lastHealth = healthCheckService.getLastResults();
    if (lastHealth) {
      setHealth(lastHealth);
    } else {
      await runHealthCheck();
    }
  };

  const runHealthCheck = async () => {
    setLoading(true);
    try {
      const result = await healthCheckService.runHealthChecks();
      setHealth(result);
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (service: string) => {
    setExpanded(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const toggleMonitoring = () => {
    if (monitoring) {
      healthCheckService.stopMonitoring();
      setMonitoring(false);
    } else {
      healthCheckService.startMonitoring(refreshInterval);
      setMonitoring(true);
    }
  };

  const formatUptime = (minutes: number) => {
    if (minutes < 60) return `${minutes} Min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours < 24) return `${hours}h ${mins}m`;
    const days = Math.floor(hours / 24);
    const hrs = hours % 24;
    return `${days}d ${hrs}h`;
  };

  if (!health && !loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Button 
          variant="contained" 
          onClick={runHealthCheck}
          startIcon={<PlayIcon />}
        >
          System Health Check starten
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        System Health Monitor
      </Typography>

      {/* Overall Status */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {health && getOverallIcon(health.overall)}
            <Box>
              <Typography variant="h6">
                System Status: {health?.overall.toUpperCase()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Letzter Check: {health ? new Date(health.lastCheck).toLocaleString('de-DE') : '-'}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip 
                icon={<TrendingUpIcon />}
                label={`Uptime: ${health ? formatUptime(health.uptime) : '-'}`}
                color="primary"
              />
              
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Intervall</InputLabel>
                <Select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  label="Intervall"
                >
                  <MenuItem value={1}>1 Min</MenuItem>
                  <MenuItem value={5}>5 Min</MenuItem>
                  <MenuItem value={15}>15 Min</MenuItem>
                  <MenuItem value={30}>30 Min</MenuItem>
                  <MenuItem value={60}>60 Min</MenuItem>
                </Select>
              </FormControl>
              
              <Button
                variant={monitoring ? "contained" : "outlined"}
                onClick={toggleMonitoring}
                startIcon={monitoring ? <StopIcon /> : <PlayIcon />}
                color={monitoring ? "error" : "primary"}
              >
                {monitoring ? 'Stop' : 'Start'} Monitoring
              </Button>
              
              <IconButton 
                onClick={runHealthCheck} 
                disabled={loading}
                color="primary"
              >
                <RefreshIcon />
              </IconButton>
            </Box>
        </Box>

        {loading && <LinearProgress sx={{ mt: 2 }} />}
      </Paper>

      {/* Service Status */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {health?.services.map((service) => (
          <Box key={service.service} sx={{ flex: '1 1 45%', minWidth: '300px' }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <ListItem
                  onClick={() => toggleExpanded(service.service)}
                  sx={{ px: 0, cursor: 'pointer' }}
                >
                  <ListItemIcon>
                    {getServiceIcon(service.service)}
                  </ListItemIcon>
                  <ListItemText
                    primary={service.service}
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <Chip 
                          label={service.status.toUpperCase()} 
                          color={getStatusColor(service.status) as any}
                          size="small"
                        />
                        {service.responseTime && (
                          <Typography variant="caption" color="text.secondary">
                            {service.responseTime}ms
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <IconButton size="small">
                    {expanded.includes(service.service) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </ListItem>

                <Collapse in={expanded.includes(service.service)}>
                  <Box sx={{ mt: 2, pl: 7 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {service.message}
                    </Typography>
                    {service.details && (
                      <Alert severity="info" sx={{ mt: 1 }}>
                        <Typography variant="caption" component="pre">
                          {JSON.stringify(service.details, null, 2)}
                        </Typography>
                      </Alert>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      Geprüft: {new Date(service.timestamp).toLocaleTimeString('de-DE')}
                    </Typography>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Auto-refresh Info */}
      {monitoring && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <ScheduleIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
            Automatische Überwachung läuft (alle {refreshInterval} Minuten)
          </Typography>
        </Alert>
      )}

      {/* Instructions */}
      <Alert severity="success" sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          System-Überwachung eingerichtet:
        </Typography>
        <Typography variant="body2" component="div">
          • Automatische Checks aller Services<br />
          • E-Mail-Service (IONOS) Monitoring<br />
          • Datenbank & Storage Überwachung<br />
          • Realtime-Verbindungen Check<br />
          • Edge Functions Status
        </Typography>
      </Alert>
    </Box>
  );
};

export default SystemHealthMonitor;