import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  IconButton,
  Card,
  CardContent,
  Chip,
  Fab,
  useTheme,
  useMediaQuery,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { Customer } from '../types';
import { databaseService as googleSheetsService } from '../config/database.config';
import { useResponsive } from '../hooks/useResponsive';

const CustomersList: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { isMobile, getTextFieldProps, getButtonProps } = useResponsive();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = customers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm)
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [customers, searchTerm]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await googleSheetsService.getCustomers();
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (error) {
      console.error('Fehler beim Laden der Kunden:', error);
      setError('Fehler beim Laden der Kundenliste');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerClick = (customerId: string) => {
    navigate(`/customer-details/${customerId}`);
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleNewCustomer = () => {
    navigate('/new-customer');
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Lade Kundenliste...
        </Typography>
      </Container>
    );
  }

  const renderMobileLayout = () => (
    <>
      {/* Mobile App Bar */}
      <AppBar position="fixed" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar>
          <IconButton edge="start" onClick={handleBack} aria-label="back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Kunden ({filteredCustomers.length})
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 8, mb: 10, px: 1 }}>
        {/* Search Bar */}
        <Box sx={{ mb: 2, px: 1 }}>
          <TextField
            fullWidth
            placeholder="Name, Email oder Telefon suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            {...getTextFieldProps()}
          />
        </Box>

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, mx: 1 }}>
            {error}
          </Alert>
        )}

        {/* Customer Cards for Mobile */}
        <Box sx={{ px: 1 }}>
          {filteredCustomers.length === 0 && !loading ? (
            <Card sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                {searchTerm ? `Keine Treffer für "${searchTerm}"` : "Noch keine Kunden angelegt"}
              </Typography>
            </Card>
          ) : (
            filteredCustomers.map((customer) => (
              <Card 
                key={customer.id} 
                sx={{ 
                  mb: 2, 
                  overflow: 'hidden',
                  '&:active': {
                    transform: 'scale(0.98)',
                  },
                  transition: 'transform 0.1s',
                }}
                onClick={() => handleCustomerClick(customer.id)}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: 'primary.main',
                        width: 48,
                        height: 48,
                        fontSize: '1.25rem',
                      }}
                    >
                      {customer.name.charAt(0).toUpperCase()}
                    </Avatar>
                    
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: '1.1rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {customer.name}
                      </Typography>
                      
                      {customer.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {customer.email}
                          </Typography>
                        </Box>
                      )}
                      
                      {customer.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {customer.phone}
                          </Typography>
                        </Box>
                      )}
                      
                      {customer.fromAddress && (
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mt: 0.5 }}>
                          <HomeIcon sx={{ fontSize: 16, color: 'text.secondary', mt: 0.2 }} />
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {customer.fromAddress}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </Box>

        {/* Summary */}
        <Box sx={{ mt: 3, textAlign: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {filteredCustomers.length} von {customers.length} Kunden
          </Typography>
        </Box>
      </Container>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={handleNewCustomer}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <AddIcon />
      </Fab>
    </>
  );

  const renderDesktopLayout = () => (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mr: 2 }}
        >
          Zurück
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Kunden
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNewCustomer}
        >
          Neuer Kunde
        </Button>
      </Box>

      {/* Search */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Kunde suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Customer List */}
      <Paper sx={{ borderRadius: 2 }}>
        <List>
          {filteredCustomers.length === 0 && !loading ? (
            <ListItem>
              <ListItemText 
                primary="Keine Kunden gefunden"
                secondary={searchTerm ? `Keine Treffer für "${searchTerm}"` : "Noch keine Kunden angelegt"}
              />
            </ListItem>
          ) : (
            filteredCustomers.map((customer, index) => (
              <ListItem key={customer.id} divider={index < filteredCustomers.length - 1}>
                <ListItemButton 
                  onClick={() => handleCustomerClick(customer.id)}
                  sx={{ 
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {customer.name.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={customer.name}
                    secondary={
                      <Box>
                        {customer.email && (
                          <Typography variant="body2" component="span" sx={{ display: 'block' }}>
                            {customer.email}
                          </Typography>
                        )}
                        {customer.phone && (
                          <Typography variant="body2" component="span" sx={{ display: 'block' }}>
                            {customer.phone}
                          </Typography>
                        )}
                      </Box>
                    }
                    primaryTypographyProps={{
                      variant: 'h6',
                      fontWeight: 500
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))
          )}
        </List>
      </Paper>

      {/* Summary */}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {filteredCustomers.length} von {customers.length} Kunden
        </Typography>
      </Box>
    </Container>
  );

  return isMobile ? renderMobileLayout() : renderDesktopLayout();
};

export default CustomersList;