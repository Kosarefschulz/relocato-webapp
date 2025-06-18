import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Paper, Select, MenuItem, FormControl, InputLabel, useTheme, alpha, IconButton, Tooltip, LinearProgress, CircularProgress, Chip, Button, Divider } from '@mui/material';
import Grid from './GridCompat';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  MonetizationOn as MonetizationOnIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  AccountBalance as AccountBalanceIcon,
  LocalShipping as LocalShippingIcon,
  Star as StarIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Fullscreen as FullscreenIcon,
} from '@mui/icons-material';
import {
  Gauge,
  gaugeClasses,
} from '@mui/x-charts/Gauge';
import {
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { AnimatedCard, CountUpNumber, AnimatedProgressBar } from './MicroAnimations';
import LoadingSkeleton from './LoadingSkeleton';

interface KPIData {
  id: string;
  title: string;
  value: number;
  target?: number;
  previousValue?: number;
  format: 'currency' | 'percentage' | 'number' | 'rating';
  icon: React.ReactNode;
  color: string;
  trend: number;
  sparklineData?: number[];
  unit?: string;
  description: string;
  category: 'revenue' | 'customer' | 'operations' | 'performance';
}

interface KPIWidgetProps {
  kpi: KPIData;
  size?: 'small' | 'medium' | 'large';
  showSparkline?: boolean;
  showTarget?: boolean;
  delay?: number;
}

const KPIWidget: React.FC<KPIWidgetProps> = ({
  kpi,
  size = 'medium',
  showSparkline = true,
  showTarget = true,
  delay = 0,
}) => {
  const theme = useTheme();

  const formatValue = (value: number, format: string): string => {
    switch (format) {
      case 'currency':
        return `€${value.toLocaleString('de-DE', { maximumFractionDigits: 0 })}`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'rating':
        return `${value.toFixed(1)} / 5.0`;
      case 'number':
        return value.toLocaleString('de-DE');
      default:
        return value.toString();
    }
  };

  const getCardHeight = () => {
    switch (size) {
      case 'small': return 160;
      case 'large': return 280;
      default: return 220;
    }
  };

  const getProgressValue = () => {
    if (!kpi.target) return 0;
    return Math.min((kpi.value / kpi.target) * 100, 100);
  };

  return (
    <AnimatedCard delay={delay} sx={{ height: getCardHeight() }}>
      <Box
        sx={{
          background: `linear-gradient(135deg, ${kpi.color} 0%, ${alpha(kpi.color, 0.8)} 100%)`,
          color: 'white',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '40%',
            height: '100%',
            background: `radial-gradient(circle at center, ${alpha('#fff', 0.1)} 0%, transparent 70%)`,
          },
        }}
      >
        <CardContent sx={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ opacity: 0.9, mb: 1, fontWeight: 500 }}>
                {kpi.title}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                <Typography variant={size === 'large' ? 'h3' : 'h4'} sx={{ fontWeight: 'bold' }}>
                  <CountUpNumber from={kpi.previousValue || 0} to={kpi.value} />
                </Typography>
                {kpi.unit && (
                  <Typography variant="h6" sx={{ opacity: 0.8 }}>
                    {kpi.unit}
                  </Typography>
                )}
              </Box>

              {/* Trend Indicator */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {kpi.trend >= 0 ? (
                  <TrendingUpIcon fontSize="small" />
                ) : (
                  <TrendingDownIcon fontSize="small" />
                )}
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {kpi.trend >= 0 ? '+' : ''}{kpi.trend.toFixed(1)}%
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  vs. Vormonat
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ opacity: 0.8, ml: 2 }}>
              {kpi.icon}
            </Box>
          </Box>

          {/* Progress Bar for Target */}
          {showTarget && kpi.target && size !== 'small' && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Ziel: {formatValue(kpi.target, kpi.format)}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {getProgressValue().toFixed(0)}%
                </Typography>
              </Box>
              <AnimatedProgressBar progress={getProgressValue()} />
            </Box>
          )}

          {/* Sparkline Chart */}
          {showSparkline && kpi.sparklineData && size === 'large' && (
            <Box sx={{ flex: 1, minHeight: 60, mt: 'auto' }}>
              <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                Verlauf (30 Tage)
              </Typography>
              <ResponsiveContainer width="100%" height={60}>
                <LineChart data={kpi.sparklineData.map((value, index) => ({ value, index }))}>
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#fff" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          )}

          {/* Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
            <Tooltip title={kpi.description}>
              <IconButton size="small" sx={{ color: 'white', opacity: 0.7 }}>
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            {size === 'large' && (
              <Tooltip title="Vergrößern">
                <IconButton size="small" sx={{ color: 'white', opacity: 0.7 }}>
                  <FullscreenIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </CardContent>
      </Box>
    </AnimatedCard>
  );
};

interface KPIWidgetsProps {
  category?: 'all' | 'revenue' | 'customer' | 'operations' | 'performance';
  timeRange?: '7days' | '30days' | '3months';
  layout?: 'grid' | 'list';
}

const KPIWidgets: React.FC<KPIWidgetsProps> = ({
  category = 'all',
  timeRange = '30days',
  layout = 'grid',
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPIData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(category);

  useEffect(() => {
    loadKPIData();
  }, [selectedCategory, timeRange]);

  const loadKPIData = async () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockKPIs: KPIData[] = [
        // Revenue KPIs
        {
          id: 'total-revenue',
          title: 'Gesamtumsatz',
          value: 847250,
          target: 800000,
          previousValue: 789300,
          format: 'currency',
          icon: <MonetizationOnIcon sx={{ fontSize: 40 }} />,
          color: theme.palette.success.main,
          trend: 12.5,
          sparklineData: Array.from({ length: 30 }, (_, i) => 25000 + Math.random() * 15000 + i * 500),
          description: 'Gesamtumsatz in den letzten 30 Tagen',
          category: 'revenue',
        },
        {
          id: 'monthly-recurring',
          title: 'Monatlich wiederkehrend',
          value: 186420,
          target: 200000,
          previousValue: 172800,
          format: 'currency',
          icon: <TimelineIcon sx={{ fontSize: 40 }} />,
          color: theme.palette.primary.main,
          trend: 7.9,
          sparklineData: Array.from({ length: 30 }, (_, i) => 5500 + Math.random() * 2000 + i * 50),
          description: 'Wiederkehrende Umsätze von Stammkunden',
          category: 'revenue',
        },
        {
          id: 'avg-order-value',
          title: 'Ø Auftragswert',
          value: 1847,
          target: 1900,
          previousValue: 1695,
          format: 'currency',
          icon: <AccountBalanceIcon sx={{ fontSize: 40 }} />,
          color: theme.palette.info.main,
          trend: 8.9,
          sparklineData: Array.from({ length: 30 }, (_, i) => 1600 + Math.random() * 400 + i * 8),
          description: 'Durchschnittlicher Wert pro Auftrag',
          category: 'revenue',
        },

        // Customer KPIs
        {
          id: 'total-customers',
          title: 'Aktive Kunden',
          value: 1284,
          target: 1500,
          previousValue: 1156,
          format: 'number',
          icon: <PeopleIcon sx={{ fontSize: 40 }} />,
          color: theme.palette.secondary.main,
          trend: 11.1,
          sparklineData: Array.from({ length: 30 }, (_, i) => 1000 + i * 10 + Math.random() * 50),
          description: 'Anzahl aktiver Kunden im System',
          category: 'customer',
        },
        {
          id: 'customer-satisfaction',
          title: 'Kundenzufriedenheit',
          value: 4.7,
          target: 4.8,
          previousValue: 4.5,
          format: 'rating',
          icon: <StarIcon sx={{ fontSize: 40 }} />,
          color: theme.palette.warning.main,
          trend: 4.4,
          sparklineData: Array.from({ length: 30 }, (_, i) => 4.2 + Math.random() * 0.6),
          description: 'Durchschnittliche Bewertung unserer Kunden',
          category: 'customer',
        },
        {
          id: 'new-customers',
          title: 'Neukunden',
          value: 89,
          target: 100,
          previousValue: 67,
          format: 'number',
          icon: <PeopleIcon sx={{ fontSize: 40 }} />,
          color: theme.palette.info.main,
          trend: 32.8,
          sparklineData: Array.from({ length: 30 }, (_, i) => 2 + Math.random() * 4),
          description: 'Neue Kunden in diesem Monat',
          category: 'customer',
        },

        // Operations KPIs
        {
          id: 'completed-moves',
          title: 'Abgeschlossene Umzüge',
          value: 456,
          target: 500,
          previousValue: 423,
          format: 'number',
          icon: <LocalShippingIcon sx={{ fontSize: 40 }} />,
          color: theme.palette.success.main,
          trend: 7.8,
          sparklineData: Array.from({ length: 30 }, (_, i) => 12 + Math.random() * 8),
          description: 'Erfolgreich abgeschlossene Umzüge',
          category: 'operations',
        },
        {
          id: 'fleet-utilization',
          title: 'Fahrzeugauslastung',
          value: 87.3,
          target: 90,
          previousValue: 82.1,
          format: 'percentage',
          icon: <LocalShippingIcon sx={{ fontSize: 40 }} />,
          color: theme.palette.warning.main,
          trend: 6.3,
          sparklineData: Array.from({ length: 30 }, (_, i) => 75 + Math.random() * 20),
          description: 'Durchschnittliche Auslastung der Fahrzeugflotte',
          category: 'operations',
        },

        // Performance KPIs
        {
          id: 'conversion-rate',
          title: 'Conversion Rate',
          value: 68.5,
          target: 70,
          previousValue: 64.2,
          format: 'percentage',
          icon: <SpeedIcon sx={{ fontSize: 40 }} />,
          color: theme.palette.primary.main,
          trend: 6.7,
          sparklineData: Array.from({ length: 30 }, (_, i) => 60 + Math.random() * 15),
          description: 'Angebote zu Aufträge Konversionsrate',
          category: 'performance',
        },
        {
          id: 'quote-response-time',
          title: 'Ø Antwortzeit',
          value: 2.4,
          target: 2.0,
          previousValue: 3.1,
          format: 'number',
          unit: 'Std',
          icon: <SpeedIcon sx={{ fontSize: 40 }} />,
          color: theme.palette.info.main,
          trend: -22.6,
          sparklineData: Array.from({ length: 30 }, (_, i) => 1.5 + Math.random() * 2),
          description: 'Durchschnittliche Zeit bis zur Angebotserstellung',
          category: 'performance',
        },
      ];

      const filteredKPIs = selectedCategory === 'all' 
        ? mockKPIs 
        : mockKPIs.filter(kpi => kpi.category === selectedCategory);

      setKpis(filteredKPIs);
      setLoading(false);
    }, 1000);
  };

  if (loading) {
    return <LoadingSkeleton variant="stats" rows={8} />;
  }

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'revenue': return 'Umsatz';
      case 'customer': return 'Kunden';
      case 'operations': return 'Betrieb';
      case 'performance': return 'Performance';
      default: return 'Alle';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            KPI Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Wichtige Geschäftskennzahlen im Überblick
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Kategorie</InputLabel>
            <Select
              value={selectedCategory}
              label="Kategorie"
              onChange={(e) => setSelectedCategory(e.target.value as any)}
            >
              <MenuItem value="all">Alle</MenuItem>
              <MenuItem value="revenue">Umsatz</MenuItem>
              <MenuItem value="customer">Kunden</MenuItem>
              <MenuItem value="operations">Betrieb</MenuItem>
              <MenuItem value="performance">Performance</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Zeitraum</InputLabel>
            <Select
              value={timeRange}
              label="Zeitraum"
              onChange={(e) => console.log('Time range changed:', e.target.value)}
            >
              <MenuItem value="7days">7 Tage</MenuItem>
              <MenuItem value="30days">30 Tage</MenuItem>
              <MenuItem value="3months">3 Monate</MenuItem>
            </Select>
          </FormControl>
          
          <Tooltip title="Aktualisieren">
            <IconButton onClick={loadKPIData}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Category Badge */}
      {selectedCategory !== 'all' && (
        <Box sx={{ mb: 3 }}>
          <Chip 
            label={`Kategorie: ${getCategoryLabel(selectedCategory)}`}
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        </Box>
      )}

      {/* KPI Widgets Grid */}
      <Grid container spacing={3}>
        {kpis.map((kpi, index) => {
          // Determine widget size based on importance and available space
          const getWidgetSize = (kpiId: string, index: number) => {
            if (['total-revenue', 'customer-satisfaction'].includes(kpiId)) return 'large';
            if (index % 7 === 0) return 'large'; // Make every 7th widget large for variety
            return 'medium';
          };

          const getGridSize = (size: string) => {
            switch (size) {
              case 'large': return { xs: 12, sm: 6, md: 6, lg: 4 };
              case 'small': return { xs: 6, sm: 4, md: 3, lg: 2.4 };
              default: return { xs: 12, sm: 6, md: 4, lg: 3 };
            }
          };

          const widgetSize = getWidgetSize(kpi.id, index);
          const gridSize = getGridSize(widgetSize);

          return (
            <Grid item {...gridSize} key={kpi.id}>
              <KPIWidget
                kpi={kpi}
                size={widgetSize as any}
                showSparkline={widgetSize === 'large'}
                showTarget={true}
                delay={index * 100}
              />
            </Grid>
          );
        })}
      </Grid>

      {/* Summary Stats */}
      <Paper elevation={2} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          KPI Zusammenfassung
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="success.main" sx={{ fontWeight: 'bold', mb: 1 }}>
                {kpis.filter(kpi => kpi.trend >= 0).length}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                KPIs mit positivem Trend
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary.main" sx={{ fontWeight: 'bold', mb: 1 }}>
                {kpis.filter(kpi => kpi.target && kpi.value >= kpi.target).length}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Ziele erreicht
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="info.main" sx={{ fontWeight: 'bold', mb: 1 }}>
                {(kpis.reduce((sum, kpi) => sum + kpi.trend, 0) / kpis.length).toFixed(1)}%
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Ø Wachstum
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default KPIWidgets;