import React, { useState } from 'react';
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
  Chip,
  Divider,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Language as LanguageIcon,
  Check as CheckIcon,
  Info as InfoIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useI18n } from '../i18n/i18nContext';
import LanguageSelector, { AdvancedLanguageSelector } from './LanguageSelector';
import { AnimatedCard, SlideInContainer } from './MicroAnimations';
import { CustomIcons } from './CustomIcons';

const MultiLanguageDemo: React.FC = () => {
  const theme = useTheme();
  const { t, language, formatCurrency, formatDate, formatDateTime, formatRelativeTime } = useI18n();
  const [selectedService, setSelectedService] = useState('standardMove');

  // Sample data for demonstration
  const sampleQuote = {
    id: 'QT-2024-001',
    customer: 'Max Mustermann',
    price: 1250,
    date: new Date('2024-01-15'),
    status: 'accepted' as const,
    services: ['standardMove', 'packingService'],
  };

  const sampleDates = [
    new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 1 week ago
  ];

  const services = [
    { id: 'standardMove', icon: CustomIcons.Furniture },
    { id: 'packingService', icon: CustomIcons.BoxPacking },
    { id: 'cleaningService', icon: CustomIcons.Cleaning },
    { id: 'pianoTransport', icon: CustomIcons.Piano },
    { id: 'storage', icon: CustomIcons.Storage },
    { id: 'officeMove', icon: CustomIcons.Office },
  ];

  const kpiData = [
    { key: 'totalRevenue', value: 847250, isPrice: true },
    { key: 'totalQuotes', value: 1284, isPrice: false },
    { key: 'totalCustomers', value: 342, isPrice: false },
    { key: 'conversionRate', value: 68.5, isPercentage: true },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <SlideInContainer>
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
            {t('nav.language')} Support Demo
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Comprehensive multi-language support for German and English
          </Typography>
          
          {/* Current Language Indicator */}
          <Chip
            icon={<LanguageIcon />}
            label={`${t('settings.language')}: ${language === 'de' ? '🇩🇪 Deutsch' : '🇺🇸 English'}`}
            color="primary"
            variant="outlined"
            sx={{ fontSize: '1rem', py: 2, px: 1 }}
          />
        </Box>
      </SlideInContainer>

      {/* Language Selector Variants */}
      <SlideInContainer delay={200}>
        <Paper elevation={2} sx={{ p: 4, mb: 6 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>
            Language Selector Variants
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Card elevation={1}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Button Variant
                  </Typography>
                  <LanguageSelector variant="button" showLabel={true} showFlag={true} />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card elevation={1}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Toggle Variant
                  </Typography>
                  <LanguageSelector variant="toggle" showLabel={true} showFlag={true} />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card elevation={1}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Chip Variant
                  </Typography>
                  <LanguageSelector variant="chip" showLabel={true} showFlag={true} />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card elevation={1}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Menu Variant
                  </Typography>
                  <LanguageSelector variant="menu" showLabel={true} showFlag={true} />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card elevation={1}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Compact Variant
                  </Typography>
                  <LanguageSelector variant="compact" />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card elevation={1}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Advanced Selector
                  </Typography>
                  <AdvancedLanguageSelector 
                    showBrowserDetection={true}
                    showKeyboardShortcuts={true}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      </SlideInContainer>

      {/* Translated Content Examples */}
      <SlideInContainer delay={400}>
        <Paper elevation={2} sx={{ p: 4, mb: 6 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>
            {t('dashboard.title')} Content
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {kpiData.map((kpi, index) => (
              <Grid item xs={6} md={3} key={kpi.key}>
                <AnimatedCard delay={index * 100}>
                  <Box
                    sx={{
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.main, 0.8)} 100%)`,
                      color: 'white',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <CardContent>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {kpi.isPrice ? formatCurrency(kpi.value) : 
                         kpi.isPercentage ? `${kpi.value}%` : 
                         kpi.value.toLocaleString(language === 'de' ? 'de-DE' : 'en-US')}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {t(`dashboard.${kpi.key}` as any)}
                      </Typography>
                    </CardContent>
                  </Box>
                </AnimatedCard>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </SlideInContainer>

      {/* Services Translation */}
      <SlideInContainer delay={600}>
        <Paper elevation={2} sx={{ p: 4, mb: 6 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>
            {t('company.services')}
          </Typography>
          
          <Grid container spacing={3}>
            {services.map((service, index) => (
              <Grid item xs={12} sm={6} md={4} key={service.id}>
                <AnimatedCard delay={index * 100}>
                  <Card 
                    elevation={selectedService === service.id ? 8 : 2}
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: selectedService === service.id ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[8],
                      },
                    }}
                    onClick={() => setSelectedService(service.id)}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <Box sx={{ mb: 2 }}>
                        <service.icon sx={{ fontSize: 48, color: 'primary.main' }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {t(`services.${service.id}` as any)}
                      </Typography>
                      {selectedService === service.id && (
                        <CheckIcon color="primary" sx={{ mt: 1 }} />
                      )}
                    </CardContent>
                  </Card>
                </AnimatedCard>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </SlideInContainer>

      {/* Form Elements */}
      <SlideInContainer delay={800}>
        <Paper elevation={2} sx={{ p: 4, mb: 6 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>
            {t('quotes.create')}
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('customers.firstName')}
                placeholder={t('customers.firstName')}
                defaultValue="Max"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('customers.lastName')}
                placeholder={t('customers.lastName')}
                defaultValue="Mustermann"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('customers.email')}
                placeholder={t('customers.email')}
                defaultValue="max.mustermann@example.com"
                type="email"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('customers.phone')}
                placeholder={t('customers.phone')}
                defaultValue="+49 30 12345678"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>{t('quotes.services')}</InputLabel>
                <Select
                  value={selectedService}
                  label={t('quotes.services')}
                  onChange={(e) => setSelectedService(e.target.value)}
                >
                  {services.map((service) => (
                    <MenuItem key={service.id} value={service.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <service.icon sx={{ fontSize: 20 }} />
                        {t(`services.${service.id}` as any)}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined">
                  {t('common.cancel')}
                </Button>
                <Button variant="contained">
                  {t('common.save')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </SlideInContainer>

      {/* Data Table with Translations */}
      <SlideInContainer delay={1000}>
        <Paper elevation={2} sx={{ p: 4, mb: 6 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>
            {t('quotes.list')}
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                  <TableCell sx={{ fontWeight: 600 }}>{t('quotes.id')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('quotes.customer')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('quotes.price')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('quotes.date')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('quotes.status')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                    {sampleQuote.id}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'medium' }}>
                    {sampleQuote.customer}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    {formatCurrency(sampleQuote.price)}
                  </TableCell>
                  <TableCell>
                    {formatDate(sampleQuote.date)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={<CustomIcons.QuoteStatus status={sampleQuote.status} sx={{ fontSize: 16 }} />}
                      label={t(`quotes.${sampleQuote.status}`)}
                      color="success"
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </SlideInContainer>

      {/* Date & Time Formatting */}
      <SlideInContainer delay={1200}>
        <Paper elevation={2} sx={{ p: 4, mb: 6 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>
            Date & Time Formatting
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card elevation={1}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Absolute Dates
                  </Typography>
                  {sampleDates.map((date, index) => (
                    <Box key={index} sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(date)}
                      </Typography>
                      <Typography variant="body2">
                        {formatDateTime(date)}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card elevation={1}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Relative Times
                  </Typography>
                  {sampleDates.map((date, index) => (
                    <Box key={index} sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        {formatRelativeTime(date)}
                      </Typography>
                      <Typography variant="body2">
                        {formatDateTime(date)}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      </SlideInContainer>

      {/* Features Overview */}
      <SlideInContainer delay={1400}>
        <Paper elevation={2} sx={{ p: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>
            Multi-Language Features
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Alert 
                severity="info" 
                icon={<InfoIcon />}
                sx={{ height: '100%' }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Automatic Detection
                </Typography>
                <Typography variant="body2">
                  Browser language detection with fallback to user preference
                </Typography>
              </Alert>
            </Grid>

            <Grid item xs={12} md={4}>
              <Alert 
                severity="success" 
                icon={<CheckIcon />}
                sx={{ height: '100%' }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Complete Translation
                </Typography>
                <Typography variant="body2">
                  200+ translation keys covering all UI elements and business terms
                </Typography>
              </Alert>
            </Grid>

            <Grid item xs={12} md={4}>
              <Alert 
                severity="warning" 
                icon={<StarIcon />}
                sx={{ height: '100%' }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Locale Formatting
                </Typography>
                <Typography variant="body2">
                  Currency, dates, and numbers formatted according to locale standards
                </Typography>
              </Alert>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Keyboard Shortcuts
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Chip 
                label="Ctrl + Shift + D → Deutsch" 
                variant="outlined"
                size="small"
              />
              <Chip 
                label="Ctrl + Shift + E → English" 
                variant="outlined"
                size="small"
              />
            </Box>
          </Box>
        </Paper>
      </SlideInContainer>
    </Box>
  );
};

export default MultiLanguageDemo;