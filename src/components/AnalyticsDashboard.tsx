import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  Description as QuoteIcon,
  Receipt as InvoiceIcon,
  Email as EmailIcon,
  PhotoLibrary as PhotoIcon,
  Euro as EuroIcon,
  CalendarToday as CalendarIcon,
  Refresh as RefreshIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface AnalyticsData {
  customers: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  quotes: {
    total: number;
    sent: number;
    accepted: number;
    rejected: number;
    conversionRate: number;
    totalValue: number;
  };
  invoices: {
    total: number;
    paid: number;
    pending: number;
    totalRevenue: number;
    averageValue: number;
  };
  emails: {
    sent: number;
    byType: { [key: string]: number };
  };
  photos: {
    total: number;
    byCustomer: number;
    averagePerCustomer: number;
  };
}

const AnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('thisMonth');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Simuliere Datenladung - In Produktion würde dies von einem Backend/Firebase kommen
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Berechne Daten aus localStorage
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      const quotes = JSON.parse(localStorage.getItem('quotes') || '[]');
      const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
      const photos = JSON.parse(localStorage.getItem('customerPhotos') || '[]');
      
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Kunden-Statistiken
      const customersThisMonth = customers.filter((c: any) => 
        new Date(c.createdAt) >= thisMonthStart
      ).length;
      const customersLastMonth = customers.filter((c: any) => 
        new Date(c.createdAt) >= lastMonthStart && new Date(c.createdAt) <= lastMonthEnd
      ).length;

      // Angebots-Statistiken
      const acceptedQuotes = quotes.filter((q: any) => q.status === 'accepted');
      const totalQuoteValue = quotes.reduce((sum: number, q: any) => sum + (q.price || 0), 0);
      const conversionRate = quotes.length > 0 ? (acceptedQuotes.length / quotes.length) * 100 : 0;

      // Rechnungs-Statistiken
      const paidInvoices = invoices.filter((i: any) => i.status === 'paid');
      const totalRevenue = paidInvoices.reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
      const averageInvoiceValue = invoices.length > 0 ? totalRevenue / paidInvoices.length : 0;

      // Foto-Statistiken
      const photosByCustomer = photos.reduce((acc: any, photo: any) => {
        acc[photo.customerId] = (acc[photo.customerId] || 0) + 1;
        return acc;
      }, {});
      const customersWithPhotos = Object.keys(photosByCustomer).length;
      const avgPhotosPerCustomer = customersWithPhotos > 0 ? photos.length / customersWithPhotos : 0;

      setData({
        customers: {
          total: customers.length,
          thisMonth: customersThisMonth,
          lastMonth: customersLastMonth,
          growth: customersLastMonth > 0 ? ((customersThisMonth - customersLastMonth) / customersLastMonth) * 100 : 0
        },
        quotes: {
          total: quotes.length,
          sent: quotes.filter((q: any) => q.status === 'sent').length,
          accepted: acceptedQuotes.length,
          rejected: quotes.filter((q: any) => q.status === 'rejected').length,
          conversionRate,
          totalValue: totalQuoteValue
        },
        invoices: {
          total: invoices.length,
          paid: paidInvoices.length,
          pending: invoices.filter((i: any) => i.status === 'pending').length,
          totalRevenue,
          averageValue: averageInvoiceValue
        },
        emails: {
          sent: quotes.filter((q: any) => q.status === 'sent').length * 2, // Annahme: 2 E-Mails pro Angebot
          byType: {
            'Angebote': quotes.filter((q: any) => q.status === 'sent').length,
            'Rechnungen': invoices.filter((i: any) => i.status === 'sent').length,
            'Erinnerungen': Math.floor(invoices.length * 0.3) // Simulation
          }
        },
        photos: {
          total: photos.length,
          byCustomer: customersWithPhotos,
          averagePerCustomer: avgPhotosPerCustomer
        }
      });
    } catch (error) {
      console.error('Fehler beim Laden der Analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const MetricCard: React.FC<{
    title: string;
    value: number | string;
    subtitle?: string;
    icon: React.ReactNode;
    trend?: number;
    color?: string;
    format?: 'number' | 'currency' | 'percent';
  }> = ({ title, value, subtitle, icon, trend, color, format = 'number' }) => {
    const formatValue = () => {
      switch (format) {
        case 'currency':
          return `€${typeof value === 'number' ? value.toLocaleString('de-DE', { minimumFractionDigits: 2 }) : value}`;
        case 'percent':
          return `${typeof value === 'number' ? value.toFixed(1) : value}%`;
        default:
          return value.toLocaleString('de-DE');
      }
    };

    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ 
              p: 1.5, 
              borderRadius: 2, 
              bgcolor: color ? `${color}.50` : 'primary.50',
              color: color || 'primary.main'
            }}>
              {icon}
            </Box>
            {trend !== undefined && (
              <Chip
                size="small"
                icon={trend >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                label={`${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`}
                color={trend >= 0 ? 'success' : 'error'}
                variant="outlined"
              />
            )}
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            {formatValue()}
          </Typography>
          <Typography variant="subtitle1" color="text.primary" sx={{ fontWeight: 500 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading || !data) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AnalyticsIcon fontSize="large" />
            Analytics Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Überblick über Ihre Geschäftskennzahlen
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Zeitraum</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Zeitraum"
            >
              <MenuItem value="today">Heute</MenuItem>
              <MenuItem value="thisWeek">Diese Woche</MenuItem>
              <MenuItem value="thisMonth">Dieser Monat</MenuItem>
              <MenuItem value="thisYear">Dieses Jahr</MenuItem>
              <MenuItem value="all">Gesamt</MenuItem>
            </Select>
          </FormControl>
          
          <Tooltip title="Daten aktualisieren">
            <IconButton onClick={loadAnalyticsData}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Hauptmetriken */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <MetricCard
              title="Kunden gesamt"
              value={data.customers.total}
              subtitle={`${data.customers.thisMonth} diesen Monat`}
              icon={<PeopleIcon />}
              trend={data.customers.growth}
              color="primary"
            />
          </motion.div>
        </Grid>

        <Grid item xs={12} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <MetricCard
              title="Umsatz"
              value={data.invoices.totalRevenue}
              subtitle={`Ø ${data.invoices.averageValue.toFixed(0)}€ pro Rechnung`}
              icon={<EuroIcon />}
              format="currency"
              color="success"
            />
          </motion.div>
        </Grid>

        <Grid item xs={12} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <MetricCard
              title="Conversion Rate"
              value={data.quotes.conversionRate}
              subtitle={`${data.quotes.accepted} von ${data.quotes.total} Angeboten`}
              icon={<QuoteIcon />}
              format="percent"
              color="warning"
            />
          </motion.div>
        </Grid>

        <Grid item xs={12} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <MetricCard
              title="E-Mails versendet"
              value={data.emails.sent}
              subtitle="Alle Typen"
              icon={<EmailIcon />}
              color="info"
            />
          </motion.div>
        </Grid>
      </Grid>

      {/* Detaillierte Statistiken */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Angebote */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Angebots-Statistik
            </Typography>
            <Box sx={{ mt: 2 }}>
              {[
                { label: 'Entwurf', value: data.quotes.total - data.quotes.sent - data.quotes.accepted - data.quotes.rejected, color: 'default' },
                { label: 'Versendet', value: data.quotes.sent, color: 'warning' },
                { label: 'Angenommen', value: data.quotes.accepted, color: 'success' },
                { label: 'Abgelehnt', value: data.quotes.rejected, color: 'error' }
              ].map((item) => (
                <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label={item.label} size="small" color={item.color as any} />
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {item.value}
                  </Typography>
                </Box>
              ))}
            </Box>
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary">
                Gesamtwert: <strong>€{data.quotes.totalValue.toLocaleString('de-DE')}</strong>
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Fotos */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Foto-Statistik
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <PhotoIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h4">{data.photos.total}</Typography>
                  <Typography variant="body2" color="text.secondary">Fotos gesamt</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <PeopleIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                  <Typography variant="h4">{data.photos.byCustomer}</Typography>
                  <Typography variant="body2" color="text.secondary">Kunden mit Fotos</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <CalendarIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                  <Typography variant="h4">{data.photos.averagePerCustomer.toFixed(1)}</Typography>
                  <Typography variant="body2" color="text.secondary">Ø pro Kunde</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Hinweis:</strong> Die Analytics-Daten werden in Echtzeit aus Ihrer lokalen Datenbank berechnet. 
          Für erweiterte Analytics-Funktionen können Sie Google Analytics 4 in der index.html konfigurieren.
        </Typography>
      </Alert>
    </Box>
  );
};

export default AnalyticsDashboard;