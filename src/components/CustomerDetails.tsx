import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  IconButton,
  Tabs,
  Tab,
  Button,
  Card,
  CardContent,
  Chip,
  Grid
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Description as DescriptionIcon,
  PhotoCamera as PhotoCameraIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { Customer } from '../types';
import { googleSheetsPublicService as googleSheetsService } from '../services/googleSheetsPublic';
import CustomerPhotos from './CustomerPhotos';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const CustomerDetails: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  
  // Determine where to navigate back to
  const navigateBack = () => {
    const from = location.state?.from;
    if (from) {
      navigate(from);
    } else {
      navigate('/customers');
    }
  };

  useEffect(() => {
    loadCustomer();
  }, [customerId]);

  const loadCustomer = async () => {
    if (!customerId) return;
    
    try {
      const customers = await googleSheetsService.getCustomers();
      const foundCustomer = customers.find(c => c.id === customerId);
      if (foundCustomer) {
        setCustomer(foundCustomer);
      }
    } catch (error) {
      console.error('Fehler beim Laden des Kunden:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Lade Kundendaten...</Typography>
      </Container>
    );
  }

  if (!customer) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Kunde nicht gefunden</Typography>
        <Button onClick={navigateBack} sx={{ mt: 2 }}>
          Zurück zur Kundenliste
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ mb: 3 }}>
        <IconButton onClick={navigateBack} sx={{ mb: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" gutterBottom>
            {customer.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/edit-customer/${customer.id}`)}
            >
              Bearbeiten
            </Button>
            <Button
              variant="contained"
              startIcon={<DescriptionIcon />}
              onClick={() => navigate('/create-quote', { state: { customer } })}
            >
              Angebot erstellen
            </Button>
          </Box>
        </Box>
      </Box>

      <Paper elevation={3}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Informationen" icon={<EditIcon />} iconPosition="start" />
            <Tab label="Fotos" icon={<PhotoCameraIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Kontaktdaten */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Kontaktdaten
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <PhoneIcon sx={{ mr: 2, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Telefon
                          </Typography>
                          <Typography variant="body1">
                            {customer.phone || 'Nicht angegeben'}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <EmailIcon sx={{ mr: 2, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            E-Mail
                          </Typography>
                          <Typography variant="body1">
                            {customer.email || 'Nicht angegeben'}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CalendarIcon sx={{ mr: 2, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Umzugsdatum
                          </Typography>
                          <Typography variant="body1">
                            {customer.movingDate || 'Nicht festgelegt'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Adressen */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Umzugsadressen
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                        <HomeIcon sx={{ mr: 2, color: 'text.secondary', mt: 0.5 }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Von
                          </Typography>
                          <Typography variant="body1">
                            {customer.fromAddress || 'Nicht angegeben'}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <BusinessIcon sx={{ mr: 2, color: 'text.secondary', mt: 0.5 }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Nach
                          </Typography>
                          <Typography variant="body1">
                            {customer.toAddress || 'Nicht angegeben'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Wohnungsdetails */}
              <Grid size={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Wohnungsdetails
                    </Typography>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          Zimmer
                        </Typography>
                        <Typography variant="h6">
                          {customer.apartment?.rooms || '-'}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          Fläche
                        </Typography>
                        <Typography variant="h6">
                          {customer.apartment?.area || '-'} m²
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          Etage
                        </Typography>
                        <Typography variant="h6">
                          {customer.apartment?.floor || 'EG'}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          Aufzug
                        </Typography>
                        <Chip
                          label={customer.apartment?.hasElevator ? 'Vorhanden' : 'Nicht vorhanden'}
                          color={customer.apartment?.hasElevator ? 'success' : 'default'}
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Notizen */}
              {customer.notes && (
                <Grid size={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        Notizen
                      </Typography>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {customer.notes}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <CustomerPhotos customer={customer} />
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default CustomerDetails;