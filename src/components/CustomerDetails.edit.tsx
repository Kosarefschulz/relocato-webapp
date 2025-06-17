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
  Snackbar
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  PhotoCamera as PhotoCameraIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Description as DescriptionIcon,
  Receipt as ReceiptIcon,
  LocationOn as LocationIcon,
  AddAPhoto as AddAPhotoIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { Customer, Quote, Invoice } from '../types';
import { databaseService as googleSheetsService } from '../config/database.config';
import emailHistoryService from '../services/emailHistoryService';
import CustomerInfo from './CustomerInfo';
import CustomerPhotos from './CustomerPhotos';
import CustomerCommunication from './CustomerCommunication';
import CustomerQuotes from './CustomerQuotes';
import CustomerInvoices from './CustomerInvoices';
import CustomerTagsAndNotes from './CustomerTagsAndNotes';
import DarkModeToggle from './DarkModeToggle';
import RoutePlanner from './RoutePlanner';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';

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
      {value === index && (
        <Box sx={{ py: { xs: 2, md: 3 } }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const CustomerDetails: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const theme = useTheme();
  const { darkMode } = useCustomTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
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

  // E-Mail-Statistiken für Tab-Counter
  const emailStats = React.useMemo(() => {
    if (!customer?.id) return { totalMessages: 0, sentMessages: 0, receivedMessages: 0, activeThreads: 0 };
    try {
      return emailHistoryService.getEmailStats();
    } catch {
      return { totalMessages: 0, sentMessages: 0, receivedMessages: 0, activeThreads: 0 };
    }
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
    
    try {
      setLoading(true);
      
      // Lade Kundendaten
      const customersData = await googleSheetsService.getCustomers();
      const foundCustomer = customersData.find(c => c.id === customerId);
      
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
      } else {
        // Versuche als Fallback einen Demo-Kunden zu erstellen
        const demoCustomer: Customer = {
          id: customerId,
          name: 'Demo Kunde',
          email: 'demo@kunde.de',
          phone: '0521 12345678',
          fromAddress: 'Musterstraße 1, 33602 Bielefeld',
          toAddress: 'Neue Straße 10, 33605 Bielefeld',
          movingDate: new Date().toISOString().split('T')[0],
          apartment: {
            rooms: 3,
            area: 80,
            floor: 2,
            hasElevator: true
          },
          services: [],
          notes: 'Demo-Kunde für Testzwecke'
        };
        
        setCustomer(demoCustomer);
        setEditedCustomer(demoCustomer);
        setQuotes([]);
        setInvoices([]);
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
      const success = await googleSheetsService.updateCustomer(editedCustomer.id, editedCustomer);
      
      if (success) {
        setCustomer(editedCustomer);
        setSnackbar({ open: true, message: 'Änderungen gespeichert!', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Fehler beim Speichern', severity: 'error' });
      }
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
      const success = await googleSheetsService.updateCustomer(customer.id, updatedCustomer);
      
      if (success) {
        setCustomer(updatedCustomer);
        setEditedCustomer(updatedCustomer);
        setSnackbar({ open: true, message: 'Änderungen gespeichert!', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Fehler beim Speichern', severity: 'error' });
      }
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      setSnackbar({ open: true, message: 'Fehler beim Speichern', severity: 'error' });
    }
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

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ mb: 2 }}>
          <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2 }} />
        </Box>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 2, borderRadius: 2 }} />
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Skeleton variant="rectangular" height={100} sx={{ flex: 1, borderRadius: 2 }} />
          <Skeleton variant="rectangular" height={100} sx={{ flex: 1, borderRadius: 2 }} />
        </Box>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
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
    emails: 'total' in emailStats ? emailStats.total : emailStats.totalMessages
  };

  return (
    <>
      <Container maxWidth="lg" sx={{ mt: { xs: 0, md: 4 }, mb: { xs: 10, md: 4 }, px: { xs: 0, sm: 2 } }}>
        {/* Hero Section */}
        <HeroSection
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          sx={{
            background: darkMode 
              ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.3)} 0%, ${alpha(theme.palette.secondary.main, 0.3)} 100%)`
              : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.9)} 0%, ${alpha(theme.palette.secondary.main, 0.9)} 100%)`,
            borderRadius: { xs: 0, md: 3 },
            p: { xs: 2, md: 4 },
            mb: { xs: 0, md: 3 },
            position: 'relative',
            overflow: 'hidden',
            color: darkMode ? theme.palette.text.primary : 'white',
            backdropFilter: 'blur(20px)',
            boxShadow: { xs: 'none', md: theme.shadows[10] },
            border: darkMode ? `1px solid ${theme.palette.divider}` : 'none',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton 
                onClick={navigateBack} 
                sx={{ 
                  color: darkMode ? theme.palette.text.primary : 'white',
                  mr: 2,
                  backgroundColor: alpha(theme.palette.common.white, darkMode ? 0.05 : 0.1),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.common.white, darkMode ? 0.1 : 0.2),
                  }
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              {isMobile && (
                <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
                  Kundendetails
                </Typography>
              )}
            </Box>
            
            {/* Controls */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <DarkModeToggle showTooltip={!isMobile} />
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <IconButton
                  onClick={handleEditToggle}
                  sx={{
                    color: darkMode ? theme.palette.text.primary : 'white',
                    backgroundColor: editMode 
                      ? alpha(theme.palette.success.main, 0.2)
                      : alpha(theme.palette.common.white, darkMode ? 0.05 : 0.1),
                    '&:hover': {
                      backgroundColor: editMode 
                        ? alpha(theme.palette.success.main, 0.3)
                        : alpha(theme.palette.common.white, darkMode ? 0.1 : 0.2),
                    }
                  }}
                >
                  {editMode ? <SaveIcon /> : <EditIcon />}
                </IconButton>
              </motion.div>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: { xs: 'center', md: 'flex-start' } }}>
            {/* Avatar */}
            <Avatar
              sx={{
                width: { xs: 80, md: 120 },
                height: { xs: 80, md: 120 },
                fontSize: { xs: '2rem', md: '3rem' },
                backgroundColor: alpha(theme.palette.common.white, darkMode ? 0.1 : 0.2),
                border: `3px solid ${alpha(theme.palette.common.white, darkMode ? 0.2 : 0.3)}`,
                boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.2)}`
              }}
            >
              {editedCustomer.name.charAt(0).toUpperCase()}
            </Avatar>

            {/* Customer Info */}
            <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
              {editMode ? (
                <TextField
                  value={editedCustomer.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  variant="standard"
                  sx={{
                    '& .MuiInput-input': {
                      fontSize: { xs: '1.75rem', md: '2.125rem' },
                      fontWeight: 700,
                      color: darkMode ? theme.palette.text.primary : 'white',
                    },
                    '& .MuiInput-underline:before': {
                      borderBottomColor: alpha(theme.palette.common.white, darkMode ? 0.3 : 0.5),
                    },
                    '& .MuiInput-underline:hover:before': {
                      borderBottomColor: alpha(theme.palette.common.white, darkMode ? 0.5 : 0.7),
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: theme.palette.success.main,
                    },
                  }}
                  fullWidth
                />
              ) : (
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
                  {customer.name}
                </Typography>
              )}
            </Box>

            {/* Stats Cards */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Card sx={{ 
                backgroundColor: alpha(theme.palette.common.white, darkMode ? 0.05 : 0.15),
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.common.white, darkMode ? 0.1 : 0.3)}`,
                color: darkMode ? theme.palette.text.primary : 'white',
                minWidth: 120,
              }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
                    €{stats.totalRevenue.toFixed(0)}
                  </Typography>
                  <Typography variant="caption">Umsatz</Typography>
                </CardContent>
              </Card>

              <Card sx={{ 
                backgroundColor: alpha(theme.palette.common.white, darkMode ? 0.05 : 0.15),
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.common.white, darkMode ? 0.1 : 0.3)}`,
                color: darkMode ? theme.palette.text.primary : 'white',
                minWidth: 120,
              }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
                    {stats.conversionRate.toFixed(0)}%
                  </Typography>
                  <Typography variant="caption">Erfolg</Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </HeroSection>

        {/* Quick Actions Bar */}
        {!editMode && (
          <Box sx={{ mb: 3 }}>
            <Paper 
              elevation={2}
              sx={{ 
                p: 2,
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.background.paper, 0.95),
                backdropFilter: 'blur(20px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}
            >
              <Typography variant="h6" gutterBottom>
                Schnellaktionen
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<PhoneIcon />}
                  onClick={() => window.open(`tel:${customer.phone}`, '_self')}
                  disabled={!customer.phone}
                  sx={{ textTransform: 'none' }}
                >
                  Anrufen
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<EmailIcon />}
                  onClick={() => setTabValue(4)} // Switch to email tab
                  disabled={!customer.email}
                  sx={{ textTransform: 'none' }}
                >
                  E-Mail schreiben
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DescriptionIcon />}
                  onClick={() => navigate(`/create-quote/${customer.id}`, { state: { customer } })}
                  sx={{ textTransform: 'none' }}
                >
                  Angebot erstellen
                </Button>
                {customer.fromAddress && customer.toAddress && (
                  <Button
                    variant="outlined"
                    startIcon={<LocationIcon />}
                    onClick={() => setRoutePlannerOpen(true)}
                    sx={{ textTransform: 'none' }}
                  >
                    Route planen
                  </Button>
                )}
                <Button
                  variant="outlined"
                  startIcon={<AddAPhotoIcon />}
                  onClick={() => setTabValue(1)} // Switch to photos tab
                  sx={{ textTransform: 'none' }}
                >
                  Fotos hochladen
                </Button>
              </Box>
            </Paper>
          </Box>
        )}

        {/* Tabs */}
        <Paper 
          elevation={0} 
          sx={{ 
            backgroundColor: alpha(theme.palette.background.paper, darkMode ? 0.95 : 0.95),
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            borderRadius: { xs: 0, md: 2 },
            overflow: 'hidden',
            boxShadow: { xs: theme.shadows[1], md: theme.shadows[4] },
          }}
        >
          <Box sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: theme.palette.background.paper
          }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0'
                },
                '& .MuiTab-root': {
                  minHeight: { xs: 56, md: 64 },
                  textTransform: 'none',
                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                  fontWeight: 500,
                  px: { xs: 1, md: 2 },
                },
                '& .Mui-selected': {
                  fontWeight: 700,
                }
              }}
            >
              <Tab label="Info" />
              <Tab label="Tags & Notizen" />
              <Tab label="Fotos" disabled={editMode} />
              <Tab label={`Angebote (${tabCount.quotes})`} disabled={editMode} />
              <Tab label={`Rechnung (${tabCount.invoices})`} disabled={editMode} />
              <Tab label={`Emails (${tabCount.emails})`} disabled={editMode} />
            </Tabs>
          </Box>

          {/* Tab Panels */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ p: { xs: 2, md: 3 } }}>
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
              <CustomerInvoices 
                invoices={invoices} 
                customer={customer} 
              />
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={5}>
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              <CustomerCommunication customer={customer} />
            </Box>
          </TabPanel>
        </Paper>
      </Container>

      {/* Save Notification */}
      <Snackbar
        open={saving}
        autoHideDuration={2000}
        onClose={() => setSaving(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSaving(false)}>
          Änderungen gespeichert
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