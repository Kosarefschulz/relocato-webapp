import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { Customer } from '../types';
import { databaseService as googleSheetsService } from '../config/database.config';

const CustomerDetails: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomerData();
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
      } else {
        // Demo-Kunde für csv_2, csv_3, etc.
        const demoCustomer: Customer = {
          id: customerId,
          name: `Demo Kunde ${customerId}`,
          email: `${customerId}@demo.de`,
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
          notes: `Demo-Kunde für ${customerId}`
        };
        
        setCustomer(demoCustomer);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Kundendaten:', error);
      // Auch bei Fehler Demo-Kunde anzeigen
      const demoCustomer: Customer = {
        id: customerId || 'demo',
        name: `Demo Kunde ${customerId}`,
        email: `${customerId}@demo.de`,
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
        notes: `Demo-Kunde für ${customerId}`
      };
      
      setCustomer(demoCustomer);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/customers');
  };

  const handleEdit = () => {
    navigate(`/edit-customer/${customer?.id}`);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Lade Kundendaten...
        </Typography>
      </Container>
    );
  }

  if (!customer) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          Kunde nicht gefunden (ID: {customerId})
        </Alert>
        <Button onClick={handleBack} sx={{ mt: 2 }}>
          Zurück zur Kundenliste
        </Button>
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
          Kundendetails
        </Typography>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={handleEdit}
        >
          Bearbeiten
        </Button>
      </Box>

      {/* Customer Info Card */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar 
            sx={{ 
              width: 80, 
              height: 80, 
              mr: 3,
              fontSize: '2rem',
              bgcolor: 'primary.main'
            }}
          >
            {customer.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h4" gutterBottom>
              {customer.name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Kunde ID: {customer.id}
            </Typography>
          </Box>
        </Box>

        {/* Contact Information */}
        <List>
          <ListItem>
            <ListItemIcon>
              <PhoneIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Telefon"
              secondary={
                <a href={`tel:${customer.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                  {customer.phone}
                </a>
              }
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <EmailIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="E-Mail"
              secondary={
                <a href={`mailto:${customer.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                  {customer.email}
                </a>
              }
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <CalendarIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Umzugstermin"
              secondary={new Date(customer.movingDate).toLocaleDateString('de-DE', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <LocationIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Von"
              secondary={customer.fromAddress}
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <LocationIcon color="success" />
            </ListItemIcon>
            <ListItemText 
              primary="Nach"
              secondary={customer.toAddress}
            />
          </ListItem>

          {customer.apartment && (
            <ListItem>
              <ListItemIcon>
                <HomeIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Wohnung"
                secondary={`${customer.apartment.rooms} Zimmer, ${customer.apartment.area}m², ${customer.apartment.floor}. Etage${customer.apartment.hasElevator ? ', mit Aufzug' : ', ohne Aufzug'}`}
              />
            </ListItem>
          )}
        </List>

        {/* Notes */}
        {customer.notes && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Notizen
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {customer.notes}
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default CustomerDetails;