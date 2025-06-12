import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  useTheme,
  alpha,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  RadioGroup,
  Radio,
  FormLabel,
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  Receipt as ReceiptIcon,
  Euro as EuroIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  DateRange as DateRangeIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  PieChart as PieChartIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  AccountBalance as AccountBalanceIcon,
  Gavel as GavelIcon,
  LocalShipping as LocalShippingIcon,
} from '@mui/icons-material';
import { format, addDays, startOfYear, endOfYear } from 'date-fns';
import { de } from 'date-fns/locale';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { AnimatedCard, SlideInContainer } from './MicroAnimations';

interface TaxRate {
  id: string;
  name: string;
  rate: number; // percentage
  category: 'standard' | 'reduced' | 'zero' | 'exempt';
  validFrom: Date;
  validTo?: Date;
  description: string;
  applicableServices: string[];
  countryCode: string;
}

interface TaxRule {
  id: string;
  name: string;
  condition: string;
  taxRateId: string;
  priority: number;
  isActive: boolean;
  description: string;
  exceptions: string[];
}

interface TaxCalculation {
  id: string;
  invoiceId: string;
  customerType: 'b2b' | 'b2c';
  customerCountry: string;
  customerVatId?: string;
  serviceType: string;
  netAmount: number;
  taxRate: number;
  taxAmount: number;
  grossAmount: number;
  taxRuleApplied: string;
  calculatedAt: Date;
  isReverseCharge: boolean;
  isIntraCommunity: boolean;
  exemptionReason?: string;
}

interface VatValidation {
  vatId: string;
  isValid: boolean;
  companyName?: string;
  address?: string;
  countryCode: string;
  validatedAt: Date;
  source: 'vies' | 'manual' | 'cache';
}

interface TaxReport {
  id: string;
  period: {
    start: Date;
    end: Date;
  };
  type: 'monthly' | 'quarterly' | 'yearly';
  totalNetAmount: number;
  totalTaxAmount: number;
  totalGrossAmount: number;
  taxBreakdown: Array<{
    rate: number;
    netAmount: number;
    taxAmount: number;
  }>;
  reverseChargeAmount: number;
  exemptAmount: number;
  status: 'draft' | 'submitted' | 'approved';
}

interface TaxCalculationEngineProps {
  onTaxCalculated?: (calculation: TaxCalculation) => void;
  onVatValidated?: (validation: VatValidation) => void;
  defaultCustomerCountry?: string;
  defaultServiceType?: string;
}

const TaxCalculationEngine: React.FC<TaxCalculationEngineProps> = ({
  onTaxCalculated,
  onVatValidated,
  defaultCustomerCountry = 'DE',
  defaultServiceType = 'standard_moving',
}) => {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState(0);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [taxRules, setTaxRules] = useState<TaxRule[]>([]);
  const [calculations, setCalculations] = useState<TaxCalculation[]>([]);
  const [vatValidations, setVatValidations] = useState<VatValidation[]>([]);
  const [taxReports, setTaxReports] = useState<TaxReport[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [calculationInput, setCalculationInput] = useState({
    netAmount: 0,
    customerType: 'b2c' as 'b2b' | 'b2c',
    customerCountry: defaultCustomerCountry,
    customerVatId: '',
    serviceType: defaultServiceType,
    serviceDate: new Date(),
  });

  useEffect(() => {
    initializeTaxData();
  }, []);

  const initializeTaxData = () => {
    // Initialize German tax rates
    const sampleTaxRates: TaxRate[] = [
      {
        id: 'de-standard',
        name: 'Standard MwSt. (Deutschland)',
        rate: 19,
        category: 'standard',
        validFrom: new Date('2007-01-01'),
        description: 'Standard-Mehrwertsteuersatz für Deutschland',
        applicableServices: ['standard_moving', 'packing', 'storage', 'cleaning'],
        countryCode: 'DE',
      },
      {
        id: 'de-reduced',
        name: 'Ermäßigte MwSt. (Deutschland)',
        rate: 7,
        category: 'reduced',
        validFrom: new Date('2007-01-01'),
        description: 'Ermäßigter Mehrwertsteuersatz für bestimmte Dienstleistungen',
        applicableServices: ['consultation', 'planning'],
        countryCode: 'DE',
      },
      {
        id: 'at-standard',
        name: 'Standard USt. (Österreich)',
        rate: 20,
        category: 'standard',
        validFrom: new Date('1995-01-01'),
        description: 'Standard-Umsatzsteuersatz für Österreich',
        applicableServices: ['standard_moving', 'packing', 'storage'],
        countryCode: 'AT',
      },
      {
        id: 'ch-exempt',
        name: 'MwSt.-befreit (Schweiz)',
        rate: 0,
        category: 'exempt',
        validFrom: new Date('1995-01-01'),
        description: 'Exportleistung in die Schweiz (Drittland)',
        applicableServices: ['standard_moving', 'packing', 'storage', 'cleaning'],
        countryCode: 'CH',
      },
      {
        id: 'fr-standard',
        name: 'Standard TVA (Frankreich)',
        rate: 20,
        category: 'standard',
        validFrom: new Date('2014-01-01'),
        description: 'Standard-Mehrwertsteuersatz für Frankreich',
        applicableServices: ['standard_moving', 'packing', 'storage'],
        countryCode: 'FR',
      },
    ];

    // Initialize tax rules
    const sampleTaxRules: TaxRule[] = [
      {
        id: 'rule-1',
        name: 'Inlandsleistung Deutschland',
        condition: 'customer_country == "DE" && service_location == "DE"',
        taxRateId: 'de-standard',
        priority: 1,
        isActive: true,
        description: 'Standard-MwSt. für Inlandsleistungen in Deutschland',
        exceptions: [],
      },
      {
        id: 'rule-2',
        name: 'B2B EU Reverse Charge',
        condition: 'customer_type == "b2b" && customer_country != "DE" && is_eu_country == true && vat_id_valid == true',
        taxRateId: 'de-standard',
        priority: 2,
        isActive: true,
        description: 'Reverse Charge Verfahren für B2B-Kunden in der EU',
        exceptions: [],
      },
      {
        id: 'rule-3',
        name: 'Export Drittland',
        condition: 'customer_country not in EU_COUNTRIES',
        taxRateId: 'ch-exempt',
        priority: 3,
        isActive: true,
        description: 'Steuerfreie Exportleistung in Drittländer',
        exceptions: [],
      },
      {
        id: 'rule-4',
        name: 'B2C EU Bestimmungslandprinzip',
        condition: 'customer_type == "b2c" && customer_country != "DE" && is_eu_country == true',
        taxRateId: 'de-standard',
        priority: 4,
        isActive: true,
        description: 'MwSt. des Bestimmungslandes für B2C-Kunden in der EU',
        exceptions: [],
      },
    ];

    // Generate sample calculations
    const sampleCalculations: TaxCalculation[] = [];
    for (let i = 0; i < 20; i++) {
      const netAmount = 500 + Math.random() * 2000;
      const customerTypes: Array<'b2b' | 'b2c'> = ['b2b', 'b2c'];
      const countries = ['DE', 'AT', 'FR', 'NL', 'CH', 'US'];
      const serviceTypes = ['standard_moving', 'packing', 'storage', 'cleaning', 'consultation'];
      
      const customerType = customerTypes[Math.floor(Math.random() * customerTypes.length)];
      const customerCountry = countries[Math.floor(Math.random() * countries.length)];
      const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
      
      // Apply tax logic
      let taxRate = 19; // Default German rate
      let isReverseCharge = false;
      let isIntraCommunity = false;
      
      if (customerCountry === 'DE') {
        taxRate = serviceType === 'consultation' ? 7 : 19;
      } else if (customerCountry === 'CH' || customerCountry === 'US') {
        taxRate = 0; // Export to third countries
      } else if (customerType === 'b2b' && ['AT', 'FR', 'NL'].includes(customerCountry)) {
        taxRate = 0; // Reverse charge for EU B2B
        isReverseCharge = true;
        isIntraCommunity = true;
      } else {
        taxRate = customerCountry === 'AT' ? 20 : customerCountry === 'FR' ? 20 : 19;
      }
      
      const taxAmount = netAmount * (taxRate / 100);
      const grossAmount = netAmount + taxAmount;
      
      sampleCalculations.push({
        id: `calc-${i + 1}`,
        invoiceId: `INV-${2024}-${(i + 1).toString().padStart(4, '0')}`,
        customerType,
        customerCountry,
        customerVatId: customerType === 'b2b' ? `${customerCountry}123456789` : undefined,
        serviceType,
        netAmount,
        taxRate,
        taxAmount,
        grossAmount,
        taxRuleApplied: 'rule-1',
        calculatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        isReverseCharge,
        isIntraCommunity,
      });
    }

    // Generate sample VAT validations
    const sampleVatValidations: VatValidation[] = [
      {
        vatId: 'DE123456789',
        isValid: true,
        companyName: 'Musterfirma GmbH',
        address: 'Musterstraße 123, 12345 Berlin',
        countryCode: 'DE',
        validatedAt: new Date(),
        source: 'vies',
      },
      {
        vatId: 'AT123456789',
        isValid: true,
        companyName: 'Österreichische Umzugsfirma GmbH',
        address: 'Wiener Straße 456, 1010 Wien',
        countryCode: 'AT',
        validatedAt: new Date(),
        source: 'vies',
      },
      {
        vatId: 'FR123456789',
        isValid: false,
        countryCode: 'FR',
        validatedAt: new Date(),
        source: 'vies',
      },
    ];

    setTaxRates(sampleTaxRates);
    setTaxRules(sampleTaxRules);
    setCalculations(sampleCalculations.sort((a, b) => b.calculatedAt.getTime() - a.calculatedAt.getTime()));
    setVatValidations(sampleVatValidations);
  };

  const calculateTax = async () => {
    setIsCalculating(true);
    
    // Simulate tax calculation
    setTimeout(() => {
      const { netAmount, customerType, customerCountry, customerVatId, serviceType } = calculationInput;
      
      // Determine applicable tax rate and rules
      let applicableTaxRate = taxRates.find(rate => 
        rate.countryCode === customerCountry && 
        rate.applicableServices.includes(serviceType)
      );
      
      // Default to German standard rate if no specific rate found
      if (!applicableTaxRate && customerCountry === 'DE') {
        applicableTaxRate = taxRates.find(rate => rate.id === 'de-standard');
      }
      
      // Apply business logic
      let finalTaxRate = applicableTaxRate?.rate || 0;
      let isReverseCharge = false;
      let isIntraCommunity = false;
      let exemptionReason = '';
      
      const euCountries = ['AT', 'BE', 'BG', 'CY', 'CZ', 'DK', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK'];
      
      if (customerCountry !== 'DE') {
        if (euCountries.includes(customerCountry)) {
          if (customerType === 'b2b' && customerVatId) {
            // EU B2B with valid VAT ID = Reverse Charge
            finalTaxRate = 0;
            isReverseCharge = true;
            isIntraCommunity = true;
            exemptionReason = 'Reverse Charge Verfahren §13b UStG';
          }
          // EU B2C would use destination country rate (simplified here)
        } else {
          // Third country = Export exempt
          finalTaxRate = 0;
          exemptionReason = 'Steuerfreie Exportleistung §4 Nr. 1a UStG';
        }
      }
      
      const taxAmount = netAmount * (finalTaxRate / 100);
      const grossAmount = netAmount + taxAmount;
      
      const newCalculation: TaxCalculation = {
        id: `calc-${Date.now()}`,
        invoiceId: `INV-${Date.now()}`,
        customerType,
        customerCountry,
        customerVatId,
        serviceType,
        netAmount,
        taxRate: finalTaxRate,
        taxAmount,
        grossAmount,
        taxRuleApplied: 'rule-1',
        calculatedAt: new Date(),
        isReverseCharge,
        isIntraCommunity,
        exemptionReason,
      };
      
      setCalculations(prev => [newCalculation, ...prev]);
      onTaxCalculated?.(newCalculation);
      setIsCalculating(false);
    }, 1500);
  };

  const validateVatId = async (vatId: string) => {
    setIsValidating(true);
    
    // Simulate VAT ID validation via VIES
    setTimeout(() => {
      const isValid = Math.random() > 0.3; // 70% success rate for demo
      const countryCode = vatId.substring(0, 2);
      
      const validation: VatValidation = {
        vatId,
        isValid,
        companyName: isValid ? `Beispiel Firma ${vatId}` : undefined,
        address: isValid ? `Beispielstraße 123, ${countryCode}` : undefined,
        countryCode,
        validatedAt: new Date(),
        source: 'vies',
      };
      
      setVatValidations(prev => [validation, ...prev.filter(v => v.vatId !== vatId)]);
      onVatValidated?.(validation);
      setIsValidating(false);
    }, 2000);
  };

  // Calculate tax report data
  const currentYearReport = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearCalculations = calculations.filter(calc => 
      calc.calculatedAt.getFullYear() === currentYear
    );
    
    const totalNetAmount = yearCalculations.reduce((sum, calc) => sum + calc.netAmount, 0);
    const totalTaxAmount = yearCalculations.reduce((sum, calc) => sum + calc.taxAmount, 0);
    const reverseChargeAmount = yearCalculations
      .filter(calc => calc.isReverseCharge)
      .reduce((sum, calc) => sum + calc.netAmount, 0);
    const exemptAmount = yearCalculations
      .filter(calc => calc.taxRate === 0 && !calc.isReverseCharge)
      .reduce((sum, calc) => sum + calc.netAmount, 0);
    
    // Tax breakdown by rate
    const taxBreakdown = [7, 19, 20].map(rate => {
      const rateCalculations = yearCalculations.filter(calc => calc.taxRate === rate);
      return {
        rate,
        netAmount: rateCalculations.reduce((sum, calc) => sum + calc.netAmount, 0),
        taxAmount: rateCalculations.reduce((sum, calc) => sum + calc.taxAmount, 0),
      };
    }).filter(item => item.netAmount > 0);
    
    return {
      totalNetAmount,
      totalTaxAmount,
      totalGrossAmount: totalNetAmount + totalTaxAmount,
      reverseChargeAmount,
      exemptAmount,
      taxBreakdown,
    };
  }, [calculations]);

  const getCountryFlag = (countryCode: string) => {
    const flags: { [key: string]: string } = {
      'DE': '🇩🇪',
      'AT': '🇦🇹',
      'FR': '🇫🇷',
      'NL': '🇳🇱',
      'CH': '🇨🇭',
      'US': '🇺🇸',
      'GB': '🇬🇧',
    };
    return flags[countryCode] || '🌐';
  };

  const getTaxCategoryColor = (category: string) => {
    switch (category) {
      case 'standard': return theme.palette.primary.main;
      case 'reduced': return theme.palette.success.main;
      case 'zero': return theme.palette.info.main;
      case 'exempt': return theme.palette.warning.main;
      default: return theme.palette.grey[500];
    }
  };

  const renderCalculatorTab = () => (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Steuer-Rechner
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Eingabedaten
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nettobetrag"
                  type="number"
                  value={calculationInput.netAmount}
                  onChange={(e) => setCalculationInput(prev => ({ ...prev, netAmount: Number(e.target.value) }))}
                  InputProps={{
                    startAdornment: <EuroIcon color="action" sx={{ mr: 1 }} />,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Kundentyp</InputLabel>
                  <Select
                    value={calculationInput.customerType}
                    label="Kundentyp"
                    onChange={(e) => setCalculationInput(prev => ({ ...prev, customerType: e.target.value as any }))}
                  >
                    <MenuItem value="b2c">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon />
                        Privatkunde (B2C)
                      </Box>
                    </MenuItem>
                    <MenuItem value="b2b">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon />
                        Geschäftskunde (B2B)
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Kundenland</InputLabel>
                  <Select
                    value={calculationInput.customerCountry}
                    label="Kundenland"
                    onChange={(e) => setCalculationInput(prev => ({ ...prev, customerCountry: e.target.value }))}
                  >
                    <MenuItem value="DE">{getCountryFlag('DE')} Deutschland</MenuItem>
                    <MenuItem value="AT">{getCountryFlag('AT')} Österreich</MenuItem>
                    <MenuItem value="FR">{getCountryFlag('FR')} Frankreich</MenuItem>
                    <MenuItem value="NL">{getCountryFlag('NL')} Niederlande</MenuItem>
                    <MenuItem value="CH">{getCountryFlag('CH')} Schweiz</MenuItem>
                    <MenuItem value="US">{getCountryFlag('US')} USA</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {calculationInput.customerType === 'b2b' && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      label="USt-IdNr."
                      value={calculationInput.customerVatId}
                      onChange={(e) => setCalculationInput(prev => ({ ...prev, customerVatId: e.target.value }))}
                      placeholder="DE123456789"
                    />
                    <Button
                      variant="outlined"
                      onClick={() => validateVatId(calculationInput.customerVatId)}
                      disabled={!calculationInput.customerVatId || isValidating}
                      sx={{ minWidth: 120 }}
                    >
                      {isValidating ? 'Prüfe...' : 'Prüfen'}
                    </Button>
                  </Box>
                </Grid>
              )}
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Leistungsart</InputLabel>
                  <Select
                    value={calculationInput.serviceType}
                    label="Leistungsart"
                    onChange={(e) => setCalculationInput(prev => ({ ...prev, serviceType: e.target.value }))}
                  >
                    <MenuItem value="standard_moving">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocalShippingIcon />
                        Standard-Umzug
                      </Box>
                    </MenuItem>
                    <MenuItem value="packing">Verpackungsservice</MenuItem>
                    <MenuItem value="storage">Lagerung</MenuItem>
                    <MenuItem value="cleaning">Reinigungsservice</MenuItem>
                    <MenuItem value="consultation">Beratung</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={isCalculating ? <RefreshIcon className="rotating" /> : <CalculateIcon />}
                  onClick={calculateTax}
                  disabled={isCalculating || calculationInput.netAmount <= 0}
                >
                  {isCalculating ? 'Berechne...' : 'Steuer berechnen'}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Berechnungsergebnis
            </Typography>
            
            {calculations.length > 0 && (
              <Box>
                <List>
                  <ListItem>
                    <ListItemText primary="Nettobetrag" />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      €{calculations[0]?.netAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                    </Typography>
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText 
                      primary="Steuersatz"
                      secondary={calculations[0]?.exemptionReason || 'Reguläre Besteuerung'}
                    />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {calculations[0]?.taxRate}%
                    </Typography>
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText primary="Steuerbetrag" />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      €{calculations[0]?.taxAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                    </Typography>
                  </ListItem>
                  
                  <Divider />
                  
                  <ListItem>
                    <ListItemText 
                      primary="Bruttobetrag"
                      primaryTypographyProps={{ variant: 'h6', fontWeight: 600 }}
                    />
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      €{calculations[0]?.grossAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                    </Typography>
                  </ListItem>
                </List>
                
                {calculations[0]?.isReverseCharge && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Reverse Charge Verfahren:</strong> Die Steuerschuldnerschaft geht auf den Leistungsempfänger über (§13b UStG).
                    </Typography>
                  </Alert>
                )}
                
                {calculations[0]?.exemptionReason && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Steuerbefreiung:</strong> {calculations[0].exemptionReason}
                    </Typography>
                  </Alert>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const renderRatesTab = () => (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Steuersätze & Regeln
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Aktuelle Steuersätze
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Land</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell align="right">Satz</TableCell>
                    <TableCell>Kategorie</TableCell>
                    <TableCell>Anwendbare Services</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {taxRates.map((rate) => (
                    <TableRow key={rate.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h6">
                            {getCountryFlag(rate.countryCode)}
                          </Typography>
                          <Typography variant="body2">
                            {rate.countryCode}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {rate.name}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {rate.rate}%
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={rate.category}
                          size="small"
                          sx={{
                            backgroundColor: alpha(getTaxCategoryColor(rate.category), 0.1),
                            color: getTaxCategoryColor(rate.category),
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {rate.applicableServices.slice(0, 2).map((service) => (
                            <Chip key={service} label={service} size="small" variant="outlined" />
                          ))}
                          {rate.applicableServices.length > 2 && (
                            <Chip label={`+${rate.applicableServices.length - 2}`} size="small" variant="outlined" />
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Steuerregeln
            </Typography>
            
            {taxRules.map((rule) => (
              <Accordion key={rule.id}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {rule.name}
                    </Typography>
                    <Box sx={{ ml: 'auto' }}>
                      <Chip
                        label={rule.isActive ? 'Aktiv' : 'Inaktiv'}
                        size="small"
                        color={rule.isActive ? 'success' : 'default'}
                      />
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="caption" color="text.secondary" paragraph>
                    {rule.description}
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', backgroundColor: 'grey.100', p: 1, borderRadius: 1, display: 'block' }}>
                    {rule.condition}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const renderReportsTab = () => (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Steuerberichte
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <EuroIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    €{currentYearReport.totalNetAmount.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Nettoumsatz
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AccountBalanceIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    €{currentYearReport.totalTaxAmount.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    MwSt. Schuld
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <GavelIcon color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    €{currentYearReport.reverseChargeAmount.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Reverse Charge
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <InfoIcon color="info" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    €{currentYearReport.exemptAmount.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Steuerbefreit
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Steueraufkommen nach Sätzen
            </Typography>
            
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={currentYearReport.taxBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rate" />
                  <YAxis />
                  <RechartsTooltip 
                    formatter={(value: number) => [`€${value.toLocaleString()}`, 'Betrag']}
                  />
                  <Legend />
                  <Bar dataKey="netAmount" fill={theme.palette.primary.main} name="Nettobetrag" />
                  <Bar dataKey="taxAmount" fill={theme.palette.success.main} name="Steuerbetrag" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Umsatzverteilung
            </Typography>
            
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Steuerpflichtig', value: currentYearReport.totalNetAmount - currentYearReport.reverseChargeAmount - currentYearReport.exemptAmount },
                      { name: 'Reverse Charge', value: currentYearReport.reverseChargeAmount },
                      { name: 'Steuerbefreit', value: currentYearReport.exemptAmount },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: €${value.toLocaleString()}`}
                  >
                    <Cell fill={theme.palette.primary.main} />
                    <Cell fill={theme.palette.warning.main} />
                    <Cell fill={theme.palette.info.main} />
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Box>
      {/* Header */}
      <SlideInContainer>
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalculateIcon color="primary" />
              Steuerberechnungs-Engine
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => alert('Steuerbericht wird generiert...')}
              >
                Export
              </Button>
              
              <Button
                variant="contained"
                startIcon={<SettingsIcon />}
                onClick={() => setIsConfigDialogOpen(true)}
              >
                Konfiguration
              </Button>
            </Box>
          </Box>
          
          <Typography variant="body1" color="text.secondary">
            Automatische Steuerberechnung nach deutschem und EU-Recht mit USt-IdNr.-Validierung
          </Typography>
        </Paper>
      </SlideInContainer>

      {/* Navigation Tabs */}
      <SlideInContainer delay={200}>
        <Paper elevation={2} sx={{ mb: 4 }}>
          <Tabs
            value={selectedTab}
            onChange={(e, newValue) => setSelectedTab(newValue)}
            variant="fullWidth"
          >
            <Tab label="Rechner" icon={<CalculateIcon />} />
            <Tab label="Steuersätze" icon={<ReceiptIcon />} />
            <Tab label="Berichte" icon={<AssessmentIcon />} />
          </Tabs>
        </Paper>
      </SlideInContainer>

      {/* Tab Content */}
      <SlideInContainer delay={400}>
        {selectedTab === 0 && renderCalculatorTab()}
        {selectedTab === 1 && renderRatesTab()}
        {selectedTab === 2 && renderReportsTab()}
      </SlideInContainer>

      <style jsx global>{`
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .rotating {
          animation: rotate 1s linear infinite;
        }
      `}</style>
    </Box>
  );
};

export default TaxCalculationEngine;