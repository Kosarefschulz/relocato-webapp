import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  IconButton,
  Grid,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  Business as BusinessIcon,
  Save as SaveIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { Customer } from '../types';
import { googleSheetsPublicService as googleSheetsService } from '../services/googleSheetsPublic';

const NewCustomer: React.FC = () => {
  const navigate = useNavigate();
  
  // Step management
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Kontaktdaten', 'Adressdaten', 'Wohnungsdetails'];
  
  // Customer data
  const [customer, setCustomer] = useState<Partial<Customer>>({
    name: '',
    phone: '',
    email: '',
    movingDate: '',
    fromAddress: '',
    toAddress: '',
    apartment: {
      rooms: 3,
      area: 50,
      floor: 1,
      hasElevator: false
    }
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Validation functions
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};
    
    switch (step) {
      case 0: // Kontaktdaten
        if (!customer.name?.trim()) errors.name = 'Name ist erforderlich';
        if (!customer.phone?.trim()) errors.phone = 'Telefonnummer ist erforderlich';
        if (!customer.email?.trim()) {
          errors.email = 'E-Mail ist erforderlich';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
          errors.email = 'E-Mail-Format ist ungültig';
        }
        if (!customer.movingDate) errors.movingDate = 'Umzugsdatum ist erforderlich';
        break;
        
      case 1: // Adressdaten
        if (!customer.fromAddress?.trim()) errors.fromAddress = 'Aktuelle Adresse ist erforderlich';
        if (!customer.toAddress?.trim()) errors.toAddress = 'Neue Adresse ist erforderlich';
        break;
        
      case 2: // Wohnungsdetails
        if (!customer.apartment?.rooms || customer.apartment.rooms < 1) {
          errors.rooms = 'Anzahl Zimmer muss mindestens 1 sein';
        }
        if (!customer.apartment?.area || customer.apartment.area < 1) {
          errors.area = 'Wohnfläche muss mindestens 1 m² sein';
        }
        if (customer.apartment?.floor === undefined || customer.apartment.floor < 0) {
          errors.floor = 'Etage muss mindestens 0 (Erdgeschoss) sein';
        }
        break;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSave = async () => {
    if (!validateStep(activeStep)) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Generate customer ID
      const timestamp = Date.now();
      const customerId = `C-${timestamp}`;
      
      const newCustomer: Customer = {
        id: customerId,
        name: customer.name!,
        phone: customer.phone!,
        email: customer.email!,
        movingDate: customer.movingDate!,
        fromAddress: customer.fromAddress!,
        toAddress: customer.toAddress!,
        apartment: {
          rooms: customer.apartment!.rooms,
          area: customer.apartment!.area,
          floor: customer.apartment!.floor,
          hasElevator: customer.apartment!.hasElevator
        },
        createdAt: new Date()
      };
      
      // Save to Google Sheets
      const success = await googleSheetsService.addCustomer(newCustomer);
      
      if (success) {
        // Navigate to create quote with new customer
        navigate('/create-quote', { state: { customer: newCustomer } });
      } else {
        setError('Fehler beim Speichern des Kunden. Bitte versuchen Sie es erneut.');
      }
      
    } catch (err) {
      setError('Fehler beim Speichern des Kunden. Bitte versuchen Sie es erneut.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isStepComplete = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!(customer.name && customer.phone && customer.email && customer.movingDate);
      case 1:
        return !!(customer.fromAddress && customer.toAddress);
      case 2:
        return !!(customer.apartment?.rooms && customer.apartment?.area !== undefined);
      default:
        return false;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate('/dashboard')} sx={{ mb: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" gutterBottom>
          Neuer Kunde
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Kundendaten erfassen und direkt Angebot erstellen
        </Typography>
      </Box>

      {/* Stepper */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label, index) => (
            <Step key={label} completed={isStepComplete(index)}>
              <StepLabel>
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Step Content */}
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        {activeStep === 0 && (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <PersonIcon sx={{ mr: 1 }} />
              Kontaktdaten
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card elevation={1}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Persönliche Informationen
                    </Typography>
                    
                    <TextField
                      fullWidth
                      label="Vollständiger Name"
                      value={customer.name || ''}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      error={!!validationErrors.name}
                      helperText={validationErrors.name}
                      sx={{ mb: 3 }}
                      required
                    />
                    
                    <TextField
                      fullWidth
                      label="Telefonnummer"
                      value={customer.phone || ''}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      error={!!validationErrors.phone}
                      helperText={validationErrors.phone || 'Für Rückfragen und Terminkoordination'}
                      sx={{ mb: 3 }}
                      required
                    />
                    
                    <TextField
                      fullWidth
                      label="E-Mail-Adresse"
                      type="email"
                      value={customer.email || ''}
                      onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                      error={!!validationErrors.email}
                      helperText={validationErrors.email || 'Für Angebote und Rechnungen'}
                      sx={{ mb: 3 }}
                      required
                    />
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card elevation={1}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Umzugstermin
                    </Typography>
                    
                    <TextField
                      fullWidth
                      label="Gewünschtes Umzugsdatum"
                      type="date"
                      value={customer.movingDate || ''}
                      onChange={(e) => setCustomer({ ...customer, movingDate: e.target.value })}
                      error={!!validationErrors.movingDate}
                      helperText={validationErrors.movingDate || 'Wann soll der Umzug stattfinden?'}
                      InputLabelProps={{ shrink: true }}
                      sx={{ mb: 3 }}
                      required
                    />
                    
                    <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Hinweis:</strong> Nach der Erfassung können Sie direkt ein Angebot für diesen Kunden erstellen.
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <HomeIcon sx={{ mr: 1 }} />
              Adressdaten
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card elevation={1}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Umzugsadressen
                    </Typography>
                    
                    <TextField
                      fullWidth
                      label="Aktuelle Adresse (Von)"
                      multiline
                      rows={3}
                      value={customer.fromAddress || ''}
                      onChange={(e) => setCustomer({ ...customer, fromAddress: e.target.value })}
                      error={!!validationErrors.fromAddress}
                      helperText={validationErrors.fromAddress || 'Vollständige Adresse mit Straße, PLZ und Ort'}
                      sx={{ mb: 3 }}
                      required
                    />
                    
                    <TextField
                      fullWidth
                      label="Neue Adresse (Nach)"
                      multiline
                      rows={3}
                      value={customer.toAddress || ''}
                      onChange={(e) => setCustomer({ ...customer, toAddress: e.target.value })}
                      error={!!validationErrors.toAddress}
                      helperText={validationErrors.toAddress || 'Vollständige Zieladresse'}
                      sx={{ mb: 3 }}
                      required
                    />
                    
                    <Box sx={{ mt: 2, p: 2, backgroundColor: 'info.light', borderRadius: 1 }}>
                      <Typography variant="body2" color="info.contrastText">
                        <strong>Tipp:</strong> Je genauer die Adressen, desto präziser kann die Entfernung und der Preis kalkuliert werden.
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {activeStep === 2 && (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <BusinessIcon sx={{ mr: 1 }} />
              Wohnungsdetails
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card elevation={1}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Wohnungsgröße
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Anzahl Zimmer"
                          type="number"
                          value={customer.apartment?.rooms || ''}
                          onChange={(e) => setCustomer({
                            ...customer,
                            apartment: { ...customer.apartment!, rooms: Number(e.target.value) }
                          })}
                          error={!!validationErrors.rooms}
                          helperText={validationErrors.rooms}
                          inputProps={{ min: 1, max: 20 }}
                          required
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Wohnfläche (m²)"
                          type="number"
                          value={customer.apartment?.area || ''}
                          onChange={(e) => setCustomer({
                            ...customer,
                            apartment: { ...customer.apartment!, area: Number(e.target.value) }
                          })}
                          error={!!validationErrors.area}
                          helperText={validationErrors.area}
                          inputProps={{ min: 1, max: 1000 }}
                          required
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card elevation={1}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Stockwerk & Aufzug
                    </Typography>
                    
                    <TextField
                      fullWidth
                      label="Etage"
                      type="number"
                      value={customer.apartment?.floor !== undefined ? customer.apartment.floor : ''}
                      onChange={(e) => setCustomer({
                        ...customer,
                        apartment: { ...customer.apartment!, floor: Number(e.target.value) }
                      })}
                      error={!!validationErrors.floor}
                      helperText={validationErrors.floor || 'Erdgeschoss = 0, 1. Stock = 1, usw.'}
                      inputProps={{ min: 0, max: 50 }}
                      sx={{ mb: 3 }}
                      required
                    />
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={customer.apartment?.hasElevator || false}
                          onChange={(e) => setCustomer({
                            ...customer,
                            apartment: { ...customer.apartment!, hasElevator: e.target.checked }
                          })}
                          color="primary"
                        />
                      }
                      label="Aufzug vorhanden"
                    />
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Wichtig für die Preiskalkulation - ohne Aufzug fallen Zuschläge an
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            <Box sx={{ p: 2, backgroundColor: 'success.light', borderRadius: 1 }}>
              <Typography variant="body1" color="success.contrastText" sx={{ fontWeight: 'bold', mb: 1 }}>
                Bereit für Angebotserstellung
              </Typography>
              <Typography variant="body2" color="success.contrastText">
                Nach dem Speichern werden Sie automatisch zur Angebotserstellung für diesen Kunden weitergeleitet.
              </Typography>
            </Box>
          </Box>
        )}

        {/* Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            size="large"
            sx={{ minWidth: 120 }}
          >
            Zurück
          </Button>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            {activeStep < steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{ minWidth: 120 }}
              >
                Weiter
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={loading}
                size="large"
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                sx={{ minWidth: 180 }}
              >
                {loading ? 'Speichere...' : 'Speichern & Angebot erstellen'}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Progress Summary */}
      <Paper elevation={1} sx={{ p: 2, mt: 3, backgroundColor: 'grey.50' }}>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          Schritt {activeStep + 1} von {steps.length} • 
          {isStepComplete(activeStep) ? ' Dieser Schritt ist vollständig' : ' Bitte füllen Sie alle Pflichtfelder aus'}
        </Typography>
      </Paper>
    </Container>
  );
};

export default NewCustomer;