import React, { useState, useEffect, useMemo } from 'react';
import { Box, Card, CardContent, Typography, Paper, Button, TextField, FormControl, InputLabel, Select, MenuItem, IconButton, Chip, List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction, Divider, useTheme, alpha, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Slider, FormControlLabel, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress, Tab, Tabs, Accordion, AccordionSummary, AccordionDetails, GlobalStyles } from '@mui/material';
import Grid from './GridCompat';
import {
  TrendingUp as TrendingUpIcon,
  Psychology as PsychologyIcon,
  AutoFixHigh as AutoFixHighIcon,
  Analytics as AnalyticsIcon,
  Assessment as AssessmentIcon,
  Euro as EuroIcon,
  CompareArrows as CompareArrowsIcon,
  Lightbulb as LightbulbIcon,
  Speed as SpeedIcon,
  Timer as TimerIcon,
  LocationOn as LocationIcon,
  LocalShipping as TruckIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Star as StarIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  TuneOutlined as TuneIcon,
  ExpandMore as ExpandMoreIcon,
  Calculate as CalculateIcon,
  MonetizationOn as MonetizationOnIcon,
  ShowChart as ShowChartIcon,
} from '@mui/icons-material';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { format, subDays, subMonths, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { AnimatedCard, SlideInContainer } from './MicroAnimations';

interface PricingFactor {
  id: string;
  name: string;
  weight: number;
  impact: 'positive' | 'negative' | 'neutral';
  category: 'distance' | 'volume' | 'difficulty' | 'timing' | 'customer' | 'market';
  description: string;
  currentValue?: number;
  recommendedValue?: number;
}

interface PricingRule {
  id: string;
  name: string;
  condition: string;
  action: 'increase' | 'decrease' | 'fixed';
  percentage?: number;
  fixedAmount?: number;
  priority: number;
  isActive: boolean;
  category: string;
}

interface MarketData {
  location: string;
  averagePrice: number;
  priceRange: { min: number; max: number };
  demandLevel: 'low' | 'medium' | 'high';
  competitorCount: number;
  seasonality: number;
  lastUpdated: Date;
}

interface PricingRecommendation {
  id: string;
  type: 'increase' | 'decrease' | 'optimize' | 'alert';
  title: string;
  description: string;
  currentPrice: number;
  recommendedPrice: number;
  expectedImpact: {
    revenue: number;
    conversion: number;
    profit: number;
  };
  confidence: number;
  factors: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  validUntil: Date;
}

interface PricingScenario {
  id: string;
  name: string;
  basePrice: number;
  adjustments: Array<{
    factor: string;
    multiplier: number;
    reason: string;
  }>;
  finalPrice: number;
  margin: number;
  competitiveness: number;
  conversionProbability: number;
}

interface SmartPricingRecommendationsProps {
  onPriceUpdate?: (newPrice: number, scenario: PricingScenario) => void;
  onRuleUpdate?: (rule: PricingRule) => void;
  currentPrice?: number;
  serviceType?: string;
  customerSegment?: string;
  location?: string;
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

const SmartPricingRecommendations: React.FC<SmartPricingRecommendationsProps> = ({
  onPriceUpdate,
  onRuleUpdate,
  currentPrice = 0,
  serviceType = 'standard',
  customerSegment = 'standard',
  location = 'Berlin',
}) => {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState(0);
  const [pricingFactors, setPricingFactors] = useState<PricingFactor[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [recommendations, setRecommendations] = useState<PricingRecommendation[]>([]);
  const [scenarios, setScenarios] = useState<PricingScenario[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<PricingScenario | null>(null);
  const [optimizationSettings, setOptimizationSettings] = useState({
    profitMarginTarget: 25,
    conversionRateTarget: 15,
    marketPositioning: 'competitive' as 'budget' | 'competitive' | 'premium',
    riskTolerance: 'medium' as 'low' | 'medium' | 'high',
    autoAdjust: false,
  });

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = () => {
    // Initialize pricing factors
    const sampleFactors: PricingFactor[] = [
      {
        id: 'distance',
        name: 'Entfernung',
        weight: 0.3,
        impact: 'positive',
        category: 'distance',
        description: 'Entfernung zwischen Start- und Zielort',
        currentValue: 25,
        recommendedValue: 25,
      },
      {
        id: 'volume',
        name: 'Umzugsvolumen',
        weight: 0.25,
        impact: 'positive',
        category: 'volume',
        description: 'Geschätztes Volumen der zu transportierenden Güter',
        currentValue: 45,
        recommendedValue: 50,
      },
      {
        id: 'difficulty',
        name: 'Schwierigkeitsgrad',
        weight: 0.2,
        impact: 'positive',
        category: 'difficulty',
        description: 'Komplexität des Umzugs (Stockwerke, Zugang, etc.)',
        currentValue: 3,
        recommendedValue: 4,
      },
      {
        id: 'timing',
        name: 'Saisonalität',
        weight: 0.15,
        impact: 'positive',
        category: 'timing',
        description: 'Zeitlicher Faktor (Hochsaison, Wochenende, etc.)',
        currentValue: 1.2,
        recommendedValue: 1.35,
      },
      {
        id: 'customer_loyalty',
        name: 'Kundenloyalität',
        weight: 0.1,
        impact: 'negative',
        category: 'customer',
        description: 'Bewertung der Kundenbeziehung und Historie',
        currentValue: 0.95,
        recommendedValue: 0.9,
      },
    ];

    // Initialize pricing rules
    const sampleRules: PricingRule[] = [
      {
        id: 'rule-1',
        name: 'Wochenend-Aufschlag',
        condition: 'moving_date.is_weekend',
        action: 'increase',
        percentage: 15,
        priority: 1,
        isActive: true,
        category: 'timing',
      },
      {
        id: 'rule-2',
        name: 'Stammkunden-Rabatt',
        condition: 'customer.orders_count >= 2',
        action: 'decrease',
        percentage: 10,
        priority: 2,
        isActive: true,
        category: 'customer',
      },
      {
        id: 'rule-3',
        name: 'Hochsaison-Aufschlag',
        condition: 'date.month in [6,7,8]',
        action: 'increase',
        percentage: 20,
        priority: 1,
        isActive: true,
        category: 'timing',
      },
      {
        id: 'rule-4',
        name: 'Große Entfernung',
        condition: 'distance > 100',
        action: 'increase',
        percentage: 5,
        priority: 3,
        isActive: true,
        category: 'distance',
      },
    ];

    // Initialize market data
    const sampleMarketData: MarketData[] = [
      {
        location: 'Berlin',
        averagePrice: 1250,
        priceRange: { min: 800, max: 1800 },
        demandLevel: 'high',
        competitorCount: 45,
        seasonality: 1.2,
        lastUpdated: new Date(),
      },
      {
        location: 'Hamburg',
        averagePrice: 1180,
        priceRange: { min: 750, max: 1650 },
        demandLevel: 'medium',
        competitorCount: 28,
        seasonality: 1.1,
        lastUpdated: new Date(),
      },
      {
        location: 'München',
        averagePrice: 1420,
        priceRange: { min: 950, max: 2100 },
        demandLevel: 'high',
        competitorCount: 52,
        seasonality: 1.3,
        lastUpdated: new Date(),
      },
      {
        location: 'Köln',
        averagePrice: 1150,
        priceRange: { min: 700, max: 1600 },
        demandLevel: 'medium',
        competitorCount: 35,
        seasonality: 1.0,
        lastUpdated: new Date(),
      },
    ];

    // Generate recommendations
    const sampleRecommendations: PricingRecommendation[] = [
      {
        id: 'rec-1',
        type: 'increase',
        title: 'Preiserhöhung für Premium-Services',
        description: 'Marktanalyse zeigt Potenzial für 8% Preiserhöhung bei Premium-Umzügen ohne Nachfrageverlust.',
        currentPrice: 1500,
        recommendedPrice: 1620,
        expectedImpact: {
          revenue: 12000,
          conversion: -2,
          profit: 8500,
        },
        confidence: 0.85,
        factors: ['Marktposition', 'Kundenzufriedenheit', 'Konkurrenzanalyse'],
        priority: 'high',
        category: 'service_optimization',
        validUntil: addDays(new Date(), 30),
      },
      {
        id: 'rec-2',
        type: 'optimize',
        title: 'Saisonale Preisanpassung',
        description: 'Empfehlung zur dynamischen Preisgestaltung basierend auf saisonalen Schwankungen.',
        currentPrice: 1200,
        recommendedPrice: 1380,
        expectedImpact: {
          revenue: 8500,
          conversion: -1,
          profit: 6200,
        },
        confidence: 0.92,
        factors: ['Saisonalität', 'Nachfrage', 'Kapazität'],
        priority: 'medium',
        category: 'seasonal',
        validUntil: addDays(new Date(), 14),
      },
      {
        id: 'rec-3',
        type: 'alert',
        title: 'Wettbewerbsdruck in München',
        description: 'Neue Konkurrenten unterbieten Ihre Preise um durchschnittlich 12%.',
        currentPrice: 1400,
        recommendedPrice: 1260,
        expectedImpact: {
          revenue: -5000,
          conversion: 8,
          profit: -2000,
        },
        confidence: 0.78,
        factors: ['Wettbewerb', 'Marktanteil', 'Preissensitivität'],
        priority: 'critical',
        category: 'competitive',
        validUntil: addDays(new Date(), 7),
      },
    ];

    // Generate scenarios
    const sampleScenarios: PricingScenario[] = [
      {
        id: 'scenario-1',
        name: 'Konservativ',
        basePrice: 1200,
        adjustments: [
          { factor: 'Marktposition', multiplier: 1.0, reason: 'Aktuelle Position beibehalten' },
          { factor: 'Sicherheitspuffer', multiplier: 0.95, reason: 'Geringes Risiko' },
        ],
        finalPrice: 1140,
        margin: 22,
        competitiveness: 0.85,
        conversionProbability: 0.78,
      },
      {
        id: 'scenario-2',
        name: 'Ausgewogen',
        basePrice: 1200,
        adjustments: [
          { factor: 'Marktoptimierung', multiplier: 1.08, reason: 'Moderate Preiserhöhung' },
          { factor: 'Kundenbindung', multiplier: 0.98, reason: 'Stammkundenbonus' },
        ],
        finalPrice: 1270,
        margin: 28,
        competitiveness: 0.76,
        conversionProbability: 0.72,
      },
      {
        id: 'scenario-3',
        name: 'Aggressiv',
        basePrice: 1200,
        adjustments: [
          { factor: 'Premiumpositionierung', multiplier: 1.15, reason: 'Höhere Margen' },
          { factor: 'Servicequalität', multiplier: 1.05, reason: 'Qualitätsvorteil' },
        ],
        finalPrice: 1449,
        margin: 35,
        competitiveness: 0.65,
        conversionProbability: 0.58,
      },
    ];

    setPricingFactors(sampleFactors);
    setPricingRules(sampleRules);
    setMarketData(sampleMarketData);
    setRecommendations(sampleRecommendations);
    setScenarios(sampleScenarios);
  };

  const runOptimization = async () => {
    setIsOptimizing(true);
    
    // Simulate AI optimization process
    setTimeout(() => {
      // Generate new recommendations based on current settings
      const optimizedRecommendations = recommendations.map(rec => ({
        ...rec,
        confidence: Math.min(rec.confidence + 0.05, 0.95),
        expectedImpact: {
          ...rec.expectedImpact,
          profit: rec.expectedImpact.profit * 1.1,
        },
      }));
      
      setRecommendations(optimizedRecommendations);
      setIsOptimizing(false);
    }, 3000);
  };

  const generatePricingReport = () => {
    // Simulate report generation
    const reportData = {
      currentOptimization: scenarios.find(s => s.name === 'Ausgewogen'),
      marketPosition: 'competitive',
      recommendations: recommendations.filter(r => r.priority === 'high').length,
      potentialRevenue: recommendations.reduce((sum, rec) => sum + rec.expectedImpact.revenue, 0),
    };
    
    console.log('Pricing Report Generated:', reportData);
    alert('Pricing-Report wurde generiert und kann heruntergeladen werden.');
  };

  const applyScenario = (scenario: PricingScenario) => {
    setSelectedScenario(scenario);
    onPriceUpdate?.(scenario.finalPrice, scenario);
  };

  const getRecommendationColor = (type: PricingRecommendation['type']) => {
    switch (type) {
      case 'increase': return theme.palette.success.main;
      case 'decrease': return theme.palette.warning.main;
      case 'optimize': return theme.palette.info.main;
      case 'alert': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getDemandColor = (level: string) => {
    switch (level) {
      case 'high': return theme.palette.success.main;
      case 'medium': return theme.palette.warning.main;
      case 'low': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  // Calculate market position score
  const marketPositionScore = useMemo(() => {
    const currentMarket = marketData.find(m => m.location === location);
    if (!currentMarket || currentPrice === 0) return 0;
    
    const position = ((currentPrice - currentMarket.priceRange.min) / 
                     (currentMarket.priceRange.max - currentMarket.priceRange.min)) * 100;
    return Math.max(0, Math.min(100, position));
  }, [marketData, location, currentPrice]);

  const renderFactorsTab = () => (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Preisfaktoren
      </Typography>
      
      <Grid container spacing={3}>
        {pricingFactors.map((factor, index) => (
          <Grid item xs={12} md={6} key={factor.id}>
            <AnimatedCard delay={index * 100}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {factor.name}
                  </Typography>
                  <Chip
                    label={`${(factor.weight * 100).toFixed(0)}% Gewichtung`}
                    size="small"
                    color={factor.impact === 'positive' ? 'success' : factor.impact === 'negative' ? 'error' : 'default'}
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {factor.description}
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption">Aktueller Wert</Typography>
                    <Typography variant="caption">{factor.currentValue}</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(factor.currentValue || 0) / (factor.recommendedValue || 1) * 100}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">
                    Empfohlen: <strong>{factor.recommendedValue}</strong>
                  </Typography>
                  <IconButton size="small">
                    <TuneIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </AnimatedCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderRecommendationsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          KI-Empfehlungen
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={generatePricingReport}
          >
            Report erstellen
          </Button>
          
          <Button
            variant="contained"
            startIcon={isOptimizing ? <RefreshIcon sx={{ animation: 'rotate 1s linear infinite' }} /> : <PsychologyIcon />}
            onClick={runOptimization}
            disabled={isOptimizing}
          >
            {isOptimizing ? 'Optimiere...' : 'KI-Optimierung'}
          </Button>
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        {recommendations.map((rec, index) => (
          <Grid item xs={12} key={rec.id}>
            <AnimatedCard delay={index * 100}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 40,
                      borderRadius: 1,
                      backgroundColor: getRecommendationColor(rec.type),
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {rec.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {rec.description}
                    </Typography>
                  </Box>
                  
                  <Chip
                    label={rec.priority.toUpperCase()}
                    size="small"
                    color={getPriorityColor(rec.priority)}
                  />
                  
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: getRecommendationColor(rec.type) }}>
                      {rec.type === 'increase' ? '+' : rec.type === 'decrease' ? '-' : ''}
                      €{Math.abs(rec.recommendedPrice - rec.currentPrice)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Konfidenz: {(rec.confidence * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                </Box>
                
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        +€{rec.expectedImpact.revenue.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Umsatz
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: rec.expectedImpact.conversion >= 0 ? 'success.main' : 'error.main' }}>
                        {rec.expectedImpact.conversion >= 0 ? '+' : ''}{rec.expectedImpact.conversion}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Conversion
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: rec.expectedImpact.profit >= 0 ? 'success.main' : 'error.main' }}>
                        {rec.expectedImpact.profit >= 0 ? '+' : ''}€{rec.expectedImpact.profit.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Gewinn
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  {rec.factors.map((factor) => (
                    <Chip key={factor} label={factor} size="small" variant="outlined" />
                  ))}
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Gültig bis: {format(rec.validUntil, 'dd.MM.yyyy', { locale: de })}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined">
                      Details
                    </Button>
                    <Button 
                      size="small" 
                      variant="contained"
                      color={rec.type === 'alert' ? 'error' : 'primary'}
                    >
                      Anwenden
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </AnimatedCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderScenariosTab = () => (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Preisszenarien
      </Typography>
      
      <Grid container spacing={3}>
        {scenarios.map((scenario, index) => (
          <Grid item xs={12} md={4} key={scenario.id}>
            <AnimatedCard delay={index * 100}>
              <Box
                sx={{
                  background: selectedScenario?.id === scenario.id
                    ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.main, 0.8)} 100%)`
                    : `linear-gradient(135deg, ${theme.palette.grey[100]} 0%, ${theme.palette.grey[200]} 100%)`,
                  color: selectedScenario?.id === scenario.id ? 'white' : 'inherit',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {scenario.name}
                    </Typography>
                    <Chip
                      label={`€${scenario.finalPrice}`}
                      sx={{
                        backgroundColor: selectedScenario?.id === scenario.id ? alpha('#fff', 0.2) : theme.palette.primary.main,
                        color: selectedScenario?.id === scenario.id ? 'white' : 'white',
                      }}
                    />
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Basis: €{scenario.basePrice}
                    </Typography>
                    {scenario.adjustments.map((adjustment, i) => (
                      <Typography key={i} variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                        {adjustment.factor}: {adjustment.multiplier > 1 ? '+' : ''}{((adjustment.multiplier - 1) * 100).toFixed(1)}%
                      </Typography>
                    ))}
                  </Box>
                  
                  <Grid container spacing={1} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {scenario.margin}%
                        </Typography>
                        <Typography variant="caption">
                          Marge
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {(scenario.conversionProbability * 100).toFixed(0)}%
                        </Typography>
                        <Typography variant="caption">
                          Conversion
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption">Wettbewerbsfähigkeit</Typography>
                      <Typography variant="caption">{(scenario.competitiveness * 100).toFixed(0)}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={scenario.competitiveness * 100}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: selectedScenario?.id === scenario.id ? alpha('#fff', 0.8) : theme.palette.success.main,
                        },
                      }}
                    />
                  </Box>
                  
                  <Button
                    fullWidth
                    variant={selectedScenario?.id === scenario.id ? "outlined" : "contained"}
                    onClick={() => applyScenario(scenario)}
                    sx={{
                      color: selectedScenario?.id === scenario.id ? 'white' : 'white',
                      borderColor: selectedScenario?.id === scenario.id ? alpha('#fff', 0.5) : 'transparent',
                      backgroundColor: selectedScenario?.id === scenario.id ? 'transparent' : theme.palette.primary.main,
                      '&:hover': {
                        borderColor: selectedScenario?.id === scenario.id ? 'white' : 'transparent',
                        backgroundColor: selectedScenario?.id === scenario.id ? alpha('#fff', 0.1) : theme.palette.primary.dark,
                      },
                    }}
                  >
                    {selectedScenario?.id === scenario.id ? 'Aktiv' : 'Anwenden'}
                  </Button>
                </CardContent>
              </Box>
            </AnimatedCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderMarketTab = () => (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Marktanalyse
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Marktpositionierung
            </Typography>
            
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={marketData.map(m => ({ 
                  x: m.averagePrice, 
                  y: m.competitorCount,
                  z: m.demandLevel === 'high' ? 30 : m.demandLevel === 'medium' ? 20 : 10,
                  name: m.location 
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="x" name="Durchschnittspreis" />
                  <YAxis dataKey="y" name="Konkurrenten" />
                  <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter dataKey="z" fill={theme.palette.primary.main} />
                </ScatterChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Marktposition
            </Typography>
            
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {marketPositionScore.toFixed(0)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Marktposition
              </Typography>
            </Box>
            
            <LinearProgress
              variant="determinate"
              value={marketPositionScore}
              sx={{ height: 12, borderRadius: 6, mb: 2 }}
            />
            
            <Typography variant="caption" color="text.secondary">
              Position im Preissegment des Marktes {location}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Standort</TableCell>
              <TableCell align="right">Ø Preis</TableCell>
              <TableCell align="right">Preisspanne</TableCell>
              <TableCell>Nachfrage</TableCell>
              <TableCell align="right">Konkurrenten</TableCell>
              <TableCell align="right">Saisonalität</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {marketData.map((market) => (
              <TableRow key={market.location} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationIcon color="primary" />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {market.location}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    €{market.averagePrice.toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    €{market.priceRange.min} - €{market.priceRange.max}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={market.demandLevel.toUpperCase()}
                    size="small"
                    sx={{
                      backgroundColor: alpha(getDemandColor(market.demandLevel), 0.1),
                      color: getDemandColor(market.demandLevel),
                    }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {market.competitorCount}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {market.seasonality.toFixed(1)}x
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <Box>
      <GlobalStyles styles={rotateKeyframes} />
      {/* Header */}
      <SlideInContainer>
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoFixHighIcon color="primary" />
              Smart Pricing Recommendations
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Einstellungen">
                <IconButton onClick={() => setIsConfigDialogOpen(true)}>
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
              
              <Button
                variant="contained"
                startIcon={<PsychologyIcon />}
                onClick={runOptimization}
                disabled={isOptimizing}
              >
                {isOptimizing ? 'Optimiere...' : 'KI-Analyse'}
              </Button>
            </Box>
          </Box>
          
          <Typography variant="body1" color="text.secondary">
            KI-gestützte Preisoptimierung basierend auf Marktdaten, Kundenverhalten und Wettbewerbsanalyse
          </Typography>
        </Paper>
      </SlideInContainer>

      {/* Key Metrics */}
      <SlideInContainer delay={200}>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={1}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <MonetizationOnIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      €{currentPrice || 1250}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Aktueller Preis
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
                  <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      +12%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Optimierungspotenzial
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
                  <ShowChartIcon color="info" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      85%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Marktposition
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
                  <CompareArrowsIcon color="warning" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {recommendations.filter(r => r.priority === 'high').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Aktive Empfehlungen
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </SlideInContainer>

      {/* Navigation Tabs */}
      <SlideInContainer delay={400}>
        <Paper elevation={2} sx={{ mb: 4 }}>
          <Tabs
            value={selectedTab}
            onChange={(e, newValue) => setSelectedTab(newValue)}
            variant="fullWidth"
          >
            <Tab label="Faktoren" icon={<TuneIcon />} />
            <Tab label="Empfehlungen" icon={<LightbulbIcon />} />
            <Tab label="Szenarien" icon={<AssessmentIcon />} />
            <Tab label="Marktanalyse" icon={<AnalyticsIcon />} />
          </Tabs>
        </Paper>
      </SlideInContainer>

      {/* Tab Content */}
      <SlideInContainer delay={600}>
        {selectedTab === 0 && renderFactorsTab()}
        {selectedTab === 1 && renderRecommendationsTab()}
        {selectedTab === 2 && renderScenariosTab()}
        {selectedTab === 3 && renderMarketTab()}
      </SlideInContainer>

    </Box>
  );
};

export default SmartPricingRecommendations;