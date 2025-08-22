'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Avatar,
  useTheme,
  Skeleton,
  Fade,
  Tooltip,
  Menu,
  MenuItem,
  LinearProgress,
  Fab,
  Grid,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Stack
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Description as DescriptionIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Sort as SortIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  Euro as EuroIcon
} from '@mui/icons-material';
import { Customer } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { supabaseService } from '@/lib/services/supabase';
import { useToast } from '@/components/ui/Toaster';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#a72608', // Rufous
      light: '#d4471c',
      dark: '#821e06',
    },
    secondary: {
      main: '#bbc5aa', // Ash Gray
      light: '#d1dbbf',
      dark: '#a5af94',
    },
    background: {
      default: '#e6eed6', // Beige
      paper: '#dde2c6', // Beige-2
    },
    text: {
      primary: '#090c02', // Smoky Black
      secondary: '#bbc5aa',
    },
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
    h4: { fontWeight: 800, letterSpacing: '-0.02em' },
    h6: { fontWeight: 600, letterSpacing: '-0.01em' },
  },
  shape: { borderRadius: 20 },
});

const MotionCard = motion(Card);

// Customer Card Component
const CustomerCard: React.FC<{
  customer: Customer;
  index: number;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCreateQuote: () => void;
}> = ({ customer, index, onClick, onEdit, onDelete, onCreateQuote }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'reached':
        return '#bbc5aa';
      case 'pending':
        return '#a72608';
      case 'cancelled':
        return '#090c02';
      default:
        return '#bbc5aa';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return '#a72608';
      case 'medium':
        return '#dde2c6';
      case 'low':
        return '#bbc5aa';
      default:
        return '#bbc5aa';
    }
  };

  return (
    <MotionCard
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 1.2, 
        delay: index * 0.2,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{ 
        y: -8, 
        scale: 1.02,
        transition: { duration: 0.8, ease: "easeOut" }
      }}
      sx={{
        cursor: 'pointer',
        background: 'rgba(221, 226, 198, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(187, 197, 170, 0.3)',
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 1.0s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        '&:hover': {
          background: 'rgba(230, 238, 214, 0.95)',
          borderColor: 'rgba(167, 38, 8, 0.4)',
          boxShadow: '0 20px 40px rgba(167, 38, 8, 0.2)',
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header with Avatar and Actions */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }} onClick={onClick}>
            <Avatar
              sx={{
                background: `linear-gradient(135deg, ${getStatusColor(customer.status || 'active')} 0%, #e6eed6 100%)`,
                color: '#090c02',
                mr: 2,
                width: 56,
                height: 56,
                fontWeight: 700,
                boxShadow: '0 8px 25px rgba(167, 38, 8, 0.2)',
              }}
            >
              {getInitials(customer.name)}
            </Avatar>
            
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" sx={{ 
                mb: 0.5, 
                fontWeight: 700,
                color: '#090c02'
              }} noWrap>
                {customer.name}
              </Typography>
              
              {customer.company && (
                <Typography variant="body2" sx={{ color: '#bbc5aa', mb: 0.5 }} noWrap>
                  {customer.company}
                </Typography>
              )}
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LocationIcon fontSize="small" sx={{ color: '#a72608' }} />
                <Typography variant="body2" sx={{ color: '#090c02', opacity: 0.8 }} noWrap>
                  {customer.fromAddress || 'Keine Adresse'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon fontSize="small" sx={{ color: '#a72608' }} />
                <Typography variant="body2" sx={{ color: '#090c02', opacity: 0.8 }}>
                  {formatDate(customer.movingDate)}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <IconButton 
            onClick={(e) => {
              e.stopPropagation();
              setAnchorEl(e.currentTarget);
            }}
            size="small"
            sx={{
              backgroundColor: 'rgba(187, 197, 170, 0.2)',
              color: '#090c02',
              '&:hover': {
                backgroundColor: 'rgba(167, 38, 8, 0.1)',
                transform: 'scale(1.1)',
              }
            }}
          >
            <MoreVertIcon />
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={() => { onClick(); setAnchorEl(null); }}>
              <ViewIcon sx={{ mr: 1, color: '#bbc5aa' }} fontSize="small" />
              Ansehen
            </MenuItem>
            <MenuItem onClick={() => { onEdit(); setAnchorEl(null); }}>
              <EditIcon sx={{ mr: 1, color: '#a72608' }} fontSize="small" />
              Bearbeiten
            </MenuItem>
            <MenuItem onClick={() => { onCreateQuote(); setAnchorEl(null); }}>
              <DescriptionIcon sx={{ mr: 1, color: '#bbc5aa' }} fontSize="small" />
              Angebot erstellen
            </MenuItem>
            <MenuItem onClick={() => { onDelete(); setAnchorEl(null); }} sx={{ color: '#a72608' }}>
              <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
              Löschen
            </MenuItem>
          </Menu>
        </Box>
        
        {/* Status and Service Chips */}
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
          {customer.status && (
            <Chip
              label={customer.status}
              size="small"
              sx={{
                backgroundColor: getStatusColor(customer.status),
                color: '#e6eed6',
                fontWeight: 600,
                fontSize: '0.75rem'
              }}
            />
          )}
          
          {customer.priority && (
            <Chip
              label={`${customer.priority} Priorität`}
              size="small"
              sx={{
                backgroundColor: getPriorityColor(customer.priority),
                color: '#090c02',
                fontWeight: 600,
                fontSize: '0.75rem'
              }}
            />
          )}
          
          {customer.services && customer.services.length > 0 && (
            <Chip
              label={`${customer.services.length} Services`}
              size="small"
              variant="outlined"
              sx={{
                borderColor: '#bbc5aa',
                color: '#090c02',
                fontSize: '0.75rem'
              }}
            />
          )}

          {customer.volume && (
            <Chip
              label={`${customer.volume}m³`}
              size="small"
              variant="outlined"
              sx={{
                borderColor: '#a72608',
                color: '#a72608',
                fontSize: '0.75rem'
              }}
            />
          )}
        </Stack>
        
        {/* Contact Actions */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {customer.phone && (
            <Tooltip title={`Anrufen: ${customer.phone}`}>
              <IconButton
                size="small"
                href={`tel:${customer.phone}`}
                sx={{ 
                  background: 'linear-gradient(135deg, #bbc5aa 0%, #e6eed6 100%)',
                  color: '#090c02',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    boxShadow: '0 4px 12px rgba(187, 197, 170, 0.4)',
                  }
                }}
              >
                <PhoneIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          {customer.email && (
            <Tooltip title={`E-Mail: ${customer.email}`}>
              <IconButton
                size="small"
                href={`mailto:${customer.email}`}
                sx={{ 
                  background: 'linear-gradient(135deg, #a72608 0%, #dde2c6 100%)',
                  color: '#e6eed6',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    boxShadow: '0 4px 12px rgba(167, 38, 8, 0.4)',
                  }
                }}
              >
                <EmailIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
            {customer.customerNumber && (
              <Typography variant="caption" sx={{ 
                color: '#090c02', 
                opacity: 0.7,
                fontFamily: 'monospace'
              }}>
                #{customer.customerNumber}
              </Typography>
            )}
          </Box>
        </Box>
        
        {/* Notes Preview */}
        {customer.notes && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(187, 197, 170, 0.3)' }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#090c02',
                opacity: 0.8,
                fontStyle: 'italic',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              "{customer.notes}"
            </Typography>
          </Box>
        )}
      </CardContent>
    </MotionCard>
  );
};

// Main CustomersList Component
const CustomersPage: React.FC = () => {
  const router = useRouter();
  const { addToast } = useToast();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);

  // Filter and sort customers
  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = customers;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term) ||
        customer.phone.toLowerCase().includes(term) ||
        customer.company?.toLowerCase().includes(term) ||
        customer.fromAddress.toLowerCase().includes(term) ||
        customer.toAddress.toLowerCase().includes(term) ||
        customer.notes?.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(customer => customer.status === filterStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.movingDate || '').getTime();
          bValue = new Date(b.movingDate || '').getTime();
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [customers, searchTerm, sortBy, sortOrder, filterStatus]);

  // Load customers from Supabase
  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      await supabaseService.initialize();
      const data = await supabaseService.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
      addToast({
        type: 'error',
        title: 'Fehler',
        message: 'Kunden konnten nicht geladen werden',
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleCustomerClick = (customer: Customer) => {
    router.push(`/customers/${customer.id}`);
  };

  const handleEditCustomer = (customer: Customer) => {
    router.push(`/customers/${customer.id}/edit`);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setCustomerToDelete(customer.id);
    setDeleteDialogOpen(true);
  };

  const handleCreateQuote = (customer: Customer) => {
    router.push(`/quotes/new?customerId=${customer.id}`);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;
    
    try {
      await supabaseService.deleteCustomer(customerToDelete);
      setCustomers(prev => prev.filter(c => c.id !== customerToDelete));
      addToast({
        type: 'success',
        title: 'Erfolg',
        message: 'Kunde wurde gelöscht',
      });
    } catch (error) {
      console.error('Error deleting customer:', error);
      addToast({
        type: 'error',
        title: 'Fehler',
        message: 'Kunde konnte nicht gelöscht werden',
      });
    } finally {
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

  const handleSort = (field: 'name' | 'date' | 'status') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Loading skeleton
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
            <LinearProgress sx={{ mb: 3, borderRadius: 2 }} />
            <Typography variant="h4" gutterBottom sx={{ color: '#090c02', fontWeight: 800 }}>
              Kunden werden geladen...
            </Typography>
            <Grid container spacing={3}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Grid item xs={12} sm={6} lg={4} key={i}>
                  <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 4 }} />
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
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

        {/* Video Overlay */}
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

        {/* Main Content */}
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 20, pt: 4, pb: 6 }}>
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 4,
              p: 3,
              background: 'linear-gradient(135deg, rgba(221, 226, 198, 0.9) 0%, rgba(187, 197, 170, 0.85) 100%)',
              backdropFilter: 'blur(25px)',
              borderRadius: 4,
              border: '1px solid rgba(187, 197, 170, 0.4)',
            }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#090c02', mb: 1 }}>
                  🔍 Kunde suchen ({filteredAndSortedCustomers.length})
                </Typography>
                <Typography variant="body1" sx={{ color: '#bbc5aa' }}>
                  KI-gestützte Kundensuche mit erweiterten Filtern
                </Typography>
              </Box>
              
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => router.push('/new-customer')}
                size="large"
                sx={{
                  background: 'linear-gradient(135deg, #a72608 0%, #bbc5aa 100%)',
                  color: '#e6eed6',
                  fontWeight: 600,
                  borderRadius: 3,
                  boxShadow: '0 8px 25px rgba(167, 38, 8, 0.3)',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 12px 35px rgba(167, 38, 8, 0.4)',
                  }
                }}
              >
                Neuer Kunde
              </Button>
            </Box>
          </motion.div>

          {/* Search and Filter Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
          >
            <Box sx={{ 
              mb: 4,
              p: 2,
              background: 'linear-gradient(135deg, rgba(221, 226, 198, 0.9) 0%, rgba(187, 197, 170, 0.85) 100%)',
              backdropFilter: 'blur(25px)',
              borderRadius: 4,
              border: '1px solid rgba(187, 197, 170, 0.4)',
            }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    placeholder="🤖 KI-Suche: Namen, E-Mail, Telefon, Adresse, Notizen, Firmen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: '#a72608' }} />
                        </InputAdornment>
                      ),
                      endAdornment: searchTerm && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setSearchTerm('')}>
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: {
                        backgroundColor: 'rgba(230, 238, 214, 0.8)',
                        borderRadius: 3,
                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { 
                          border: '2px solid #a72608' 
                        },
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<FilterIcon />}
                    sx={{
                      borderColor: '#bbc5aa',
                      color: '#090c02',
                      '&:hover': {
                        borderColor: '#a72608',
                        backgroundColor: 'rgba(167, 38, 8, 0.1)',
                      }
                    }}
                  >
                    Filter: {filterStatus === 'all' ? 'Alle' : filterStatus}
                  </Button>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<SortIcon />}
                    endIcon={sortOrder === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
                    onClick={() => handleSort('name')}
                    sx={{
                      borderColor: '#bbc5aa',
                      color: '#090c02',
                      '&:hover': {
                        borderColor: '#a72608',
                        backgroundColor: 'rgba(167, 38, 8, 0.1)',
                      }
                    }}
                  >
                    Sort: {sortBy}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </motion.div>

          {/* Customer Cards Grid */}
          {filteredAndSortedCustomers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.0, delay: 1.0 }}
            >
              <Alert 
                severity="info" 
                sx={{ 
                  mb: 3,
                  background: 'rgba(221, 226, 198, 0.9)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(187, 197, 170, 0.4)',
                  color: '#090c02'
                }}
              >
                {searchTerm ? 'Keine Kunden gefunden' : 'Noch keine Kunden vorhanden'}
              </Alert>
            </motion.div>
          ) : (
            <Grid container spacing={3}>
              <AnimatePresence>
                {filteredAndSortedCustomers.map((customer, index) => (
                  <Grid item xs={12} sm={6} lg={4} key={customer.id}>
                    <CustomerCard
                      customer={customer}
                      index={index}
                      onClick={() => handleCustomerClick(customer)}
                      onEdit={() => handleEditCustomer(customer)}
                      onDelete={() => handleDeleteCustomer(customer)}
                      onCreateQuote={() => handleCreateQuote(customer)}
                    />
                  </Grid>
                ))}
              </AnimatePresence>
            </Grid>
          )}

          {/* Floating Action Button */}
          <Fab
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 30,
              background: 'linear-gradient(135deg, #a72608 0%, #bbc5aa 100%)',
              color: '#e6eed6',
              boxShadow: '0 15px 35px rgba(167, 38, 8, 0.4)',
              border: '1px solid rgba(187, 197, 170, 0.3)',
              transition: 'all 1.0s cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': {
                transform: 'scale(1.2) rotate(15deg)',
                boxShadow: '0 25px 55px rgba(167, 38, 8, 0.6)',
                background: 'linear-gradient(135deg, #d4471c 0%, #d1dbbf 100%)',
                transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
              }
            }}
            onClick={() => router.push('/new-customer')}
          >
            <AddIcon />
          </Fab>
        </Container>

        {/* Delete Confirmation Dialog */}
        <Dialog 
          open={deleteDialogOpen} 
          onClose={() => setDeleteDialogOpen(false)}
          PaperProps={{
            sx: {
              background: 'rgba(221, 226, 198, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(187, 197, 170, 0.4)',
            }
          }}
        >
          <DialogTitle sx={{ color: '#090c02' }}>Kunde löschen</DialogTitle>
          <DialogContent>
            <Typography sx={{ color: '#090c02' }}>
              Sind Sie sicher, dass Sie diesen Kunden löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setDeleteDialogOpen(false)}
              sx={{ color: '#bbc5aa' }}
            >
              Abbrechen
            </Button>
            <Button 
              onClick={confirmDelete} 
              variant="contained"
              sx={{
                backgroundColor: '#a72608',
                '&:hover': { backgroundColor: '#821e06' }
              }}
            >
              Löschen
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default CustomersPage;