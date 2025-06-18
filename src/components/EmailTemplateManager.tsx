import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Card, CardContent, CardActions, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Chip, Alert, Tab, Tabs, List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction, Divider, FormControlLabel, Switch, Tooltip, useTheme, CircularProgress, InputAdornment, Menu, Collapse, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import Grid from './GridCompat';
import {
  Email as EmailIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Send as SendIcon,
  Preview as PreviewIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Description as DescriptionIcon,
  Receipt as InvoiceIcon,
  Schedule as ReminderIcon,
  CheckCircle as ConfirmationIcon,
  Replay as FollowUpIcon,
  Person as WelcomeIcon,
  Settings as CustomIcon,
  Code as CodeIcon,
  Help as HelpIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import emailTemplateService, { EmailTemplate, AVAILABLE_VARIABLES } from '../services/emailTemplateService';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

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
      id={`email-template-tabpanel-${index}`}
      aria-labelledby={`email-template-tab-${index}`}
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

const getCategoryIcon = (category: EmailTemplate['category']) => {
  switch (category) {
    case 'quote': return <DescriptionIcon />;
    case 'invoice': return <InvoiceIcon />;
    case 'reminder': return <ReminderIcon />;
    case 'confirmation': return <ConfirmationIcon />;
    case 'follow_up': return <FollowUpIcon />;
    case 'welcome': return <WelcomeIcon />;
    case 'custom': return <CustomIcon />;
    default: return <EmailIcon />;
  }
};

const getCategoryLabel = (category: EmailTemplate['category']) => {
  switch (category) {
    case 'quote': return 'Angebot';
    case 'invoice': return 'Rechnung';
    case 'reminder': return 'Erinnerung';
    case 'confirmation': return 'Bestätigung';
    case 'follow_up': return 'Nachfassen';
    case 'welcome': return 'Willkommen';
    case 'custom': return 'Benutzerdefiniert';
    default: return category;
  }
};

const EmailTemplateManager: React.FC = () => {
  const theme = useTheme();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EmailTemplate['category'] | 'all'>('all');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<EmailTemplate | null>(null);
  const [variablesHelpOpen, setVariablesHelpOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    category: 'custom' as EmailTemplate['category'],
    description: '',
    isActive: true
  });

  useEffect(() => {
    loadTemplates();
    emailTemplateService.initializeDefaultTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await emailTemplateService.getAllTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Fehler beim Laden der E-Mail-Vorlagen:', error);
      setError('Fehler beim Laden der Vorlagen');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    if (tabValue === 0) {
      return matchesSearch && matchesCategory && template.isSystem;
    } else {
      return matchesSearch && matchesCategory && !template.isSystem;
    }
  });

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      subject: '',
      content: '',
      category: 'custom',
      description: '',
      isActive: true
    });
    setEditDialogOpen(true);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      content: template.content,
      category: template.category,
      description: template.description || '',
      isActive: template.isActive
    });
    setEditDialogOpen(true);
  };

  const handleDuplicateTemplate = async (template: EmailTemplate) => {
    try {
      const newName = `${template.name} (Kopie)`;
      await emailTemplateService.duplicateTemplate(template.id!, newName);
      setSuccess('Vorlage erfolgreich dupliziert');
      loadTemplates();
    } catch (error) {
      console.error('Fehler beim Duplizieren der Vorlage:', error);
      setError('Fehler beim Duplizieren der Vorlage');
    }
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete?.id) return;

    try {
      await emailTemplateService.deleteTemplate(templateToDelete.id);
      setSuccess('Vorlage erfolgreich gelöscht');
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
      loadTemplates();
    } catch (error: any) {
      console.error('Fehler beim Löschen der Vorlage:', error);
      setError(error.message || 'Fehler beim Löschen der Vorlage');
    }
  };

  const handleSaveTemplate = async () => {
    try {
      // Validierung
      const errors = emailTemplateService.validateTemplate(formData);
      if (errors.length > 0) {
        setError(errors.join(', '));
        return;
      }

      if (editingTemplate?.id) {
        // Update existing template
        await emailTemplateService.updateTemplate(editingTemplate.id, formData);
        setSuccess('Vorlage erfolgreich aktualisiert');
      } else {
        // Create new template
        const variables = emailTemplateService.extractVariables(formData.content);
        await emailTemplateService.createTemplate({
          ...formData,
          createdBy: 'user',
          variables,
          isSystem: false
        });
        setSuccess('Vorlage erfolgreich erstellt');
      }

      setEditDialogOpen(false);
      loadTemplates();
    } catch (error) {
      console.error('Fehler beim Speichern der Vorlage:', error);
      setError('Fehler beim Speichern der Vorlage');
    }
  };

  const handlePreviewTemplate = (template: EmailTemplate) => {
    setPreviewTemplate(template);
    setPreviewDialogOpen(true);
  };

  const insertVariable = (variable: string) => {
    const cursorPosition = (document.getElementById('template-content') as HTMLTextAreaElement)?.selectionStart || formData.content.length;
    const newContent = formData.content.slice(0, cursorPosition) + variable + formData.content.slice(cursorPosition);
    setFormData({ ...formData, content: newContent });
  };

  const renderPreview = () => {
    if (!previewTemplate) return null;

    // Beispieldaten für die Vorschau
    const sampleData = {
      customerName: 'Max Mustermann',
      customerEmail: 'max@example.com',
      customerPhone: '+49 123 456789',
      moveDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'dd.MM.yyyy'),
      fromAddress: 'Musterstraße 1, 12345 Musterstadt',
      toAddress: 'Beispielweg 2, 54321 Beispielstadt',
      quoteNumber: 'A-2025-001',
      quotePrice: '€ 1.250,00',
      invoiceNumber: 'R-2025-001',
      employeeName: 'Thomas Schmidt',
      quoteValidUntil: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'dd.MM.yyyy')
    };

    const previewContent = emailTemplateService.replaceVariables(previewTemplate.content, sampleData);
    const previewSubject = emailTemplateService.replaceVariables(previewTemplate.subject, sampleData);

    return (
      <Box>
        <TextField
          fullWidth
          label="Betreff"
          value={previewSubject}
          InputProps={{ readOnly: true }}
          sx={{ mb: 2 }}
        />
        <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {previewContent}
          </Typography>
        </Paper>
      </Box>
    );
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
      <Typography variant="h5" gutterBottom>
        E-Mail Vorlagen
      </Typography>

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Vorlagen durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Kategorie</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as any)}
                  label="Kategorie"
                >
                  <MenuItem value="all">Alle Kategorien</MenuItem>
                  <MenuItem value="quote">Angebot</MenuItem>
                  <MenuItem value="invoice">Rechnung</MenuItem>
                  <MenuItem value="reminder">Erinnerung</MenuItem>
                  <MenuItem value="confirmation">Bestätigung</MenuItem>
                  <MenuItem value="follow_up">Nachfassen</MenuItem>
                  <MenuItem value="welcome">Willkommen</MenuItem>
                  <MenuItem value="custom">Benutzerdefiniert</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={5} textAlign="right">
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateTemplate}
              >
                Neue Vorlage
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="System-Vorlagen" />
          <Tab label="Eigene Vorlagen" />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={2}>
          {filteredTemplates.map((template) => (
            <Grid item xs={12} md={6} key={template.id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    {getCategoryIcon(template.category)}
                    <Typography variant="h6" sx={{ ml: 1 }}>
                      {template.name}
                    </Typography>
                    {template.isActive && (
                      <Chip label="Aktiv" size="small" color="success" sx={{ ml: 'auto' }} />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {template.description}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Betreff:</strong> {template.subject}
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
                    {template.variables.slice(0, 3).map((variable) => (
                      <Chip key={variable} label={`{{${variable}}}`} size="small" variant="outlined" />
                    ))}
                    {template.variables.length > 3 && (
                      <Chip label={`+${template.variables.length - 3} mehr`} size="small" variant="outlined" />
                    )}
                  </Box>
                </CardContent>
                <CardActions>
                  <Button size="small" startIcon={<PreviewIcon />} onClick={() => handlePreviewTemplate(template)}>
                    Vorschau
                  </Button>
                  <Button size="small" startIcon={<CopyIcon />} onClick={() => handleDuplicateTemplate(template)}>
                    Duplizieren
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={2}>
          {filteredTemplates.map((template) => (
            <Grid item xs={12} md={6} key={template.id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    {getCategoryIcon(template.category)}
                    <Typography variant="h6" sx={{ ml: 1 }}>
                      {template.name}
                    </Typography>
                    {template.isActive && (
                      <Chip label="Aktiv" size="small" color="success" sx={{ ml: 'auto' }} />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {template.description}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Betreff:</strong> {template.subject}
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
                    {template.variables.slice(0, 3).map((variable) => (
                      <Chip key={variable} label={`{{${variable}}}`} size="small" variant="outlined" />
                    ))}
                    {template.variables.length > 3 && (
                      <Chip label={`+${template.variables.length - 3} mehr`} size="small" variant="outlined" />
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                    Erstellt: {format(template.createdAt, 'dd.MM.yyyy', { locale: de })}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" startIcon={<PreviewIcon />} onClick={() => handlePreviewTemplate(template)}>
                    Vorschau
                  </Button>
                  <Button size="small" startIcon={<EditIcon />} onClick={() => handleEditTemplate(template)}>
                    Bearbeiten
                  </Button>
                  <Button size="small" startIcon={<CopyIcon />} onClick={() => handleDuplicateTemplate(template)}>
                    Duplizieren
                  </Button>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {
                      setTemplateToDelete(template);
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

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTemplate ? 'Vorlage bearbeiten' : 'Neue Vorlage erstellen'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Kategorie</InputLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as EmailTemplate['category'] })}
                    label="Kategorie"
                  >
                    <MenuItem value="quote">Angebot</MenuItem>
                    <MenuItem value="invoice">Rechnung</MenuItem>
                    <MenuItem value="reminder">Erinnerung</MenuItem>
                    <MenuItem value="confirmation">Bestätigung</MenuItem>
                    <MenuItem value="follow_up">Nachfassen</MenuItem>
                    <MenuItem value="welcome">Willkommen</MenuItem>
                    <MenuItem value="custom">Benutzerdefiniert</MenuItem>
                  </Select>
                </FormControl>
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
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Betreff"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle2">Nachrichteninhalt</Typography>
                  <Button
                    size="small"
                    startIcon={<HelpIcon />}
                    onClick={() => setVariablesHelpOpen(!variablesHelpOpen)}
                  >
                    Verfügbare Variablen
                  </Button>
                </Box>
                <Collapse in={variablesHelpOpen}>
                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, maxHeight: 200 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Variable</TableCell>
                          <TableCell>Beschreibung</TableCell>
                          <TableCell>Beispiel</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {AVAILABLE_VARIABLES.map((variable) => (
                          <TableRow key={variable.key}>
                            <TableCell><code>{variable.key}</code></TableCell>
                            <TableCell>{variable.description}</TableCell>
                            <TableCell>{variable.example}</TableCell>
                            <TableCell>
                              <IconButton size="small" onClick={() => insertVariable(variable.key)}>
                                <AddIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Collapse>
                <TextField
                  id="template-content"
                  fullWidth
                  label="Inhalt"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  multiline
                  rows={10}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                  }
                  label="Vorlage ist aktiv"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={handleSaveTemplate} variant="contained" startIcon={<SaveIcon />}>
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onClose={() => setPreviewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Vorschau: {previewTemplate?.name}</Typography>
            <IconButton onClick={() => setPreviewDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {renderPreview()}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Vorlage löschen</DialogTitle>
        <DialogContent>
          <Typography>
            Möchten Sie die Vorlage "{templateToDelete?.name}" wirklich löschen?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={handleDeleteTemplate} color="error" variant="contained">
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmailTemplateManager;