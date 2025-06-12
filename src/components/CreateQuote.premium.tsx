import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  CardActions,
  Chip,
  Grid,
  Slider,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  useTheme,
  useMediaQuery,
  alpha,
  Tooltip,
  Zoom,
  Fade,
  Grow,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  LocalShipping as TruckIcon,
  Inventory as BoxIcon,
  Build as ToolIcon,
  CleaningServices as CleanIcon,
  Kitchen as KitchenIcon,
  Weekend as FurnitureIcon,
  Piano as PianoIcon,
  Pets as PetIcon,
  Euro as EuroIcon,
  Calculate as CalculateIcon,
  Send as SendIcon,
  Save as SaveIcon,
  Preview as PreviewIcon,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon,
  CheckCircle as CheckIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Info as InfoIcon,
  Speed as SpeedIcon,
  EmojiObjects as TipIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { Customer } from '../types';
import { googleSheetsPublicService as googleSheetsService } from '../services/googleSheetsPublic';
import { quoteCalculationService } from '../services/quoteCalculation';
import DarkModeToggle from './DarkModeToggle';

// Service-Konfiguration mit Icons und Beschreibungen
const serviceConfig = {
  transport: {
    name: 'Transport',
    icon: <TruckIcon />,
    description: 'Professioneller Transport Ihrer Möbel',
    basePrice: 500,
    color: '#3B82F6',
  },
  packing: {
    name: 'Verpackung',
    icon: <BoxIcon />,
    description: 'Sichere Verpackung aller Gegenstände',
    basePrice: 200,
    color: '#10B981',
  },
  assembly: {
    name: 'Montage',
    icon: <ToolIcon />,
    description: 'Ab- und Aufbau Ihrer Möbel',
    basePrice: 150,
    color: '#F59E0B',
  },
  cleaning: {
    name: 'Reinigung',
    icon: <CleanIcon />,
    description: 'Endreinigung der alten Wohnung',
    basePrice: 100,
    color: '#8B5CF6',
  },
  kitchen: {
    name: 'Küche',
    icon: <KitchenIcon />,
    description: 'Spezialservice für Küchenmontage',
    basePrice: 300,
    color: '#EC4899',
  },
  furniture: {
    name: 'Möbel',
    icon: <FurnitureIcon />,
    description: 'Handling schwerer Möbel',
    basePrice: 100,
    color: '#14B8A6',
  },
  piano: {
    name: 'Klavier',
    icon: <PianoIcon />,
    description: 'Spezialtransport für Klavier/Flügel',
    basePrice: 400,
    color: '#F97316',
  },
  pets: {
    name: 'Haustiere',
    icon: <PetIcon />,
    description: 'Betreuung während des Umzugs',
    basePrice: 50,
    color: '#06B6D4',
  },
};

const steps = ['Kunde', 'Services', 'Kalkulation', 'Vorschau'];

const CreateQuote: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const passedCustomer = location.state?.customer as Customer | undefined;
  
  const [activeStep, setActiveStep] = useState(passedCustomer ? 1 : 0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(passedCustomer || null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServices, setSelectedServices] = useState<{ [key: string]: boolean }>({
    transport: true,
    packing: false,
    assembly: false,
    cleaning: false,
    kitchen: false,
    furniture: false,
    piano: false,
    pets: false,
  });
  const [serviceQuantities, setServiceQuantities] = useState<{ [key: string]: number }>({
    transport: 1,
    packing: 1,
    assembly: 1,
    cleaning: 1,
    kitchen: 1,
    furniture: 1,
    piano: 1,
    pets: 1,
  });
  const [comment, setComment] = useState('');
  const [discount, setDiscount] = useState(0);
  const [expressService, setExpressService] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const customersData = await googleSheetsService.getCustomers();
      setCustomers(customersData);
    } catch (error) {
      console.error('Fehler beim Laden der Kunden:', error);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateBasePrice = () => {
    let total = 0;
    Object.entries(selectedServices).forEach(([service, selected]) => {
      if (selected) {
        total += serviceConfig[service as keyof typeof serviceConfig].basePrice * serviceQuantities[service];
      }
    });
    return total;
  };

  const calculateTotalPrice = () => {
    let basePrice = calculateBasePrice();
    
    // Express-Zuschlag
    if (expressService) {
      basePrice *= 1.25; // 25% Zuschlag
    }
    
    // Rabatt
    const discountAmount = (basePrice * discount) / 100;
    
    return basePrice - discountAmount;
  };

  const handleNext = () => {
    if (activeStep === 0 && !selectedCustomer) {
      setSnackbar({ open: true, message: 'Bitte wählen Sie einen Kunden aus', severity: 'error' });
      return;
    }
    
    if (activeStep === 1 && !Object.values(selectedServices).some(v => v)) {
      setSnackbar({ open: true, message: 'Bitte wählen Sie mindestens einen Service aus', severity: 'error' });
      return;
    }
    
    if (activeStep === steps.length - 1) {
      handleSaveQuote();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleServiceToggle = (service: string) => {
    setSelectedServices(prev => ({
      ...prev,
      [service]: !prev[service]
    }));
  };

  const handleQuantityChange = (service: string, delta: number) => {
    setServiceQuantities(prev => ({
      ...prev,
      [service]: Math.max(1, prev[service] + delta)
    }));
  };

  const handleSaveQuote = async () => {
    if (!selectedCustomer) return;

    setSaving(true);
    try {
      const quote = {
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        price: calculateTotalPrice(),
        comment: comment || 'Standard-Umzugsangebot',
        createdAt: new Date(),
        createdBy: 'user',
        status: 'draft' as const,
      };

      await googleSheetsService.addQuote(quote);
      setSnackbar({ open: true, message: 'Angebot erfolgreich erstellt!', severity: 'success' });
      
      setTimeout(() => {
        navigate(`/customer/${selectedCustomer.id}`, { state: { tabIndex: 2 } });
      }, 1500);
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      setSnackbar({ open: true, message: 'Fehler beim Speichern des Angebots', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const renderCustomerSelection = () => (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Kunde auswählen
      </Typography>
      
      <TextField
        fullWidth
        label="Kunde suchen"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
        placeholder="Name oder Email eingeben..."
      />

      <Grid container spacing={2}>
        {filteredCustomers.map((customer) => (
          <Grid size={{ xs: 12, md: 6 }} key={customer.id}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                sx={{
                  cursor: 'pointer',
                  border: selectedCustomer?.id === customer.id ? `2px solid ${theme.palette.primary.main}` : '1px solid transparent',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: theme.shadows[4],
                    borderColor: theme.palette.primary.light,
                  }
                }}
                onClick={() => setSelectedCustomer(customer)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
                      {customer.name.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6">{customer.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {customer.email}
                      </Typography>
                    </Box>
                    {selectedCustomer?.id === customer.id && (
                      <CheckIcon color="primary" />
                    )}
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    <strong>Umzug:</strong> {customer.fromAddress} → {customer.toAddress}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Datum:</strong> {new Date(customer.movingDate).toLocaleDateString('de-DE')}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip label={`${customer.apartment.rooms} Zimmer`} size="small" sx={{ mr: 1 }} />
                    <Chip label={`${customer.apartment.area} m²`} size="small" sx={{ mr: 1 }} />
                    <Chip label={`${customer.apartment.floor}. Stock`} size="small" />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderServiceSelection = () => (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Services auswählen
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          💡 <strong>Tipp:</strong> Wählen Sie alle benötigten Services aus. Die Preise werden automatisch basierend auf der Wohnungsgröße berechnet.
        </Typography>
      </Alert>

      <Grid container spacing={2}>
        {Object.entries(serviceConfig).map(([key, config]) => (
          <Grid size={{ xs: 12, md: 6 }} key={key}>
            <AnimatePresence>
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card
                  sx={{
                    border: selectedServices[key] ? `2px solid ${config.color}` : '1px solid transparent',
                    backgroundColor: selectedServices[key] ? alpha(config.color, 0.05) : 'background.paper',
                    transition: 'all 0.3s ease',
                    height: '100%',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: selectedServices[key] ? config.color : 'grey.300',
                          mr: 2,
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {config.icon}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {config.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {config.description}
                        </Typography>
                      </Box>
                      <Switch
                        checked={selectedServices[key]}
                        onChange={() => handleServiceToggle(key)}
                        color="primary"
                      />
                    </Box>

                    <Collapse in={selectedServices[key]}>
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">
                            Menge:
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <IconButton
                              size="small"
                              onClick={() => handleQuantityChange(key, -1)}
                              disabled={serviceQuantities[key] <= 1}
                            >
                              <RemoveIcon />
                            </IconButton>
                            <Typography sx={{ mx: 2, minWidth: 30, textAlign: 'center' }}>
                              {serviceQuantities[key]}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleQuantityChange(key, 1)}
                            >
                              <AddIcon />
                            </IconButton>
                          </Box>
                        </Box>
                        <Typography variant="h6" color="primary" sx={{ mt: 1, textAlign: 'right' }}>
                          €{(config.basePrice * serviceQuantities[key]).toFixed(2)}
                        </Typography>
                      </Box>
                    </Collapse>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </Grid>
        ))}
      </Grid>

      {/* Express Service */}
      <Card sx={{ mt: 3, backgroundColor: alpha(theme.palette.warning.main, 0.05) }}>
        <CardContent>
          <FormControlLabel
            control={
              <Switch
                checked={expressService}
                onChange={(e) => setExpressService(e.target.checked)}
                color="warning"
              />
            }
            label={
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  <SpeedIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Express-Service (+25%)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Umzug innerhalb von 48 Stunden
                </Typography>
              </Box>
            }
          />
        </CardContent>
      </Card>
    </Box>
  );

  const renderCalculation = () => (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Preiskalkulation
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <CalculateIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Kostenübersicht
              </Typography>
              
              <List>
                {Object.entries(selectedServices).map(([service, selected]) => {
                  if (!selected) return null;
                  const config = serviceConfig[service as keyof typeof serviceConfig];
                  const quantity = serviceQuantities[service];
                  const price = config.basePrice * quantity;
                  
                  return (
                    <ListItem key={service} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: config.color, width: 32, height: 32 }}>
                          {config.icon}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={config.name}
                        secondary={quantity > 1 ? `${quantity}x` : undefined}
                      />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        €{price.toFixed(2)}
                      </Typography>
                    </ListItem>
                  );
                })}
                
                {expressService && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: theme.palette.warning.main, width: 32, height: 32 }}>
                        <SpeedIcon />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText primary="Express-Zuschlag" secondary="25%" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      +€{(calculateBasePrice() * 0.25).toFixed(2)}
                    </Typography>
                  </ListItem>
                )}
              </List>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ flex: 1 }}>
                  Zwischensumme:
                </Typography>
                <Typography variant="h6">
                  €{(calculateBasePrice() * (expressService ? 1.25 : 1)).toFixed(2)}
                </Typography>
              </Box>

              {/* Rabatt */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Rabatt: {discount}%
                </Typography>
                <Slider
                  value={discount}
                  onChange={(e, newValue) => setDiscount(newValue as number)}
                  max={30}
                  marks={[
                    { value: 0, label: '0%' },
                    { value: 10, label: '10%' },
                    { value: 20, label: '20%' },
                    { value: 30, label: '30%' },
                  ]}
                  valueLabelDisplay="auto"
                  color="secondary"
                />
              </Box>

              {discount > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ flex: 1 }}>
                    Rabatt:
                  </Typography>
                  <Typography variant="h6" color="error">
                    -€{((calculateBasePrice() * (expressService ? 1.25 : 1) * discount) / 100).toFixed(2)}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h5" sx={{ flex: 1, fontWeight: 700 }}>
                  Gesamtpreis:
                </Typography>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                  €{calculateTotalPrice().toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Kommentar */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Kommentar zum Angebot
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Zusätzliche Informationen oder spezielle Anforderungen..."
                variant="outlined"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Kunde Info Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          {selectedCustomer && (
            <Card sx={{ position: 'sticky', top: 80 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Kundeninformationen
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Name
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedCustomer.name}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Umzugsdatum
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {new Date(selectedCustomer.movingDate).toLocaleDateString('de-DE')}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Von
                  </Typography>
                  <Typography variant="body2">
                    {selectedCustomer.fromAddress}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Nach
                  </Typography>
                  <Typography variant="body2">
                    {selectedCustomer.toAddress}
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="primary">
                      {selectedCustomer.apartment.rooms}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Zimmer
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="primary">
                      {selectedCustomer.apartment.area}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      m²
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="primary">
                      {selectedCustomer.apartment.floor}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Stock
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );

  const renderPreview = () => (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Angebots-Vorschau
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
              Umzugsangebot
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Erstellt am {new Date().toLocaleDateString('de-DE')}
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          {selectedCustomer && (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Kunde
                </Typography>
                <Typography variant="body1">{selectedCustomer.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedCustomer.email} • {selectedCustomer.phone}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Umzugsdetails
                </Typography>
                <Typography variant="body2">
                  <strong>Von:</strong> {selectedCustomer.fromAddress}
                </Typography>
                <Typography variant="body2">
                  <strong>Nach:</strong> {selectedCustomer.toAddress}
                </Typography>
                <Typography variant="body2">
                  <strong>Datum:</strong> {new Date(selectedCustomer.movingDate).toLocaleDateString('de-DE')}
                </Typography>
              </Box>
            </>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Ausgewählte Services
            </Typography>
            <List dense>
              {Object.entries(selectedServices).map(([service, selected]) => {
                if (!selected) return null;
                const config = serviceConfig[service as keyof typeof serviceConfig];
                const quantity = serviceQuantities[service];
                
                return (
                  <ListItem key={service}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {config.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={config.name}
                      secondary={quantity > 1 ? `Menge: ${quantity}` : undefined}
                    />
                    <Typography variant="body1">
                      €{(config.basePrice * quantity).toFixed(2)}
                    </Typography>
                  </ListItem>
                );
              })}
              {expressService && (
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <SpeedIcon />
                  </ListItemIcon>
                  <ListItemText primary="Express-Service" />
                  <Typography variant="body1">
                    +25%
                  </Typography>
                </ListItem>
              )}
            </List>
          </Box>

          {comment && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Anmerkungen
              </Typography>
              <Typography variant="body2">{comment}</Typography>
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Gesamtpreis:
            </Typography>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
              €{calculateTotalPrice().toFixed(2)}
            </Typography>
          </Box>

          {discount > 0 && (
            <Typography variant="body2" color="success.main" sx={{ textAlign: 'right', mt: 1 }}>
              Inkl. {discount}% Rabatt
            </Typography>
          )}
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<PreviewIcon />}
          onClick={() => setPreviewMode(true)}
        >
          PDF Vorschau
        </Button>
        <Button
          variant="outlined"
          startIcon={<WhatsAppIcon />}
          color="success"
        >
          Per WhatsApp
        </Button>
        <Button
          variant="outlined"
          startIcon={<EmailIcon />}
        >
          Per Email
        </Button>
      </Box>
    </Box>
  );

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderCustomerSelection();
      case 1:
        return renderServiceSelection();
      case 2:
        return renderCalculation();
      case 3:
        return renderPreview();
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Neues Angebot erstellen
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <DarkModeToggle />
            {calculateTotalPrice() > 0 && (
              <Chip
                icon={<EuroIcon />}
                label={`€${calculateTotalPrice().toFixed(2)}`}
                color="primary"
                sx={{ fontWeight: 700, fontSize: '1.1rem', py: 2.5, px: 1 }}
              />
            )}
          </Box>
        </Box>
      </Paper>

      {/* Stepper */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Content */}
      <motion.div
        key={activeStep}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.3 }}
      >
        {getStepContent(activeStep)}
      </motion.div>

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          startIcon={<ArrowBackIcon />}
          size="large"
        >
          Zurück
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          endIcon={activeStep === steps.length - 1 ? <SaveIcon /> : <ArrowForwardIcon />}
          disabled={saving}
          size="large"
        >
          {activeStep === steps.length - 1 ? 'Angebot speichern' : 'Weiter'}
        </Button>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Container>
  );
};

export default CreateQuote;