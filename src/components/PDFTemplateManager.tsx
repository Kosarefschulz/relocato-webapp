import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  CardActions,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  FormControlLabel,
  Tooltip
} from '@mui/material';
import Grid from './GridCompat';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as DuplicateIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  GetApp as DownloadIcon,
  CloudUpload as UploadIcon,
  Settings as SettingsIcon,
  Palette as PaletteIcon,
  BusinessCenter as ServicesIcon,
  Description as TemplateIcon,
  Preview as PreviewIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { CompanyType, COMPANY_CONFIGS } from '../types/company';
import { 
  PDFTemplate, 
  TemplateType, 
  CompanyBranding, 
  ServiceCatalogItem 
} from '../types/pdfTemplate';
import { pdfTemplateService } from '../services/pdfTemplateService';
import { pdfTemplateGenerator } from '../services/pdfTemplateGenerator';
import TemplateEditor from './TemplateEditor';
import BrandingEditor from './BrandingEditor';
import ServiceCatalogEditor from './ServiceCatalogEditor';
import PDFPreview from './PDFPreview';

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
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const PDFTemplateManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedCompany, setSelectedCompany] = useState<CompanyType>('relocato');
  const [templates, setTemplates] = useState<PDFTemplate[]>([]);
  const [branding, setBranding] = useState<CompanyBranding | null>(null);
  const [services, setServices] = useState<ServiceCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PDFTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<PDFTemplate | null>(null);
  const [brandingDialogOpen, setBrandingDialogOpen] = useState(false);
  const [servicesDialogOpen, setServicesDialogOpen] = useState(false);
  
  // New template form
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    templateType: 'quote' as TemplateType,
    description: ''
  });

  useEffect(() => {
    loadData();
  }, [selectedCompany]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [templatesData, brandingData, servicesData] = await Promise.all([
        pdfTemplateService.getTemplates(selectedCompany),
        pdfTemplateService.getBranding(selectedCompany),
        pdfTemplateService.getServices(selectedCompany)
      ]);
      
      setTemplates(templatesData);
      setBranding(brandingData);
      setServices(servicesData);
    } catch (err) {
      setError('Fehler beim Laden der Daten');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      setLoading(true);
      const template = await pdfTemplateService.createTemplate({
        companyType: selectedCompany,
        templateType: newTemplate.templateType,
        name: newTemplate.name,
        description: newTemplate.description,
        isActive: false,
        pageSettings: {
          format: 'A4',
          orientation: 'portrait',
          margins: { top: 25, right: 25, bottom: 25, left: 25 }
        }
      });
      
      setTemplates([...templates, template]);
      setCreateDialogOpen(false);
      setNewTemplate({ name: '', templateType: 'quote', description: '' });
      
      // Open editor for new template
      setEditingTemplate(template);
    } catch (err) {
      setError('Fehler beim Erstellen der Vorlage');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateTemplate = async (template: PDFTemplate) => {
    const newName = prompt('Name für die neue Vorlage:', `${template.name} (Kopie)`);
    if (!newName) return;
    
    try {
      setLoading(true);
      const newTemplate = await pdfTemplateService.duplicateTemplate(template.id, newName);
      setTemplates([...templates, newTemplate]);
    } catch (err) {
      setError('Fehler beim Duplizieren der Vorlage');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm('Möchten Sie diese Vorlage wirklich löschen?')) return;
    
    try {
      setLoading(true);
      await pdfTemplateService.deleteTemplate(templateId);
      setTemplates(templates.filter(t => t.id !== templateId));
    } catch (err) {
      setError('Fehler beim Löschen der Vorlage');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (template: PDFTemplate) => {
    try {
      await pdfTemplateService.updateTemplate(template.id, {
        isActive: !template.isActive
      });
      setTemplates(templates.map(t => 
        t.id === template.id ? { ...t, isActive: !t.isActive } : t
      ));
    } catch (err) {
      setError('Fehler beim Aktualisieren der Vorlage');
      console.error(err);
    }
  };

  const handlePreview = async (template: PDFTemplate) => {
    setPreviewTemplate(template);
  };

  const renderTemplateCard = (template: PDFTemplate) => (
    <Card key={template.id} sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" component="div">
            {template.name}
          </Typography>
          <Box>
            <Chip
              label={template.templateType}
              size="small"
              color="primary"
              sx={{ mr: 1 }}
            />
            <Chip
              label={template.isActive ? 'Aktiv' : 'Inaktiv'}
              size="small"
              color={template.isActive ? 'success' : 'default'}
            />
          </Box>
        </Box>
        
        {template.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {template.description}
          </Typography>
        )}
        
        <Typography variant="caption" color="text.secondary">
          Erstellt am: {new Date(template.createdAt).toLocaleDateString('de-DE')}
        </Typography>
      </CardContent>
      
      <CardActions sx={{ justifyContent: 'space-between' }}>
        <Box>
          <Tooltip title="Bearbeiten">
            <IconButton size="small" onClick={() => setEditingTemplate(template)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Duplizieren">
            <IconButton size="small" onClick={() => handleDuplicateTemplate(template)}>
              <DuplicateIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Vorschau">
            <IconButton size="small" onClick={() => handlePreview(template)}>
              <PreviewIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Löschen">
            <IconButton size="small" onClick={() => handleDeleteTemplate(template.id)}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Switch
          checked={template.isActive}
          onChange={() => handleToggleActive(template)}
          size="small"
        />
      </CardActions>
    </Card>
  );

  return (
    <Container maxWidth="xl">
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            PDF-Vorlagen Verwaltung
          </Typography>
          
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Firma</InputLabel>
            <Select
              value={selectedCompany}
              label="Firma"
              onChange={(e) => setSelectedCompany(e.target.value as CompanyType)}
            >
              {Object.entries(COMPANY_CONFIGS).map(([key, config]) => (
                <MenuItem key={key} value={key}>
                  {config.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            <Tab icon={<TemplateIcon />} label="Vorlagen" />
            <Tab icon={<PaletteIcon />} label="Branding" />
            <Tab icon={<ServicesIcon />} label="Leistungskatalog" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Neue Vorlage
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {templates.map(template => (
                <Grid item xs={12} sm={6} md={4} key={template.id}>
                  {renderTemplateCard(template)}
                </Grid>
              ))}
              
              {templates.length === 0 && (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      Keine Vorlagen vorhanden. Erstellen Sie eine neue Vorlage.
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<SettingsIcon />}
              onClick={() => setBrandingDialogOpen(true)}
            >
              Branding bearbeiten
            </Button>
          </Box>

          {branding && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Aktuelles Branding
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Primärfarbe</Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      mt: 1 
                    }}>
                      <Box sx={{ 
                        width: 24, 
                        height: 24, 
                        backgroundColor: branding.primaryColor || '#000',
                        border: '1px solid #ccc'
                      }} />
                      <Typography variant="body2">{branding.primaryColor}</Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Sekundärfarbe</Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      mt: 1 
                    }}>
                      <Box sx={{ 
                        width: 24, 
                        height: 24, 
                        backgroundColor: branding.secondaryColor || '#000',
                        border: '1px solid #ccc'
                      }} />
                      <Typography variant="body2">{branding.secondaryColor}</Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Schriftart</Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {branding.fontFamily || 'Helvetica'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Logo</Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {branding.logoUrl ? 'Hochgeladen' : 'Nicht hochgeladen'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setServicesDialogOpen(true)}
            >
              Leistung hinzufügen
            </Button>
          </Box>

          <List>
            {services.map(service => (
              <ListItem key={service.id} divider>
                <ListItemText
                  primary={service.serviceName}
                  secondary={
                    <>
                      {service.description && (
                        <Typography component="span" variant="body2" color="text.secondary">
                          {service.description}
                        </Typography>
                      )}
                      {service.basePrice && (
                        <Typography component="span" variant="body2" sx={{ ml: 2 }}>
                          € {service.basePrice.toFixed(2)} / {service.unit || 'Einheit'}
                        </Typography>
                      )}
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" size="small">
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </TabPanel>
      </Paper>

      {/* Create Template Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Neue Vorlage erstellen</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              value={newTemplate.name}
              onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
            />
            
            <FormControl fullWidth>
              <InputLabel>Vorlagentyp</InputLabel>
              <Select
                value={newTemplate.templateType}
                label="Vorlagentyp"
                onChange={(e) => setNewTemplate({ ...newTemplate, templateType: e.target.value as TemplateType })}
              >
                <MenuItem value="quote">Angebot</MenuItem>
                <MenuItem value="invoice">Rechnung</MenuItem>
                <MenuItem value="contract">Vertrag</MenuItem>
                <MenuItem value="receipt">Quittung</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Beschreibung"
              multiline
              rows={3}
              value={newTemplate.description}
              onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Abbrechen</Button>
          <Button 
            onClick={handleCreateTemplate} 
            variant="contained"
            disabled={!newTemplate.name || loading}
          >
            Erstellen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Template Editor Dialog */}
      {editingTemplate && (
        <TemplateEditor
          template={editingTemplate}
          branding={branding}
          services={services}
          onClose={() => setEditingTemplate(null)}
          onSave={(updated) => {
            setTemplates(templates.map(t => t.id === updated.id ? updated : t));
            setEditingTemplate(null);
          }}
        />
      )}

      {/* Branding Editor Dialog */}
      {brandingDialogOpen && (
        <BrandingEditor
          companyType={selectedCompany}
          branding={branding}
          onClose={() => setBrandingDialogOpen(false)}
          onSave={(updated) => {
            setBranding(updated);
            setBrandingDialogOpen(false);
          }}
        />
      )}

      {/* Service Catalog Editor Dialog */}
      {servicesDialogOpen && (
        <ServiceCatalogEditor
          companyType={selectedCompany}
          services={services}
          onClose={() => setServicesDialogOpen(false)}
          onSave={(updated) => {
            setServices(updated);
            setServicesDialogOpen(false);
          }}
        />
      )}

      {/* PDF Preview Dialog */}
      {previewTemplate && (
        <Dialog
          open={true}
          onClose={() => setPreviewTemplate(null)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            PDF Vorschau
            <IconButton
              onClick={() => setPreviewTemplate(null)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <PDFPreview
              template={previewTemplate}
              contentBlocks={previewTemplate.contentBlocks || []}
              companyBranding={branding || undefined}
            />
          </DialogContent>
        </Dialog>
      )}
    </Container>
  );
};

export default PDFTemplateManager;