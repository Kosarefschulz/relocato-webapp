'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Chip, 
  IconButton, 
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  useTheme,
  alpha,
  Grid
} from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  Euro as EuroIcon,
  Close as CloseIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { Quote, Customer } from '@/types';
import { supabaseService } from '@/lib/services/supabase';
import { motion } from 'framer-motion';

const MotionCard = motion(Card);

const AcceptedQuotesPreview: React.FC = () => {
  const router = useRouter();
  const theme = useTheme();
  const [acceptedQuotes, setAcceptedQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadAcceptedQuotes();
  }, []);

  const loadAcceptedQuotes = async () => {
    try {
      setLoading(true);
      
      // Mock data - in real implementation, filter by status 'accepted'
      const mockQuotes: Quote[] = [
        {
          id: 'Q-2025-001',
          customerId: 'C-001',
          customerName: 'Familie Müller',
          price: 1250,
          createdAt: new Date('2025-08-20'),
          createdBy: 'system',
          status: 'accepted',
          moveDate: '2025-08-25',
          moveFrom: 'Berlin Mitte',
          moveTo: 'Hamburg Altona',
          volume: 45,
          distance: 290,
          company: 'relocato',
          acceptedAt: new Date('2025-08-21').toISOString(),
          notes: 'Komplettumzug mit Möbelmontage'
        },
        {
          id: 'Q-2025-002', 
          customerId: 'C-002',
          customerName: 'Schmidt GmbH',
          price: 2100,
          createdAt: new Date('2025-08-19'),
          createdBy: 'system',
          status: 'accepted',
          moveDate: '2025-08-27',
          moveFrom: 'München Zentrum',
          moveTo: 'Frankfurt Westend',
          volume: 75,
          distance: 390,
          company: 'relocato',
          acceptedAt: new Date('2025-08-20').toISOString(),
          notes: 'Büroumzug am Wochenende'
        },
        {
          id: 'Q-2025-003',
          customerId: 'C-003', 
          customerName: 'Familie Weber',
          price: 890,
          createdAt: new Date('2025-08-18'),
          createdBy: 'system',
          status: 'accepted',
          moveDate: '2025-08-30',
          moveFrom: 'Düsseldorf',
          moveTo: 'Köln',
          volume: 32,
          distance: 45,
          company: 'relocato',
          acceptedAt: new Date('2025-08-19').toISOString(),
          notes: '2-Zimmer Wohnung, 3. Stock'
        }
      ];
      
      setAcceptedQuotes(mockQuotes);
    } catch (error) {
      console.error('Error loading accepted quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuoteClick = (quote: Quote) => {
    setSelectedQuote(quote);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedQuote(null);
  };

  const handleViewQuote = (quoteId: string) => {
    router.push(`/quotes/${quoteId}`);
    handleCloseDialog();
  };

  const handleCreateInvoice = (quoteId: string) => {
    router.push(`/accounting/invoice/new?quoteId=${quoteId}`);
    handleCloseDialog();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDaysUntilMove = (moveDate: string) => {
    const today = new Date();
    const move = new Date(moveDate);
    const diffTime = move.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPriorityColor = (daysUntil: number) => {
    if (daysUntil <= 1) return 'error';
    if (daysUntil <= 3) return 'warning';
    if (daysUntil <= 7) return 'info';
    return 'success';
  };

  if (loading) {
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon color="success" />
          Angenommene Angebote
        </Typography>
        <Grid container spacing={2}>
          {[1, 2, 3].map(i => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (acceptedQuotes.length === 0) {
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon color="success" />
          Angenommene Angebote
        </Typography>
        <Card sx={{ textAlign: 'center', py: 4 }}>
          <CardContent>
            <CheckCircleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Keine angenommenen Angebote
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sobald Kunden Angebote annehmen, erscheinen sie hier
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon color="success" />
          Angenommene Angebote ({acceptedQuotes.length})
        </Typography>
        <Button 
          size="small" 
          endIcon={<ArrowForwardIcon />}
          onClick={() => router.push('/quotes?status=accepted')}
        >
          Alle anzeigen
        </Button>
      </Box>

      <Grid container spacing={2}>
        {acceptedQuotes.map((quote, index) => {
          const daysUntil = getDaysUntilMove(quote.moveDate || '');
          const priorityColor = getPriorityColor(daysUntil);
          
          return (
            <Grid item xs={12} sm={6} md={4} key={quote.id}>
              <MotionCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                sx={{
                  cursor: 'pointer',
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: theme.shadows[4],
                    transform: 'translateY(-2px)'
                  }
                }}
                onClick={() => handleQuoteClick(quote)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {quote.customerName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        #{quote.id}
                      </Typography>
                    </Box>
                    <Chip 
                      label="ANGENOMMEN" 
                      size="small" 
                      color="success"
                      icon={<CheckCircleIcon />}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CalendarIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {formatDate(quote.moveDate || '')}
                      </Typography>
                      <Chip 
                        label={`${daysUntil} Tage`}
                        size="small"
                        color={priorityColor as any}
                        variant="outlined"
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <HomeIcon fontSize="small" color="action" />
                      <Typography variant="body2" noWrap>
                        {quote.moveFrom} → {quote.moveTo}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EuroIcon fontSize="small" color="action" />
                      <Typography variant="h6" color="primary.main" fontWeight="bold">
                        €{quote.price.toLocaleString('de-DE')}
                      </Typography>
                      {quote.volume && (
                        <Typography variant="body2" color="text.secondary">
                          ({quote.volume}m³)
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {quote.notes && (
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {quote.notes}
                    </Typography>
                  )}
                </CardContent>
              </MotionCard>
            </Grid>
          );
        })}
      </Grid>

      {/* Quote Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        {selectedQuote && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6">
                    {selectedQuote.customerName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Angebot #{selectedQuote.id}
                  </Typography>
                </Box>
                <IconButton onClick={handleCloseDialog}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            
            <DialogContent>
              <List dense>
                <ListItem>
                  <ListItemIcon><CalendarIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Umzugsdatum"
                    secondary={formatDate(selectedQuote.moveDate || '')}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon><HomeIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Route"
                    secondary={`${selectedQuote.moveFrom} → ${selectedQuote.moveTo}`}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon><EuroIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Preis"
                    secondary={`€${selectedQuote.price.toLocaleString('de-DE')}`}
                  />
                </ListItem>
                
                {selectedQuote.volume && (
                  <ListItem>
                    <ListItemIcon><HomeIcon /></ListItemIcon>
                    <ListItemText 
                      primary="Volumen"
                      secondary={`${selectedQuote.volume}m³`}
                    />
                  </ListItem>
                )}
                
                {selectedQuote.notes && (
                  <ListItem>
                    <ListItemText 
                      primary="Notizen"
                      secondary={selectedQuote.notes}
                    />
                  </ListItem>
                )}
              </List>
            </DialogContent>
            
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={handleCloseDialog}>
                Schließen
              </Button>
              <Button 
                variant="outlined"
                onClick={() => handleViewQuote(selectedQuote.id)}
                startIcon={<ArrowForwardIcon />}
              >
                Angebot öffnen
              </Button>
              <Button 
                variant="contained"
                onClick={() => handleCreateInvoice(selectedQuote.id)}
                startIcon={<ReceiptIcon />}
              >
                Rechnung erstellen
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AcceptedQuotesPreview;