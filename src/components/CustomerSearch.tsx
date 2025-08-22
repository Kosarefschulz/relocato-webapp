import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  InputAdornment
} from '@mui/material';
import { 
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { Customer } from '../types';
import { databaseService as googleSheetsService } from '../config/database.config';

const CustomerSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  
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
    try {
      navigate(`/customer/${customer.id}`);
    } catch (error) {
      console.error('Navigation error:', error);
      setError('Fehler beim Navigieren zur Kundendetails');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Box sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate('/dashboard')} sx={{ mb: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" gutterBottom>
          Kunde suchen
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Suchen Sie nach Name oder Kunden-ID
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <TextField
          fullWidth
          label="Name oder Kunden-ID"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton onClick={() => setSearchTerm('')} edge="end">
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
          sx={{ height: 48 }}
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
        <Paper elevation={3}>
          <List>
            {customers.map((customer, index) => (
              <React.Fragment key={customer.id}>
                {index > 0 && <Divider />}
                <ListItem disablePadding>
                  <ListItemButton onClick={() => handleSelectCustomer(customer)}>
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
    </Container>
  );
};

export default CustomerSearch;