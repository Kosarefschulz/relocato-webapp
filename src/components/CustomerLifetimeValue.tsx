import React, { useState, useEffect, useMemo } from 'react';
import { Box, Card, CardContent, Typography, Paper, Button, IconButton, FormControl, InputLabel, Select, MenuItem, TextField, Chip, List, ListItem, ListItemText, ListItemIcon, Divider, useTheme, alpha, Tooltip, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, GlobalStyles } from '@mui/material';
import Grid from './GridCompat';
import {
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  Euro as EuroIcon,
  CalendarToday as CalendarIcon,
  Timeline as TimelineIcon,
  Star as StarIcon,
  LocalShipping as TruckIcon,
  Analytics as AnalyticsIcon,
  PieChart as PieChartIcon,
  ShowChart as ShowChartIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, differenceInMonths, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { AnimatedCard, SlideInContainer } from './MicroAnimations';

interface Customer {
  id: string;
  name: string;
  email: string;
  firstOrderDate: Date;
  lastOrderDate: Date;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  status: 'active' | 'inactive' | 'at_risk' | 'churned';
  segment: 'premium' | 'standard' | 'budget';
  predictedChurnProbability: number;
  satisfactionScore: number;
  referralCount: number;
}

interface CLVMetrics {
  averageCLV: number;
  totalCLV: number;
  averageOrderValue: number;
  purchaseFrequency: number;
  customerLifespan: number;
  churnRate: number;
  retentionRate: number;
  monthlyGrowthRate: number;
}

interface CLVSegment {
  segment: string;
  customerCount: number;
  averageCLV: number;
  totalValue: number;
  color: string;
}

interface CustomerLifetimeValueProps {
  customers?: Customer[];
  onCustomerSelect?: (customer: Customer) => void;
  timeRange?: 'last_6_months' | 'last_year' | 'last_2_years' | 'all_time';
}

const rotateKeyframes = `
  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const CustomerLifetimeValue: React.FC<CustomerLifetimeValueProps> = ({
  customers: propCustomers = [],
  onCustomerSelect,
  timeRange: initialTimeRange = 'last_year',
}) => {
  const theme = useTheme();
  const [customers, setCustomers] = useState<Customer[]>(propCustomers);
  const [timeRange, setTimeRange] = useState(initialTimeRange);
  const [selectedSegment, setSelectedSegment] = useState<string>('all');
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'clv' | 'orders' | 'revenue' | 'churn_risk'>('clv');

  // Generate sample customer data if none provided
  useEffect(() => {
    if (propCustomers.length === 0) {
      generateSampleCustomers();
    }
  }, [propCustomers]);

  const generateSampleCustomers = () => {
    const sampleCustomers: Customer[] = [];
    const customerNames = [
      'Max Mustermann', 'Anna Schmidt', 'Peter Wagner', 'Lisa Müller', 'Thomas Becker',
      'Sarah Weber', 'Michael Schulz', 'Julia Fischer', 'Andreas Meyer', 'Christina Wolf',
      'Daniel Richter', 'Laura Zimmermann', 'Stefan Koch', 'Nina Hoffmann', 'Markus Krause',
      'Jessica Braun', 'Florian Neumann', 'Sabrina Lange', 'Oliver Schmitt', 'Vanessa Klein'
    ];

    for (let i = 0; i < 50; i++) {
      const firstOrderDate = new Date(Date.now() - Math.random() * 2 * 365 * 24 * 60 * 60 * 1000);
      const totalOrders = Math.floor(Math.random() * 8) + 1;
      const avgOrderValue = 800 + Math.random() * 2000;
      const totalRevenue = totalOrders * avgOrderValue * (0.8 + Math.random() * 0.4);
      const lastOrderDate = new Date(firstOrderDate.getTime() + Math.random() * (Date.now() - firstOrderDate.getTime()));
      
      const segments: Array<Customer['segment']> = ['premium', 'standard', 'budget'];
      const statuses: Array<Customer['status']> = ['active', 'inactive', 'at_risk', 'churned'];
      
      sampleCustomers.push({
        id: `customer-${i + 1}`,
        name: customerNames[Math.floor(Math.random() * customerNames.length)],
        email: `kunde${i + 1}@beispiel.de`,
        firstOrderDate,
        lastOrderDate,
        totalOrders,
        totalRevenue,
        averageOrderValue: avgOrderValue,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        segment: segments[Math.floor(Math.random() * segments.length)],
        predictedChurnProbability: Math.random(),
        satisfactionScore: 1 + Math.random() * 4,
        referralCount: Math.floor(Math.random() * 5),
      });
    }

    setCustomers(sampleCustomers);
  };

  // Calculate CLV metrics
  const clvMetrics = useMemo((): CLVMetrics => {
    if (customers.length === 0) {
      return {
        averageCLV: 0,
        totalCLV: 0,
        averageOrderValue: 0,
        purchaseFrequency: 0,
        customerLifespan: 0,
        churnRate: 0,
        retentionRate: 0,
        monthlyGrowthRate: 0,
      };
    }

    const totalRevenue = customers.reduce((sum, customer) => sum + customer.totalRevenue, 0);
    const totalOrders = customers.reduce((sum, customer) => sum + customer.totalOrders, 0);
    const averageOrderValue = totalRevenue / totalOrders;
    
    // Calculate customer lifespan in months
    const lifespans = customers.map(customer => {
      const months = differenceInMonths(customer.lastOrderDate, customer.firstOrderDate);
      return Math.max(months, 1); // Minimum 1 month
    });
    const averageLifespan = lifespans.reduce((sum, lifespan) => sum + lifespan, 0) / lifespans.length;
    
    // Purchase frequency (orders per month)
    const purchaseFrequency = totalOrders / (customers.length * averageLifespan);
    
    // Simple CLV calculation: AOV × Purchase Frequency × Customer Lifespan
    const averageCLV = averageOrderValue * purchaseFrequency * averageLifespan;
    const totalCLV = averageCLV * customers.length;
    
    // Churn and retention rates
    const churnedCustomers = customers.filter(c => c.status === 'churned').length;
    const churnRate = churnedCustomers / customers.length;
    const retentionRate = 1 - churnRate;
    
    // Monthly growth rate (simplified)
    const monthlyGrowthRate = 0.05 + Math.random() * 0.1; // Mock growth rate
    
    return {
      averageCLV,
      totalCLV,
      averageOrderValue,
      purchaseFrequency,
      customerLifespan: averageLifespan,
      churnRate,
      retentionRate,
      monthlyGrowthRate,
    };
  }, [customers]);

  // Calculate CLV segments
  const clvSegments = useMemo((): CLVSegment[] => {
    const segmentData: { [key: string]: { count: number; totalCLV: number; color: string } } = {
      premium: { count: 0, totalCLV: 0, color: theme.palette.success.main },
      standard: { count: 0, totalCLV: 0, color: theme.palette.primary.main },
      budget: { count: 0, totalCLV: 0, color: theme.palette.warning.main },
    };

    customers.forEach(customer => {
      const clv = customer.totalRevenue * 1.5; // Simplified CLV calculation
      segmentData[customer.segment].count++;
      segmentData[customer.segment].totalCLV += clv;
    });

    return Object.entries(segmentData).map(([segment, data]) => ({
      segment: segment.charAt(0).toUpperCase() + segment.slice(1),
      customerCount: data.count,
      averageCLV: data.count > 0 ? data.totalCLV / data.count : 0,
      totalValue: data.totalCLV,
      color: data.color,
    }));
  }, [customers, theme]);

  // Filtered customers based on segment
  const filteredCustomers = useMemo(() => {
    if (selectedSegment === 'all') {
      return customers;
    }
    return customers.filter(customer => customer.segment === selectedSegment);
  }, [customers, selectedSegment]);

  // Sorted customers
  const sortedCustomers = useMemo(() => {
    const sorted = [...filteredCustomers];
    
    switch (sortBy) {
      case 'clv':
        return sorted.sort((a, b) => (b.totalRevenue * 1.5) - (a.totalRevenue * 1.5));
      case 'orders':
        return sorted.sort((a, b) => b.totalOrders - a.totalOrders);
      case 'revenue':
        return sorted.sort((a, b) => b.totalRevenue - a.totalRevenue);
      case 'churn_risk':
        return sorted.sort((a, b) => b.predictedChurnProbability - a.predictedChurnProbability);
      default:
        return sorted;
    }
  }, [filteredCustomers, sortBy]);

  // Generate CLV trend data
  const clvTrendData = useMemo(() => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(currentDate, i);
      const monthData = {
        month: format(date, 'MMM yyyy', { locale: de }),
        averageCLV: clvMetrics.averageCLV * (0.8 + Math.random() * 0.4),
        totalCLV: clvMetrics.totalCLV * (0.8 + Math.random() * 0.4),
        customerCount: customers.length * (0.8 + Math.random() * 0.4),
      };
      months.push(monthData);
    }
    
    return months;
  }, [clvMetrics, customers.length]);

  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailsOpen(true);
    onCustomerSelect?.(customer);
  };

  const calculateCLV = async () => {
    setIsCalculating(true);
    
    // Simulate CLV calculation process
    setTimeout(() => {
      // In real implementation, this would trigger backend calculations
      setIsCalculating(false);
    }, 2000);
  };

  const exportCLVData = () => {
    const csvData = [
      ['Kunde', 'CLV', 'Bestellungen', 'Umsatz', 'Segment', 'Status', 'Churn-Risiko'],
      ...sortedCustomers.map(customer => [
        customer.name,
        (customer.totalRevenue * 1.5).toFixed(2),
        customer.totalOrders,
        customer.totalRevenue.toFixed(2),
        customer.segment,
        customer.status,
        (customer.predictedChurnProbability * 100).toFixed(1) + '%'
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer-lifetime-value.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: Customer['status']) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'warning';
      case 'at_risk': return 'error';
      case 'churned': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: Customer['status']) => {
    switch (status) {
      case 'active': return 'Aktiv';
      case 'inactive': return 'Inaktiv';
      case 'at_risk': return 'Risiko';
      case 'churned': return 'Abgewandert';
      default: return status;
    }
  };

  const getRiskColor = (probability: number) => {
    if (probability > 0.7) return theme.palette.error.main;
    if (probability > 0.4) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  return (
    <Box>
      <GlobalStyles styles={rotateKeyframes} />
      {/* Header */}
      <SlideInContainer>
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon color="primary" />
              Customer Lifetime Value Analyse
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="CLV neu berechnen">
                <IconButton onClick={calculateCLV} disabled={isCalculating}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Daten exportieren">
                <IconButton onClick={exportCLVData}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              
              <Button
                variant="contained"
                startIcon={isCalculating ? <RefreshIcon sx={{ animation: 'rotate 1s linear infinite' }} /> : <AnalyticsIcon />}
                onClick={calculateCLV}
                disabled={isCalculating}
              >
                {isCalculating ? 'Berechne...' : 'CLV Berechnen'}
              </Button>
            </Box>
          </Box>
          
          <Typography variant="body1" color="text.secondary">
            Analysieren Sie den Customer Lifetime Value für strategische Geschäftsentscheidungen
          </Typography>
        </Paper>
      </SlideInContainer>

      {/* Key Metrics */}
      <SlideInContainer delay={200}>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <AnimatedCard>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.main, 0.8)} 100%)`,
                  color: 'white',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <EuroIcon sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        €{clvMetrics.averageCLV.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Durchschnittlicher CLV
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Box>
            </AnimatedCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <AnimatedCard delay={100}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${alpha(theme.palette.success.main, 0.8)} 100%)`,
                  color: 'white',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AccountBalanceIcon sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        €{clvMetrics.totalCLV.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Gesamt CLV
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Box>
            </AnimatedCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <AnimatedCard delay={200}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${alpha(theme.palette.warning.main, 0.8)} 100%)`,
                  color: 'white',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ScheduleIcon sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {clvMetrics.customerLifespan.toFixed(1)}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Ø Kundendauer (Monate)
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Box>
            </AnimatedCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <AnimatedCard delay={300}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${alpha(theme.palette.info.main, 0.8)} 100%)`,
                  color: 'white',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TrendingDownIcon sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {(clvMetrics.churnRate * 100).toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Abwanderungsrate
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Box>
            </AnimatedCard>
          </Grid>
        </Grid>
      </SlideInContainer>

      {/* CLV Trend Chart */}
      <SlideInContainer delay={400}>
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            CLV Entwicklung über Zeit
          </Typography>
          
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={clvTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip 
                  formatter={(value: number, name: string) => [
                    `€${value.toLocaleString('de-DE', { maximumFractionDigits: 0 })}`,
                    name === 'averageCLV' ? 'Durchschnittlicher CLV' : 'Gesamt CLV'
                  ]}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="averageCLV" 
                  stackId="1"
                  stroke={theme.palette.primary.main}
                  fill={alpha(theme.palette.primary.main, 0.3)}
                  name="Durchschnittlicher CLV"
                />
                <Area 
                  type="monotone" 
                  dataKey="totalCLV" 
                  stackId="2"
                  stroke={theme.palette.success.main}
                  fill={alpha(theme.palette.success.main, 0.3)}
                  name="Gesamt CLV"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </SlideInContainer>

      {/* Segment Analysis */}
      <SlideInContainer delay={600}>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                CLV nach Kundensegmenten
              </Typography>
              
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={clvSegments}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="segment" />
                    <YAxis />
                    <RechartsTooltip 
                      formatter={(value: number) => [`€${value.toLocaleString('de-DE', { maximumFractionDigits: 0 })}`, 'Durchschnittlicher CLV']}
                    />
                    <Bar dataKey="averageCLV" fill={theme.palette.primary.main} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                Segment-Verteilung
              </Typography>
              
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={clvSegments}
                      dataKey="customerCount"
                      nameKey="segment"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ segment, customerCount }) => `${segment}: ${customerCount}`}
                    >
                      {clvSegments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </SlideInContainer>

      {/* Customer List */}
      <SlideInContainer delay={800}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'between', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Kunden-Ranking
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, ml: 'auto' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Segment</InputLabel>
                <Select
                  value={selectedSegment}
                  label="Segment"
                  onChange={(e) => setSelectedSegment(e.target.value)}
                >
                  <MenuItem value="all">Alle</MenuItem>
                  <MenuItem value="premium">Premium</MenuItem>
                  <MenuItem value="standard">Standard</MenuItem>
                  <MenuItem value="budget">Budget</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Sortieren</InputLabel>
                <Select
                  value={sortBy}
                  label="Sortieren"
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <MenuItem value="clv">CLV</MenuItem>
                  <MenuItem value="orders">Bestellungen</MenuItem>
                  <MenuItem value="revenue">Umsatz</MenuItem>
                  <MenuItem value="churn_risk">Churn-Risiko</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Kunde</TableCell>
                  <TableCell align="right">CLV</TableCell>
                  <TableCell align="right">Bestellungen</TableCell>
                  <TableCell align="right">Umsatz</TableCell>
                  <TableCell>Segment</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Churn-Risiko</TableCell>
                  <TableCell>Aktion</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedCustomers.slice(0, 10).map((customer) => {
                  const clv = customer.totalRevenue * 1.5;
                  return (
                    <TableRow key={customer.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon color="primary" />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {customer.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {customer.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          €{clv.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{customer.totalOrders}</TableCell>
                      <TableCell align="right">
                        €{customer.totalRevenue.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={customer.segment.charAt(0).toUpperCase() + customer.segment.slice(1)}
                          size="small"
                          color={customer.segment === 'premium' ? 'success' : customer.segment === 'standard' ? 'primary' : 'warning'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getStatusLabel(customer.status)}
                          size="small"
                          color={getStatusColor(customer.status)}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 60 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={customer.predictedChurnProbability * 100}
                              sx={{
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: getRiskColor(customer.predictedChurnProbability),
                                },
                              }}
                            />
                          </Box>
                          <Typography variant="caption">
                            {(customer.predictedChurnProbability * 100).toFixed(0)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => handleCustomerClick(customer)}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </SlideInContainer>

      {/* Customer Details Dialog */}
      <Dialog
        open={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Customer Details: {selectedCustomer?.name}
        </DialogTitle>
        <DialogContent>
          {selectedCustomer && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  CLV Metriken
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <EuroIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Customer Lifetime Value"
                      secondary={`€${(selectedCustomer.totalRevenue * 1.5).toLocaleString('de-DE', { maximumFractionDigits: 0 })}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <AssignmentIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Gesamtbestellungen"
                      secondary={selectedCustomer.totalOrders}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <TrendingUpIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Gesamtumsatz"
                      secondary={`€${selectedCustomer.totalRevenue.toLocaleString('de-DE', { maximumFractionDigits: 0 })}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <StarIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Zufriedenheitsscore"
                      secondary={`${selectedCustomer.satisfactionScore.toFixed(1)}/5.0`}
                    />
                  </ListItem>
                </List>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Kundenprofil
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <CalendarIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Erste Bestellung"
                      secondary={format(selectedCustomer.firstOrderDate, 'dd.MM.yyyy', { locale: de })}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CalendarIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Letzte Bestellung"
                      secondary={format(selectedCustomer.lastOrderDate, 'dd.MM.yyyy', { locale: de })}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <PersonIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Empfehlungen"
                      secondary={`${selectedCustomer.referralCount} Kunden empfohlen`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <AnalyticsIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Churn-Wahrscheinlichkeit"
                      secondary={`${(selectedCustomer.predictedChurnProbability * 100).toFixed(1)}%`}
                    />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDetailsOpen(false)}>
            Schließen
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default CustomerLifetimeValue;