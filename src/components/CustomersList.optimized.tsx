import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  alpha,
  Skeleton,
  Fade,
  Tooltip,
  Checkbox,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  Upload as UploadIcon,
  ContentCopy as ContentCopyIcon,
  Description as DescriptionIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Delete as DeleteIcon,
  Sort as SortIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import { Customer } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { animations } from '../styles/modernTheme';
import { formatDate } from '../utils/dateUtils';
import { paginationService } from '../services/paginationService';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { databaseService } from '../config/database.config';
import { cleanPhoneNumber } from '../utils/phoneUtils';

// Motion components
const MotionCard = motion(Card);
const MotionBox = motion(Box);

// Skeleton loader for initial load
const CustomerSkeleton = () => (
  <Card sx={{ mb: 2 }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="40%" height={20} />
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Skeleton variant="rectangular" width={100} height={32} />
        <Skeleton variant="rectangular" width={120} height={32} />
        <Skeleton variant="rectangular" width={80} height={32} />
      </Box>
    </CardContent>
  </Card>
);

const CustomersListOptimized: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  // State management
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [displayedCustomers, setDisplayedCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'movingDate' | 'created'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportData, setExportData] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [totalCustomers, setTotalCustomers] = useState(0);

  // Load initial customers
  useEffect(() => {
    loadInitialCustomers();
    
    // Subscribe to new customers
    const unsubscribe = paginationService.subscribeToNewCustomers((newCustomers) => {
      if (newCustomers.length > 0) {
        setCustomers(prev => [...newCustomers, ...prev]);
        setTotalCustomers(prev => prev + newCustomers.length);
      }
    }, { since: new Date() });

    return () => {
      unsubscribe();
      paginationService.cleanup();
    };
  }, []);

  const loadInitialCustomers = async () => {
    setLoading(true);
    try {
      const result = await paginationService.loadInitialCustomers({
        pageSize: 100, // Load first 100 customers
        orderByField: 'createdAt',
        orderDirection: 'desc'
      });

      setCustomers(result.data);
      setDisplayedCustomers(result.data);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
      setTotalCustomers(result.totalLoaded);
      
      // Preload total count in background
      getTotalCount();
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreCustomers = useCallback(async () => {
    if (!hasMore || loadingMore || !lastDoc) return;

    setLoadingMore(true);
    try {
      const result = await paginationService.loadMoreCustomers(lastDoc, {
        pageSize: 50,
        orderByField: 'createdAt',
        orderDirection: 'desc'
      });

      if (result.data.length > 0) {
        setCustomers(prev => [...prev, ...result.data]);
        setLastDoc(result.lastDoc);
        setHasMore(result.hasMore);
        setTotalCustomers(prev => prev + result.data.length);
      }
    } catch (error) {
      console.error('Error loading more customers:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, lastDoc]);

  // Get total count for display
  const getTotalCount = async () => {
    try {
      const allCustomers = await databaseService.getCustomers();
      setTotalCustomers(allCustomers.length);
    } catch (error) {
      console.error('Error getting total count:', error);
    }
  };

  // Infinite scroll hook
  const loadMoreRef = useInfiniteScroll({
    loading: loadingMore,
    hasMore,
    onLoadMore: loadMoreCustomers,
    threshold: 0.8,
    rootMargin: '100px'
  });

  // Filter and sort customers
  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = customers;

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = customers.filter(customer => 
        customer.name.toLowerCase().includes(search) ||
        customer.id.includes(search) ||
        customer.email.toLowerCase().includes(search) ||
        customer.phone?.includes(search) ||
        customer.fromAddress?.toLowerCase().includes(search) ||
        customer.toAddress?.toLowerCase().includes(search)
      );
    }

    // Apply sorting
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case 'movingDate':
          const movingA = a.movingDate ? new Date(a.movingDate).getTime() : 0;
          const movingB = b.movingDate ? new Date(b.movingDate).getTime() : 0;
          comparison = movingA - movingB;
          break;
        case 'created':
          const createdA = a.customerNumber ? parseInt(a.customerNumber.replace(/\D/g, '')) : 0;
          const createdB = b.customerNumber ? parseInt(b.customerNumber.replace(/\D/g, '')) : 0;
          comparison = createdB - createdA;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [customers, searchTerm, sortBy, sortOrder]);

  // Update displayed customers when filtered list changes
  useEffect(() => {
    setDisplayedCustomers(filteredAndSortedCustomers);
  }, [filteredAndSortedCustomers]);

  const handleSelectCustomer = (customer: Customer) => {
    navigate(`/customer-details/${customer.id}`);
  };

  const handleCreateQuote = (customer: Customer) => {
    navigate('/create-quote', { state: { customer } });
  };

  const handleToggleSelect = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === displayedCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(displayedCustomers.map(c => c.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedCustomers.length === 0) return;

    if (window.confirm(`Möchten Sie wirklich ${selectedCustomers.length} Kunden löschen?`)) {
      try {
        for (const customerId of selectedCustomers) {
          await databaseService.deleteCustomer(customerId);
        }
        
        // Remove from local state
        setCustomers(prev => prev.filter(c => !selectedCustomers.includes(c.id)));
        setSelectedCustomers([]);
        setSelectMode(false);
        
        setSnackbarMessage(`${selectedCustomers.length} Kunden gelöscht`);
        setSnackbarOpen(true);
      } catch (error) {
        console.error('Fehler beim Löschen:', error);
        setSnackbarMessage('Fehler beim Löschen der Kunden');
        setSnackbarOpen(true);
      }
    }
  };

  const handleExport = () => {
    const data = displayedCustomers.map(customer => ({
      'Kundennummer': customer.id,
      'Name': customer.name,
      'Email': customer.email,
      'Telefon': customer.phone || '',
      'Von Adresse': customer.fromAddress || '',
      'Nach Adresse': customer.toAddress || '',
      'Umzugsdatum': customer.movingDate || '',
      'Wohnfläche': customer.apartment?.area || '',
      'Zimmer': customer.apartment?.rooms || '',
      'Stockwerk': customer.apartment?.floor || '',
      'Aufzug': customer.apartment?.hasElevator ? 'Ja' : 'Nein',
      'Erstellt am': formatDate(customer.createdAt)
    }));

    const csvContent = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    setExportData(csvContent);
    setExportDialogOpen(true);
  };

  const downloadCSV = () => {
    const blob = new Blob([exportData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `kunden_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportDialogOpen(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(exportData);
    setSnackbarMessage('Daten in Zwischenablage kopiert!');
    setSnackbarOpen(true);
    setExportDialogOpen(false);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            Kundenliste
          </Typography>
          <Chip 
            label={`${displayedCustomers.length} von ${totalCustomers} Kunden`}
            color="primary"
            sx={{ mr: 2 }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/new-customer')}
          >
            Neuer Kunde
          </Button>
        </Box>

        {/* Search and Actions Bar */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Suche nach Name, E-Mail, Telefon oder Adresse..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Tooltip title="Sortierung">
            <IconButton onClick={(e) => setSortAnchorEl(e.currentTarget)}>
              <SortIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Auswahl-Modus">
            <IconButton 
              onClick={() => {
                setSelectMode(!selectMode);
                setSelectedCustomers([]);
              }}
              color={selectMode ? 'primary' : 'default'}
            >
              <Checkbox />
            </IconButton>
          </Tooltip>

          <Tooltip title="Exportieren">
            <IconButton onClick={handleExport}>
              <UploadIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Selection Actions */}
        {selectMode && (
          <Fade in={selectMode}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
              <Checkbox
                checked={selectedCustomers.length === displayedCustomers.length && displayedCustomers.length > 0}
                indeterminate={selectedCustomers.length > 0 && selectedCustomers.length < displayedCustomers.length}
                onChange={handleSelectAll}
              />
              <Typography variant="body2">
                {selectedCustomers.length} ausgewählt
              </Typography>
              {selectedCustomers.length > 0 && (
                <Button
                  size="small"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteSelected}
                  color="error"
                >
                  Löschen
                </Button>
              )}
            </Box>
          </Fade>
        )}
      </Box>

      {/* Progress indicator for loading more */}
      {loadingMore && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1200 }}>
          <LinearProgress />
        </Box>
      )}

      {/* Customer List */}
      {loading ? (
        // Show skeletons during initial load
        <Box>
          {[1, 2, 3, 4, 5].map((i) => (
            <CustomerSkeleton key={i} />
          ))}
        </Box>
      ) : displayedCustomers.length === 0 ? (
        <Alert severity="info">
          {searchTerm 
            ? 'Keine Kunden gefunden. Versuchen Sie eine andere Suche.'
            : 'Noch keine Kunden vorhanden. Erstellen Sie Ihren ersten Kunden!'}
        </Alert>
      ) : (
        <AnimatePresence mode="popLayout">
          {displayedCustomers.map((customer, index) => (
            <MotionCard
              key={customer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
              custom={Math.min(index, 10)} // Only animate first 10 items
              sx={{ 
                mb: 2, 
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[4],
                },
              }}
              onClick={() => !selectMode && handleSelectCustomer(customer)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  {selectMode && (
                    <Checkbox
                      checked={selectedCustomers.includes(customer.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleToggleSelect(customer.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      sx={{ mr: 2 }}
                    />
                  )}
                  
                  <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
                    {customer.name.charAt(0).toUpperCase()}
                  </Avatar>
                  
                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" component="div">
                        {customer.name}
                      </Typography>
                      <Chip 
                        label={customer.customerNumber || customer.id}
                        size="small"
                        sx={{ ml: 2 }}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1 }}>
                      {customer.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <EmailIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {customer.email}
                          </Typography>
                        </Box>
                      )}
                      
                      {customer.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PhoneIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            component="a"
                            href={`tel:${cleanPhoneNumber(customer.phone)}`}
                            onClick={(e) => e.stopPropagation()}
                            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                          >
                            {customer.phone}
                          </Typography>
                        </Box>
                      )}
                      
                      {customer.movingDate && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            Umzug: {formatDate(customer.movingDate)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    
                    {(customer.fromAddress || customer.toAddress) && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <LocationIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {customer.fromAddress && `Von: ${customer.fromAddress}`}
                          {customer.fromAddress && customer.toAddress && ' → '}
                          {customer.toAddress && `Nach: ${customer.toAddress}`}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Angebot erstellen">
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateQuote(customer);
                        }}
                      >
                        <DescriptionIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </MotionCard>
          ))}
        </AnimatePresence>
      )}

      {/* Load more indicator */}
      <Box ref={loadMoreRef} sx={{ height: 50, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {loadingMore && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary">
              Lade weitere Kunden...
            </Typography>
          </Box>
        )}
        {!hasMore && displayedCustomers.length > 0 && (
          <Typography variant="body2" color="text.secondary">
            Alle Kunden geladen
          </Typography>
        )}
      </Box>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortAnchorEl}
        open={Boolean(sortAnchorEl)}
        onClose={() => setSortAnchorEl(null)}
      >
        <MenuItem 
          onClick={() => {
            setSortBy('created');
            setSortOrder('desc');
            setSortAnchorEl(null);
          }}
          selected={sortBy === 'created'}
        >
          <ListItemIcon>
            {sortBy === 'created' && (sortOrder === 'desc' ? <ArrowDownwardIcon /> : <ArrowUpwardIcon />)}
          </ListItemIcon>
          <ListItemText>Neueste zuerst</ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => {
            setSortBy('name');
            setSortOrder('asc');
            setSortAnchorEl(null);
          }}
          selected={sortBy === 'name'}
        >
          <ListItemIcon>
            {sortBy === 'name' && (sortOrder === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />)}
          </ListItemIcon>
          <ListItemText>Name (A-Z)</ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => {
            setSortBy('movingDate');
            setSortOrder('asc');
            setSortAnchorEl(null);
          }}
          selected={sortBy === 'movingDate'}
        >
          <ListItemIcon>
            {sortBy === 'movingDate' && (sortOrder === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />)}
          </ListItemIcon>
          <ListItemText>Umzugsdatum</ListItemText>
        </MenuItem>
      </Menu>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Kundendaten exportieren</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            {displayedCustomers.length} Kunden werden exportiert:
          </Typography>
          <TextField
            multiline
            rows={10}
            fullWidth
            value={exportData}
            variant="outlined"
            sx={{ mt: 2, fontFamily: 'monospace', fontSize: '0.8rem' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={copyToClipboard} startIcon={<ContentCopyIcon />}>
            Kopieren
          </Button>
          <Button onClick={downloadCSV} variant="contained" startIcon={<UploadIcon />}>
            Als CSV herunterladen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default CustomersListOptimized;