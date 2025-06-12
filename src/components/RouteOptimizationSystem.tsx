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
  LinearProgress,
  Tab,
  Tabs,
  Avatar,
  Slider,
  RadioGroup,
  Radio,
  FormLabel,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
} from '@mui/material';
import {
  Route as RouteIcon,
  Navigation as NavigationIcon,
  Map as MapIcon,
  DirectionsCarFilled as DirectionsCarIcon,
  Speed as SpeedIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Flag as FlagIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  AutoFixHigh as AutoFixHighIcon,
  Psychology as PsychologyIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  LocalGasStation as FuelIcon,
  AccessTime as TimeIcon,
  Euro as EuroIcon,
  Traffic as TrafficIcon,
  Construction as ConstructionIcon,
  CloudQueue as WeatherIcon,
  SwapVert as SwapVertIcon,
  CompareArrows as CompareArrowsIcon,
  TurnRight as TurnRightIcon,
  TurnLeft as TurnLeftIcon,
  Straight as StraightIcon,
  UTurnLeft as UTurnIcon,
  ExpandMore as ExpandMoreIcon,
  MyLocation as MyLocationIcon,
  Explore as ExploreIcon,
  GpsFixed as GpsFixedIcon,
  Layers as LayersIcon,
} from '@mui/icons-material';
import { format, addMinutes, addHours, differenceInMinutes, differenceInHours } from 'date-fns';
import { de } from 'date-fns/locale';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter } from 'recharts';
import { AnimatedCard, SlideInContainer } from './MicroAnimations';

interface Location {
  id: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  type: 'pickup' | 'delivery' | 'depot' | 'service_stop';
  timeWindow?: {
    earliest: string; // HH:mm
    latest: string; // HH:mm
    preferredTime?: string; // HH:mm
  };
  serviceTime: number; // minutes required at this location
  specialRequirements?: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  contactInfo?: {
    name: string;
    phone: string;
    email?: string;
  };
  accessInfo?: {
    parkingAvailable: boolean;
    elevatorAccess: boolean;
    loadingDockAccess: boolean;
    restrictions: string[];
  };
}

interface RouteSegment {
  id: string;
  from: Location;
  to: Location;
  distance: number; // kilometers
  duration: number; // minutes
  trafficCondition: 'light' | 'moderate' | 'heavy' | 'severe';
  roadType: 'highway' | 'arterial' | 'local' | 'residential';
  tolls?: {
    cost: number;
    currency: string;
  };
  restrictions?: {
    weightLimit?: number; // kg
    heightLimit?: number; // meters
    timeRestrictions?: string[];
  };
  difficulty: 1 | 2 | 3 | 4 | 5; // 1 = easy, 5 = very difficult
}

interface OptimizedRoute {
  id: string;
  name: string;
  vehicleId: string;
  driverId: string;
  locations: Location[];
  segments: RouteSegment[];
  optimization: {
    totalDistance: number;
    totalDuration: number; // minutes
    totalFuelCost: number;
    totalTollCost: number;
    co2Emissions: number; // kg
    optimizationScore: number; // 0-100
    algorithmsUsed: string[];
  };
  schedule: {
    startTime: Date;
    endTime: Date;
    breaks: Array<{
      location: string;
      startTime: Date;
      duration: number; // minutes
      type: 'lunch' | 'rest' | 'fuel' | 'maintenance';
    }>;
  };
  status: 'planned' | 'active' | 'completed' | 'cancelled' | 'delayed';
  realTimeData?: {
    currentLocation: {
      latitude: number;
      longitude: number;
    };
    nextLocation: string;
    estimatedArrival: Date;
    delayMinutes: number;
    completedStops: number;
  };
  alternatives?: {
    route: RouteSegment[];
    savings: {
      time: number; // minutes
      distance: number; // km
      cost: number; // euros
    };
  }[];
  weatherConsiderations?: {
    conditions: string[];
    impact: 'none' | 'low' | 'medium' | 'high';
    adjustments: string[];
  };
}

interface TrafficData {
  segmentId: string;
  currentSpeed: number; // km/h
  freeFlowSpeed: number; // km/h
  congestionLevel: number; // 0-100
  incidents: Array<{
    type: 'accident' | 'construction' | 'event' | 'weather';
    severity: 'low' | 'medium' | 'high';
    description: string;
    estimatedClearTime?: Date;
  }>;
  averageDelay: number; // minutes
  lastUpdated: Date;
}

interface OptimizationSettings {
  objectives: {
    minimizeTime: number; // weight 0-100
    minimizeDistance: number; // weight 0-100
    minimizeFuelCost: number; // weight 0-100
    minimizeTolls: number; // weight 0-100
    maximizeCustomerSatisfaction: number; // weight 0-100
  };
  constraints: {
    maxWorkingHours: number;
    mandatoryBreaks: boolean;
    timeWindowCompliance: boolean;
    vehicleCapacityLimits: boolean;
    driverPreferences: boolean;
  };
  algorithms: {
    useGeneticAlgorithm: boolean;
    useSimulatedAnnealing: boolean;
    useAntColonyOptimization: boolean;
    useMachineLearning: boolean;
  };
  realTimeOptimization: {
    enabled: boolean;
    updateInterval: number; // minutes
    trafficDataSources: string[];
    weatherIntegration: boolean;
  };
}

interface RouteAnalytics {
  timeframeStart: Date;
  timeframeEnd: Date;
  metrics: {
    totalRoutes: number;
    averageOptimizationScore: number;
    totalDistanceSaved: number; // km
    totalTimeSaved: number; // hours
    totalCostSaved: number; // euros
    customerSatisfactionScore: number;
    fuelEfficiencyImprovement: number; // percentage
    onTimeDeliveryRate: number; // percentage
  };
  trends: Array<{
    date: Date;
    routesCompleted: number;
    averageDelay: number;
    fuelConsumption: number;
    customerRating: number;
  }>;
  comparisons: {
    beforeOptimization: {
      averageDistance: number;
      averageTime: number;
      averageCost: number;
    };
    afterOptimization: {
      averageDistance: number;
      averageTime: number;
      averageCost: number;
    };
    improvement: {
      distance: number; // percentage
      time: number; // percentage
      cost: number; // percentage
    };
  };
}

interface RouteOptimizationSystemProps {
  onRouteOptimized?: (route: OptimizedRoute) => void;
  onRouteStarted?: (routeId: string) => void;
  onRouteCompleted?: (routeId: string, metrics: any) => void;
  initialLocations?: Location[];
  defaultSettings?: Partial<OptimizationSettings>;
}

const RouteOptimizationSystem: React.FC<RouteOptimizationSystemProps> = ({
  onRouteOptimized,
  onRouteStarted,
  onRouteCompleted,
  initialLocations = [],
  defaultSettings = {},
}) => {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState(0);
  const [locations, setLocations] = useState<Location[]>(initialLocations);
  const [routes, setRoutes] = useState<OptimizedRoute[]>([]);
  const [trafficData, setTrafficData] = useState<TrafficData[]>([]);
  const [analytics, setAnalytics] = useState<RouteAnalytics | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<OptimizedRoute | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isRouteDetailOpen, setIsRouteDetailOpen] = useState(false);
  const [optimizationSettings, setOptimizationSettings] = useState<OptimizationSettings>({
    objectives: {
      minimizeTime: 80,
      minimizeDistance: 60,
      minimizeFuelCost: 70,
      minimizeTolls: 40,
      maximizeCustomerSatisfaction: 90,
    },
    constraints: {
      maxWorkingHours: 8,
      mandatoryBreaks: true,
      timeWindowCompliance: true,
      vehicleCapacityLimits: true,
      driverPreferences: true,
    },
    algorithms: {
      useGeneticAlgorithm: true,
      useSimulatedAnnealing: true,
      useAntColonyOptimization: false,
      useMachineLearning: true,
    },
    realTimeOptimization: {
      enabled: true,
      updateInterval: 15,
      trafficDataSources: ['Google Maps', 'HERE', 'TomTom'],
      weatherIntegration: true,
    },
    ...defaultSettings,
  });

  useEffect(() => {
    initializeData();
    const interval = setInterval(updateTrafficData, 5 * 60 * 1000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const initializeData = () => {
    // Initialize sample locations
    const sampleLocations: Location[] = [
      {
        id: 'depot',
        name: 'Relocato Depot',
        address: 'Industriestraße 45, 10318 Berlin',
        coordinates: { latitude: 52.4870, longitude: 13.4390 },
        type: 'depot',
        serviceTime: 15,
        priority: 'high',
        accessInfo: {
          parkingAvailable: true,
          elevatorAccess: false,
          loadingDockAccess: true,
          restrictions: [],
        },
      },
      {
        id: 'pickup-1',
        name: 'Wohnung Müller',
        address: 'Kantstraße 123, 10623 Berlin',
        coordinates: { latitude: 52.5069, longitude: 13.3275 },
        type: 'pickup',
        timeWindow: { earliest: '08:00', latest: '12:00', preferredTime: '09:00' },
        serviceTime: 45,
        priority: 'high',
        contactInfo: {
          name: 'Familie Müller',
          phone: '+49 30 12345678',
          email: 'mueller@example.com',
        },
        specialRequirements: ['Klaviertransport', 'Verpackungsmaterial'],
        accessInfo: {
          parkingAvailable: false,
          elevatorAccess: true,
          loadingDockAccess: false,
          restrictions: ['Halteverbot beantragen'],
        },
      },
      {
        id: 'delivery-1',
        name: 'Neue Wohnung Müller',
        address: 'Prenzlauer Allee 234, 10405 Berlin',
        coordinates: { latitude: 52.5316, longitude: 13.4194 },
        type: 'delivery',
        timeWindow: { earliest: '13:00', latest: '17:00', preferredTime: '14:00' },
        serviceTime: 60,
        priority: 'high',
        contactInfo: {
          name: 'Familie Müller',
          phone: '+49 30 12345678',
        },
        accessInfo: {
          parkingAvailable: true,
          elevatorAccess: false,
          loadingDockAccess: false,
          restrictions: ['3. Stock ohne Aufzug'],
        },
      },
      {
        id: 'pickup-2',
        name: 'Büroumzug Schmidt',
        address: 'Friedrichstraße 50, 10117 Berlin',
        coordinates: { latitude: 52.5170, longitude: 13.3888 },
        type: 'pickup',
        timeWindow: { earliest: '07:00', latest: '11:00', preferredTime: '08:00' },
        serviceTime: 90,
        priority: 'medium',
        contactInfo: {
          name: 'Schmidt GmbH',
          phone: '+49 30 98765432',
          email: 'office@schmidt-gmbh.de',
        },
        specialRequirements: ['IT-Equipment', 'Akten', 'Büromöbel'],
        accessInfo: {
          parkingAvailable: true,
          elevatorAccess: true,
          loadingDockAccess: true,
          restrictions: [],
        },
      },
      {
        id: 'delivery-2',
        name: 'Neues Büro Schmidt',
        address: 'Alexanderplatz 1, 10178 Berlin',
        coordinates: { latitude: 52.5219, longitude: 13.4132 },
        type: 'delivery',
        timeWindow: { earliest: '12:00', latest: '16:00', preferredTime: '13:00' },
        serviceTime: 75,
        priority: 'medium',
        contactInfo: {
          name: 'Schmidt GmbH',
          phone: '+49 30 98765432',
        },
        accessInfo: {
          parkingAvailable: true,
          elevatorAccess: true,
          loadingDockAccess: true,
          restrictions: ['Anmeldung beim Empfang'],
        },
      },
    ];

    // Generate sample routes
    const sampleRoutes: OptimizedRoute[] = [
      {
        id: 'route-1',
        name: 'Route Berlin Nord - Heute',
        vehicleId: 'vehicle-1',
        driverId: 'driver-1',
        locations: [sampleLocations[0], sampleLocations[1], sampleLocations[2]],
        segments: [
          {
            id: 'seg-1',
            from: sampleLocations[0],
            to: sampleLocations[1],
            distance: 12.5,
            duration: 35,
            trafficCondition: 'moderate',
            roadType: 'arterial',
            difficulty: 2,
          },
          {
            id: 'seg-2',
            from: sampleLocations[1],
            to: sampleLocations[2],
            distance: 8.3,
            duration: 28,
            trafficCondition: 'light',
            roadType: 'local',
            difficulty: 3,
          },
        ],
        optimization: {
          totalDistance: 20.8,
          totalDuration: 123, // 63 minutes driving + 60 minutes service time
          totalFuelCost: 18.50,
          totalTollCost: 0,
          co2Emissions: 4.2,
          optimizationScore: 87,
          algorithmsUsed: ['Genetic Algorithm', 'Machine Learning'],
        },
        schedule: {
          startTime: new Date(),
          endTime: addMinutes(new Date(), 123),
          breaks: [
            {
              location: 'Rastplatz A10',
              startTime: addMinutes(new Date(), 60),
              duration: 15,
              type: 'rest',
            },
          ],
        },
        status: 'active',
        realTimeData: {
          currentLocation: { latitude: 52.4970, longitude: 13.3500 },
          nextLocation: 'pickup-1',
          estimatedArrival: addMinutes(new Date(), 15),
          delayMinutes: 5,
          completedStops: 1,
        },
        alternatives: [
          {
            route: [],
            savings: { time: 12, distance: 2.1, cost: 3.20 },
          },
        ],
        weatherConsiderations: {
          conditions: ['Leichter Regen'],
          impact: 'low',
          adjustments: ['Verlängerte Fahrzeiten', 'Vorsichtigere Fahrt'],
        },
      },
    ];

    // Initialize analytics
    const sampleAnalytics: RouteAnalytics = {
      timeframeStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      timeframeEnd: new Date(),
      metrics: {
        totalRoutes: 156,
        averageOptimizationScore: 85.3,
        totalDistanceSaved: 2340,
        totalTimeSaved: 78.5,
        totalCostSaved: 1250,
        customerSatisfactionScore: 4.6,
        fuelEfficiencyImprovement: 18.7,
        onTimeDeliveryRate: 94.2,
      },
      trends: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
        routesCompleted: Math.floor(Math.random() * 10) + 3,
        averageDelay: Math.random() * 15,
        fuelConsumption: Math.random() * 50 + 150,
        customerRating: Math.random() * 1 + 4,
      })),
      comparisons: {
        beforeOptimization: {
          averageDistance: 45.2,
          averageTime: 156,
          averageCost: 65.80,
        },
        afterOptimization: {
          averageDistance: 38.7,
          averageTime: 128,
          averageCost: 52.30,
        },
        improvement: {
          distance: 14.4,
          time: 17.9,
          cost: 20.5,
        },
      },
    };

    setLocations([...sampleLocations, ...initialLocations]);
    setRoutes(sampleRoutes);
    setAnalytics(sampleAnalytics);
  };

  const updateTrafficData = () => {
    // Simulate real-time traffic data updates
    const newTrafficData: TrafficData[] = routes.flatMap(route =>
      route.segments.map(segment => ({
        segmentId: segment.id,
        currentSpeed: Math.random() * 30 + 20, // 20-50 km/h
        freeFlowSpeed: 50,
        congestionLevel: Math.random() * 80, // 0-80%
        incidents: Math.random() > 0.8 ? [{
          type: ['accident', 'construction', 'event'][Math.floor(Math.random() * 3)] as any,
          severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
          description: 'Verkehrsbehinderung',
          estimatedClearTime: addMinutes(new Date(), Math.random() * 60),
        }] : [],
        averageDelay: Math.random() * 10,
        lastUpdated: new Date(),
      }))
    );
    
    setTrafficData(newTrafficData);
  };

  const optimizeRoutes = async () => {
    setIsOptimizing(true);
    
    // Simulate AI-powered route optimization
    setTimeout(() => {
      const optimizedRoute: OptimizedRoute = {
        id: `route-${Date.now()}`,
        name: `Optimierte Route ${format(new Date(), 'dd.MM.yyyy HH:mm')}`,
        vehicleId: 'vehicle-1',
        driverId: 'driver-1',
        locations: locations.filter(l => l.type !== 'depot'),
        segments: [],
        optimization: {
          totalDistance: Math.random() * 50 + 30,
          totalDuration: Math.random() * 180 + 120,
          totalFuelCost: Math.random() * 30 + 20,
          totalTollCost: Math.random() * 10,
          co2Emissions: Math.random() * 10 + 5,
          optimizationScore: Math.random() * 20 + 80,
          algorithmsUsed: ['Genetic Algorithm', 'Simulated Annealing', 'Machine Learning'],
        },
        schedule: {
          startTime: new Date(),
          endTime: addHours(new Date(), 6),
          breaks: [],
        },
        status: 'planned',
      };
      
      setRoutes(prev => [optimizedRoute, ...prev]);
      onRouteOptimized?.(optimizedRoute);
      setIsOptimizing(false);
      
      // Show success message
      alert(`Route erfolgreich optimiert! Einsparungen: ${optimizedRoute.optimization.optimizationScore}% Effizienz`);
    }, 3000);
  };

  const getTrafficConditionColor = (condition: string) => {
    switch (condition) {
      case 'light': return theme.palette.success.main;
      case 'moderate': return theme.palette.warning.main;
      case 'heavy': return theme.palette.error.main;
      case 'severe': return theme.palette.error.dark;
      default: return theme.palette.grey[500];
    }
  };

  const getStatusColor = (status: OptimizedRoute['status']) => {
    switch (status) {
      case 'planned': return 'info';
      case 'active': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'delayed': return 'error';
      default: return 'default';
    }
  };

  const renderRouteOverview = () => (
    <Grid container spacing={3}>
      {routes.map((route, index) => (
        <Grid item xs={12} md={6} lg={4} key={route.id}>
          <AnimatedCard delay={index * 100}>
            <Box
              sx={{
                background: route.status === 'active'
                  ? `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${alpha(theme.palette.warning.main, 0.8)} 100%)`
                  : route.status === 'completed'
                  ? `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${alpha(theme.palette.success.main, 0.8)} 100%)`
                  : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.main, 0.8)} 100%)`,
                color: 'white',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <RouteIcon sx={{ fontSize: 40 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {route.name}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {route.locations.length} Stopps • {route.optimization.totalDistance.toFixed(1)} km
                    </Typography>
                  </Box>
                  
                  <Chip
                    label={route.status}
                    sx={{
                      backgroundColor: alpha('#fff', 0.2),
                      color: 'white',
                    }}
                  />
                </Box>
                
                {route.realTimeData && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, opacity: 0.9 }}>
                      Aktueller Status:
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block' }}>
                      Nächster Stopp: {route.realTimeData.nextLocation}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block' }}>
                      ETA: {format(route.realTimeData.estimatedArrival, 'HH:mm')}
                    </Typography>
                    {route.realTimeData.delayMinutes > 0 && (
                      <Typography variant="caption" sx={{ display: 'block', color: alpha('#fff', 0.8) }}>
                        Verspätung: {route.realTimeData.delayMinutes} Min.
                      </Typography>
                    )}
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {route.optimization.optimizationScore}%
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Effizienz
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {Math.floor(route.optimization.totalDuration / 60)}h {route.optimization.totalDuration % 60}m
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Dauer
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      €{route.optimization.totalFuelCost.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Kraftstoff
                    </Typography>
                  </Box>
                </Box>
                
                <LinearProgress
                  variant="determinate"
                  value={route.realTimeData ? (route.realTimeData.completedStops / route.locations.length) * 100 : 0}
                  sx={{
                    mb: 2,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: alpha('#fff', 0.8),
                    },
                    backgroundColor: alpha('#fff', 0.2),
                  }}
                />
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setSelectedRoute(route);
                      setIsRouteDetailOpen(true);
                    }}
                    sx={{
                      color: 'white',
                      borderColor: alpha('#fff', 0.5),
                      '&:hover': {
                        borderColor: 'white',
                        backgroundColor: alpha('#fff', 0.1),
                      },
                    }}
                  >
                    Details
                  </Button>
                  {route.status === 'planned' && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => onRouteStarted?.(route.id)}
                      sx={{
                        color: 'white',
                        borderColor: alpha('#fff', 0.5),
                        '&:hover': {
                          borderColor: 'white',
                          backgroundColor: alpha('#fff', 0.1),
                        },
                      }}
                    >
                      Starten
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Box>
          </AnimatedCard>
        </Grid>
      ))}
    </Grid>
  );

  const renderLocationManagement = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Standorte verwalten
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsLocationDialogOpen(true)}
        >
          Neuer Standort
        </Button>
      </Box>
      
      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Adresse</TableCell>
              <TableCell>Typ</TableCell>
              <TableCell>Zeitfenster</TableCell>
              <TableCell>Service Zeit</TableCell>
              <TableCell>Priorität</TableCell>
              <TableCell>Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {locations.map((location) => (
              <TableRow key={location.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationIcon color="primary" />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {location.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {location.address}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={location.type}
                    size="small"
                    color={
                      location.type === 'depot' ? 'primary' :
                      location.type === 'pickup' ? 'warning' :
                      location.type === 'delivery' ? 'success' : 'default'
                    }
                  />
                </TableCell>
                <TableCell>
                  {location.timeWindow ? (
                    <Typography variant="caption">
                      {location.timeWindow.earliest} - {location.timeWindow.latest}
                    </Typography>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      Flexibel
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {location.serviceTime} Min.
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={location.priority.toUpperCase()}
                    size="small"
                    color={
                      location.priority === 'critical' ? 'error' :
                      location.priority === 'high' ? 'warning' :
                      location.priority === 'medium' ? 'info' : 'default'
                    }
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Bearbeiten">
                      <IconButton size="small">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Löschen">
                      <IconButton size="small">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderAnalyticsDashboard = () => {
    if (!analytics) return null;

    const trendData = analytics.trends.slice(-7); // Last 7 days

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={1}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {analytics.metrics.averageOptimizationScore.toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Ø Optimierung
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
                    <RouteIcon color="primary" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {analytics.metrics.totalDistanceSaved.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        km gespart
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
                    <EuroIcon color="warning" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        €{analytics.metrics.totalCostSaved.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Kosten gespart
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
                    <CheckCircleIcon color="info" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {analytics.metrics.onTimeDeliveryRate.toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pünktlichkeit
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Routen-Performance (7 Tage)
            </Typography>
            
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), 'dd.MM')} />
                  <YAxis />
                  <RechartsTooltip 
                    labelFormatter={(date) => format(new Date(date), 'dd.MM.yyyy')}
                  />
                  <Legend />
                  <Line dataKey="routesCompleted" stroke={theme.palette.primary.main} name="Routen" />
                  <Line dataKey="averageDelay" stroke={theme.palette.error.main} name="Ø Verspätung (Min)" />
                  <Line dataKey="customerRating" stroke={theme.palette.success.main} name="Kundenbewertung" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Verbesserungen durch Optimierung
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Entfernung: -{analytics.comparisons.improvement.distance.toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={analytics.comparisons.improvement.distance}
                sx={{ height: 8, borderRadius: 4, mb: 2 }}
              />
              
              <Typography variant="body2" sx={{ mb: 1 }}>
                Zeit: -{analytics.comparisons.improvement.time.toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={analytics.comparisons.improvement.time}
                color="warning"
                sx={{ height: 8, borderRadius: 4, mb: 2 }}
              />
              
              <Typography variant="body2" sx={{ mb: 1 }}>
                Kosten: -{analytics.comparisons.improvement.cost.toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={analytics.comparisons.improvement.cost}
                color="success"
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const renderTrafficMonitoring = () => (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Echtzeit-Verkehrsmonitoring
      </Typography>
      
      <Grid container spacing={3}>
        {trafficData.map((data, index) => (
          <Grid item xs={12} md={6} lg={4} key={data.segmentId}>
            <AnimatedCard delay={index * 100}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <TrafficIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Segment {data.segmentId}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Geschwindigkeit</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {data.currentSpeed.toFixed(0)} km/h
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(data.currentSpeed / data.freeFlowSpeed) * 100}
                    sx={{ height: 6, borderRadius: 3, mb: 1 }}
                  />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Verkehrsdichte</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {data.congestionLevel.toFixed(0)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={data.congestionLevel}
                    color={data.congestionLevel > 70 ? 'error' : data.congestionLevel > 40 ? 'warning' : 'success'}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
                
                {data.incidents.length > 0 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      {data.incidents[0].description}
                    </Typography>
                  </Alert>
                )}
                
                <Typography variant="caption" color="text.secondary">
                  Aktualisiert: {format(data.lastUpdated, 'HH:mm:ss')}
                </Typography>
              </CardContent>
            </AnimatedCard>
          </Grid>
        ))}
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
              <NavigationIcon color="primary" />
              Route Optimization System
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<SettingsIcon />}
                onClick={() => setIsSettingsDialogOpen(true)}
              >
                Einstellungen
              </Button>
              
              <Button
                variant="contained"
                startIcon={isOptimizing ? <RefreshIcon className="rotating" /> : <AutoFixHighIcon />}
                onClick={optimizeRoutes}
                disabled={isOptimizing || locations.length < 2}
              >
                {isOptimizing ? 'Optimiere...' : 'Routen optimieren'}
              </Button>
            </Box>
          </Box>
          
          <Typography variant="body1" color="text.secondary">
            KI-gestützte Routenoptimierung mit Echtzeit-Verkehrsdaten und intelligenter Ressourcenplanung
          </Typography>
        </Paper>
      </SlideInContainer>

      {/* Quick Stats */}
      <SlideInContainer delay={200}>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={1}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <RouteIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {routes.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Aktive Routen
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
                  <LocationIcon color="success" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {locations.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Standorte
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
                  <SpeedIcon color="info" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {analytics?.metrics.averageOptimizationScore.toFixed(0) || 0}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ø Effizienz
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
                  <TrafficIcon color="warning" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {trafficData.filter(t => t.congestionLevel > 50).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Verkehrsstörungen
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
            <Tab label="Routen-Übersicht" icon={<RouteIcon />} />
            <Tab label="Standorte" icon={<LocationIcon />} />
            <Tab label="Analytics" icon={<AssessmentIcon />} />
            <Tab label="Verkehr" icon={<TrafficIcon />} />
          </Tabs>
        </Paper>
      </SlideInContainer>

      {/* Tab Content */}
      <SlideInContainer delay={600}>
        {selectedTab === 0 && renderRouteOverview()}
        {selectedTab === 1 && renderLocationManagement()}
        {selectedTab === 2 && renderAnalyticsDashboard()}
        {selectedTab === 3 && renderTrafficMonitoring()}
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

export default RouteOptimizationSystem;