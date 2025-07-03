import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  IconButton,
  Switch,
  FormControlLabel,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Alert
} from '@mui/material';
import Grid from './GridCompat';
import {
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  NotificationsActive as NotificationsIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { OnlineUsers } from './OnlineUsers';
import { queueService } from '../services/queueService';
import { realtimeService } from '../services/realtimeService';

interface JobStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  byType: Record<string, number>;
}

export const RealtimeDashboard: React.FC = () => {
  const [jobStats, setJobStats] = useState<JobStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showOnlineUsers, setShowOnlineUsers] = useState(
    localStorage.getItem('showOnlineUsers') === 'true'
  );
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'disconnected'>('disconnected');

  // Load job statistics
  const loadJobStats = async () => {
    try {
      const stats = await queueService.getJobStats();
      setJobStats(stats);
    } catch (error) {
      console.error('Error loading job stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check realtime connection status
  const checkRealtimeStatus = () => {
    // In real implementation, this would check the actual connection
    setRealtimeStatus('connected');
  };

  useEffect(() => {
    loadJobStats();
    checkRealtimeStatus();

    // Auto refresh every 5 seconds
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadJobStats();
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const handleShowOnlineUsersChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked;
    setShowOnlineUsers(newValue);
    localStorage.setItem('showOnlineUsers', newValue.toString());
    // Trigger a custom event to update App.tsx
    window.dispatchEvent(new CustomEvent('showOnlineUsersChanged', { detail: newValue }));
  };

  const processJobs = async () => {
    try {
      // In real implementation, this would trigger job processing
      console.log('Triggering job processing...');
      await loadJobStats();
    } catch (error) {
      console.error('Error processing jobs:', error);
    }
  };

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Real-time Dashboard
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Dieses Dashboard zeigt den Status der Real-time Features und Background Jobs.
      </Alert>

      <Grid container spacing={3}>
        {/* Real-time Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SpeedIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Real-time Status</Typography>
              </Box>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <NotificationsIcon color={realtimeStatus === 'connected' ? 'success' : 'error'} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="WebSocket Verbindung"
                    secondary={realtimeStatus === 'connected' ? 'Verbunden' : 'Getrennt'}
                  />
                  <Chip 
                    label={realtimeStatus === 'connected' ? 'Online' : 'Offline'}
                    color={realtimeStatus === 'connected' ? 'success' : 'error'}
                    size="small"
                  />
                </ListItem>
                
                <Divider />
                
                <ListItem>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showOnlineUsers}
                        onChange={handleShowOnlineUsersChange}
                      />
                    }
                    label="Online Nutzer anzeigen"
                  />
                </ListItem>
                
                <ListItem>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={autoRefresh}
                        onChange={(e) => setAutoRefresh(e.target.checked)}
                      />
                    }
                    label="Auto-Refresh (5s)"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Job Queue Statistics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ScheduleIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">Job Queue</Typography>
                </Box>
                <Box>
                  <IconButton onClick={loadJobStats} size="small">
                    <RefreshIcon />
                  </IconButton>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={processJobs}
                    sx={{ ml: 1 }}
                  >
                    Jobs verarbeiten
                  </Button>
                </Box>
              </Box>

              {jobStats && (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light' }}>
                      <Typography variant="h4">{jobStats.total}</Typography>
                      <Typography variant="caption">Gesamt (24h)</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
                      <Typography variant="h4">{jobStats.pending}</Typography>
                      <Typography variant="caption">Ausstehend</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light' }}>
                      <Typography variant="h4">{jobStats.processing}</Typography>
                      <Typography variant="caption">In Bearbeitung</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
                      <Typography variant="h4">{jobStats.completed}</Typography>
                      <Typography variant="caption">Abgeschlossen</Typography>
                    </Paper>
                  </Grid>
                  {jobStats.failed > 0 && (
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light' }}>
                        <Typography variant="h4">{jobStats.failed}</Typography>
                        <Typography variant="caption">Fehlgeschlagen</Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              )}

              {jobStats && Object.keys(jobStats.byType).length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Job Typen:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {Object.entries(jobStats.byType).map(([type, count]) => (
                      <Chip
                        key={type}
                        label={`${type}: ${count}`}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Online Users Preview */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Online Nutzer</Typography>
              </Box>
              <OnlineUsers />
            </CardContent>
          </Card>
        </Grid>

        {/* Supabase Extensions Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StorageIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Supabase Extensions</Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>pgvector</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Vektor-Embeddings für KI-gestützte Suche
                    </Typography>
                    <Chip label="Bereit zur Aktivierung" color="warning" size="small" sx={{ mt: 1 }} />
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>pg_cron</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Automatisierte Aufgaben und Zeitpläne
                    </Typography>
                    <Chip label="Bereit zur Aktivierung" color="warning" size="small" sx={{ mt: 1 }} />
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>PostGIS</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Geo-Location und Kartenfeatures
                    </Typography>
                    <Chip label="Bereit zur Aktivierung" color="warning" size="small" sx={{ mt: 1 }} />
                  </Paper>
                </Grid>
              </Grid>

              <Alert severity="info" sx={{ mt: 2 }}>
                Diese Extensions müssen im Supabase Dashboard aktiviert werden, um die erweiterten Features zu nutzen.
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RealtimeDashboard;