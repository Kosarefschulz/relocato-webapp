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
  CircularProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { Customer } from '../types';
import { googleSheetsPublicService as googleSheetsService } from '../services/googleSheetsPublic';

const CustomersList: React.FC = () => {
  const navigate = useNavigate();
  
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
        customer.name.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
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
                    secondary={customer.email}
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
};

export default CustomersList;