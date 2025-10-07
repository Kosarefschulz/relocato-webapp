import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  IconButton,
  Tabs,
  Tab,
  Button,
  Card,
  CardContent,
  Chip,
  Avatar,
  Alert,
  Skeleton,
  useTheme,
  useMediaQuery,
  alpha,
  TextField,
  Snackbar,
  Divider,
  Stack,
  Tooltip,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge
} from '@mui/material';
import Grid from './GridCompat';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Description as DescriptionIcon,
  Receipt as ReceiptIcon,
  LocationOn as LocationIcon,
  AddAPhoto as AddAPhotoIcon,
  Business as BusinessIcon,
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { Customer, Quote, Invoice, CustomerPhase } from '../types';
import { databaseService as googleSheetsService } from '../config/database.config';
import emailHistoryService from '../services/emailHistoryService';
import CustomerInfo from './CustomerInfo';
import CustomerPhotos from './CustomerPhotos';
import CustomerCommunication from './CustomerCommunication';
import CustomerQuotes from './CustomerQuotes';
import CustomerInvoicesMultiCompany from './CustomerInvoices.multicompany';
import CustomerTagsAndNotes from './CustomerTagsAndNotes';
import DarkModeToggle from './DarkModeToggle';
import RoutePlanner from './RoutePlanner';
import ShareCustomerButton from './ShareCustomerButton';
import DispositionLinkButton from './DispositionLinkButton';
import CustomerPhaseDropdown from './CustomerPhaseDropdown';
import OfferManager from './OfferManager';
import CustomerFileManager from './CustomerFileManager';
// import SalesActions from './SalesActions'; // Temporarily disabled
// import SalesStatus from './SalesStatus'; // Temporarily disabled
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import MobileLayout from './MobileLayout';
import { useMobileLayout } from '../hooks/useMobileLayout';
import '../styles/customerDetailsUnified.css';

const HeroSection = motion(Box);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      <AnimatePresence mode="wait">
        {value === index && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{ py: { xs: 2, md: 3 } }}>
              {children}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const CustomerDetails: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const theme = useTheme();
  const { darkMode } = useCustomTheme();
  const { isMobile, isSmallMobile, spacing, cardPadding, titleVariant } = useMobileLayout();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [editedCustomer, setEditedCustomer] = useState<Customer | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [routePlannerOpen, setRoutePlannerOpen] = useState(false);
  const [linkedEmailsCount, setLinkedEmailsCount] = useState(0);
  const [mobileTabsDrawerOpen, setMobileTabsDrawerOpen] = useState(false);

  // E-Mail-Statistiken für Tab-Counter
  const emailStats = React.useMemo(() => {
    if (!customer?.id) return { totalMessages: 0, sentMessages: 0, receivedMessages: 0, activeThreads: 0 };
    try {
      return emailHistoryService.getEmailStats();
    } catch {
      return { totalMessages: 0, sentMessages: 0, receivedMessages: 0, activeThreads: 0 };
    }
  }, [customer?.id]);

  // Load linked emails count
  useEffect(() => {
    const loadLinkedEmailsCount = async () => {
      if (!customer?.id) return;
      
      try {
        console.log('📧 Loading linked emails count for customer:', customer.id);
        // Since Firebase is disabled, we'll use a placeholder count
        // In the future, this could be replaced with a Supabase query
        setLinkedEmailsCount(0);
        console.log('ℹ️ Linked emails count set to 0 (Firebase disabled, using Supabase)');
      } catch (err) {
        console.error('Error loading linked emails count:', err);
        setLinkedEmailsCount(0);
      }
    };
    
    loadLinkedEmailsCount();
  }, [customer?.id]);

  const navigateBack = useCallback(() => {
    const from = location.state?.from;
    if (from) {
      navigate(from);
    } else {
      navigate('/customers');
    }
  }, [location.state?.from, navigate]);

  useEffect(() => {
    loadCustomerData();
    // Check if we're coming from edit route
    const currentPath = window.location.pathname;
    if (currentPath.includes('/edit-customer/')) {
      setEditMode(true);
      setTabValue(0); // Go to info tab for editing
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const loadCustomerData = async () => {
    if (!customerId) return;
    
    console.log('🔍 Lade Kundendaten für ID/Nummer:', customerId);
    
    try {
      setLoading(true);
      
      // Import cache service
      const { customerCacheService } = await import('../services/customerCacheService');
      
      // Try to get from cache first
      let foundCustomer: Customer | null = customerCacheService.getCachedCustomer(customerId) || null;
      
      if (foundCustomer) {
        console.log('✅ Kunde aus Cache gefunden:', foundCustomer.name);
      } else {
        console.log('🔄 Versuche Kunde direkt zu laden...');
        
        // Try to load customer directly using getCustomer method which handles both ID and customerNumber
        foundCustomer = await googleSheetsService.getCustomer(customerId);
        
        if (foundCustomer) {
          console.log('✅ Kunde gefunden:', foundCustomer.name, 'ID:', foundCustomer.id, 'Nummer:', foundCustomer.customerNumber);
          // Cache the customer if found
          customerCacheService.cacheCustomer(foundCustomer);
        } else {
          console.error('❌ Kunde nicht gefunden für ID/Nummer:', customerId);
          
          // Fallback: Load all customers (nur für Debug)
          console.log('🔍 Fallback: Lade alle Kunden für Debug...');
          const customersData = await googleSheetsService.getCustomers();
          console.log(`📊 ${customersData.length} Kunden in Datenbank gefunden`);
          console.log('Vorhandene Kundennummern (erste 10):', customersData.map(c => c.customerNumber).slice(0, 10));
        }
      }
      
      if (foundCustomer) {
        setCustomer(foundCustomer);
        setEditedCustomer(foundCustomer);
        
        // Lade zusätzliche Daten parallel (mit Fallback)
        try {
          const [allQuotes, allInvoices] = await Promise.all([
            googleSheetsService.getQuotes().catch(() => []),
            googleSheetsService.getInvoices().catch(() => [])
          ]);
          
          const quotesData = allQuotes.filter(q => q.customerId === customerId);
          const invoicesData = allInvoices.filter(i => i.customerId === customerId);
          
          setQuotes(quotesData);
          setInvoices(invoicesData);
        } catch (additionalDataError) {
          console.warn('Fehler beim Laden zusätzlicher Daten:', additionalDataError);
          setQuotes([]);
          setInvoices([]);
        }
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

  const handleEditToggle = () => {
    if (editMode) {
      // Cancel edit
      setEditedCustomer(customer);
      setEditMode(false);
    } else {
      // Enter edit mode
      setEditMode(true);
      setTabValue(0); // Switch to info tab
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    if (!editedCustomer) return;
    
    const fields = field.split('.');
    if (fields.length === 1) {
      setEditedCustomer({ ...editedCustomer, [field]: value });
    } else if (fields.length === 2 && fields[0] === 'apartment') {
      setEditedCustomer({
        ...editedCustomer,
        apartment: {
          ...editedCustomer.apartment,
          [fields[1]]: value
        }
      });
    }
  };

  const handleSave = async () => {
    if (!editedCustomer) return;
    
    setSaving(true);
    try {
      await googleSheetsService.updateCustomer(editedCustomer.id, editedCustomer);
      
      setCustomer(editedCustomer);
      setEditMode(false);
      setSnackbar({ open: true, message: 'Änderungen gespeichert!', severity: 'success' });
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      setSnackbar({ open: true, message: 'Fehler beim Speichern', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCustomerUpdate = async (updates: Partial<Customer>) => {
    if (!customer) return;
    
    const updatedCustomer = { ...customer, ...updates };
    
    try {
      await googleSheetsService.updateCustomer(customer.id, updatedCustomer);
      
      setCustomer(updatedCustomer);
      setEditedCustomer(updatedCustomer);
      setSnackbar({ open: true, message: 'Änderungen gespeichert!', severity: 'success' });
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      setSnackbar({ open: true, message: 'Fehler beim Speichern', severity: 'error' });
    }
  };

  const calculateCustomerStats = () => {
    const totalQuotes = quotes.length;
    const acceptedQuotes = quotes.filter(q => q.status === 'accepted').length;
    let totalRevenue = quotes
      .filter(q => q.status === 'accepted' || q.status === 'invoiced')
      .reduce((sum, q) => sum + q.price, 0);

    // Parse Umsatz aus Notizen falls keine Quotes vorhanden
    if (totalRevenue === 0 && customer?.notes) {
      const umsatzMatch = customer.notes.match(/Umsatz:\s*([\d,.]+)€/);
      if (umsatzMatch) {
        totalRevenue = parseFloat(umsatzMatch[1].replace(',', '.'));
      }
    }

    const conversionRate = totalQuotes > 0 ? (acceptedQuotes / totalQuotes) * 100 : 0;

    return { totalQuotes, acceptedQuotes, totalRevenue, conversionRate };
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Stack spacing={3}>
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
            </Grid>
          </Grid>
        </Stack>
      </Container>
    );
  }

  if (!customer || !editedCustomer) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          Kunde nicht gefunden (ID: {customerId})
        </Alert>
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
    emails: (('total' in emailStats ? emailStats.total : emailStats.totalMessages) + linkedEmailsCount)
  };

  return (
    <>
      <Container maxWidth="xl" sx={{ mt: { xs: 0, md: 3 }, mb: { xs: 10, md: 4 }, px: { xs: 0, sm: 3 } }}>
        {/* Header Section */}
        <Box sx={{ mb: 3, px: { xs: 2, sm: 0 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
            <IconButton 
              onClick={navigateBack} 
              sx={{ 
                bgcolor: 'background.paper',
                boxShadow: 1,
                '&:hover': {
                  bgcolor: 'background.paper',
                  boxShadow: 2,
                }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            
            <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 600, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
              Kundendetails
            </Typography>
            
            <DarkModeToggle showTooltip={!isMobile} />
            
            {editMode ? (
              <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' }, width: { xs: '100%', sm: 'auto' } }}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}
                  fullWidth={isMobile}
                  size={isMobile ? 'medium' : 'medium'}
                >
                  Speichern
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleEditToggle}
                  fullWidth={isMobile}
                  size={isMobile ? 'medium' : 'medium'}
                >
                  Abbrechen
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' }, width: { xs: '100%', sm: 'auto' } }}>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleEditToggle}
                  fullWidth={isMobile}
                  size={isMobile ? 'medium' : 'medium'}
                >
                  Bearbeiten
                </Button>
                <ShareCustomerButton customer={customer} />
                <DispositionLinkButton customer={customer} />
              </Box>
            )}
          </Box>
        </Box>

        {/* Customer Overview Card */}
        <Card 
          elevation={0}
          sx={{ 
            mb: 3, 
            mx: { xs: 2, sm: 0 },
            bgcolor: darkMode ? 'grey.900' : 'grey.50',
            border: `1px solid ${theme.palette.divider}`,
            overflow: 'hidden'
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            <Grid container spacing={{ xs: 2, sm: 3 }} alignItems="center">
              <Grid item xs={12} sm={12} md={8}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, sm: 3 }, flexDirection: { xs: 'column', sm: 'row' }, textAlign: { xs: 'center', sm: 'left' } }}>
                  <Avatar
                    sx={{
                      width: { xs: 80, sm: 60, md: 80 },
                      height: { xs: 80, sm: 60, md: 80 },
                      fontSize: { xs: '2rem', sm: '1.5rem', md: '2rem' },
                      bgcolor: theme.palette.primary.main,
                      color: 'primary.contrastText'
                    }}
                  >
                    {customer.name.charAt(0).toUpperCase()}
                  </Avatar>
                  
                  <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
                      {customer.name}
                    </Typography>
                    
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                      {customer.phone && (
                        <Chip
                          icon={<PhoneIcon />}
                          label={customer.phone}
                          size="small"
                          onClick={() => window.open(`tel:${customer.phone}`, '_self')}
                          sx={{ cursor: 'pointer' }}
                        />
                      )}
                      {customer.email && (
                        <Chip
                          icon={<EmailIcon />}
                          label={customer.email}
                          size="small"
                          onClick={() => setTabValue(5)}
                          sx={{ cursor: 'pointer' }}
                        />
                      )}
                      {customer.movingDate && (
                        <Chip
                          icon={<CalendarIcon />}
                          label={new Date(customer.movingDate).toLocaleDateString('de-DE')}
                          size="small"
                        />
                      )}
                    </Stack>
                  </Box>
                </Box>
              </Grid>

              {/* Customer Phase Dropdown */}
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                    Status:
                  </Typography>
                  <CustomerPhaseDropdown
                    customerId={customer.id}
                    currentPhase={customer.currentPhase}
                    onPhaseChange={(newPhase: CustomerPhase) => {
                      setCustomer({ ...customer, currentPhase: newPhase });
                    }}
                    variant="dropdown"
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={12} md={4}>
                <Grid container spacing={2} sx={{ mt: { xs: 2, sm: 2, md: 0 } }}>
                  <Grid item xs={6}>
                    <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.1) }}>
                      <CardContent sx={{ textAlign: 'center', p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="h4" color="success.main" sx={{ fontWeight: 700, fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2.125rem' } }}>
                          €{stats.totalRevenue.toFixed(0)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          Gesamtumsatz
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card sx={{ bgcolor: alpha(theme.palette.info.main, 0.1) }}>
                      <CardContent sx={{ textAlign: 'center', p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="h4" color="info.main" sx={{ fontWeight: 700, fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2.125rem' } }}>
                          {stats.conversionRate.toFixed(0)}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          Erfolgsquote
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            
            {/* Quick Actions */}
            {!editMode && (
              <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 2 }} flexWrap="wrap" useFlexGap>
                  <Button
                    variant="contained"
                    startIcon={<DescriptionIcon />}
                    onClick={() => navigate(`/create-quote/${customer.id}`, { state: { customer } })}
                    size="small"
                    fullWidth={isMobile}
                    sx={{ minHeight: { xs: 44, sm: 36 } }}
                  >
                    Neues Angebot
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<LocationIcon />}
                    onClick={() => setRoutePlannerOpen(true)}
                    disabled={!customer.fromAddress || !customer.toAddress}
                    size="small"
                    fullWidth={isMobile}
                    disableRipple
                    disableElevation
                    sx={{
                      minHeight: { xs: 44, sm: 36 },
                      background: 'linear-gradient(135deg, #5a6b7e 0%, #8b5a6b 35%, #c97979 70%, #e89090 100%) !important',
                      color: '#ffffff !important',
                      border: 'none !important',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a6b7e 0%, #8b5a6b 35%, #c97979 70%, #e89090 100%) !important',
                        backgroundColor: 'transparent !important',
                      },
                      '&::before': {
                        display: 'none !important',
                      },
                      '&::after': {
                        display: 'none !important',
                      },
                      '& .MuiTouchRipple-root': {
                        display: 'none !important',
                      }
                    }}
                  >
                    Route planen
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AddAPhotoIcon />}
                    onClick={() => setTabValue(2)}
                    size="small"
                    fullWidth={isMobile}
                    disableRipple
                    disableElevation
                    sx={{
                      minHeight: { xs: 44, sm: 36 },
                      background: 'linear-gradient(135deg, #5a6b7e 0%, #8b5a6b 35%, #c97979 70%, #e89090 100%) !important',
                      color: '#ffffff !important',
                      border: 'none !important',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a6b7e 0%, #8b5a6b 35%, #c97979 70%, #e89090 100%) !important',
                        backgroundColor: 'transparent !important',
                      },
                      '&::before': {
                        display: 'none !important',
                      },
                      '&::after': {
                        display: 'none !important',
                      },
                      '& .MuiTouchRipple-root': {
                        display: 'none !important',
                      }
                    }}
                  >
                    Fotos hinzufügen
                  </Button>
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Main Content */}
        <Paper 
          elevation={0} 
          sx={{ 
            bgcolor: 'background.paper',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: { xs: 0, sm: 2 },
            overflow: 'hidden',
            mx: { xs: 0, sm: 0 }
          }}
        >
          {isMobile ? (
            // Mobile: Show current tab and button to open drawer
            <Box sx={{ 
              p: 2, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              borderBottom: 1,
              borderColor: 'divider'
            }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {[
                  'Informationen',
                  'Tags & Notizen',
                  'Fotos',
                  `Angebote (${tabCount.quotes})`,
                  `Rechnungen (${tabCount.invoices})`,
                  `E-Mails (${tabCount.emails})`
                ][tabValue]}
              </Typography>
              <Button 
                endIcon={<ArrowBackIcon sx={{ transform: 'rotate(-90deg)' }} />}
                onClick={() => setMobileTabsDrawerOpen(true)}
                size="small"
              >
                Wechseln
              </Button>
            </Box>
          ) : (
            // Desktop: Regular tabs
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  '& .MuiTabs-indicator': {
                    height: 3,
                  },
                  '& .MuiTab-root': {
                    minHeight: 56,
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  },
                  '& .Mui-selected': {
                    fontWeight: 700,
                  }
                }}
              >
                <Tab label="Informationen" />
                <Tab label="Tags & Notizen" />
                <Tab label="Fotos" disabled={editMode} />
                <Tab label="Angebote" icon={<Chip size="small" label={tabCount.quotes} />} iconPosition="end" disabled={editMode} />
                <Tab label="Rechnungen" icon={<Chip size="small" label={tabCount.invoices} />} iconPosition="end" disabled={editMode} />
                <Tab label="E-Mails" icon={<Chip size="small" label={tabCount.emails} />} iconPosition="end" disabled={editMode} />
                <Tab label="Dateien" disabled={editMode} />
                <Tab label="PDF-Angebote" disabled={editMode} />
              </Tabs>
            </Box>
          )}

          {/* Tab Panels */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              {/* <SalesStatus
                customer={customer}
                onUpdate={(updatedFields) => {
                  // Update local state immediately
                  if (updatedFields) {
                    const updatedCustomer = { ...customer, ...updatedFields };
                    setCustomer(updatedCustomer);
                    setEditedCustomer(updatedCustomer);
                  }
                  // Then reload data from server in background
                  loadCustomerData();
                }}
              /> */}
              <CustomerInfo
                customer={customer}
                editedCustomer={editedCustomer}
                editMode={editMode}
                onFieldChange={handleFieldChange}
                isMobile={isMobile}
                onEditNotes={() => setEditMode(true)}
              />
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              <CustomerTagsAndNotes
                customer={customer}
                onUpdate={handleCustomerUpdate}
                readOnly={false}
              />
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              <CustomerPhotos customer={customer} />
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              <CustomerQuotes 
                quotes={quotes} 
                customer={customer} 
                onTabChange={setTabValue}
              />
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              <CustomerInvoicesMultiCompany 
                invoices={invoices} 
                customer={customer} 
                quotes={quotes}
              />
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={5}>
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              <CustomerCommunication customer={customer} />
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={6}>
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              <CustomerFileManager customerId={customer.id} />
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={7}>
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              <OfferManager
                customerId={customer.id}
                onOfferCreated={loadCustomerData}
              />
            </Box>
          </TabPanel>
        </Paper>
      </Container>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Route Planner Dialog */}
      {customer && (
        <RoutePlanner
          open={routePlannerOpen}
          onClose={() => setRoutePlannerOpen(false)}
          customer={customer}
        />
      )}
    </>
  );
};

export default CustomerDetails;