import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Container, Paper, Typography, Box, IconButton, Tabs, Tab, Button, Card, CardContent, Chip, Avatar, Divider, List, ListItem, ListItemAvatar, ListItemText, ListItemSecondaryAction, SpeedDial, SpeedDialAction, SpeedDialIcon, Badge, Alert, Skeleton, useTheme, useMediaQuery, alpha } from '@mui/material';
import Grid from './GridCompat';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Description as DescriptionIcon,
  PhotoCamera as PhotoCameraIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
  Info as InfoIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  PictureAsPdf as PdfIcon,
  WhatsApp as WhatsAppIcon,
  MoreVert as MoreIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { Customer, Quote, Invoice, EmailHistory } from '../types';
import { databaseService as googleSheetsService } from '../config/database.config';
import CustomerPhotos from './CustomerPhotos';

// Styled Components
const HeroSection = motion(Box);
const AnimatedCard = motion(Card);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <AnimatePresence mode="wait">
      {value === index && (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          role="tabpanel"
          {...other}
        >
          <Box sx={{ py: { xs: 2, md: 3 } }}>
            {children}
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Status-Konfiguration
const quoteStatusConfig = {
  draft: { color: 'default', icon: <EditIcon />, label: 'Entwurf' },
  sent: { color: 'info', icon: <EmailIcon />, label: 'Gesendet' },
  confirmed: { color: 'primary', icon: <CheckIcon />, label: 'Bestätigt' },
  accepted: { color: 'success', icon: <CheckIcon />, label: 'Angenommen' },
  rejected: { color: 'error', icon: <CancelIcon />, label: 'Abgelehnt' },
  invoiced: { color: 'warning', icon: <ReceiptIcon />, label: 'Berechnet' }
} as const;

const emailStatusConfig = {
  pending: { color: 'warning', label: 'Ausstehend' },
  sent: { color: 'default', label: 'Gesendet' },
  delivered: { color: 'info', label: 'Zugestellt' },
  opened: { color: 'success', label: 'Geöffnet' },
  failed: { color: 'error', label: 'Fehlgeschlagen' }
} as const;

const CustomerDetails: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [emails, setEmails] = useState<EmailHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);

  const navigateBack = () => {
    const from = location.state?.from;
    if (from) {
      navigate(from);
    } else {
      navigate('/customers');
    }
  };

  useEffect(() => {
    loadCustomerData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const loadCustomerData = async () => {
    if (!customerId) return;
    
    try {
      setLoading(true);
      // Lade alle Daten parallel
      const [customersData, quotesData, invoicesData, emailsData] = await Promise.all([
        googleSheetsService.getCustomers(),
        googleSheetsService.getQuotesByCustomerId(customerId),
        googleSheetsService.getInvoices().then(invoices => invoices.filter(i => i.customerId === customerId)),
        'getEmailHistory' in googleSheetsService ? (googleSheetsService as any).getEmailHistory(customerId) : Promise.resolve([])
      ]);

      const foundCustomer = customersData.find(c => c.id === customerId);
      if (foundCustomer) {
        setCustomer(foundCustomer);
        setQuotes(quotesData);
        setInvoices(invoicesData);
        setEmails(emailsData);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Kundendaten:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const calculateCustomerStats = () => {
    const totalQuotes = quotes.length;
    const acceptedQuotes = quotes.filter(q => q.status === 'accepted').length;
    const totalRevenue = quotes
      .filter(q => q.status === 'accepted' || q.status === 'invoiced')
      .reduce((sum, q) => sum + q.price, 0);
    const conversionRate = totalQuotes > 0 ? (acceptedQuotes / totalQuotes) * 100 : 0;

    return { totalQuotes, acceptedQuotes, totalRevenue, conversionRate };
  };

  const speedDialActions = [
    { icon: <PhoneIcon />, name: 'Anrufen', action: () => window.location.href = `tel:${customer?.phone}` },
    { icon: <EmailIcon />, name: 'Email senden', action: () => console.log('Email senden') },
    { icon: <WhatsAppIcon />, name: 'WhatsApp', action: () => window.open(`https://wa.me/${customer?.phone?.replace(/[^0-9]/g, '')}`) },
    { icon: <PdfIcon />, name: 'Angebot erstellen', action: () => navigate('/create-quote', { state: { customer } }) },
  ];

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 2, borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
      </Container>
    );
  }

  if (!customer) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">Kunde nicht gefunden</Alert>
        <Button onClick={navigateBack} sx={{ mt: 2 }}>
          Zurück zur Kundenliste
        </Button>
      </Container>
    );
  }

  const stats = calculateCustomerStats();
  const tabCount = {
    quotes: quotes.length,
    invoices: invoices.length,
    emails: emails.filter(e => e.status === 'sent' || e.status === 'delivered').length
  };

  return (
    <>
      <Container maxWidth="lg" sx={{ mt: { xs: 0, md: 4 }, mb: { xs: 10, md: 4 } }}>
        {/* Hero Section mit Glassmorphism */}
        <HeroSection
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          sx={{
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.8)} 0%, ${alpha(theme.palette.secondary.main, 0.8)} 100%)`,
            borderRadius: { xs: 0, md: 3 },
            p: { xs: 2, md: 4 },
            mb: 3,
            position: 'relative',
            overflow: 'hidden',
            color: 'white',
            backdropFilter: 'blur(10px)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)',
              pointerEvents: 'none'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={navigateBack} sx={{ color: 'white', mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            {isMobile && (
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Kundendetails
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: { xs: 'center', md: 'flex-start' } }}>
            {/* Avatar mit Animation */}
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Avatar
                sx={{
                  width: { xs: 80, md: 120 },
                  height: { xs: 80, md: 120 },
                  fontSize: { xs: '2rem', md: '3rem' },
                  backgroundColor: alpha(theme.palette.common.white, 0.2),
                  border: `3px solid ${alpha(theme.palette.common.white, 0.3)}`,
                  boxShadow: `0 0 20px ${alpha(theme.palette.common.white, 0.3)}`
                }}
              >
                {customer.name.charAt(0).toUpperCase()}
              </Avatar>
            </motion.div>

            {/* Customer Info */}
            <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {customer.name}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: { xs: 'center', md: 'flex-start' }, mb: 2 }}>
                <Chip 
                  icon={<TrophyIcon />} 
                  label={stats.conversionRate > 50 ? 'Premium Kunde' : 'Standard Kunde'} 
                  sx={{ 
                    backgroundColor: alpha(theme.palette.common.white, 0.2),
                    color: 'white',
                    '& .MuiChip-icon': { color: 'white' }
                  }} 
                />
                <Chip 
                  icon={<TimeIcon />} 
                  label={`Kunde seit ${Math.floor(Math.random() * 12 + 1)} Monaten`}
                  sx={{ 
                    backgroundColor: alpha(theme.palette.common.white, 0.2),
                    color: 'white',
                    '& .MuiChip-icon': { color: 'white' }
                  }} 
                />
              </Box>
            </Box>

            {/* Stats Cards */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: { xs: 'center', md: 'flex-end' } }}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Card sx={{ 
                  backgroundColor: alpha(theme.palette.common.white, 0.1),
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
                  color: 'white',
                  minWidth: 120
                }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      €{stats.totalRevenue.toFixed(0)}
                    </Typography>
                    <Typography variant="caption">Gesamtumsatz</Typography>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Card sx={{ 
                  backgroundColor: alpha(theme.palette.common.white, 0.1),
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
                  color: 'white',
                  minWidth: 120
                }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {stats.conversionRate.toFixed(0)}%
                    </Typography>
                    <Typography variant="caption">Erfolgsquote</Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Box>
          </Box>
        </HeroSection>

        {/* Premium Tabs */}
        <Paper 
          elevation={0} 
          sx={{ 
            backgroundColor: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              variant={isMobile ? "scrollable" : "fullWidth"}
              scrollButtons={isMobile ? "auto" : false}
              sx={{
                '& .MuiTab-root': {
                  minHeight: { xs: 56, md: 64 },
                  textTransform: 'none',
                  fontSize: { xs: '0.875rem', md: '1rem' },
                  fontWeight: 500,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  }
                },
                '& .Mui-selected': {
                  fontWeight: 700,
                }
              }}
            >
              <Tab 
                label="Informationen" 
                icon={<InfoIcon />} 
                iconPosition="start"
                sx={{ gap: 1 }}
              />
              <Tab 
                label="Fotos" 
                icon={<PhotoCameraIcon />} 
                iconPosition="start"
                sx={{ gap: 1 }}
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Angebote
                    {tabCount.quotes > 0 && (
                      <Badge badgeContent={tabCount.quotes} color="primary" />
                    )}
                  </Box>
                }
                icon={<DescriptionIcon />} 
                iconPosition="start"
                sx={{ gap: 1 }}
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Rechnungen
                    {tabCount.invoices > 0 && (
                      <Badge badgeContent={tabCount.invoices} color="warning" />
                    )}
                  </Box>
                }
                icon={<ReceiptIcon />} 
                iconPosition="start"
                sx={{ gap: 1 }}
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Emails
                    {tabCount.emails > 0 && (
                      <Badge badgeContent={tabCount.emails} color="success" />
                    )}
                  </Box>
                }
                icon={<EmailIcon />} 
                iconPosition="start"
                sx={{ gap: 1 }}
              />
            </Tabs>
          </Box>

          {/* Tab Panels */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              <Grid container spacing={3}>
                {/* Kontaktdaten */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <AnimatedCard
                    whileHover={{ y: -4, boxShadow: theme.shadows[8] }}
                    transition={{ duration: 0.3 }}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon /> Kontaktdaten
                      </Typography>
                      <List>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1) }}>
                              <PhoneIcon color="primary" />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary="Telefon"
                            secondary={
                              <Typography 
                                component="a" 
                                href={`tel:${customer.phone}`}
                                sx={{ 
                                  color: 'primary.main',
                                  textDecoration: 'none',
                                  '&:hover': { textDecoration: 'underline' }
                                }}
                              >
                                {customer.phone}
                              </Typography>
                            }
                          />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1) }}>
                              <EmailIcon color="primary" />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary="E-Mail"
                            secondary={customer.email}
                          />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1) }}>
                              <CalendarIcon color="primary" />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary="Umzugsdatum"
                            secondary={new Date(customer.movingDate).toLocaleDateString('de-DE', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </AnimatedCard>
                </Grid>

                {/* Adressen */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <AnimatedCard
                    whileHover={{ y: -4, boxShadow: theme.shadows[8] }}
                    transition={{ duration: 0.3 }}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationIcon /> Umzugsadressen
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ mb: 3 }}>
                          <Chip label="Von" size="small" color="primary" sx={{ mb: 1 }} />
                          <Typography variant="body1">
                            {customer.fromAddress}
                          </Typography>
                        </Box>
                        <Box>
                          <Chip label="Nach" size="small" color="success" sx={{ mb: 1 }} />
                          <Typography variant="body1">
                            {customer.toAddress}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </AnimatedCard>
                </Grid>

                {/* Wohnungsdetails */}
                <Grid size={12}>
                  <AnimatedCard
                    whileHover={{ y: -4, boxShadow: theme.shadows[8] }}
                    transition={{ duration: 0.3 }}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HomeIcon /> Wohnungsdetails
                      </Typography>
                      <Grid container spacing={3} sx={{ mt: 1 }}>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                            <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                              {customer.apartment?.rooms || '-'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Zimmer
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                            <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                              {customer.apartment?.area || '-'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              m² Fläche
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                            <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                              {customer.apartment?.floor || 'EG'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Etage
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                            <Chip
                              icon={customer.apartment?.hasElevator ? <CheckIcon /> : <CancelIcon />}
                              label={customer.apartment?.hasElevator ? 'Aufzug' : 'Kein Aufzug'}
                              color={customer.apartment?.hasElevator ? 'success' : 'default'}
                              sx={{ fontWeight: 600 }}
                            />
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </AnimatedCard>
                </Grid>

                {/* Notizen */}
                {customer.notes && (
                  <Grid size={12}>
                    <AnimatedCard
                      whileHover={{ y: -4, boxShadow: theme.shadows[8] }}
                      transition={{ duration: 0.3 }}
                    >
                      <CardContent>
                        <Typography variant="h6" gutterBottom color="primary">
                          Notizen
                        </Typography>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                          {customer.notes}
                        </Typography>
                      </CardContent>
                    </AnimatedCard>
                  </Grid>
                )}
              </Grid>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              <CustomerPhotos customer={customer} />
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              {quotes.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <DescriptionIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Noch keine Angebote vorhanden
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<DescriptionIcon />}
                    onClick={() => navigate('/create-quote', { state: { customer } })}
                    sx={{ mt: 2 }}
                  >
                    Erstes Angebot erstellen
                  </Button>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {quotes.map((quote, index) => (
                    <Grid size={{ xs: 12, md: 6 }} key={quote.id}>
                      <AnimatedCard
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -4, boxShadow: theme.shadows[8] }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box>
                              <Typography variant="h6" gutterBottom>
                                Angebot #{quote.id.slice(-6)}
                              </Typography>
                              <Chip
                                icon={quoteStatusConfig[quote.status].icon}
                                label={quoteStatusConfig[quote.status].label}
                                color={quoteStatusConfig[quote.status].color as any}
                                size="small"
                              />
                            </Box>
                            <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
                              €{quote.price.toFixed(2)}
                            </Typography>
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Erstellt am: {quote.createdAt.toLocaleDateString('de-DE')}
                          </Typography>
                          
                          {quote.comment && (
                            <Typography variant="body2" sx={{ mb: 2 }}>
                              {quote.comment}
                            </Typography>
                          )}

                          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                            <Button size="small" startIcon={<PdfIcon />} variant="outlined">
                              PDF
                            </Button>
                            <Button size="small" startIcon={<EmailIcon />} variant="outlined">
                              Senden
                            </Button>
                            {quote.status === 'accepted' && (
                              <Button size="small" startIcon={<ReceiptIcon />} variant="contained" color="success">
                                Rechnung
                              </Button>
                            )}
                          </Box>
                        </CardContent>
                      </AnimatedCard>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <ReceiptIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Noch keine Rechnungen vorhanden
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Rechnungen können aus angenommenen Angeboten erstellt werden
                </Typography>
                {quotes.filter(q => q.status === 'accepted').length > 0 && (
                  <Button
                    variant="contained"
                    startIcon={<ReceiptIcon />}
                    color="warning"
                  >
                    Rechnung aus Angebot erstellen
                  </Button>
                )}
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              {emails.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <EmailIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Noch keine Emails gesendet
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<EmailIcon />}
                    sx={{ mt: 2 }}
                  >
                    Email senden
                  </Button>
                </Box>
              ) : (
                <List>
                  {emails.map((email, index) => (
                    <React.Fragment key={email.id}>
                      {index > 0 && <Divider />}
                      <ListItem
                        sx={{
                          py: 2,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.05),
                            cursor: 'pointer'
                          }
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1) }}>
                            {email.type === 'quote' && <DescriptionIcon color="primary" />}
                            {email.type === 'invoice' && <ReceiptIcon color="warning" />}
                            {email.type === 'reminder' && <ScheduleIcon color="info" />}
                            {email.type === 'general' && <EmailIcon color="action" />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {email.subject}
                              </Typography>
                              <Chip
                                label={emailStatusConfig[email.status].label}
                                color={emailStatusConfig[email.status].color as any}
                                size="small"
                              />
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                {email.sentAt.toLocaleDateString('de-DE')} um {email.sentAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                              </Typography>
                              <Typography variant="body2" sx={{ 
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}>
                                {email.body}
                              </Typography>
                              {email.attachments && email.attachments.length > 0 && (
                                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                                  <PdfIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {email.attachments.length} Anhang/Anhänge
                                  </Typography>
                                </Box>
                              )}
                            </>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton edge="end">
                            <MoreIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          </TabPanel>
        </Paper>
      </Container>

      {/* Floating Speed Dial for Mobile */}
      {isMobile && (
        <SpeedDial
          ariaLabel="Quick Actions"
          sx={{ position: 'fixed', bottom: 70, right: 16 }}
          icon={<SpeedDialIcon />}
          onClose={() => setSpeedDialOpen(false)}
          onOpen={() => setSpeedDialOpen(true)}
          open={speedDialOpen}
        >
          {speedDialActions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={() => {
                action.action();
                setSpeedDialOpen(false);
              }}
            />
          ))}
        </SpeedDial>
      )}
    </>
  );
};

export default CustomerDetails;