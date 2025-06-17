import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  LinearProgress,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Email as EmailIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  People as PeopleIcon,
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { databaseService } from '../config/database.config';
import { useNavigate } from 'react-router-dom';

interface ImportStats {
  totalEmails: number;
  processedEmails: number;
  newCustomers: number;
  duplicates: number;
  errors: number;
  skipped: number;
  emailsBySource: { [key: string]: number };
  startTime: Date;
  processingTime?: number;
}

interface ImportHistory {
  id: string;
  timestamp: Date;
  type: 'scheduled' | 'manual';
  stats: ImportStats;
}

const EmailImportMonitor: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [lastImport, setLastImport] = useState<Date | null>(null);
  const [nextImport, setNextImport] = useState<Date | null>(null);
  const [currentStats, setCurrentStats] = useState<ImportStats | null>(null);
  const [history, setHistory] = useState<ImportHistory[]>([]);
  const [error, setError] = useState('');
  const [failedCount, setFailedCount] = useState(0);

  useEffect(() => {
    loadImportData();
    const interval = setInterval(loadImportData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadImportData = async () => {
    try {
      // Load import metadata
      const metadata = await databaseService.getDocument('system', 'import_metadata');
      if (metadata?.lastImport) {
        setLastImport(metadata.lastImport.toDate());
        setCurrentStats(metadata.lastImportStats);
        
        // Calculate next import (every 2 hours)
        const next = new Date(metadata.lastImport.toDate());
        next.setHours(next.getHours() + 2);
        setNextImport(next);
      }

      // Load import history
      const historyData = await databaseService.getCollection('import_history');
      setHistory(historyData.slice(0, 10).map(h => ({
        ...h,
        timestamp: h.timestamp.toDate()
      })) as ImportHistory[]);

      // Count failed imports
      const failedImports = await databaseService.getCollection('failed_imports');
      const unresolvedCount = failedImports.filter(f => !f.resolved).length;
      setFailedCount(unresolvedCount);

    } catch (error) {
      console.error('Error loading import data:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerManualImport = async () => {
    setImporting(true);
    setError('');

    try {
      const response = await fetch(
        'https://europe-west1-umzugsapp.cloudfunctions.net/triggerCustomerImport',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();
      
      if (result.success) {
        await loadImportData(); // Refresh data
      } else {
        setError(result.error || 'Import fehlgeschlagen');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmailIcon fontSize="large" />
          E-Mail Import Monitor
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Daten aktualisieren">
            <IconButton onClick={loadImportData}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={importing ? <CircularProgress size={20} /> : <PlayIcon />}
            onClick={triggerManualImport}
            disabled={importing}
          >
            Jetzt importieren
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Status Cards */}
      <Grid container spacing={3}>
        {failedCount > 0 && (
          <Grid item xs={12}>
            <Card sx={{ bgcolor: 'warning.light', cursor: 'pointer' }} onClick={() => navigate('/failed-email-recovery')}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WarningIcon />
                      Fehlgeschlagene Imports
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {failedCount} E-Mails konnten nicht automatisch verarbeitet werden und benötigen manuelle Überprüfung.
                    </Typography>
                  </Box>
                  <Button variant="contained" color="warning">
                    Jetzt beheben →
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Status
                  </Typography>
                  <Chip
                    icon={<CheckIcon />}
                    label="Aktiv"
                    color="success"
                    size="small"
                  />
                </Box>
                <CheckIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Letzter Import
                  </Typography>
                  <Typography variant="body2">
                    {lastImport ? formatDistanceToNow(lastImport, { locale: de, addSuffix: true }) : 'Nie'}
                  </Typography>
                </Box>
                <ScheduleIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Nächster Import
                  </Typography>
                  <Typography variant="body2">
                    {nextImport && nextImport > new Date() 
                      ? formatDistanceToNow(nextImport, { locale: de, addSuffix: true })
                      : 'Jetzt'
                    }
                  </Typography>
                </Box>
                <ScheduleIcon sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Neue Kunden heute
                  </Typography>
                  <Typography variant="h4">
                    {currentStats?.newCustomers || 0}
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Current Stats */}
      {currentStats && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Letzte Import-Statistiken
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {currentStats.totalEmails}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  E-Mails verarbeitet
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main">
                  {currentStats.newCustomers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Neue Kunden
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="warning.main">
                  {currentStats.duplicates}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Duplikate
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="error.main">
                  {currentStats.errors}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Fehler
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          {failedCount > 0 && (
            <Alert 
              severity="warning" 
              sx={{ mt: 3 }}
              action={
                <Button 
                  color="inherit" 
                  size="small"
                  onClick={() => navigate('/failed-email-recovery')}
                >
                  Beheben
                </Button>
              }
            >
              <Typography variant="body2">
                {failedCount} E-Mails konnten nicht automatisch importiert werden und warten auf manuelle Überprüfung.
              </Typography>
            </Alert>
          )}

          {currentStats.emailsBySource && Object.keys(currentStats.emailsBySource).length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                E-Mails nach Quelle:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {Object.entries(currentStats.emailsBySource).map(([source, count]) => (
                  <Chip
                    key={source}
                    label={`${source}: ${count}`}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}
        </Paper>
      )}

      {/* Import History */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Import-Historie
        </Typography>
        
        <List>
          {history.map((item, index) => (
            <ListItem key={item.id} divider={index < history.length - 1}>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {item.stats.errors > 0 ? (
                      <ErrorIcon color="error" fontSize="small" />
                    ) : (
                      <CheckIcon color="success" fontSize="small" />
                    )}
                    <Typography variant="body1">
                      {format(item.timestamp, 'dd.MM.yyyy HH:mm', { locale: de })}
                    </Typography>
                    <Chip
                      label={item.type === 'scheduled' ? 'Automatisch' : 'Manuell'}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    {item.stats.newCustomers} neue Kunden, {item.stats.duplicates} Duplikate, {item.stats.errors} Fehler
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default EmailImportMonitor;