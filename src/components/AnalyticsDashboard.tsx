import React, { useState, useEffect } from 'react';
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
  Tab,
  Tabs,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  MonetizationOn as MonetizationOnIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import LoadingSkeleton from './LoadingSkeleton';
import RevenueTracking from './RevenueTracking';
import KPIWidgets from './KPIWidgets';

interface AnalyticsData {
  revenue: {
    total: number;
    growth: number;
    monthly: Array<{ month: string; value: number; quotes: number }>;
  };
  quotes: {
    total: number;
    conversion: number;
    byStatus: Array<{ status: string; count: number; color: string }>;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
  };
  services: {
    popular: Array<{ service: string; count: number; revenue: number }>;
  };
}

interface KPICardProps {
  title: string;
  value: string | number;
  growth?: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, growth, icon, color, subtitle }) => {
  const theme = useTheme();
  
  return (
    <Card 
      elevation={2} 
      sx={{ 
        height: '100%',
        background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.8)} 100%)`,
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
          <Box>
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {typeof value === 'number' ? value.toLocaleString('de-DE') : value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ opacity: 0.8 }}>
            {icon}
          </Box>
        </Box>
        
        {growth !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {growth >= 0 ? (
              <TrendingUpIcon fontSize="small" />
            ) : (
              <TrendingDownIcon fontSize="small" />
            )}
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              vs. Vormonat
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const AnalyticsDashboard: React.FC = () => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState('12months');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'kpis'>('overview');

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockData: AnalyticsData = {
        revenue: {
          total: 847250,
          growth: 12.5,
          monthly: [
            { month: 'Jan', value: 65000, quotes: 42 },
            { month: 'Feb', value: 72000, quotes: 48 },
            { month: 'Mär', value: 68000, quotes: 45 },
            { month: 'Apr', value: 81000, quotes: 53 },
            { month: 'Mai', value: 75000, quotes: 51 },
            { month: 'Jun', value: 88000, quotes: 58 },
            { month: 'Jul', value: 92000, quotes: 61 },
            { month: 'Aug', value: 86000, quotes: 57 },
            { month: 'Sep', value: 94000, quotes: 63 },
            { month: 'Okt', value: 89000, quotes: 59 },
            { month: 'Nov', value: 97000, quotes: 65 },
            { month: 'Dez', value: 103000, quotes: 68 },
          ],
        },
        quotes: {
          total: 630,
          conversion: 68.5,
          byStatus: [
            { status: 'Angenommen', count: 431, color: theme.palette.success.main },
            { status: 'Versendet', count: 125, color: theme.palette.primary.main },
            { status: 'Abgelehnt', count: 58, color: theme.palette.error.main },
            { status: 'Entwurf', count: 16, color: theme.palette.grey[500] },
          ],
        },
        customers: {
          total: 342,
          new: 89,
          returning: 253,
        },
        services: {
          popular: [
            { service: 'Standardumzug', count: 287, revenue: 456000 },
            { service: 'Verpackungsservice', count: 156, revenue: 187200 },
            { service: 'Reinigungsservice', count: 98, revenue: 88200 },
            { service: 'Entrümpelung', count: 67, revenue: 80400 },
            { service: 'Klaviertransport', count: 34, revenue: 51000 },
            { service: 'Renovierung', count: 23, revenue: 34500 },
          ],
        },
      };
      
      setData(mockData);
      setLoading(false);
    }, 1500);
  };

  if (loading) {
    return <LoadingSkeleton variant="dashboard" />;
  }

  if (!data) {
    return <Typography>Fehler beim Laden der Analytics-Daten</Typography>;
  }

  const CHART_COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Analytics Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Geschäftsanalysen und Performance-Metriken
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Zeitraum</InputLabel>
            <Select
              value={timeRange}
              label="Zeitraum"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="3months">Letzte 3 Monate</MenuItem>
              <MenuItem value="6months">Letzte 6 Monate</MenuItem>
              <MenuItem value="12months">Letzte 12 Monate</MenuItem>
              <MenuItem value="2years">Letzte 2 Jahre</MenuItem>
            </Select>
          </FormControl>
          
          <Tooltip title="Daten aktualisieren">
            <IconButton onClick={loadAnalyticsData}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Übersicht" value="overview" />
          <Tab label="Revenue Tracking" value="revenue" />
          <Tab label="KPI Dashboard" value="kpis" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={6} md={3}>
          <KPICard
            title="Gesamtumsatz"
            value={`€${data.revenue.total.toLocaleString('de-DE')}`}
            growth={data.revenue.growth}
            icon={<MonetizationOnIcon sx={{ fontSize: 40 }} />}
            color={theme.palette.success.main}
            subtitle="Dieses Jahr"
          />
        </Grid>
        
        <Grid item xs={6} sm={6} md={3}>
          <KPICard
            title="Angebote"
            value={data.quotes.total}
            growth={8.3}
            icon={<AssignmentIcon sx={{ fontSize: 40 }} />}
            color={theme.palette.primary.main}
            subtitle="Erstellt"
          />
        </Grid>
        
        <Grid item xs={6} sm={6} md={3}>
          <KPICard
            title="Kunden"
            value={data.customers.total}
            growth={15.7}
            icon={<PeopleIcon sx={{ fontSize: 40 }} />}
            color={theme.palette.info.main}
            subtitle="Aktive Kunden"
          />
        </Grid>
        
        <Grid item xs={6} sm={6} md={3}>
          <KPICard
            title="Conversion Rate"
            value={`${data.quotes.conversion}%`}
            growth={3.2}
            icon={<TrendingUpIcon sx={{ fontSize: 40 }} />}
            color={theme.palette.warning.main}
            subtitle="Angebote zu Aufträge"
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Revenue Trend */}
        <Grid item xs={12} lg={8}>
          <Paper elevation={2} sx={{ p: 3, height: 400 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Umsatzentwicklung
              </Typography>
              <Tooltip title="Umsatz pro Monat mit Anzahl der Angebote">
                <IconButton size="small">
                  <InfoIcon />
                </IconButton>
              </Tooltip>
            </Box>
            
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={data.revenue.monthly}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                <XAxis 
                  dataKey="month" 
                  stroke={theme.palette.text.secondary}
                  fontSize={12}
                />
                <YAxis 
                  stroke={theme.palette.text.secondary}
                  fontSize={12}
                  tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                />
                <RechartsTooltip 
                  formatter={(value: number) => [`€${value.toLocaleString('de-DE')}`, 'Umsatz']}
                  labelStyle={{ color: theme.palette.text.primary }}
                  contentStyle={{ 
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={theme.palette.primary.main}
                  strokeWidth={3}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Quote Status Distribution */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={2} sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Angebotsstatus
            </Typography>
            
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.quotes.byStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="count"
                >
                  {data.quotes.byStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value: number) => [value, 'Anzahl']}
                  contentStyle={{ 
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => (
                    <span style={{ color: theme.palette.text.primary, fontSize: 12 }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Service Performance */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Service Performance
            </Typography>
            
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.services.popular} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                <XAxis 
                  type="number"
                  stroke={theme.palette.text.secondary}
                  fontSize={12}
                  tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                />
                <YAxis 
                  type="category"
                  dataKey="service"
                  stroke={theme.palette.text.secondary}
                  fontSize={12}
                  width={120}
                />
                <RechartsTooltip 
                  formatter={(value: number, name) => [
                    name === 'revenue' ? `€${value.toLocaleString('de-DE')}` : value,
                    name === 'revenue' ? 'Umsatz' : 'Anzahl'
                  ]}
                  contentStyle={{ 
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="count" 
                  fill={theme.palette.primary.main}
                  name="Anzahl"
                  radius={[0, 4, 4, 0]}
                />
                <Bar 
                  dataKey="revenue" 
                  fill={theme.palette.success.main}
                  name="Umsatz"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Customer Insights */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={2} sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Kunden-Insights
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Neue Kunden
                </Typography>
                <Typography variant="h6" color="primary">
                  {data.customers.new}
                </Typography>
              </Box>
              <Box 
                sx={{ 
                  height: 8, 
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                  borderRadius: 4,
                  overflow: 'hidden'
                }}
              >
                <Box 
                  sx={{ 
                    height: '100%',
                    width: `${(data.customers.new / data.customers.total) * 100}%`,
                    backgroundColor: theme.palette.primary.main,
                    borderRadius: 4,
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Stammkunden
                </Typography>
                <Typography variant="h6" color="success.main">
                  {data.customers.returning}
                </Typography>
              </Box>
              <Box 
                sx={{ 
                  height: 8, 
                  backgroundColor: alpha(theme.palette.success.main, 0.2),
                  borderRadius: 4,
                  overflow: 'hidden'
                }}
              >
                <Box 
                  sx={{ 
                    height: '100%',
                    width: `${(data.customers.returning / data.customers.total) * 100}%`,
                    backgroundColor: theme.palette.success.main,
                    borderRadius: 4,
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ mt: 4, p: 2, backgroundColor: alpha(theme.palette.info.main, 0.1), borderRadius: 2 }}>
              <Typography variant="body2" color="info.main" sx={{ fontWeight: 600, mb: 1 }}>
                Wichtige Erkenntnisse
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 74% der Kunden sind Stammkunden
                <br />
                • Durchschnittlicher Auftragswert: €1.345
                <br />
                • Beste Conversion bei Haushalten 3-4 Zimmer
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
        </>
      )}

      {/* Revenue Tracking Tab */}
      {activeTab === 'revenue' && (
        <RevenueTracking timeRange={timeRange as any} />
      )}

      {/* KPI Dashboard Tab */}
      {activeTab === 'kpis' && (
        <KPIWidgets timeRange={timeRange as any} />
      )}
    </Box>
  );
};

export default AnalyticsDashboard;