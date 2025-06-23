import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  LinearProgress,
  CircularProgress,
  Fab,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemButton,
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Upload as UploadIcon,
  ContentCopy as ContentCopyIcon,
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
} from '@mui/icons-material';
import { Customer } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate } from '../utils/dateUtils';
import { paginationService } from '../services/paginationService';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useVirtualizedList } from '../hooks/useVirtualizedList';
import { databaseService } from '../config/database.config';
import { customerCacheService } from '../services/customerCacheService';
import { cleanPhoneNumber } from '../utils/phoneUtils';
import MobileLayout from './MobileLayout';
import CustomerCard from './CustomerCard';
import { useMobileLayout } from '../hooks/useMobileLayout';
import { collection, getCountFromServer } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useDebounce } from '../hooks/useDebounce';

// Motion components
const MotionCard = motion(Card);

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

// Customer row component for virtualization
const CustomerRow = React.memo(({ 
  customer, 
  style, 
  onClick, 
  onHover,
  onCreateQuote,
  selectMode,
  isSelected,
  onToggleSelect,
  isMobile
}: {
  customer: Customer;
  style: React.CSSProperties;
  onClick: () => void;
  onHover: () => void;
  onCreateQuote: () => void;
  selectMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  isMobile: boolean;
}) => {
  const theme = useTheme();
  
  if (isMobile) {
    return (
      <Box style={style} sx={{ px: 2 }}>
        <Box sx={{ position: 'relative' }}>
          {selectMode && (
            <Box sx={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}>
              <Checkbox
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleSelect();
                }}
              />
            </Box>
          )}
          <Box sx={{ pl: selectMode ? 6 : 0 }}>
            <CustomerCard
              customer={customer}
              onClick={() => !selectMode && onClick()}
              index={0}
            />
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box style={style} sx={{ px: 3 }}>
      <MotionCard
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        sx={{ 
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[4],
          },
        }}
        onClick={() => !selectMode && onClick()}
        onMouseEnter={onHover}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
            {selectMode && (
              <Checkbox
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleSelect();
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
                {customer.createdAt && (
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ ml: 'auto' }}
                  >
                    Importiert: {formatDate(customer.createdAt)}
                  </Typography>
                )}
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
                    onCreateQuote();
                  }}
                >
                  <DescriptionIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </CardContent>
      </MotionCard>
    </Box>
  );
});

CustomerRow.displayName = 'CustomerRow';

const CustomersListPerformance: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { isMobile, isSmallMobile, spacing, titleVariant } = useMobileLayout();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State management
  const [customers, setCustomers] = useState<Customer[]>([]);
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
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [containerHeight, setContainerHeight] = useState(600);

  // Debounced search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Update container height
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const availableHeight = window.innerHeight - rect.top - (isMobile ? 80 : 20);
        setContainerHeight(Math.max(400, availableHeight));
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [isMobile]);

  // Load initial customers
  useEffect(() => {
    loadInitialCustomers();
    
    // Subscribe to new customers
    const unsubscribe = paginationService.subscribeToNewCustomers((newCustomers) => {
      if (newCustomers.length > 0) {
        setCustomers(prev => {
          const updated = [...newCustomers, ...prev];
          customerCacheService.cacheCustomers(newCustomers);
          return updated;
        });
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
      // Check cache first
      const cachedCustomers = customerCacheService.getCachedCustomerList();
      if (cachedCustomers && cachedCustomers.length > 0) {
        setCustomers(cachedCustomers);
        setLoading(false);
        setTotalCustomers(cachedCustomers.length);
      }

      // Load customers and count in parallel
      const [result, _] = await Promise.all([
        paginationService.loadInitialCustomers({
          pageSize: 100, // Load first 100 for better performance
          orderByField: 'createdAt',
          orderDirection: 'desc'
        }),
        getTotalCount()
      ]);

      setCustomers(result.data);
      customerCacheService.cacheCustomerList(result.data);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
      
      if (!result.hasMore) {
        setTotalCustomers(result.data.length);
      }
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
        setCustomers(prev => {
          const updated = [...prev, ...result.data];
          customerCacheService.cacheCustomers(result.data);
          return updated;
        });
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

  // Get total count
  const getTotalCount = async () => {
    try {
      if (db) {
        const customersRef = collection(db, 'customers');
        const snapshot = await getCountFromServer(customersRef);
        setTotalCustomers(snapshot.data().count);
      } else {
        const allCustomers = await databaseService.getCustomers();
        setTotalCustomers(allCustomers.length);
      }
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
    rootMargin: '200px'
  });

  // Filter and sort customers with caching
  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = customers;

    // Check search cache first
    if (debouncedSearchTerm) {
      const cachedResults = customerCacheService.getCachedSearchResults(debouncedSearchTerm);
      if (cachedResults) {
        filtered = customers.filter(c => cachedResults.includes(c.id));
      } else {
        const search = debouncedSearchTerm.toLowerCase();
        filtered = customers.filter(customer => 
          customer.name.toLowerCase().includes(search) ||
          customer.id.includes(search) ||
          customer.email.toLowerCase().includes(search) ||
          customer.phone?.includes(search) ||
          customer.fromAddress?.toLowerCase().includes(search) ||
          customer.toAddress?.toLowerCase().includes(search)
        );
        
        // Cache search results
        customerCacheService.cacheSearchResults(
          debouncedSearchTerm,
          filtered.map(c => c.id)
        );
      }
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
  }, [customers, debouncedSearchTerm, sortBy, sortOrder]);

  // Virtual scrolling setup
  const itemHeight = isMobile ? 140 : 120;
  const { visibleItems, totalHeight, containerProps, viewportProps } = useVirtualizedList(
    filteredAndSortedCustomers,
    {
      itemHeight,
      containerHeight,
      overscan: 5,
    }
  );

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
    if (selectedCustomers.length === filteredAndSortedCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredAndSortedCustomers.map(c => c.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedCustomers.length === 0) return;

    if (window.confirm(`Möchten Sie wirklich ${selectedCustomers.length} Kunden löschen?`)) {
      try {
        for (const customerId of selectedCustomers) {
          await databaseService.deleteCustomer(customerId);
        }
        
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
    const data = filteredAndSortedCustomers.map(customer => ({
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

  // Mobile search drawer
  const MobileSearchDrawer = () => (
    <SwipeableDrawer
      anchor="top"
      open={mobileSearchOpen}
      onClose={() => setMobileSearchOpen(false)}
      onOpen={() => setMobileSearchOpen(true)}
      disableSwipeToOpen={false}
      PaperProps={{
        sx: { 
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          maxHeight: '80vh'
        }
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Kunden suchen</Typography>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Name, E-Mail, Telefon oder Adresse..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
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
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={() => setMobileSearchOpen(false)}>Abbrechen</Button>
          <Button 
            variant="contained" 
            onClick={() => setMobileSearchOpen(false)}
          >
            Suchen
          </Button>
        </Box>
      </Box>
    </SwipeableDrawer>
  );

  // Mobile filter drawer
  const MobileFilterDrawer = () => (
    <SwipeableDrawer
      anchor="bottom"
      open={filterDrawerOpen}
      onClose={() => setFilterDrawerOpen(false)}
      onOpen={() => setFilterDrawerOpen(true)}
      disableSwipeToOpen={false}
      PaperProps={{
        sx: { 
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16
        }
      }}
    >
      <Box sx={{ p: 3 }}>
        <Box sx={{ width: 40, height: 4, bgcolor: 'divider', mx: 'auto', mb: 2, borderRadius: 2 }} />
        <Typography variant="h6" sx={{ mb: 2 }}>Sortierung</Typography>
        <List>
          <ListItem disablePadding>
            <ListItemButton
              selected={sortBy === 'created'}
              onClick={() => {
                setSortBy('created');
                setSortOrder('desc');
                setFilterDrawerOpen(false);
              }}
            >
              <ListItemIcon>
                {sortBy === 'created' && (sortOrder === 'desc' ? <ArrowDownwardIcon /> : <ArrowUpwardIcon />)}
              </ListItemIcon>
              <ListItemText primary="Import-Datum (Neueste zuerst)" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              selected={sortBy === 'name'}
              onClick={() => {
                setSortBy('name');
                setSortOrder('asc');
                setFilterDrawerOpen(false);
              }}
            >
              <ListItemIcon>
                {sortBy === 'name' && (sortOrder === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />)}
              </ListItemIcon>
              <ListItemText primary="Name (A-Z)" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              selected={sortBy === 'movingDate'}
              onClick={() => {
                setSortBy('movingDate');
                setSortOrder('asc');
                setFilterDrawerOpen(false);
              }}
            >
              <ListItemIcon>
                {sortBy === 'movingDate' && (sortOrder === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />)}
              </ListItemIcon>
              <ListItemText primary="Umzugsdatum" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </SwipeableDrawer>
  );

  const customersListContent = (
    <Container maxWidth="lg" sx={{ mt: isMobile ? 2 : 4, mb: isMobile ? 10 : 4, px: isMobile ? 0 : 3 }}>
      {/* Header */}
      {!isMobile && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
              Kundenliste
            </Typography>
            <Chip 
              label={`${filteredAndSortedCustomers.length} von ${totalCustomers} Kunden`}
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
        </Box>
      )}

      {/* Mobile Header */}
      {isMobile && (
        <Box sx={{ px: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant={titleVariant} sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              {filteredAndSortedCustomers.length} Kunden
            </Typography>
            <IconButton onClick={() => setMobileSearchOpen(true)}>
              <SearchIcon />
            </IconButton>
            <IconButton onClick={() => setFilterDrawerOpen(true)}>
              <FilterIcon />
            </IconButton>
          </Box>
          {searchTerm && (
            <Chip
              label={`Suche: ${searchTerm}`}
              onDelete={() => setSearchTerm('')}
              size="small"
              sx={{ mb: 1 }}
            />
          )}
        </Box>
      )}

      {/* Selection Actions */}
      {selectMode && (
        <Fade in={selectMode}>
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            mb: 2, 
            alignItems: 'center',
            px: isMobile ? 2 : 0
          }}>
            <Checkbox
              checked={selectedCustomers.length === filteredAndSortedCustomers.length && filteredAndSortedCustomers.length > 0}
              indeterminate={selectedCustomers.length > 0 && selectedCustomers.length < filteredAndSortedCustomers.length}
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

      {/* Progress indicator for loading more */}
      {loadingMore && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1200 }}>
          <LinearProgress />
        </Box>
      )}

      {/* Virtual Scrolling Customer List */}
      <Box ref={containerRef}>
        {loading ? (
          // Show skeletons during initial load
          <Box>
            {[1, 2, 3, 4, 5].map((i) => (
              <CustomerSkeleton key={i} />
            ))}
          </Box>
        ) : filteredAndSortedCustomers.length === 0 ? (
          <Alert severity="info" sx={{ mx: isMobile ? 2 : 0 }}>
            {searchTerm 
              ? 'Keine Kunden gefunden. Versuchen Sie eine andere Suche.'
              : 'Noch keine Kunden vorhanden. Erstellen Sie Ihren ersten Kunden!'}
          </Alert>
        ) : (
          <Box {...containerProps}>
            <Box {...viewportProps}>
              {visibleItems.map(({ item: customer, index, style }) => (
                <CustomerRow
                  key={customer.id}
                  customer={customer}
                  style={style}
                  onClick={() => handleSelectCustomer(customer)}
                  onHover={() => customerCacheService.schedulePreload(customer.id)}
                  onCreateQuote={() => handleCreateQuote(customer)}
                  selectMode={selectMode}
                  isSelected={selectedCustomers.includes(customer.id)}
                  onToggleSelect={() => handleToggleSelect(customer.id)}
                  isMobile={isMobile}
                />
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {/* Load more indicator */}
      <Box ref={loadMoreRef} sx={{ 
        height: 50, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        mb: isMobile ? 2 : 0
      }}>
        {loadingMore && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary">
              Lade weitere Kunden...
            </Typography>
          </Box>
        )}
        {!hasMore && filteredAndSortedCustomers.length > 0 && (
          <Typography variant="body2" color="text.secondary">
            Alle Kunden geladen
          </Typography>
        )}
      </Box>

      {/* Mobile FAB */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 16,
            zIndex: 1000
          }}
          onClick={() => navigate('/new-customer')}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Cache Stats (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ position: 'fixed', bottom: 16, left: 16, zIndex: 1000, bgcolor: 'background.paper', p: 1, borderRadius: 1, boxShadow: 2 }}>
          <Typography variant="caption">
            Cache: {JSON.stringify(customerCacheService.getCacheStats())}
          </Typography>
        </Box>
      )}

    </Container>
  );

  return (
    <>
      {isMobile ? (
        <MobileLayout 
          title="Kunden" 
          showBottomNav={true}
          rightActions={
            <Box sx={{ display: 'flex', gap: 1 }}>
              {selectMode && (
                <IconButton 
                  onClick={() => {
                    setSelectMode(false);
                    setSelectedCustomers([]);
                  }}
                  color="primary"
                >
                  <ClearIcon />
                </IconButton>
              )}
              <IconButton onClick={handleExport}>
                <UploadIcon />
              </IconButton>
              <IconButton 
                onClick={() => {
                  setSelectMode(!selectMode);
                  setSelectedCustomers([]);
                }}
                color={selectMode ? 'primary' : 'default'}
              >
                <Checkbox />
              </IconButton>
            </Box>
          }
        >
          {customersListContent}
          <MobileSearchDrawer />
          <MobileFilterDrawer />
        </MobileLayout>
      ) : (
        customersListContent
      )}

      {/* Sort Menu - Desktop only */}
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
          <ListItemText>Import-Datum (Neueste zuerst)</ListItemText>
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
            {filteredAndSortedCustomers.length} Kunden werden exportiert:
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
    </>
  );
};

export default CustomersListPerformance;