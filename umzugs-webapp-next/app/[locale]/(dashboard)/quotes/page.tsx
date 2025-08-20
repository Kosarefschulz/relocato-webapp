'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Button,
  Card,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  LinearProgress,
  Alert,
  Paper,
  Stack,
} from '@mui/material';
import { Grid2 as Grid } from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  PictureAsPdf as PdfIcon,
  Email as EmailIcon,
  Euro as EuroIcon,
  CalendarMonth as CalendarIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote } from '@/types';
import { supabaseService } from '@/lib/services/supabase';
import { useToast } from '@/components/ui/Toaster';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const MotionCard = motion(Card);

interface QuoteCardProps {
  quote: Quote;
  onEdit: (quote: Quote) => void;
  onDelete: (quoteId: string) => void;
  onView: (quoteId: string) => void;
  onGeneratePdf: (quoteId: string) => void;
  onSendEmail: (quoteId: string) => void;
}

function QuoteCard({ quote, onEdit, onDelete, onView, onGeneratePdf, onSendEmail }: QuoteCardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'draft':
        return 'default';
      case 'sent':
        return 'info';
      case 'confirmed':
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'error';
      case 'invoiced':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'draft':
        return 'Entwurf';
      case 'sent':
        return 'Gesendet';
      case 'confirmed':
        return 'Bestätigt';
      case 'accepted':
        return 'Angenommen';
      case 'rejected':
        return 'Abgelehnt';
      case 'invoiced':
        return 'Berechnet';
      default:
        return status;
    }
  };

  return (
    <MotionCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: 3,
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              Angebot #{quote.id.slice(-8).toUpperCase()}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <PersonIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {quote.customerName}
              </Typography>
            </Box>
            
            {quote.moveDate && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CalendarIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {format(new Date(quote.moveDate), 'dd.MM.yyyy', { locale: de })}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EuroIcon fontSize="small" color="action" />
              <Typography variant="h6" color="primary.main" fontWeight="bold">
                €{quote.price.toLocaleString('de-DE')}
              </Typography>
            </Box>
          </Box>
          
          <IconButton onClick={handleMenuOpen} size="small">
            <MoreVertIcon />
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={() => { onView(quote.id); handleMenuClose(); }}>
              <ViewIcon sx={{ mr: 1 }} fontSize="small" />
              Ansehen
            </MenuItem>
            <MenuItem onClick={() => { onEdit(quote); handleMenuClose(); }}>
              <EditIcon sx={{ mr: 1 }} fontSize="small" />
              Bearbeiten
            </MenuItem>
            <MenuItem onClick={() => { onGeneratePdf(quote.id); handleMenuClose(); }}>
              <PdfIcon sx={{ mr: 1 }} fontSize="small" />
              PDF erstellen
            </MenuItem>
            <MenuItem onClick={() => { onSendEmail(quote.id); handleMenuClose(); }}>
              <EmailIcon sx={{ mr: 1 }} fontSize="small" />
              E-Mail senden
            </MenuItem>
            <MenuItem onClick={() => { onDelete(quote.id); handleMenuClose(); }} sx={{ color: 'error.main' }}>
              <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
              Löschen
            </MenuItem>
          </Menu>
        </Box>
        
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip
            label={getStatusLabel(quote.status)}
            size="small"
            color={getStatusColor(quote.status) as any}
            variant="filled"
          />
          
          {quote.company && (
            <Chip
              label={quote.company.toUpperCase()}
              size="small"
              variant="outlined"
            />
          )}
          
          {quote.volume && (
            <Chip
              label={`${quote.volume}m³`}
              size="small"
              variant="outlined"
            />
          )}
        </Stack>
        
        {quote.notes && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }} noWrap>
            {quote.notes}
          </Typography>
        )}
        
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Erstellt: {format(new Date(quote.createdAt), 'dd.MM.yyyy HH:mm', { locale: de })}
        </Typography>
      </CardContent>
    </MotionCard>
  );
}

export default function QuotesPage() {
  const t = useTranslations('common');
  const router = useRouter();
  const { addToast } = useToast();
  
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);

  // Filter quotes based on search term
  const filteredQuotes = useMemo(() => {
    if (!searchTerm) return quotes;
    
    const term = searchTerm.toLowerCase();
    return quotes.filter(quote =>
      quote.customerName.toLowerCase().includes(term) ||
      quote.id.toLowerCase().includes(term) ||
      quote.notes?.toLowerCase().includes(term) ||
      quote.company?.toLowerCase().includes(term)
    );
  }, [quotes, searchTerm]);

  // Group quotes by status
  const quotesByStatus = useMemo(() => {
    const grouped = filteredQuotes.reduce((acc, quote) => {
      const status = quote.status || 'draft';
      if (!acc[status]) acc[status] = [];
      acc[status].push(quote);
      return acc;
    }, {} as Record<string, Quote[]>);
    
    return grouped;
  }, [filteredQuotes]);

  const loadQuotes = useCallback(async () => {
    try {
      setLoading(true);
      await supabaseService.initialize();
      const data = await supabaseService.getQuotes();
      setQuotes(data);
    } catch (error) {
      console.error('Error loading quotes:', error);
      addToast({
        type: 'error',
        title: 'Fehler',
        message: 'Angebote konnten nicht geladen werden',
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  const handleEdit = (quote: Quote) => {
    router.push(`/quotes/${quote.id}/edit`);
  };

  const handleView = (quoteId: string) => {
    router.push(`/quotes/${quoteId}`);
  };

  const handleDelete = (quoteId: string) => {
    setQuoteToDelete(quoteId);
    setDeleteDialogOpen(true);
  };

  const handleGeneratePdf = (quoteId: string) => {
    router.push(`/quotes/${quoteId}/pdf`);
  };

  const handleSendEmail = (quoteId: string) => {
    // TODO: Implement email sending
    addToast({
      type: 'info',
      title: 'Info',
      message: 'E-Mail-Funktion wird implementiert',
    });
  };

  const confirmDelete = async () => {
    if (!quoteToDelete) return;
    
    try {
      // TODO: Implement quote deletion
      // await supabaseService.deleteQuote(quoteToDelete);
      setQuotes(prev => prev.filter(q => q.id !== quoteToDelete));
      addToast({
        type: 'success',
        title: 'Erfolg',
        message: 'Angebot wurde gelöscht',
      });
    } catch (error) {
      console.error('Error deleting quote:', error);
      addToast({
        type: 'error',
        title: 'Fehler',
        message: 'Angebot konnte nicht gelöscht werden',
      });
    } finally {
      setDeleteDialogOpen(false);
      setQuoteToDelete(null);
    }
  };

  const handleAddQuote = () => {
    router.push('/quotes/new');
  };

  if (loading) {
    return (
      <Box>
        <LinearProgress />
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            Laden...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Angebote ({filteredQuotes.length})
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddQuote}
          size="large"
        >
          Neues Angebot
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Angebote suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {filteredQuotes.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          {searchTerm ? 'Keine Angebote gefunden' : 'Noch keine Angebote vorhanden'}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          <AnimatePresence>
            {filteredQuotes.map((quote) => (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={quote.id}>
                <QuoteCard
                  quote={quote}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                  onGeneratePdf={handleGeneratePdf}
                  onSendEmail={handleSendEmail}
                />
              </Grid>
            ))}
          </AnimatePresence>
        </Grid>
      )}

      <Fab
        color="primary"
        aria-label="add quote"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={handleAddQuote}
      >
        <AddIcon />
      </Fab>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Angebot löschen</DialogTitle>
        <DialogContent>
          <Typography>
            Sind Sie sicher, dass Sie dieses Angebot löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Abbrechen
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}