import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  TextField,
  InputAdornment,
  Chip
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { Customer } from '../types';
import { googleSheetsPublicService as googleSheetsService } from '../services/googleSheetsPublic';

const CustomersList: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const customers = await googleSheetsService.getCustomers();
        setCustomers(customers);
      } catch (error) {
        console.error('Fehler beim Laden der Kunden:', error);
      }
    };
    
    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.id.includes(searchTerm) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectCustomer = (customer: Customer) => {
    navigate('/create-quote', { state: { customer } });
  };

  const isUpcomingMove = (movingDate: string) => {
    const moveDate = new Date(movingDate);
    const today = new Date();
    return moveDate > today;
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate('/dashboard')} sx={{ mb: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" gutterBottom>
          Kunden
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Alle Kunden verwalten und Angebote erstellen
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <TextField
          fullWidth
          label="Kunde suchen"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Name, ID oder Email"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <Paper elevation={3}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            {filteredCustomers.length} Kunde{filteredCustomers.length !== 1 ? 'n' : ''} gefunden
          </Typography>
        </Box>
        
        <List>
          {filteredCustomers.map((customer, index) => (
            <React.Fragment key={customer.id}>
              {index > 0 && <Divider />}
              <ListItem disablePadding>
                <ListItemButton onClick={() => handleSelectCustomer(customer)}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6">
                          {customer.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {isUpcomingMove(customer.movingDate) && (
                            <Chip 
                              label="Bevorstehend" 
                              color="primary" 
                              size="small"
                            />
                          )}
                          <Chip 
                            label={`${customer.apartment.rooms} Zi.`} 
                            variant="outlined" 
                            size="small"
                          />
                        </Box>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <EmailIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {customer.email}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <PhoneIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {customer.phone}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                          <HomeIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary', mt: 0.2 }} />
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Von: {customer.fromAddress}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Nach: {customer.toAddress}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Typography variant="body2" color="primary" fontWeight="medium">
                          Umzugsdatum: {new Date(customer.movingDate).toLocaleDateString('de-DE')}
                        </Typography>
                        
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          ID: {customer.id} • {customer.apartment.area} m² • 
                          {customer.apartment.floor}. Stock {customer.apartment.hasElevator ? '(Aufzug)' : '(kein Aufzug)'}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            </React.Fragment>
          ))}
        </List>

        {filteredCustomers.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              {searchTerm ? 'Keine Kunden gefunden' : 'Noch keine Kunden angelegt'}
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default CustomersList;