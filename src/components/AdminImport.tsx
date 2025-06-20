import React, { useState } from 'react';
import { Box, Paper, Typography, Button, TextField, LinearProgress, Alert, Card, CardContent, Chip, List, ListItem, ListItemText, Divider, CircularProgress, Tabs, Tab } from '@mui/material';
import Grid from './GridCompat';
import { useAnalytics } from '../hooks/useAnalytics';
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Email as EmailIcon,
  People as PeopleIcon,
  Preview as PreviewIcon,
  ImportExport as ImportIcon
} from '@mui/icons-material';
import EmailImportPreview from './EmailImportPreview';
import TabPanel from './TabPanel';

const AdminImport: React.FC = () => {
  const analytics = useAnalytics();
  const [importing, setImporting] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [batchSize, setBatchSize] = useState(50);
  const [startFrom, setStartFrom] = useState(0);
  const [progress, setProgress] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const startImport = async () => {
    setImporting(true);
    setStats(null);
    setLogs([]);
    setProgress(0);

    try {
      addLog('🚀 Starte E-Mail-Import (ALLE E-Mails)...');
      
      // Analytics: Import started
      analytics.trackImportStarted(batchSize);
      
      // Verwende neue Import-Funktion die ALLE E-Mails importiert
      const response = await fetch('/api/import-all-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          skipDuplicates: true, // Überspringe Duplikate
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined
        })
      });

      const result = await response.json();
      
      if (result.success) {
        addLog(`✅ Import abgeschlossen:`);
        addLog(`   - ${result.totalEmails || 0} E-Mails gefunden`);
        addLog(`   - ${result.newCustomers || 0} neue Kunden importiert`);
        addLog(`   - ${result.duplicates || 0} Duplikate übersprungen`);
        addLog(`   - ${result.errors || 0} Fehler`);
        
        setStats({
          total: result.totalEmails || 0,
          imported: result.newCustomers || 0,
          failed: result.errors || 0,
          skipped: result.duplicates || 0
        });
        
        // Analytics: Import completed
        analytics.trackImportCompleted(result.newCustomers || 0);
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
      addLog(`📧 Importiere alle E-Mails mit der importAllEmails Funktion...`);
      
      // Mehrere Batches nacheinander mit der richtigen Import-Funktion
      let totalImported = 0;
      const totalBatches = Math.ceil(1200 / batchSize);
      
      for (let i = 0; i < totalBatches; i++) {
        const currentStart = i * batchSize;
        setProgress((i / totalBatches) * 100);
        
        addLog(`📦 Batch ${i + 1}/${totalBatches}: Verarbeite E-Mails ${currentStart} - ${currentStart + batchSize}`);
        
        // Verwende importAllEmails statt checkEmails für korrektes Batch-Handling
        const response = await fetch(
          `https://europe-west1-umzugsapp.cloudfunctions.net/importAllEmails?batchSize=${batchSize}&startFrom=${currentStart}&skipExisting=true`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        const result = await response.json();
        
        if (result.success) {
          totalImported += result.imported || 0;
          addLog(`✅ Batch ${i + 1}: ${result.imported} neue Kunden importiert, ${result.skipped} übersprungen`);
          
          // Wenn keine neuen E-Mails mehr gefunden werden, beende den Import
          if (result.imported === 0 && result.skipped === 0) {
            addLog(`ℹ️ Keine weiteren E-Mails gefunden. Import beendet.`);
            break;
          }
        } else {
          addLog(`⚠️ Batch ${i + 1} fehlgeschlagen: ${result.error}`);
        }
        
        // Kurze Pause zwischen Batches
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      setStats({
        total: totalImported,
        imported: totalImported,
        failed: 0
      });
      
      addLog(`🎉 Import abgeschlossen: ${totalImported} Kunden importiert`);
      
      // Analytics: Track completion
      analytics.trackImportCompleted(totalImported);
    } catch (error: any) {
      addLog(`❌ Kritischer Fehler: ${error.message}`);
    } finally {
      setImporting(false);
      setProgress(100);
    }
  };

  const importAllIncludingDuplicates = async () => {
    setImporting(true);
    setStats(null);
    setLogs([]);
    setProgress(0);
    
    addLog('🚀 Starte Import ALLER E-Mails inklusive Duplikate...');
    addLog('⚠️  Duplikate erhalten eindeutige Kundennummern');
    
    try {
      const response = await fetch(
        'https://europe-west1-umzugsapp.cloudfunctions.net/importAllCustomers',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      const result = await response.json();
      
      if (result.success) {
        addLog(`✅ Import abgeschlossen!`);
        addLog(`📊 Statistik:`);
        addLog(`   - ${result.stats.totalEmails} E-Mails verarbeitet`);
        addLog(`   - ${result.stats.imported} neue Kunden importiert`);
        addLog(`   - ${result.stats.duplicatesImported} Duplikate als neue Kunden importiert`);
        addLog(`   - ${result.stats.failed} fehlgeschlagen`);
        
        if (result.stats.duplicatesImported > 0) {
          addLog(`\n⚠️  ${result.stats.duplicatesImported} Duplikate wurden mit eindeutigen Kundennummern importiert.`);
          addLog(`Diese können Sie manuell überprüfen und ggf. löschen.`);
        }
        
        setStats({
          total: result.stats.totalEmails,
          imported: result.stats.imported + result.stats.duplicatesImported,
          failed: result.stats.failed,
          skipped: 0
        });
        
        // Analytics: Import completed
        analytics.trackImportCompleted(result.stats.imported + result.stats.duplicatesImported);
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

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          E-Mail Import Admin
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Importiere und verwalte E-Mails aus dem IONOS E-Mail-Konto
        </Typography>
        
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mt: 3 }}>
          <Tab 
            label="E-Mail Vorschau" 
            icon={<PreviewIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Batch Import" 
            icon={<ImportIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <EmailImportPreview 
          onImportComplete={(imported) => {
            addLog(`✅ ${imported} E-Mails über Vorschau importiert`);
          }}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
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
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  fullWidth
                  label="Von Datum"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  disabled={importing}
                  InputLabelProps={{ shrink: true }}
                  helperText="Nur E-Mails ab diesem Datum"
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  fullWidth
                  label="Bis Datum"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  disabled={importing}
                  InputLabelProps={{ shrink: true }}
                  helperText="Nur E-Mails bis zu diesem Datum"
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
                  sx={{ mb: 2 }}
                >
                  {importing ? 'Importiere alle 1200 Kunden...' : 'Alle 1200 Kunden importieren'}
                </Button>
                
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  fullWidth
                  startIcon={importing ? <CircularProgress size={20} /> : <PeopleIcon />}
                  onClick={importAllIncludingDuplicates}
                  disabled={importing}
                >
                  {importing ? 'Importiere ALLE...' : 'ALLE Kunden + Duplikate importieren'}
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
                  <Grid item xs={3}>
                    <Box textAlign="center">
                      <Typography variant="h3" color="primary">
                        {stats.total}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        E-Mails
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box textAlign="center">
                      <Typography variant="h3" color="success.main">
                        {stats.imported}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Neue Kunden
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box textAlign="center">
                      <Typography variant="h3" color="warning.main">
                        {stats.skipped || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Duplikate
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box textAlign="center">
                      <Typography variant="h3" color="error.main">
                        {stats.failed}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Fehler
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                {stats.skipped > 0 && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.50', borderRadius: 1 }}>
                    <Typography variant="body2" color="warning.dark">
                      <strong>{stats.skipped} E-Mails</strong> wurden übersprungen, da die Kunden bereits existieren.
                      Dies verhindert doppelte Kundeneinträge bei mehrfachen Anfragen.
                    </Typography>
                  </Box>
                )}
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
      </TabPanel>
    </Box>
  );
};

export default AdminImport;