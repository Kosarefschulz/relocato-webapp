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
  Visibility as VisibilityIcon,
  Close as CloseIcon
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

      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        maxWidth="md" 
        fullWidth
        fullScreen={window.innerWidth < 600}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              Kundendaten teilen
              <Typography variant="body2" color="text.secondary">
                Temporärer Link (7 Tage gültig)
              </Typography>
            </Box>
            <IconButton
              edge="end"
              onClick={() => setOpen(false)}
              sx={{ display: { sm: 'none' } }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
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
                  <ListItem 
                    key={token.id} 
                    divider
                    sx={{
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      py: 2
                    }}
                  >
                    <ListItemText
                      sx={{ width: '100%', pr: { xs: 0, sm: 2 } }}
                      primary={
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: { xs: 'column', sm: 'row' },
                          alignItems: { xs: 'flex-start', sm: 'center' }, 
                          gap: 1 
                        }}>
                          <Typography variant="body2">
                            Erstellt von {token.createdBy}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ 
                              display: 'block',
                              wordBreak: 'break-word'
                            }}
                          >
                            Erstellt: {formatDate(token.createdAt)}<br />
                            Gültig bis: {formatDate(token.expiresAt)}
                            {token.lastAccessedAt && (
                              <><br />Zuletzt: {formatDate(token.lastAccessedAt)}</>
                            )}
                          </Typography>
                        </Box>
                      }
                    />
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 1,
                      mt: { xs: 2, sm: 0 },
                      width: { xs: '100%', sm: 'auto' },
                      justifyContent: { xs: 'flex-end', sm: 'flex-start' }
                    }}>
                      <Tooltip title="Link kopieren">
                        <IconButton
                          onClick={() => handleCopyUrl(url)}
                          size="small"
                          sx={{ 
                            border: 1, 
                            borderColor: 'divider',
                            '&:hover': {
                              bgcolor: 'action.hover'
                            }
                          }}
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Link löschen">
                        <IconButton
                          onClick={() => handleDeleteToken(token.id)}
                          color="error"
                          size="small"
                          sx={{ 
                            border: 1, 
                            borderColor: 'error.main',
                            '&:hover': {
                              bgcolor: 'error.light'
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
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