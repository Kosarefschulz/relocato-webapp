'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Chip,
  IconButton,
  InputBase,
  CircularProgress,
  Divider,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CancelIcon from '@mui/icons-material/Cancel';
import EuroIcon from '@mui/icons-material/Euro';
import { useToast } from '../providers/ToastProvider';

// Lexware Quote Interface
interface LexwareQuote {
  id: string;
  customerId: string;
  customerName: string;
  customerNumber: string;
  quoteNumber: string;
  date: string;
  status: 'OFFEN' | 'ANGENOMMEN' | 'ABGELEHNT' | 'ERLEDIGT';
  total: number;
  description: string;
  items: Array<{
    description: string;
    quantity: number;
    price: number;
    total: number;
  }>;
}

export default function QuotesPage() {
  const { addToast } = useToast();
  const [quotes, setQuotes] = useState<LexwareQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Lade Angebote aus Lexware
  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      
      // Mock-Daten für Demo - in Produktion von Lexware API laden
      const mockQuotes: LexwareQuote[] = [
        {
          id: '9f2706c2-c957-4bbb-81df-b1991ffd7f17',
          customerId: 'lexware-6319a44a-95a1-4b29-9069-30352796f660',
          customerName: 'Goldbeck West GmbH',
          customerNumber: 'LW-10179',
          quoteNumber: 'AG-2025-001',
          date: '2025-08-22',
          status: 'ANGENOMMEN',
          total: 3611.65,
          description: 'Feuchtigkeitsschaden Wände - Küche und Badezimmer. Neue Tapeten und Anstriche erforderlich.',
          items: [
            { description: 'Wandbehandlung Küche', quantity: 1, price: 1500, total: 1500 },
            { description: 'Badezimmer Renovierung', quantity: 1, price: 2111.65, total: 2111.65 },
          ]
        },
        {
          id: '6fb0b99e-20e1-4e1a-ad83-edd51d92b7e7',
          customerId: 'lexware-31d42c59-3f32-4971-adea-7e5a8ac02491',
          customerName: 'Alexander Betz',
          customerNumber: 'LW-10178',
          quoteNumber: 'AG-2025-002',
          date: '2025-08-21',
          status: 'OFFEN',
          total: 3855.60,
          description: 'Privatumzug - 3-Zimmer Wohnung inkl. Klavier von Stuttgart nach München',
          items: [
            { description: 'Umzugsservice', quantity: 1, price: 2500, total: 2500 },
            { description: 'Klaviertransport', quantity: 1, price: 1355.60, total: 1355.60 },
          ]
        },
        {
          id: '1cc4d030-9dd1-45e3-acf0-024f0bb2d02c',
          customerId: 'lexware-f75797ba-77d0-4b95-bf84-cf02ac091290',
          customerName: 'A. Bührdel',
          customerNumber: 'LW-10176',
          quoteNumber: 'AG-2025-003',
          date: '2025-08-21',
          status: 'ANGENOMMEN',
          total: 2300.00,
          description: 'Klaviertransport Bechstein Flügel - Erdgeschoss zu 3. Stock mit Kranwagen',
          items: [
            { description: 'Flügeltransport mit Kran', quantity: 1, price: 2300, total: 2300 },
          ]
        },
        {
          id: 'b5e0cd65-456a-4d8f-8f02-3a0b9c1e2d4a',
          customerId: 'lexware-a12b3c4d-5e6f-7890-abcd-ef1234567890',
          customerName: 'Schmidt Immobilien GmbH',
          customerNumber: 'LW-10180',
          quoteNumber: 'AG-2025-004',
          date: '2025-08-20',
          status: 'OFFEN',
          total: 5200.00,
          description: 'Büroumzug - 12 Arbeitsplätze inkl. Server-Raum und Archiv',
          items: [
            { description: 'Büroumzug komplett', quantity: 1, price: 4500, total: 4500 },
            { description: 'Server-Transport', quantity: 1, price: 700, total: 700 },
          ]
        },
        {
          id: 'c7f1a2b3-89de-4567-9012-3456789abcde',
          customerId: 'lexware-b23c4d5e-6f78-9012-bcde-f23456789012',
          customerName: 'Familie Weber',
          customerNumber: 'LW-10181',
          quoteNumber: 'AG-2025-005',
          date: '2025-08-19',
          status: 'ABGELEHNT',
          total: 1850.00,
          description: 'Haushaltsauflösung - 2-Zimmer Wohnung inkl. Entsorgung',
          items: [
            { description: 'Haushaltsauflösung', quantity: 1, price: 1500, total: 1500 },
            { description: 'Entsorgungsgebühren', quantity: 1, price: 350, total: 350 },
          ]
        },
      ];

      setQuotes(mockQuotes);
      setLoading(false);

      addToast({
        type: 'success',
        title: '✅ Angebote geladen',
        message: `${mockQuotes.length} Angebote aus Lexware geladen`,
      });

    } catch (error) {
      console.error('Error loading quotes:', error);
      setLoading(false);
      addToast({
        type: 'error',
        title: 'Fehler beim Laden',
        message: 'Angebote konnten nicht geladen werden',
      });
    }
  };

  // PDF Download Handler
  const handleDownloadPDF = async (quote: LexwareQuote) => {
    try {
      addToast({
        type: 'info',
        title: '📄 PDF wird geladen...',
        message: `Lade PDF für ${quote.quoteNumber}`,
      });

      const response = await fetch(`/api/lexware/quote/${quote.customerNumber}/pdf`);
      
      if (!response.ok) {
        throw new Error(`PDF API Error: ${response.status}`);
      }

      const pdfBlob = await response.blob();
      
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${quote.quoteNumber}_${quote.customerName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      addToast({
        type: 'success',
        title: '✅ PDF heruntergeladen',
        message: `${quote.quoteNumber} erfolgreich gespeichert`,
      });

    } catch (error) {
      console.error('Error downloading PDF:', error);
      addToast({
        type: 'error',
        title: 'PDF-Download fehlgeschlagen',
        message: 'PDF konnte nicht geladen werden',
      });
    }
  };

  // Filter Angebote
  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = searchTerm === '' || 
      quote.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || quote.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Status Farben
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ANGENOMMEN': return '#a72608';
      case 'OFFEN': return '#bbc5aa';
      case 'ABGELEHNT': return '#7f7979';
      case 'ERLEDIGT': return '#090c02';
      default: return '#c1bdb3';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ANGENOMMEN': return <CheckCircleIcon />;
      case 'OFFEN': return <PendingActionsIcon />;
      case 'ABGELEHNT': return <CancelIcon />;
      default: return <DescriptionIcon />;
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #090c02 0%, #323031 100%)',
      pt: 12,
      pb: 4,
      px: 3,
    }}>
      {/* Video Background */}
      <video
        autoPlay
        muted
        loop
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.3,
          zIndex: 0,
        }}
      >
        <source src="/relocato-video.mp4" type="video/mp4" />
      </video>

      <Box sx={{ 
        maxWidth: 1400, 
        mx: 'auto',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h3" 
              sx={{ 
                color: '#e6eed6',
                fontWeight: 700,
                mb: 1,
                textShadow: '0 4px 8px rgba(9, 12, 2, 0.4)',
              }}
            >
              Angebote
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#bbc5aa',
                mb: 3 
              }}
            >
              Alle Lexware-Angebote im Überblick
            </Typography>

            {/* Search & Filter Bar */}
            <Box sx={{ 
              display: 'flex', 
              gap: 2,
              mb: 4,
              flexWrap: 'wrap',
            }}>
              {/* Search */}
              <Paper
                sx={{
                  p: '2px 4px',
                  display: 'flex',
                  alignItems: 'center',
                  flex: 1,
                  minWidth: 300,
                  background: 'rgba(221, 226, 198, 0.1)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(187, 197, 170, 0.3)',
                }}
              >
                <IconButton sx={{ p: '10px', color: '#bbc5aa' }}>
                  <SearchIcon />
                </IconButton>
                <InputBase
                  sx={{ ml: 1, flex: 1, color: '#e6eed6' }}
                  placeholder="Suche nach Kunde, Nummer oder Beschreibung..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Paper>

              {/* Status Filter */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                {['all', 'OFFEN', 'ANGENOMMEN', 'ABGELEHNT'].map((status) => (
                  <Chip
                    key={status}
                    label={status === 'all' ? 'ALLE' : status}
                    onClick={() => setFilterStatus(status)}
                    sx={{
                      backgroundColor: filterStatus === status 
                        ? getStatusColor(status === 'all' ? 'OFFEN' : status)
                        : 'rgba(187, 197, 170, 0.2)',
                      color: filterStatus === status ? '#e6eed6' : '#bbc5aa',
                      border: '1px solid rgba(187, 197, 170, 0.3)',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: getStatusColor(status === 'all' ? 'OFFEN' : status),
                        color: '#e6eed6',
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </motion.div>

        {/* Angebote Liste */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#bbc5aa' }} />
          </Box>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Grid container spacing={3}>
                {filteredQuotes.map((quote, index) => (
                  <Grid item xs={12} key={quote.id}>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                    >
                      <Paper
                        sx={{
                          p: 3,
                          background: 'rgba(221, 226, 198, 0.08)',
                          backdropFilter: 'blur(20px)',
                          border: '1px solid rgba(187, 197, 170, 0.2)',
                          borderRadius: 2,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: 'rgba(221, 226, 198, 0.12)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 32px rgba(9, 12, 2, 0.2)',
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          {/* Status Icon */}
                          <Box sx={{ 
                            color: getStatusColor(quote.status),
                            display: 'flex',
                            alignItems: 'center',
                          }}>
                            {getStatusIcon(quote.status)}
                          </Box>

                          {/* Quote Info */}
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                              <Typography 
                                variant="h6" 
                                sx={{ 
                                  color: '#e6eed6',
                                  fontWeight: 700,
                                }}
                              >
                                {quote.customerName}
                              </Typography>
                              <Chip 
                                label={quote.status}
                                size="small"
                                sx={{
                                  backgroundColor: getStatusColor(quote.status),
                                  color: '#e6eed6',
                                  fontWeight: 600,
                                }}
                              />
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: '#7f7979',
                                }}
                              >
                                {quote.quoteNumber} • {new Date(quote.date).toLocaleDateString('de-DE')}
                              </Typography>
                            </Box>
                            
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                color: '#bbc5aa',
                                mb: 1,
                              }}
                            >
                              {quote.description}
                            </Typography>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Typography 
                                variant="h5" 
                                sx={{ 
                                  color: '#a72608',
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                }}
                              >
                                <EuroIcon sx={{ fontSize: 20 }} />
                                {quote.total.toLocaleString('de-DE', { 
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2 
                                })}
                              </Typography>
                              
                              {quote.items.length > 0 && (
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    color: '#7f7979',
                                  }}
                                >
                                  {quote.items.length} Position{quote.items.length !== 1 ? 'en' : ''}
                                </Typography>
                              )}
                            </Box>
                          </Box>

                          {/* Download Button */}
                          <Button
                            variant="contained"
                            startIcon={<DownloadIcon />}
                            onClick={() => handleDownloadPDF(quote)}
                            sx={{
                              background: 'linear-gradient(135deg, #a72608 0%, #bbc5aa 100%)',
                              color: '#e6eed6',
                              fontWeight: 600,
                              px: 3,
                              py: 1.5,
                              borderRadius: 2,
                              boxShadow: '0 4px 12px rgba(167, 38, 8, 0.3)',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #bbc5aa 0%, #a72608 100%)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 6px 20px rgba(167, 38, 8, 0.4)',
                              }
                            }}
                          >
                            PDF laden
                          </Button>
                        </Box>
                      </Paper>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>

              {filteredQuotes.length === 0 && (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 8,
                  color: '#bbc5aa',
                }}>
                  <Typography variant="h6">
                    Keine Angebote gefunden
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Versuchen Sie eine andere Suche oder Filter
                  </Typography>
                </Box>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </Box>
    </Box>
  );
}