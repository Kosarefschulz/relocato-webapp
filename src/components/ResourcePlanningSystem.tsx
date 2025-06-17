import React, { useState, useEffect, useMemo } from 'react';
import { Box, Card, CardContent, Typography, Paper, Button, TextField, FormControl, InputLabel, Select, MenuItem, IconButton, Chip, List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction, Divider, useTheme, alpha, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Switch, FormControlLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress, Tab, Tabs, Avatar, AvatarGroup, Badge, Accordion, AccordionSummary, AccordionDetails, CircularProgress, Slider, RadioGroup, Radio, FormLabel, Stepper, Step, StepLabel, StepContent, GlobalStyles } from '@mui/material';
import Grid from './GridCompat';
import {
  People as PeopleIcon,
  LocalShipping as TruckIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Star as StarIcon,
  Build as BuildIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  Work as WorkIcon,
  DirectionsCar as CarIcon,
  LocalGasStation as FuelIcon,
  CalendarToday as CalendarIcon,
  Notifications as NotificationsIcon,
  Analytics as AnalyticsIcon,
  GroupWork as GroupWorkIcon,
  Engineering as EngineeringIcon,
  Handyman as HandymanIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  AutoAwesome as AutoAwesomeIcon,
  Psychology as PsychologyIcon,
  Today as TodayIcon,
  Event as EventIcon,
  Alarm as AlarmIcon,
} from '@mui/icons-material';
import { format, addDays, addHours, startOfWeek, endOfWeek, isToday, isSameDay, differenceInDays, differenceInHours } from 'date-fns';
import { de } from 'date-fns/locale';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { AnimatedCard, SlideInContainer } from './MicroAnimations';

interface CrewMember {
  id: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    avatar?: string;
    dateOfBirth: Date;
    address: string;
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  employment: {
    employeeId: string;
    startDate: Date;
    contractType: 'full_time' | 'part_time' | 'contractor' | 'temporary';
    salary: number;
    department: string;
    supervisor: string;
  };
  role: {
    primary: 'team_leader' | 'driver' | 'mover' | 'helper' | 'specialist';
    secondary?: string[];
    level: 'junior' | 'mid' | 'senior' | 'expert';
  };
  skills: {
    id: string;
    name: string;
    level: 1 | 2 | 3 | 4 | 5;
    certified: boolean;
    certificationDate?: Date;
  }[];
  availability: {
    defaultSchedule: {
      monday: { start: string; end: string; available: boolean };
      tuesday: { start: string; end: string; available: boolean };
      wednesday: { start: string; end: string; available: boolean };
      thursday: { start: string; end: string; available: boolean };
      friday: { start: string; end: string; available: boolean };
      saturday: { start: string; end: string; available: boolean };
      sunday: { start: string; end: string; available: boolean };
    };
    exceptions: Array<{
      date: Date;
      type: 'vacation' | 'sick' | 'training' | 'unavailable';
      reason: string;
    }>;
    maxHoursPerWeek: number;
    overtimeAllowed: boolean;
  };
  performance: {
    rating: number;
    reviews: Array<{
      date: Date;
      reviewer: string;
      rating: number;
      comments: string;
    }>;
    completedJobs: number;
    avgJobRating: number;
    punctuality: number;
    reliability: number;
  };
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  preferences: {
    preferredRegions: string[];
    maxTravelDistance: number;
    preferredJobTypes: string[];
    teamPreferences: string[];
  };
}

interface Vehicle {
  id: string;
  basicInfo: {
    name: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    vin: string;
    registrationExpiry: Date;
    insuranceExpiry: Date;
  };
  specifications: {
    type: 'small_truck' | 'medium_truck' | 'large_truck' | 'van' | 'trailer' | 'special';
    capacity: {
      volume: number; // cubic meters
      weight: number; // kg
      maxLength: number; // meters
    };
    features: string[];
    fuelType: 'diesel' | 'gasoline' | 'electric' | 'hybrid';
    emissionClass: string;
  };
  location: {
    current: {
      latitude: number;
      longitude: number;
      address: string;
      lastUpdated: Date;
    };
    home: {
      latitude: number;
      longitude: number;
      address: string;
    };
  };
  status: {
    operational: 'available' | 'in_use' | 'maintenance' | 'out_of_service' | 'retired';
    fuel: {
      level: number; // percentage
      lastRefuel: Date;
      capacity: number; // liters
    };
    mileage: {
      current: number;
      lastService: number;
      nextServiceDue: number;
    };
    condition: {
      overall: 1 | 2 | 3 | 4 | 5;
      issues: Array<{
        id: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        description: string;
        reportedDate: Date;
        reportedBy: string;
      }>;
    };
  };
  maintenance: {
    schedule: Array<{
      type: 'oil_change' | 'inspection' | 'tire_change' | 'brake_service' | 'general';
      dueDate: Date;
      dueMileage: number;
      priority: 'low' | 'medium' | 'high' | 'urgent';
      estimatedDuration: number; // hours
      estimatedCost: number;
    }>;
    history: Array<{
      date: Date;
      type: string;
      description: string;
      cost: number;
      mileage: number;
      workshop: string;
    }>;
  };
  utilization: {
    hoursUsedToday: number;
    hoursUsedWeek: number;
    hoursUsedMonth: number;
    averageDailyDistance: number;
    efficiency: number; // jobs per hour
  };
  costs: {
    acquisition: number;
    monthlyInsurance: number;
    avgMaintenanceCost: number;
    avgFuelCost: number;
    depreciation: number;
  };
}

interface ResourceAllocation {
  id: string;
  jobId: string;
  crewMembers: {
    memberId: string;
    role: string;
    estimatedHours: number;
    actualHours?: number;
  }[];
  vehicles: {
    vehicleId: string;
    estimatedUsage: number; // hours
    actualUsage?: number;
  }[];
  allocation: {
    date: Date;
    startTime: string;
    endTime: string;
    estimatedDuration: number;
    actualDuration?: number;
  };
  status: 'planned' | 'active' | 'completed' | 'cancelled' | 'delayed';
  efficiency: {
    planned: number;
    actual?: number;
    variance?: number;
  };
}

interface ResourceOptimization {
  id: string;
  analysisDate: Date;
  recommendations: Array<{
    type: 'crew_reallocation' | 'vehicle_reassignment' | 'schedule_optimization' | 'capacity_adjustment';
    priority: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    expectedImprovement: {
      efficiency: number;
      cost: number;
      utilization: number;
    };
    implementation: {
      effort: 'low' | 'medium' | 'high';
      timeframe: string;
      requirements: string[];
    };
  }>;
  metrics: {
    currentUtilization: number;
    optimizedUtilization: number;
    currentCosts: number;
    optimizedCosts: number;
    currentEfficiency: number;
    optimizedEfficiency: number;
  };
}

interface ResourcePlanningSystemProps {
  onCrewUpdated?: (crew: CrewMember) => void;
  onVehicleUpdated?: (vehicle: Vehicle) => void;
  onAllocationCreated?: (allocation: ResourceAllocation) => void;
  onOptimizationCompleted?: (optimization: ResourceOptimization) => void;
}

const ResourcePlanningSystem: React.FC<ResourcePlanningSystemProps> = ({
  onCrewUpdated,
  onVehicleUpdated,
  onAllocationCreated,
  onOptimizationCompleted,
}) => {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState(0);
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [allocations, setAllocations] = useState<ResourceAllocation[]>([]);
  const [optimizations, setOptimizations] = useState<ResourceOptimization[]>([]);
  const [selectedCrew, setSelectedCrew] = useState<CrewMember | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isCrewDialogOpen, setIsCrewDialogOpen] = useState(false);
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
  const [isOptimizationDialogOpen, setIsOptimizationDialogOpen] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'analysis'>('overview');

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = () => {
    // Initialize crew members with comprehensive data
    const sampleCrew: CrewMember[] = [
      {
        id: 'crew-1',
        personalInfo: {
          firstName: 'Max',
          lastName: 'Müller',
          email: 'max.mueller@relocato.de',
          phone: '+49 151 12345678',
          dateOfBirth: new Date('1985-03-15'),
          address: 'Musterstraße 123, 10115 Berlin',
          emergencyContact: {
            name: 'Anna Müller',
            phone: '+49 151 87654321',
            relationship: 'Ehefrau',
          },
        },
        employment: {
          employeeId: 'EMP001',
          startDate: new Date('2020-01-15'),
          contractType: 'full_time',
          salary: 45000,
          department: 'Operations',
          supervisor: 'Klaus Weber',
        },
        role: {
          primary: 'team_leader',
          secondary: ['driver', 'trainer'],
          level: 'senior',
        },
        skills: [
          { id: 'skill-1', name: 'Teamführung', level: 5, certified: true, certificationDate: new Date('2021-06-01') },
          { id: 'skill-2', name: 'Schwerlasttransport', level: 4, certified: true, certificationDate: new Date('2020-09-15') },
          { id: 'skill-3', name: 'Klaviertransport', level: 5, certified: true, certificationDate: new Date('2021-03-10') },
          { id: 'skill-4', name: 'Gefahrguttransport', level: 3, certified: false },
        ],
        availability: {
          defaultSchedule: {
            monday: { start: '07:00', end: '16:00', available: true },
            tuesday: { start: '07:00', end: '16:00', available: true },
            wednesday: { start: '07:00', end: '16:00', available: true },
            thursday: { start: '07:00', end: '16:00', available: true },
            friday: { start: '07:00', end: '16:00', available: true },
            saturday: { start: '08:00', end: '14:00', available: true },
            sunday: { start: '00:00', end: '00:00', available: false },
          },
          exceptions: [
            { date: addDays(new Date(), 10), type: 'vacation', reason: 'Jahresurlaub' },
            { date: addDays(new Date(), 11), type: 'vacation', reason: 'Jahresurlaub' },
          ],
          maxHoursPerWeek: 48,
          overtimeAllowed: true,
        },
        performance: {
          rating: 4.8,
          reviews: [
            { date: new Date('2023-12-01'), reviewer: 'Klaus Weber', rating: 5, comments: 'Exzellente Führungsqualitäten' },
            { date: new Date('2023-06-01'), reviewer: 'Klaus Weber', rating: 4.5, comments: 'Sehr zuverlässig und kompetent' },
          ],
          completedJobs: 287,
          avgJobRating: 4.7,
          punctuality: 98,
          reliability: 96,
        },
        status: 'active',
        preferences: {
          preferredRegions: ['Berlin', 'Brandenburg'],
          maxTravelDistance: 100,
          preferredJobTypes: ['premium', 'commercial'],
          teamPreferences: ['crew-2', 'crew-3'],
        },
      },
      {
        id: 'crew-2',
        personalInfo: {
          firstName: 'Stefan',
          lastName: 'Schmidt',
          email: 'stefan.schmidt@relocato.de',
          phone: '+49 151 23456789',
          dateOfBirth: new Date('1990-07-22'),
          address: 'Hauptstraße 456, 10117 Berlin',
          emergencyContact: {
            name: 'Maria Schmidt',
            phone: '+49 151 98765432',
            relationship: 'Mutter',
          },
        },
        employment: {
          employeeId: 'EMP002',
          startDate: new Date('2021-03-01'),
          contractType: 'full_time',
          salary: 38000,
          department: 'Operations',
          supervisor: 'Max Müller',
        },
        role: {
          primary: 'driver',
          secondary: ['mover'],
          level: 'mid',
        },
        skills: [
          { id: 'skill-5', name: 'LKW-Führerschein CE', level: 5, certified: true, certificationDate: new Date('2018-05-01') },
          { id: 'skill-6', name: 'Stadtfahrten', level: 4, certified: false },
          { id: 'skill-7', name: 'Fernfahrten', level: 3, certified: false },
          { id: 'skill-8', name: 'Ladungssicherung', level: 4, certified: true, certificationDate: new Date('2021-08-15') },
        ],
        availability: {
          defaultSchedule: {
            monday: { start: '06:00', end: '15:00', available: true },
            tuesday: { start: '06:00', end: '15:00', available: true },
            wednesday: { start: '06:00', end: '15:00', available: true },
            thursday: { start: '06:00', end: '15:00', available: true },
            friday: { start: '06:00', end: '15:00', available: true },
            saturday: { start: '07:00', end: '13:00', available: true },
            sunday: { start: '00:00', end: '00:00', available: false },
          },
          exceptions: [],
          maxHoursPerWeek: 45,
          overtimeAllowed: true,
        },
        performance: {
          rating: 4.5,
          reviews: [
            { date: new Date('2023-11-01'), reviewer: 'Max Müller', rating: 4.5, comments: 'Sehr sicherer Fahrer' },
          ],
          completedJobs: 156,
          avgJobRating: 4.4,
          punctuality: 95,
          reliability: 92,
        },
        status: 'active',
        preferences: {
          preferredRegions: ['Berlin', 'Hamburg'],
          maxTravelDistance: 200,
          preferredJobTypes: ['standard', 'express'],
          teamPreferences: ['crew-1', 'crew-3'],
        },
      },
      // Add more crew members...
    ];

    // Initialize vehicles with comprehensive data
    const sampleVehicles: Vehicle[] = [
      {
        id: 'vehicle-1',
        basicInfo: {
          name: 'Relocato Truck Alpha',
          make: 'Mercedes-Benz',
          model: 'Atego 1218',
          year: 2022,
          licensePlate: 'B-RL 1001',
          vin: 'WDB9700451L123456',
          registrationExpiry: new Date('2025-06-30'),
          insuranceExpiry: new Date('2024-12-31'),
        },
        specifications: {
          type: 'large_truck',
          capacity: {
            volume: 40,
            weight: 3500,
            maxLength: 6.2,
          },
          features: ['Hebebühne', 'GPS-Tracking', 'Klimaanlage', 'Rückfahrkamera'],
          fuelType: 'diesel',
          emissionClass: 'Euro 6',
        },
        location: {
          current: {
            latitude: 52.5200,
            longitude: 13.4050,
            address: 'Berlin Mitte, Potsdamer Platz',
            lastUpdated: new Date(),
          },
          home: {
            latitude: 52.4870,
            longitude: 13.4390,
            address: 'Relocato Depot, Berlin Kreuzberg',
          },
        },
        status: {
          operational: 'available',
          fuel: {
            level: 85,
            lastRefuel: addDays(new Date(), -2),
            capacity: 120,
          },
          mileage: {
            current: 45678,
            lastService: 44000,
            nextServiceDue: 50000,
          },
          condition: {
            overall: 4,
            issues: [],
          },
        },
        maintenance: {
          schedule: [
            {
              type: 'oil_change',
              dueDate: addDays(new Date(), 30),
              dueMileage: 50000,
              priority: 'medium',
              estimatedDuration: 2,
              estimatedCost: 150,
            },
            {
              type: 'inspection',
              dueDate: addDays(new Date(), 60),
              dueMileage: 55000,
              priority: 'high',
              estimatedDuration: 4,
              estimatedCost: 300,
            },
          ],
          history: [
            {
              date: addDays(new Date(), -90),
              type: 'Inspektion',
              description: 'Hauptuntersuchung und Service',
              cost: 450,
              mileage: 44000,
              workshop: 'Mercedes Service Berlin',
            },
          ],
        },
        utilization: {
          hoursUsedToday: 6,
          hoursUsedWeek: 32,
          hoursUsedMonth: 128,
          averageDailyDistance: 85,
          efficiency: 2.3,
        },
        costs: {
          acquisition: 85000,
          monthlyInsurance: 280,
          avgMaintenanceCost: 450,
          avgFuelCost: 650,
          depreciation: 850,
        },
      },
      {
        id: 'vehicle-2',
        basicInfo: {
          name: 'Relocato Van Beta',
          make: 'Volkswagen',
          model: 'Crafter',
          year: 2021,
          licensePlate: 'B-RL 2001',
          vin: 'WV1ZZZ2HZLH123456',
          registrationExpiry: new Date('2024-08-31'),
          insuranceExpiry: new Date('2024-12-31'),
        },
        specifications: {
          type: 'van',
          capacity: {
            volume: 15,
            weight: 1500,
            maxLength: 3.7,
          },
          features: ['Schiebetür', 'GPS-Tracking', 'Heizung'],
          fuelType: 'diesel',
          emissionClass: 'Euro 6',
        },
        location: {
          current: {
            latitude: 52.5170,
            longitude: 13.3890,
            address: 'Berlin Charlottenburg',
            lastUpdated: addHours(new Date(), -1),
          },
          home: {
            latitude: 52.4870,
            longitude: 13.4390,
            address: 'Relocato Depot, Berlin Kreuzberg',
          },
        },
        status: {
          operational: 'in_use',
          fuel: {
            level: 62,
            lastRefuel: addDays(new Date(), -3),
            capacity: 75,
          },
          mileage: {
            current: 28500,
            lastService: 25000,
            nextServiceDue: 35000,
          },
          condition: {
            overall: 5,
            issues: [],
          },
        },
        maintenance: {
          schedule: [
            {
              type: 'tire_change',
              dueDate: addDays(new Date(), 45),
              dueMileage: 35000,
              priority: 'low',
              estimatedDuration: 1,
              estimatedCost: 400,
            },
          ],
          history: [
            {
              date: addDays(new Date(), -60),
              type: 'Service',
              description: 'Ölwechsel und Filteraustausch',
              cost: 180,
              mileage: 25000,
              workshop: 'VW Service Spandau',
            },
          ],
        },
        utilization: {
          hoursUsedToday: 4,
          hoursUsedWeek: 28,
          hoursUsedMonth: 110,
          averageDailyDistance: 65,
          efficiency: 2.8,
        },
        costs: {
          acquisition: 45000,
          monthlyInsurance: 180,
          avgMaintenanceCost: 250,
          avgFuelCost: 420,
          depreciation: 450,
        },
      },
    ];

    // Initialize sample allocations
    const sampleAllocations: ResourceAllocation[] = [
      {
        id: 'alloc-1',
        jobId: 'job-1',
        crewMembers: [
          { memberId: 'crew-1', role: 'team_leader', estimatedHours: 6, actualHours: 5.5 },
          { memberId: 'crew-2', role: 'driver', estimatedHours: 6, actualHours: 6 },
        ],
        vehicles: [
          { vehicleId: 'vehicle-1', estimatedUsage: 6, actualUsage: 6 },
        ],
        allocation: {
          date: new Date(),
          startTime: '08:00',
          endTime: '14:00',
          estimatedDuration: 6,
          actualDuration: 5.5,
        },
        status: 'completed',
        efficiency: {
          planned: 85,
          actual: 92,
          variance: 7,
        },
      },
    ];

    setCrewMembers(sampleCrew);
    setVehicles(sampleVehicles);
    setAllocations(sampleAllocations);
  };

  const runOptimization = async () => {
    setIsOptimizing(true);
    
    // Simulate AI optimization analysis
    setTimeout(() => {
      const newOptimization: ResourceOptimization = {
        id: `opt-${Date.now()}`,
        analysisDate: new Date(),
        recommendations: [
          {
            type: 'crew_reallocation',
            priority: 'high',
            description: 'Team-Leader Max Müller optimal auf Premium-Aufträge fokussieren',
            expectedImprovement: {
              efficiency: 15,
              cost: -8,
              utilization: 12,
            },
            implementation: {
              effort: 'low',
              timeframe: '1 Woche',
              requirements: ['Teamumstellung', 'Kundenkommunikation'],
            },
          },
          {
            type: 'vehicle_reassignment',
            priority: 'medium',
            description: 'Van Beta für Stadtfahrten optimieren, Truck Alpha für Fernstrecken',
            expectedImprovement: {
              efficiency: 8,
              cost: -12,
              utilization: 18,
            },
            implementation: {
              effort: 'medium',
              timeframe: '2 Wochen',
              requirements: ['Route-Anpassung', 'Fahrer-Schulung'],
            },
          },
          {
            type: 'schedule_optimization',
            priority: 'high',
            description: 'Frühe Startzeiten für bessere Verkehrssituation nutzen',
            expectedImprovement: {
              efficiency: 22,
              cost: -5,
              utilization: 14,
            },
            implementation: {
              effort: 'low',
              timeframe: '3 Tage',
              requirements: ['Mitarbeiter-Zustimmung', 'Kunden-Information'],
            },
          },
        ],
        metrics: {
          currentUtilization: 78,
          optimizedUtilization: 89,
          currentCosts: 12500,
          optimizedCosts: 11200,
          currentEfficiency: 2.4,
          optimizedEfficiency: 2.8,
        },
      };
      
      setOptimizations(prev => [newOptimization, ...prev]);
      onOptimizationCompleted?.(newOptimization);
      setIsOptimizing(false);
      setIsOptimizationDialogOpen(true);
    }, 4000);
  };

  const getCrewUtilization = (crewId: string) => {
    const member = crewMembers.find(c => c.id === crewId);
    if (!member) return 0;
    
    const weeklyHours = Object.values(member.availability.defaultSchedule)
      .filter(day => day.available)
      .reduce((total, day) => {
        const start = parseInt(day.start.split(':')[0]);
        const end = parseInt(day.end.split(':')[0]);
        return total + (end - start);
      }, 0);
    
    return weeklyHours > 0 ? (Math.random() * 0.3 + 0.6) * 100 : 0; // Simulate utilization
  };

  const getVehicleUtilization = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return 0;
    
    return (vehicle.utilization.hoursUsedWeek / 40) * 100; // 40 hours per week maximum
  };

  const getMaintenanceStatus = (vehicle: Vehicle) => {
    const urgentMaintenance = vehicle.maintenance.schedule.filter(m => 
      m.priority === 'urgent' || differenceInDays(m.dueDate, new Date()) < 7
    );
    
    if (urgentMaintenance.length > 0) return 'urgent';
    
    const upcomingMaintenance = vehicle.maintenance.schedule.filter(m =>
      differenceInDays(m.dueDate, new Date()) < 30
    );
    
    if (upcomingMaintenance.length > 0) return 'due';
    
    return 'ok';
  };

  const renderCrewOverview = () => (
    <Grid container spacing={3}>
      {crewMembers.map((member, index) => {
        const utilization = getCrewUtilization(member.id);
        
        return (
          <Grid item xs={12} md={6} lg={4} key={member.id}>
            <AnimatedCard delay={index * 100}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      width: 56, 
                      height: 56,
                      backgroundColor: theme.palette.primary.main,
                    }}
                  >
                    {member.personalInfo.firstName[0]}{member.personalInfo.lastName[0]}
                  </Avatar>
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {member.personalInfo.firstName} {member.personalInfo.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {member.role.primary} • {member.role.level}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Star sx={{ fontSize: 16, color: theme.palette.warning.main }} />
                      <Typography variant="body2">
                        {member.performance.rating.toFixed(1)}
                      </Typography>
                      <Chip 
                        label={member.status}
                        size="small"
                        color={member.status === 'active' ? 'success' : 'default'}
                      />
                    </Box>
                  </Box>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Auslastung</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {utilization.toFixed(0)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={utilization}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: utilization > 90 ? theme.palette.error.main :
                                       utilization > 75 ? theme.palette.warning.main :
                                       theme.palette.success.main,
                      },
                    }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {member.performance.completedJobs}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Aufträge
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {member.performance.punctuality}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Pünktlichkeit
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {member.skills.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Skills
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setSelectedCrew(member);
                      setIsCrewDialogOpen(true);
                    }}
                    fullWidth
                  >
                    Details
                  </Button>
                  <IconButton size="small">
                    <EditIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </AnimatedCard>
          </Grid>
        );
      })}
    </Grid>
  );

  const renderVehicleOverview = () => (
    <Grid container spacing={3}>
      {vehicles.map((vehicle, index) => {
        const utilization = getVehicleUtilization(vehicle.id);
        const maintenanceStatus = getMaintenanceStatus(vehicle);
        
        return (
          <Grid item xs={12} md={6} lg={4} key={vehicle.id}>
            <AnimatedCard delay={index * 100}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box 
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 2,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <TruckIcon color="primary" sx={{ fontSize: 32 }} />
                  </Box>
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {vehicle.basicInfo.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {vehicle.basicInfo.make} {vehicle.basicInfo.model}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {vehicle.basicInfo.licensePlate} • {vehicle.specifications.capacity.volume}m³
                    </Typography>
                  </Box>
                  
                  <Chip 
                    label={vehicle.status.operational}
                    size="small"
                    color={
                      vehicle.status.operational === 'available' ? 'success' :
                      vehicle.status.operational === 'in_use' ? 'warning' :
                      vehicle.status.operational === 'maintenance' ? 'error' : 'default'
                    }
                  />
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Auslastung</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {utilization.toFixed(0)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={utilization}
                    sx={{ height: 6, borderRadius: 3, mb: 1 }}
                  />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Kraftstoff</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {vehicle.status.fuel.level}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={vehicle.status.fuel.level}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: vehicle.status.fuel.level < 25 ? theme.palette.error.main :
                                         vehicle.status.fuel.level < 50 ? theme.palette.warning.main :
                                         theme.palette.success.main,
                      },
                    }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <BuildIcon 
                    sx={{ 
                      fontSize: 20,
                      color: maintenanceStatus === 'urgent' ? theme.palette.error.main :
                             maintenanceStatus === 'due' ? theme.palette.warning.main :
                             theme.palette.success.main
                    }} 
                  />
                  <Typography variant="body2">
                    {maintenanceStatus === 'urgent' ? 'Wartung überfällig' :
                     maintenanceStatus === 'due' ? 'Wartung fällig' :
                     'Wartung OK'}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {vehicle.status.mileage.current.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      km
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {vehicle.status.condition.overall}/5
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Zustand
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      €{vehicle.costs.avgMaintenanceCost}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      /Monat
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setSelectedVehicle(vehicle);
                      setIsVehicleDialogOpen(true);
                    }}
                    fullWidth
                  >
                    Details
                  </Button>
                  <IconButton size="small">
                    <EditIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </AnimatedCard>
          </Grid>
        );
      })}
    </Grid>
  );

  const renderAnalyticsDashboard = () => {
    const crewUtilizationData = crewMembers.map(member => ({
      name: `${member.personalInfo.firstName} ${member.personalInfo.lastName}`,
      utilization: getCrewUtilization(member.id),
      efficiency: member.performance.rating * 20,
    }));

    const vehicleStatusData = [
      { name: 'Verfügbar', value: vehicles.filter(v => v.status.operational === 'available').length, color: theme.palette.success.main },
      { name: 'Im Einsatz', value: vehicles.filter(v => v.status.operational === 'in_use').length, color: theme.palette.warning.main },
      { name: 'Wartung', value: vehicles.filter(v => v.status.operational === 'maintenance').length, color: theme.palette.error.main },
    ];

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Team-Auslastung & Effizienz
            </Typography>
            
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={crewUtilizationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="utilization" fill={theme.palette.primary.main} name="Auslastung %" />
                  <Bar dataKey="efficiency" fill={theme.palette.success.main} name="Effizienz %" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Fahrzeug-Status
            </Typography>
            
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vehicleStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {vehicleStatusData.map((entry, index) => (
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
    );
  };

  return (
    <Box>
      {/* Header */}
      <SlideInContainer>
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <PeopleIcon color="primary" />
              Resource Planning System
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => {
                  setSelectedCrew(null);
                  setIsCrewDialogOpen(true);
                }}
              >
                Mitarbeiter
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => {
                  setSelectedVehicle(null);
                  setIsVehicleDialogOpen(true);
                }}
              >
                Fahrzeug
              </Button>
              
              <Button
                variant="contained"
                startIcon={isOptimizing ? <RefreshIcon className="rotating" /> : <PsychologyIcon />}
                onClick={runOptimization}
                disabled={isOptimizing}
              >
                {isOptimizing ? 'Optimiere...' : 'KI-Optimierung'}
              </Button>
            </Box>
          </Box>
          
          <Typography variant="body1" color="text.secondary">
            Intelligente Ressourcenplanung mit automatischer Optimierung von Personal und Fahrzeugen
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
                  <GroupWorkIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {crewMembers.filter(c => c.status === 'active').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Aktive Mitarbeiter
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
                  <TruckIcon color="success" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {vehicles.filter(v => v.status.operational === 'available').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Verfügbare Fahrzeuge
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
                  <TrendingUpIcon color="info" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {(crewMembers.reduce((sum, c) => sum + getCrewUtilization(c.id), 0) / crewMembers.length).toFixed(0)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ø Team-Auslastung
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
                  <SpeedIcon color="warning" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {(vehicles.reduce((sum, v) => sum + v.utilization.efficiency, 0) / vehicles.length).toFixed(1)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ø Effizienz-Score
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
            <Tab label="Team-Übersicht" icon={<PeopleIcon />} />
            <Tab label="Fahrzeuge" icon={<TruckIcon />} />
            <Tab label="Analytics" icon={<AnalyticsIcon />} />
            <Tab label="Optimierung" icon={<AutoAwesomeIcon />} />
          </Tabs>
        </Paper>
      </SlideInContainer>

      {/* Tab Content */}
      <SlideInContainer delay={600}>
        {selectedTab === 0 && renderCrewOverview()}
        {selectedTab === 1 && renderVehicleOverview()}
        {selectedTab === 2 && renderAnalyticsDashboard()}
        {selectedTab === 3 && (
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
              Ressourcen-Optimierung
            </Typography>
            
            {optimizations.length === 0 ? (
              <Alert severity="info">
                Starten Sie eine KI-Optimierung um Verbesserungsvorschläge zu erhalten.
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {optimizations.map((opt, index) => (
                  <Grid item xs={12} key={opt.id}>
                    <Paper elevation={1} sx={{ p: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Optimierung vom {format(opt.analysisDate, 'dd.MM.yyyy HH:mm', { locale: de })}
                      </Typography>
                      
                      <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={6} md={3}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                              +{opt.metrics.optimizedUtilization - opt.metrics.currentUtilization}%
                            </Typography>
                            <Typography variant="caption">Auslastung</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                              -€{opt.metrics.currentCosts - opt.metrics.optimizedCosts}
                            </Typography>
                            <Typography variant="caption">Kosteneinsparung</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                              +{((opt.metrics.optimizedEfficiency - opt.metrics.currentEfficiency) / opt.metrics.currentEfficiency * 100).toFixed(0)}%
                            </Typography>
                            <Typography variant="caption">Effizienz</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                              {opt.recommendations.length}
                            </Typography>
                            <Typography variant="caption">Empfehlungen</Typography>
                          </Box>
                        </Grid>
                      </Grid>
                      
                      {opt.recommendations.map((rec, i) => (
                        <Accordion key={i}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                              <Chip 
                                label={rec.priority.toUpperCase()}
                                size="small"
                                color={rec.priority === 'critical' ? 'error' : rec.priority === 'high' ? 'warning' : 'info'}
                              />
                              <Typography sx={{ fontWeight: 600 }}>
                                {rec.description}
                              </Typography>
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                  Erwartete Verbesserungen:
                                </Typography>
                                <List dense>
                                  <ListItem>
                                    <ListItemText 
                                      primary={`Effizienz: +${rec.expectedImprovement.efficiency}%`}
                                    />
                                  </ListItem>
                                  <ListItem>
                                    <ListItemText 
                                      primary={`Kosten: ${rec.expectedImprovement.cost > 0 ? '+' : ''}${rec.expectedImprovement.cost}%`}
                                    />
                                  </ListItem>
                                  <ListItem>
                                    <ListItemText 
                                      primary={`Auslastung: +${rec.expectedImprovement.utilization}%`}
                                    />
                                  </ListItem>
                                </List>
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                  Umsetzung:
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                  <strong>Aufwand:</strong> {rec.implementation.effort}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                  <strong>Zeitrahmen:</strong> {rec.implementation.timeframe}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Voraussetzungen:</strong> {rec.implementation.requirements.join(', ')}
                                </Typography>
                              </Grid>
                            </Grid>
                          </AccordionDetails>
                        </Accordion>
                      ))}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </SlideInContainer>

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

export default ResourcePlanningSystem;