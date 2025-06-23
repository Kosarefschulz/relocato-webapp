import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Card,
  CardContent,
  Chip,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Divider,
  Stack,
  Badge,
  useTheme,
  alpha
} from '@mui/material';
import Grid from '../components/GridCompat';
import {
  Receipt as ReceiptIcon,
  Euro as EuroIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  AccountBalance as BankIcon,
  Business as BusinessIcon,
  MoreVert as MoreIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Invoice, Quote, Customer } from '../types';
import { databaseService as googleSheetsService } from '../config/database.config';
import { motion } from 'framer-motion';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const MotionCard = motion(Card);

const AccountingDashboard: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCompany, setSelectedCompany] = useState<'all' | 'relocato' | 'wertvoll'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invoicesData, quotesData, customersData] = await Promise.all([
        googleSheetsService.getInvoices(),
        googleSheetsService.getQuotes(),
        googleSheetsService.getCustomers()
      ]);
      setInvoices(invoicesData);
      setQuotes(quotesData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter invoices by company
  const filteredInvoices = invoices.filter(inv => 
    selectedCompany === 'all' || inv.company === selectedCompany
  );

  // Calculate statistics
  const stats = {
    openInvoices: filteredInvoices.filter(inv => inv.status === 'open' || inv.status === 'sent').length,
    paidInvoices: filteredInvoices.filter(inv => inv.status === 'paid').length,
    overdueInvoices: filteredInvoices.filter(inv => {
      if (inv.status === 'paid') return false;
      const dueDate = new Date(inv.dueDate);
      return dueDate < new Date();
    }).length,
    totalRevenue: filteredInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.totalPrice, 0),
    pendingRevenue: filteredInvoices
      .filter(inv => inv.status !== 'paid')
      .reduce((sum, inv) => sum + inv.totalPrice, 0)
  };

  // Get invoices with payment status from quotes
  const getInvoicePaymentStatus = (invoice: Invoice) => {
    const quote = quotes.find(q => q.id === invoice.quoteId);
    return quote?.paymentInfo;
  };

  const renderInvoicesList = (status: 'open' | 'paid' | 'overdue') => {
    let filtered = filteredInvoices;
    
    if (status === 'open') {
      filtered = filtered.filter(inv => inv.status === 'open' || inv.status === 'sent');
    } else if (status === 'paid') {
      filtered = filtered.filter(inv => inv.status === 'paid');
    } else if (status === 'overdue') {
      filtered = filtered.filter(inv => {
        if (inv.status === 'paid') return false;
        const dueDate = new Date(inv.dueDate);
        return dueDate < new Date();
      });
    }

    if (searchTerm) {
      filtered = filtered.filter(inv => 
        inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return (
      <Stack spacing={2}>
        {filtered.map((invoice) => {
          const paymentInfo = getInvoicePaymentStatus(invoice);
          const isOverdue = status === 'overdue';
          
          return (
            <MotionCard
              key={invoice.id}
              whileHover={{ scale: 1.02 }}
              sx={{ 
                cursor: 'pointer',
                borderLeft: 4,
                borderColor: isOverdue ? 'error.main' : 
                           invoice.status === 'paid' ? 'success.main' : 
                           'warning.main'
              }}
              onClick={() => navigate(`/invoices/${invoice.id}`)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {invoice.customerName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Rechnung {invoice.invoiceNumber}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                      <Chip 
                        size="small" 
                        label={invoice.company || 'Relocato'} 
                        icon={<BusinessIcon />}
                        color={invoice.company === 'wertvoll' ? 'secondary' : 'primary'}
                      />
                      {paymentInfo && (
                        <Chip
                          size="small"
                          icon={<EuroIcon />}
                          label={
                            paymentInfo.status === 'paid_on_site' ? 'Vor Ort bezahlt' :
                            paymentInfo.status === 'paid' ? 'Bezahlt' :
                            paymentInfo.status === 'partially_paid' ? 'Teilzahlung' :
                            'Ausstehend'
                          }
                          color={
                            paymentInfo.status === 'paid' || paymentInfo.status === 'paid_on_site' ? 'success' :
                            paymentInfo.status === 'partially_paid' ? 'warning' :
                            'default'
                          }
                        />
                      )}
                      {paymentInfo?.method && paymentInfo.method !== 'not_paid' && (
                        <Chip
                          size="small"
                          label={
                            paymentInfo.method === 'ec_card' ? 'EC-Karte' :
                            paymentInfo.method === 'cash' ? 'Bar' :
                            paymentInfo.method === 'bank_transfer' ? 'Überweisung' :
                            'PayPal'
                          }
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </Box>
                  
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h5" color="primary" gutterBottom>
                      €{invoice.totalPrice.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Fällig: {new Date(invoice.dueDate).toLocaleDateString('de-DE')}
                    </Typography>
                    {isOverdue && (
                      <Chip 
                        size="small" 
                        color="error" 
                        label="Überfällig" 
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Box>
                </Box>
              </CardContent>
            </MotionCard>
          );
        })}
        
        {filtered.length === 0 && (
          <Alert severity="info">
            Keine Rechnungen in dieser Kategorie gefunden.
          </Alert>
        )}
      </Stack>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <IconButton onClick={() => navigate('/dashboard')}>
            <BackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Buchhaltung
          </Typography>
        </Box>
        
        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1) }}>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Offene Rechnungen
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {stats.openInvoices}
                    </Typography>
                  </Box>
                  <ScheduleIcon color="warning" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.1) }}>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Bezahlt
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {stats.paidInvoices}
                    </Typography>
                  </Box>
                  <CheckIcon color="success" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ bgcolor: alpha(theme.palette.error.main, 0.1) }}>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Überfällig
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {stats.overdueInvoices}
                    </Typography>
                  </Box>
                  <WarningIcon color="error" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Umsatz
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      €{stats.totalRevenue.toFixed(0)}
                    </Typography>
                  </Box>
                  <TrendingUpIcon color="primary" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ bgcolor: alpha(theme.palette.info.main, 0.1) }}>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Ausstehend
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      €{stats.pendingRevenue.toFixed(0)}
                    </Typography>
                  </Box>
                  <EuroIcon color="info" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Filter Bar */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              placeholder="Suche nach Kunde oder Rechnungsnummer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={(e) => setFilterAnchorEl(e.currentTarget)}
            >
              {selectedCompany === 'all' ? 'Alle Firmen' : 
               selectedCompany === 'relocato' ? 'Relocato' : 'Wertvoll'}
            </Button>
            
            <Menu
              anchorEl={filterAnchorEl}
              open={Boolean(filterAnchorEl)}
              onClose={() => setFilterAnchorEl(null)}
            >
              <MenuItem onClick={() => { setSelectedCompany('all'); setFilterAnchorEl(null); }}>
                Alle Firmen
              </MenuItem>
              <MenuItem onClick={() => { setSelectedCompany('relocato'); setFilterAnchorEl(null); }}>
                Relocato
              </MenuItem>
              <MenuItem onClick={() => { setSelectedCompany('wertvoll'); setFilterAnchorEl(null); }}>
                Wertvoll
              </MenuItem>
            </Menu>
          </Stack>
        </Paper>
      </Box>

      {/* Tabs */}
      <Paper sx={{ borderRadius: 2 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label={
              <Badge badgeContent={stats.openInvoices} color="warning">
                <Box sx={{ px: 2 }}>Offene Rechnungen</Box>
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={stats.paidInvoices} color="success">
                <Box sx={{ px: 2 }}>Bezahlte Rechnungen</Box>
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={stats.overdueInvoices} color="error">
                <Box sx={{ px: 2 }}>Überfällige Rechnungen</Box>
              </Badge>
            } 
          />
          <Tab label="Beläge" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          <TabPanel value={tabValue} index={0}>
            {renderInvoicesList('open')}
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            {renderInvoicesList('paid')}
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            {renderInvoicesList('overdue')}
          </TabPanel>
          
          <TabPanel value={tabValue} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                      <BankIcon color="primary" />
                      <Typography variant="h6">Steinpfleger Konto</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Email-basierte Rechnungserkennung für Steinpfleger-bezogene Belege
                    </Typography>
                    <Button variant="outlined" fullWidth startIcon={<EmailIcon />}>
                      Email-Import konfigurieren
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                      <BankIcon color="secondary" />
                      <Typography variant="h6">Wertvoll Konto</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Email-basierte Rechnungserkennung für Wertvoll-bezogene Belege
                    </Typography>
                    <Button variant="outlined" fullWidth startIcon={<EmailIcon />}>
                      Email-Import konfigurieren
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            <Alert severity="info" sx={{ mt: 3 }}>
              Die automatische Email-Rechnungserkennung sortiert eingehende Rechnungen nach Absender-Email 
              und prüft auf das Vorhandensein einer PDF-Rechnung im Anhang.
            </Alert>
          </TabPanel>
        </Box>
      </Paper>
    </Container>
  );
};

export default AccountingDashboard;