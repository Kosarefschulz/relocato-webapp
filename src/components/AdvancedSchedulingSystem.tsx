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
  AvatarGroup,
  Badge,
  Fab,
  Menu,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  CalendarToday as CalendarIcon,
  Event as EventIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  LocalShipping as TruckIcon,
  Assignment as AssignmentIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Notifications as NotificationsIcon,
  Timeline as TimelineIcon,
  Dashboard as DashboardIcon,
  Today as TodayIcon,
  ViewWeek as WeekIcon,
  ViewModule as MonthIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  SwapHoriz as SwapIcon,
  MoreVert as MoreVertIcon,
  AutoFixHigh as AutoFixIcon,
  DirectionsCar as CarIcon,
  Home as HomeIcon,
  Business as BusinessIcon,
  Star as StarIcon,
  Speed as SpeedIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { format, addDays, addHours, startOfWeek, endOfWeek, isToday, isSameDay, differenceInHours, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { AnimatedCard, SlideInContainer } from './MicroAnimations';

interface CrewMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: 'team_leader' | 'mover' | 'driver' | 'helper';
  skills: string[];
  availability: AvailabilitySlot[];
  rating: number;
  isActive: boolean;
  emergencyContact: {
    name: string;
    phone: string;
  };
}

interface Vehicle {
  id: string;
  name: string;
  type: 'small_truck' | 'medium_truck' | 'large_truck' | 'van' | 'trailer';
  capacity: number; // cubic meters
  maxWeight: number; // kg
  licensePlate: string;
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_service';
  currentLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  nextMaintenanceDate: Date;
  fuelLevel: number; // percentage
}

interface AvailabilitySlot {
  id: string;
  date: Date;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isAvailable: boolean;
  reason?: string;
}

interface MovingJob {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  from: {
    address: string;
    latitude: number;
    longitude: number;
    accessInfo: string;
  };
  to: {
    address: string;
    latitude: number;
    longitude: number;
    accessInfo: string;
  };
  scheduledDate: Date;
  estimatedStartTime: string;
  estimatedEndTime: string;
  estimatedDuration: number; // hours
  actualStartTime?: Date;
  actualEndTime?: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  serviceType: 'standard' | 'premium' | 'express' | 'storage';
  estimatedVolume: number; // cubic meters
  specialRequirements: string[];
  assignedCrew: CrewMember[];
  assignedVehicles: Vehicle[];
  notes: string;
  route?: RouteInfo;
}

interface RouteInfo {
  id: string;
  jobs: string[]; // job IDs in order
  totalDistance: number; // km
  totalDuration: number; // hours
  optimizedOrder: boolean;
  drivingInstructions: string[];
  estimatedFuelCost: number;
}

interface ScheduleConflict {
  id: string;
  type: 'crew_double_booked' | 'vehicle_unavailable' | 'time_overlap' | 'maintenance_due';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedJobs: string[];
  affectedResources: string[];
  description: string;
  suggestions: string[];
  autoResolvable: boolean;
}

interface AdvancedSchedulingSystemProps {
  onJobScheduled?: (job: MovingJob) => void;
  onJobUpdated?: (job: MovingJob) => void;
  onConflictResolved?: (conflict: ScheduleConflict) => void;
  initialDate?: Date;
  view?: 'day' | 'week' | 'month';
}

const AdvancedSchedulingSystem: React.FC<AdvancedSchedulingSystemProps> = ({
  onJobScheduled,
  onJobUpdated,
  onConflictResolved,
  initialDate = new Date(),
  view: initialView = 'week',
}) => {
  const theme = useTheme();
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [currentView, setCurrentView] = useState(initialView);
  const [selectedTab, setSelectedTab] = useState(0);
  const [jobs, setJobs] = useState<MovingJob[]>([]);
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [selectedJob, setSelectedJob] = useState<MovingJob | null>(null);
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false);
  const [isCrewDialogOpen, setIsCrewDialogOpen] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    status: 'all',
    priority: 'all',
    serviceType: 'all',
    crew: 'all',
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = () => {
    // Initialize crew members
    const sampleCrew: CrewMember[] = [
      {
        id: 'crew-1',
        name: 'Max Müller',
        email: 'max.mueller@relocato.de',
        phone: '+49 151 12345678',
        role: 'team_leader',
        skills: ['Führungsqualitäten', 'Schwerlasttransport', 'Klaviertransport'],
        availability: [],
        rating: 4.8,
        isActive: true,
        emergencyContact: {
          name: 'Anna Müller',
          phone: '+49 151 87654321',
        },
      },
      {
        id: 'crew-2',
        name: 'Stefan Schmidt',
        email: 'stefan.schmidt@relocato.de',
        phone: '+49 151 23456789',
        role: 'driver',
        skills: ['LKW-Führerschein', 'Stadtfahrten', 'Fernfahrten'],
        availability: [],
        rating: 4.6,
        isActive: true,
        emergencyContact: {
          name: 'Maria Schmidt',
          phone: '+49 151 98765432',
        },
      },
      {
        id: 'crew-3',
        name: 'Michael Weber',
        email: 'michael.weber@relocato.de',
        phone: '+49 151 34567890',
        role: 'mover',
        skills: ['Möbeltransport', 'Verpackung', 'Montage'],
        availability: [],
        rating: 4.7,
        isActive: true,
        emergencyContact: {
          name: 'Lisa Weber',
          phone: '+49 151 09876543',
        },
      },
      {
        id: 'crew-4',
        name: 'Thomas Klein',
        email: 'thomas.klein@relocato.de',
        phone: '+49 151 45678901',
        role: 'mover',
        skills: ['Schwerlasttransport', 'Elektronik', 'Büroumzüge'],
        availability: [],
        rating: 4.5,
        isActive: true,
        emergencyContact: {
          name: 'Sarah Klein',
          phone: '+49 151 10987654',
        },
      },
      {
        id: 'crew-5',
        name: 'Daniel Fischer',
        email: 'daniel.fischer@relocato.de',
        phone: '+49 151 56789012',
        role: 'helper',
        skills: ['Verpackung', 'Reinigung', 'Hilfstätigkeiten'],
        availability: [],
        rating: 4.3,
        isActive: true,
        emergencyContact: {
          name: 'Jenny Fischer',
          phone: '+49 151 21098765',
        },
      },
    ];

    // Initialize vehicles
    const sampleVehicles: Vehicle[] = [
      {
        id: 'vehicle-1',
        name: 'Relocato Truck 1',
        type: 'large_truck',
        capacity: 40,
        maxWeight: 3500,
        licensePlate: 'B-RL 1001',
        status: 'available',
        nextMaintenanceDate: addDays(new Date(), 15),
        fuelLevel: 85,
        currentLocation: {
          latitude: 52.5200,
          longitude: 13.4050,
          address: 'Berlin Mitte',
        },
      },
      {
        id: 'vehicle-2',
        name: 'Relocato Truck 2',
        type: 'medium_truck',
        capacity: 25,
        maxWeight: 2500,
        licensePlate: 'B-RL 1002',
        status: 'available',
        nextMaintenanceDate: addDays(new Date(), 8),
        fuelLevel: 62,
        currentLocation: {
          latitude: 52.4870,
          longitude: 13.4390,
          address: 'Berlin Kreuzberg',
        },
      },
      {
        id: 'vehicle-3',
        name: 'Relocato Van 1',
        type: 'van',
        capacity: 15,
        maxWeight: 1500,
        licensePlate: 'B-RL 2001',
        status: 'in_use',
        nextMaintenanceDate: addDays(new Date(), 22),
        fuelLevel: 30,
        currentLocation: {
          latitude: 52.5170,
          longitude: 13.3890,
          address: 'Berlin Charlottenburg',
        },
      },
      {
        id: 'vehicle-4',
        name: 'Relocato Truck 3',
        type: 'large_truck',
        capacity: 45,
        maxWeight: 4000,
        licensePlate: 'B-RL 1003',
        status: 'maintenance',
        nextMaintenanceDate: new Date(),
        fuelLevel: 15,
      },
    ];

    // Generate sample jobs
    const sampleJobs: MovingJob[] = [];
    const customers = [
      'Familie Müller', 'Herr Schmidt', 'Frau Weber', 'Familie Klein', 'Dr. Fischer',
      'Familie Hoffmann', 'Herr Wagner', 'Frau Schulz', 'Familie Becker', 'Herr Richter'
    ];
    const addresses = [
      'Alexanderplatz 1, 10178 Berlin',
      'Kurfürstendamm 100, 10709 Berlin',
      'Friedrichstraße 50, 10117 Berlin',
      'Potsdamer Platz 5, 10785 Berlin',
      'Unter den Linden 25, 10117 Berlin',
    ];

    for (let i = 0; i < 15; i++) {
      const scheduledDate = addDays(new Date(), Math.floor(Math.random() * 14) - 7);
      const startHour = 8 + Math.floor(Math.random() * 8);
      const duration = 2 + Math.floor(Math.random() * 6);
      
      const statuses: Array<MovingJob['status']> = ['scheduled', 'in_progress', 'completed', 'cancelled'];
      const priorities: Array<MovingJob['priority']> = ['low', 'medium', 'high', 'urgent'];
      const serviceTypes: Array<MovingJob['serviceType']> = ['standard', 'premium', 'express', 'storage'];
      
      sampleJobs.push({
        id: `job-${i + 1}`,
        customerName: customers[Math.floor(Math.random() * customers.length)],
        customerPhone: `+49 151 ${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
        customerEmail: `kunde${i + 1}@beispiel.de`,
        from: {
          address: addresses[Math.floor(Math.random() * addresses.length)],
          latitude: 52.5200 + (Math.random() - 0.5) * 0.1,
          longitude: 13.4050 + (Math.random() - 0.5) * 0.1,
          accessInfo: 'Aufzug vorhanden, Parkplatz direkt vor der Tür',
        },
        to: {
          address: addresses[Math.floor(Math.random() * addresses.length)],
          latitude: 52.5200 + (Math.random() - 0.5) * 0.1,
          longitude: 13.4050 + (Math.random() - 0.5) * 0.1,
          accessInfo: '3. Stock ohne Aufzug, Halteverbot beantragen',
        },
        scheduledDate,
        estimatedStartTime: `${startHour.toString().padStart(2, '0')}:00`,
        estimatedEndTime: `${(startHour + duration).toString().padStart(2, '0')}:00`,
        estimatedDuration: duration,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        serviceType: serviceTypes[Math.floor(Math.random() * serviceTypes.length)],
        estimatedVolume: 15 + Math.random() * 25,
        specialRequirements: ['Klaviertransport', 'Zerbrechliche Gegenstände', 'Schwerlast'].slice(0, Math.floor(Math.random() * 3)),
        assignedCrew: sampleCrew.slice(0, 2 + Math.floor(Math.random() * 3)),
        assignedVehicles: [sampleVehicles[Math.floor(Math.random() * 2)]],
        notes: 'Kunde bevorzugt frühen Termin. Parkgenehmigung bereits beantragt.',
      });
    }

    // Generate sample conflicts
    const sampleConflicts: ScheduleConflict[] = [
      {
        id: 'conflict-1',
        type: 'crew_double_booked',
        severity: 'high',
        affectedJobs: ['job-1', 'job-3'],
        affectedResources: ['crew-1'],
        description: 'Max Müller ist für zwei Aufträge zur gleichen Zeit eingeteilt',
        suggestions: [
          'Einen der Aufträge verschieben',
          'Alternativen Teamleiter zuweisen',
          'Aufträge zeitlich staffeln'
        ],
        autoResolvable: false,
      },
      {
        id: 'conflict-2',
        type: 'vehicle_unavailable',
        severity: 'medium',
        affectedJobs: ['job-5'],
        affectedResources: ['vehicle-4'],
        description: 'Fahrzeug ist zur geplanten Zeit in der Wartung',
        suggestions: [
          'Alternatives Fahrzeug zuweisen',
          'Wartungstermin verschieben',
          'Auftrag auf anderen Tag verlegen'
        ],
        autoResolvable: true,
      },
      {
        id: 'conflict-3',
        type: 'maintenance_due',
        severity: 'low',
        affectedJobs: ['job-8'],
        affectedResources: ['vehicle-2'],
        description: 'Fahrzeug benötigt bald Wartung, könnte Auftrag beeinträchtigen',
        suggestions: [
          'Wartung nach dem Auftrag einplanen',
          'Anderes Fahrzeug verwenden',
          'Wartung vorziehen'
        ],
        autoResolvable: true,
      },
    ];

    setCrewMembers(sampleCrew);
    setVehicles(sampleVehicles);
    setJobs(sampleJobs.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime()));
    setConflicts(sampleConflicts);
  };

  const optimizeSchedule = async () => {
    setIsOptimizing(true);
    
    // Simulate AI optimization
    setTimeout(() => {
      // Resolve some conflicts automatically
      const resolvedConflicts = conflicts.filter(c => c.autoResolvable);
      const remainingConflicts = conflicts.filter(c => !c.autoResolvable);
      
      setConflicts(remainingConflicts);
      setIsOptimizing(false);
      
      alert(`Optimierung abgeschlossen! ${resolvedConflicts.length} Konflikte automatisch gelöst.`);
    }, 3000);
  };

  const getJobsForDate = (date: Date) => {
    return jobs.filter(job => isSameDay(job.scheduledDate, date));
  };

  const getCrewWorkload = (crewId: string, date: Date) => {
    const dayJobs = getJobsForDate(date);
    const crewJobs = dayJobs.filter(job => 
      job.assignedCrew.some(member => member.id === crewId) && 
      job.status !== 'cancelled'
    );
    
    return crewJobs.reduce((total, job) => total + job.estimatedDuration, 0);
  };

  const getVehicleUtilization = (vehicleId: string, date: Date) => {
    const dayJobs = getJobsForDate(date);
    const vehicleJobs = dayJobs.filter(job => 
      job.assignedVehicles.some(vehicle => vehicle.id === vehicleId) && 
      job.status !== 'cancelled'
    );
    
    return vehicleJobs.length > 0 ? (vehicleJobs.reduce((total, job) => total + job.estimatedDuration, 0) / 8 * 100) : 0;
  };

  const getStatusColor = (status: MovingJob['status']) => {
    switch (status) {
      case 'scheduled': return theme.palette.info.main;
      case 'in_progress': return theme.palette.warning.main;
      case 'completed': return theme.palette.success.main;
      case 'cancelled': return theme.palette.error.main;
      case 'rescheduled': return theme.palette.secondary.main;
      default: return theme.palette.grey[500];
    }
  };

  const getPriorityColor = (priority: MovingJob['priority']) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getConflictSeverityColor = (severity: ScheduleConflict['severity']) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const filteredJobs = useMemo(() => {
    let filtered = jobs;

    if (filterCriteria.status !== 'all') {
      filtered = filtered.filter(job => job.status === filterCriteria.status);
    }

    if (filterCriteria.priority !== 'all') {
      filtered = filtered.filter(job => job.priority === filterCriteria.priority);
    }

    if (filterCriteria.serviceType !== 'all') {
      filtered = filtered.filter(job => job.serviceType === filterCriteria.serviceType);
    }

    if (searchTerm) {
      filtered = filtered.filter(job => 
        job.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.from.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.to.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [jobs, filterCriteria, searchTerm]);

  const renderCalendarView = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <Box>
        <Grid container spacing={1}>
          {weekDays.map((day) => {
            const dayJobs = getJobsForDate(day);
            return (
              <Grid item xs={12/7} key={day.toISOString()}>
                <Paper 
                  elevation={isToday(day) ? 3 : 1}
                  sx={{ 
                    p: 1, 
                    minHeight: 200,
                    backgroundColor: isToday(day) ? alpha(theme.palette.primary.main, 0.05) : 'background.paper',
                    border: isToday(day) ? `2px solid ${theme.palette.primary.main}` : 'none',
                  }}
                >
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      fontWeight: 600, 
                      mb: 1,
                      color: isToday(day) ? 'primary.main' : 'text.primary'
                    }}
                  >
                    {format(day, 'EEE dd.MM', { locale: de })}
                  </Typography>
                  
                  {dayJobs.map((job, index) => (
                    <Card 
                      key={job.id}
                      elevation={0}
                      sx={{ 
                        mb: 0.5, 
                        cursor: 'pointer',
                        backgroundColor: alpha(getStatusColor(job.status), 0.1),
                        border: `1px solid ${alpha(getStatusColor(job.status), 0.3)}`,
                        '&:hover': {
                          backgroundColor: alpha(getStatusColor(job.status), 0.2),
                        }
                      }}
                      onClick={() => {
                        setSelectedJob(job);
                        setIsJobDialogOpen(true);
                      }}
                    >
                      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                          {job.estimatedStartTime} - {job.customerName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {job.serviceType} • {job.assignedCrew.length} Personen
                        </Typography>
                        {job.priority === 'urgent' && (
                          <Chip 
                            label="URGENT" 
                            size="small" 
                            color="error" 
                            sx={{ fontSize: '0.6rem', height: 16, mt: 0.5 }}
                          />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  
                  {dayJobs.length === 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      Keine Termine
                    </Typography>
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    );
  };

  const renderJobsList = () => (
    <TableContainer component={Paper} elevation={1}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Kunde</TableCell>
            <TableCell>Datum/Zeit</TableCell>
            <TableCell>Route</TableCell>
            <TableCell>Team</TableCell>
            <TableCell>Fahrzeug</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Priorität</TableCell>
            <TableCell>Aktionen</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredJobs.slice(0, 10).map((job) => (
            <TableRow key={job.id} hover>
              <TableCell>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {job.customerName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {job.customerPhone}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Box>
                  <Typography variant="body2">
                    {format(job.scheduledDate, 'dd.MM.yyyy', { locale: de })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {job.estimatedStartTime} - {job.estimatedEndTime}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    <strong>Von:</strong> {job.from.address.split(',')[0]}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    <strong>Nach:</strong> {job.to.address.split(',')[0]}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <AvatarGroup max={3} sx={{ justifyContent: 'flex-start' }}>
                  {job.assignedCrew.map((member) => (
                    <Tooltip key={member.id} title={member.name}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                    </Tooltip>
                  ))}
                </AvatarGroup>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TruckIcon color="action" />
                  <Typography variant="caption">
                    {job.assignedVehicles[0]?.name.split(' ').pop() || 'N/A'}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Chip 
                  label={job.status}
                  size="small"
                  sx={{
                    backgroundColor: alpha(getStatusColor(job.status), 0.1),
                    color: getStatusColor(job.status),
                  }}
                />
              </TableCell>
              <TableCell>
                <Chip 
                  label={job.priority.toUpperCase()}
                  size="small"
                  color={getPriorityColor(job.priority)}
                />
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Bearbeiten">
                    <IconButton 
                      size="small"
                      onClick={() => {
                        setSelectedJob(job);
                        setIsJobDialogOpen(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Details">
                    <IconButton size="small">
                      <MoreVertIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderResourceView = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Team-Auslastung
          </Typography>
          
          {crewMembers.map((member) => {
            const workload = getCrewWorkload(member.id, selectedDate);
            const utilizationPercent = (workload / 8) * 100;
            
            return (
              <Box key={member.id} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {member.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {member.role}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {workload}h / 8h
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {utilizationPercent.toFixed(0)}% Auslastung
                    </Typography>
                  </Box>
                </Box>
                
                <LinearProgress
                  variant="determinate"
                  value={Math.min(utilizationPercent, 100)}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: utilizationPercent > 100 ? theme.palette.error.main :
                                     utilizationPercent > 80 ? theme.palette.warning.main :
                                     theme.palette.success.main,
                    },
                  }}
                />
              </Box>
            );
          })}
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Fahrzeug-Status
          </Typography>
          
          {vehicles.map((vehicle) => {
            const utilization = getVehicleUtilization(vehicle.id, selectedDate);
            
            return (
              <Box key={vehicle.id} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TruckIcon color="primary" />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {vehicle.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {vehicle.licensePlate} • {vehicle.capacity}m³
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Chip 
                    label={vehicle.status}
                    size="small"
                    color={
                      vehicle.status === 'available' ? 'success' :
                      vehicle.status === 'in_use' ? 'warning' :
                      vehicle.status === 'maintenance' ? 'error' : 'default'
                    }
                  />
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Auslastung
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={utilization}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Kraftstoff
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={vehicle.fuelLevel}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: vehicle.fuelLevel < 25 ? theme.palette.error.main :
                                           vehicle.fuelLevel < 50 ? theme.palette.warning.main :
                                           theme.palette.success.main,
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Paper>
      </Grid>
    </Grid>
  );

  const renderConflictsView = () => (
    <Box>
      {conflicts.length === 0 ? (
        <Alert severity="success" icon={<CheckCircleIcon />}>
          <Typography variant="body2">
            Keine Konflikte erkannt! Alle Ressourcen sind optimal eingeteilt.
          </Typography>
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {conflicts.map((conflict, index) => (
            <Grid item xs={12} key={conflict.id}>
              <AnimatedCard delay={index * 100}>
                <Alert 
                  severity={conflict.severity as any}
                  action={
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {conflict.autoResolvable && (
                        <Button size="small" variant="outlined">
                          Auto-Lösen
                        </Button>
                      )}
                      <Button size="small" variant="contained">
                        Lösen
                      </Button>
                    </Box>
                  }
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    {conflict.description}
                  </Typography>
                  
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Betroffene Aufträge: {conflict.affectedJobs.join(', ')}
                  </Typography>
                  
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      Lösungsvorschläge:
                    </Typography>
                    <List dense sx={{ py: 0 }}>
                      {conflict.suggestions.map((suggestion, i) => (
                        <ListItem key={i} sx={{ py: 0, px: 0 }}>
                          <ListItemText 
                            primary={suggestion}
                            primaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Alert>
              </AnimatedCard>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  return (
    <Box>
      {/* Header */}
      <SlideInContainer>
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScheduleIcon color="primary" />
              Advanced Scheduling System
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => {
                  setSelectedJob(null);
                  setIsJobDialogOpen(true);
                }}
              >
                Neuer Auftrag
              </Button>
              
              <Button
                variant="contained"
                startIcon={isOptimizing ? <RefreshIcon className="rotating" /> : <AutoFixIcon />}
                onClick={optimizeSchedule}
                disabled={isOptimizing}
              >
                {isOptimizing ? 'Optimiere...' : 'KI-Optimierung'}
              </Button>
            </Box>
          </Box>
          
          <Typography variant="body1" color="text.secondary">
            Intelligente Terminplanung mit automatischer Ressourcenoptimierung und Konfliktauflösung
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
                  <EventIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {jobs.filter(j => j.status === 'scheduled').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Geplante Aufträge
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
                  <GroupIcon color="success" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {crewMembers.filter(c => c.isActive).length}
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
                  <TruckIcon color="info" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {vehicles.filter(v => v.status === 'available').length}
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
                  <WarningIcon color="warning" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {conflicts.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Aktive Konflikte
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </SlideInContainer>

      {/* View Controls */}
      <SlideInContainer delay={400}>
        <Paper elevation={2} sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton 
                onClick={() => setSelectedDate(addDays(selectedDate, -7))}
                disabled={currentView !== 'week'}
              >
                <span>‹</span>
              </IconButton>
              
              <Typography variant="h6" sx={{ minWidth: 200, textAlign: 'center' }}>
                {currentView === 'week' 
                  ? `${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'dd.MM')} - ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'dd.MM.yyyy')}`
                  : format(selectedDate, 'MMMM yyyy', { locale: de })
                }
              </Typography>
              
              <IconButton 
                onClick={() => setSelectedDate(addDays(selectedDate, 7))}
                disabled={currentView !== 'week'}
              >
                <span>›</span>
              </IconButton>
              
              <Button
                size="small"
                variant="outlined"
                onClick={() => setSelectedDate(new Date())}
              >
                Heute
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant={currentView === 'week' ? 'contained' : 'outlined'}
                size="small"
                startIcon={<WeekIcon />}
                onClick={() => setCurrentView('week')}
              >
                Woche
              </Button>
              <Button
                variant={currentView === 'month' ? 'contained' : 'outlined'}
                size="small"
                startIcon={<MonthIcon />}
                onClick={() => setCurrentView('month')}
              >
                Monat
              </Button>
            </Box>
          </Box>
          
          <Tabs
            value={selectedTab}
            onChange={(e, newValue) => setSelectedTab(newValue)}
            variant="fullWidth"
          >
            <Tab label="Kalender" icon={<CalendarIcon />} />
            <Tab label="Liste" icon={<AssignmentIcon />} />
            <Tab label="Ressourcen" icon={<GroupIcon />} />
            <Tab label="Konflikte" icon={<WarningIcon />} />
          </Tabs>
        </Paper>
      </SlideInContainer>

      {/* Tab Content */}
      <SlideInContainer delay={600}>
        {selectedTab === 0 && renderCalendarView()}
        {selectedTab === 1 && renderJobsList()}
        {selectedTab === 2 && renderResourceView()}
        {selectedTab === 3 && renderConflictsView()}
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

export default AdvancedSchedulingSystem;