import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
  alpha,
  IconButton,
  Tooltip,
  Chip,
  LinearProgress,
  Button,
  ButtonGroup,
  Divider,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  MonetizationOn as MonetizationOnIcon,
  Assessment as AssessmentIcon,
  CalendarToday as CalendarTodayIcon,
  CompareArrows as CompareArrowsIcon,
  Timeline as TimelineIcon,
  AccountBalance as AccountBalanceIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { AnimatedCard, SlideInContainer } from './MicroAnimations';
import LoadingSkeleton from './LoadingSkeleton';

interface RevenueData {
  period: string;
  revenue: number;
  target: number;
  growth: number;
  quotes: number;
  conversions: number;
  avgOrderValue: number;
  recurring: number;
  newCustomers: number;
}

interface KPIMetric {
  id: string;
  label: string;
  value: number;
  target?: number;
  format: 'currency' | 'percentage' | 'number';
  trend: number;
  color: string;
  icon: React.ReactNode;
  description: string;
}

interface RevenueTrackingProps {
  timeRange?: '7days' | '30days' | '3months' | '6months' | '12months' | '24months';
  comparisonMode?: boolean;
}

const RevenueTracking: React.FC<RevenueTrackingProps> = ({
  timeRange = '12months',
  comparisonMode = false,
}) => {
  const theme = useTheme();
  const [selectedRange, setSelectedRange] = useState(timeRange);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'comparison'>('overview');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RevenueData[]>([]);
  const [comparisonData, setComparisonData] = useState<RevenueData[]>([]);

  useEffect(() => {
    loadRevenueData();
  }, [selectedRange, viewMode]);

  const loadRevenueData = async () => {
    setLoading(true);
    
    // Simulate API call with realistic moving company data
    setTimeout(() => {
      const mockData = generateMockData(selectedRange);
      setData(mockData.current);
      setComparisonData(mockData.previous);
      setLoading(false);
    }, 1200);
  };

  const generateMockData = (range: string) => {
    const periods = {
      '7days': 7,
      '30days': 30,
      '3months': 12,
      '6months': 26,
      '12months': 52,
      '24months': 104,
    };

    const periodCount = periods[range as keyof typeof periods];
    const isWeekly = range.includes('days') || range === '3months' || range === '6months' || range === '12months' || range === '24months';
    
    const current: RevenueData[] = [];
    const previous: RevenueData[] = [];

    for (let i = 0; i < periodCount; i++) {
      const baseRevenue = 75000 + Math.random() * 50000;
      const seasonality = 1 + 0.3 * Math.sin((i / periodCount) * 2 * Math.PI);
      const trend = 1 + (i / periodCount) * 0.2;
      
      const revenue = baseRevenue * seasonality * trend;
      const target = revenue * (0.9 + Math.random() * 0.2);
      const quotes = Math.floor(40 + Math.random() * 30);
      const conversions = Math.floor(quotes * (0.6 + Math.random() * 0.3));
      
      current.push({
        period: isWeekly ? `KW ${i + 1}` : `Monat ${i + 1}`,
        revenue: Math.round(revenue),
        target: Math.round(target),
        growth: -10 + Math.random() * 30,
        quotes,
        conversions,
        avgOrderValue: Math.round(revenue / conversions),
        recurring: Math.round(revenue * (0.2 + Math.random() * 0.3)),
        newCustomers: Math.floor(conversions * (0.4 + Math.random() * 0.4)),
      });

      // Previous period data (for comparison)
      const prevRevenue = baseRevenue * seasonality * (trend * 0.85);
      previous.push({
        period: isWeekly ? `KW ${i + 1}` : `Monat ${i + 1}`,
        revenue: Math.round(prevRevenue),
        target: Math.round(prevRevenue * 0.95),
        growth: -15 + Math.random() * 25,
        quotes: Math.floor(35 + Math.random() * 25),
        conversions: Math.floor(quotes * (0.55 + Math.random() * 0.25)),
        avgOrderValue: Math.round(prevRevenue / conversions),
        recurring: Math.round(prevRevenue * (0.15 + Math.random() * 0.25)),
        newCustomers: Math.floor(conversions * (0.5 + Math.random() * 0.3)),
      });
    }

    return { current, previous };
  };

  const kpiMetrics: KPIMetric[] = useMemo(() => {
    if (!data.length) return [];

    const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
    const totalTarget = data.reduce((sum, item) => sum + item.target, 0);
    const totalQuotes = data.reduce((sum, item) => sum + item.quotes, 0);
    const totalConversions = data.reduce((sum, item) => sum + item.conversions, 0);
    const totalRecurring = data.reduce((sum, item) => sum + item.recurring, 0);
    const avgOrderValue = totalRevenue / totalConversions;
    const conversionRate = (totalConversions / totalQuotes) * 100;
    const recurringRate = (totalRecurring / totalRevenue) * 100;

    const targetAchievement = (totalRevenue / totalTarget) * 100;
    const revenueGrowth = data.length > 1 ? 
      ((data[data.length - 1].revenue - data[0].revenue) / data[0].revenue) * 100 : 0;

    return [
      {
        id: 'revenue',
        label: 'Gesamtumsatz',
        value: totalRevenue,
        target: totalTarget,
        format: 'currency',
        trend: revenueGrowth,
        color: theme.palette.success.main,
        icon: <MonetizationOnIcon sx={{ fontSize: 40 }} />,
        description: `Umsatz für ${selectedRange}`,
      },
      {
        id: 'target',
        label: 'Zielerreichung',
        value: targetAchievement,
        format: 'percentage',
        trend: targetAchievement - 100,
        color: targetAchievement >= 100 ? theme.palette.success.main : theme.palette.warning.main,
        icon: <AssessmentIcon sx={{ fontSize: 40 }} />,
        description: 'Zielerreichung vs. geplanter Umsatz',
      },
      {
        id: 'conversion',
        label: 'Conversion Rate',
        value: conversionRate,
        format: 'percentage',
        trend: 5.2,
        color: theme.palette.primary.main,
        icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
        description: 'Angebote zu Aufträge Verhältnis',
      },
      {
        id: 'aov',
        label: 'Ø Auftragswert',
        value: avgOrderValue,
        format: 'currency',
        trend: 8.7,
        color: theme.palette.info.main,
        icon: <AccountBalanceIcon sx={{ fontSize: 40 }} />,
        description: 'Durchschnittlicher Wert pro Auftrag',
      },
      {
        id: 'recurring',
        label: 'Stammkunden-Anteil',
        value: recurringRate,
        format: 'percentage',
        trend: 12.3,
        color: theme.palette.secondary.main,
        icon: <TimelineIcon sx={{ fontSize: 40 }} />,
        description: 'Umsatzanteil von Stammkunden',
      },
    ];
  }, [data, selectedRange, theme]);

  const formatValue = (value: number, format: 'currency' | 'percentage' | 'number'): string => {
    switch (format) {
      case 'currency':
        return `€${value.toLocaleString('de-DE', { maximumFractionDigits: 0 })}`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'number':
        return value.toLocaleString('de-DE');
      default:
        return value.toString();
    }
  };

  const KPICard: React.FC<{ metric: KPIMetric; delay: number }> = ({ metric, delay }) => (
    <AnimatedCard delay={delay}>
      <Box
        sx={{
          background: `linear-gradient(135deg, ${metric.color} 0%, ${alpha(metric.color, 0.8)} 100%)`,
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '50%',
            height: '100%',
            background: `radial-gradient(circle at center, ${alpha('#fff', 0.1)} 0%, transparent 70%)`,
          },
        }}
      >
        <CardContent sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ opacity: 0.9, mb: 1, fontWeight: 500 }}>
                {metric.label}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {formatValue(metric.value, metric.format)}
              </Typography>
              
              {metric.target && metric.format === 'currency' && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.5 }}>
                    Ziel: {formatValue(metric.target, metric.format)}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((metric.value / metric.target) * 100, 100)}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: alpha('#fff', 0.3),
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#fff',
                        borderRadius: 3,
                      },
                    }}
                  />
                </Box>
              )}
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {metric.trend >= 0 ? (
                  <TrendingUpIcon fontSize="small" />
                ) : (
                  <TrendingDownIcon fontSize="small" />
                )}
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {metric.trend >= 0 ? '+' : ''}{metric.trend.toFixed(1)}%
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  vs. Vorperiode
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ opacity: 0.8, ml: 2 }}>
              {metric.icon}
            </Box>
          </Box>
          
          <Tooltip title={metric.description}>
            <IconButton size="small" sx={{ color: 'white', opacity: 0.7 }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </CardContent>
      </Box>
    </AnimatedCard>
  );

  if (loading) {
    return <LoadingSkeleton variant="dashboard" />;
  }

  return (
    <Box>
      {/* Header */}
      <SlideInContainer direction="down">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              Revenue Tracking
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Detaillierte Umsatzanalyse und Geschäftskennzahlen
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <ButtonGroup size="small" variant="outlined">
              <Button
                onClick={() => setViewMode('overview')}
                variant={viewMode === 'overview' ? 'contained' : 'outlined'}
              >
                Übersicht
              </Button>
              <Button
                onClick={() => setViewMode('detailed')}
                variant={viewMode === 'detailed' ? 'contained' : 'outlined'}
              >
                Detailliert
              </Button>
              <Button
                onClick={() => setViewMode('comparison')}
                variant={viewMode === 'comparison' ? 'contained' : 'outlined'}
              >
                Vergleich
              </Button>
            </ButtonGroup>
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Zeitraum</InputLabel>
              <Select
                value={selectedRange}
                label="Zeitraum"
                onChange={(e) => setSelectedRange(e.target.value as any)}
              >
                <MenuItem value="7days">Letzte 7 Tage</MenuItem>
                <MenuItem value="30days">Letzte 30 Tage</MenuItem>
                <MenuItem value="3months">Letzte 3 Monate</MenuItem>
                <MenuItem value="6months">Letzte 6 Monate</MenuItem>
                <MenuItem value="12months">Letzte 12 Monate</MenuItem>
                <MenuItem value="24months">Letzte 24 Monate</MenuItem>
              </Select>
            </FormControl>
            
            <Tooltip title="Daten aktualisieren">
              <IconButton onClick={loadRevenueData}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </SlideInContainer>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {kpiMetrics.map((metric, index) => (
          <Grid item xs={12} sm={6} lg={2.4} key={metric.id}>
            <KPICard metric={metric} delay={index * 100} />
          </Grid>
        ))}
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Revenue Trend */}
        <Grid item xs={12} lg={8}>
          <SlideInContainer delay={200}>
            <Paper elevation={2} sx={{ p: 3, height: 450 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Umsatzentwicklung
                  {viewMode === 'comparison' && (
                    <Chip label="Vergleichsmodus" size="small" sx={{ ml: 2 }} />
                  )}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    icon={<CalendarTodayIcon />}
                    label={selectedRange}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Box>
              
              <ResponsiveContainer width="100%" height={360}>
                {viewMode === 'comparison' ? (
                  <ComposedChart data={data}>
                    <defs>
                      <linearGradient id="currentGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="previousGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.grey[500]} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={theme.palette.grey[500]} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                    <XAxis dataKey="period" stroke={theme.palette.text.secondary} fontSize={12} />
                    <YAxis stroke={theme.palette.text.secondary} fontSize={12} 
                           tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`} />
                    <RechartsTooltip
                      formatter={(value: number, name) => [
                        `€${value.toLocaleString('de-DE')}`,
                        name === 'revenue' ? 'Aktuell' : name === 'target' ? 'Ziel' : 'Vorperiode'
                      ]}
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 8,
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke={theme.palette.primary.main}
                      strokeWidth={3}
                      fill="url(#currentGradient)"
                      name="Aktuell"
                    />
                    <Line
                      type="monotone"
                      dataKey="target"
                      stroke={theme.palette.warning.main}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Ziel"
                    />
                    <Bar
                      dataKey="conversions"
                      fill={alpha(theme.palette.success.main, 0.6)}
                      name="Aufträge"
                      yAxisId="right"
                    />
                  </ComposedChart>
                ) : (
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                    <XAxis dataKey="period" stroke={theme.palette.text.secondary} fontSize={12} />
                    <YAxis stroke={theme.palette.text.secondary} fontSize={12} 
                           tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`} />
                    <RechartsTooltip
                      formatter={(value: number, name) => [
                        `€${value.toLocaleString('de-DE')}`,
                        name === 'revenue' ? 'Umsatz' : 'Ziel'
                      ]}
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 8,
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke={theme.palette.primary.main}
                      strokeWidth={3}
                      fill="url(#revenueGradient)"
                      name="Umsatz"
                    />
                    <Line
                      type="monotone"
                      dataKey="target"
                      stroke={theme.palette.warning.main}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Ziel"
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </Paper>
          </SlideInContainer>
        </Grid>

        {/* Performance Breakdown */}
        <Grid item xs={12} lg={4}>
          <SlideInContainer delay={300}>
            <Paper elevation={2} sx={{ p: 3, height: 450 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Performance Aufschlüsselung
              </Typography>
              
              {/* Revenue Composition */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Umsatzverteilung
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2">Neukunden</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {((1 - kpiMetrics.find(m => m.id === 'recurring')?.value! / 100) * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={100 - (kpiMetrics.find(m => m.id === 'recurring')?.value || 0)}
                    sx={{ height: 8, borderRadius: 4, backgroundColor: alpha(theme.palette.primary.main, 0.2) }}
                  />
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2">Stammkunden</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {(kpiMetrics.find(m => m.id === 'recurring')?.value || 0).toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={kpiMetrics.find(m => m.id === 'recurring')?.value || 0}
                    sx={{ 
                      height: 8, 
                      borderRadius: 4, 
                      backgroundColor: alpha(theme.palette.secondary.main, 0.2),
                      '& .MuiLinearProgress-bar': { backgroundColor: theme.palette.secondary.main }
                    }}
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Key Insights */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Wichtige Erkenntnisse
                </Typography>
                
                <Box sx={{ p: 2, backgroundColor: alpha(theme.palette.info.main, 0.1), borderRadius: 2, mb: 2 }}>
                  <Typography variant="body2" color="info.main" sx={{ fontWeight: 600, mb: 1 }}>
                    Top Performance
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Zielerreichung: {(kpiMetrics.find(m => m.id === 'target')?.value || 0).toFixed(1)}%
                    <br />
                    • Ø Auftragswert steigt um 8.7%
                    <br />
                    • Stammkundenanteil wächst kontinuierlich
                  </Typography>
                </Box>
                
                <Box sx={{ p: 2, backgroundColor: alpha(theme.palette.warning.main, 0.1), borderRadius: 2 }}>
                  <Typography variant="body2" color="warning.main" sx={{ fontWeight: 600, mb: 1 }}>
                    Optimierungspotential
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Conversion Rate kann noch gesteigert werden
                    <br />
                    • Saisonale Schwankungen berücksichtigen
                    <br />
                    • Cross-Selling Opportunitäten nutzen
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </SlideInContainer>
        </Grid>
      </Grid>

      {/* Detailed Breakdown Table */}
      {viewMode === 'detailed' && (
        <SlideInContainer delay={400}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Detaillierte Periode-Analyse
            </Typography>
            
            <Box sx={{ overflowX: 'auto' }}>
              <Box sx={{ minWidth: 800 }}>
                {/* Table Header */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 120px 120px 100px 100px 120px 120px 100px',
                  gap: 2,
                  p: 2,
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  borderRadius: 1,
                  mb: 1,
                  fontWeight: 600,
                }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Periode</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Umsatz</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Ziel</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Angebote</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Aufträge</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Ø Wert</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Stammkunden</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Wachstum</Typography>
                </Box>
                
                {/* Table Rows */}
                {data.slice(-10).map((row, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 120px 120px 100px 100px 120px 120px 100px',
                      gap: 2,
                      p: 2,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.action.hover, 0.5),
                      },
                    }}
                  >
                    <Typography variant="body2">{row.period}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                      €{row.revenue.toLocaleString('de-DE')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      €{row.target.toLocaleString('de-DE')}
                    </Typography>
                    <Typography variant="body2">{row.quotes}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.conversions}</Typography>
                    <Typography variant="body2">€{row.avgOrderValue.toLocaleString('de-DE')}</Typography>
                    <Typography variant="body2">€{row.recurring.toLocaleString('de-DE')}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {row.growth >= 0 ? (
                        <TrendingUpIcon fontSize="small" color="success" />
                      ) : (
                        <TrendingDownIcon fontSize="small" color="error" />
                      )}
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 600,
                          color: row.growth >= 0 ? 'success.main' : 'error.main'
                        }}
                      >
                        {row.growth >= 0 ? '+' : ''}{row.growth.toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Paper>
        </SlideInContainer>
      )}
    </Box>
  );
};

export default RevenueTracking;