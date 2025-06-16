import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  LinearProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress
} from '@mui/material';
import { useAnalytics } from '../hooks/useAnalytics';
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Email as EmailIcon,
  People as PeopleIcon
} from '@mui/icons-material';

const AdminImport: React.FC = () => {
  const analytics = useAnalytics();
  const [importing, setImporting] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [batchSize, setBatchSize] = useState(50);
  const [startFrom, setStartFrom] = useState(0);
  const [progress, setProgress] = useState(0);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const startImport = async () => {
    setImporting(true);
    setStats(null);
    setLogs([]);
    setProgress(0);

    try {
      addLog('🚀 Starte E-Mail-Import...');
      
      // Analytics: Import started
      analytics.trackImportStarted(batchSize);
      
      // Rufe die Import-Funktion auf
      const response = await fetch(
        `https://europe-west1-umzugsapp.cloudfunctions.net/checkEmails?folder=erfolgreich%20verarbeitete%20Anfragen&limit=${batchSize}&test=true&all=true`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();
      
      if (result.success) {
        addLog(`✅ ${result.processed} E-Mails verarbeitet`);
        setStats({
          total: result.processed,
          imported: result.processed,
          failed: 0
        });
        
        // Analytics: Import completed
        analytics.trackImportCompleted(result.processed);
      } else {
        addLog(`❌ Fehler: ${result.error || 'Unbekannter Fehler'}`);
      }
    } catch (error: any) {
      addLog(`❌ Fehler beim Import: ${error.message}`);
    } finally {
      setImporting(false);
      setProgress(100);
    }
  };

  const importBatch = async () => {
    setImporting(true);
    
    try {
      addLog(`📧 Importiere Batch: ${startFrom} - ${startFrom + batchSize}`);
      
      // Mehrere Batches nacheinander
      let totalImported = 0;
      const totalBatches = Math.ceil(1200 / batchSize);
      
      for (let i = 0; i < totalBatches; i++) {
        const currentStart = i * batchSize;
        setProgress((i / totalBatches) * 100);
        
        addLog(`📦 Batch ${i + 1}/${totalBatches}: Verarbeite E-Mails ${currentStart} - ${currentStart + batchSize}`);
        
        const response = await fetch(
          `https://europe-west1-umzugsapp.cloudfunctions.net/checkEmails?folder=erfolgreich%20verarbeitete%20Anfragen&limit=${batchSize}&test=true&all=true`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        const result = await response.json();
        
        if (result.success) {
          totalImported += result.processed;
          addLog(`✅ Batch ${i + 1}: ${result.processed} E-Mails importiert`);
        } else {
          addLog(`⚠️ Batch ${i + 1} fehlgeschlagen`);
        }
        
        // Kurze Pause zwischen Batches
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      setStats({
        total: 1200,
        imported: totalImported,
        failed: 1200 - totalImported
      });
      
      addLog(`🎉 Import abgeschlossen: ${totalImported} von 1200 E-Mails importiert`);
      
      // Analytics: Track completion
      analytics.trackImportCompleted(totalImported);
    } catch (error: any) {
      addLog(`❌ Kritischer Fehler: ${error.message}`);
    } finally {
      setImporting(false);
      setProgress(100);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          E-Mail Import Admin
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Importiere alle E-Mails aus dem "erfolgreich verarbeitete Anfragen" Ordner
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <EmailIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Import-Einstellungen
              </Typography>
              
              <Box sx={{ mt: 3 }}>
                <TextField
                  fullWidth
                  label="Batch-Größe"
                  type="number"
                  value={batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value) || 50)}
                  disabled={importing}
                  helperText="Anzahl E-Mails pro Batch"
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  fullWidth
                  label="Start-Index"
                  type="number"
                  value={startFrom}
                  onChange={(e) => setStartFrom(parseInt(e.target.value) || 0)}
                  disabled={importing}
                  helperText="Von welcher E-Mail-Nummer starten"
                  sx={{ mb: 3 }}
                />
                
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  startIcon={importing ? <CircularProgress size={20} /> : <UploadIcon />}
                  onClick={startImport}
                  disabled={importing}
                  sx={{ mb: 2 }}
                >
                  {importing ? 'Importiere...' : 'Single Batch importieren'}
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  startIcon={importing ? <CircularProgress size={20} /> : <PeopleIcon />}
                  onClick={importBatch}
                  disabled={importing}
                >
                  {importing ? 'Importiere alle 1200 Kunden...' : 'Alle 1200 Kunden importieren'}
                </Button>
              </Box>
              
              {importing && (
                <Box sx={{ mt: 3 }}>
                  <LinearProgress variant="determinate" value={progress} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {Math.round(progress)}% abgeschlossen
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          {stats && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Import-Statistik
                </Typography>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="h3" color="primary">
                        {stats.total}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Gesamt
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="h3" color="success.main">
                        {stats.imported}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Importiert
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="h3" color="error.main">
                        {stats.failed}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Fehlgeschlagen
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Import-Log
              </Typography>
              
              <Box
                sx={{
                  maxHeight: 300,
                  overflow: 'auto',
                  bgcolor: 'grey.100',
                  p: 2,
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.875rem'
                }}
              >
                {logs.length === 0 ? (
                  <Typography color="text.secondary">
                    Noch keine Logs...
                  </Typography>
                ) : (
                  logs.map((log, index) => (
                    <div key={index}>{log}</div>
                  ))
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Hinweis:</strong> Der Import kann mehrere Minuten dauern. 
          Die E-Mails werden in Batches verarbeitet, um Timeouts zu vermeiden.
          Bereits existierende Kunden werden übersprungen.
        </Typography>
      </Alert>
    </Box>
  );
};

export default AdminImport;