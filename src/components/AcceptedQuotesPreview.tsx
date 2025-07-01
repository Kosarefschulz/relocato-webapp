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
  alpha
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
import { useNavigate } from 'react-router-dom';
import { Quote, Customer } from '../types';
import { databaseService as googleSheetsService } from '../config/database.config';
import { motion } from 'framer-motion';

const MotionCard = motion(Card);

interface AcceptedQuote extends Quote {
  customer?: Customer;
}

const AcceptedQuotesPreview: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [acceptedQuotes, setAcceptedQuotes] = useState<AcceptedQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<AcceptedQuote | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    loadAcceptedQuotes();
  }, []);

  const loadAcceptedQuotes = async () => {
    try {
      setLoading(true);
      const [quotes, customers] = await Promise.all([
        googleSheetsService.getQuotes(),
        googleSheetsService.getCustomers()
      ]);

      // Filter für angenommene und bestätigte Angebote
      const accepted = quotes.filter(q => 
        q.status === 'accepted' || 
        q.status === 'confirmed' ||
        (q.status === 'invoiced' && q.createdAt && 
         new Date(q.createdAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000) // Letzte 30 Tage
      );

      // Kundeninformationen hinzufügen
      const acceptedWithCustomers = accepted.map(quote => {
        const customer = customers.find(c => c.id === quote.customerId);
        return { ...quote, customer };
      });

      // Nach Datum sortieren (neueste zuerst)
      acceptedWithCustomers.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      setAcceptedQuotes(acceptedWithCustomers.slice(0, 5)); // Nur die letzten 5
    } catch (error) {
      console.error('Fehler beim Laden der angenommenen Angebote:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuoteClick = (quote: AcceptedQuote) => {
    setSelectedQuote(quote);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedQuote(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Kein Datum';
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: Quote['status']) => {
    switch (status) {
      case 'accepted':
      case 'confirmed':
        return theme.palette.success.main;
      case 'invoiced':
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getStatusLabel = (status: Quote['status']) => {
    switch (status) {
      case 'accepted': return 'Angenommen';
      case 'confirmed': return 'Bestätigt';
      case 'invoiced': return 'Abgerechnet';
      default: return status;
    }
  };

  if (loading) {
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Angenommene Angebote
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" width={320} height={160} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
      </Box>
    );
  }

  if (acceptedQuotes.length === 0) {
    return null;
  }

  return (
    <>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            🎉 Angenommene Angebote
          </Typography>
          <Button
            size="small"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/quotes')}
            sx={{ textTransform: 'none' }}
          >
            Alle anzeigen
          </Button>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          overflowX: 'auto', 
          pb: 1,
          '&::-webkit-scrollbar': {
            height: 8,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            borderRadius: 4,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: alpha(theme.palette.primary.main, 0.3),
            borderRadius: 4,
          },
        }}>
          {acceptedQuotes.map((quote, index) => (
            <MotionCard
              key={quote.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              sx={{ 
                minWidth: 320,
                cursor: 'pointer',
                position: 'relative',
                overflow: 'visible',
                '&:hover': {
                  boxShadow: theme.shadows[4],
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
                background: `linear-gradient(135deg, ${alpha(getStatusColor(quote.status), 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
              }}
              onClick={() => handleQuoteClick(quote)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {quote.customer?.name || quote.customerName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(quote.createdAt)}
                    </Typography>
                  </Box>
                  <Chip
                    icon={<CheckCircleIcon />}
                    label={getStatusLabel(quote.status)}
                    size="small"
                    sx={{ 
                      backgroundColor: alpha(getStatusColor(quote.status), 0.1),
                      color: getStatusColor(quote.status),
                      fontWeight: 600
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <EuroIcon sx={{ color: theme.palette.success.main }} />
                  <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                    {quote.price.toLocaleString('de-DE')}
                  </Typography>
                </Box>

                {quote.moveDate && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Umzugstermin: {formatDate(quote.moveDate)}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </MotionCard>
          ))}
        </Box>
      </Box>

      {/* Detail-Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        maxWidth="sm"
        fullWidth
      >
        {selectedQuote && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Angebotsdetails</Typography>
                <IconButton size="small" onClick={handleCloseDetails}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Kunde"
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          <PersonIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                          {selectedQuote.customer?.name || selectedQuote.customerName}
                        </Typography>
                        {selectedQuote.customer?.email && (
                          <Typography variant="body2">
                            <EmailIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                            {selectedQuote.customer.email}
                          </Typography>
                        )}
                        {selectedQuote.customer?.phone && (
                          <Typography variant="body2">
                            <PhoneIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                            {selectedQuote.customer.phone}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Umzugsdetails"
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          <HomeIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                          Von: {selectedQuote.moveFrom || 'Nicht angegeben'}
                        </Typography>
                        <Typography variant="body2">
                          <HomeIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                          Nach: {selectedQuote.moveTo || 'Nicht angegeben'}
                        </Typography>
                        {selectedQuote.moveDate && (
                          <Typography variant="body2">
                            <CalendarIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                            Datum: {formatDate(selectedQuote.moveDate)}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Preis"
                    secondary={
                      <Typography variant="h6" color="success.main">
                        €{selectedQuote.price.toLocaleString('de-DE')}
                      </Typography>
                    }
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Status"
                    secondary={
                      <Chip
                        icon={<CheckCircleIcon />}
                        label={getStatusLabel(selectedQuote.status)}
                        sx={{ 
                          backgroundColor: alpha(getStatusColor(selectedQuote.status), 0.1),
                          color: getStatusColor(selectedQuote.status)
                        }}
                      />
                    }
                  />
                </ListItem>
                {selectedQuote.notes && (
                  <>
                    <Divider />
                    <ListItem>
                      <ListItemText
                        primary="Notizen"
                        secondary={selectedQuote.notes}
                      />
                    </ListItem>
                  </>
                )}
              </List>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDetails}>
                Schließen
              </Button>
              <Button
                variant="contained"
                startIcon={<ReceiptIcon />}
                onClick={() => {
                  handleCloseDetails();
                  navigate(`/customer/${selectedQuote.customerId}`);
                }}
              >
                Zum Kunden
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
};

export default AcceptedQuotesPreview;