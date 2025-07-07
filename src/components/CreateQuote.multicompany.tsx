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
  useTheme, 
  useMediaQuery,
  ToggleButton,
  ToggleButtonGroup,
  Alert
} from '@mui/material';
import Grid from './GridCompat';
import MobileLayout from './MobileLayout';
import { useMobileLayout } from '../hooks/useMobileLayout';
import { 
  ArrowBack as ArrowBackIcon,
  Calculate as CalculateIcon,
  Edit as EditIcon,
  Send as SendIcon,
  GetApp as GetAppIcon,
  Business as BusinessIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { Customer, Quote } from '../types';
import { CompanyType, COMPANY_CONFIGS } from '../types/company';
import { sendEmail } from '../services/emailService';
import { databaseService as googleSheetsService } from '../config/database.config';
import { quoteCalculationService, QuoteDetails, QuoteCalculation } from '../services/quoteCalculation';
import { generateEmailHTML } from '../services/htmlEmailTemplate';
import { generateQuoteEmailHTMLSync } from '../services/quoteEmailTemplate';
import { generatePDF } from '../services/pdfService';
import { generateWertvollPDF } from '../services/pdfServiceWertvoll';
import { generateRuempelschmiedePDF } from '../services/pdfServiceRuempelschmiede';
import { pdfServiceWithTemplates } from '../services/pdfServiceWithTemplates';
import { tokenService } from '../services/tokenService';

const CreateQuoteMultiCompany: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { isMobile, spacing, cardPadding, titleVariant } = useMobileLayout();
  const initialCustomer = location.state?.customer as Customer;
  
  // Company selection
  const [selectedCompany, setSelectedCompany] = useState<CompanyType>('relocato');
  
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
  const [useTemplates, setUseTemplates] = useState(false);
  
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
      setCalculation(calc);
    }
  }, [customer.id, quoteDetails, selectedServices]);
  
  const handleCompanyChange = (event: React.MouseEvent<HTMLElement>, newCompany: CompanyType | null) => {
    if (newCompany !== null) {
      setSelectedCompany(newCompany);
    }
  };
  
  const saveQuote = async () => {
    if (!customer.id) {
      setError('Bitte wählen Sie einen Kunden aus');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const finalPrice = useManualPrice ? manualTotalPrice : (calculation?.totalPrice || 0);
      
      const quote: Quote = {
        id: '', // Will be generated by the service
        customerId: customer.id,
        customerName: customer.name,
        price: finalPrice,
        comment: quoteDetails.notes,
        createdAt: new Date(),
        createdBy: 'user',
        status: 'draft' as const,
        company: selectedCompany as 'relocato' | 'wertvoll',
        volume: quoteDetails.volume || 0,
        distance: quoteDetails.distance || 0
      };
      
      const savedQuote = await googleSheetsService.addQuote(quote);
      if (savedQuote) {
        setSuccess(true);
        setTimeout(() => {
          navigate(`/customer-details/${customer.id}`);
        }, 1500);
      }
    } catch (err) {
      console.error('Save quote error:', err);
      setError('Fehler beim Speichern des Angebots');
    } finally {
      setLoading(false);
    }
  };
  
  const sendQuoteEmail = async () => {
    if (!customer.id || !customer.email) {
      setError('Kunde hat keine E-Mail-Adresse');
      return;
    }
    
    try {
      setLoading(true);
      const finalPrice = useManualPrice ? manualTotalPrice : (calculation?.totalPrice || 0);
      
      // Generate quote ID
      const quoteId = Date.now().toString();
      
      const quoteData = {
        id: quoteId,
        customerId: customer.id,
        customerName: customer.name,
        price: finalPrice,
        comment: quoteDetails.notes,
        createdAt: new Date(),
        createdBy: 'user',
        status: 'sent' as const,
        volume: quoteDetails.volume,
        distance: quoteDetails.distance,
        packingRequested: quoteDetails.packingRequested,
        boxCount: quoteDetails.boxCount,
        parkingZonePrice: quoteDetails.parkingZonePrice,
        storagePrice: quoteDetails.storagePrice,
        furnitureAssemblyPrice: quoteDetails.furnitureAssemblyPrice,
        furnitureDisassemblyPrice: quoteDetails.furnitureDisassemblyPrice,
        cleaningService: quoteDetails.cleaningService,
        cleaningHours: quoteDetails.cleaningHours,
        clearanceService: quoteDetails.clearanceService,
        clearanceVolume: quoteDetails.clearanceVolume,
        pianoTransport: quoteDetails.pianoTransport,
        heavyItemsCount: quoteDetails.heavyItemsCount,
        packingMaterials: quoteDetails.packingMaterials,
        company: selectedCompany
      };
      
      // Generate PDF based on selected company and template preference
      let pdfBlob;
      if (useTemplates) {
        try {
          pdfBlob = await pdfServiceWithTemplates.generateQuotePDF(customer, quoteData, true);
        } catch (err) {
          console.error('Template PDF generation failed, falling back to legacy:', err);
          // Fallback to legacy generation
          switch (selectedCompany) {
            case 'wertvoll':
              pdfBlob = await generateWertvollPDF(customer, quoteData);
              break;
            case 'ruempelschmiede':
              pdfBlob = await generateRuempelschmiedePDF(customer, quoteData);
              break;
            default:
              pdfBlob = await generatePDF(customer, quoteData);
          }
        }
      } else {
        switch (selectedCompany) {
          case 'wertvoll':
            pdfBlob = await generateWertvollPDF(customer, quoteData);
            break;
          case 'ruempelschmiede':
            pdfBlob = await generateRuempelschmiedePDF(customer, quoteData);
            break;
          default:
            pdfBlob = await generatePDF(customer, quoteData);
        }
      }
      
      const companyConfig = COMPANY_CONFIGS[selectedCompany];
      // Generate confirmation token
      const token = tokenService.generateQuoteToken({ id: quoteId } as any);
      
      // Generate email with QR code and confirmation link
      const emailContent = generateQuoteEmailHTMLSync({
        customer,
        calculation: useManualPrice && manualTotalPrice > 0 
          ? { ...calculation, finalPrice: manualTotalPrice, totalPrice: manualTotalPrice } as QuoteCalculation
          : calculation || {} as QuoteCalculation,
        quoteDetails,
        confirmationToken: token,
        companyName: companyConfig.name,
        companyEmail: companyConfig.contact.email,
        companyPhone: companyConfig.contact.phone
      });
      
      const emailData = {
        to: customer.email,
        subject: `Ihr Angebot von ${companyConfig.name}`,
        content: emailContent,
        attachments: [{
          filename: `Angebot_${customer.name.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('de-DE').replace(/\./g, '-')}.pdf`,
          content: pdfBlob
        }]
      };
      
      const sent = await sendEmail(emailData);
      if (sent) {
        await googleSheetsService.addQuote({
          id: quoteId,
          customerId: customer.id,
          customerName: customer.name,
          price: finalPrice,
          comment: quoteDetails.notes,
          createdAt: new Date(),
          createdBy: 'user',
          status: 'sent' as const,
          company: selectedCompany as 'relocato' | 'wertvoll',
          volume: quoteDetails.volume || 0,
          distance: quoteDetails.distance || 0,
          confirmationToken: token
        });
        setSuccess(true);
        setTimeout(() => {
          navigate(`/customer-details/${customer.id}`);
        }, 1500);
      } else {
        setError('Fehler beim E-Mail-Versand');
      }
    } catch (err) {
      console.error('Send email error:', err);
      setError('Fehler beim Versenden des Angebots');
    } finally {
      setLoading(false);
    }
  };
  
  const downloadPDF = async () => {
    try {
      setLoading(true);
      const finalPrice = useManualPrice ? manualTotalPrice : (calculation?.totalPrice || 0);
      
      const quoteData = {
        id: Date.now().toString(),
        customerId: customer.id,
        customerName: customer.name,
        price: finalPrice,
        comment: quoteDetails.notes,
        createdAt: new Date(),
        createdBy: 'user',
        status: 'draft' as const,
        volume: quoteDetails.volume,
        distance: quoteDetails.distance,
        packingRequested: quoteDetails.packingRequested,
        boxCount: quoteDetails.boxCount,
        parkingZonePrice: quoteDetails.parkingZonePrice,
        storagePrice: quoteDetails.storagePrice,
        furnitureAssemblyPrice: quoteDetails.furnitureAssemblyPrice,
        furnitureDisassemblyPrice: quoteDetails.furnitureDisassemblyPrice,
        cleaningService: quoteDetails.cleaningService,
        cleaningHours: quoteDetails.cleaningHours,
        clearanceService: quoteDetails.clearanceService,
        clearanceVolume: quoteDetails.clearanceVolume,
        pianoTransport: quoteDetails.pianoTransport,
        heavyItemsCount: quoteDetails.heavyItemsCount,
        packingMaterials: quoteDetails.packingMaterials,
        company: selectedCompany
      };
      
      // Generate PDF based on selected company and template preference
      let pdfBlob;
      if (useTemplates) {
        try {
          pdfBlob = await pdfServiceWithTemplates.generateQuotePDF(customer, quoteData, true);
        } catch (err) {
          console.error('Template PDF generation failed, falling back to legacy:', err);
          // Fallback to legacy generation
          switch (selectedCompany) {
            case 'wertvoll':
              pdfBlob = await generateWertvollPDF(customer, quoteData);
              break;
            case 'ruempelschmiede':
              pdfBlob = await generateRuempelschmiedePDF(customer, quoteData);
              break;
            default:
              pdfBlob = await generatePDF(customer, quoteData);
          }
        }
      } else {
        switch (selectedCompany) {
          case 'wertvoll':
            pdfBlob = await generateWertvollPDF(customer, quoteData);
            break;
          case 'ruempelschmiede':
            pdfBlob = await generateRuempelschmiedePDF(customer, quoteData);
            break;
          default:
            pdfBlob = await generatePDF(customer, quoteData);
        }
      }
      
      const url = URL.createObjectURL(pdfBlob);
      const fileName = `Angebot_${customer.name.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('de-DE').replace(/\./g, '-')}.pdf`;
      
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('PDF download error:', err);
      setError('Fehler beim PDF-Download');
    } finally {
      setLoading(false);
    }
  };
  
  const content = (
    <Box sx={{ p: spacing }}>
      {/* Header mit Firmenauswahl */}
      <Paper sx={{ p: cardPadding, mb: spacing }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate(-1)}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant={titleVariant}>
              Neues Angebot erstellen
            </Typography>
          </Box>
          
          {/* Company Selection */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Firma auswählen:
            </Typography>
            <ToggleButtonGroup
              value={selectedCompany}
              exclusive
              onChange={handleCompanyChange}
              aria-label="Firma auswählen"
              fullWidth={isMobile}
            >
              <ToggleButton value="relocato" aria-label="Relocato">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HomeIcon />
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="body2" fontWeight="bold">
                      Relocato
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Umzugsdienstleistungen
                    </Typography>
                  </Box>
                </Box>
              </ToggleButton>
              <ToggleButton value="wertvoll" aria-label="Wertvoll">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon />
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="body2" fontWeight="bold">
                      Wertvoll Dienstleistungen
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Entrümpelung & Renovierung
                    </Typography>
                  </Box>
                </Box>
              </ToggleButton>
              <ToggleButton value="ruempelschmiede" aria-label="Rümpel Schmiede">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon />
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="body2" fontWeight="bold">
                      Rümpel Schmiede
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Professionelle Entrümpelung
                    </Typography>
                  </Box>
                </Box>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          
          {selectedCompany === 'wertvoll' && (
            <Alert severity="info" sx={{ mt: 1 }}>
              Wertvoll Dienstleistungen spezialisiert sich auf Entrümpelungen, Rückbau und Renovierungsarbeiten.
            </Alert>
          )}
          
          {selectedCompany === 'ruempelschmiede' && (
            <Alert severity="info" sx={{ mt: 1 }}>
              Rümpel Schmiede ist Ihr Partner für professionelle Entrümpelungen mit Festpreisgarantie.
            </Alert>
          )}
          
          {/* Template Toggle */}
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={useTemplates}
                  onChange={(e) => setUseTemplates(e.target.checked)}
                />
              }
              label="PDF-Vorlagen verwenden (falls vorhanden)"
            />
          </Box>
        </Box>
      </Paper>
      
      {/* Kundendaten */}
      <Paper sx={{ p: cardPadding, mb: spacing }}>
        <Typography variant="h6" gutterBottom>
          Kundendaten
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Name"
              value={customer.name || ''}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              disabled={!editMode}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="E-Mail"
              value={customer.email || ''}
              onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
              disabled={!editMode}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Telefon"
              value={customer.phone || ''}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              disabled={!editMode}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Anrede"
              value={customer.salutation || ''}
              onChange={(e) => setCustomer({ ...customer, salutation: e.target.value })}
              disabled={!editMode}
            />
          </Grid>
        </Grid>
        {!editMode && (
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setEditMode(true)}
            >
              Bearbeiten
            </Button>
          </Box>
        )}
      </Paper>
      
      {/* Basis-Details */}
      <Paper sx={{ p: cardPadding, mb: spacing }}>
        <Typography variant="h6" gutterBottom>
          Basis-Details
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Volumen (m³)"
              type="number"
              value={quoteDetails.volume}
              onChange={(e) => setQuoteDetails({ ...quoteDetails, volume: Number(e.target.value) })}
              InputProps={{
                startAdornment: <InputAdornment position="start">m³</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Entfernung (km)"
              type="number"
              value={quoteDetails.distance}
              onChange={(e) => setQuoteDetails({ ...quoteDetails, distance: Number(e.target.value) })}
              InputProps={{
                startAdornment: <InputAdornment position="start">km</InputAdornment>,
              }}
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Zusatzleistungen */}
      <Paper sx={{ p: cardPadding, mb: spacing }}>
        <Typography variant="h6" gutterBottom>
          Zusatzleistungen
        </Typography>
        <Grid container spacing={2}>
          {/* Services based on company */}
          {selectedCompany === 'relocato' ? (
            <>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedServices.packing}
                      onChange={(e) => setSelectedServices({ ...selectedServices, packing: e.target.checked })}
                    />
                  }
                  label="Verpackungsservice"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedServices.boxes}
                      onChange={(e) => setSelectedServices({ ...selectedServices, boxes: e.target.checked })}
                    />
                  }
                  label="Umzugskartons"
                />
                {selectedServices.boxes && (
                  <TextField
                    fullWidth
                    label="Anzahl Kartons"
                    type="number"
                    value={quoteDetails.boxCount}
                    onChange={(e) => setQuoteDetails({ ...quoteDetails, boxCount: Number(e.target.value) })}
                    sx={{ mt: 1 }}
                  />
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedServices.assembly}
                      onChange={(e) => setSelectedServices({ ...selectedServices, assembly: e.target.checked })}
                    />
                  }
                  label="Möbelmontage"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedServices.disassembly}
                      onChange={(e) => setSelectedServices({ ...selectedServices, disassembly: e.target.checked })}
                    />
                  }
                  label="Möbeldemontage"
                />
              </Grid>
            </>
          ) : selectedCompany === 'wertvoll' ? (
            <>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedServices.clearance}
                      onChange={(e) => setSelectedServices({ ...selectedServices, clearance: e.target.checked })}
                    />
                  }
                  label="Entrümpelung"
                />
                {selectedServices.clearance && (
                  <TextField
                    fullWidth
                    label="Volumen (m³)"
                    type="number"
                    value={quoteDetails.clearanceVolume}
                    onChange={(e) => setQuoteDetails({ ...quoteDetails, clearanceVolume: Number(e.target.value) })}
                    sx={{ mt: 1 }}
                  />
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedServices.renovation}
                      onChange={(e) => setSelectedServices({ ...selectedServices, renovation: e.target.checked })}
                    />
                  }
                  label="Renovierungsarbeiten"
                />
                {selectedServices.renovation && (
                  <TextField
                    fullWidth
                    label="Stunden"
                    type="number"
                    value={quoteDetails.renovationHours}
                    onChange={(e) => setQuoteDetails({ ...quoteDetails, renovationHours: Number(e.target.value) })}
                    sx={{ mt: 1 }}
                  />
                )}
              </Grid>
            </>
          ) : (
            // Rümpel Schmiede Services
            <>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedServices.clearance}
                      onChange={(e) => setSelectedServices({ ...selectedServices, clearance: e.target.checked })}
                    />
                  }
                  label="Komplette Entrümpelung"
                />
                {selectedServices.clearance && (
                  <TextField
                    fullWidth
                    label="Geschätztes Volumen (m³)"
                    type="number"
                    value={quoteDetails.clearanceVolume}
                    onChange={(e) => setQuoteDetails({ ...quoteDetails, clearanceVolume: Number(e.target.value) })}
                    sx={{ mt: 1 }}
                  />
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedServices.cleaning}
                      onChange={(e) => setSelectedServices({ ...selectedServices, cleaning: e.target.checked })}
                    />
                  }
                  label="Besenreine Übergabe"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedServices.heavyItems}
                      onChange={(e) => setSelectedServices({ ...selectedServices, heavyItems: e.target.checked })}
                    />
                  }
                  label="Sperrgut-Entsorgung"
                />
                {selectedServices.heavyItems && (
                  <TextField
                    fullWidth
                    label="Anzahl Sperrgut-Teile"
                    type="number"
                    value={quoteDetails.heavyItemsCount}
                    onChange={(e) => setQuoteDetails({ ...quoteDetails, heavyItemsCount: Number(e.target.value) })}
                    sx={{ mt: 1 }}
                  />
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedServices.packingMaterials}
                      onChange={(e) => setSelectedServices({ ...selectedServices, packingMaterials: e.target.checked })}
                    />
                  }
                  label="Wertgegenstände separieren"
                />
              </Grid>
            </>
          )}
          
          {/* Common services */}
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={selectedServices.cleaning}
                  onChange={(e) => setSelectedServices({ ...selectedServices, cleaning: e.target.checked })}
                />
              }
              label="Endreinigung"
            />
            {selectedServices.cleaning && (
              <TextField
                fullWidth
                label="Stunden"
                type="number"
                value={quoteDetails.cleaningHours}
                onChange={(e) => setQuoteDetails({ ...quoteDetails, cleaningHours: Number(e.target.value) })}
                sx={{ mt: 1 }}
              />
            )}
          </Grid>
        </Grid>
      </Paper>
      
      {/* Anmerkungen */}
      <Paper sx={{ p: cardPadding, mb: spacing }}>
        <Typography variant="h6" gutterBottom>
          Anmerkungen
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          placeholder="Zusätzliche Anmerkungen zum Angebot..."
          value={quoteDetails.notes}
          onChange={(e) => setQuoteDetails({ ...quoteDetails, notes: e.target.value })}
        />
      </Paper>
      
      {/* Preisübersicht */}
      {calculation && (
        <Card sx={{ mb: spacing }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Preisübersicht
            </Typography>
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ mb: 2 }}>
              {calculation.basePrice > 0 && !useManualPrice && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Basispreis</Typography>
                  <Typography>€{calculation.basePrice.toFixed(2)}</Typography>
                </Box>
              )}
              {/* Additional cost breakdowns can be added here */}
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={useManualPrice}
                    onChange={(e) => setUseManualPrice(e.target.checked)}
                  />
                }
                label="Manueller Preis"
              />
              {useManualPrice && (
                <TextField
                  label="Gesamtpreis"
                  type="number"
                  value={manualTotalPrice}
                  onChange={(e) => setManualTotalPrice(Number(e.target.value))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>,
                  }}
                  size="small"
                />
              )}
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6">Gesamtpreis</Typography>
              <Typography variant="h6" color="primary">
                €{(useManualPrice ? manualTotalPrice : calculation.totalPrice).toFixed(2)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
      
      {/* Aktionen */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          onClick={saveQuote}
          disabled={loading || !customer.id}
          fullWidth={isMobile}
        >
          {loading ? 'Speichere...' : 'Speichern'}
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SendIcon />}
          onClick={sendQuoteEmail}
          disabled={loading || !customer.id || !customer.email}
          fullWidth={isMobile}
        >
          Angebot senden
        </Button>
        <Button
          variant="outlined"
          startIcon={<GetAppIcon />}
          onClick={downloadPDF}
          disabled={loading || !customer.id}
          fullWidth={isMobile}
        >
          PDF Download
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Angebot erfolgreich erstellt!
        </Alert>
      )}
    </Box>
  );
  
  return isMobile ? (
    <MobileLayout title="Neues Angebot">
      {content}
    </MobileLayout>
  ) : (
    <Container maxWidth="lg">
      {content}
    </Container>
  );
};

export default CreateQuoteMultiCompany;