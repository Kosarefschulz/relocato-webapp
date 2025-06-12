import React, { useState, useEffect } from 'react';
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
  Grid,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Badge,
  Alert,
  Skeleton,
  useTheme,
  useMediaQuery,
  alpha,
  TextField,
  Switch,
  FormControlLabel,
  Snackbar,
  Zoom,
  Grow,
  Collapse,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Description as DescriptionIcon,
  PhotoCamera as PhotoCameraIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
  Info as InfoIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckIcon,
  Cancel as CrossIcon,
  Schedule as ScheduleIcon,
  PictureAsPdf as PdfIcon,
  WhatsApp as WhatsAppIcon,
  MoreVert as MoreIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  EmojiEvents as TrophyIcon,
  Add as AddIcon,
  KeyboardArrowUp as ArrowUpIcon,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Customer, Quote, Invoice, EmailHistory } from '../types';
import { googleSheetsPublicService as googleSheetsService } from '../services/googleSheetsPublic';
import CustomerPhotos from './CustomerPhotos';
import DarkModeToggle from './DarkModeToggle';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';

// Styled Components
const HeroSection = motion(Box);
const AnimatedCard = motion(Card);
const SwipeableTabPanel = motion.div;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
  onSwipe: (direction: number) => void;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, onSwipe, ...other } = props;
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100) {
      if (info.offset.x > 0) {
        onSwipe(-1);
      } else {
        onSwipe(1);
      }
    }
  };

  return (
    <AnimatePresence mode="wait">
      {value === index && (
        <SwipeableTabPanel
          key={index}
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -300 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          style={{ x, opacity }}
          role="tabpanel"
          {...other}
        >
          <Box sx={{ py: { xs: 2, md: 3 } }}>
            {children}
          </Box>
        </SwipeableTabPanel>
      )}
    </AnimatePresence>
  );
}

// Status-Konfiguration
const quoteStatusConfig = {
  draft: { color: 'default', icon: <EditIcon />, label: 'Entwurf' },
  sent: { color: 'info', icon: <EmailIcon />, label: 'Gesendet' },
  accepted: { color: 'success', icon: <CheckIcon />, label: 'Angenommen' },
  rejected: { color: 'error', icon: <CancelIcon />, label: 'Abgelehnt' },
  invoiced: { color: 'warning', icon: <ReceiptIcon />, label: 'Berechnet' }
} as const;

const emailStatusConfig = {
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
  const { darkMode } = useCustomTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [editedCustomer, setEditedCustomer] = useState<Customer | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [emails, setEmails] = useState<EmailHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

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
    // Check if we're coming from edit route
    const currentPath = window.location.pathname;
    if (currentPath.includes('/edit-customer/')) {
      setEditMode(true);
      setTabValue(0); // Go to info tab for editing
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-save with debounce
  useEffect(() => {
    if (editMode && editedCustomer && customer && JSON.stringify(editedCustomer) !== JSON.stringify(customer)) {
      const timer = setTimeout(() => {
        handleSave();
      }, 1500); // Auto-save nach 1.5 Sekunden

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editedCustomer]);

  const loadCustomerData = async () => {
    if (!customerId) return;
    
    try {
      setLoading(true);
      const [customersData, quotesData, invoicesData, emailsData] = await Promise.all([
        googleSheetsService.getCustomers(),
        googleSheetsService.getQuotesByCustomerId(customerId),
        googleSheetsService.getInvoicesByCustomerId(customerId),
        googleSheetsService.getEmailHistoryByCustomerId(customerId)
      ]);

      const foundCustomer = customersData.find(c => c.id === customerId);
      if (foundCustomer) {
        setCustomer(foundCustomer);
        setEditedCustomer(foundCustomer);
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

  const handleSwipe = (direction: number) => {
    const newValue = tabValue + direction;
    if (newValue >= 0 && newValue <= 4) {
      setTabValue(newValue);
    }
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
      // Save to service
      const success = await googleSheetsService.updateCustomer(editedCustomer.id, editedCustomer);
      
      if (success) {
        // Update local state
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
    { 
      icon: <PhoneIcon />, 
      name: 'Anrufen', 
      action: () => {
        if (customer?.phone) {
          window.location.href = `tel:${customer.phone}`;
        } else {
          setSnackbar({ open: true, message: 'Keine Telefonnummer verfügbar', severity: 'warning' });
        }
      }
    },
    { 
      icon: <EmailIcon />, 
      name: 'Email senden', 
      action: () => {
        if (customer?.email) {
          const subject = encodeURIComponent(`Betreff: Ihr Umzug am ${customer.movingDate}`);
          const body = encodeURIComponent(`Sehr geehrte/r ${customer.name},\n\n`);
          window.location.href = `mailto:${customer.email}?subject=${subject}&body=${body}`;
        } else {
          setSnackbar({ open: true, message: 'Keine E-Mail-Adresse verfügbar', severity: 'warning' });
        }
      }
    },
    { 
      icon: <WhatsAppIcon />, 
      name: 'WhatsApp', 
      action: () => {
        if (customer?.phone) {
          const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
          const message = encodeURIComponent(`Hallo ${customer.name}, wir möchten uns bezüglich Ihres Umzugs am ${customer.movingDate} bei Ihnen melden.`);
          window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
        } else {
          setSnackbar({ open: true, message: 'Keine Telefonnummer für WhatsApp verfügbar', severity: 'warning' });
        }
      }
    },
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      <Container maxWidth="lg" sx={{ mt: { xs: 0, md: 4 }, mb: { xs: 10, md: 4 }, px: { xs: 0, sm: 2 } }}>
        {/* Hero Section mit Glassmorphism */}
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
            transition: 'all 0.3s ease',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: darkMode 
                ? 'radial-gradient(circle at 20% 80%, rgba(96, 165, 250, 0.1) 0%, transparent 50%)'
                : 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.2) 0%, transparent 50%)',
              pointerEvents: 'none'
            }
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
            
            {/* Edit Mode Toggle */}
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
            {/* Avatar mit Pulse Animation */}
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                boxShadow: [
                  `0 0 0 0 ${alpha(theme.palette.common.white, 0.7)}`,
                  `0 0 0 10px ${alpha(theme.palette.common.white, 0)}`,
                  `0 0 0 0 ${alpha(theme.palette.common.white, 0)}`
                ]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                times: [0, 0.5, 1]
              }}
              style={{ borderRadius: '50%' }}
            >
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
            </motion.div>

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
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: { xs: 'center', md: 'flex-start' }, mb: 2, mt: editMode ? 2 : 0 }}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Chip 
                    icon={<TrophyIcon />} 
                    label={stats.conversionRate > 50 ? 'Premium' : 'Standard'} 
                    sx={{ 
                      backgroundColor: alpha(theme.palette.common.white, darkMode ? 0.1 : 0.2),
                      color: darkMode ? theme.palette.text.primary : 'white',
                      fontWeight: 600,
                      '& .MuiChip-icon': { color: darkMode ? theme.palette.text.primary : 'white' }
                    }} 
                  />
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Chip 
                    icon={<TimeIcon />} 
                    label={`${Math.floor(Math.random() * 12 + 1)} Monate`}
                    sx={{ 
                      backgroundColor: alpha(theme.palette.common.white, darkMode ? 0.1 : 0.2),
                      color: darkMode ? theme.palette.text.primary : 'white',
                      fontWeight: 600,
                      '& .MuiChip-icon': { color: darkMode ? theme.palette.text.primary : 'white' }
                    }} 
                  />
                </motion.div>
              </Box>
            </Box>

            {/* Stats Cards */}
            <Box 
              sx={{ 
                display: 'flex', 
                gap: 2, 
                overflowX: { xs: 'auto', md: 'visible' },
                pb: { xs: 2, md: 0 },
                px: { xs: 2, md: 0 },
                width: { xs: '100%', md: 'auto' },
                justifyContent: { xs: 'flex-start', md: 'flex-end' },
                '&::-webkit-scrollbar': { height: 4 },
                '&::-webkit-scrollbar-thumb': { 
                  backgroundColor: alpha(theme.palette.common.white, 0.3),
                  borderRadius: 2
                }
              }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Card sx={{ 
                  backgroundColor: alpha(theme.palette.common.white, darkMode ? 0.05 : 0.15),
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.common.white, darkMode ? 0.1 : 0.3)}`,
                  color: darkMode ? theme.palette.text.primary : 'white',
                  minWidth: 120,
                  boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.1)}`
                }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
                      €{stats.totalRevenue.toFixed(0)}
                    </Typography>
                    <Typography variant="caption">Umsatz</Typography>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Card sx={{ 
                  backgroundColor: alpha(theme.palette.common.white, darkMode ? 0.05 : 0.15),
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.common.white, darkMode ? 0.1 : 0.3)}`,
                  color: darkMode ? theme.palette.text.primary : 'white',
                  minWidth: 120,
                  boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.1)}`
                }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
                      {stats.conversionRate.toFixed(0)}%
                    </Typography>
                    <Typography variant="caption">Erfolg</Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Box>
          </Box>

          {/* Edit Mode Indicator */}
          <Collapse in={editMode}>
            <Alert 
              severity="info" 
              sx={{ 
                mt: 2,
                backgroundColor: alpha(theme.palette.info.main, 0.1),
                color: darkMode ? theme.palette.text.primary : 'white',
                '& .MuiAlert-icon': {
                  color: darkMode ? theme.palette.info.main : 'white',
                }
              }}
            >
              Bearbeitungsmodus aktiv - Änderungen werden automatisch gespeichert
            </Alert>
          </Collapse>
        </HeroSection>

        {/* Premium Tabs */}
        <Paper 
          elevation={0} 
          sx={{ 
            backgroundColor: alpha(theme.palette.background.paper, darkMode ? 0.95 : 0.95),
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            borderRadius: { xs: 0, md: 2 },
            overflow: 'hidden',
            boxShadow: { xs: theme.shadows[1], md: theme.shadows[4] },
            transition: 'all 0.3s ease',
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
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <InfoIcon sx={{ fontSize: { xs: 18, md: 20 } }} />
                    <span>Info</span>
                  </Box>
                }
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PhotoCameraIcon sx={{ fontSize: { xs: 18, md: 20 } }} />
                    <span>Fotos</span>
                  </Box>
                }
                disabled={editMode}
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <DescriptionIcon sx={{ fontSize: { xs: 18, md: 20 } }} />
                    <span>Angebote</span>
                    {tabCount.quotes > 0 && (
                      <Badge badgeContent={tabCount.quotes} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: 10 } }} />
                    )}
                  </Box>
                }
                disabled={editMode}
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ReceiptIcon sx={{ fontSize: { xs: 18, md: 20 } }} />
                    <span>Rechnung</span>
                    {tabCount.invoices > 0 && (
                      <Badge badgeContent={tabCount.invoices} color="warning" sx={{ '& .MuiBadge-badge': { fontSize: 10 } }} />
                    )}
                  </Box>
                }
                disabled={editMode}
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <EmailIcon sx={{ fontSize: { xs: 18, md: 20 } }} />
                    <span>Emails</span>
                    {tabCount.emails > 0 && (
                      <Badge badgeContent={tabCount.emails} color="success" sx={{ '& .MuiBadge-badge': { fontSize: 10 } }} />
                    )}
                  </Box>
                }
                disabled={editMode}
              />
            </Tabs>
          </Box>

          {/* Swipe Hint for Mobile */}
          {isMobile && !editMode && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              p: 1, 
              backgroundColor: alpha(theme.palette.primary.main, 0.05) 
            }}>
              <Typography variant="caption" color="text.secondary">
                ← Wischen für Navigation →
              </Typography>
            </Box>
          )}

          {/* Tab Panels */}
          <TabPanel value={tabValue} index={0} onSwipe={!editMode ? handleSwipe : () => {}}>
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              <Grid container spacing={2}>
                {/* Kontaktdaten */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <AnimatedCard
                    whileHover={!isMobile && !editMode ? { y: -4, boxShadow: theme.shadows[8] } : {}}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    sx={{ height: '100%' }}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon /> Kontakt
                      </Typography>
                      <List sx={{ pt: 0 }}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1) }}>
                              <PhoneIcon color="primary" />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary="Telefon"
                            secondary={
                              editMode ? (
                                <TextField
                                  value={editedCustomer.phone}
                                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                                  variant="standard"
                                  fullWidth
                                  sx={{ mt: 0.5 }}
                                />
                              ) : (
                                <Typography 
                                  component="a"
                                  href={`tel:${customer.phone}`}
                                  sx={{ 
                                    color: 'primary.main',
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                    '&:hover': { textDecoration: 'underline' }
                                  }}
                                >
                                  {customer.phone}
                                </Typography>
                              )
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
                            secondary={
                              editMode ? (
                                <TextField
                                  value={editedCustomer.email}
                                  onChange={(e) => handleFieldChange('email', e.target.value)}
                                  variant="standard"
                                  fullWidth
                                  type="email"
                                  sx={{ mt: 0.5 }}
                                />
                              ) : customer.email
                            }
                          />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1) }}>
                              <CalendarIcon color="primary" />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary="Umzugstermin"
                            secondary={
                              editMode ? (
                                <TextField
                                  value={editedCustomer.movingDate}
                                  onChange={(e) => handleFieldChange('movingDate', e.target.value)}
                                  variant="standard"
                                  fullWidth
                                  type="date"
                                  sx={{ mt: 0.5 }}
                                />
                              ) : (
                                <Typography component="span" sx={{ fontWeight: 600 }}>
                                  {new Date(customer.movingDate).toLocaleDateString('de-DE', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </Typography>
                              )
                            }
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </AnimatedCard>
                </Grid>

                {/* Adressen */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <AnimatedCard
                    whileHover={!isMobile && !editMode ? { y: -4, boxShadow: theme.shadows[8] } : {}}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    sx={{ height: '100%' }}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationIcon /> Umzugsroute
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Box sx={{ mb: 3 }}>
                            <Chip label="Von" size="small" color="primary" sx={{ mb: 1 }} />
                            {editMode ? (
                              <TextField
                                value={editedCustomer.fromAddress}
                                onChange={(e) => handleFieldChange('fromAddress', e.target.value)}
                                variant="outlined"
                                fullWidth
                                multiline
                                rows={2}
                              />
                            ) : (
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {customer.fromAddress}
                              </Typography>
                            )}
                          </Box>
                        </motion.div>
                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.4 }}
                        >
                          <Box>
                            <Chip label="Nach" size="small" color="success" sx={{ mb: 1 }} />
                            {editMode ? (
                              <TextField
                                value={editedCustomer.toAddress}
                                onChange={(e) => handleFieldChange('toAddress', e.target.value)}
                                variant="outlined"
                                fullWidth
                                multiline
                                rows={2}
                              />
                            ) : (
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {customer.toAddress}
                              </Typography>
                            )}
                          </Box>
                        </motion.div>
                      </Box>
                    </CardContent>
                  </AnimatedCard>
                </Grid>

                {/* Wohnungsdetails */}
                <Grid size={12}>
                  <AnimatedCard
                    whileHover={!isMobile && !editMode ? { y: -4, boxShadow: theme.shadows[8] } : {}}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HomeIcon /> Wohnungsdetails
                      </Typography>
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <Box sx={{ 
                            textAlign: 'center', 
                            p: 2, 
                            borderRadius: 2, 
                            backgroundColor: alpha(theme.palette.primary.main, 0.05),
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                          }}>
                            {editMode ? (
                              <TextField
                                value={editedCustomer.apartment?.rooms || ''}
                                onChange={(e) => handleFieldChange('apartment.rooms', parseInt(e.target.value) || 0)}
                                type="number"
                                variant="standard"
                                sx={{ 
                                  width: '60px',
                                  '& input': { textAlign: 'center', fontSize: '2rem', fontWeight: 700 }
                                }}
                              />
                            ) : (
                              <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                                {customer.apartment?.rooms || '-'}
                              </Typography>
                            )}
                            <Typography variant="body2" color="text.secondary">
                              Zimmer
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <Box sx={{ 
                            textAlign: 'center', 
                            p: 2, 
                            borderRadius: 2, 
                            backgroundColor: alpha(theme.palette.primary.main, 0.05),
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                          }}>
                            {editMode ? (
                              <TextField
                                value={editedCustomer.apartment?.area || ''}
                                onChange={(e) => handleFieldChange('apartment.area', parseInt(e.target.value) || 0)}
                                type="number"
                                variant="standard"
                                sx={{ 
                                  width: '80px',
                                  '& input': { textAlign: 'center', fontSize: '2rem', fontWeight: 700 }
                                }}
                              />
                            ) : (
                              <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                                {customer.apartment?.area || '-'}
                              </Typography>
                            )}
                            <Typography variant="body2" color="text.secondary">
                              m² Fläche
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <Box sx={{ 
                            textAlign: 'center', 
                            p: 2, 
                            borderRadius: 2, 
                            backgroundColor: alpha(theme.palette.primary.main, 0.05),
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                          }}>
                            {editMode ? (
                              <TextField
                                value={editedCustomer.apartment?.floor || 0}
                                onChange={(e) => handleFieldChange('apartment.floor', parseInt(e.target.value) || 0)}
                                type="number"
                                variant="standard"
                                sx={{ 
                                  width: '60px',
                                  '& input': { textAlign: 'center', fontSize: '2rem', fontWeight: 700 }
                                }}
                              />
                            ) : (
                              <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                                {customer.apartment?.floor || 'EG'}
                              </Typography>
                            )}
                            <Typography variant="body2" color="text.secondary">
                              Etage
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <Box sx={{ 
                            textAlign: 'center', 
                            p: 2, 
                            borderRadius: 2, 
                            backgroundColor: alpha(theme.palette.primary.main, 0.05),
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                          }}>
                            {editMode ? (
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={editedCustomer.apartment?.hasElevator || false}
                                    onChange={(e) => handleFieldChange('apartment.hasElevator', e.target.checked)}
                                    color="success"
                                  />
                                }
                                label={editedCustomer.apartment?.hasElevator ? 'Ja' : 'Nein'}
                              />
                            ) : (
                              <Chip
                                icon={customer.apartment?.hasElevator ? <CheckIcon /> : <CrossIcon />}
                                label={customer.apartment?.hasElevator ? 'Aufzug' : 'Kein Aufzug'}
                                color={customer.apartment?.hasElevator ? 'success' : 'default'}
                                sx={{ fontWeight: 600, width: '100%' }}
                              />
                            )}
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </AnimatedCard>
                </Grid>

                {/* Notizen */}
                <Grid size={12}>
                  <AnimatedCard
                    whileHover={!isMobile && !editMode ? { y: -4, boxShadow: theme.shadows[8] } : {}}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        Notizen
                      </Typography>
                      {editMode ? (
                        <TextField
                          value={editedCustomer.notes || ''}
                          onChange={(e) => handleFieldChange('notes', e.target.value)}
                          variant="outlined"
                          fullWidth
                          multiline
                          rows={4}
                          placeholder="Notizen zum Kunden hinzufügen..."
                        />
                      ) : (
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                          {customer.notes || 'Keine Notizen vorhanden'}
                        </Typography>
                      )}
                    </CardContent>
                  </AnimatedCard>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1} onSwipe={!editMode ? handleSwipe : () => {}}>
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              <CustomerPhotos customer={customer} />
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2} onSwipe={!editMode ? handleSwipe : () => {}}>
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              {quotes.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <motion.div
                    animate={{ 
                      y: [0, -10, 0],
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <DescriptionIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  </motion.div>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Noch keine Angebote vorhanden
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/create-quote', { state: { customer } })}
                    sx={{ mt: 2 }}
                    size="large"
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
                        whileHover={!isMobile ? { y: -4, boxShadow: theme.shadows[8] } : {}}
                        whileTap={{ scale: 0.98 }}
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

                          <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                            <Button size="small" startIcon={<PdfIcon />} variant="outlined" fullWidth={isMobile}>
                              PDF
                            </Button>
                            <Button size="small" startIcon={<EmailIcon />} variant="outlined" fullWidth={isMobile}>
                              Senden
                            </Button>
                            {quote.status === 'accepted' && (
                              <Button size="small" startIcon={<ReceiptIcon />} variant="contained" color="success" fullWidth>
                                Rechnung erstellen
                              </Button>
                            )}
                          </Box>
                        </CardContent>
                      </AnimatedCard>
                    </Grid>
                  ))}
                  
                  {/* Add New Quote Card */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        sx={{
                          height: '100%',
                          minHeight: 200,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          border: `2px dashed ${theme.palette.divider}`,
                          backgroundColor: alpha(theme.palette.primary.main, 0.02),
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.05),
                            borderColor: theme.palette.primary.main,
                          }
                        }}
                        onClick={() => navigate('/create-quote', { state: { customer } })}
                      >
                        <CardContent sx={{ textAlign: 'center' }}>
                          <AddIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                          <Typography variant="h6" color="text.secondary">
                            Neues Angebot
                          </Typography>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                </Grid>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={3} onSwipe={!editMode ? handleSwipe : () => {}}>
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <ReceiptIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                </motion.div>
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
                    size="large"
                  >
                    Rechnung aus Angebot erstellen
                  </Button>
                )}
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={4} onSwipe={!editMode ? handleSwipe : () => {}}>
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              {emails.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <EmailIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  </motion.div>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Noch keine Emails gesendet
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<EmailIcon />}
                    sx={{ mt: 2 }}
                    size="large"
                  >
                    Email senden
                  </Button>
                </Box>
              ) : (
                <List sx={{ px: 0 }}>
                  {emails.map((email, index) => (
                    <React.Fragment key={email.id}>
                      {index > 0 && <Divider />}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <ListItem
                          sx={{
                            py: 2,
                            px: { xs: 1, md: 2 },
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
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
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
                                  {email.sentAt.toLocaleDateString('de-DE')} • {email.sentAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
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
                                      {email.attachments.length} Anhang
                                    </Typography>
                                  </Box>
                                )}
                              </>
                            }
                          />
                          <ListItemSecondaryAction>
                            <IconButton edge="end" size={isMobile ? "small" : "medium"}>
                              <MoreIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      </motion.div>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          </TabPanel>
        </Paper>
      </Container>

      {/* Floating Speed Dial for Mobile */}
      <AnimatePresence>
        {(isMobile || isTablet) && !editMode && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <SpeedDial
              ariaLabel="Quick Actions"
              sx={{ 
                position: 'fixed', 
                bottom: 70, 
                right: 16,
                '& .MuiSpeedDial-fab': {
                  backgroundColor: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  }
                }
              }}
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
                  tooltipOpen
                  onClick={() => {
                    action.action();
                    setSpeedDialOpen(false);
                  }}
                />
              ))}
            </SpeedDial>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            style={{
              position: 'fixed',
              bottom: isMobile ? 140 : 30,
              right: 16,
              zIndex: 1000
            }}
          >
            <IconButton
              onClick={scrollToTop}
              sx={{
                backgroundColor: alpha(theme.palette.primary.main, 0.9),
                color: 'white',
                '&:hover': {
                  backgroundColor: theme.palette.primary.main,
                },
                boxShadow: theme.shadows[4]
              }}
            >
              <ArrowUpIcon />
            </IconButton>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Snackbar for save notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </>
  );
};

export default CustomerDetails;