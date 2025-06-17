import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Paper, Typography, Box, TextField, Button, IconButton, Card, CardContent, InputAdornment, FormControlLabel, Switch, Divider, Tab, Tabs, Chip, Alert, CircularProgress, Slider, Dialog, DialogTitle, DialogContent, DialogActions, Stepper, Step, StepLabel, Badge, Tooltip, Fade, Zoom } from '@mui/material';
import Grid from './GridCompat';
import { 
  ArrowBack as ArrowBackIcon,
  Calculate as CalculateIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Send as SendIcon,
  GetApp as GetAppIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  AutoAwesome as AutoAwesomeIcon,
  LocalShipping as LocalShippingIcon,
  Home as HomeIcon,
  CleaningServices as CleaningServicesIcon,
  DeleteSweep as DeleteSweepIcon,
  Construction as ConstructionIcon,
  Piano as PianoIcon,
  FitnessCenter as FitnessCenterIcon,
  Inventory as InventoryIcon,
  LocalParking as LocalParkingIcon,
  Warehouse as WarehouseIcon,
  Build as BuildIcon,
  BuildCircle as BuildCircleIcon
} from '@mui/icons-material';
import { Customer } from '../types';
import { generatePDF } from '../services/pdfService';
import { sendEmailViaSMTP } from '../services/smtpEmailService';
import { sendQuoteEmailWithPDFShift } from '../services/emailServiceWithPDFShift';
import { sendEmail } from '../services/emailService';
import { databaseService as googleSheetsService } from '../config/database.config';
import { quoteCalculationService, QuoteDetails, QuoteCalculation } from '../services/quoteCalculation';
import { generateEmailHTML } from '../services/htmlEmailTemplate';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ServiceOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  basePrice: number;
  priceType: string;
  quantity?: number;
  hours?: number;
  volume?: number;
  price?: number;
  selected?: boolean;
}

const CreateQuote: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialCustomer = location.state?.customer as Customer;
  
  // Kundendaten
  const [customer, setCustomer] = useState<Customer>(initialCustomer || {} as Customer);
  
  // Quote Details mit allen neuen Services
  const [quoteDetails, setQuoteDetails] = useState<QuoteDetails>({
    volume: quoteCalculationService.getStandardVolume(),
    distance: 25,
    packingRequested: false,
    additionalServices: [],
    notes: '',
    boxCount: 0,
    parkingZonePrice: 0,
    storagePrice: 0,
    furnitureAssemblyPrice: 0,
    furnitureDisassemblyPrice: 0,
    cleaningService: false,
    cleaningHours: 0,
    clearanceService: false,
    clearanceVolume: 0,
    renovationService: false,
    renovationHours: 0,
    pianoTransport: false,
    heavyItemsCount: 0,
    packingMaterials: false,
    manualBasePrice: undefined
  });
  
  // Manueller Gesamtpreis
  const [useManualPrice, setUseManualPrice] = useState(false);
  const [manualTotalPrice, setManualTotalPrice] = useState(0);
  
  // Services State
  const [selectedServices, setSelectedServices] = useState<ServiceOption[]>([]);
  const [expressService, setExpressService] = useState(false);
  const [discount, setDiscount] = useState(0);
  
  // UI State
  const [activeStep, setActiveStep] = useState(0);
  const [calculation, setCalculation] = useState<QuoteCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const steps = ['Kundendaten', 'Services wählen', 'Kalkulation', 'Vorschau'];

  // Service Icons Mapping
  const getServiceIcon = (serviceId: string) => {
    const icons: Record<string, React.ReactNode> = {
      packing: <InventoryIcon />,
      boxes: <InventoryIcon />,
      cleaning: <CleaningServicesIcon />,
      clearance: <DeleteSweepIcon />,
      renovation: <ConstructionIcon />,
      piano: <PianoIcon />,
      heavy: <FitnessCenterIcon />,
      materials: <InventoryIcon />,
      parking: <LocalParkingIcon />,
      storage: <WarehouseIcon />,
      assembly: <BuildIcon />,
      disassembly: <BuildCircleIcon />
    };
    return icons[serviceId] || <HomeIcon />;
  };

  // Automatische Kalkulation
  useEffect(() => {
    if (customer.id) {
      updateCalculation();
    }
  }, [customer, quoteDetails, selectedServices, expressService, discount, useManualPrice, manualTotalPrice]);

  const updateCalculation = () => {
    // Services in QuoteDetails übertragen
    const updatedQuoteDetails: QuoteDetails = {
      ...quoteDetails,
      packingRequested: selectedServices.some(s => s.id === 'packing'),
      boxCount: selectedServices.find(s => s.id === 'boxes')?.quantity || 0,
      cleaningService: selectedServices.some(s => s.id === 'cleaning'),
      cleaningHours: selectedServices.find(s => s.id === 'cleaning')?.hours || 0,
      clearanceService: selectedServices.some(s => s.id === 'clearance'),
      clearanceVolume: selectedServices.find(s => s.id === 'clearance')?.volume || 0,
      renovationService: selectedServices.some(s => s.id === 'renovation'),
      renovationHours: selectedServices.find(s => s.id === 'renovation')?.hours || 0,
      pianoTransport: selectedServices.some(s => s.id === 'piano'),
      heavyItemsCount: selectedServices.find(s => s.id === 'heavy')?.quantity || 0,
      packingMaterials: selectedServices.some(s => s.id === 'materials'),
      parkingZonePrice: selectedServices.find(s => s.id === 'parking')?.price || 0,
      storagePrice: selectedServices.find(s => s.id === 'storage')?.price || 0,
      furnitureAssemblyPrice: selectedServices.find(s => s.id === 'assembly')?.price || 0,
      furnitureDisassemblyPrice: selectedServices.find(s => s.id === 'disassembly')?.price || 0
    };

    const calc = quoteCalculationService.calculateQuote(customer, updatedQuoteDetails);
    
    // Manueller Preis oder berechneter Preis
    let finalPrice;
    if (useManualPrice && manualTotalPrice > 0) {
      finalPrice = manualTotalPrice;
    } else {
      // Express Service (+25%)
      finalPrice = calc.totalPrice;
      if (expressService) {
        finalPrice = finalPrice * 1.25;
      }
      
      // Rabatt anwenden
      if (discount > 0) {
        finalPrice = finalPrice * (1 - discount / 100);
      }
    }
    
    setCalculation({ ...calc, finalPrice });
    setQuoteDetails(updatedQuoteDetails);
  };

  const handleServiceToggle = (service: ServiceOption) => {
    const isSelected = selectedServices.find(s => s.id === service.id);
    
    if (isSelected) {
      setSelectedServices(selectedServices.filter(s => s.id !== service.id));
    } else {
      const newService: ServiceOption = {
        ...service,
        selected: true,
        quantity: service.priceType === 'per_item' ? 1 : undefined,
        hours: service.priceType === 'per_hour' ? 1 : undefined,
        volume: service.priceType === 'by_volume' ? 5 : undefined,
        price: service.basePrice
      };
      setSelectedServices([...selectedServices, newService]);
    }
  };

  const updateServiceQuantity = (serviceId: string, field: string, value: number) => {
    setSelectedServices(selectedServices.map(service => 
      service.id === serviceId 
        ? { ...service, [field]: Math.max(0, value) }
        : service
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!calculation) {
      setError('Bitte warten Sie auf die Preisberechnung');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const quoteData = {
        id: `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        customerId: customer.id,
        customerName: customer.name,
        price: calculation.finalPrice,
        comment: quoteDetails.notes,
        createdAt: new Date(),
        createdBy: 'current-user-id',
        status: 'sent' as const
      };

      // Email mit verbessertem Fallback-System versenden
      await sendEmailWithFallback(customer, calculation, quoteDetails);

      // In Google Sheets speichern
      await googleSheetsService.addQuote(quoteData);

      setSuccess(true);
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (err) {
      setError('Fehler beim Erstellen des Angebots. Bitte versuchen Sie es erneut.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Verbessertes E-Mail-System mit Fallback
  const sendEmailWithFallback = async (customer: Customer, calculation: QuoteCalculation, quoteDetails: any): Promise<boolean> => {
    try {
      console.log('📧 Versuche E-Mail-Versendung mit PDFShift...');
      
      // Versuche zuerst PDFShift
      try {
        const success = await sendQuoteEmailWithPDFShift(customer, calculation, quoteDetails);
        if (success) {
          console.log('✅ E-Mail mit PDFShift erfolgreich gesendet');
          return true;
        }
      } catch (pdfShiftError) {
        console.warn('⚠️ PDFShift fehlgeschlagen, verwende Fallback:', pdfShiftError);
      }
      
      // Fallback 1: Lokale PDF-Generierung + E-Mail-Service
      try {
        console.log('📧 Versuche E-Mail mit lokalem PDF...');
        
        const htmlContent = generateEmailHTML(customer, calculation, quoteDetails);
        const quoteData = {
          customerId: customer.id,
          customerName: customer.name,
          price: calculation.finalPrice,
          comment: quoteDetails.notes,
          createdAt: new Date(),
          createdBy: 'current-user-id',
          status: 'sent' as const,
          volume: quoteDetails.volume,
          distance: quoteDetails.distance,
          calculation: calculation,
          details: quoteDetails
        };
        
        const pdfBlob = await generatePDF(customer, quoteData, htmlContent);
        
        const emailData = {
          to: customer.email,
          subject: `Ihr Umzugsangebot von RELOCATO® Bielefeld`,
          content: `
            Sehr geehrte/r ${customer.name},
            
            vielen Dank für Ihre Anfrage! Anbei erhalten Sie Ihr persönliches Umzugsangebot.
            
            Angebotsübersicht:
            - Umzugstermin: ${customer.movingDate || 'Nach Absprache'}
            - Von: ${customer.fromAddress || 'Wird noch mitgeteilt'}
            - Nach: ${customer.toAddress || 'Wird noch mitgeteilt'}
            - Volumen: ${quoteDetails.volume} m³
            - Entfernung: ${quoteDetails.distance} km
            
            Gesamtpreis: ${calculation.finalPrice.toFixed(2).replace('.', ',')} € (inkl. 19% MwSt.)
            
            Das detaillierte Angebot finden Sie im PDF-Anhang.
            
            Bei Fragen stehen wir Ihnen gerne zur Verfügung:
            Tel: (0521) 1200551-0
            E-Mail: bielefeld@relocato.de
            
            Mit freundlichen Grüßen
            Ihr RELOCATO® Team Bielefeld
          `,
          attachments: [{
            filename: `Umzugsangebot_${customer.name.replace(/\s+/g, '_')}.pdf`,
            content: pdfBlob
          }]
        };
        
        const success = await sendEmail(emailData);
        if (success) {
          console.log('✅ E-Mail mit lokalem PDF erfolgreich gesendet');
          return true;
        }
      } catch (localError) {
        console.warn('⚠️ Lokale E-Mail fehlgeschlagen:', localError);
      }
      
      // Fallback 2: Nur Text-E-Mail ohne PDF
      try {
        console.log('📧 Sende Text-E-Mail ohne PDF...');
        
        const textEmailData = {
          to: customer.email,
          subject: `Ihr Umzugsangebot von RELOCATO® Bielefeld`,
          content: `
            Sehr geehrte/r ${customer.name},
            
            vielen Dank für Ihre Anfrage! Hier ist Ihr Umzugsangebot:
            
            UMZUGSDETAILS:
            - Von: ${customer.fromAddress || 'Wird noch mitgeteilt'}
            - Nach: ${customer.toAddress || 'Wird noch mitgeteilt'}
            - Umzugstermin: ${customer.movingDate || 'Nach Absprache'}
            - Wohnungsgröße: ${customer.apartment?.rooms || '?'} Zimmer, ${customer.apartment?.area || '?'} m²
            - Volumen: ${quoteDetails.volume} m³
            - Entfernung: ${quoteDetails.distance} km
            
            GESAMTPREIS: ${calculation.finalPrice.toFixed(2).replace('.', ',')} € (inkl. 19% MwSt.)
            
            Dieses Angebot ist 14 Tage gültig.
            
            Bei Fragen stehen wir Ihnen gerne zur Verfügung:
            Tel: (0521) 1200551-0
            E-Mail: bielefeld@relocato.de
            
            Mit freundlichen Grüßen
            Ihr RELOCATO® Team Bielefeld
            
            ---
            RELOCATO® Bielefeld
            Detmolder Str. 234a, 33605 Bielefeld
            Wertvoll Dienstleistungen GmbH | HRB 43574
          `
        };
        
        const success = await sendEmail(textEmailData);
        if (success) {
          console.log('✅ Text-E-Mail erfolgreich gesendet');
          return true;
        }
      } catch (textError) {
        console.error('❌ Auch Text-E-Mail fehlgeschlagen:', textError);
      }
      
      throw new Error('Alle E-Mail-Versandmethoden fehlgeschlagen');
      
    } catch (error) {
      console.error('❌ E-Mail-Versand komplett fehlgeschlagen:', error);
      return false;
    }
  };

  const downloadPDF = async () => {
    try {
      if (!calculation) {
        setError('Keine Berechnung verfügbar');
        return;
      }
      
      setLoading(true);
      setError('');
      
      console.log('📄 Erstelle PDF...');
      console.log('Kundendaten:', customer);
      console.log('Berechnung:', calculation);
      
      // Validiere Kundendaten
      if (!customer || !customer.name) {
        console.warn('⚠️ Kundenname fehlt, verwende Standardwert');
      }
      
      // Verwende robuste jsPDF-Implementierung
      const quoteData = {
        customerId: customer.id || 'temp-id',
        customerName: customer.name || 'Unbekannt',
        price: calculation.finalPrice || 0,
        comment: quoteDetails.notes || '',
        createdAt: new Date(),
        createdBy: 'current-user-id',
        status: 'draft' as const,
        volume: quoteDetails.volume,
        distance: quoteDetails.distance,
        calculation: calculation,
        details: quoteDetails
      };
      
      console.log('Quote Daten:', quoteData);
      
      const pdfBlob = await generatePDF(customer, quoteData);
      console.log('✅ PDF erstellt, Größe:', pdfBlob.size, 'bytes');
      
      const url = URL.createObjectURL(pdfBlob);
      const fileName = `Umzugsangebot_${(customer.name || 'Kunde').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        // iOS: Öffne in neuem Tab
        window.open(url, '_blank');
      } else {
        // Desktop: Download
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      
      // Cleanup nach kurzer Verzögerung
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      setLoading(false);
      console.log('📥 PDF Download gestartet');
      
    } catch (err) {
      console.error('❌ PDF Download Error:', err);
      
      // Detaillierte Fehlermeldung
      let errorMessage = 'Fehler beim Erstellen der PDF. ';
      if (err instanceof Error) {
        errorMessage += err.message;
        console.error('Fehlerdetails:', err.stack);
      } else {
        errorMessage += 'Bitte versuchen Sie es erneut.';
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  if (!initialCustomer) {
    navigate('/search-customer');
    return null;
  }

  const serviceOptions = quoteCalculationService.getAvailableServices();

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate('/search-customer')} sx={{ mb: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          Angebot erstellen
        </Typography>
        <Typography variant="body1" color="text.secondary">
          100.000€ Premium Calculator • Alle Services • Live-Kalkulation
        </Typography>
      </Box>

      {/* Stepper */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel 
                onClick={() => setActiveStep(index)}
                sx={{ cursor: 'pointer' }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Step Content */}
      {activeStep === 0 && (
        <Fade in={true}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
            <Typography variant="h5" gutterBottom color="primary" sx={{ mb: 3 }}>
              <EditIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Kundendaten bearbeiten
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card elevation={2}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Kontaktdaten
                    </Typography>
                    
                    <TextField
                      fullWidth
                      label="Name"
                      value={customer.name}
                      onChange={(e) => setCustomer({...customer, name: e.target.value})}
                      sx={{ mb: 2 }}
                    />
                    
                    <TextField
                      fullWidth
                      label="Telefon"
                      value={customer.phone}
                      onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                      sx={{ mb: 2 }}
                    />
                    
                    <TextField
                      fullWidth
                      label="E-Mail"
                      value={customer.email}
                      onChange={(e) => setCustomer({...customer, email: e.target.value})}
                      sx={{ mb: 2 }}
                    />
                    
                    <TextField
                      fullWidth
                      label="Umzugsdatum"
                      type="date"
                      value={customer.movingDate}
                      onChange={(e) => setCustomer({...customer, movingDate: e.target.value})}
                      InputLabelProps={{ shrink: true }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card elevation={2}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Adressen & Wohnung
                    </Typography>
                    
                    <TextField
                      fullWidth
                      label="Von Adresse"
                      multiline
                      rows={2}
                      value={customer.fromAddress}
                      onChange={(e) => setCustomer({...customer, fromAddress: e.target.value})}
                      sx={{ mb: 2 }}
                    />
                    
                    <TextField
                      fullWidth
                      label="Nach Adresse"
                      multiline
                      rows={2}
                      value={customer.toAddress}
                      onChange={(e) => setCustomer({...customer, toAddress: e.target.value})}
                      sx={{ mb: 2 }}
                    />
                    
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={4}>
                        <TextField
                          fullWidth
                          label="Zimmer"
                          type="number"
                          value={customer.apartment?.rooms || 3}
                          onChange={(e) => setCustomer({
                            ...customer, 
                            apartment: {...customer.apartment, rooms: Number(e.target.value)}
                          })}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          fullWidth
                          label="Fläche m²"
                          type="number"
                          value={customer.apartment?.area || 50}
                          onChange={(e) => setCustomer({
                            ...customer, 
                            apartment: {...customer.apartment, area: Number(e.target.value)}
                          })}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          fullWidth
                          label="Etage"
                          type="number"
                          value={customer.apartment?.floor || 1}
                          onChange={(e) => setCustomer({
                            ...customer, 
                            apartment: {...customer.apartment, floor: Number(e.target.value)}
                          })}
                        />
                      </Grid>
                    </Grid>
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={customer.apartment?.hasElevator || false}
                          onChange={(e) => setCustomer({
                            ...customer, 
                            apartment: {...customer.apartment, hasElevator: e.target.checked}
                          })}
                        />
                      }
                      label="Aufzug vorhanden"
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, textAlign: 'right' }}>
              <Button 
                variant="contained" 
                onClick={() => setActiveStep(1)}
                size="large"
                sx={{ minWidth: 150 }}
              >
                Weiter
              </Button>
            </Box>
          </Paper>
        </Fade>
      )}

      {activeStep === 1 && (
        <Fade in={true}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
            <Typography variant="h5" gutterBottom color="primary" sx={{ mb: 3 }}>
              <AutoAwesomeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Premium Services wählen
            </Typography>
            
            <Grid container spacing={3}>
              {serviceOptions.map((service) => {
                const isSelected = selectedServices.find(s => s.id === service.id);
                const selectedService = isSelected;
                
                return (
                  <Grid item xs={12} sm={6} md={4} key={service.id}>
                    <Zoom in={true} style={{ transitionDelay: `${serviceOptions.indexOf(service) * 100}ms` }}>
                      <Card 
                        elevation={isSelected ? 8 : 2}
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                          border: isSelected ? 2 : 0,
                          borderColor: 'primary.main',
                          background: isSelected 
                            ? 'linear-gradient(135deg, rgba(25, 118, 210, 0.1), rgba(25, 118, 210, 0.05))'
                            : 'background.paper',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            boxShadow: 8
                          }
                        }}
                        onClick={() => handleServiceToggle(service)}
                      >
                        <CardContent sx={{ textAlign: 'center', position: 'relative' }}>
                          {isSelected && (
                            <CheckCircleIcon 
                              color="primary" 
                              sx={{ 
                                position: 'absolute', 
                                top: 8, 
                                right: 8,
                                fontSize: 28
                              }} 
                            />
                          )}
                          
                          <Box sx={{ fontSize: 48, mb: 2 }}>
                            {service.icon}
                          </Box>
                          
                          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                            {service.name}
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                            {service.description}
                          </Typography>
                          
                          <Chip 
                            label={
                              service.priceType === 'fixed' ? `€${service.basePrice}` :
                              service.priceType === 'per_item' ? `€${service.basePrice}/Stk` :
                              service.priceType === 'per_hour' ? `€${service.basePrice}/h` :
                              service.priceType === 'calculated' ? 'Kalkuliert' :
                              service.priceType === 'by_volume' ? 'Nach m³' :
                              'Individuell'
                            }
                            color={isSelected ? 'primary' : 'default'}
                            variant={isSelected ? 'filled' : 'outlined'}
                            sx={{ mt: 1 }}
                          />
                          
                          {isSelected && selectedService && (
                            <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                              {service.priceType === 'per_item' && (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                  <IconButton 
                                    size="small" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateServiceQuantity(service.id, 'quantity', (selectedService.quantity || 1) - 1);
                                    }}
                                  >
                                    <RemoveIcon />
                                  </IconButton>
                                  <Typography variant="h6" sx={{ minWidth: 40, textAlign: 'center' }}>
                                    {selectedService.quantity || 1}
                                  </Typography>
                                  <IconButton 
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateServiceQuantity(service.id, 'quantity', (selectedService.quantity || 1) + 1);
                                    }}
                                  >
                                    <AddIcon />
                                  </IconButton>
                                </Box>
                              )}
                              
                              {service.priceType === 'per_hour' && (
                                <TextField
                                  fullWidth
                                  label="Stunden"
                                  type="number"
                                  size="small"
                                  value={selectedService.hours || 1}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => updateServiceQuantity(service.id, 'hours', Number(e.target.value))}
                                  inputProps={{ min: 1 }}
                                />
                              )}
                              
                              {service.priceType === 'by_volume' && (
                                <TextField
                                  fullWidth
                                  label="Volumen (m³)"
                                  type="number"
                                  size="small"
                                  value={selectedService.volume || 5}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => updateServiceQuantity(service.id, 'volume', Number(e.target.value))}
                                  inputProps={{ min: 1 }}
                                />
                              )}
                              
                              {service.priceType === 'manual' && (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                                  ✓ Ausgewählt
                                </Typography>
                              )}
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Zoom>
                  </Grid>
                );
              })}
            </Grid>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
              <Button 
                variant="outlined" 
                onClick={() => setActiveStep(0)}
                size="large"
              >
                Zurück
              </Button>
              <Badge badgeContent={selectedServices.length} color="primary">
                <Button 
                  variant="contained" 
                  onClick={() => setActiveStep(2)}
                  size="large"
                  sx={{ minWidth: 150 }}
                >
                  Kalkulation
                </Button>
              </Badge>
            </Box>
          </Paper>
        </Fade>
      )}

      {activeStep === 2 && (
        <Fade in={true}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                <Typography variant="h5" gutterBottom color="primary" sx={{ mb: 3 }}>
                  <CalculateIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Umzugsdetails & Kalkulation
                </Typography>
                
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Geschätztes Volumen (m³)"
                      type="number"
                      value={quoteDetails.volume}
                      onChange={(e) => setQuoteDetails({...quoteDetails, volume: Number(e.target.value)})}
                      helperText={`Standard: 20 m³ (85% aller Umzüge) • Bei ${customer.apartment?.area || 50} m²: ca. ${quoteCalculationService.estimateVolumeFromArea(customer.apartment?.area || 50)} m³`}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Entfernung (km)"
                      type="number"
                      value={quoteDetails.distance}
                      onChange={(e) => setQuoteDetails({...quoteDetails, distance: Number(e.target.value)})}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom color="primary">
                  Premium Features
                </Typography>

                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={6}>
                    <Card elevation={2} sx={{ p: 2 }}>
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
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              <LocalShippingIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                              Express-Service
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              +25% Aufschlag für prioritäre Behandlung
                            </Typography>
                          </Box>
                        }
                      />
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card elevation={2} sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                        💰 Rabatt gewähren
                      </Typography>
                      <Box sx={{ px: 2 }}>
                        <Slider
                          value={discount}
                          onChange={(e, newValue) => setDiscount(newValue as number)}
                          step={5}
                          marks
                          min={0}
                          max={30}
                          valueLabelDisplay="auto"
                          valueLabelFormat={(value) => `${value}%`}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        Aktueller Rabatt: {discount}%
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
                
                <TextField
                  fullWidth
                  label="Zusätzliche Hinweise"
                  multiline
                  rows={4}
                  value={quoteDetails.notes}
                  onChange={(e) => setQuoteDetails({...quoteDetails, notes: e.target.value})}
                  placeholder="z.B. schwere Möbel, besondere Anforderungen..."
                  sx={{ mb: 3 }}
                />
                
                <Divider sx={{ my: 2 }} />
                
                {/* Manueller Gesamtpreis */}
                <Typography variant="h6" gutterBottom color="primary">
                  💰 Preisgestaltung
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={useManualPrice}
                      onChange={(e) => setUseManualPrice(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Manuellen Gesamtpreis verwenden"
                  sx={{ mb: 2 }}
                />
                
                {useManualPrice && (
                  <TextField
                    fullWidth
                    label="Gesamtpreis (inkl. MwSt.)"
                    type="number"
                    value={manualTotalPrice}
                    onChange={(e) => setManualTotalPrice(Number(e.target.value))}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">€</InputAdornment>
                    }}
                    helperText="Geben Sie den finalen Gesamtpreis inkl. aller Leistungen und MwSt. ein"
                  />
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 3, position: 'sticky', top: 20 }}>
                <Typography variant="h6" gutterBottom color="primary" sx={{ textAlign: 'center' }}>
                  💰 Live-Kalkulation
                </Typography>
                
                {calculation && (
                  <Box>
                    {useManualPrice && manualTotalPrice > 0 ? (
                      <>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Manueller Preis:
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                          Alle ausgewählten Leistungen sind im Gesamtpreis enthalten.
                        </Typography>
                      </>
                    ) : (
                      <>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Preisaufstellung:
                        </Typography>
                    
                    {/* Basis */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        Be- und Entladen ({calculation.volumeRange}):
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        €{calculation.priceBreakdown.base.toFixed(2)}
                      </Typography>
                    </Box>
                    
                    {/* Etagen */}
                    {calculation.priceBreakdown.floors > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Etagen-Zuschlag:</Typography>
                        <Typography variant="body2">€{calculation.priceBreakdown.floors.toFixed(2)}</Typography>
                      </Box>
                    )}
                    
                    {/* Entfernung */}
                    {calculation.priceBreakdown.distance > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Entfernungs-Zuschlag:</Typography>
                        <Typography variant="body2">€{calculation.priceBreakdown.distance.toFixed(2)}</Typography>
                      </Box>
                    )}
                    
                    {/* Alle Services anzeigen */}
                    {selectedServices.map(service => {
                      let servicePrice = 0;
                      let serviceName = service.name;
                      
                      if (service.id === 'packing') servicePrice = calculation.priceBreakdown.packing;
                      else if (service.id === 'boxes') servicePrice = calculation.priceBreakdown.boxes;
                      else if (service.id === 'cleaning') servicePrice = calculation.priceBreakdown.cleaning;
                      else if (service.id === 'clearance') servicePrice = calculation.priceBreakdown.clearance;
                      else if (service.id === 'renovation') servicePrice = calculation.priceBreakdown.renovation;
                      else if (service.id === 'piano') servicePrice = calculation.priceBreakdown.piano;
                      else if (service.id === 'heavy') servicePrice = calculation.priceBreakdown.heavyItems;
                      else if (service.id === 'materials') servicePrice = calculation.priceBreakdown.packingMaterials;
                      else if (service.id === 'parking') servicePrice = calculation.priceBreakdown.parkingZone;
                      else if (service.id === 'storage') servicePrice = calculation.priceBreakdown.storage;
                      else if (service.id === 'assembly') servicePrice = calculation.priceBreakdown.furnitureAssembly;
                      else if (service.id === 'disassembly') servicePrice = calculation.priceBreakdown.furnitureDisassembly;
                      
                      if (servicePrice > 0) {
                        return (
                          <Box key={service.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">{serviceName}:</Typography>
                            <Typography variant="body2">€{servicePrice.toFixed(2)}</Typography>
                          </Box>
                        );
                      }
                      return null;
                    })}
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body1">Zwischensumme:</Typography>
                      <Typography variant="body1">€{calculation.totalPrice.toFixed(2)}</Typography>
                    </Box>
                    
                    {expressService && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="warning.main">Express-Service (+25%):</Typography>
                        <Typography variant="body2" color="warning.main">
                          €{(calculation.totalPrice * 0.25).toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                    
                    {discount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="success.main">Rabatt (-{discount}%):</Typography>
                        <Typography variant="body2" color="success.main">
                          -€{((expressService ? calculation.totalPrice * 1.25 : calculation.totalPrice) * discount / 100).toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                    
                    <Divider sx={{ my: 2 }} />
                      </>
                    )}
                    
                    <Box sx={{ 
                      textAlign: 'center', 
                      p: 2, 
                      borderRadius: 2, 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white'
                    }}>
                      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        €{calculation.finalPrice.toFixed(2)}
                      </Typography>
                      <Typography variant="body2">
                        inkl. 19% MwSt.
                      </Typography>
                    </Box>
                  </Box>
                )}
                
                <Box sx={{ mt: 3, display: 'flex', gap: 1, flexDirection: 'column' }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setActiveStep(3)}
                    size="large"
                  >
                    Vorschau
                  </Button>
                  
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={downloadPDF}
                    disabled={loading || !calculation?.finalPrice}
                    startIcon={loading ? <CircularProgress size={20} /> : <GetAppIcon />}
                    size="large"
                  >
                    PDF Download
                  </Button>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button 
                  variant="outlined" 
                  onClick={() => setActiveStep(1)}
                  size="large"
                >
                  Zurück
                </Button>
                <Button 
                  variant="contained" 
                  onClick={() => setActiveStep(3)}
                  size="large"
                  sx={{ minWidth: 150 }}
                >
                  Zur Vorschau
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Fade>
      )}

      {activeStep === 3 && (
        <Fade in={true}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
            <Typography variant="h5" gutterBottom color="primary" sx={{ mb: 3 }}>
              <CheckCircleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Angebot-Vorschau
            </Typography>
            
            {calculation && (
              <Box>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} md={6}>
                    <Card elevation={2}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom color="primary">
                          Kundendaten
                        </Typography>
                        <Typography variant="body1"><strong>Name:</strong> {customer.name}</Typography>
                        <Typography variant="body1"><strong>Telefon:</strong> {customer.phone}</Typography>
                        <Typography variant="body1"><strong>E-Mail:</strong> {customer.email}</Typography>
                        <Typography variant="body1"><strong>Von:</strong> {customer.fromAddress}</Typography>
                        <Typography variant="body1"><strong>Nach:</strong> {customer.toAddress}</Typography>
                        <Typography variant="body1"><strong>Datum:</strong> {customer.movingDate}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card elevation={2}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom color="primary">
                          Gewählte Services
                        </Typography>
                        {selectedServices.length > 0 ? (
                          selectedServices.map(service => (
                            <Chip 
                              key={service.id}
                              label={service.name}
                              color="primary"
                              sx={{ mr: 1, mb: 1 }}
                            />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Nur Basis-Umzug
                          </Typography>
                        )}
                        
                        {expressService && (
                          <Chip 
                            label="Express-Service"
                            color="warning"
                            sx={{ mr: 1, mb: 1 }}
                          />
                        )}
                        
                        {discount > 0 && (
                          <Chip 
                            label={`${discount}% Rabatt`}
                            color="success"
                            sx={{ mr: 1, mb: 1 }}
                          />
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 4, 
                  borderRadius: 3, 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  mb: 4
                }}>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
                    €{calculation.finalPrice.toFixed(2)}
                  </Typography>
                  <Typography variant="h6">
                    Ihr Premium-Umzugspreis (inkl. 19% MwSt.)
                  </Typography>
                </Box>
                
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Angebot wurde erfolgreich versendet! 🎉
                  </Alert>
                )}
                
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button 
                    variant="outlined" 
                    onClick={() => setActiveStep(2)}
                    size="large"
                  >
                    Zurück
                  </Button>
                  
                  <Button
                    variant="outlined"
                    onClick={downloadPDF}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <GetAppIcon />}
                    size="large"
                  >
                    PDF Download
                  </Button>
                  
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading || success}
                    startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                    size="large"
                    sx={{ minWidth: 180 }}
                  >
                    Per E-Mail senden
                  </Button>
                </Box>
              </Box>
            )}
          </Paper>
        </Fade>
      )}
    </Container>
  );
};

export default CreateQuote;