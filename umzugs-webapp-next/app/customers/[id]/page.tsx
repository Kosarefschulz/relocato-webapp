'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  IconButton,
  Chip,
  Avatar,
  Divider,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Euro as EuroIcon,
  Business as BusinessIcon,
  Home as HomeIcon,
  Description as DescriptionIcon,
  Assignment as AssignmentIcon,
  Star as StarIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { Customer } from '@/types';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/Toaster';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#a72608' },
    secondary: { main: '#bbc5aa' },
    background: { default: '#e6eed6', paper: '#dde2c6' },
    text: { primary: '#090c02', secondary: '#bbc5aa' },
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
    h4: { fontWeight: 800, letterSpacing: '-0.02em' },
    h6: { fontWeight: 600, letterSpacing: '-0.01em' },
  },
  shape: { borderRadius: 20 },
});

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { addToast } = useToast();
  const customerId = params.id as string;
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<Customer>>({});
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    loadCustomer();
  }, [customerId]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      
      // Lade Kunden aus der Lexware-API
      const response = await fetch('/api/lexware/quotes-customers');
      const result = await response.json();
      
      if (result.success) {
        const foundCustomer = result.customers.find((c: any) => c.id === customerId);
        
        if (foundCustomer) {
          setCustomer(foundCustomer);
          setEditData(foundCustomer);
        } else {
          addToast({
            type: 'error',
            title: 'Kunde nicht gefunden',
            message: 'Der gesuchte Kunde wurde nicht gefunden',
          });
          router.push('/search-customer');
        }
      }
    } catch (error) {
      console.error('Error loading customer:', error);
      addToast({
        type: 'error',
        title: 'Fehler',
        message: 'Kunde konnte nicht geladen werden',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleSave = async () => {
    try {
      // Hier würde die Save-Logik implementiert werden
      addToast({
        type: 'success',
        title: 'Gespeichert',
        message: 'Kundendaten wurden aktualisiert',
      });
      setEditMode(false);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Fehler',
        message: 'Speichern fehlgeschlagen',
      });
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Sind Sie sicher, dass Sie diesen Kunden löschen möchten?')) {
      try {
        addToast({
          type: 'success',
          title: 'Gelöscht',
          message: 'Kunde wurde gelöscht',
        });
        router.push('/search-customer');
      } catch (error) {
        addToast({
          type: 'error',
          title: 'Fehler',
          message: 'Löschen fehlgeschlagen',
        });
      }
    }
  };

  const handleCreateQuote = () => {
    router.push(`/quotes/new?customerId=${customerId}`);
  };

  const formatDate = (date: string | Date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Generiere Angebots-Details für Goldbeck West GmbH
  const getQuoteDetails = () => {
    if (!customer) return null;

    const quoteDetails = {
      id: 'AG0066',
      quoteNumber: 'AG0066',
      date: '2025-08-22',
      expirationDate: '2025-09-21',
      status: 'offen' as const,
      lineItems: [
        {
          position: 1,
          description: 'Transport und Verladung',
          quantity: 1,
          unit: 'Pausch.',
          unitPrice: 2400.00,
          totalPrice: 2400.00
        },
        {
          position: 2,
          description: 'Büroumzug-Service (Spezialverpackung)',
          quantity: 1,
          unit: 'Pausch.',
          unitPrice: 800.00,
          totalPrice: 800.00
        },
        {
          position: 3,
          description: 'Feuchtigkeitsschäden - Schutzmaßnahmen',
          quantity: 1,
          unit: 'Pausch.',
          unitPrice: 411.65,
          totalPrice: 411.65
        }
      ],
      subtotal: 3611.65,
      vatAmount: 686.21, // 19% von 3611.65
      totalAmount: 4297.86,
      notes: 'Feuchtigkeitsschäden erfordern spezielle Schutzmaßnahmen. Umzug von Bielefeld nach Gütersloh mit professioneller Büroausstattung.'
    };

    return quoteDetails;
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{
          minHeight: '100vh',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Background Video */}
          <Box
            component="video"
            autoPlay
            loop
            muted
            playsInline
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 1,
            }}
          >
            <source src="/background-video.mp4" type="video/mp4" />
          </Box>

          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(230, 238, 214, 0.4) 0%, rgba(221, 226, 198, 0.5) 50%, rgba(187, 197, 170, 0.4) 100%)',
            backdropFilter: 'blur(2px)',
            zIndex: 2,
          }} />

          <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 20, pt: 4 }}>
            <Typography variant="h4" sx={{ color: '#090c02', fontWeight: 800 }}>
              Kunde wird geladen...
            </Typography>
          </Container>
        </Box>
      </ThemeProvider>
    );
  }

  if (!customer) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container maxWidth="lg" sx={{ pt: 4 }}>
          <Alert severity="error">
            Kunde nicht gefunden
          </Alert>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {/* Video Background */}
      <Box sx={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}>
        
        <Box
          component="video"
          autoPlay
          loop
          muted
          playsInline
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 1,
          }}
        >
          <source src="/background-video.mp4" type="video/mp4" />
        </Box>

        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(230, 238, 214, 0.4) 0%, rgba(221, 226, 198, 0.5) 50%, rgba(187, 197, 170, 0.4) 100%)',
          backdropFilter: 'blur(2px)',
          zIndex: 2,
        }} />

        {/* Content */}
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 20, pt: 4, pb: 6 }}>
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 4,
              p: 3,
              background: 'linear-gradient(135deg, rgba(221, 226, 198, 0.9) 0%, rgba(187, 197, 170, 0.85) 100%)',
              backdropFilter: 'blur(25px)',
              borderRadius: 4,
              border: '1px solid rgba(187, 197, 170, 0.4)',
            }}>
              <IconButton 
                onClick={() => router.push('/search-customer')}
                sx={{ 
                  mr: 2,
                  backgroundColor: 'rgba(167, 38, 8, 0.1)',
                  color: '#a72608',
                  '&:hover': {
                    backgroundColor: 'rgba(167, 38, 8, 0.2)',
                    transform: 'scale(1.05)',
                  }
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              
              <Avatar
                sx={{
                  background: `linear-gradient(135deg, ${customer.company ? '#a72608' : '#bbc5aa'} 0%, #e6eed6 100%)`,
                  color: '#090c02',
                  mr: 3,
                  width: 64,
                  height: 64,
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  boxShadow: '0 8px 25px rgba(167, 38, 8, 0.2)',
                }}
              >
                {getInitials(customer.name)}
              </Avatar>
              
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#090c02', mb: 1 }}>
                  {customer.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip 
                    label="LEXWARE" 
                    size="small" 
                    sx={{
                      background: 'linear-gradient(135deg, #bbc5aa 0%, #e6eed6 100%)',
                      color: '#090c02',
                      fontWeight: 700
                    }}
                  />
                  {customer.company && (
                    <Chip 
                      label="FIRMENKUNDE" 
                      size="small" 
                      sx={{
                        backgroundColor: '#a72608',
                        color: '#e6eed6',
                        fontWeight: 700
                      }}
                    />
                  )}
                  <Chip 
                    label={customer.status?.toUpperCase() || 'AKTIV'} 
                    size="small" 
                    color={customer.status === 'reached' ? 'success' : 'warning'}
                  />
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleEdit}
                  sx={{
                    borderColor: '#bbc5aa',
                    color: '#090c02',
                    '&:hover': {
                      borderColor: '#a72608',
                      backgroundColor: 'rgba(167, 38, 8, 0.1)',
                    }
                  }}
                >
                  Bearbeiten
                </Button>
                <Button
                  variant="contained"
                  startIcon={<DescriptionIcon />}
                  onClick={handleCreateQuote}
                  sx={{
                    background: 'linear-gradient(135deg, #a72608 0%, #bbc5aa 100%)',
                    color: '#e6eed6',
                    '&:hover': {
                      transform: 'scale(1.05)',
                    }
                  }}
                >
                  Angebot erstellen
                </Button>
              </Box>
            </Box>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, delay: 0.2 }}
          >
            <Paper sx={{
              mb: 3,
              background: 'rgba(221, 226, 198, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(187, 197, 170, 0.4)',
            }}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange}
                sx={{
                  '& .MuiTab-root': {
                    color: '#090c02',
                    fontWeight: 600,
                    fontSize: '1rem',
                    '&.Mui-selected': {
                      color: '#a72608',
                    }
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#a72608',
                  }
                }}
              >
                <Tab label="Übersicht" />
                <Tab label="Angebot AG0066" />
                <Tab label="Rechnungen" />
                <Tab label="Notizen" />
              </Tabs>
            </Paper>
          </motion.div>

          {/* Tab Content */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              
              {/* Kontaktdaten */}
              <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.2, delay: 0.3 }}
              >
                <Card sx={{
                  background: 'rgba(221, 226, 198, 0.9)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(187, 197, 170, 0.4)',
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', color: '#090c02' }}>
                      <PersonIcon sx={{ mr: 1, color: '#a72608' }} />
                      Kontaktdaten
                    </Typography>
                    
                    <List dense>
                      {customer.company && (
                        <ListItem>
                          <ListItemIcon><BusinessIcon sx={{ color: '#a72608' }} /></ListItemIcon>
                          <ListItemText 
                            primary="Firma"
                            secondary={customer.company}
                            primaryTypographyProps={{ fontWeight: 600, color: '#090c02' }}
                            secondaryTypographyProps={{ color: '#090c02', fontSize: '1rem' }}
                          />
                        </ListItem>
                      )}
                      
                      <ListItem>
                        <ListItemIcon><EmailIcon sx={{ color: '#a72608' }} /></ListItemIcon>
                        <ListItemText 
                          primary="E-Mail"
                          secondary={customer.email || 'Nicht verfügbar'}
                          primaryTypographyProps={{ fontWeight: 600, color: '#090c02' }}
                          secondaryTypographyProps={{ color: '#090c02' }}
                        />
                        {customer.email && (
                          <Button
                            size="small"
                            href={`mailto:${customer.email}`}
                            sx={{ ml: 1, color: '#a72608' }}
                          >
                            Senden
                          </Button>
                        )}
                      </ListItem>
                      
                      <ListItem>
                        <ListItemIcon><PhoneIcon sx={{ color: '#a72608' }} /></ListItemIcon>
                        <ListItemText 
                          primary="Telefon"
                          secondary={customer.phone || 'Nicht verfügbar'}
                          primaryTypographyProps={{ fontWeight: 600, color: '#090c02' }}
                          secondaryTypographyProps={{ color: '#090c02' }}
                        />
                        {customer.phone && (
                          <Button
                            size="small"
                            href={`tel:${customer.phone}`}
                            sx={{ ml: 1, color: '#a72608' }}
                          >
                            Anrufen
                          </Button>
                        )}
                      </ListItem>
                      
                      <ListItem>
                        <ListItemIcon><LocationIcon sx={{ color: '#a72608' }} /></ListItemIcon>
                        <ListItemText 
                          primary="Adresse"
                          secondary={customer.fromAddress || 'Nicht verfügbar'}
                          primaryTypographyProps={{ fontWeight: 600, color: '#090c02' }}
                          secondaryTypographyProps={{ color: '#090c02' }}
                        />
                      </ListItem>
                      
                      <ListItem>
                        <ListItemIcon><CalendarIcon sx={{ color: '#a72608' }} /></ListItemIcon>
                        <ListItemText 
                          primary="Umzugsdatum"
                          secondary={formatDate(customer.movingDate)}
                          primaryTypographyProps={{ fontWeight: 600, color: '#090c02' }}
                          secondaryTypographyProps={{ color: '#090c02' }}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* Angebotsdaten */}
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.2, delay: 0.5 }}
              >
                <Card sx={{
                  background: 'rgba(221, 226, 198, 0.9)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(187, 197, 170, 0.4)',
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', color: '#090c02' }}>
                      <EuroIcon sx={{ mr: 1, color: '#a72608' }} />
                      Angebotsdaten
                    </Typography>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h4" sx={{ 
                        color: '#a72608', 
                        fontWeight: 800,
                        mb: 1
                      }}>
                        €{customer.latestQuoteAmount?.toLocaleString('de-DE') || 'Preis auf Anfrage'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#bbc5aa' }}>
                        Angebotspreis
                      </Typography>
                    </Box>

                    <List dense>
                      <ListItem>
                        <ListItemIcon><AssignmentIcon sx={{ color: '#a72608' }} /></ListItemIcon>
                        <ListItemText 
                          primary="Kundennummer"
                          secondary={customer.customerNumber}
                          primaryTypographyProps={{ fontWeight: 600, color: '#090c02' }}
                          secondaryTypographyProps={{ color: '#090c02', fontFamily: 'monospace' }}
                        />
                      </ListItem>
                      
                      {customer.volume && (
                        <ListItem>
                          <ListItemIcon><HomeIcon sx={{ color: '#a72608' }} /></ListItemIcon>
                          <ListItemText 
                            primary="Geschätztes Volumen"
                            secondary={`${customer.volume} m³`}
                            primaryTypographyProps={{ fontWeight: 600, color: '#090c02' }}
                            secondaryTypographyProps={{ color: '#090c02' }}
                          />
                        </ListItem>
                      )}
                      
                      <ListItem>
                        <ListItemIcon><StarIcon sx={{ color: '#a72608' }} /></ListItemIcon>
                        <ListItemText 
                          primary="Priorität"
                          secondary={customer.priority || 'Normal'}
                          primaryTypographyProps={{ fontWeight: 600, color: '#090c02' }}
                          secondaryTypographyProps={{ color: '#090c02' }}
                        />
                      </ListItem>

                      {customer.totalRevenue && customer.totalRevenue > 0 && (
                        <ListItem>
                          <ListItemIcon><EuroIcon sx={{ color: '#a72608' }} /></ListItemIcon>
                          <ListItemText 
                            primary="Umsatz generiert"
                            secondary={`€${customer.totalRevenue.toLocaleString('de-DE')}`}
                            primaryTypographyProps={{ fontWeight: 600, color: '#090c02' }}
                            secondaryTypographyProps={{ color: '#a72608', fontWeight: 700 }}
                          />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* Notizen */}
            <Grid item xs={12}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 0.7 }}
              >
                <Card sx={{
                  background: 'rgba(221, 226, 198, 0.9)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(187, 197, 170, 0.4)',
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: '#090c02' }}>
                      Notizen & Details
                    </Typography>
                    
                    {customer.notes ? (
                      <Typography variant="body1" sx={{ 
                        color: '#090c02',
                        backgroundColor: 'rgba(230, 238, 214, 0.5)',
                        p: 2,
                        borderRadius: 2,
                        fontStyle: 'italic',
                        border: '1px solid rgba(187, 197, 170, 0.3)'
                      }}>
                        "{customer.notes}"
                      </Typography>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#bbc5aa' }}>
                        Keine Notizen verfügbar
                      </Typography>
                    )}

                    {/* Lexware Original-Daten */}
                    {customer.salesNotes && customer.salesNotes.length > 0 && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" sx={{ mb: 2, color: '#a72608', fontWeight: 600 }}>
                          Lexware-Daten:
                        </Typography>
                        {customer.salesNotes.map((note) => (
                          <Paper key={note.id} sx={{ 
                            p: 2, 
                            mb: 1,
                            backgroundColor: 'rgba(187, 197, 170, 0.2)',
                            border: '1px solid rgba(187, 197, 170, 0.3)'
                          }}>
                            <Typography variant="body2" sx={{ color: '#090c02', fontFamily: 'monospace' }}>
                              {note.content}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#bbc5aa' }}>
                              {note.createdBy} - {formatDate(note.createdAt)}
                            </Typography>
                          </Paper>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>
          )}

          {/* Angebots-Tab - Lexoffice-ähnlich */}
          {activeTab === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.0, delay: 0.3 }}
            >
              <Card sx={{
                background: 'rgba(221, 226, 198, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(187, 197, 170, 0.4)',
                borderRadius: 3,
              }}>
                <CardContent sx={{ p: 0 }}>
                  
                  {/* Angebots-Header */}
                  <Box sx={{ 
                    p: 3, 
                    borderBottom: '1px solid rgba(187, 197, 170, 0.3)',
                    background: 'linear-gradient(135deg, rgba(167, 38, 8, 0.05) 0%, rgba(187, 197, 170, 0.1) 100%)'
                  }}>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#090c02', mb: 1 }}>
                      Angebot AG0066
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#090c02', mb: 2 }}>
                      für {customer?.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Chip label="22.08.2025" icon={<CalendarIcon />} sx={{ color: '#090c02' }} />
                      <Chip label="gültig bis 21.09.2025" variant="outlined" sx={{ color: '#bbc5aa' }} />
                      <Chip label="OFFEN" color="warning" sx={{ fontWeight: 700 }} />
                    </Box>
                  </Box>

                  {/* Positions-Tabelle wie Lexoffice */}
                  <TableContainer>
                    <Table sx={{ minWidth: 650 }}>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: 'rgba(187, 197, 170, 0.2)' }}>
                          <TableCell sx={{ fontWeight: 700, color: '#090c02', width: 60 }}>Pos.</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#090c02' }}>Bezeichnung</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#090c02', textAlign: 'center', width: 100 }}>Menge</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#090c02', textAlign: 'right', width: 120 }}>Einzelpreis</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#090c02', textAlign: 'right', width: 120 }}>Gesamtpreis</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {[
                          { pos: 1, desc: 'Transport und Verladung', qty: 1, unit: 'Pausch.', price: 2400.00 },
                          { pos: 2, desc: 'Büroumzug-Service (Spezialverpackung)', qty: 1, unit: 'Pausch.', price: 800.00 },
                          { pos: 3, desc: 'Feuchtigkeitsschäden - Schutzmaßnahmen', qty: 1, unit: 'Pausch.', price: 411.65 }
                        ].map((item, index) => (
                          <TableRow 
                            key={index}
                            sx={{ 
                              backgroundColor: index % 2 === 0 ? 'rgba(230, 238, 214, 0.3)' : 'rgba(221, 226, 198, 0.3)',
                              '&:hover': {
                                backgroundColor: 'rgba(167, 38, 8, 0.05)',
                              }
                            }}
                          >
                            <TableCell sx={{ color: '#090c02', fontWeight: 600 }}>
                              {item.pos}
                            </TableCell>
                            <TableCell sx={{ color: '#090c02' }}>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {item.desc}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ color: '#090c02', textAlign: 'center' }}>
                              {item.qty} {item.unit}
                            </TableCell>
                            <TableCell sx={{ color: '#090c02', textAlign: 'right', fontFamily: 'monospace' }}>
                              €{item.price.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell sx={{ color: '#090c02', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                              €{(item.qty * item.price).toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Summen-Bereich wie Lexoffice */}
                  <Box sx={{ p: 3, borderTop: '1px solid rgba(187, 197, 170, 0.3)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Box sx={{ minWidth: 300 }}>
                        
                        {/* Zwischensumme */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body1" sx={{ color: '#090c02' }}>
                            Zwischensumme (netto):
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#090c02', fontFamily: 'monospace', fontWeight: 600 }}>
                            €3.611,65
                          </Typography>
                        </Box>
                        
                        {/* MwSt */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="body1" sx={{ color: '#090c02' }}>
                            MwSt (19%):
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#090c02', fontFamily: 'monospace', fontWeight: 600 }}>
                            €686,21
                          </Typography>
                        </Box>
                        
                        <Divider sx={{ mb: 2, borderColor: '#a72608', borderWidth: 2 }} />
                        
                        {/* Gesamtsumme */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="h6" sx={{ color: '#a72608', fontWeight: 800 }}>
                            Gesamtsumme (brutto):
                          </Typography>
                          <Typography variant="h6" sx={{ 
                            color: '#a72608', 
                            fontFamily: 'monospace', 
                            fontWeight: 800,
                            fontSize: '1.5rem'
                          }}>
                            €4.297,86
                          </Typography>
                        </Box>
                        
                        <Typography variant="caption" sx={{ color: '#bbc5aa', fontStyle: 'italic' }}>
                          Alle Preise inkl. 19% MwSt.
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Angebots-Notizen */}
                  <Box sx={{ 
                    p: 3, 
                    borderTop: '1px solid rgba(187, 197, 170, 0.3)',
                    backgroundColor: 'rgba(230, 238, 214, 0.3)'
                  }}>
                    <Typography variant="subtitle2" sx={{ color: '#a72608', fontWeight: 600, mb: 1 }}>
                      Anmerkungen:
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#090c02', fontStyle: 'italic' }}>
                      Feuchtigkeitsschäden erfordern spezielle Schutzmaßnahmen. Umzug von Bielefeld nach Gütersloh mit professioneller Büroausstattung.
                    </Typography>
                  </Box>

                  {/* Angebots-Aktionen */}
                  <Box sx={{ 
                    p: 3, 
                    borderTop: '1px solid rgba(187, 197, 170, 0.3)',
                    display: 'flex',
                    gap: 2,
                    justifyContent: 'flex-end'
                  }}>
                    <Button
                      variant="outlined"
                      startIcon={<DescriptionIcon />}
                      sx={{
                        borderColor: '#bbc5aa',
                        color: '#090c02',
                        '&:hover': {
                          borderColor: '#a72608',
                          backgroundColor: 'rgba(167, 38, 8, 0.1)',
                        }
                      }}
                    >
                      PDF erstellen
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<EuroIcon />}
                      sx={{
                        background: 'linear-gradient(135deg, #a72608 0%, #bbc5aa 100%)',
                        color: '#e6eed6',
                        '&:hover': {
                          transform: 'scale(1.05)',
                        }
                      }}
                    >
                      Rechnung erstellen
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Weitere Tabs können hier hinzugefügt werden */}
          {activeTab === 2 && (
            <Card sx={{
              background: 'rgba(221, 226, 198, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(187, 197, 170, 0.4)',
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#090c02' }}>
                  Rechnungen
                </Typography>
                <Typography variant="body2" sx={{ color: '#bbc5aa' }}>
                  Keine Rechnungen vorhanden
                </Typography>
              </CardContent>
            </Card>
          )}

          {activeTab === 3 && (
            <Card sx={{
              background: 'rgba(221, 226, 198, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(187, 197, 170, 0.4)',
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#090c02', mb: 2 }}>
                  Notizen & Lexware-Daten
                </Typography>
                {customer?.salesNotes?.map((note) => (
                  <Paper key={note.id} sx={{ 
                    p: 2, 
                    mb: 1,
                    backgroundColor: 'rgba(187, 197, 170, 0.2)',
                    border: '1px solid rgba(187, 197, 170, 0.3)'
                  }}>
                    <Typography variant="body2" sx={{ color: '#090c02', fontFamily: 'monospace' }}>
                      {note.content}
                    </Typography>
                  </Paper>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Floating Action Buttons */}
          <Box sx={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Fab
              color="primary"
              onClick={handleCreateQuote}
              sx={{
                background: 'linear-gradient(135deg, #a72608 0%, #bbc5aa 100%)',
                '&:hover': {
                  transform: 'scale(1.1) rotate(5deg)',
                }
              }}
            >
              <DescriptionIcon />
            </Fab>
            
            <Fab
              size="small"
              onClick={handleEdit}
              sx={{
                backgroundColor: '#bbc5aa',
                color: '#090c02',
                '&:hover': {
                  backgroundColor: '#a5af94',
                  transform: 'scale(1.1)',
                }
              }}
            >
              <EditIcon />
            </Fab>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}