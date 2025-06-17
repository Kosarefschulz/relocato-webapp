import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Paper, Button, TextField, FormControl, InputLabel, Select, MenuItem, IconButton, Chip, List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction, Divider, useTheme, alpha, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Stepper, Step, StepLabel, StepContent, FormControlLabel, Checkbox, Radio, RadioGroup, FormLabel, LinearProgress, Accordion, AccordionSummary, AccordionDetails, GlobalStyles } from '@mui/material';
import Grid from './GridCompat';
import {
  Payment as PaymentIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  Receipt as ReceiptIcon,
  Schedule as ScheduleIcon,
  Euro as EuroIcon,
  Lock as LockIcon,
  Verified as VerifiedIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  Download as DownloadIcon,
  SendOutlined as SendIcon,
  PersonOutlined as PersonIcon,
  BusinessOutlined as BusinessIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { format, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { AnimatedCard, SlideInContainer } from './MicroAnimations';

interface PaymentProvider {
  id: 'stripe' | 'paypal' | 'sepa' | 'sofort' | 'giropay';
  name: string;
  icon: React.ReactNode;
  enabled: boolean;
  configured: boolean;
  supportedMethods: string[];
  fees: {
    percentage: number;
    fixed: number;
  };
  processingTime: string;
  description: string;
}

interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'debit_card' | 'bank_transfer' | 'digital_wallet' | 'instant_bank';
  name: string;
  icon: React.ReactNode;
  provider: string;
  last4?: string;
  expiryDate?: string;
  isDefault: boolean;
  verified: boolean;
}

interface PaymentTransaction {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  paymentMethod: PaymentMethod;
  customer: {
    name: string;
    email: string;
  };
  createdAt: Date;
  completedAt?: Date;
  reference: string;
  description: string;
  fees: number;
}

interface PaymentGatewayProps {
  onPaymentComplete?: (transaction: PaymentTransaction) => void;
  onPaymentFail?: (error: string) => void;
  amount?: number;
  currency?: string;
  description?: string;
}

const PaymentGateway: React.FC<PaymentGatewayProps> = ({
  onPaymentComplete,
  onPaymentFail,
  amount = 0,
  currency = 'EUR',
  description = '',
}) => {
  const theme = useTheme();
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: amount,
    currency: currency,
    description: description,
    customerName: '',
    customerEmail: '',
    billingAddress: {
      street: '',
      city: '',
      postalCode: '',
      country: 'DE',
    },
  });

  useEffect(() => {
    initializeProviders();
    initializePaymentMethods();
    generateSampleTransactions();
  }, []);

  const initializeProviders = () => {
    const sampleProviders: PaymentProvider[] = [
      {
        id: 'stripe',
        name: 'Stripe',
        icon: <CreditCardIcon />,
        enabled: true,
        configured: true,
        supportedMethods: ['credit_card', 'debit_card', 'sepa', 'sofort', 'giropay'],
        fees: { percentage: 1.4, fixed: 0.25 },
        processingTime: 'Sofort',
        description: 'Weltweiter Zahlungsanbieter mit umfassenden Features',
      },
      {
        id: 'paypal',
        name: 'PayPal',
        icon: <BusinessIcon />,
        enabled: true,
        configured: true,
        supportedMethods: ['digital_wallet', 'credit_card'],
        fees: { percentage: 2.49, fixed: 0.35 },
        processingTime: 'Sofort',
        description: 'Bekannte digitale Geldbörse mit hoher Nutzerakzeptanz',
      },
      {
        id: 'sepa',
        name: 'SEPA Lastschrift',
        icon: <BankIcon />,
        enabled: true,
        configured: false,
        supportedMethods: ['bank_transfer'],
        fees: { percentage: 0.35, fixed: 0.00 },
        processingTime: '1-3 Werktage',
        description: 'Kostengünstige Banküberweisung für EU-Kunden',
      },
      {
        id: 'sofort',
        name: 'Sofort Banking',
        icon: <VerifiedIcon />,
        enabled: false,
        configured: false,
        supportedMethods: ['instant_bank'],
        fees: { percentage: 0.9, fixed: 0.25 },
        processingTime: 'Sofort',
        description: 'Sofortige Banküberweisung mit Echtzeitbestätigung',
      },
      {
        id: 'giropay',
        name: 'Giropay',
        icon: <BankIcon />,
        enabled: false,
        configured: false,
        supportedMethods: ['instant_bank'],
        fees: { percentage: 1.2, fixed: 0.00 },
        processingTime: 'Sofort',
        description: 'Deutsche Online-Banking Lösung',
      },
    ];
    
    setProviders(sampleProviders);
  };

  const initializePaymentMethods = () => {
    const sampleMethods: PaymentMethod[] = [
      {
        id: 'card-1',
        type: 'credit_card',
        name: 'Visa •••• 4242',
        icon: <CreditCardIcon />,
        provider: 'stripe',
        last4: '4242',
        expiryDate: '12/26',
        isDefault: true,
        verified: true,
      },
      {
        id: 'card-2',
        type: 'debit_card',
        name: 'Maestro •••• 5555',
        icon: <CreditCardIcon />,
        provider: 'stripe',
        last4: '5555',
        expiryDate: '08/25',
        isDefault: false,
        verified: true,
      },
      {
        id: 'paypal-1',
        type: 'digital_wallet',
        name: 'PayPal Account',
        icon: <BusinessIcon />,
        provider: 'paypal',
        isDefault: false,
        verified: true,
      },
      {
        id: 'sepa-1',
        type: 'bank_transfer',
        name: 'DE•••• 1234',
        icon: <BankIcon />,
        provider: 'sepa',
        last4: '1234',
        isDefault: false,
        verified: true,
      },
    ];
    
    setPaymentMethods(sampleMethods);
  };

  const generateSampleTransactions = () => {
    const sampleTransactions: PaymentTransaction[] = [];
    
    for (let i = 0; i < 10; i++) {
      const amount = 500 + Math.random() * 2000;
      const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      const statuses: Array<PaymentTransaction['status']> = ['completed', 'pending', 'failed', 'refunded'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      sampleTransactions.push({
        id: `tx-${i + 1}`,
        amount,
        currency: 'EUR',
        status,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)] || paymentMethods[0],
        customer: {
          name: `Kunde ${i + 1}`,
          email: `kunde${i + 1}@beispiel.de`,
        },
        createdAt,
        completedAt: status === 'completed' ? addDays(createdAt, 1) : undefined,
        reference: `UMZ-${Date.now()}-${i}`,
        description: `Umzugsrechnung #${i + 1}`,
        fees: amount * 0.014 + 0.25,
      });
    }
    
    setTransactions(sampleTransactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
  };

  const handleProviderToggle = (providerId: string, enabled: boolean) => {
    setProviders(prev => prev.map(provider => 
      provider.id === providerId ? { ...provider, enabled } : provider
    ));
  };

  const handlePaymentProcess = async () => {
    setIsProcessing(true);
    setCurrentStep(1);

    // Simulate payment processing steps
    const steps = [
      'Zahlungsdaten validieren...',
      'Verbindung zum Zahlungsanbieter...',
      'Zahlung autorisieren...',
      'Transaktion abschließen...',
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setCurrentStep(i + 1);
    }

    // Simulate payment result
    const success = Math.random() > 0.1; // 90% success rate
    
    if (success) {
      const newTransaction: PaymentTransaction = {
        id: `tx-${Date.now()}`,
        amount: paymentData.amount,
        currency: paymentData.currency,
        status: 'completed',
        paymentMethod: paymentMethods.find(m => m.id === selectedMethod) || paymentMethods[0],
        customer: {
          name: paymentData.customerName,
          email: paymentData.customerEmail,
        },
        createdAt: new Date(),
        completedAt: new Date(),
        reference: `UMZ-${Date.now()}`,
        description: paymentData.description,
        fees: paymentData.amount * 0.014 + 0.25,
      };
      
      setTransactions(prev => [newTransaction, ...prev]);
      onPaymentComplete?.(newTransaction);
      setCurrentStep(5); // Success step
    } else {
      onPaymentFail?.('Zahlung fehlgeschlagen. Bitte versuchen Sie es erneut.');
      setCurrentStep(-1); // Error step
    }

    setTimeout(() => {
      setIsProcessing(false);
      setCurrentStep(0);
    }, 3000);
  };

  const getStatusColor = (status: PaymentTransaction['status']) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'failed': return 'error';
      case 'refunded': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: PaymentTransaction['status']) => {
    switch (status) {
      case 'completed': return 'Abgeschlossen';
      case 'pending': return 'Ausstehend';
      case 'processing': return 'Wird verarbeitet';
      case 'failed': return 'Fehlgeschlagen';
      case 'refunded': return 'Rückerstattet';
      default: return status;
    }
  };

  const calculateFees = (amount: number, providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    if (!provider) return 0;
    return amount * (provider.fees.percentage / 100) + provider.fees.fixed;
  };

  return (
    <Box>
      {/* Header */}
      <SlideInContainer>
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <PaymentIcon color="primary" />
              Payment Gateway Integration
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Provider-Einstellungen">
                <IconButton onClick={() => setIsConfigDialogOpen(true)}>
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
              
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={() => {
                  generateSampleTransactions();
                }}
              >
                Aktualisieren
              </Button>
            </Box>
          </Box>
          
          <Typography variant="body1" color="text.secondary">
            Sichere Zahlungsabwicklung mit führenden Payment-Providern
          </Typography>
        </Paper>
      </SlideInContainer>

      {/* Payment Providers Overview */}
      <SlideInContainer delay={200}>
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            Zahlungsanbieter
          </Typography>
          
          <Grid container spacing={3}>
            {providers.map((provider, index) => (
              <Grid item xs={12} md={6} lg={4} key={provider.id}>
                <AnimatedCard delay={index * 100}>
                  <Box
                    sx={{
                      background: provider.enabled && provider.configured
                        ? `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${alpha(theme.palette.success.main, 0.8)} 100%)`
                        : provider.enabled
                        ? `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${alpha(theme.palette.warning.main, 0.8)} 100%)`
                        : `linear-gradient(135deg, ${theme.palette.grey[400]} 0%, ${theme.palette.grey[500]} 100%)`,
                      color: 'white',
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Box sx={{ fontSize: 40 }}>
                          {provider.icon}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {provider.name}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            {provider.fees.percentage}% + €{provider.fees.fixed}
                          </Typography>
                        </Box>
                        
                        <Chip
                          label={provider.enabled && provider.configured ? 'Aktiv' : provider.enabled ? 'Konfiguration' : 'Inaktiv'}
                          size="small"
                          sx={{ 
                            backgroundColor: alpha('#fff', 0.2),
                            color: 'white',
                          }}
                        />
                      </Box>
                      
                      <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                        {provider.description}
                      </Typography>
                      
                      <Typography variant="caption" sx={{ display: 'block', mb: 2, opacity: 0.8 }}>
                        Verarbeitungszeit: {provider.processingTime}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        {provider.supportedMethods.slice(0, 3).map((method) => (
                          <Chip
                            key={method}
                            label={method.replace('_', ' ')}
                            size="small"
                            sx={{ 
                              backgroundColor: alpha('#fff', 0.15),
                              color: 'white',
                              fontSize: '0.7rem',
                            }}
                          />
                        ))}
                        {provider.supportedMethods.length > 3 && (
                          <Chip
                            label={`+${provider.supportedMethods.length - 3}`}
                            size="small"
                            sx={{ 
                              backgroundColor: alpha('#fff', 0.15),
                              color: 'white',
                              fontSize: '0.7rem',
                            }}
                          />
                        )}
                      </Box>
                      
                      <Button
                        fullWidth
                        variant="outlined"
                        size="small"
                        onClick={() => handleProviderToggle(provider.id, !provider.enabled)}
                        sx={{
                          color: 'white',
                          borderColor: alpha('#fff', 0.5),
                          '&:hover': {
                            borderColor: 'white',
                            backgroundColor: alpha('#fff', 0.1),
                          },
                        }}
                      >
                        {provider.enabled ? 'Deaktivieren' : 'Aktivieren'}
                      </Button>
                    </CardContent>
                  </Box>
                </AnimatedCard>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </SlideInContainer>

      {/* Payment Processing Interface */}
      <SlideInContainer delay={400}>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                Zahlung verarbeiten
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Betrag"
                    type="number"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    InputProps={{
                      startAdornment: <EuroIcon color="action" sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Währung</InputLabel>
                    <Select
                      value={paymentData.currency}
                      label="Währung"
                      onChange={(e) => setPaymentData(prev => ({ ...prev, currency: e.target.value }))}
                    >
                      <MenuItem value="EUR">EUR - Euro</MenuItem>
                      <MenuItem value="USD">USD - US Dollar</MenuItem>
                      <MenuItem value="GBP">GBP - Britisches Pfund</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Beschreibung"
                    value={paymentData.description}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Kundenname"
                    value={paymentData.customerName}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, customerName: e.target.value }))}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="E-Mail"
                    type="email"
                    value={paymentData.customerEmail}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, customerEmail: e.target.value }))}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Zahlungsanbieter</InputLabel>
                    <Select
                      value={selectedProvider}
                      label="Zahlungsanbieter"
                      onChange={(e) => setSelectedProvider(e.target.value)}
                    >
                      {providers.filter(p => p.enabled && p.configured).map((provider) => (
                        <MenuItem key={provider.id} value={provider.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {provider.icon}
                            {provider.name}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Zahlungsmethode</InputLabel>
                    <Select
                      value={selectedMethod}
                      label="Zahlungsmethode"
                      onChange={(e) => setSelectedMethod(e.target.value)}
                    >
                      {paymentMethods.filter(m => m.provider === selectedProvider).map((method) => (
                        <MenuItem key={method.id} value={method.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {method.icon}
                            {method.name}
                            {method.isDefault && <Chip label="Standard" size="small" />}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                {selectedProvider && (
                  <Grid item xs={12}>
                    <Alert severity="info">
                      <Typography variant="body2">
                        <strong>Gebühren:</strong> €{calculateFees(paymentData.amount, selectedProvider).toFixed(2)} 
                        <br />
                        <strong>Nettobetrag:</strong> €{(paymentData.amount - calculateFees(paymentData.amount, selectedProvider)).toFixed(2)}
                      </Typography>
                    </Alert>
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={isProcessing ? <RefreshIcon className="rotating" /> : <PaymentIcon />}
                    onClick={handlePaymentProcess}
                    disabled={isProcessing || !selectedProvider || !selectedMethod || paymentData.amount <= 0}
                  >
                    {isProcessing ? 'Zahlung wird verarbeitet...' : `€${paymentData.amount.toFixed(2)} bezahlen`}
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Zahlungsvorgang
              </Typography>
              
              <Stepper activeStep={currentStep} orientation="vertical">
                <Step>
                  <StepLabel>Daten eingeben</StepLabel>
                  <StepContent>
                    <Typography variant="body2">
                      Geben Sie alle erforderlichen Zahlungsinformationen ein.
                    </Typography>
                  </StepContent>
                </Step>
                
                <Step>
                  <StepLabel 
                    error={currentStep === -1}
                    icon={currentStep === 5 ? <CheckCircleIcon /> : undefined}
                  >
                    Zahlung verarbeiten
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2">
                      {currentStep === -1 ? 'Fehler bei der Zahlungsverarbeitung' :
                       currentStep === 5 ? 'Zahlung erfolgreich abgeschlossen!' :
                       'Zahlung wird an den Anbieter übermittelt...'}
                    </Typography>
                    {isProcessing && currentStep > 0 && currentStep < 5 && (
                      <LinearProgress sx={{ mt: 1 }} />
                    )}
                  </StepContent>
                </Step>
              </Stepper>
              
              {paymentData.amount > 0 && (
                <Box sx={{ mt: 3, p: 2, backgroundColor: alpha(theme.palette.primary.main, 0.1), borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Zusammenfassung
                  </Typography>
                  <List dense>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText primary="Betrag" secondary={`€${paymentData.amount.toFixed(2)}`} />
                    </ListItem>
                    {selectedProvider && (
                      <>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText primary="Gebühren" secondary={`€${calculateFees(paymentData.amount, selectedProvider).toFixed(2)}`} />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText 
                            primary="Netto" 
                            secondary={`€${(paymentData.amount - calculateFees(paymentData.amount, selectedProvider)).toFixed(2)}`} 
                          />
                        </ListItem>
                      </>
                    )}
                  </List>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </SlideInContainer>

      {/* Recent Transactions */}
      <SlideInContainer delay={600}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Letzte Transaktionen
            </Typography>
            
            <Button
              startIcon={<DownloadIcon />}
              onClick={() => {
                // Export functionality would be implemented here
                alert('Export-Funktionalität wird implementiert...');
              }}
            >
              Exportieren
            </Button>
          </Box>
          
          <List>
            {transactions.slice(0, 8).map((transaction, index) => (
              <React.Fragment key={transaction.id}>
                <ListItem>
                  <ListItemIcon>
                    {transaction.paymentMethod.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {transaction.description}
                        </Typography>
                        <Chip 
                          label={getStatusLabel(transaction.status)}
                          size="small"
                          color={getStatusColor(transaction.status)}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {transaction.customer.name} • {transaction.reference}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(transaction.createdAt, 'dd.MM.yyyy HH:mm', { locale: de })}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        €{transaction.amount.toFixed(2)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Gebühr: €{transaction.fees.toFixed(2)}
                      </Typography>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < transactions.slice(0, 8).length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      </SlideInContainer>

      {/* Provider Configuration Dialog */}
      <Dialog
        open={isConfigDialogOpen}
        onClose={() => setIsConfigDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Payment Provider Konfiguration</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {providers.map((provider) => (
              <Accordion key={provider.id}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    {provider.icon}
                    <Typography variant="h6">{provider.name}</Typography>
                    <Box sx={{ ml: 'auto' }}>
                      <Chip
                        label={provider.configured ? 'Konfiguriert' : 'Nicht konfiguriert'}
                        color={provider.configured ? 'success' : 'warning'}
                        size="small"
                      />
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {provider.description}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="API Key"
                        type="password"
                        placeholder="Geben Sie Ihren API Key ein"
                        disabled={!provider.enabled}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Secret Key"
                        type="password"
                        placeholder="Geben Sie Ihren Secret Key ein"
                        disabled={!provider.enabled}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={provider.enabled}
                            onChange={(e) => handleProviderToggle(provider.id, e.target.checked)}
                          />
                        }
                        label="Provider aktivieren"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Alert severity="info" icon={<LockIcon />}>
                        <Typography variant="body2">
                          Alle API-Schlüssel werden verschlüsselt gespeichert und über sichere Verbindungen übertragen.
                        </Typography>
                      </Alert>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsConfigDialogOpen(false)}>
            Schließen
          </Button>
          <Button variant="contained">
            Konfiguration speichern
          </Button>
        </DialogActions>
      </Dialog>

      <GlobalStyles
        styles={{
          '@keyframes rotate': {
            from: {
              transform: 'rotate(0deg)',
            },
            to: {
              transform: 'rotate(360deg)',
            },
          },
          '.rotating': {
            animation: 'rotate 1s linear infinite',
          },
        }}
      />
    </Box>
  );
};

export default PaymentGateway;