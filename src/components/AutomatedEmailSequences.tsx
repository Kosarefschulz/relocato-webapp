import React, { useState, useEffect } from 'react';
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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Send as SendIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Drafts as DraftsIcon,
  MarkEmailRead as MarkEmailReadIcon,
  Reply as ReplyIcon,
  Forward as ForwardIcon,
  Settings as SettingsIcon,
  Preview as PreviewIcon,
  ExpandMore as ExpandMoreIcon,
  Autorenew as AutorenewIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { format, addDays, addHours, differenceInHours } from 'date-fns';
import { de } from 'date-fns/locale';
import { AnimatedCard, SlideInContainer } from './MicroAnimations';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'welcome' | 'follow_up' | 'reminder' | 'thank_you' | 'survey' | 'promotional';
  variables: string[];
  isActive: boolean;
}

interface EmailSequence {
  id: string;
  name: string;
  description: string;
  trigger: 'quote_sent' | 'service_completed' | 'manual' | 'date_based' | 'behavior_based';
  isActive: boolean;
  steps: EmailSequenceStep[];
  stats: {
    sent: number;
    opened: number;
    clicked: number;
    replied: number;
    unsubscribed: number;
  };
}

interface EmailSequenceStep {
  id: string;
  template: EmailTemplate;
  delay: number; // hours
  delayType: 'hours' | 'days' | 'weeks';
  conditions?: string[];
  isActive: boolean;
}

interface EmailCampaign {
  id: string;
  sequenceId: string;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  currentStep: number;
  startedAt: Date;
  nextEmailAt?: Date;
  completedAt?: Date;
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
}

interface AutomatedEmailSequencesProps {
  onSequenceCreate?: (sequence: EmailSequence) => void;
  onSequenceUpdate?: (sequence: EmailSequence) => void;
  onCampaignStart?: (campaign: EmailCampaign) => void;
}

const AutomatedEmailSequences: React.FC<AutomatedEmailSequencesProps> = ({
  onSequenceCreate,
  onSequenceUpdate,
  onCampaignStart,
}) => {
  const theme = useTheme();
  const [sequences, setSequences] = useState<EmailSequence[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [isSequenceDialogOpen, setIsSequenceDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState<EmailSequence | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = () => {
    // Initialize email templates
    const sampleTemplates: EmailTemplate[] = [
      {
        id: 'template-1',
        name: 'Willkommens-E-Mail',
        subject: 'Willkommen bei {{company_name}}, {{customer_name}}!',
        content: `Liebe/r {{customer_name}},

vielen Dank für Ihr Vertrauen in unsere Umzugsdienstleistungen!

Wir freuen uns, Sie als neuen Kunden begrüßen zu dürfen und stehen Ihnen mit unserem erfahrenen Team zur Seite.

Nächste Schritte:
- Wir werden uns in den nächsten 24 Stunden bei Ihnen melden
- Unser Team erstellt einen detaillierten Umzugsplan
- Sie erhalten ein individuelles Angebot

Bei Fragen stehen wir Ihnen jederzeit zur Verfügung.

Mit freundlichen Grüßen,
Ihr {{company_name}} Team`,
        type: 'welcome',
        variables: ['customer_name', 'company_name'],
        isActive: true,
      },
      {
        id: 'template-2',
        name: 'Angebot Follow-Up',
        subject: 'Ihr Umzugsangebot - Haben Sie Fragen?',
        content: `Hallo {{customer_name}},

vor {{days_since_quote}} Tagen haben wir Ihnen ein Angebot für Ihren Umzug unterbreitet.

Falls Sie Fragen haben oder Details besprechen möchten, stehen wir Ihnen gerne zur Verfügung.

Unser Angebot im Überblick:
- Umzugstermin: {{moving_date}}
- Geschätzter Preis: {{quote_amount}}€
- Inklusive: {{included_services}}

Gerne können Sie uns unter {{phone}} anrufen oder direkt auf diese E-Mail antworten.

Beste Grüße,
{{agent_name}}`,
        type: 'follow_up',
        variables: ['customer_name', 'days_since_quote', 'moving_date', 'quote_amount', 'included_services', 'phone', 'agent_name'],
        isActive: true,
      },
      {
        id: 'template-3',
        name: 'Umzug Erinnerung',
        subject: 'Erinnerung: Ihr Umzug steht bevor!',
        content: `Liebe/r {{customer_name}},

Ihr Umzugstermin rückt näher! In {{days_until_move}} Tagen ist es soweit.

Wichtige Informationen:
- Datum: {{moving_date}}
- Uhrzeit: {{moving_time}}
- Team: {{crew_members}}
- Fahrzeug: {{truck_type}}

Checklist für den Umzugstag:
□ Kartons beschriftet und verschlossen
□ Zerbrechliche Gegenstände extra verpackt
□ Hausschlüssel bereithalten
□ Parkplätze reserviert

Bei Fragen erreichen Sie uns unter {{emergency_phone}}.

Ihr Umzugsteam freut sich auf Sie!`,
        type: 'reminder',
        variables: ['customer_name', 'days_until_move', 'moving_date', 'moving_time', 'crew_members', 'truck_type', 'emergency_phone'],
        isActive: true,
      },
      {
        id: 'template-4',
        name: 'Danke nach Umzug',
        subject: 'Vielen Dank für Ihr Vertrauen!',
        content: `Liebe/r {{customer_name}},

vielen Dank, dass Sie sich für {{company_name}} entschieden haben!

Wir hoffen, dass Ihr Umzug zu Ihrer vollsten Zufriedenheit verlaufen ist und Sie sich in Ihrem neuen Zuhause wohlfühlen.

Falls Sie Feedback für uns haben oder Fragen aufkommen sollten, zögern Sie nicht, uns zu kontaktieren.

Als kleines Dankeschön erhalten Sie 10% Rabatt auf Ihren nächsten Umzug (Code: TREUKUNDE10).

Empfehlen Sie uns gerne weiter - für jede erfolgreiche Empfehlung erhalten Sie eine Gutschrift von 50€.

Alles Gute in Ihrem neuen Zuhause!`,
        type: 'thank_you',
        variables: ['customer_name', 'company_name'],
        isActive: true,
      },
    ];

    // Initialize sequences
    const sampleSequences: EmailSequence[] = [
      {
        id: 'sequence-1',
        name: 'Neukunden Willkommens-Sequenz',
        description: 'Automatische Begrüßung und Information für neue Kunden',
        trigger: 'quote_sent',
        isActive: true,
        steps: [
          {
            id: 'step-1',
            template: sampleTemplates[0],
            delay: 1,
            delayType: 'hours',
            isActive: true,
          },
          {
            id: 'step-2',
            template: sampleTemplates[1],
            delay: 3,
            delayType: 'days',
            isActive: true,
          },
          {
            id: 'step-3',
            template: sampleTemplates[1],
            delay: 1,
            delayType: 'weeks',
            isActive: true,
          },
        ],
        stats: {
          sent: 245,
          opened: 198,
          clicked: 87,
          replied: 23,
          unsubscribed: 3,
        },
      },
      {
        id: 'sequence-2',
        name: 'Umzug Erinnerungs-Sequenz',
        description: 'Erinnerungen und Checklists vor dem Umzugstermin',
        trigger: 'date_based',
        isActive: true,
        steps: [
          {
            id: 'step-4',
            template: sampleTemplates[2],
            delay: 7,
            delayType: 'days',
            isActive: true,
          },
          {
            id: 'step-5',
            template: sampleTemplates[2],
            delay: 3,
            delayType: 'days',
            isActive: true,
          },
          {
            id: 'step-6',
            template: sampleTemplates[2],
            delay: 1,
            delayType: 'days',
            isActive: true,
          },
        ],
        stats: {
          sent: 156,
          opened: 142,
          clicked: 98,
          replied: 34,
          unsubscribed: 1,
        },
      },
      {
        id: 'sequence-3',
        name: 'Nach-Umzug Follow-Up',
        description: 'Dankeschön und Feedback-Anfragen nach abgeschlossenem Umzug',
        trigger: 'service_completed',
        isActive: true,
        steps: [
          {
            id: 'step-7',
            template: sampleTemplates[3],
            delay: 1,
            delayType: 'days',
            isActive: true,
          },
        ],
        stats: {
          sent: 89,
          opened: 76,
          clicked: 34,
          replied: 12,
          unsubscribed: 0,
        },
      },
    ];

    // Generate sample campaigns
    const sampleCampaigns: EmailCampaign[] = [];
    for (let i = 0; i < 15; i++) {
      const sequence = sampleSequences[Math.floor(Math.random() * sampleSequences.length)];
      const startedAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      const statuses: Array<EmailCampaign['status']> = ['active', 'paused', 'completed', 'cancelled'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      sampleCampaigns.push({
        id: `campaign-${i + 1}`,
        sequenceId: sequence.id,
        recipientId: `customer-${i + 1}`,
        recipientName: `Kunde ${i + 1}`,
        recipientEmail: `kunde${i + 1}@beispiel.de`,
        status,
        currentStep: Math.floor(Math.random() * sequence.steps.length),
        startedAt,
        nextEmailAt: status === 'active' ? addHours(new Date(), Math.random() * 48) : undefined,
        completedAt: status === 'completed' ? addDays(startedAt, 7) : undefined,
        emailsSent: Math.floor(Math.random() * 4) + 1,
        emailsOpened: Math.floor(Math.random() * 3),
        emailsClicked: Math.floor(Math.random() * 2),
      });
    }

    setTemplates(sampleTemplates);
    setSequences(sampleSequences);
    setCampaigns(sampleCampaigns.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime()));
  };

  const handleSequenceToggle = (sequenceId: string, isActive: boolean) => {
    setSequences(prev => prev.map(sequence => 
      sequence.id === sequenceId ? { ...sequence, isActive } : sequence
    ));
  };

  const handleCampaignAction = (campaignId: string, action: 'pause' | 'resume' | 'stop') => {
    setCampaigns(prev => prev.map(campaign => {
      if (campaign.id === campaignId) {
        switch (action) {
          case 'pause':
            return { ...campaign, status: 'paused' };
          case 'resume':
            return { ...campaign, status: 'active' };
          case 'stop':
            return { ...campaign, status: 'cancelled' };
          default:
            return campaign;
        }
      }
      return campaign;
    }));
  };

  const getSequenceOpenRate = (sequence: EmailSequence) => {
    return sequence.stats.sent > 0 ? (sequence.stats.opened / sequence.stats.sent * 100) : 0;
  };

  const getSequenceClickRate = (sequence: EmailSequence) => {
    return sequence.stats.opened > 0 ? (sequence.stats.clicked / sequence.stats.opened * 100) : 0;
  };

  const getSequenceReplyRate = (sequence: EmailSequence) => {
    return sequence.stats.sent > 0 ? (sequence.stats.replied / sequence.stats.sent * 100) : 0;
  };

  const getStatusColor = (status: EmailCampaign['status']) => {
    switch (status) {
      case 'active': return 'success';
      case 'paused': return 'warning';
      case 'completed': return 'info';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: EmailCampaign['status']) => {
    switch (status) {
      case 'active': return 'Aktiv';
      case 'paused': return 'Pausiert';
      case 'completed': return 'Abgeschlossen';
      case 'cancelled': return 'Abgebrochen';
      default: return status;
    }
  };

  const getTriggerLabel = (trigger: EmailSequence['trigger']) => {
    switch (trigger) {
      case 'quote_sent': return 'Angebot versendet';
      case 'service_completed': return 'Service abgeschlossen';
      case 'manual': return 'Manuell';
      case 'date_based': return 'Datumsbasiert';
      case 'behavior_based': return 'Verhaltensbasiert';
      default: return trigger;
    }
  };

  const renderSequencesList = () => (
    <Grid container spacing={3}>
      {sequences.map((sequence, index) => (
        <Grid item xs={12} md={6} lg={4} key={sequence.id}>
          <AnimatedCard delay={index * 100}>
            <Box
              sx={{
                background: sequence.isActive
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
                      {sequence.name}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {sequence.steps.length} Schritte
                    </Typography>
                  </Box>
                  
                  <Switch
                    checked={sequence.isActive}
                    onChange={(e) => handleSequenceToggle(sequence.id, e.target.checked)}
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
                  {sequence.description}
                </Typography>
                
                <Chip
                  label={getTriggerLabel(sequence.trigger)}
                  size="small"
                  sx={{ 
                    backgroundColor: alpha('#fff', 0.2),
                    color: 'white',
                    mb: 2,
                  }}
                />
                
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption">Öffnungsrate</Typography>
                    <Typography variant="caption">{getSequenceOpenRate(sequence).toFixed(1)}%</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={getSequenceOpenRate(sequence)}
                    sx={{
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: alpha('#fff', 0.8),
                      },
                      backgroundColor: alpha('#fff', 0.2),
                    }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setSelectedSequence(sequence);
                      setIsSequenceDialogOpen(true);
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
                    Bearbeiten
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
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
                </Box>
              </CardContent>
            </Box>
          </AnimatedCard>
        </Grid>
      ))}
    </Grid>
  );

  const renderCampaignsList = () => (
    <TableContainer component={Paper} elevation={1}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Empfänger</TableCell>
            <TableCell>Sequenz</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Schritt</TableCell>
            <TableCell align="right">Gesendet</TableCell>
            <TableCell align="right">Geöffnet</TableCell>
            <TableCell>Nächste E-Mail</TableCell>
            <TableCell>Aktionen</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {campaigns.slice(0, 10).map((campaign) => {
            const sequence = sequences.find(s => s.id === campaign.sequenceId);
            return (
              <TableRow key={campaign.id} hover>
                <TableCell>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {campaign.recipientName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {campaign.recipientEmail}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {sequence?.name || 'Unbekannt'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={getStatusLabel(campaign.status)}
                    size="small"
                    color={getStatusColor(campaign.status)}
                  />
                </TableCell>
                <TableCell align="right">
                  {campaign.currentStep + 1} / {sequence?.steps.length || 0}
                </TableCell>
                <TableCell align="right">{campaign.emailsSent}</TableCell>
                <TableCell align="right">{campaign.emailsOpened}</TableCell>
                <TableCell>
                  {campaign.nextEmailAt ? (
                    <Typography variant="caption">
                      {format(campaign.nextEmailAt, 'dd.MM. HH:mm', { locale: de })}
                    </Typography>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      -
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {campaign.status === 'active' && (
                      <Tooltip title="Pausieren">
                        <IconButton
                          size="small"
                          onClick={() => handleCampaignAction(campaign.id, 'pause')}
                        >
                          <PauseIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {campaign.status === 'paused' && (
                      <Tooltip title="Fortsetzen">
                        <IconButton
                          size="small"
                          onClick={() => handleCampaignAction(campaign.id, 'resume')}
                        >
                          <PlayIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {(campaign.status === 'active' || campaign.status === 'paused') && (
                      <Tooltip title="Stoppen">
                        <IconButton
                          size="small"
                          onClick={() => handleCampaignAction(campaign.id, 'stop')}
                        >
                          <StopIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderAnalytics = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <Card elevation={1}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SendIcon color="primary" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {sequences.reduce((sum, seq) => sum + seq.stats.sent, 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  E-Mails gesendet
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
              <MarkEmailReadIcon color="success" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {(sequences.reduce((sum, seq) => sum + seq.stats.opened, 0) / sequences.reduce((sum, seq) => sum + seq.stats.sent, 0) * 100).toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Öffnungsrate
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
              <TrendingUpIcon color="warning" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {(sequences.reduce((sum, seq) => sum + seq.stats.clicked, 0) / sequences.reduce((sum, seq) => sum + seq.stats.opened, 0) * 100).toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Klickrate
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
              <ReplyIcon color="info" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {sequences.reduce((sum, seq) => sum + seq.stats.replied, 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Antworten erhalten
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box>
      {/* Header */}
      <SlideInContainer>
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailIcon color="primary" />
              Automatisierte E-Mail-Sequenzen
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => {
                  setSelectedTemplate(null);
                  setIsTemplateDialogOpen(true);
                }}
              >
                Template
              </Button>
              
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setSelectedSequence(null);
                  setIsSequenceDialogOpen(true);
                }}
              >
                Neue Sequenz
              </Button>
            </Box>
          </Box>
          
          <Typography variant="body1" color="text.secondary">
            Automatisieren Sie Ihre Kundenkommunikation mit intelligenten E-Mail-Sequenzen
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
            <Tab label="Sequenzen" icon={<TimelineIcon />} />
            <Tab label="Aktive Kampagnen" icon={<SpeedIcon />} />
            <Tab label="Analytics" icon={<AssessmentIcon />} />
          </Tabs>
        </Paper>
      </SlideInContainer>

      {/* Tab Content */}
      <SlideInContainer delay={400}>
        {selectedTab === 0 && (
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
              E-Mail-Sequenzen
            </Typography>
            {renderSequencesList()}
          </Box>
        )}

        {selectedTab === 1 && (
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
              Aktive Kampagnen
            </Typography>
            {renderCampaignsList()}
          </Box>
        )}

        {selectedTab === 2 && (
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
              Performance Analytics
            </Typography>
            {renderAnalytics()}
          </Box>
        )}
      </SlideInContainer>

      {/* Create/Edit Sequence Dialog */}
      <Dialog
        open={isSequenceDialogOpen}
        onClose={() => setIsSequenceDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {selectedSequence ? 'Sequenz bearbeiten' : 'Neue Sequenz erstellen'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name der Sequenz"
                defaultValue={selectedSequence?.name || ''}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Auslöser</InputLabel>
                <Select
                  defaultValue={selectedSequence?.trigger || 'manual'}
                  label="Auslöser"
                >
                  <MenuItem value="quote_sent">Angebot versendet</MenuItem>
                  <MenuItem value="service_completed">Service abgeschlossen</MenuItem>
                  <MenuItem value="manual">Manuell</MenuItem>
                  <MenuItem value="date_based">Datumsbasiert</MenuItem>
                  <MenuItem value="behavior_based">Verhaltensbasiert</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Beschreibung"
                multiline
                rows={3}
                defaultValue={selectedSequence?.description || ''}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Sequenz-Schritte
              </Typography>
              
              {(selectedSequence?.steps || []).map((step, index) => (
                <Accordion key={step.id}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>
                      Schritt {index + 1}: {step.template.name} 
                      ({step.delay} {step.delayType === 'hours' ? 'Stunden' : 
                         step.delayType === 'days' ? 'Tage' : 'Wochen'} Verzögerung)
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Template</InputLabel>
                          <Select
                            defaultValue={step.template.id}
                            label="Template"
                          >
                            {templates.map((template) => (
                              <MenuItem key={template.id} value={template.id}>
                                {template.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={6} md={3}>
                        <TextField
                          fullWidth
                          label="Verzögerung"
                          type="number"
                          defaultValue={step.delay}
                        />
                      </Grid>
                      
                      <Grid item xs={6} md={3}>
                        <FormControl fullWidth>
                          <InputLabel>Einheit</InputLabel>
                          <Select
                            defaultValue={step.delayType}
                            label="Einheit"
                          >
                            <MenuItem value="hours">Stunden</MenuItem>
                            <MenuItem value="days">Tage</MenuItem>
                            <MenuItem value="weeks">Wochen</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}
              
              <Button
                startIcon={<AddIcon />}
                sx={{ mt: 2 }}
              >
                Schritt hinzufügen
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsSequenceDialogOpen(false)}>
            Abbrechen
          </Button>
          <Button variant="contained">
            {selectedSequence ? 'Aktualisieren' : 'Erstellen'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AutomatedEmailSequences;