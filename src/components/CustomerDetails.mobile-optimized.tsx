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
  ListItemText,
  AppBar,
  Toolbar,
  IconButton,
  Fab,
  Chip,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Home as HomeIcon,
  Description as DescriptionIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { Customer } from '../types';
import { databaseService as googleSheetsService } from '../config/database.config';
import { useResponsive } from '../hooks/useResponsive';

const CustomerDetails: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { isMobile, getButtonProps } = useResponsive();
  
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
          services: [],
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
        services: [],
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

  const handleCreateQuote = () => {
    navigate('/create-quote', { state: { customer } });
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

  const renderMobileLayout = () => (
    <>
      {/* Mobile App Bar */}
      <AppBar position="fixed" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar>
          <IconButton edge="start" onClick={handleBack} aria-label="back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Kundendetails
          </Typography>
          <IconButton onClick={handleEdit} color="primary">
            <EditIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 8, mb: 10, px: 1 }}>
        {/* Customer Header Card */}
        <Card sx={{ mb: 2, overflow: 'hidden' }}>
          <Box 
            sx={{ 
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: 'white',
              p: 3,
              pb: 4,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar 
                sx={{ 
                  width: 60, 
                  height: 60,
                  fontSize: '1.5rem',
                  bgcolor: 'white',
                  color: 'primary.main',
                }}
              >
                {customer.name.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {customer.name}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  ID: {customer.id}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Card>

        {/* Contact Actions */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ py: 1.5 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PhoneIcon />}
                href={`tel:${customer.phone}`}
                sx={{ py: 1.5 }}
              >
                Anrufen
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<EmailIcon />}
                href={`mailto:${customer.email}`}
                sx={{ py: 1.5 }}
              >
                E-Mail
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Moving Information */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Umzugsinformationen
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <CalendarIcon color="primary" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Umzugstermin
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {new Date(customer.movingDate).toLocaleDateString('de-DE', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                <LocationIcon color="primary" />
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body2" color="text.secondary">
                    Von
                  </Typography>
                  <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                    {customer.fromAddress}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <LocationIcon color="success" />
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body2" color="text.secondary">
                    Nach
                  </Typography>
                  <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                    {customer.toAddress}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {customer.apartment && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <HomeIcon color="primary" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Wohnung
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                      <Chip 
                        label={`${customer.apartment.rooms} Zimmer`} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                      <Chip 
                        label={`${customer.apartment.area}m²`} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                      <Chip 
                        label={`${customer.apartment.floor}. Etage`} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                      <Chip 
                        label={customer.apartment.hasElevator ? 'Mit Aufzug' : 'Ohne Aufzug'} 
                        size="small" 
                        color={customer.apartment.hasElevator ? 'success' : 'default'}
                        variant="outlined" 
                      />
                    </Box>
                  </Box>
                </Box>
              </>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        {customer.notes && (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Notizen
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
                {customer.notes}
              </Typography>
            </CardContent>
          </Card>
        )}
      </Container>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="create quote"
        onClick={handleCreateQuote}
        {...getButtonProps()}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <DescriptionIcon />
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
          Kundendetails
        </Typography>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={handleEdit}
          sx={{ mr: 1 }}
        >
          Bearbeiten
        </Button>
        <Button
          variant="contained"
          startIcon={<DescriptionIcon />}
          onClick={handleCreateQuote}
        >
          Angebot erstellen
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
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" gutterBottom>
              {customer.name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Kunde ID: {customer.id}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<PhoneIcon />}
              href={`tel:${customer.phone}`}
            >
              Anrufen
            </Button>
            <Button
              variant="outlined"
              startIcon={<EmailIcon />}
              href={`mailto:${customer.email}`}
            >
              E-Mail senden
            </Button>
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
              secondary={customer.phone}
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <EmailIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="E-Mail"
              secondary={customer.email}
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
                secondary={
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Chip label={`${customer.apartment.rooms} Zimmer`} size="small" />
                    <Chip label={`${customer.apartment.area}m²`} size="small" />
                    <Chip label={`${customer.apartment.floor}. Etage`} size="small" />
                    <Chip 
                      label={customer.apartment.hasElevator ? 'Mit Aufzug' : 'Ohne Aufzug'} 
                      size="small" 
                      color={customer.apartment.hasElevator ? 'success' : 'default'}
                    />
                  </Box>
                }
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

  return isMobile ? renderMobileLayout() : renderDesktopLayout();
};

export default CustomerDetails;