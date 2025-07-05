import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Dns as DnsIcon,
  Cable as ConnectionIcon,
  Lock as LoginIcon,
  Folder as FolderIcon,
  Inbox as InboxIcon
} from '@mui/icons-material';
import { supabase } from '../config/supabase';

const EmailDebug: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);

  const runDebugTests = async () => {
    setLoading(true);
    setDebugData(null);

    try {
      const { data, error } = await supabase.functions.invoke('email-debug', {
        body: {}
      });

      if (error) throw error;

      setDebugData(data);
    } catch (error: any) {
      setDebugData({
        error: error.message,
        summary: {
          overallStatus: 'Failed to run debug tests'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const getTestIcon = (testName: string) => {
    switch (testName) {
      case 'DNS Resolution':
        return <DnsIcon />;
      case 'TCP/TLS Connection':
        return <ConnectionIcon />;
      case 'IMAP Login':
        return <LoginIcon />;
      case 'List Folders':
        return <FolderIcon />;
      case 'INBOX Status':
        return <InboxIcon />;
      default:
        return <CheckIcon />;
    }
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'success' : 'error';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        E-Mail System Debug
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Diese Seite testet die IMAP-Verbindung zu IONOS und zeigt detaillierte Fehlerinformationen an.
      </Alert>

      <Button
        variant="contained"
        size="large"
        onClick={runDebugTests}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : <PlayIcon />}
      >
        {loading ? 'Tests laufen...' : 'Debug-Tests starten'}
      </Button>

      {debugData && (
        <Box sx={{ mt: 3 }}>
          {/* Summary */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Zusammenfassung
            </Typography>
            
            {debugData.summary && (
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <Chip 
                  label={`${debugData.summary.successful} erfolgreich`}
                  color="success"
                  variant="outlined"
                />
                <Chip 
                  label={`${debugData.summary.failed} fehlgeschlagen`}
                  color="error"
                  variant="outlined"
                />
                <Chip 
                  label={debugData.summary.overallStatus}
                  color={debugData.summary.failed === 0 ? 'success' : 'error'}
                />
              </Box>
            )}

            {debugData.credentials && (
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Konfiguration
                  </Typography>
                  <Typography variant="body2">
                    E-Mail: {debugData.credentials.email}
                  </Typography>
                  <Typography variant="body2">
                    Server: {debugData.credentials.host}:{debugData.credentials.port}
                  </Typography>
                  <Typography variant="body2">
                    Passwort: {debugData.credentials.hasPassword ? '✓ Gesetzt' : '✗ Fehlt'}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Paper>

          {/* Test Results */}
          {debugData.tests && debugData.tests.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Test-Ergebnisse
              </Typography>
              
              {debugData.tests.map((test: any, index: number) => (
                <Accordion key={index} defaultExpanded={!test.success}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <ListItemIcon>
                        {test.success ? (
                          <CheckIcon color="success" />
                        ) : (
                          <ErrorIcon color="error" />
                        )}
                      </ListItemIcon>
                      {getTestIcon(test.test)}
                      <Typography sx={{ flexGrow: 1 }}>
                        {test.test}
                      </Typography>
                      {test.duration && (
                        <Chip 
                          label={`${test.duration}ms`} 
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {test.message && (
                      <Alert severity={test.success ? 'success' : 'error'} sx={{ mb: 2 }}>
                        {test.message}
                      </Alert>
                    )}
                    
                    {test.error && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Fehler:
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {test.error}
                        </Typography>
                      </Alert>
                    )}
                    
                    {test.details && (
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        {test.details}
                      </Alert>
                    )}
                    
                    {test.greeting && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Server-Begrüßung:
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1 }}>
                          {test.greeting}
                        </Typography>
                      </Box>
                    )}
                    
                    {test.response && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Server-Antwort:
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, whiteSpace: 'pre-wrap' }}>
                          {test.response}
                        </Typography>
                      </Box>
                    )}
                    
                    {test.folders && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Gefundene Ordner:
                        </Typography>
                        <List dense>
                          {test.folders.map((folder: string, idx: number) => (
                            <ListItem key={idx}>
                              <ListItemIcon>
                                <FolderIcon />
                              </ListItemIcon>
                              <ListItemText primary={folder} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                    
                    {test.messageCount !== undefined && (
                      <Alert severity="info">
                        {test.messageCount} E-Mails im Posteingang
                      </Alert>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Paper>
          )}

          {debugData.error && (
            <Alert severity="error" sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Kritischer Fehler:
              </Typography>
              <Typography variant="body2">
                {debugData.error}
              </Typography>
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
};

export default EmailDebug;