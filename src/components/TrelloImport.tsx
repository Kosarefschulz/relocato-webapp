import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  LinearProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemText,
  Chip,
  Paper,
  IconButton,
  Collapse,
  CircularProgress
} from '@mui/material';
import {
  CloudDownload as ImportIcon,
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon
} from '@mui/icons-material';
import { TrelloImporter, getTrelloAuthUrl } from '../utils/trelloImport';

interface TrelloImportProps {
  open: boolean;
  onClose: () => void;
}

export const TrelloImport: React.FC<TrelloImportProps> = ({ open, onClose }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [apiKey, setApiKey] = useState('');
  const [token, setToken] = useState('');
  const [boardId, setBoardId] = useState('');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });
  const [results, setResults] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  // Check if we got a token from Trello callback
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('token=')) {
      const tokenMatch = hash.match(/token=([^&]+)/);
      if (tokenMatch) {
        setToken(tokenMatch[1]);
        setActiveStep(2);
        // Clear the hash
        window.location.hash = '';
      }
    }
  }, []);

  const handleAuthorize = () => {
    if (apiKey) {
      const authUrl = getTrelloAuthUrl(apiKey, 'Umzugs WebApp');
      window.location.href = authUrl;
    }
  };

  const handleImport = async () => {
    if (!apiKey || !token || !boardId) return;

    setImporting(true);
    setProgress({ current: 0, total: 0, message: 'Starte Import...' });

    try {
      const importer = new TrelloImporter(apiKey, token);
      const importResults = await importer.importBoard(
        boardId,
        (current, total, message) => {
          setProgress({ current, total, message });
        }
      );

      setResults(importResults);
      setActiveStep(3);
    } catch (error) {
      setResults({
        imported: 0,
        skipped: 0,
        errors: [`Import fehlgeschlagen: ${error}`]
      });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setApiKey('');
    setToken('');
    setBoardId('');
    setResults(null);
    setProgress({ current: 0, total: 0, message: '' });
    onClose();
  };

  const steps = ['API-Schlüssel', 'Autorisierung', 'Board auswählen', 'Import abgeschlossen'];

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Trello-Daten importieren</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 1: API Key */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="body1" gutterBottom>
              Um Daten aus Trello zu importieren, benötigen Sie einen API-Schlüssel:
            </Typography>
            <Box component="ol" sx={{ pl: 3, mb: 2 }}>
              <Typography component="li" variant="body2" gutterBottom>
                Gehen Sie zu <a href="https://trello.com/app-key" target="_blank" rel="noopener noreferrer">
                  https://trello.com/app-key
                </a>
              </Typography>
              <Typography component="li" variant="body2" gutterBottom>
                Melden Sie sich bei Trello an
              </Typography>
              <Typography component="li" variant="body2" gutterBottom>
                Kopieren Sie Ihren API-Schlüssel
              </Typography>
            </Box>
            <TextField
              fullWidth
              label="Trello API-Schlüssel"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Fügen Sie Ihren API-Schlüssel hier ein"
              sx={{ mt: 2 }}
            />
          </Box>
        )}

        {/* Step 2: Authorization */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="body1" gutterBottom>
              Sie benötigen einen Token für den API-Zugriff:
            </Typography>
            <Box component="ol" sx={{ pl: 3, mb: 2 }}>
              <Typography component="li" variant="body2" gutterBottom>
                Klicken Sie auf "Token generieren"
              </Typography>
              <Typography component="li" variant="body2" gutterBottom>
                Autorisieren Sie den Zugriff in Trello
              </Typography>
              <Typography component="li" variant="body2" gutterBottom>
                Kopieren Sie den generierten Token
              </Typography>
              <Typography component="li" variant="body2" gutterBottom>
                Fügen Sie ihn unten ein
              </Typography>
            </Box>
            <TextField
              fullWidth
              label="Trello Token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Fügen Sie Ihren Token hier ein"
              sx={{ mt: 2, mb: 2 }}
              multiline
              rows={2}
            />
            <Alert severity="info">
              Der Token wird sicher in Ihrem Browser gespeichert und nicht an Dritte weitergegeben.
            </Alert>
          </Box>
        )}

        {/* Step 3: Select Board */}
        {activeStep === 2 && (
          <Box>
            <Typography variant="body1" gutterBottom>
              Geben Sie die ID des Trello-Boards ein, aus dem Sie importieren möchten:
            </Typography>
            <Box component="ol" sx={{ pl: 3, mb: 2 }}>
              <Typography component="li" variant="body2" gutterBottom>
                Öffnen Sie Ihr Trello-Board
              </Typography>
              <Typography component="li" variant="body2" gutterBottom>
                Die Board-ID finden Sie in der URL: trello.com/b/<strong>[BOARD-ID]</strong>/board-name
              </Typography>
            </Box>
            <TextField
              fullWidth
              label="Trello Board-ID"
              value={boardId}
              onChange={(e) => setBoardId(e.target.value)}
              placeholder="z.B. abc123def"
              sx={{ mt: 2 }}
            />
            
            {importing && (
              <Box sx={{ mt: 3 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={progress.total > 0 ? (progress.current / progress.total) * 100 : 0}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {progress.message} ({progress.current}/{progress.total})
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Step 4: Results */}
        {activeStep === 3 && results && (
          <Box>
            <Paper sx={{ p: 3, mb: 2, bgcolor: 'success.light' }}>
              <Box display="flex" alignItems="center" gap={2}>
                <SuccessIcon color="success" />
                <Box>
                  <Typography variant="h6">Import abgeschlossen!</Typography>
                  <Typography variant="body2">
                    {results.imported} Kunden erfolgreich aktualisiert
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {results.skipped > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {results.skipped} Karten konnten keinem Kunden zugeordnet werden
              </Alert>
            )}

            {results.errors.length > 0 && (
              <Paper sx={{ p: 2, bgcolor: 'error.light' }}>
                <Box 
                  display="flex" 
                  alignItems="center" 
                  justifyContent="space-between"
                  onClick={() => setShowErrors(!showErrors)}
                  sx={{ cursor: 'pointer' }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <ErrorIcon color="error" />
                    <Typography>{results.errors.length} Fehler aufgetreten</Typography>
                  </Box>
                  <IconButton size="small">
                    {showErrors ? <CollapseIcon /> : <ExpandIcon />}
                  </IconButton>
                </Box>
                <Collapse in={showErrors}>
                  <List dense sx={{ mt: 1 }}>
                    {results.errors.map((error, index) => (
                      <ListItem key={index}>
                        <ListItemText 
                          primary={error}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </Paper>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          {activeStep === 3 ? 'Schließen' : 'Abbrechen'}
        </Button>
        
        {activeStep === 0 && (
          <Button
            variant="contained"
            onClick={() => setActiveStep(1)}
            disabled={!apiKey}
          >
            Weiter
          </Button>
        )}
        
        {activeStep === 1 && (
          <>
            <Button
              variant="outlined"
              onClick={() => window.open(`https://trello.com/1/authorize?expiration=1day&scope=read&response_type=token&key=${apiKey}`, '_blank')}
              disabled={!apiKey}
            >
              Token generieren
            </Button>
            <Button
              variant="contained"
              onClick={() => setActiveStep(2)}
              disabled={!token}
            >
              Weiter
            </Button>
          </>
        )}
        
        {activeStep === 2 && (
          <Button
            variant="contained"
            onClick={handleImport}
            disabled={!boardId || importing}
            startIcon={importing ? <CircularProgress size={20} /> : <ImportIcon />}
          >
            {importing ? 'Importiere...' : 'Import starten'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};