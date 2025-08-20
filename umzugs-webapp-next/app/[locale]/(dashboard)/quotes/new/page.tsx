'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from '@mui/material';
import { Grid2 as Grid } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import {
  ArrowBack as ArrowBackIcon,
  Calculate as CalculateIcon,
  ExpandMore as ExpandMoreIcon,
  Euro as EuroIcon,
  Home as HomeIcon,
  LocalShipping as ShippingIcon,
  Build as BuildIcon,
  Cleaning as CleaningIcon,
} from '@mui/icons-material';
import { Customer, Quote } from '@/types';
import { supabaseService } from '@/lib/services/supabase';
import { useToast } from '@/components/ui/Toaster';

interface QuoteFormData {
  customerId: string;
  customerName: string;
  moveDate: string;
  moveFrom: string;
  moveTo: string;
  volume: number;
  distance: number;
  basePrice: number;
  // Services
  packingService: boolean;
  packingServicePrice: number;
  furnitureAssembly: boolean;
  furnitureAssemblyPrice: number;
  cleaningService: boolean;
  cleaningHours: number;
  cleaningPrice: number;
  packingMaterials: boolean;
  boxCount: number;
  packingMaterialsPrice: number;
  parkingZone: boolean;
  parkingZonePrice: number;
  heavyItems: boolean;
  heavyItemsCount: number;
  heavyItemsPrice: number;
  // Pricing
  discount: number;
  notes: string;
  totalPrice: number;
}

export default function CreateQuotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const t = useTranslations('common');

  const customerId = searchParams.get('customerId');
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCustomer, setLoadingCustomer] = useState(!!customerId);
  
  const [formData, setFormData] = useState<QuoteFormData>({
    customerId: customerId || '',
    customerName: '',
    moveDate: '',
    moveFrom: '',
    moveTo: '',
    volume: 0,
    distance: 0,
    basePrice: 0,
    packingService: false,
    packingServicePrice: 200,
    furnitureAssembly: false,
    furnitureAssemblyPrice: 150,
    cleaningService: false,
    cleaningHours: 4,
    cleaningPrice: 35,
    packingMaterials: false,
    boxCount: 20,
    packingMaterialsPrice: 5,
    parkingZone: false,
    parkingZonePrice: 100,
    heavyItems: false,
    heavyItemsCount: 0,
    heavyItemsPrice: 50,
    discount: 0,
    notes: '',
    totalPrice: 0,
  });

  // Load customer data if customerId is provided
  useEffect(() => {
    const loadCustomer = async () => {
      if (!customerId) return;
      
      try {
        setLoadingCustomer(true);
        await supabaseService.initialize();
        const customerData = await supabaseService.getCustomer(customerId);
        
        if (customerData) {
          setCustomer(customerData);
          setFormData(prev => ({
            ...prev,
            customerId: customerData.id,
            customerName: customerData.name,
            moveDate: customerData.movingDate,
            moveFrom: customerData.fromAddress,
            moveTo: customerData.toAddress,
          }));
        }
      } catch (error) {
        console.error('Error loading customer:', error);
        addToast({
          type: 'error',
          title: 'Fehler',
          message: 'Kunde konnte nicht geladen werden',
        });
      } finally {
        setLoadingCustomer(false);
      }
    };

    loadCustomer();
  }, [customerId, addToast]);

  // Auto-calculate total price
  useEffect(() => {
    let total = formData.basePrice;

    if (formData.packingService) {
      total += formData.packingServicePrice;
    }
    if (formData.furnitureAssembly) {
      total += formData.furnitureAssemblyPrice;
    }
    if (formData.cleaningService) {
      total += formData.cleaningHours * formData.cleaningPrice;
    }
    if (formData.packingMaterials) {
      total += formData.boxCount * formData.packingMaterialsPrice;
    }
    if (formData.parkingZone) {
      total += formData.parkingZonePrice;
    }
    if (formData.heavyItems) {
      total += formData.heavyItemsCount * formData.heavyItemsPrice;
    }

    // Apply discount
    if (formData.discount > 0) {
      total = total * (1 - formData.discount / 100);
    }

    setFormData(prev => ({
      ...prev,
      totalPrice: Math.round(total * 100) / 100, // Round to 2 decimal places
    }));
  }, [
    formData.basePrice,
    formData.packingService,
    formData.packingServicePrice,
    formData.furnitureAssembly,
    formData.furnitureAssemblyPrice,
    formData.cleaningService,
    formData.cleaningHours,
    formData.cleaningPrice,
    formData.packingMaterials,
    formData.boxCount,
    formData.packingMaterialsPrice,
    formData.parkingZone,
    formData.parkingZonePrice,
    formData.heavyItems,
    formData.heavyItemsCount,
    formData.heavyItemsPrice,
    formData.discount,
  ]);

  const handleInputChange = (field: keyof QuoteFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.customerName || formData.totalPrice <= 0) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Bitte füllen Sie alle Pflichtfelder aus',
      });
      return;
    }

    try {
      setLoading(true);
      await supabaseService.initialize();

      const quote: Omit<Quote, 'id'> = {
        customerId: formData.customerId,
        customerName: formData.customerName,
        price: formData.totalPrice,
        createdAt: new Date(),
        createdBy: 'system', // TODO: Get from user context
        status: 'draft',
        volume: formData.volume,
        distance: formData.distance,
        moveDate: formData.moveDate,
        moveFrom: formData.moveFrom,
        moveTo: formData.moveTo,
        notes: formData.notes,
        services: {
          packing: formData.packingService,
          furnitureAssembly: formData.furnitureAssembly,
          cleaning: formData.cleaningService,
          packingMaterials: formData.packingMaterials,
          parkingZone: formData.parkingZone,
          heavyItems: formData.heavyItems,
        },
        packingRequested: formData.packingService,
        boxCount: formData.boxCount,
        parkingZonePrice: formData.parkingZone ? formData.parkingZonePrice : 0,
        furnitureAssemblyPrice: formData.furnitureAssembly ? formData.furnitureAssemblyPrice : 0,
        cleaningService: formData.cleaningService,
        cleaningHours: formData.cleaningHours,
        packingMaterials: formData.packingMaterials,
        heavyItemsCount: formData.heavyItemsCount,
        discount: formData.discount,
      };

      const quoteId = await supabaseService.createQuote(quote);

      addToast({
        type: 'success',
        title: 'Erfolg',
        message: 'Angebot wurde erfolgreich erstellt',
      });

      router.push(`/quotes/${quoteId}`);
    } catch (error) {
      console.error('Error creating quote:', error);
      addToast({
        type: 'error',
        title: 'Fehler',
        message: 'Angebot konnte nicht erstellt werden',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (loadingCustomer) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Lade Kundendaten...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">
          Neues Angebot erstellen
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Customer Information */}
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <HomeIcon sx={{ mr: 1 }} />
                Kundendaten
              </Typography>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Kundenname"
                    value={formData.customerName}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Umzugsdatum"
                    type="date"
                    value={formData.moveDate}
                    onChange={(e) => handleInputChange('moveDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Von Adresse"
                    value={formData.moveFrom}
                    onChange={(e) => handleInputChange('moveFrom', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Nach Adresse"
                    value={formData.moveTo}
                    onChange={(e) => handleInputChange('moveTo', e.target.value)}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Basic Pricing */}
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <CalculateIcon sx={{ mr: 1 }} />
                Grunddaten
              </Typography>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Volumen (m³)"
                    type="number"
                    value={formData.volume}
                    onChange={(e) => handleInputChange('volume', Number(e.target.value))}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Entfernung (km)"
                    type="number"
                    value={formData.distance}
                    onChange={(e) => handleInputChange('distance', Number(e.target.value))}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Grundpreis"
                    type="number"
                    value={formData.basePrice}
                    onChange={(e) => handleInputChange('basePrice', Number(e.target.value))}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">€</InputAdornment>,
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Services */}
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <BuildIcon sx={{ mr: 1 }} />
                Zusatzleistungen
              </Typography>
              
              <Grid container spacing={2}>
                {/* Packing Service */}
                <Grid size={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.packingService}
                        onChange={(e) => handleInputChange('packingService', e.target.checked)}
                      />
                    }
                    label="Verpackungsservice"
                  />
                  {formData.packingService && (
                    <TextField
                      fullWidth
                      label="Verpackungsservice Preis"
                      type="number"
                      value={formData.packingServicePrice}
                      onChange={(e) => handleInputChange('packingServicePrice', Number(e.target.value))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">€</InputAdornment>,
                      }}
                      sx={{ mt: 1 }}
                    />
                  )}
                </Grid>

                {/* Furniture Assembly */}
                <Grid size={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.furnitureAssembly}
                        onChange={(e) => handleInputChange('furnitureAssembly', e.target.checked)}
                      />
                    }
                    label="Möbelmontage"
                  />
                  {formData.furnitureAssembly && (
                    <TextField
                      fullWidth
                      label="Möbelmontage Preis"
                      type="number"
                      value={formData.furnitureAssemblyPrice}
                      onChange={(e) => handleInputChange('furnitureAssemblyPrice', Number(e.target.value))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">€</InputAdornment>,
                      }}
                      sx={{ mt: 1 }}
                    />
                  )}
                </Grid>

                {/* Cleaning Service */}
                <Grid size={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.cleaningService}
                        onChange={(e) => handleInputChange('cleaningService', e.target.checked)}
                      />
                    }
                    label="Reinigungsservice"
                  />
                  {formData.cleaningService && (
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid size={6}>
                        <TextField
                          fullWidth
                          label="Stunden"
                          type="number"
                          value={formData.cleaningHours}
                          onChange={(e) => handleInputChange('cleaningHours', Number(e.target.value))}
                        />
                      </Grid>
                      <Grid size={6}>
                        <TextField
                          fullWidth
                          label="Preis pro Stunde"
                          type="number"
                          value={formData.cleaningPrice}
                          onChange={(e) => handleInputChange('cleaningPrice', Number(e.target.value))}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">€</InputAdornment>,
                          }}
                        />
                      </Grid>
                    </Grid>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Total and Actions */}
        <Grid size={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5">
                Gesamtpreis:
              </Typography>
              <Typography variant="h4" color="primary" fontWeight="bold">
                €{formData.totalPrice.toLocaleString('de-DE')}
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="Notizen"
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              sx={{ mb: 3 }}
            />

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={handleBack}
                disabled={loading}
              >
                Abbrechen
              </Button>
              <LoadingButton
                variant="contained"
                onClick={handleSubmit}
                loading={loading}
                size="large"
              >
                Angebot erstellen
              </LoadingButton>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}