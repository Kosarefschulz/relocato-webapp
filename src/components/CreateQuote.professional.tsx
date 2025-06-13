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
  Grid
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Calculate as CalculateIcon,
  Edit as EditIcon,
  Send as SendIcon,
  GetApp as GetAppIcon
} from '@mui/icons-material';
import { Customer } from '../types';
import { sendQuoteEmailWithPDFShift } from '../services/emailServiceWithPDFShift';
import { googleSheetsPublicService as googleSheetsService } from '../services/googleSheetsPublic';
import { quoteCalculationService, QuoteDetails, QuoteCalculation } from '../services/quoteCalculation';
import { generateEmailHTML } from '../services/htmlEmailTemplate';
import { generatePDF } from '../services/pdfService';

const CreateQuote: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialCustomer = location.state?.customer as Customer;
  
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
      
      await googleSheetsService.saveQuote(quote);
      console.log('💰 Angebot erfolgreich erstellt und lokal gespeichert:', quote);
      
      // Google Sheets Integration Info
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Für Google Sheets Integration:');
        console.log('🔗 Fügen Sie das Angebot manuell hinzu: https://docs.google.com/spreadsheets/d/178tpFCNqmnDZxkzOfgWQCS6BW7wn2rYyTB3hZh8H7PU');
      }
      
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
      
      // E-Mail senden
      const sent = await sendQuoteEmailWithPDFShift(customer, calculation, quoteDetails);
      
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
      
      // Verwende lokale jsPDF-Implementierung statt Server
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

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 1, sm: 2 }, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate(`/customer-details/${customer.id}`)} sx={{ mb: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        
        <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Angebot erstellen
        </Typography>
      </Box>

      {/* Kundendaten Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
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
            <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
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
            <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
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
            <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
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
                      <Typography variant="h4" color="primary" sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
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
                  sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
                >
                  {loading ? 'Sende...' : 'Angebot per E-Mail senden'}
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={downloadPDF}
                  disabled={loading || !calculation}
                  startIcon={<GetAppIcon />}
                  sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
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
};

export default CreateQuote;