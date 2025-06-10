import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  IconButton,
  Card,
  CardContent,
  InputAdornment,
  FormControlLabel,
  Switch,
  Divider,
  Tab,
  Tabs
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Calculate as CalculateIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { Customer } from '../types';
import { generatePDF } from '../services/pdfService';
import { sendEmailViaSMTP } from '../services/smtpEmailService';
import { sendQuoteEmailWithPDFShift } from '../services/emailServiceWithPDFShift';
import { googleSheetsPublicService as googleSheetsService } from '../services/googleSheetsPublic';
import { quoteCalculationService, QuoteDetails, QuoteCalculation } from '../services/quoteCalculation';
import { generateEmailHTML } from '../services/htmlEmailTemplate';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const CreateQuote: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialCustomer = location.state?.customer as Customer;
  
  // Bearbeitbare Kundendaten
  const [customer, setCustomer] = useState<Customer>(initialCustomer || {} as Customer);
  
  // Quote Details
  const [quoteDetails, setQuoteDetails] = useState<QuoteDetails>({
    volume: quoteCalculationService.getStandardVolume(), // Standard 20 m³
    distance: 25,
    packingRequested: false,
    additionalServices: [],
    notes: ''
  });
  
  // UI State
  const [activeTab, setActiveTab] = useState(0);
  const [manualPriceMode, setManualPriceMode] = useState(false);
  const [manualPrice, setManualPrice] = useState('');
  const [calculation, setCalculation] = useState<QuoteCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Automatische Kalkulation bei Änderungen
  React.useEffect(() => {
    if (!manualPriceMode && customer.id) {
      const calc = quoteCalculationService.calculateQuote(customer, quoteDetails);
      setCalculation(calc);
    }
  }, [customer, quoteDetails, manualPriceMode]);

  if (!initialCustomer) {
    navigate('/search-customer');
    return null;
  }

  const generatePDFFromHTML = async (htmlContent: string): Promise<Blob> => {
    // Create temporary div to render HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '750px'; // Schmaler für bessere Darstellung
    tempDiv.style.backgroundColor = 'white';
    document.body.appendChild(tempDiv);

    try {
      const canvas = await html2canvas(tempDiv, {
        scale: 2, // Höhere Qualität für bessere Lesbarkeit
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 750,
        height: tempDiv.scrollHeight
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png', 1.0); // PNG mit maximaler Qualität
      const imgWidth = 190; // Kleinere Breite für Ränder
      const pageHeight = 270; // A4 Höhe minus Ränder (optimiert)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10; // Oberer Rand
      let pageNumber = 1;

      // Erste Seite
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Weitere Seiten mit besserem Rand-Management
      while (heightLeft >= 0) {
        pageNumber++;
        position = heightLeft - imgHeight + 15; // Besserer oberer Rand für Folgeseiten
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      return pdf.output('blob');
    } finally {
      document.body.removeChild(tempDiv);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalPrice = manualPriceMode ? Number(manualPrice) : calculation?.totalPrice;
    
    if (!finalPrice || finalPrice <= 0 || !calculation) {
      setError('Bitte geben Sie einen gültigen Preis ein oder lassen Sie ihn berechnen');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const quoteData = {
        customerId: customer.id,
        customerName: customer.name,
        price: finalPrice,
        comment: quoteDetails.notes,
        createdAt: new Date(),
        createdBy: 'current-user-id',
        status: 'sent' as const
      };

      // Generate HTML content for both email and PDF
      const htmlContent = generateEmailHTML(customer, calculation, quoteDetails);
      
      // Send email with PDFShift service (handles PDF generation and email)
      await sendQuoteEmailWithPDFShift(customer, calculation, quoteDetails);

      // Angebot in Google Sheets speichern
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate('/search-customer')} sx={{ mb: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" gutterBottom>
          Angebot erstellen
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Kundendaten bearbeiten • Preis kalkulieren • Angebot versenden
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Kundendaten" icon={<EditIcon />} />
          <Tab label="Kalkulation" icon={<CalculateIcon />} />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 48%' } }}>
            <Card elevation={3}>
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
          </Box>

          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 48%' } }}>
            <Card elevation={3}>
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
                
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: '1 1 30%' }}>
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
                  </Box>
                  <Box sx={{ flex: '1 1 30%' }}>
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
                  </Box>
                  <Box sx={{ flex: '1 1 30%' }}>
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
                  </Box>
                </Box>
                
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
                  sx={{ mt: 2 }}
                />
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      {activeTab === 1 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 65%' } }}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Umzugsdetails
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: '1 1 48%' }}>
                    <TextField
                      fullWidth
                      label="Geschätztes Volumen (m³)"
                      type="number"
                      value={quoteDetails.volume}
                      onChange={(e) => setQuoteDetails({...quoteDetails, volume: Number(e.target.value)})}
                      helperText={`Standard: 20 m³ (85% aller Umzüge) • Bei ${customer.apartment?.area || 50} m²: ca. ${quoteCalculationService.estimateVolumeFromArea(customer.apartment?.area || 50)} m³`}
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 48%' }}>
                    <TextField
                      fullWidth
                      label="Entfernung (km)"
                      type="number"
                      value={quoteDetails.distance}
                      onChange={(e) => setQuoteDetails({...quoteDetails, distance: Number(e.target.value)})}
                    />
                  </Box>
                </Box>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={quoteDetails.packingRequested}
                      onChange={(e) => setQuoteDetails({...quoteDetails, packingRequested: e.target.checked})}
                    />
                  }
                  label="Verpackungsservice gewünscht"
                  sx={{ mb: 3 }}
                />
                
                <TextField
                  fullWidth
                  label="Zusätzliche Hinweise"
                  multiline
                  rows={4}
                  value={quoteDetails.notes}
                  onChange={(e) => setQuoteDetails({...quoteDetails, notes: e.target.value})}
                  placeholder="z.B. schwere Möbel, besondere Anforderungen..."
                />
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 32%' } }}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Preiskalkulation
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={manualPriceMode}
                      onChange={(e) => setManualPriceMode(e.target.checked)}
                    />
                  }
                  label="Manueller Preis"
                  sx={{ mb: 2 }}
                />
                
                {manualPriceMode ? (
                  <TextField
                    fullWidth
                    label="Preis eingeben"
                    type="number"
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">€</InputAdornment>,
                    }}
                    sx={{ mb: 2 }}
                  />
                ) : calculation && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Preisaufstellung:
                    </Typography>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        Basis ({calculation.volumeRange}): €{calculation.priceBreakdown.base.toFixed(2)}
                      </Typography>
                    </Box>
                    
                    {calculation.priceBreakdown.floors > 0 && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          Etagen-Zuschlag: €{calculation.priceBreakdown.floors.toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                    
                    {calculation.priceBreakdown.distance > 0 && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          Entfernungs-Zuschlag: €{calculation.priceBreakdown.distance.toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                    
                    {calculation.priceBreakdown.packing > 0 && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          Verpackungsservice: €{calculation.priceBreakdown.packing.toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="h6" color="primary">
                      Gesamt: €{calculation.totalPrice.toFixed(2)}
                    </Typography>
                  </Box>
                )}
                
                {error && (
                  <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
                    Angebot wurde erfolgreich versendet!
                  </Alert>
                )}
                
                <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={async () => {
                      try {
                        const finalPrice = manualPriceMode ? Number(manualPrice) : calculation?.totalPrice;
                        if (!finalPrice || !calculation) return;
                        
                        // Generate HTML content and PDF
                        const htmlContent = generateEmailHTML(customer, calculation, quoteDetails);
                        const pdfBlob = await generatePDFFromHTML(htmlContent);
                        
                        // Download PDF
                        const url = URL.createObjectURL(pdfBlob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `Angebot-${customer.name}-${new Date().toISOString().split('T')[0]}.pdf`;
                        a.click();
                        URL.revokeObjectURL(url);
                      } catch (err) {
                        setError('Fehler beim Erstellen der PDF');
                      }
                    }}
                    disabled={loading || !calculation?.totalPrice}
                    size="large"
                    sx={{ height: 48 }}
                  >
                    PDF herunterladen
                  </Button>
                  
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading || success}
                    size="large"
                    sx={{ height: 48 }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Per E-Mail senden'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default CreateQuote;