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
  Card,
  CardContent,
  InputAdornment,
  FormControlLabel,
  Switch,
  Divider,
  Grid,
  useTheme,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Calculate as CalculateIcon,
  Edit as EditIcon,
  Send as SendIcon,
  GetApp as GetAppIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Build as BuildIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';
import { Customer } from '../types';
import { sendEmail } from '../services/emailService';
import { googleSheetsPublicService as googleSheetsService } from '../services/googleSheetsPublic';
import { quoteCalculationService, QuoteDetails, QuoteCalculation } from '../services/quoteCalculation';
import { generateEmailHTML } from '../services/htmlEmailTemplate';
import { generatePDF } from '../services/pdfService';
import { useResponsive } from '../hooks/useResponsive';

const CreateQuote: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { isMobile, getTextFieldProps, getButtonProps } = useResponsive();
  const initialCustomer = location.state?.customer as Customer;
  
  // Expanded sections for mobile accordion
  const [expandedSection, setExpandedSection] = useState<string | false>('customer');
  
  // Kundendaten
  const [customer, setCustomer] = useState<Customer>(initialCustomer || {} as Customer);
  
  // Quote Details - alle Werte manuell eingebbar
  const [quoteDetails, setQuoteDetails] = useState<QuoteDetails>({
    volume: 0,
    distance: 0,
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
    manualBasePrice: 0
  });
  
  // Services als Switches
  const [selectedServices, setSelectedServices] = useState({
    packing: false,
    boxes: false,
    cleaning: false,
    clearance: false,
    renovation: false,
    piano: false,
    heavyItems: false,
    packingMaterials: false,
    parking: false,
    storage: false,
    assembly: false,
    disassembly: false
  });
  
  // Manueller Gesamtpreis
  const [useManualPrice, setUseManualPrice] = useState(false);
  const [manualTotalPrice, setManualTotalPrice] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [calculation, setCalculation] = useState<QuoteCalculation | null>(null);
  const [editMode, setEditMode] = useState(false);
  
  // Kalkulation aktualisieren
  useEffect(() => {
    if (customer.id) {
      const updatedQuoteDetails = {
        ...quoteDetails,
        packingRequested: selectedServices.packing,
        boxCount: selectedServices.boxes ? quoteDetails.boxCount : 0,
        cleaningService: selectedServices.cleaning,
        cleaningHours: selectedServices.cleaning ? quoteDetails.cleaningHours : 0,
        clearanceService: selectedServices.clearance,
        clearanceVolume: selectedServices.clearance ? quoteDetails.clearanceVolume : 0,
        renovationService: selectedServices.renovation,
        renovationHours: selectedServices.renovation ? quoteDetails.renovationHours : 0,
        pianoTransport: selectedServices.piano,
        heavyItemsCount: selectedServices.heavyItems ? quoteDetails.heavyItemsCount : 0,
        packingMaterials: selectedServices.packingMaterials,
        parkingZonePrice: selectedServices.parking ? 1 : 0,
        storagePrice: selectedServices.storage ? 1 : 0,
        furnitureAssemblyPrice: selectedServices.assembly ? 1 : 0,
        furnitureDisassemblyPrice: selectedServices.disassembly ? 1 : 0
      };
      
      const calc = quoteCalculationService.calculateQuote(customer, updatedQuoteDetails);
      
      // Manueller Preis überschreibt Berechnung
      if (useManualPrice && manualTotalPrice > 0) {
        setCalculation({ ...calc, finalPrice: manualTotalPrice, totalPrice: manualTotalPrice });
      } else {
        setCalculation({ ...calc, finalPrice: calc.totalPrice });
      }
    }
  }, [customer, quoteDetails, selectedServices, useManualPrice, manualTotalPrice]);

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSection(isExpanded ? panel : false);
  };

  const saveQuote = async () => {
    if (!calculation) return;
    
    try {
      console.log('💰 Speichere Angebot...');
      
      const quote = {
        id: `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        customerId: customer.id,
        customerName: customer.name,
        price: calculation.finalPrice,
        comment: quoteDetails.notes,
        createdAt: new Date(),
        createdBy: 'current-user-id',
        status: 'draft' as const,
        volume: quoteDetails.volume,
        distance: quoteDetails.distance,
        calculation: calculation,
        details: quoteDetails
      };
      
      await googleSheetsService.addQuote(quote);
      console.log('💰 Angebot erfolgreich erstellt und lokal gespeichert:', quote);
      
      return quote;
    } catch (err) {
      console.error('Fehler beim Speichern:', err);
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!calculation) {
      setError('Bitte warten Sie auf die Preisberechnung');
      return;
    }
    
    if (!customer.email || !customer.email.includes('@')) {
      setError('Bitte geben Sie eine gültige E-Mail-Adresse ein');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      // Angebot speichern
      const quote = await saveQuote();
      
      // PDF generieren
      const pdfBlob = await generatePDF(customer, quote, generateEmailHTML(customer, calculation, quoteDetails));
      
      // E-Mail senden
      const emailData = {
        to: customer.email,
        subject: `Ihr Umzugsangebot von wertvoll`,
        content: generateEmailHTML(customer, calculation, quoteDetails),
        attachments: [{
          filename: `Umzugsangebot_${customer.name.replace(/\s+/g, '_')}.pdf`,
          content: pdfBlob
        }]
      };
      
      const sent = await sendEmail(emailData);
      
      if (sent) {
        setSuccess(true);
        console.log('✅ Angebot erfolgreich versendet');
        
        // Nach 3 Sekunden zurück zur Kundendetails
        setTimeout(() => {
          navigate(`/customer-details/${customer.id}`);
        }, 3000);
      } else {
        setError('E-Mail konnte nicht gesendet werden');
      }
    } catch (err) {
      console.error('❌ Fehler beim E-Mail-Versand:', err);
      setError('Fehler beim Versenden des Angebots');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    try {
      if (!calculation) return;
      
      setLoading(true);
      setError('');
      
      console.log('📄 Erstelle PDF lokal...');
      
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
      
      const pdfBlob = await generatePDF(customer, quoteData);
      console.log('✅ PDF erstellt, Größe:', pdfBlob.size, 'bytes');
      
      const url = URL.createObjectURL(pdfBlob);
      const fileName = `Angebot-${customer.name}-${new Date().toISOString().split('T')[0]}.pdf`;
      
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
      
      // Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      setLoading(false);
      console.log('📥 PDF Download gestartet');
      
    } catch (err) {
      console.error('❌ PDF Download Error:', err);
      
      let errorMessage = 'Fehler beim Erstellen der PDF. ';
      if (err instanceof Error) {
        errorMessage += err.message;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  if (!initialCustomer) {
    navigate('/search-customer');
    return null;
  }

  const renderMobileLayout = () => (
    <Container maxWidth="lg" sx={{ px: 2, py: 2, pb: 10 }}>
      {/* Header */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton onClick={() => navigate(`/customer-details/${customer.id}`)} edge="start">
          <ArrowBackIcon />
        </IconButton>
        
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          Angebot erstellen
        </Typography>
      </Box>

      {/* Mobile Accordions */}
      <Box sx={{ mb: 2 }}>
        {/* Customer Data Accordion */}
        <Accordion 
          expanded={expandedSection === 'customer'} 
          onChange={handleAccordionChange('customer')}
          sx={{ mb: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon color="primary" />
              <Typography variant="subtitle1" fontWeight="medium">Kundendaten</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <IconButton onClick={() => setEditMode(!editMode)} size="small" color="primary">
                <EditIcon />
              </IconButton>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Name"
                  value={customer.name}
                  onChange={(e) => setCustomer({...customer, name: e.target.value})}
                  disabled={!editMode}
                  {...getTextFieldProps()}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="E-Mail"
                  type="email"
                  value={customer.email}
                  onChange={(e) => setCustomer({...customer, email: e.target.value})}
                  disabled={!editMode}
                  {...getTextFieldProps()}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Telefon"
                  type="tel"
                  value={customer.phone}
                  onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                  disabled={!editMode}
                  {...getTextFieldProps()}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Umzugsdatum"
                  type="date"
                  value={customer.movingDate || ''}
                  onChange={(e) => setCustomer({...customer, movingDate: e.target.value})}
                  disabled={!editMode}
                  InputLabelProps={{ shrink: true }}
                  {...getTextFieldProps()}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Von Adresse"
                  multiline
                  rows={2}
                  value={customer.fromAddress}
                  onChange={(e) => setCustomer({...customer, fromAddress: e.target.value})}
                  disabled={!editMode}
                  {...getTextFieldProps()}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nach Adresse"
                  multiline
                  rows={2}
                  value={customer.toAddress}
                  onChange={(e) => setCustomer({...customer, toAddress: e.target.value})}
                  disabled={!editMode}
                  {...getTextFieldProps()}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Calculation Details Accordion */}
        <Accordion 
          expanded={expandedSection === 'calculation'} 
          onChange={handleAccordionChange('calculation')}
          sx={{ mb: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalculateIcon color="primary" />
              <Typography variant="subtitle1" fontWeight="medium">Kalkulation</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Volumen m³"
                  type="number"
                  inputProps={{ step: "0.1" }}
                  value={quoteDetails.volume || ''}
                  onChange={(e) => setQuoteDetails({...quoteDetails, volume: Number(e.target.value)})}
                  {...getTextFieldProps()}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Entfernung km"
                  type="number"
                  value={quoteDetails.distance || ''}
                  onChange={(e) => setQuoteDetails({...quoteDetails, distance: Number(e.target.value)})}
                  {...getTextFieldProps()}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom color="primary">
                  Preisgestaltung
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
                    {...getTextFieldProps()}
                  />
                )}
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Zusätzliche Hinweise"
                  multiline
                  rows={3}
                  value={quoteDetails.notes}
                  onChange={(e) => setQuoteDetails({...quoteDetails, notes: e.target.value})}
                  {...getTextFieldProps()}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Services Accordion */}
        <Accordion 
          expanded={expandedSection === 'services'} 
          onChange={handleAccordionChange('services')}
          sx={{ mb: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BuildIcon color="primary" />
              <Typography variant="subtitle1" fontWeight="medium">Zusatzleistungen</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedServices.packing}
                      onChange={(e) => setSelectedServices({...selectedServices, packing: e.target.checked})}
                      color="primary"
                    />
                  }
                  label="Verpackungsservice"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedServices.boxes}
                      onChange={(e) => setSelectedServices({...selectedServices, boxes: e.target.checked})}
                      color="primary"
                    />
                  }
                  label="Umzugskartons"
                />
                {selectedServices.boxes && (
                  <TextField
                    fullWidth
                    label="Anzahl Kartons"
                    type="number"
                    size="small"
                    value={quoteDetails.boxCount}
                    onChange={(e) => setQuoteDetails({...quoteDetails, boxCount: Number(e.target.value)})}
                    sx={{ mt: 1, ml: 4 }}
                    {...getTextFieldProps()}
                  />
                )}
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedServices.cleaning}
                      onChange={(e) => setSelectedServices({...selectedServices, cleaning: e.target.checked})}
                      color="primary"
                    />
                  }
                  label="Reinigungsservice"
                />
                {selectedServices.cleaning && (
                  <TextField
                    fullWidth
                    label="Stunden"
                    type="number"
                    size="small"
                    value={quoteDetails.cleaningHours}
                    onChange={(e) => setQuoteDetails({...quoteDetails, cleaningHours: Number(e.target.value)})}
                    sx={{ mt: 1, ml: 4 }}
                    {...getTextFieldProps()}
                  />
                )}
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedServices.clearance}
                      onChange={(e) => setSelectedServices({...selectedServices, clearance: e.target.checked})}
                      color="primary"
                    />
                  }
                  label="Entrümpelung"
                />
                {selectedServices.clearance && (
                  <TextField
                    fullWidth
                    label="Volumen m³"
                    type="number"
                    size="small"
                    value={quoteDetails.clearanceVolume}
                    onChange={(e) => setQuoteDetails({...quoteDetails, clearanceVolume: Number(e.target.value)})}
                    sx={{ mt: 1, ml: 4 }}
                    {...getTextFieldProps()}
                  />
                )}
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedServices.renovation}
                      onChange={(e) => setSelectedServices({...selectedServices, renovation: e.target.checked})}
                      color="primary"
                    />
                  }
                  label="Renovierungsarbeiten"
                />
                {selectedServices.renovation && (
                  <TextField
                    fullWidth
                    label="Stunden"
                    type="number"
                    size="small"
                    value={quoteDetails.renovationHours}
                    onChange={(e) => setQuoteDetails({...quoteDetails, renovationHours: Number(e.target.value)})}
                    sx={{ mt: 1, ml: 4 }}
                    {...getTextFieldProps()}
                  />
                )}
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedServices.piano}
                      onChange={(e) => setSelectedServices({...selectedServices, piano: e.target.checked})}
                      color="primary"
                    />
                  }
                  label="Klaviertransport"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedServices.heavyItems}
                      onChange={(e) => setSelectedServices({...selectedServices, heavyItems: e.target.checked})}
                      color="primary"
                    />
                  }
                  label="Schwertransport"
                />
                {selectedServices.heavyItems && (
                  <TextField
                    fullWidth
                    label="Anzahl Gegenstände"
                    type="number"
                    size="small"
                    value={quoteDetails.heavyItemsCount}
                    onChange={(e) => setQuoteDetails({...quoteDetails, heavyItemsCount: Number(e.target.value)})}
                    sx={{ mt: 1, ml: 4 }}
                    {...getTextFieldProps()}
                  />
                )}
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedServices.packingMaterials}
                      onChange={(e) => setSelectedServices({...selectedServices, packingMaterials: e.target.checked})}
                      color="primary"
                    />
                  }
                  label="Verpackungsmaterial"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedServices.parking}
                      onChange={(e) => setSelectedServices({...selectedServices, parking: e.target.checked})}
                      color="primary"
                    />
                  }
                  label="Halteverbotszone"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedServices.storage}
                      onChange={(e) => setSelectedServices({...selectedServices, storage: e.target.checked})}
                      color="primary"
                    />
                  }
                  label="Zwischenlagerung"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedServices.assembly}
                      onChange={(e) => setSelectedServices({...selectedServices, assembly: e.target.checked})}
                      color="primary"
                    />
                  }
                  label="Möbelmontage"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedServices.disassembly}
                      onChange={(e) => setSelectedServices({...selectedServices, disassembly: e.target.checked})}
                      color="primary"
                    />
                  }
                  label="Möbeldemontage"
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* Fixed Price Summary at Bottom */}
      <Paper 
        elevation={3} 
        sx={{ 
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          borderRadius: '16px 16px 0 0',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
          backgroundColor: 'background.paper',
          zIndex: 1000,
        }}
      >
        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AttachMoneyIcon fontSize="small" />
          Preisübersicht
        </Typography>
        
        {calculation && (
          <Box sx={{ mb: 2 }}>
            {useManualPrice && manualTotalPrice > 0 ? (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" color="primary">
                  €{calculation.finalPrice.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  inkl. 19% MwSt.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={1}>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Basis:</Typography>
                  <Typography variant="body2" fontWeight="medium">€{calculation.basePrice.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Zusatz:</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    €{(calculation.totalPrice - calculation.basePrice).toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Gesamt:</Typography>
                  <Typography variant="body1" color="primary" fontWeight="bold">
                    €{calculation.finalPrice.toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
            )}
          </Box>
        )}
        
        {error && (
          <Typography color="error" variant="caption" sx={{ display: 'block', mb: 1 }}>
            {error}
          </Typography>
        )}
        
        {success && (
          <Typography color="success.main" variant="caption" sx={{ display: 'block', mb: 1 }}>
            ✅ Angebot erfolgreich versendet!
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            disabled={loading || !calculation || !customer.email}
            startIcon={<SendIcon />}
            onClick={handleSubmit}
            {...getButtonProps()}
          >
            {loading ? 'Sende...' : 'Senden'}
          </Button>
          
          <Button
            variant="outlined"
            onClick={downloadPDF}
            disabled={loading || !calculation}
            sx={{ minWidth: 'auto', px: 2 }}
            {...getButtonProps()}
          >
            <GetAppIcon />
          </Button>
        </Box>
      </Paper>
    </Container>
  );

  const renderDesktopLayout = () => (
    <Container maxWidth="xl" sx={{ mt: { xs: 1, sm: 2 }, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate(`/customer-details/${customer.id}`)} sx={{ mb: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        
        <Typography variant="h4" gutterBottom>
          Angebot erstellen
        </Typography>
      </Box>

      {/* Kundendaten Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Kundendaten
            </Typography>
            <IconButton onClick={() => setEditMode(!editMode)} size="small">
              <EditIcon />
            </IconButton>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                value={customer.name}
                onChange={(e) => setCustomer({...customer, name: e.target.value})}
                disabled={!editMode}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="E-Mail"
                type="email"
                value={customer.email}
                onChange={(e) => setCustomer({...customer, email: e.target.value})}
                disabled={!editMode}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefon"
                value={customer.phone}
                onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                disabled={!editMode}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Umzugsdatum"
                value={customer.movingDate || ''}
                onChange={(e) => setCustomer({...customer, movingDate: e.target.value})}
                disabled={!editMode}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Von Adresse"
                value={customer.fromAddress}
                onChange={(e) => setCustomer({...customer, fromAddress: e.target.value})}
                disabled={!editMode}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nach Adresse"
                value={customer.toAddress}
                onChange={(e) => setCustomer({...customer, toAddress: e.target.value})}
                disabled={!editMode}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Kalkulationsdetails */}
          <Grid item xs={12} xl={4}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Kalkulationsdetails
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Volumen m³"
                    type="number"
                    value={quoteDetails.volume || ''}
                    onChange={(e) => setQuoteDetails({...quoteDetails, volume: Number(e.target.value)})}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Entfernung km"
                    type="number"
                    value={quoteDetails.distance || ''}
                    onChange={(e) => setQuoteDetails({...quoteDetails, distance: Number(e.target.value)})}
                  />
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
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
                  sx={{ mb: 2 }}
                />
              )}
              
              <TextField
                fullWidth
                label="Zusätzliche Hinweise"
                multiline
                rows={3}
                value={quoteDetails.notes}
                onChange={(e) => setQuoteDetails({...quoteDetails, notes: e.target.value})}
              />
            </Paper>
          </Grid>

          {/* Services */}
          <Grid item xs={12} xl={8}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Zusatzleistungen - Wählen Sie die gewünschten Services
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={selectedServices.packing}
                        onChange={(e) => setSelectedServices({...selectedServices, packing: e.target.checked})}
                        color="primary"
                      />
                    }
                    label="Verpackungsservice"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={selectedServices.boxes}
                        onChange={(e) => setSelectedServices({...selectedServices, boxes: e.target.checked})}
                        color="primary"
                      />
                    }
                    label="Umzugskartons"
                  />
                  {selectedServices.boxes && (
                    <TextField
                      fullWidth
                      label="Anzahl Kartons"
                      type="number"
                      size="small"
                      value={quoteDetails.boxCount}
                      onChange={(e) => setQuoteDetails({...quoteDetails, boxCount: Number(e.target.value)})}
                      sx={{ mt: 1 }}
                    />
                  )}
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={selectedServices.cleaning}
                        onChange={(e) => setSelectedServices({...selectedServices, cleaning: e.target.checked})}
                        color="primary"
                      />
                    }
                    label="Reinigungsservice"
                  />
                  {selectedServices.cleaning && (
                    <TextField
                      fullWidth
                      label="Stunden"
                      type="number"
                      size="small"
                      value={quoteDetails.cleaningHours}
                      onChange={(e) => setQuoteDetails({...quoteDetails, cleaningHours: Number(e.target.value)})}
                      sx={{ mt: 1 }}
                    />
                  )}
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={selectedServices.clearance}
                        onChange={(e) => setSelectedServices({...selectedServices, clearance: e.target.checked})}
                        color="primary"
                      />
                    }
                    label="Entrümpelung"
                  />
                  {selectedServices.clearance && (
                    <TextField
                      fullWidth
                      label="Volumen m³"
                      type="number"
                      size="small"
                      value={quoteDetails.clearanceVolume}
                      onChange={(e) => setQuoteDetails({...quoteDetails, clearanceVolume: Number(e.target.value)})}
                      sx={{ mt: 1 }}
                    />
                  )}
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={selectedServices.renovation}
                        onChange={(e) => setSelectedServices({...selectedServices, renovation: e.target.checked})}
                        color="primary"
                      />
                    }
                    label="Renovierungsarbeiten"
                  />
                  {selectedServices.renovation && (
                    <TextField
                      fullWidth
                      label="Stunden"
                      type="number"
                      size="small"
                      value={quoteDetails.renovationHours}
                      onChange={(e) => setQuoteDetails({...quoteDetails, renovationHours: Number(e.target.value)})}
                      sx={{ mt: 1 }}
                    />
                  )}
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={selectedServices.piano}
                        onChange={(e) => setSelectedServices({...selectedServices, piano: e.target.checked})}
                        color="primary"
                      />
                    }
                    label="Klaviertransport"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={selectedServices.heavyItems}
                        onChange={(e) => setSelectedServices({...selectedServices, heavyItems: e.target.checked})}
                        color="primary"
                      />
                    }
                    label="Schwertransport"
                  />
                  {selectedServices.heavyItems && (
                    <TextField
                      fullWidth
                      label="Anzahl Gegenstände"
                      type="number"
                      size="small"
                      value={quoteDetails.heavyItemsCount}
                      onChange={(e) => setQuoteDetails({...quoteDetails, heavyItemsCount: Number(e.target.value)})}
                      sx={{ mt: 1 }}
                    />
                  )}
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={selectedServices.packingMaterials}
                        onChange={(e) => setSelectedServices({...selectedServices, packingMaterials: e.target.checked})}
                        color="primary"
                      />
                    }
                    label="Verpackungsmaterial"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={selectedServices.parking}
                        onChange={(e) => setSelectedServices({...selectedServices, parking: e.target.checked})}
                        color="primary"
                      />
                    }
                    label="Halteverbotszone"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={selectedServices.storage}
                        onChange={(e) => setSelectedServices({...selectedServices, storage: e.target.checked})}
                        color="primary"
                      />
                    }
                    label="Zwischenlagerung"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={selectedServices.assembly}
                        onChange={(e) => setSelectedServices({...selectedServices, assembly: e.target.checked})}
                        color="primary"
                      />
                    }
                    label="Möbelmontage"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={selectedServices.disassembly}
                        onChange={(e) => setSelectedServices({...selectedServices, disassembly: e.target.checked})}
                        color="primary"
                      />
                    }
                    label="Möbeldemontage"
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Preisübersicht */}
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                <CalculateIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Preisübersicht
              </Typography>
              
              {calculation && (
                <Box>
                  {useManualPrice && manualTotalPrice > 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="body1" gutterBottom>
                        Alle ausgewählten Leistungen sind im Gesamtpreis enthalten
                      </Typography>
                      <Typography variant="h4" color="primary">
                        €{calculation.finalPrice.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        inkl. 19% MwSt.
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      <Grid container spacing={2}>
                        <Grid item xs={6} sm={4}>
                          <Typography variant="body2" color="text.secondary">Basis:</Typography>
                          <Typography variant="h6">€{calculation.basePrice.toFixed(2)}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={4}>
                          <Typography variant="body2" color="text.secondary">Zusatzleistungen:</Typography>
                          <Typography variant="h6">
                            €{(calculation.totalPrice - calculation.basePrice).toFixed(2)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="body2" color="text.secondary">Gesamtpreis:</Typography>
                          <Typography variant="h5" color="primary">
                            €{calculation.finalPrice.toFixed(2)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </>
                  )}
                </Box>
              )}
              
              {error && (
                <Typography color="error" sx={{ mt: 2 }}>
                  {error}
                </Typography>
              )}
              
              {success && (
                <Typography color="success.main" sx={{ mt: 2 }}>
                  ✅ Angebot erfolgreich versendet!
                </Typography>
              )}
              
              <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading || !calculation || !customer.email}
                  startIcon={<SendIcon />}
                >
                  {loading ? 'Sende...' : 'Angebot per E-Mail senden'}
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={downloadPDF}
                  disabled={loading || !calculation}
                  startIcon={<GetAppIcon />}
                >
                  PDF Download
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </form>
    </Container>
  );

  return isMobile ? renderMobileLayout() : renderDesktopLayout();
};

export default CreateQuote;