import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Paper, Button, TextField, FormControl, InputLabel, Select, MenuItem, IconButton, Chip, List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction, Divider, useTheme, alpha, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Stepper, Step, StepLabel, StepContent, Switch, FormControlLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress, Tab, Tabs, Accordion, AccordionSummary, AccordionDetails, Slider, GlobalStyles } from '@mui/material';
import Grid from './GridCompat';
import {
  Schedule as ScheduleIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Phone as PhoneIcon,
  Euro as EuroIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Send as SendIcon,
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Receipt as ReceiptIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  AutorenewOutlined as AutorenewIcon,
  ExpandMore as ExpandMoreIcon,
  CalendarToday as CalendarIcon,
  AccessTime as AccessTimeIcon,
  AttachMoney as AttachMoneyIcon,
  MessageOutlined as MessageIcon,
} from '@mui/icons-material';
import { format, addDays, differenceInDays, isAfter, isBefore } from 'date-fns';
import { de } from 'date-fns/locale';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AnimatedCard, SlideInContainer } from './MicroAnimations';

interface PaymentReminder {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  amount: number;
  dueDate: Date;
  overdueDays: number;
  reminderLevel: 1 | 2 | 3 | 4; // Escalation levels
  lastReminderSent: Date | null;
  nextReminderDate: Date;
  status: 'scheduled' | 'sent' | 'opened' | 'responded' | 'paid' | 'escalated' | 'paused';
  attempts: number;
  communicationHistory: CommunicationAttempt[];
  escalationRules: EscalationRule[];
  paymentMethod: 'bank_transfer' | 'credit_card' | 'paypal' | 'cash';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface CommunicationAttempt {
  id: string;
  type: 'email' | 'sms' | 'phone' | 'letter';
  sentAt: Date;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'responded' | 'failed';
  template: string;
  response?: string;
  cost: number;
}

interface EscalationRule {
  id: string;
  level: number;
  triggerAfterDays: number;
  communicationType: 'email' | 'sms' | 'phone' | 'letter' | 'legal';
  template: string;
  isActive: boolean;
  requiresManualApproval: boolean;
  additionalFees: number;
}

interface ReminderTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'letter';
  level: number;
  subject?: string;
  content: string;
  variables: string[];
  isActive: boolean;
}

interface ReminderCampaign {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  rules: {
    triggerAfterDays: number[];
    maxAttempts: number;
    pauseBetweenAttempts: number; // hours
    escalationEnabled: boolean;
    autoLegalAction: boolean;
  };
  templates: string[];
  stats: {
    sent: number;
    opened: number;
    responded: number;
    paid: number;
    escalated: number;
  };
}

interface AutomatedPaymentRemindersProps {
  onReminderSent?: (reminder: PaymentReminder) => void;
  onPaymentReceived?: (invoiceId: string) => void;
  onEscalation?: (reminder: PaymentReminder) => void;
}

const AutomatedPaymentReminders: React.FC<AutomatedPaymentRemindersProps> = ({
  onReminderSent,
  onPaymentReceived,
  onEscalation,
}) => {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState(0);
  const [reminders, setReminders] = useState<PaymentReminder[]>([]);
  const [templates, setTemplates] = useState<ReminderTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<ReminderCampaign[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<PaymentReminder | null>(null);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [reminderSettings, setReminderSettings] = useState({
    autoSend: true,
    workingHoursOnly: true,
    excludeWeekends: true,
    maxAttemptsPerDay: 2,
    escalationThreshold: 30, // days
    legalActionThreshold: 60, // days
    minimumAmount: 50, // minimum amount to send reminders
  });

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = () => {
    // Initialize reminder templates
    const sampleTemplates: ReminderTemplate[] = [
      {
        id: 'template-1',
        name: 'Freundliche Erinnerung',
        type: 'email',
        level: 1,
        subject: 'Erinnerung: Rechnung {{invoice_number}} ist fällig',
        content: `Liebe/r {{customer_name}},

wir möchten Sie höflich daran erinnern, dass die Rechnung {{invoice_number}} über {{amount}}€ seit dem {{due_date}} fällig ist.

Falls Sie die Zahlung bereits veranlasst haben, betrachten Sie diese E-Mail als gegenstandslos.

Zahlungsdetails:
- Rechnungsnummer: {{invoice_number}}
- Betrag: {{amount}}€
- Fälligkeitsdatum: {{due_date}}

Bei Fragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen,
Ihr Relocato Team`,
        variables: ['customer_name', 'invoice_number', 'amount', 'due_date'],
        isActive: true,
      },
      {
        id: 'template-2',
        name: 'Erste Mahnung',
        type: 'email',
        level: 2,
        subject: 'Erste Mahnung: Überfällige Rechnung {{invoice_number}}',
        content: `Sehr geehrte/r {{customer_name}},

trotz unserer freundlichen Erinnerung ist die Rechnung {{invoice_number}} über {{amount}}€ leider noch nicht beglichen.

Die Rechnung ist seit {{overdue_days}} Tagen überfällig.

Wir bitten Sie dringend, den ausstehenden Betrag binnen 7 Tagen zu begleichen, um weitere Maßnahmen zu vermeiden.

Sollten Sie Schwierigkeiten bei der Zahlung haben, kontaktieren Sie uns bitte umgehend.

Mit freundlichen Grüßen,
Ihr Relocato Team`,
        variables: ['customer_name', 'invoice_number', 'amount', 'overdue_days'],
        isActive: true,
      },
      {
        id: 'template-3',
        name: 'Letzte Mahnung',
        type: 'email',
        level: 3,
        subject: 'LETZTE MAHNUNG: Rechnung {{invoice_number}} - Rechtliche Schritte',
        content: `Sehr geehrte/r {{customer_name}},

dies ist unsere letzte Mahnung bezüglich der überfälligen Rechnung {{invoice_number}} über {{amount}}€.

Die Rechnung ist bereits seit {{overdue_days}} Tagen überfällig.

Falls der Betrag nicht binnen 5 Werktagen beglichen wird, sehen wir uns gezwungen, rechtliche Schritte einzuleiten und die Angelegenheit an unser Inkassobüro zu übergeben.

Dies würde zusätzliche Kosten für Sie bedeuten.

Bitte begleichen Sie den Betrag umgehend oder kontaktieren Sie uns zur Vereinbarung einer Ratenzahlung.

Mit freundlichen Grüßen,
Ihr Relocato Team`,
        variables: ['customer_name', 'invoice_number', 'amount', 'overdue_days'],
        isActive: true,
      },
      {
        id: 'template-4',
        name: 'SMS Erinnerung',
        type: 'sms',
        level: 1,
        content: 'Erinnerung: Rechnung {{invoice_number}} über {{amount}}€ ist seit {{due_date}} fällig. Bitte begleichen Sie diese zeitnah. Relocato GmbH',
        variables: ['invoice_number', 'amount', 'due_date'],
        isActive: true,
      },
    ];

    // Generate sample reminders
    const sampleReminders: PaymentReminder[] = [];
    for (let i = 0; i < 15; i++) {
      const dueDate = addDays(new Date(), -Math.floor(Math.random() * 60));
      const overdueDays = differenceInDays(new Date(), dueDate);
      const amount = 500 + Math.random() * 2000;
      
      const statuses: Array<PaymentReminder['status']> = ['scheduled', 'sent', 'opened', 'responded', 'paid', 'escalated', 'paused'];
      const priorities: Array<PaymentReminder['priority']> = ['low', 'medium', 'high', 'critical'];
      const paymentMethods: Array<PaymentReminder['paymentMethod']> = ['bank_transfer', 'credit_card', 'paypal', 'cash'];
      
      const reminderLevel = overdueDays <= 7 ? 1 : overdueDays <= 21 ? 2 : overdueDays <= 35 ? 3 : 4;
      
      sampleReminders.push({
        id: `reminder-${i + 1}`,
        invoiceId: `inv-${i + 1}`,
        invoiceNumber: `REC-${2024}-${(i + 1).toString().padStart(4, '0')}`,
        customerName: `Kunde ${i + 1}`,
        customerEmail: `kunde${i + 1}@beispiel.de`,
        customerPhone: Math.random() > 0.3 ? `+49 151 ${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}` : undefined,
        amount,
        dueDate,
        overdueDays: Math.max(0, overdueDays),
        reminderLevel: reminderLevel as any,
        lastReminderSent: overdueDays > 0 ? addDays(new Date(), -Math.floor(Math.random() * overdueDays)) : null,
        nextReminderDate: addDays(new Date(), Math.floor(Math.random() * 7)),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        attempts: Math.floor(Math.random() * 4),
        communicationHistory: [],
        escalationRules: [],
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        priority: priorities[Math.floor(Math.random() * priorities.length)],
      });
    }

    // Initialize campaigns
    const sampleCampaigns: ReminderCampaign[] = [
      {
        id: 'campaign-1',
        name: 'Standard Mahnwesen',
        description: 'Automatische Erinnerungssequenz für alle überfälligen Rechnungen',
        isActive: true,
        rules: {
          triggerAfterDays: [1, 7, 14, 30],
          maxAttempts: 4,
          pauseBetweenAttempts: 24,
          escalationEnabled: true,
          autoLegalAction: false,
        },
        templates: ['template-1', 'template-2', 'template-3'],
        stats: {
          sent: 342,
          opened: 287,
          responded: 89,
          paid: 156,
          escalated: 23,
        },
      },
      {
        id: 'campaign-2',
        name: 'Premium Kunden',
        description: 'Sanftere Erinnerungssequenz für Premium-Kunden',
        isActive: true,
        rules: {
          triggerAfterDays: [3, 10, 21],
          maxAttempts: 3,
          pauseBetweenAttempts: 48,
          escalationEnabled: false,
          autoLegalAction: false,
        },
        templates: ['template-1'],
        stats: {
          sent: 89,
          opened: 84,
          responded: 31,
          paid: 67,
          escalated: 0,
        },
      },
    ];

    setTemplates(sampleTemplates);
    setReminders(sampleReminders.sort((a, b) => b.overdueDays - a.overdueDays));
    setCampaigns(sampleCampaigns);
  };

  const processReminders = async () => {
    setIsProcessing(true);
    
    // Simulate processing reminders
    setTimeout(() => {
      const updatedReminders = reminders.map(reminder => {
        if (reminder.status === 'scheduled' && isAfter(new Date(), reminder.nextReminderDate)) {
          return {
            ...reminder,
            status: 'sent' as const,
            lastReminderSent: new Date(),
            attempts: reminder.attempts + 1,
            nextReminderDate: addDays(new Date(), 7),
          };
        }
        return reminder;
      });
      
      setReminders(updatedReminders);
      setIsProcessing(false);
      
      const sentCount = updatedReminders.filter(r => r.lastReminderSent && 
        differenceInDays(new Date(), r.lastReminderSent) === 0).length;
      
      if (sentCount > 0) {
        alert(`${sentCount} Zahlungserinnerungen wurden versendet.`);
      }
    }, 2000);
  };

  const handleReminderAction = (reminderId: string, action: 'pause' | 'resume' | 'escalate' | 'mark_paid') => {
    setReminders(prev => prev.map(reminder => {
      if (reminder.id === reminderId) {
        switch (action) {
          case 'pause':
            return { ...reminder, status: 'paused' };
          case 'resume':
            return { ...reminder, status: 'scheduled' };
          case 'escalate':
            return { 
              ...reminder, 
              status: 'escalated',
              reminderLevel: Math.min(4, reminder.reminderLevel + 1) as any,
            };
          case 'mark_paid':
            return { ...reminder, status: 'paid' };
          default:
            return reminder;
        }
      }
      return reminder;
    }));
  };

  const getStatusColor = (status: PaymentReminder['status']) => {
    switch (status) {
      case 'paid': return 'success';
      case 'sent': case 'opened': return 'info';
      case 'scheduled': return 'warning';
      case 'escalated': return 'error';
      case 'paused': return 'default';
      case 'responded': return 'primary';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: PaymentReminder['status']) => {
    switch (status) {
      case 'scheduled': return 'Geplant';
      case 'sent': return 'Versendet';
      case 'opened': return 'Geöffnet';
      case 'responded': return 'Beantwortet';
      case 'paid': return 'Bezahlt';
      case 'escalated': return 'Eskaliert';
      case 'paused': return 'Pausiert';
      default: return status;
    }
  };

  const getPriorityColor = (priority: PaymentReminder['priority']) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return theme.palette.info.main;
      case 2: return theme.palette.warning.main;
      case 3: return theme.palette.error.main;
      case 4: return theme.palette.error.dark;
      default: return theme.palette.grey[500];
    }
  };

  const getCollectionRate = () => {
    const totalReminders = reminders.length;
    const paidReminders = reminders.filter(r => r.status === 'paid').length;
    return totalReminders > 0 ? (paidReminders / totalReminders * 100) : 0;
  };

  const getAveragePaymentTime = () => {
    const paidReminders = reminders.filter(r => r.status === 'paid');
    if (paidReminders.length === 0) return 0;
    
    const totalDays = paidReminders.reduce((sum, r) => sum + r.overdueDays, 0);
    return totalDays / paidReminders.length;
  };

  // Generate chart data
  const chartData = reminders.reduce((acc, reminder) => {
    const month = format(reminder.dueDate, 'MMM yyyy', { locale: de });
    const existing = acc.find(item => item.month === month);
    
    if (existing) {
      existing.overdue += reminder.status !== 'paid' ? reminder.amount : 0;
      existing.paid += reminder.status === 'paid' ? reminder.amount : 0;
      existing.count += 1;
    } else {
      acc.push({
        month,
        overdue: reminder.status !== 'paid' ? reminder.amount : 0,
        paid: reminder.status === 'paid' ? reminder.amount : 0,
        count: 1,
      });
    }
    
    return acc;
  }, [] as Array<{ month: string; overdue: number; paid: number; count: number }>);

  const renderRemindersTab = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Zahlungserinnerungen
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => setSelectedReminder(null)}
          >
            Einstellungen
          </Button>
          
          <Button
            variant="contained"
            startIcon={isProcessing ? <AutorenewIcon className="rotating" /> : <SendIcon />}
            onClick={processReminders}
            disabled={isProcessing}
          >
            {isProcessing ? 'Verarbeite...' : 'Erinnerungen senden'}
          </Button>
        </Box>
      </Box>
      
      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rechnung</TableCell>
              <TableCell>Kunde</TableCell>
              <TableCell align="right">Betrag</TableCell>
              <TableCell>Fällig seit</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priorität</TableCell>
              <TableCell>Nächste Erinnerung</TableCell>
              <TableCell>Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reminders.slice(0, 10).map((reminder) => (
              <TableRow key={reminder.id} hover>
                <TableCell>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {reminder.invoiceNumber}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {reminder.invoiceId}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {reminder.customerName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {reminder.customerEmail}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    €{reminder.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {reminder.overdueDays} Tage
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    seit {format(reminder.dueDate, 'dd.MM.yyyy', { locale: de })}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={`Level ${reminder.reminderLevel}`}
                    size="small"
                    sx={{
                      backgroundColor: alpha(getLevelColor(reminder.reminderLevel), 0.1),
                      color: getLevelColor(reminder.reminderLevel),
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(reminder.status)}
                    size="small"
                    color={getStatusColor(reminder.status)}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={reminder.priority.toUpperCase()}
                    size="small"
                    color={getPriorityColor(reminder.priority)}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="caption">
                    {reminder.status !== 'paid' && reminder.status !== 'paused' ? 
                      format(reminder.nextReminderDate, 'dd.MM.yyyy', { locale: de }) : 
                      '-'
                    }
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {reminder.status !== 'paid' && (
                      <>
                        {reminder.status === 'paused' ? (
                          <Tooltip title="Fortsetzen">
                            <IconButton
                              size="small"
                              onClick={() => handleReminderAction(reminder.id, 'resume')}
                            >
                              <PlayIcon />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Pausieren">
                            <IconButton
                              size="small"
                              onClick={() => handleReminderAction(reminder.id, 'pause')}
                            >
                              <PauseIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        <Tooltip title="Als bezahlt markieren">
                          <IconButton
                            size="small"
                            onClick={() => handleReminderAction(reminder.id, 'mark_paid')}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {reminder.reminderLevel < 4 && (
                          <Tooltip title="Eskalieren">
                            <IconButton
                              size="small"
                              onClick={() => handleReminderAction(reminder.id, 'escalate')}
                            >
                              <WarningIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderCampaignsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Erinnerungs-Kampagnen
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsCampaignDialogOpen(true)}
        >
          Neue Kampagne
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {campaigns.map((campaign, index) => (
          <Grid item xs={12} md={6} key={campaign.id}>
            <AnimatedCard delay={index * 100}>
              <Box
                sx={{
                  background: campaign.isActive
                    ? `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${alpha(theme.palette.success.main, 0.8)} 100%)`
                    : `linear-gradient(135deg, ${theme.palette.grey[400]} 0%, ${theme.palette.grey[500]} 100%)`,
                  color: 'white',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <AutorenewIcon sx={{ fontSize: 40 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {campaign.name}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {campaign.rules.maxAttempts} Versuche
                      </Typography>
                    </Box>
                    
                    <Switch
                      checked={campaign.isActive}
                      sx={{
                        '& .MuiSwitch-thumb': {
                          backgroundColor: 'white',
                        },
                        '& .MuiSwitch-track': {
                          backgroundColor: alpha('#fff', 0.3),
                        },
                      }}
                    />
                  </Box>
                  
                  <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                    {campaign.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    {campaign.rules.triggerAfterDays.map((days) => (
                      <Chip
                        key={days}
                        label={`${days}d`}
                        size="small"
                        sx={{ 
                          backgroundColor: alpha('#fff', 0.15),
                          color: 'white',
                          fontSize: '0.7rem',
                        }}
                      />
                    ))}
                  </Box>
                  
                  <Grid container spacing={1} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {campaign.stats.sent}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          Versendet
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {((campaign.stats.paid / campaign.stats.sent) * 100).toFixed(0)}%
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          Erfolgsrate
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    sx={{
                      color: 'white',
                      borderColor: alpha('#fff', 0.5),
                      '&:hover': {
                        borderColor: 'white',
                        backgroundColor: alpha('#fff', 0.1),
                      },
                    }}
                  >
                    Bearbeiten
                  </Button>
                </CardContent>
              </Box>
            </AnimatedCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderAnalyticsTab = () => (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Zahlungsverhalten Analytics
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <EuroIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    €{reminders.reduce((sum, r) => sum + (r.status !== 'paid' ? r.amount : 0), 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ausstehend
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
                    {getCollectionRate().toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Einzugsquote
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
                <AccessTimeIcon color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {getAveragePaymentTime().toFixed(0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ø Tage bis Zahlung
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
                <NotificationsIcon color="info" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {reminders.filter(r => r.status === 'scheduled').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Aktive Erinnerungen
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Zahlungsverhalten über Zeit
            </Typography>
            
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip 
                    formatter={(value: number) => [`€${value.toLocaleString()}`, 'Betrag']}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="paid" 
                    stackId="1"
                    stroke={theme.palette.success.main}
                    fill={alpha(theme.palette.success.main, 0.3)}
                    name="Bezahlt"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="overdue" 
                    stackId="1"
                    stroke={theme.palette.error.main}
                    fill={alpha(theme.palette.error.main, 0.3)}
                    name="Überfällig"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Status-Verteilung
            </Typography>
            
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Bezahlt', value: reminders.filter(r => r.status === 'paid').length, color: theme.palette.success.main },
                      { name: 'Geplant', value: reminders.filter(r => r.status === 'scheduled').length, color: theme.palette.warning.main },
                      { name: 'Versendet', value: reminders.filter(r => r.status === 'sent').length, color: theme.palette.info.main },
                      { name: 'Eskaliert', value: reminders.filter(r => r.status === 'escalated').length, color: theme.palette.error.main },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {[
                      { name: 'Bezahlt', value: reminders.filter(r => r.status === 'paid').length, color: theme.palette.success.main },
                      { name: 'Geplant', value: reminders.filter(r => r.status === 'scheduled').length, color: theme.palette.warning.main },
                      { name: 'Versendet', value: reminders.filter(r => r.status === 'sent').length, color: theme.palette.info.main },
                      { name: 'Eskaliert', value: reminders.filter(r => r.status === 'escalated').length, color: theme.palette.error.main },
                    ].map((entry, index) => (
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
              Automatisierte Zahlungserinnerungen
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={reminderSettings.autoSend}
                    onChange={(e) => setReminderSettings(prev => ({ ...prev, autoSend: e.target.checked }))}
                  />
                }
                label="Auto-Send"
              />
              
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={processReminders}
                disabled={isProcessing}
              >
                Erinnerungen verarbeiten
              </Button>
            </Box>
          </Box>
          
          <Typography variant="body1" color="text.secondary">
            Automatisiere Zahlungserinnerungen und reduziere Zahlungsausfälle durch intelligente Eskalation
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
            <Tab label="Erinnerungen" icon={<EmailIcon />} />
            <Tab label="Kampagnen" icon={<AutorenewIcon />} />
            <Tab label="Analytics" icon={<AssessmentIcon />} />
          </Tabs>
        </Paper>
      </SlideInContainer>

      {/* Tab Content */}
      <SlideInContainer delay={400}>
        {selectedTab === 0 && renderRemindersTab()}
        {selectedTab === 1 && renderCampaignsTab()}
        {selectedTab === 2 && renderAnalyticsTab()}
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

export default AutomatedPaymentReminders;