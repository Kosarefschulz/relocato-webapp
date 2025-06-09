import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResponsive } from '../hooks/useResponsive';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
  AppBar,
  Toolbar,
  Fab,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import { 
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  Clear as ClearIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { Customer } from '../types';
import { googleSheetsPublicService as googleSheetsService } from '../services/googleSheetsPublic';

const CustomerSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { isMobile, getContainerProps, getButtonProps, getTextFieldProps, titleVariant } = useResponsive();

  // Lade Kunden beim Component-Mount
  React.useEffect(() => {
    const loadCustomers = async () => {
      try {
        const customers = await googleSheetsService.getCustomers();
        setAllCustomers(customers);
      } catch (error) {
        console.error('Fehler beim Laden der Kunden:', error);
      }
    };
    
    loadCustomers();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Bitte geben Sie einen Suchbegriff ein');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const filtered = allCustomers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.id.includes(searchTerm) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      setCustomers(filtered);
      
      if (filtered.length === 0) {
        setError('Keine Kunden gefunden');
      }
    } catch (err) {
      setError('Fehler bei der Suche');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    navigate('/create-quote', { state: { customer } });
  };

  const CustomerCard = ({ customer }: { customer: Customer }) => (
    <Card 
      sx={{ 
        mb: 2, 
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)'
        },
        '&:active': {
          transform: 'translateY(0px)'
        }
      }}
      onClick={() => handleSelectCustomer(customer)}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            {customer.name}
          </Typography>
          <Chip 
            label={`ID: ${customer.id}`} 
            size="small" 
            variant="outlined"
            sx={{ fontSize: '0.75rem' }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <EmailIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            {customer.email}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <PhoneIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            {customer.phone}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <CalendarIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2" color="primary" fontWeight="medium">
            Umzug: {new Date(customer.movingDate).toLocaleDateString('de-DE')}
          </Typography>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          {customer.apartment.rooms} Zimmer • {customer.apartment.area} m² • 
          {customer.apartment.floor}. Stock
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <>
      {isMobile && (
        <AppBar position="sticky" color="default" elevation={1}>
          <Toolbar>
            <IconButton 
              edge="start" 
              onClick={() => navigate('/dashboard')}
              sx={{ mr: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Kunde suchen
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      <Container {...getContainerProps()}>
        {!isMobile && (
          <Box sx={{ mb: 3 }}>
            <IconButton onClick={() => navigate('/dashboard')} sx={{ mb: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant={titleVariant} gutterBottom>
              Kunde suchen
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Suchen Sie nach Name, Email oder Kunden-ID
            </Typography>
          </Box>
        )}

        <Paper 
          elevation={isMobile ? 1 : 3} 
          sx={{ 
            p: { xs: 2, sm: 3 }, 
            mb: 3,
            ...(isMobile && {
              mx: -1,
              borderRadius: 2
            })
          }}
        >
          <TextField
            fullWidth
            label="Name, Email oder Kunden-ID"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            {...getTextFieldProps()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton 
                    onClick={() => setSearchTerm('')} 
                    edge="end"
                    size={isMobile ? "large" : "medium"}
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          
          <Button
            fullWidth
            variant="contained"
            onClick={handleSearch}
            disabled={loading}
            {...getButtonProps()}
            startIcon={loading ? undefined : <SearchIcon />}
          >
            {loading ? <CircularProgress size={24} /> : 'Suchen'}
          </Button>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {customers.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ px: isMobile ? 1 : 0 }}>
              {customers.length} Kunde{customers.length !== 1 ? 'n' : ''} gefunden
            </Typography>
            
            {isMobile ? (
              <Box sx={{ px: 1 }}>
                {customers.map((customer) => (
                  <CustomerCard key={customer.id} customer={customer} />
                ))}
              </Box>
            ) : (
              <Paper elevation={3}>
                <List>
                  {customers.map((customer, index) => (
                    <React.Fragment key={customer.id}>
                      {index > 0 && <Divider />}
                      <ListItem disablePadding>
                        <ListItemButton 
                          onClick={() => handleSelectCustomer(customer)}
                          sx={{ minHeight: 80 }}
                        >
                          <ListItemText
                            primary={customer.name}
                            secondary={
                              <>
                                <Typography component="span" variant="body2">
                                  ID: {customer.id} • {customer.phone}
                                </Typography>
                                <br />
                                <Typography component="span" variant="body2" color="text.secondary">
                                  Umzug am: {new Date(customer.movingDate).toLocaleDateString('de-DE')}
                                </Typography>
                              </>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            )}
          </Box>
        )}

        {/* Mobile FAB for quick customer creation */}
        {isMobile && (
          <Fab
            color="primary"
            onClick={() => navigate('/new-customer')}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 16,
              zIndex: 1000
            }}
          >
            <PersonIcon />
          </Fab>
        )}
      </Container>
    </>
  );
};

export default CustomerSearch;