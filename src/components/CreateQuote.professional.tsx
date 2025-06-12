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
  Alert,
  CircularProgress
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
  
  // Manuelle Preise für alle Services
  const [servicePrices, setServicePrices] = useState({
    packingPrice: 0,
    boxPrice: 0,
    cleaningPrice: 0,
    clearancePrice: 0,
    renovationPrice: 0,
    pianoPrice: 0,
    heavyItemsPrice: 0,
    packingMaterialsPrice: 0
  });
  
  // UI State
  const [calculation, setCalculation] = useState<QuoteCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Automatische Kalkulation
  useEffect(() => {
    if (customer.id) {
      calculateTotal();
    }
  }, [customer, quoteDetails, servicePrices]);

  const calculateTotal = () => {
    const basePrice = quoteDetails.manualBasePrice || 0;
    
    // Etagen-Zuschlag
    const fromFloor = customer.apartment?.floor || 0;
    const hasElevator = customer.apartment?.hasElevator || false;
    const floorSurcharge = !hasElevator && fromFloor > 0 ? fromFloor * 50 : 0;
    
    // Entfernungs-Zuschlag
    let distanceSurcharge = 0;
    if (quoteDetails.distance > 50) {
      if (quoteDetails.distance <= 100) distanceSurcharge = 150;
      else if (quoteDetails.distance <= 200) distanceSurcharge = 300;
      else if (quoteDetails.distance <= 300) distanceSurcharge = 450;
      else distanceSurcharge = 600;
    }
    
    // Alle Service-Preise
    const totalServicePrice = 
      servicePrices.packingPrice +
      servicePrices.boxPrice +
      servicePrices.cleaningPrice +
      servicePrices.clearancePrice +
      servicePrices.renovationPrice +
      servicePrices.pianoPrice +
      servicePrices.heavyItemsPrice +
      servicePrices.packingMaterialsPrice +
      quoteDetails.parkingZonePrice +
      quoteDetails.storagePrice +
      quoteDetails.furnitureAssemblyPrice +
      quoteDetails.furnitureDisassemblyPrice;
    
    const totalPrice = basePrice + floorSurcharge + distanceSurcharge + totalServicePrice;
    
    const calc: QuoteCalculation = {
      volumeBase: quoteDetails.volume,
      volumeRange: `${quoteDetails.volume} m³`,
      basePrice: basePrice,
      floorSurcharge,
      distanceSurcharge,
      packingService: servicePrices.packingPrice,
      boxesPrice: servicePrices.boxPrice,
      parkingZonePrice: quoteDetails.parkingZonePrice,
      storagePrice: quoteDetails.storagePrice,
      furnitureAssemblyPrice: quoteDetails.furnitureAssemblyPrice,
      furnitureDisassemblyPrice: quoteDetails.furnitureDisassemblyPrice,
      totalPrice,
      finalPrice: totalPrice,
      priceBreakdown: {
        base: basePrice,
        floors: floorSurcharge,
        distance: distanceSurcharge,
        packing: servicePrices.packingPrice,
        boxes: servicePrices.boxPrice,
        parkingZone: quoteDetails.parkingZonePrice,
        storage: quoteDetails.storagePrice,
        furnitureAssembly: quoteDetails.furnitureAssemblyPrice,
        furnitureDisassembly: quoteDetails.furnitureDisassemblyPrice,
        cleaning: servicePrices.cleaningPrice,
        clearance: servicePrices.clearancePrice,
        renovation: servicePrices.renovationPrice,
        piano: servicePrices.pianoPrice,
        heavyItems: servicePrices.heavyItemsPrice,
        packingMaterials: servicePrices.packingMaterialsPrice
      }
    };
    
    setCalculation(calc);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!calculation || calculation.finalPrice <= 0) {
      setError('Bitte geben Sie einen gültigen Gesamtpreis ein');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const quoteData = {
        customerId: customer.id,
        customerName: customer.name,
        price: calculation.finalPrice,
        comment: quoteDetails.notes,
        createdAt: new Date(),
        createdBy: 'current-user-id',
        status: 'sent' as const
      };

      await sendQuoteEmailWithPDFShift(customer, calculation, quoteDetails);
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

  const downloadPDF = async () => {
    try {
      if (!calculation) return;
      
      setLoading(true);
      
      const htmlContent = generateEmailHTML(customer, calculation, quoteDetails);
      
      const API_URL = process.env.REACT_APP_API_URL || 'https://api.ruempel-schmiede.com';
      
      const response = await fetch(`${API_URL}/api/generate-pdf`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        body: JSON.stringify({
          html: htmlContent
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
          window.open(url, '_blank');
        } else {
          const a = document.createElement('a');
          a.href = url;
          a.download = `Angebot-${customer.name}-${new Date().toISOString().split('T')[0]}.pdf`;
          a.click();
        }
        
        URL.revokeObjectURL(url);
      } else {
        throw new Error('PDF-Generierung fehlgeschlagen');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('PDF Download Error:', err);
      setError('Fehler beim Erstellen der PDF');
      setLoading(false);
    }
  };

  if (!initialCustomer) {
    navigate('/search-customer');
    return null;
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate('/search-customer')} sx={{ mb: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" gutterBottom>
          Angebot erstellen
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Professionelle Kalkulation mit manueller Preiseingabe
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Kundendaten */}
        <Grid item xs={12} lg={6} xl={4}>
          <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, height: 'fit-content' }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              <EditIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Kundendaten
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
              sx={{ mb: 2 }}
            />
            
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
                  value={customer.apartment?.rooms || ''}
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
                  value={customer.apartment?.area || ''}
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
                  value={customer.apartment?.floor || ''}
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
          </Paper>
        </Grid>

        {/* Umzugsdetails */}
        <Grid item xs={12} lg={6} xl={4}>
          <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, height: 'fit-content' }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              Umzugsdetails
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
            
            <TextField
              fullWidth
              label="Basis-Preis Be- und Entladen"
              type="number"
              value={quoteDetails.manualBasePrice || ''}
              onChange={(e) => setQuoteDetails({...quoteDetails, manualBasePrice: Number(e.target.value)})}
              InputProps={{
                startAdornment: <InputAdornment position="start">€</InputAdornment>
              }}
              sx={{ mb: 2 }}
            />
            
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
              Zusatzleistungen
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4} lg={6} xl={4}>
                <TextField
                  fullWidth
                  label="Verpackungsservice"
                  type="number"
                  value={servicePrices.packingPrice || ''}
                  onChange={(e) => setServicePrices({...servicePrices, packingPrice: Number(e.target.value)})}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>
                  }}
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={4} lg={6} xl={4}>
                <TextField
                  fullWidth
                  label="Umzugskartons"
                  type="number"
                  value={servicePrices.boxPrice || ''}
                  onChange={(e) => setServicePrices({...servicePrices, boxPrice: Number(e.target.value)})}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>
                  }}
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={4} lg={6} xl={4}>
                <TextField
                  fullWidth
                  label="Reinigungsservice"
                  type="number"
                  value={servicePrices.cleaningPrice || ''}
                  onChange={(e) => setServicePrices({...servicePrices, cleaningPrice: Number(e.target.value)})}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>
                  }}
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={4} lg={6} xl={4}>
                <TextField
                  fullWidth
                  label="Entrümpelung"
                  type="number"
                  value={servicePrices.clearancePrice || ''}
                  onChange={(e) => setServicePrices({...servicePrices, clearancePrice: Number(e.target.value)})}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>
                  }}
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={4} lg={6} xl={4}>
                <TextField
                  fullWidth
                  label="Renovierungsarbeiten"
                  type="number"
                  value={servicePrices.renovationPrice || ''}
                  onChange={(e) => setServicePrices({...servicePrices, renovationPrice: Number(e.target.value)})}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>
                  }}
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={4} lg={6} xl={4}>
                <TextField
                  fullWidth
                  label="Klaviertransport"
                  type="number"
                  value={servicePrices.pianoPrice || ''}
                  onChange={(e) => setServicePrices({...servicePrices, pianoPrice: Number(e.target.value)})}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>
                  }}
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={4} lg={6} xl={4}>
                <TextField
                  fullWidth
                  label="Schwertransport"
                  type="number"
                  value={servicePrices.heavyItemsPrice || ''}
                  onChange={(e) => setServicePrices({...servicePrices, heavyItemsPrice: Number(e.target.value)})}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>
                  }}
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={4} lg={6} xl={4}>
                <TextField
                  fullWidth
                  label="Verpackungsmaterial"
                  type="number"
                  value={servicePrices.packingMaterialsPrice || ''}
                  onChange={(e) => setServicePrices({...servicePrices, packingMaterialsPrice: Number(e.target.value)})}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>
                  }}
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={4} lg={6} xl={4}>
                <TextField
                  fullWidth
                  label="Halteverbotszone"
                  type="number"
                  value={quoteDetails.parkingZonePrice || ''}
                  onChange={(e) => setQuoteDetails({...quoteDetails, parkingZonePrice: Number(e.target.value)})}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>
                  }}
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={4} lg={6} xl={4}>
                <TextField
                  fullWidth
                  label="Zwischenlagerung"
                  type="number"
                  value={quoteDetails.storagePrice || ''}
                  onChange={(e) => setQuoteDetails({...quoteDetails, storagePrice: Number(e.target.value)})}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>
                  }}
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={4} lg={6} xl={4}>
                <TextField
                  fullWidth
                  label="Möbelmontage"
                  type="number"
                  value={quoteDetails.furnitureAssemblyPrice || ''}
                  onChange={(e) => setQuoteDetails({...quoteDetails, furnitureAssemblyPrice: Number(e.target.value)})}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>
                  }}
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={4} lg={6} xl={4}>
                <TextField
                  fullWidth
                  label="Möbeldemontage"
                  type="number"
                  value={quoteDetails.furnitureDisassemblyPrice || ''}
                  onChange={(e) => setQuoteDetails({...quoteDetails, furnitureDisassemblyPrice: Number(e.target.value)})}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>
                  }}
                  sx={{ mb: 2 }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Kalkulation */}
        <Grid item xs={12} xl={4}>
          <Paper elevation={2} sx={{ 
            p: { xs: 2, sm: 3 }, 
            position: { lg: 'sticky' }, 
            top: { lg: 20 },
            height: 'fit-content'
          }}>
            <Typography variant="h6" gutterBottom>
              <CalculateIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Kalkulation
            </Typography>
            
            {calculation && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Basis-Preis:</Typography>
                  <Typography variant="body2">€{calculation.priceBreakdown.base.toFixed(2)}</Typography>
                </Box>
                
                {calculation.priceBreakdown.floors > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Etagen-Zuschlag:</Typography>
                    <Typography variant="body2">€{calculation.priceBreakdown.floors.toFixed(2)}</Typography>
                  </Box>
                )}
                
                {calculation.priceBreakdown.distance > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Entfernungs-Zuschlag:</Typography>
                    <Typography variant="body2">€{calculation.priceBreakdown.distance.toFixed(2)}</Typography>
                  </Box>
                )}
                
                {Object.entries(calculation.priceBreakdown).map(([key, value]) => {
                  if (key === 'base' || key === 'floors' || key === 'distance' || value <= 0) return null;
                  
                  const labels: Record<string, string> = {
                    packing: 'Verpackungsservice',
                    boxes: 'Umzugskartons',
                    cleaning: 'Reinigungsservice',
                    clearance: 'Entrümpelung',
                    renovation: 'Renovierung',
                    piano: 'Klaviertransport',
                    heavyItems: 'Schwertransport',
                    packingMaterials: 'Verpackungsmaterial',
                    parkingZone: 'Halteverbotszone',
                    storage: 'Zwischenlagerung',
                    furnitureAssembly: 'Möbelmontage',
                    furnitureDisassembly: 'Möbeldemontage'
                  };
                  
                  return (
                    <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{labels[key] || key}:</Typography>
                      <Typography variant="body2">€{value.toFixed(2)}</Typography>
                    </Box>
                  );
                })}
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Gesamtpreis:</Typography>
                  <Typography variant="h6" color="primary">
                    €{calculation.finalPrice.toFixed(2)}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  inkl. 19% MwSt.
                </Typography>
                
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Angebot wurde erfolgreich versendet!
                  </Alert>
                )}
                
                <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={downloadPDF}
                    disabled={loading || !calculation?.finalPrice}
                    startIcon={loading ? <CircularProgress size={20} /> : <GetAppIcon />}
                  >
                    PDF herunterladen
                  </Button>
                  
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading || success || !calculation?.finalPrice}
                    startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                  >
                    Per E-Mail senden
                  </Button>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CreateQuote;