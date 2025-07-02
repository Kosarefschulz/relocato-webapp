import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Snackbar,
  Stack
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  ContentCopy as CopyIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { firebaseService } from '../services/firebaseService';
import { databaseService as googleSheetsService } from '../config/database.config';
import { prepareArbeitsscheinData, generateArbeitsscheinHTML } from '../services/arbeitsscheinService';
import { Customer, Quote } from '../types';

interface DispositionLinkButtonProps {
  customer: Customer;
  quote?: Quote;
}

const DispositionLinkButton: React.FC<DispositionLinkButtonProps> = ({ customer, quote: propQuote }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState('');
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  const handleCreateLink = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let quoteToUse = propQuote || selectedQuote;
      
      // If no quote is provided, find the latest accepted/confirmed quote for this customer
      if (!quoteToUse) {
        const quotes = await googleSheetsService.getQuotes();
        const customerQuotes = quotes.filter((q: Quote) => 
          (q.customerId === customer.id || q.customerId === customer.customerNumber) &&
          (q.status === 'accepted' || q.status === 'confirmed')
        );
        
        if (customerQuotes.length === 0) {
          setError('Keine bestätigten Angebote für diesen Kunden gefunden');
          setLoading(false);
          return;
        }
        
        // Get the latest quote
        quoteToUse = customerQuotes.sort((a: Quote, b: Quote) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
      }
      
      // Generate Arbeitsschein
      const arbeitsscheinData = prepareArbeitsscheinData(quoteToUse, customer);
      const arbeitsscheinHTML = generateArbeitsscheinHTML(arbeitsscheinData);
      
      // Create share link in Firebase with Arbeitsschein
      const shareLink = await firebaseService.createShareLink(
        customer.id,
        quoteToUse.id,
        'disposition-link',
        {
          arbeitsscheinHTML,
          arbeitsscheinData: JSON.stringify(arbeitsscheinData)
        }
      );
      
      // Generate URL
      const baseUrl = window.location.origin;
      const generatedLink = `${baseUrl}/share/${shareLink.token}`;
      setLink(generatedLink);
    } catch (error) {
      console.error('Fehler beim Generieren des Links:', error);
      setError('Fehler beim Generieren des Links');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setShowCopySuccess(true);
    } catch (error) {
      console.error('Fehler beim Kopieren:', error);
    }
  };

  return (
    <>
      <Tooltip title="Arbeitsschein-Link für Mitarbeiter erstellen">
        <Button
          variant="outlined"
          startIcon={<AssignmentIcon />}
          onClick={() => setOpen(true)}
          color="primary"
          sx={{ ml: 1 }}
        >
          Arbeitsschein-Link
        </Button>
      </Tooltip>

      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              Mitarbeiter-Link mit Arbeitsschein
            </Typography>
            <IconButton onClick={() => setOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Dieser Link ermöglicht Mitarbeitern den Zugriff auf Kundendaten und einen Arbeitsschein.
            Der Link ist 7 Tage gültig.
          </Alert>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!link ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <AssignmentIcon />}
                onClick={handleCreateLink}
                disabled={loading}
                size="large"
              >
                {loading ? 'Link wird generiert...' : 'Link generieren'}
              </Button>
            </Box>
          ) : (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                ✅ Link erfolgreich erstellt:
              </Typography>
              <TextField
                fullWidth
                value={link}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <IconButton onClick={handleCopyLink}>
                      <CopyIcon />
                    </IconButton>
                  )
                }}
                sx={{ mb: 2 }}
              />
              <Alert severity="success">
                Der Link enthält einen vollständigen Arbeitsschein, der vom Mitarbeiter angezeigt und als PDF heruntergeladen werden kann.
              </Alert>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Schließen</Button>
          {link && (
            <Button
              variant="contained"
              startIcon={<CopyIcon />}
              onClick={handleCopyLink}
            >
              Link kopieren
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={showCopySuccess}
        autoHideDuration={3000}
        onClose={() => setShowCopySuccess(false)}
        message="Link in Zwischenablage kopiert"
      />
    </>
  );
};

export default DispositionLinkButton;