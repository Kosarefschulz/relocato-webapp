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
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Snackbar
} from '@mui/material';
import {
  Share as ShareIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  AccessTime as AccessTimeIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { shareTokenService, ShareToken } from '../services/shareTokenService';
import { Customer } from '../types';

interface ShareCustomerButtonProps {
  customer: Customer;
  currentUser?: string;
}

const ShareCustomerButton: React.FC<ShareCustomerButtonProps> = ({ customer, currentUser = 'Admin' }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<ShareToken[]>([]);
  const [newTokenUrl, setNewTokenUrl] = useState('');
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  useEffect(() => {
    if (open) {
      loadTokens();
    }
  }, [open, customer.id]);

  const loadTokens = async () => {
    setLoading(true);
    try {
      const customerTokens = await shareTokenService.getCustomerTokens(customer.id);
      setTokens(customerTokens);
    } catch (error) {
      console.error('Fehler beim Laden der Tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateToken = async () => {
    setLoading(true);
    try {
      const token = await shareTokenService.createShareToken(
        customer.id,
        customer.name,
        currentUser
      );
      
      const url = shareTokenService.generateShareUrl(token.id);
      setNewTokenUrl(url);
      
      // Tokens neu laden
      await loadTokens();
    } catch (error) {
      console.error('Fehler beim Erstellen des Tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setShowCopySuccess(true);
    } catch (error) {
      console.error('Fehler beim Kopieren:', error);
    }
  };

  const handleDeleteToken = async (tokenId: string) => {
    if (window.confirm('Möchten Sie diesen Zugangslink wirklich löschen?')) {
      setLoading(true);
      try {
        await shareTokenService.deleteToken(tokenId);
        await loadTokens();
      } catch (error) {
        console.error('Fehler beim Löschen des Tokens:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getDaysRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <>
      <Tooltip title="Temporären Zugangslink erstellen">
        <Button
          variant="outlined"
          startIcon={<ShareIcon />}
          onClick={() => setOpen(true)}
          sx={{ ml: 1 }}
        >
          Teilen
        </Button>
      </Tooltip>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Kundendaten teilen
          <Typography variant="body2" color="text.secondary">
            Erstellen Sie einen temporären Link für Mitarbeiter (7 Tage gültig)
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Mitarbeiter können mit dem Link alle Kundendaten <strong>außer Angebote</strong> einsehen.
            Der Link ist 7 Tage gültig und kann jederzeit widerrufen werden.
          </Alert>

          {newTokenUrl && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                ✅ Neuer Zugangslink erstellt:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  fullWidth
                  value={newTokenUrl}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <IconButton onClick={() => handleCopyUrl(newTokenUrl)}>
                        <CopyIcon />
                      </IconButton>
                    )
                  }}
                  size="small"
                />
              </Box>
            </Box>
          )}

          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<ShareIcon />}
              onClick={handleCreateToken}
              disabled={loading}
              fullWidth
            >
              Neuen Zugangslink erstellen
            </Button>
          </Box>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Aktive Zugangslinks ({tokens.length})
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : tokens.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ p: 3 }}>
              Noch keine Zugangslinks erstellt
            </Typography>
          ) : (
            <List>
              {tokens.map((token) => {
                const daysRemaining = getDaysRemaining(token.expiresAt);
                const url = shareTokenService.generateShareUrl(token.id);
                
                return (
                  <ListItem key={token.id} divider>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">
                            Erstellt von {token.createdBy}
                          </Typography>
                          <Chip
                            label={`${daysRemaining} Tage`}
                            size="small"
                            color={daysRemaining <= 2 ? 'warning' : 'success'}
                            icon={<AccessTimeIcon />}
                          />
                          {token.accessCount > 0 && (
                            <Chip
                              label={`${token.accessCount}x geöffnet`}
                              size="small"
                              variant="outlined"
                              icon={<VisibilityIcon />}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Erstellt: {formatDate(token.createdAt)} • 
                            Gültig bis: {formatDate(token.expiresAt)}
                            {token.lastAccessedAt && (
                              <> • Zuletzt geöffnet: {formatDate(token.lastAccessedAt)}</>
                            )}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleCopyUrl(url)}
                        sx={{ mr: 1 }}
                      >
                        <CopyIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => handleDeleteToken(token.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })}
            </List>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Schließen</Button>
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

export default ShareCustomerButton;