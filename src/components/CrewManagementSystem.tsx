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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Slider,
  RadioGroup,
  Radio,
  FormLabel,
  CircularProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Work as WorkIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Assessment as AssessmentIcon,
  School as SchoolIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  Security as SecurityIcon,
  Build as BuildIcon,
  Psychology as PsychologyIcon,
  AutoFixHigh as AutoFixHighIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  EmojiEvents as EmojiEventsIcon,
  Favorite as FavoriteIcon,
  LocalHospital as LocalHospitalIcon,
  Flight as FlightIcon,
  Today as TodayIcon,
  Event as EventIcon,
  Alarm as AlarmIcon,
  NotificationsActive as NotificationsActiveIcon,
  ExpandMore as ExpandMoreIcon,
  Flag as FlagIcon,
  CardMembership as CardMembershipIcon,
  Verified as VerifiedIcon,
  PriorityHigh as PriorityHighIcon,
} from '@mui/icons-material';
import { format, addDays, addMonths, differenceInDays, differenceInYears, startOfWeek, endOfWeek, isSameDay, isWithinInterval } from 'date-fns';
import { de } from 'date-fns/locale';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { AnimatedCard, SlideInContainer } from './MicroAnimations';

interface CrewMember {
  id: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    avatar?: string;
    personalId: string;
    nationality: string;
    address: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    };
    contactInfo: {
      primaryPhone: string;
      secondaryPhone?: string;
      email: string;
      emergencyContact: {
        name: string;
        relationship: string;
        phone: string;
      };
    };
  };
  employment: {
    employeeId: string;
    startDate: Date;
    contractType: 'full_time' | 'part_time' | 'contractor' | 'temporary' | 'seasonal';
    contractEndDate?: Date;
    department: string;
    position: string;
    directSupervisor: string;
    workLocation: string;
    salaryInfo: {
      baseSalary: number;
      currency: string;
      payFrequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
      overtimeRate: number;
      bonusEligible: boolean;
    };
    benefits: {
      healthInsurance: boolean;
      dentalInsurance: boolean;
      retirementPlan: boolean;
      paidTimeOff: number; // days per year
      sickLeave: number; // days per year
      companyVehicle: boolean;
      mealVouchers: boolean;
    };
  };
  role: {
    primary: 'team_leader' | 'driver' | 'mover' | 'helper' | 'specialist' | 'supervisor' | 'coordinator';
    secondary?: string[];
    level: 'trainee' | 'junior' | 'mid' | 'senior' | 'expert' | 'master';
    clearanceLevel?: 'basic' | 'elevated' | 'high' | 'top_secret';
  };
  skills: {
    id: string;
    name: string;
    category: 'technical' | 'safety' | 'customer_service' | 'management' | 'specialized';
    level: 1 | 2 | 3 | 4 | 5;
    certified: boolean;
    certificationDate?: Date;
    expiryDate?: Date;
    certifyingBody?: string;
    renewalRequired: boolean;
  }[];
  schedule: {
    workPattern: 'standard' | 'flexible' | 'shift' | 'on_call' | 'seasonal';
    standardHours: {
      monday: { start: string; end: string; available: boolean };
      tuesday: { start: string; end: string; available: boolean };
      wednesday: { start: string; end: string; available: boolean };
      thursday: { start: string; end: string; available: boolean };
      friday: { start: string; end: string; available: boolean };
      saturday: { start: string; end: string; available: boolean };
      sunday: { start: string; end: string; available: boolean };
    };
    maxHoursPerWeek: number;
    maxHoursPerDay: number;
    overtimeApproval: boolean;
    nightShiftEligible: boolean;
    weekendWorkEligible: boolean;
    travelWillingness: {
      localOnly: boolean;
      regional: boolean;
      national: boolean;
      international: boolean;
      maxTravelDays: number;
    };
  };
  timeOff: {
    vacationDaysTotal: number;
    vacationDaysUsed: number;
    sickDaysTotal: number;
    sickDaysUsed: number;
    personalDaysTotal: number;
    personalDaysUsed: number;
    requests: Array<{
      id: string;
      type: 'vacation' | 'sick' | 'personal' | 'emergency' | 'training' | 'jury_duty';
      startDate: Date;
      endDate: Date;
      days: number;
      status: 'pending' | 'approved' | 'denied' | 'cancelled';
      reason?: string;
      approvedBy?: string;
      requestDate: Date;
    }>;
  };
  performance: {
    overallRating: number; // 1-5
    lastReviewDate: Date;
    nextReviewDate: Date;
    reviews: Array<{
      id: string;
      date: Date;
      reviewer: string;
      type: 'annual' | 'probation' | 'performance_improvement' | 'promotion';
      ratings: {
        jobKnowledge: number;
        qualityOfWork: number;
        productivity: number;
        communication: number;
        teamwork: number;
        reliability: number;
        customerService: number;
        safety: number;
      };
      strengths: string[];
      areasForImprovement: string[];
      goals: Array<{
        description: string;
        targetDate: Date;
        status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
      }>;
      comments: string;
      actionPlan?: string;
    }>;
    jobMetrics: {
      completedJobs: number;
      averageJobRating: number;
      punctualityScore: number;
      safetyIncidents: number;
      customerComplaints: number;
      customerCompliments: number;
      overtimeHours: number;
      absenteeismRate: number;
    };
    training: {
      mandatory: Array<{
        name: string;
        completed: boolean;
        completionDate?: Date;
        expiryDate?: Date;
        score?: number;
      }>;
      optional: Array<{
        name: string;
        completed: boolean;
        completionDate?: Date;
        certificateUrl?: string;
      }>;
      upcomingDeadlines: Array<{
        name: string;
        dueDate: Date;
        priority: 'low' | 'medium' | 'high' | 'critical';
      }>;
    };
  };
  status: 'active' | 'inactive' | 'on_leave' | 'suspended' | 'terminated' | 'retired';
  documents: {
    id: string;
    name: string;
    type: 'contract' | 'id_copy' | 'certification' | 'medical' | 'background_check' | 'other';
    uploadDate: Date;
    expiryDate?: Date;
    verified: boolean;
    url: string;
  }[];
  preferences: {
    communicationMethod: 'email' | 'phone' | 'sms' | 'app';
    language: string;
    workPreferences: {
      preferredShifts: string[];
      preferredTeammates: string[];
      avoidTeammates: string[];
      preferredJobTypes: string[];
      preferredRegions: string[];
    };
    notifications: {
      scheduleChanges: boolean;
      newAssignments: boolean;
      trainingReminders: boolean;
      payrollAlerts: boolean;
      companyNews: boolean;
    };
  };
}

interface TeamComposition {
  id: string;
  name: string;
  description: string;
  leader: string; // crew member ID
  members: string[]; // crew member IDs
  specialization: string[];
  efficiency: number;
  customerRating: number;
  jobsCompleted: number;
  formationDate: Date;
  status: 'active' | 'temporary' | 'disbanded';
  workload: {
    currentJobs: number;
    weeklyCapacity: number;
    utilizationRate: number;
  };
}

interface ShiftPattern {
  id: string;
  name: string;
  description: string;
  schedule: {
    dayOfWeek: number; // 0-6, Sunday=0
    startTime: string;
    endTime: string;
    breakDuration: number; // minutes
    isWorkingDay: boolean;
  }[];
  duration: number; // weeks
  rotationCycle: number; // weeks
  coverageRequirements: {
    minimumStaff: number;
    skillRequirements: string[];
    vehicleRequirements: string[];
  };
}

interface TrainingProgram {
  id: string;
  name: string;
  description: string;
  category: 'onboarding' | 'safety' | 'skills' | 'compliance' | 'leadership' | 'customer_service';
  duration: number; // hours
  format: 'classroom' | 'online' | 'hands_on' | 'blended';
  prerequisites: string[];
  certification: boolean;
  validityPeriod?: number; // months
  instructor?: string;
  maxParticipants: number;
  cost: number;
  schedule: Array<{
    startDate: Date;
    endDate: Date;
    participants: string[];
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  }>;
}

interface CrewManagementSystemProps {
  onCrewUpdated?: (member: CrewMember) => void;
  onTeamCreated?: (team: TeamComposition) => void;
  onTrainingScheduled?: (program: TrainingProgram) => void;
  onPerformanceReviewed?: (memberId: string, review: any) => void;
}

const CrewManagementSystem: React.FC<CrewManagementSystemProps> = ({
  onCrewUpdated,
  onTeamCreated,
  onTrainingScheduled,
  onPerformanceReviewed,
}) => {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState(0);
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [teams, setTeams] = useState<TeamComposition[]>([]);
  const [shiftPatterns, setShiftPatterns] = useState<ShiftPattern[]>([]);
  const [trainingPrograms, setTrainingPrograms] = useState<TrainingProgram[]>([]);
  const [selectedMember, setSelectedMember] = useState<CrewMember | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<TeamComposition | null>(null);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [isTrainingDialogOpen, setIsTrainingDialogOpen] = useState(false);
  const [isPerformanceDialogOpen, setIsPerformanceDialogOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    department: 'all',
    role: 'all',
    status: 'all',
    skills: 'all',
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = () => {
    // Initialize comprehensive crew member data
    const sampleCrewMembers: CrewMember[] = [
      {
        id: 'crew-001',
        personalInfo: {
          firstName: 'Max',
          lastName: 'Müller',
          dateOfBirth: new Date('1985-03-15'),
          personalId: 'DE123456789',
          nationality: 'German',
          address: {
            street: 'Musterstraße 123',
            city: 'Berlin',
            postalCode: '10115',
            country: 'Deutschland',
          },
          contactInfo: {
            primaryPhone: '+49 151 12345678',
            email: 'max.mueller@relocato.de',
            emergencyContact: {
              name: 'Anna Müller',
              relationship: 'Ehefrau',
              phone: '+49 151 87654321',
            },
          },
        },
        employment: {
          employeeId: 'EMP-001',
          startDate: new Date('2020-01-15'),
          contractType: 'full_time',
          department: 'Operations',
          position: 'Senior Team Leader',
          directSupervisor: 'Klaus Weber',
          workLocation: 'Berlin Hauptdepot',
          salaryInfo: {
            baseSalary: 45000,
            currency: 'EUR',
            payFrequency: 'monthly',
            overtimeRate: 1.5,
            bonusEligible: true,
          },
          benefits: {
            healthInsurance: true,
            dentalInsurance: true,
            retirementPlan: true,
            paidTimeOff: 30,
            sickLeave: 15,
            companyVehicle: false,
            mealVouchers: true,
          },
        },
        role: {
          primary: 'team_leader',
          secondary: ['driver', 'trainer'],
          level: 'senior',
          clearanceLevel: 'elevated',
        },
        skills: [
          {
            id: 'skill-001',
            name: 'Teamführung',
            category: 'management',
            level: 5,
            certified: true,
            certificationDate: new Date('2021-06-01'),
            expiryDate: new Date('2024-06-01'),
            certifyingBody: 'IHK Berlin',
            renewalRequired: true,
          },
          {
            id: 'skill-002',
            name: 'Schwerlasttransport',
            category: 'technical',
            level: 4,
            certified: true,
            certificationDate: new Date('2020-09-15'),
            renewalRequired: false,
          },
          {
            id: 'skill-003',
            name: 'Klaviertransport',
            category: 'specialized',
            level: 5,
            certified: true,
            certificationDate: new Date('2021-03-10'),
            renewalRequired: false,
          },
          {
            id: 'skill-004',
            name: 'Erste Hilfe',
            category: 'safety',
            level: 4,
            certified: true,
            certificationDate: new Date('2023-01-15'),
            expiryDate: new Date('2025-01-15'),
            renewalRequired: true,
          },
        ],
        schedule: {
          workPattern: 'standard',
          standardHours: {
            monday: { start: '07:00', end: '16:00', available: true },
            tuesday: { start: '07:00', end: '16:00', available: true },
            wednesday: { start: '07:00', end: '16:00', available: true },
            thursday: { start: '07:00', end: '16:00', available: true },
            friday: { start: '07:00', end: '16:00', available: true },
            saturday: { start: '08:00', end: '14:00', available: true },
            sunday: { start: '00:00', end: '00:00', available: false },
          },
          maxHoursPerWeek: 48,
          maxHoursPerDay: 10,
          overtimeApproval: true,
          nightShiftEligible: false,
          weekendWorkEligible: true,
          travelWillingness: {
            localOnly: false,
            regional: true,
            national: true,
            international: false,
            maxTravelDays: 5,
          },
        },
        timeOff: {
          vacationDaysTotal: 30,
          vacationDaysUsed: 12,
          sickDaysTotal: 15,
          sickDaysUsed: 3,
          personalDaysTotal: 5,
          personalDaysUsed: 1,
          requests: [
            {
              id: 'req-001',
              type: 'vacation',
              startDate: addDays(new Date(), 30),
              endDate: addDays(new Date(), 37),
              days: 7,
              status: 'pending',
              reason: 'Familienurlaub',
              requestDate: new Date(),
            },
          ],
        },
        performance: {
          overallRating: 4.8,
          lastReviewDate: new Date('2023-12-01'),
          nextReviewDate: new Date('2024-12-01'),
          reviews: [
            {
              id: 'review-001',
              date: new Date('2023-12-01'),
              reviewer: 'Klaus Weber',
              type: 'annual',
              ratings: {
                jobKnowledge: 5,
                qualityOfWork: 5,
                productivity: 4,
                communication: 5,
                teamwork: 5,
                reliability: 5,
                customerService: 4,
                safety: 5,
              },
              strengths: ['Exzellente Führungsqualitäten', 'Hohe Kundenzufriedenheit', 'Sehr zuverlässig'],
              areasForImprovement: ['Zeitmanagement bei komplexen Projekten', 'Delegation von Aufgaben'],
              goals: [
                {
                  description: 'Teilnahme an Projektmanagement-Schulung',
                  targetDate: new Date('2024-06-01'),
                  status: 'in_progress',
                },
                {
                  description: 'Mentoring eines Junior-Mitarbeiters',
                  targetDate: new Date('2024-09-01'),
                  status: 'not_started',
                },
              ],
              comments: 'Max ist ein hervorragender Teamleiter mit ausgezeichneten Führungsqualitäten.',
            },
          ],
          jobMetrics: {
            completedJobs: 287,
            averageJobRating: 4.7,
            punctualityScore: 98,
            safetyIncidents: 0,
            customerComplaints: 2,
            customerCompliments: 45,
            overtimeHours: 124,
            absenteeismRate: 2.1,
          },
          training: {
            mandatory: [
              {
                name: 'Arbeitssicherheit Grundschulung',
                completed: true,
                completionDate: new Date('2023-01-15'),
                expiryDate: new Date('2025-01-15'),
                score: 95,
              },
              {
                name: 'Datenschutz DSGVO',
                completed: true,
                completionDate: new Date('2023-03-10'),
                score: 88,
              },
            ],
            optional: [
              {
                name: 'Projektmanagement Grundlagen',
                completed: false,
              },
              {
                name: 'Kundenservice Excellence',
                completed: true,
                completionDate: new Date('2023-08-20'),
                certificateUrl: '/certificates/max-customer-service.pdf',
              },
            ],
            upcomingDeadlines: [
              {
                name: 'Erste Hilfe Auffrischung',
                dueDate: new Date('2024-01-15'),
                priority: 'high',
              },
            ],
          },
        },
        status: 'active',
        documents: [
          {
            id: 'doc-001',
            name: 'Arbeitsvertrag',
            type: 'contract',
            uploadDate: new Date('2020-01-15'),
            verified: true,
            url: '/documents/contract-max-mueller.pdf',
          },
          {
            id: 'doc-002',
            name: 'Führerschein Kopie',
            type: 'certification',
            uploadDate: new Date('2020-01-16'),
            expiryDate: new Date('2030-03-15'),
            verified: true,
            url: '/documents/license-max-mueller.pdf',
          },
        ],
        preferences: {
          communicationMethod: 'email',
          language: 'de',
          workPreferences: {
            preferredShifts: ['morning', 'day'],
            preferredTeammates: ['crew-002', 'crew-003'],
            avoidTeammates: [],
            preferredJobTypes: ['premium', 'commercial'],
            preferredRegions: ['Berlin', 'Brandenburg'],
          },
          notifications: {
            scheduleChanges: true,
            newAssignments: true,
            trainingReminders: true,
            payrollAlerts: false,
            companyNews: true,
          },
        },
      },
      {
        id: 'crew-002',
        personalInfo: {
          firstName: 'Stefan',
          lastName: 'Schmidt',
          dateOfBirth: new Date('1990-07-22'),
          personalId: 'DE987654321',
          nationality: 'German',
          address: {
            street: 'Hauptstraße 456',
            city: 'Berlin',
            postalCode: '10117',
            country: 'Deutschland',
          },
          contactInfo: {
            primaryPhone: '+49 151 23456789',
            email: 'stefan.schmidt@relocato.de',
            emergencyContact: {
              name: 'Maria Schmidt',
              relationship: 'Mutter',
              phone: '+49 151 98765432',
            },
          },
        },
        employment: {
          employeeId: 'EMP-002',
          startDate: new Date('2021-03-01'),
          contractType: 'full_time',
          department: 'Operations',
          position: 'Senior Driver',
          directSupervisor: 'Max Müller',
          workLocation: 'Berlin Hauptdepot',
          salaryInfo: {
            baseSalary: 38000,
            currency: 'EUR',
            payFrequency: 'monthly',
            overtimeRate: 1.5,
            bonusEligible: true,
          },
          benefits: {
            healthInsurance: true,
            dentalInsurance: false,
            retirementPlan: true,
            paidTimeOff: 28,
            sickLeave: 12,
            companyVehicle: true,
            mealVouchers: true,
          },
        },
        role: {
          primary: 'driver',
          secondary: ['mover'],
          level: 'mid',
          clearanceLevel: 'basic',
        },
        skills: [
          {
            id: 'skill-005',
            name: 'LKW-Führerschein CE',
            category: 'technical',
            level: 5,
            certified: true,
            certificationDate: new Date('2018-05-01'),
            expiryDate: new Date('2028-05-01'),
            renewalRequired: true,
          },
          {
            id: 'skill-006',
            name: 'Ladungssicherung',
            category: 'safety',
            level: 4,
            certified: true,
            certificationDate: new Date('2021-08-15'),
            renewalRequired: false,
          },
          {
            id: 'skill-007',
            name: 'Stadtfahrten',
            category: 'technical',
            level: 4,
            certified: false,
            renewalRequired: false,
          },
        ],
        schedule: {
          workPattern: 'standard',
          standardHours: {
            monday: { start: '06:00', end: '15:00', available: true },
            tuesday: { start: '06:00', end: '15:00', available: true },
            wednesday: { start: '06:00', end: '15:00', available: true },
            thursday: { start: '06:00', end: '15:00', available: true },
            friday: { start: '06:00', end: '15:00', available: true },
            saturday: { start: '07:00', end: '13:00', available: true },
            sunday: { start: '00:00', end: '00:00', available: false },
          },
          maxHoursPerWeek: 45,
          maxHoursPerDay: 9,
          overtimeApproval: true,
          nightShiftEligible: true,
          weekendWorkEligible: true,
          travelWillingness: {
            localOnly: false,
            regional: true,
            national: true,
            international: false,
            maxTravelDays: 10,
          },
        },
        timeOff: {
          vacationDaysTotal: 28,
          vacationDaysUsed: 8,
          sickDaysTotal: 12,
          sickDaysUsed: 1,
          personalDaysTotal: 3,
          personalDaysUsed: 0,
          requests: [],
        },
        performance: {
          overallRating: 4.5,
          lastReviewDate: new Date('2023-11-01'),
          nextReviewDate: new Date('2024-11-01'),
          reviews: [
            {
              id: 'review-002',
              date: new Date('2023-11-01'),
              reviewer: 'Max Müller',
              type: 'annual',
              ratings: {
                jobKnowledge: 4,
                qualityOfWork: 5,
                productivity: 4,
                communication: 4,
                teamwork: 5,
                reliability: 5,
                customerService: 4,
                safety: 5,
              },
              strengths: ['Sehr sicherer Fahrer', 'Ausgezeichnete Teamarbeit', 'Hohe Zuverlässigkeit'],
              areasForImprovement: ['Kundeninteraktion', 'Zeitmanagement'],
              goals: [
                {
                  description: 'Kundenservice-Training absolvieren',
                  targetDate: new Date('2024-04-01'),
                  status: 'not_started',
                },
              ],
              comments: 'Stefan ist ein sehr kompetenter und sicherer Fahrer.',
            },
          ],
          jobMetrics: {
            completedJobs: 156,
            averageJobRating: 4.4,
            punctualityScore: 95,
            safetyIncidents: 0,
            customerComplaints: 1,
            customerCompliments: 23,
            overtimeHours: 89,
            absenteeismRate: 1.5,
          },
          training: {
            mandatory: [
              {
                name: 'Arbeitssicherheit Grundschulung',
                completed: true,
                completionDate: new Date('2023-02-10'),
                expiryDate: new Date('2025-02-10'),
                score: 92,
              },
            ],
            optional: [
              {
                name: 'Kundenservice Grundlagen',
                completed: false,
              },
            ],
            upcomingDeadlines: [
              {
                name: 'LKW-Führerschein Verlängerung',
                dueDate: new Date('2028-05-01'),
                priority: 'medium',
              },
            ],
          },
        },
        status: 'active',
        documents: [
          {
            id: 'doc-003',
            name: 'Arbeitsvertrag',
            type: 'contract',
            uploadDate: new Date('2021-03-01'),
            verified: true,
            url: '/documents/contract-stefan-schmidt.pdf',
          },
          {
            id: 'doc-004',
            name: 'LKW-Führerschein',
            type: 'certification',
            uploadDate: new Date('2021-03-02'),
            expiryDate: new Date('2028-05-01'),
            verified: true,
            url: '/documents/license-stefan-schmidt.pdf',
          },
        ],
        preferences: {
          communicationMethod: 'phone',
          language: 'de',
          workPreferences: {
            preferredShifts: ['early_morning', 'morning'],
            preferredTeammates: ['crew-001', 'crew-003'],
            avoidTeammates: [],
            preferredJobTypes: ['standard', 'express'],
            preferredRegions: ['Berlin', 'Hamburg'],
          },
          notifications: {
            scheduleChanges: true,
            newAssignments: true,
            trainingReminders: true,
            payrollAlerts: true,
            companyNews: false,
          },
        },
      },
    ];

    // Initialize team compositions
    const sampleTeams: TeamComposition[] = [
      {
        id: 'team-001',
        name: 'Alpha Team',
        description: 'Premium-Umzugsteam für anspruchsvolle Kunden',
        leader: 'crew-001',
        members: ['crew-001', 'crew-002'],
        specialization: ['Premium-Umzüge', 'Klaviertransport', 'Kunsttransport'],
        efficiency: 92,
        customerRating: 4.8,
        jobsCompleted: 145,
        formationDate: new Date('2021-01-15'),
        status: 'active',
        workload: {
          currentJobs: 3,
          weeklyCapacity: 8,
          utilizationRate: 87,
        },
      },
      {
        id: 'team-002',
        name: 'Beta Team',
        description: 'Standardteam für reguläre Umzüge',
        leader: 'crew-002',
        members: ['crew-002'],
        specialization: ['Standard-Umzüge', 'Büroumzüge'],
        efficiency: 85,
        customerRating: 4.5,
        jobsCompleted: 89,
        formationDate: new Date('2021-06-01'),
        status: 'active',
        workload: {
          currentJobs: 2,
          weeklyCapacity: 6,
          utilizationRate: 75,
        },
      },
    ];

    // Initialize shift patterns
    const sampleShiftPatterns: ShiftPattern[] = [
      {
        id: 'shift-001',
        name: 'Standard Tagschicht',
        description: 'Reguläre Arbeitszeit Mo-Fr',
        schedule: [
          { dayOfWeek: 1, startTime: '07:00', endTime: '16:00', breakDuration: 60, isWorkingDay: true },
          { dayOfWeek: 2, startTime: '07:00', endTime: '16:00', breakDuration: 60, isWorkingDay: true },
          { dayOfWeek: 3, startTime: '07:00', endTime: '16:00', breakDuration: 60, isWorkingDay: true },
          { dayOfWeek: 4, startTime: '07:00', endTime: '16:00', breakDuration: 60, isWorkingDay: true },
          { dayOfWeek: 5, startTime: '07:00', endTime: '16:00', breakDuration: 60, isWorkingDay: true },
          { dayOfWeek: 6, startTime: '08:00', endTime: '14:00', breakDuration: 30, isWorkingDay: true },
          { dayOfWeek: 0, startTime: '00:00', endTime: '00:00', breakDuration: 0, isWorkingDay: false },
        ],
        duration: 1,
        rotationCycle: 1,
        coverageRequirements: {
          minimumStaff: 2,
          skillRequirements: ['driver', 'mover'],
          vehicleRequirements: ['truck'],
        },
      },
    ];

    // Initialize training programs
    const sampleTrainingPrograms: TrainingProgram[] = [
      {
        id: 'training-001',
        name: 'Onboarding Neuer Mitarbeiter',
        description: 'Grundlegende Einführung für neue Teammitglieder',
        category: 'onboarding',
        duration: 16,
        format: 'blended',
        prerequisites: [],
        certification: false,
        instructor: 'HR Team',
        maxParticipants: 6,
        cost: 0,
        schedule: [
          {
            startDate: addDays(new Date(), 7),
            endDate: addDays(new Date(), 9),
            participants: [],
            status: 'scheduled',
          },
        ],
      },
      {
        id: 'training-002',
        name: 'Arbeitssicherheit Grundschulung',
        description: 'Pflichtschulung für alle Mitarbeiter',
        category: 'safety',
        duration: 8,
        format: 'classroom',
        prerequisites: [],
        certification: true,
        validityPeriod: 24,
        instructor: 'Sicherheitsbeauftragter',
        maxParticipants: 12,
        cost: 150,
        schedule: [
          {
            startDate: addDays(new Date(), 14),
            endDate: addDays(new Date(), 14),
            participants: [],
            status: 'scheduled',
          },
        ],
      },
      {
        id: 'training-003',
        name: 'Kundenservice Excellence',
        description: 'Verbesserung der Kundeninteraktion und -zufriedenheit',
        category: 'customer_service',
        duration: 12,
        format: 'classroom',
        prerequisites: ['Onboarding Neuer Mitarbeiter'],
        certification: true,
        validityPeriod: 36,
        instructor: 'Kundenservice Manager',
        maxParticipants: 8,
        cost: 300,
        schedule: [
          {
            startDate: addDays(new Date(), 21),
            endDate: addDays(new Date(), 22),
            participants: [],
            status: 'scheduled',
          },
        ],
      },
    ];

    setCrewMembers(sampleCrewMembers);
    setTeams(sampleTeams);
    setShiftPatterns(sampleShiftPatterns);
    setTrainingPrograms(sampleTrainingPrograms);
  };

  const filteredCrewMembers = useMemo(() => {
    let filtered = crewMembers;

    if (filterCriteria.department !== 'all') {
      filtered = filtered.filter(member => member.employment.department === filterCriteria.department);
    }

    if (filterCriteria.role !== 'all') {
      filtered = filtered.filter(member => member.role.primary === filterCriteria.role);
    }

    if (filterCriteria.status !== 'all') {
      filtered = filtered.filter(member => member.status === filterCriteria.status);
    }

    if (searchTerm) {
      filtered = filtered.filter(member =>
        `${member.personalInfo.firstName} ${member.personalInfo.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.employment.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.employment.position.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [crewMembers, filterCriteria, searchTerm]);

  const getSkillLevelColor = (level: number) => {
    switch (level) {
      case 1: return theme.palette.error.light;
      case 2: return theme.palette.warning.light;
      case 3: return theme.palette.info.light;
      case 4: return theme.palette.success.light;
      case 5: return theme.palette.success.main;
      default: return theme.palette.grey[400];
    }
  };

  const getStatusColor = (status: CrewMember['status']) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'on_leave': return 'warning';
      case 'suspended': return 'error';
      case 'terminated': return 'error';
      case 'retired': return 'info';
      default: return 'default';
    }
  };

  const renderCrewOverview = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Mitarbeiter-Übersicht
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            placeholder="Suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: 200 }}
          />
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedMember(null);
              setIsMemberDialogOpen(true);
            }}
          >
            Neuer Mitarbeiter
          </Button>
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        {filteredCrewMembers.map((member, index) => (
          <Grid item xs={12} md={6} lg={4} key={member.id}>
            <AnimatedCard delay={index * 100}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      width: 64, 
                      height: 64,
                      backgroundColor: theme.palette.primary.main,
                      fontSize: '1.5rem',
                    }}
                  >
                    {member.personalInfo.firstName[0]}{member.personalInfo.lastName[0]}
                  </Avatar>
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {member.personalInfo.firstName} {member.personalInfo.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {member.employment.position}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {member.employment.employeeId}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Star sx={{ fontSize: 16, color: theme.palette.warning.main }} />
                      <Typography variant="body2">
                        {member.performance.overallRating.toFixed(1)}
                      </Typography>
                      <Chip 
                        label={member.status}
                        size="small"
                        color={getStatusColor(member.status)}
                      />
                    </Box>
                  </Box>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Primäre Skills:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {member.skills.slice(0, 3).map((skill) => (
                      <Chip
                        key={skill.id}
                        label={skill.name}
                        size="small"
                        sx={{
                          backgroundColor: alpha(getSkillLevelColor(skill.level), 0.2),
                          color: getSkillLevelColor(skill.level),
                          fontWeight: 600,
                        }}
                      />
                    ))}
                    {member.skills.length > 3 && (
                      <Chip 
                        label={`+${member.skills.length - 3}`} 
                        size="small" 
                        variant="outlined" 
                      />
                    )}
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {member.performance.jobMetrics.completedJobs}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Aufträge
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {member.performance.jobMetrics.punctualityScore}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Pünktlichkeit
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {differenceInYears(new Date(), member.employment.startDate)}J
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Betriebszugehörigkeit
                    </Typography>
                  </Box>
                </Box>
                
                {/* Training alerts */}
                {member.performance.training.upcomingDeadlines.length > 0 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      {member.performance.training.upcomingDeadlines.length} Schulung(en) fällig
                    </Typography>
                  </Alert>
                )}
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setSelectedMember(member);
                      setIsMemberDialogOpen(true);
                    }}
                    fullWidth
                  >
                    Details
                  </Button>
                  <IconButton 
                    size="small"
                    onClick={() => {
                      setSelectedMember(member);
                      setIsPerformanceDialogOpen(true);
                    }}
                  >
                    <AssessmentIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </AnimatedCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderTeamManagement = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Team-Management
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedTeam(null);
            setIsTeamDialogOpen(true);
          }}
        >
          Neues Team
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {teams.map((team, index) => (
          <Grid item xs={12} md={6} key={team.id}>
            <AnimatedCard delay={index * 100}>
              <Box
                sx={{
                  background: team.status === 'active'
                    ? `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${alpha(theme.palette.success.main, 0.8)} 100%)`
                    : `linear-gradient(135deg, ${theme.palette.grey[400]} 0%, ${theme.palette.grey[500]} 100%)`,
                  color: 'white',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <GroupIcon sx={{ fontSize: 40 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {team.name}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {team.members.length} Mitglieder
                      </Typography>
                    </Box>
                    
                    <Chip
                      label={team.status}
                      sx={{
                        backgroundColor: alpha('#fff', 0.2),
                        color: 'white',
                      }}
                    />
                  </Box>
                  
                  <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                    {team.description}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, opacity: 0.9 }}>
                      Spezialisierungen:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {team.specialization.map((spec) => (
                        <Chip
                          key={spec}
                          label={spec}
                          size="small"
                          sx={{
                            backgroundColor: alpha('#fff', 0.15),
                            color: 'white',
                            fontSize: '0.7rem',
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {team.efficiency}%
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        Effizienz
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {team.customerRating.toFixed(1)}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        Bewertung
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {team.jobsCompleted}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        Aufträge
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption">Auslastung</Typography>
                      <Typography variant="caption">{team.workload.utilizationRate}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={team.workload.utilizationRate}
                      sx={{
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: alpha('#fff', 0.8),
                        },
                        backgroundColor: alpha('#fff', 0.2),
                      }}
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Teamleiter:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {crewMembers.find(m => m.id === team.leader)?.personalInfo.firstName} {crewMembers.find(m => m.id === team.leader)?.personalInfo.lastName}
                    </Typography>
                  </Box>
                  
                  <AvatarGroup max={4} sx={{ mb: 2 }}>
                    {team.members.map((memberId) => {
                      const member = crewMembers.find(m => m.id === memberId);
                      return member ? (
                        <Tooltip key={memberId} title={`${member.personalInfo.firstName} ${member.personalInfo.lastName}`}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {member.personalInfo.firstName[0]}{member.personalInfo.lastName[0]}
                          </Avatar>
                        </Tooltip>
                      ) : null;
                    })}
                  </AvatarGroup>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setSelectedTeam(team);
                      setIsTeamDialogOpen(true);
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
                    Team verwalten
                  </Button>
                </CardContent>
              </Box>
            </AnimatedCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderTrainingManagement = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Schulungsmanagement
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsTrainingDialogOpen(true)}
        >
          Neue Schulung
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Geplante Schulungen
            </Typography>
            
            <List>
              {trainingPrograms.map((program) => (
                <React.Fragment key={program.id}>
                  <ListItem>
                    <ListItemIcon>
                      <SchoolIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={program.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {program.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {program.duration}h • {program.format} • max. {program.maxParticipants} Teilnehmer
                          </Typography>
                          {program.schedule[0] && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              Nächster Termin: {format(program.schedule[0].startDate, 'dd.MM.yyyy', { locale: de })}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip 
                          label={program.category}
                          size="small"
                          color={program.category === 'safety' ? 'error' : 'default'}
                        />
                        {program.certification && (
                          <VerifiedIcon color="success" />
                        )}
                        <IconButton>
                          <EditIcon />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Schulungsstatistiken
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Abschlussquote
              </Typography>
              <LinearProgress
                variant="determinate"
                value={87}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary">
                87% der Schulungen erfolgreich abgeschlossen
              </Typography>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Ausstehende Zertifizierungen
              </Typography>
              <Alert severity="warning">
                <Typography variant="body2">
                  {crewMembers.reduce((count, member) => 
                    count + member.performance.training.upcomingDeadlines.length, 0
                  )} Mitarbeiter haben auslaufende Zertifizierungen
                </Typography>
              </Alert>
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Schulungskosten (Monat)
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                €{trainingPrograms.reduce((sum, program) => sum + program.cost, 0).toLocaleString()}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const renderPerformanceAnalytics = () => {
    const performanceData = crewMembers.map(member => ({
      name: `${member.personalInfo.firstName} ${member.personalInfo.lastName}`,
      rating: member.performance.overallRating,
      jobs: member.performance.jobMetrics.completedJobs,
      punctuality: member.performance.jobMetrics.punctualityScore,
      customerRating: member.performance.jobMetrics.averageJobRating,
    }));

    const skillDistribution = crewMembers.reduce((acc, member) => {
      member.skills.forEach(skill => {
        const existing = acc.find(item => item.skill === skill.name);
        if (existing) {
          existing.count += 1;
          existing.avgLevel = (existing.avgLevel + skill.level) / 2;
        } else {
          acc.push({
            skill: skill.name,
            count: 1,
            avgLevel: skill.level,
          });
        }
      });
      return acc;
    }, [] as Array<{ skill: string; count: number; avgLevel: number }>);

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Mitarbeiter-Performance
            </Typography>
            
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="rating" fill={theme.palette.primary.main} name="Gesamtbewertung" />
                  <Bar dataKey="customerRating" fill={theme.palette.success.main} name="Kundenbewertung" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Skill-Verteilung
            </Typography>
            
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={skillDistribution.slice(0, 6)}
                    dataKey="count"
                    nameKey="skill"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ skill, count }) => `${skill}: ${count}`}
                  >
                    {skillDistribution.slice(0, 6).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={theme.palette.primary.main} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Team-Performance Übersicht
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={1}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <PeopleIcon color="primary" sx={{ fontSize: 40 }} />
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                          {crewMembers.filter(m => m.status === 'active').length}
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
                      <StarIcon color="warning" sx={{ fontSize: 40 }} />
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                          {(crewMembers.reduce((sum, m) => sum + m.performance.overallRating, 0) / crewMembers.length).toFixed(1)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Ø Performance
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
                      <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                          {(crewMembers.reduce((sum, m) => sum + m.performance.jobMetrics.punctualityScore, 0) / crewMembers.length).toFixed(0)}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Ø Pünktlichkeit
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
                      <SchoolIcon color="info" sx={{ fontSize: 40 }} />
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                          {crewMembers.reduce((count, member) => 
                            count + member.performance.training.upcomingDeadlines.length, 0
                          )}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Ausstehende Schulungen
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
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
              Crew Management System
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<SettingsIcon />}
              >
                Einstellungen
              </Button>
              
              <Button
                variant="contained"
                startIcon={<PsychologyIcon />}
              >
                KI-Optimierung
              </Button>
            </Box>
          </Box>
          
          <Typography variant="body1" color="text.secondary">
            Comprehensive crew management with performance tracking, training coordination, and team optimization
          </Typography>
        </Paper>
      </SlideInContainer>

      {/* Navigation Tabs */}
      <SlideInContainer delay={200}>
        <Paper elevation={2} sx={{ mb: 4 }}>
          <Tabs
            value={selectedTab}
            onChange={(e, newValue) => setSelectedTab(newValue)}
            variant="fullWidth"
          >
            <Tab label="Mitarbeiter" icon={<PersonIcon />} />
            <Tab label="Teams" icon={<GroupIcon />} />
            <Tab label="Schulungen" icon={<SchoolIcon />} />
            <Tab label="Performance" icon={<AssessmentIcon />} />
          </Tabs>
        </Paper>
      </SlideInContainer>

      {/* Tab Content */}
      <SlideInContainer delay={400}>
        {selectedTab === 0 && renderCrewOverview()}
        {selectedTab === 1 && renderTeamManagement()}
        {selectedTab === 2 && renderTrainingManagement()}
        {selectedTab === 3 && renderPerformanceAnalytics()}
      </SlideInContainer>
    </Box>
  );
};

export default CrewManagementSystem;