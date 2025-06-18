import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Card, CardContent, CardActions, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Chip, Alert, List, ListItem, ListItemText, ListItemSecondaryAction, ListItemIcon, Switch, FormControlLabel, Tooltip, CircularProgress, Badge, Tab, Tabs, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider } from '@mui/material';
import Grid from './GridCompat';
import {
  Schedule as ScheduleIcon,
  Email as EmailIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Cancel as CancelIcon,
  Timer as TimerIcon,
  Send as SendIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  AutoMode as AutoModeIcon
} from '@mui/icons-material';
import followUpService, { FollowUpRule, ScheduledFollowUp } from '../services/followUpService';
import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import emailTemplateService, { EmailTemplate } from '../services/emailTemplateService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`follow-up-tabpanel-${index}`}
      aria-labelledby={`follow-up-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const getTriggerLabel = (trigger: FollowUpRule['triggerEvent']) => {
  switch (trigger) {
    case 'quote_sent': return 'Nach Angebotsversand';
    case 'quote_viewed': return 'Nach Angebotsansicht';
    case 'invoice_sent': return 'Nach Rechnungsversand';
    case 'customer_created': return 'Nach Kundenerstellung';
    case 'custom': return 'Benutzerdefiniert';
    default: return trigger;
  }
};

const getStatusIcon = (status: ScheduledFollowUp['status']) => {
  switch (status) {
    case 'pending': return <TimerIcon color="warning" />;
    case 'sent': return <CheckIcon color="success" />;
    case 'failed': return <ErrorIcon color="error" />;
    case 'cancelled': return <CancelIcon color="disabled" />;
    default: return null;
  }
};

const FollowUpManager: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [rules, setRules] = useState<FollowUpRule[]>([]);
  const [scheduledFollowUps, setScheduledFollowUps] = useState<ScheduledFollowUp[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dialog states
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<FollowUpRule | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<FollowUpRule | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    triggerEvent: 'quote_sent' as FollowUpRule['triggerEvent'],
    delayDays: 3,
    emailTemplateId: '',
    conditions: {
      quoteStatus: [] as string[],
      customerPriority: [] as string[],
      minQuoteValue: undefined as number | undefined,
      maxQuoteValue: undefined as number | undefined
    } as {
      quoteStatus?: string[];
      customerPriority?: string[];
      minQuoteValue?: number;
      maxQuoteValue?: number;
    }
  });

  // Statistics
  const stats = {
    totalRules: rules.length,
    activeRules: rules.filter(r => r.isActive).length,
    pendingFollowUps: scheduledFollowUps.filter(f => f.status === 'pending').length,
    sentToday: scheduledFollowUps.filter(f => 
      f.status === 'sent' && 
      f.lastAttemptAt && 
      new Date(f.lastAttemptAt).toDateString() === new Date().toDateString()
    ).length
  };

  useEffect(() => {
    loadData();
    followUpService.initializeDefaultRules();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rulesData, scheduledData, templatesData] = await Promise.all([
        followUpService.getAllRules(),
        followUpService.getScheduledFollowUps(),
        emailTemplateService.getAllTemplates()
      ]);
      
      setRules(rulesData);
      setScheduledFollowUps(scheduledData);
      setTemplates(templatesData.filter(t => t.isActive));
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
      setError('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessFollowUps = async () => {
    try {
      setProcessing(true);
      const pending = await followUpService.runManualCheck();
      setSuccess(`Follow-up Check abgeschlossen. ${pending} ausstehende Follow-ups.`);
      loadData();
    } catch (error) {
      console.error('Fehler beim Verarbeiten der Follow-ups:', error);
      setError('Fehler beim Verarbeiten der Follow-ups');
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateRule = () => {
    setEditingRule(null);
    setFormData({
      name: '',
      description: '',
      isActive: true,
      triggerEvent: 'quote_sent',
      delayDays: 3,
      emailTemplateId: '',
      conditions: {
        quoteStatus: [],
        customerPriority: [],
        minQuoteValue: undefined,
        maxQuoteValue: undefined
      }
    });
    setRuleDialogOpen(true);
  };

  const handleEditRule = (rule: FollowUpRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description,
      isActive: rule.isActive,
      triggerEvent: rule.triggerEvent,
      delayDays: rule.delayDays,
      emailTemplateId: rule.emailTemplateId,
      conditions: rule.conditions || {
        quoteStatus: [],
        customerPriority: [],
        minQuoteValue: undefined,
        maxQuoteValue: undefined
      }
    });
    setRuleDialogOpen(true);
  };

  const handleSaveRule = async () => {
    try {
      if (!formData.name || !formData.emailTemplateId) {
        setError('Bitte füllen Sie alle Pflichtfelder aus');
        return;
      }

      if (editingRule?.id) {
        await followUpService.updateRule(editingRule.id, formData);
        setSuccess('Regel erfolgreich aktualisiert');
      } else {
        await followUpService.createRule(formData);
        setSuccess('Regel erfolgreich erstellt');
      }

      setRuleDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Fehler beim Speichern der Regel:', error);
      setError('Fehler beim Speichern der Regel');
    }
  };

  const handleDeleteRule = async () => {
    if (!ruleToDelete?.id) return;

    try {
      await followUpService.deleteRule(ruleToDelete.id);
      setSuccess('Regel erfolgreich gelöscht');
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
      loadData();
    } catch (error) {
      console.error('Fehler beim Löschen der Regel:', error);
      setError('Fehler beim Löschen der Regel');
    }
  };

  const handleCancelFollowUp = async (id: string) => {
    try {
      await followUpService.cancelScheduledFollowUp(id);
      setSuccess('Follow-up erfolgreich storniert');
      loadData();
    } catch (error) {
      console.error('Fehler beim Stornieren des Follow-ups:', error);
      setError('Fehler beim Stornieren des Follow-ups');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          Automatische Follow-ups
        </Typography>
        <Button
          variant="contained"
          startIcon={processing ? <CircularProgress size={20} /> : <PlayIcon />}
          onClick={handleProcessFollowUps}
          disabled={processing}
        >
          {processing ? 'Verarbeite...' : 'Follow-ups prüfen'}
        </Button>
      </Box>

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AutoModeIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Regeln gesamt
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalRules}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckIcon color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Aktive Regeln
                  </Typography>
                  <Typography variant="h4">
                    {stats.activeRules}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TimerIcon color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Ausstehend
                  </Typography>
                  <Typography variant="h4">
                    {stats.pendingFollowUps}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <SendIcon color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Heute gesendet
                  </Typography>
                  <Typography variant="h4">
                    {stats.sentToday}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Follow-up Regeln" />
          <Tab 
            label={
              <Badge badgeContent={stats.pendingFollowUps} color="warning">
                Geplante Follow-ups
              </Badge>
            } 
          />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box mb={2} display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateRule}
            >
              Neue Regel
            </Button>
          </Box>

          <Grid container spacing={2}>
            {rules.map((rule) => (
              <Grid item xs={12} md={6} key={rule.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Typography variant="h6">
                        {rule.name}
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={rule.isActive}
                            onChange={async (e) => {
                              await followUpService.updateRule(rule.id!, { isActive: e.target.checked });
                              loadData();
                            }}
                          />
                        }
                        label="Aktiv"
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {rule.description}
                    </Typography>
                    
                    <Box mt={2}>
                      <Chip
                        icon={<CalendarIcon />}
                        label={getTriggerLabel(rule.triggerEvent)}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Chip
                        icon={<TimerIcon />}
                        label={`Nach ${rule.delayDays} Tagen`}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Chip
                        icon={<EmailIcon />}
                        label={`${rule.sentCount || 0} gesendet`}
                        size="small"
                      />
                    </Box>
                    
                    {rule.conditions && (
                      <Box mt={1}>
                        {rule.conditions.quoteStatus && rule.conditions.quoteStatus.length > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            Status: {rule.conditions.quoteStatus.join(', ')}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button size="small" startIcon={<EditIcon />} onClick={() => handleEditRule(rule)}>
                      Bearbeiten
                    </Button>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        setRuleToDelete(rule);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Status</TableCell>
                  <TableCell>Kunde</TableCell>
                  <TableCell>E-Mail</TableCell>
                  <TableCell>Geplant für</TableCell>
                  <TableCell>Regel</TableCell>
                  <TableCell>Aktionen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {scheduledFollowUps.map((followUp) => (
                  <TableRow key={followUp.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {getStatusIcon(followUp.status)}
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          {followUp.status}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{followUp.customerName}</TableCell>
                    <TableCell>{followUp.customerEmail}</TableCell>
                    <TableCell>
                      <Tooltip title={format(followUp.scheduledFor, 'dd.MM.yyyy HH:mm', { locale: de })}>
                        <span>
                          {formatDistanceToNow(followUp.scheduledFor, { addSuffix: true, locale: de })}
                        </span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {rules.find(r => r.id === followUp.ruleId)?.name || 'Unbekannt'}
                    </TableCell>
                    <TableCell>
                      {followUp.status === 'pending' && (
                        <Tooltip title="Stornieren">
                          <IconButton
                            size="small"
                            onClick={() => handleCancelFollowUp(followUp.id!)}
                          >
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      {/* Rule Dialog */}
      <Dialog open={ruleDialogOpen} onClose={() => setRuleDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingRule ? 'Regel bearbeiten' : 'Neue Follow-up Regel'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Beschreibung"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Trigger-Event</InputLabel>
                <Select
                  value={formData.triggerEvent}
                  onChange={(e) => setFormData({ ...formData, triggerEvent: e.target.value as any })}
                  label="Trigger-Event"
                >
                  <MenuItem value="quote_sent">Nach Angebotsversand</MenuItem>
                  <MenuItem value="quote_viewed">Nach Angebotsansicht</MenuItem>
                  <MenuItem value="invoice_sent">Nach Rechnungsversand</MenuItem>
                  <MenuItem value="customer_created">Nach Kundenerstellung</MenuItem>
                  <MenuItem value="custom">Benutzerdefiniert</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Verzögerung (Tage)"
                value={formData.delayDays}
                onChange={(e) => setFormData({ ...formData, delayDays: parseInt(e.target.value) || 0 })}
                inputProps={{ min: 0 }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>E-Mail Vorlage</InputLabel>
                <Select
                  value={formData.emailTemplateId}
                  onChange={(e) => setFormData({ ...formData, emailTemplateId: e.target.value })}
                  label="E-Mail Vorlage"
                >
                  {templates.map((template) => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name} ({template.category})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Divider />
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Bedingungen (optional)
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Angebotsstatus</InputLabel>
                <Select
                  multiple
                  value={formData.conditions.quoteStatus || []}
                  onChange={(e) => setFormData({
                    ...formData,
                    conditions: { ...formData.conditions, quoteStatus: e.target.value as string[] }
                  })}
                  label="Angebotsstatus"
                >
                  <MenuItem value="sent">Versendet</MenuItem>
                  <MenuItem value="viewed">Angesehen</MenuItem>
                  <MenuItem value="accepted">Angenommen</MenuItem>
                  <MenuItem value="rejected">Abgelehnt</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Kundenpriorität</InputLabel>
                <Select
                  multiple
                  value={formData.conditions.customerPriority || []}
                  onChange={(e) => setFormData({
                    ...formData,
                    conditions: { ...formData.conditions, customerPriority: e.target.value as string[] }
                  })}
                  label="Kundenpriorität"
                >
                  <MenuItem value="high">Hoch</MenuItem>
                  <MenuItem value="medium">Mittel</MenuItem>
                  <MenuItem value="low">Niedrig</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Min. Angebotswert"
                value={formData.conditions.minQuoteValue || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  conditions: { 
                    ...formData.conditions, 
                    minQuoteValue: e.target.value ? parseFloat(e.target.value) : undefined 
                  }
                })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Max. Angebotswert"
                value={formData.conditions.maxQuoteValue || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  conditions: { 
                    ...formData.conditions, 
                    maxQuoteValue: e.target.value ? parseFloat(e.target.value) : undefined 
                  }
                })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRuleDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={handleSaveRule} variant="contained">
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Regel löschen</DialogTitle>
        <DialogContent>
          <Typography>
            Möchten Sie die Regel "{ruleToDelete?.name}" wirklich löschen?
            Alle geplanten Follow-ups dieser Regel werden storniert.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={handleDeleteRule} color="error" variant="contained">
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FollowUpManager;