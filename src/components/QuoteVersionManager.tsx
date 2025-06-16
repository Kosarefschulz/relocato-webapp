import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Card,
  CardContent,
  IconButton,
  TextField,
  Alert,
  Tooltip,
  Divider,
  Stack,
  Grid
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab';
import {
  History as HistoryIcon,
  Add as AddIcon,
  CompareArrows as CompareIcon,
  Delete as DeleteIcon,
  CheckCircle as ActiveIcon,
  Edit as EditIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { Quote } from '../types';
import { quoteHistoryService } from '../services/quoteHistoryService';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface QuoteVersionManagerProps {
  open: boolean;
  onClose: () => void;
  quote: Quote;
  onVersionChange?: (newVersion: Quote) => void;
}

const QuoteVersionManager: React.FC<QuoteVersionManagerProps> = ({
  open,
  onClose,
  quote,
  onVersionChange
}) => {
  const [versions, setVersions] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [changeDescription, setChangeDescription] = useState('');
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<any>(null);

  useEffect(() => {
    if (open) {
      loadVersions();
    }
  }, [open, quote.id]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const versionList = await quoteHistoryService.getQuoteVersions(quote.id);
      setVersions(versionList);
    } catch (error) {
      console.error('Fehler beim Laden der Versionen:', error);
      setError('Versionen konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVersion = async () => {
    try {
      setError('');
      const newVersion = await quoteHistoryService.createNewVersion(
        quote,
        {},
        changeDescription
      );
      
      if (onVersionChange) {
        onVersionChange(newVersion);
      }
      
      setShowCreateDialog(false);
      setChangeDescription('');
      await loadVersions();
    } catch (error: any) {
      setError(error.message || 'Fehler beim Erstellen der Version');
    }
  };

  const handleSetActive = async (versionId: string) => {
    try {
      setError('');
      await quoteHistoryService.setActiveVersion(versionId);
      await loadVersions();
      
      // Aktive Version laden und an Parent übergeben
      const activeVersion = versions.find(v => v.id === versionId);
      if (activeVersion && onVersionChange) {
        onVersionChange(activeVersion);
      }
    } catch (error: any) {
      setError(error.message || 'Fehler beim Aktivieren der Version');
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (!window.confirm('Möchten Sie diese Version wirklich löschen?')) {
      return;
    }
    
    try {
      setError('');
      await quoteHistoryService.deleteVersion(versionId);
      await loadVersions();
    } catch (error: any) {
      setError(error.message || 'Version konnte nicht gelöscht werden');
    }
  };

  const handleCompareVersions = async () => {
    if (selectedVersions.length !== 2) {
      setError('Bitte wählen Sie genau 2 Versionen zum Vergleichen aus');
      return;
    }
    
    try {
      const result = await quoteHistoryService.compareVersions(
        selectedVersions[0],
        selectedVersions[1]
      );
      setComparisonResult(result);
      setShowCompareDialog(true);
    } catch (error: any) {
      setError('Fehler beim Vergleichen der Versionen');
    }
  };

  const toggleVersionSelection = (versionId: string) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId);
      }
      if (prev.length >= 2) {
        return [prev[1], versionId];
      }
      return [...prev, versionId];
    });
  };

  const getStatusColor = (status: Quote['status']) => {
    const colors = {
      draft: 'default',
      sent: 'primary',
      accepted: 'success',
      rejected: 'error',
      invoiced: 'secondary'
    };
    return colors[status] as any;
  };

  const getStatusLabel = (status: Quote['status']) => {
    const labels = {
      draft: 'Entwurf',
      sent: 'Versendet',
      accepted: 'Angenommen',
      rejected: 'Abgelehnt',
      invoiced: 'Berechnet'
    };
    return labels[status];
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <HistoryIcon />
              <Typography variant="h6">Versions-Historie</Typography>
            </Box>
            <Box>
              <Tooltip title="Neue Version erstellen">
                <IconButton onClick={() => setShowCreateDialog(true)} color="primary">
                  <AddIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Versionen vergleichen">
                <IconButton 
                  onClick={handleCompareVersions} 
                  disabled={selectedVersions.length !== 2}
                  color="primary"
                >
                  <CompareIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          
          <Timeline position="alternate">
            {versions.map((version, index) => (
              <TimelineItem key={version.id}>
                <TimelineOppositeContent sx={{ m: 'auto 0' }}>
                  <Typography variant="caption" color="text.secondary">
                    Version {version.version || 1}
                  </Typography>
                  <Typography variant="body2">
                    {format(new Date(version.createdAt), 'dd.MM.yyyy HH:mm', { locale: de })}
                  </Typography>
                </TimelineOppositeContent>
                
                <TimelineSeparator>
                  <TimelineConnector sx={{ bgcolor: version.isLatestVersion ? 'primary.main' : 'grey.300' }} />
                  <TimelineDot color={version.isLatestVersion ? 'primary' : 'grey'}>
                    {version.isLatestVersion && <ActiveIcon />}
                  </TimelineDot>
                  <TimelineConnector sx={{ bgcolor: index === versions.length - 1 ? 'transparent' : 'grey.300' }} />
                </TimelineSeparator>
                
                <TimelineContent sx={{ py: '12px', px: 2 }}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      cursor: 'pointer',
                      border: selectedVersions.includes(version.id) ? '2px solid' : '1px solid',
                      borderColor: selectedVersions.includes(version.id) ? 'primary.main' : 'divider',
                      bgcolor: version.isLatestVersion ? 'primary.light' : 'background.paper',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => toggleVersionSelection(version.id)}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="start">
                        <Box>
                          <Typography variant="h6">
                            {version.price.toFixed(2)} €
                          </Typography>
                          <Chip 
                            label={getStatusLabel(version.status)} 
                            color={getStatusColor(version.status)}
                            size="small"
                            sx={{ mt: 1 }}
                          />
                          {version.comment && (
                            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                              {version.comment}
                            </Typography>
                          )}
                        </Box>
                        
                        <Box>
                          {!version.isLatestVersion && (
                            <Tooltip title="Als aktiv setzen">
                              <IconButton 
                                size="small" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetActive(version.id);
                                }}
                              >
                                <CheckCircle />
                              </IconButton>
                            </Tooltip>
                          )}
                          {version.parentQuoteId && (
                            <Tooltip title="Version löschen">
                              <IconButton 
                                size="small" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteVersion(version.id);
                                }}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </Box>
                      
                      <Typography variant="caption" color="text.secondary">
                        Erstellt von: {version.createdBy}
                      </Typography>
                    </CardContent>
                  </Card>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose}>Schließen</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog für neue Version */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Neue Version erstellen</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Änderungsbeschreibung (optional)"
            value={changeDescription}
            onChange={(e) => setChangeDescription(e.target.value)}
            placeholder="Beschreiben Sie die Änderungen in dieser Version..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Abbrechen</Button>
          <Button onClick={handleCreateVersion} variant="contained">
            Version erstellen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Vergleichs-Dialog */}
      <Dialog open={showCompareDialog} onClose={() => setShowCompareDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Versionen vergleichen</DialogTitle>
        <DialogContent>
          {comparisonResult && (
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <Typography variant="h6" gutterBottom>
                  Version {comparisonResult.quote1?.version || 1}
                </Typography>
                <Card variant="outlined">
                  <CardContent>
                    <Stack spacing={1}>
                      <Typography>
                        <strong>Preis:</strong> {comparisonResult.quote1?.price.toFixed(2)} €
                      </Typography>
                      <Typography>
                        <strong>Status:</strong> {getStatusLabel(comparisonResult.quote1?.status)}
                      </Typography>
                      <Typography>
                        <strong>Erstellt:</strong> {format(new Date(comparisonResult.quote1?.createdAt), 'dd.MM.yyyy')}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="h6" gutterBottom>
                  Version {comparisonResult.quote2?.version || 1}
                </Typography>
                <Card variant="outlined">
                  <CardContent>
                    <Stack spacing={1}>
                      <Typography>
                        <strong>Preis:</strong> {comparisonResult.quote2?.price.toFixed(2)} €
                      </Typography>
                      <Typography>
                        <strong>Status:</strong> {getStatusLabel(comparisonResult.quote2?.status)}
                      </Typography>
                      <Typography>
                        <strong>Erstellt:</strong> {format(new Date(comparisonResult.quote2?.createdAt), 'dd.MM.yyyy')}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              
              {comparisonResult.differences.length > 0 && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>Unterschiede</Typography>
                  <Stack spacing={1}>
                    {comparisonResult.differences.map((diff: any, index: number) => (
                      <Alert severity="info" key={index}>
                        <strong>{diff.field}:</strong> {diff.oldValue} → {diff.newValue}
                      </Alert>
                    ))}
                  </Stack>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCompareDialog(false)}>Schließen</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default QuoteVersionManager;