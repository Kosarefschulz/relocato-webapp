import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Description as TemplateIcon,
  Euro as EuroIcon,
  Build as ServiceIcon,
  LocalOffer as DiscountIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { QuoteTemplate } from '../types';
import { quoteTemplateService } from '../services/quoteTemplateService';
import { motion } from 'framer-motion';

const QuoteTemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<QuoteTemplate | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editMode, setEditMode] = useState<'create' | 'edit' | 'duplicate'>('create');

  // Form states
  const [formData, setFormData] = useState<Partial<QuoteTemplate>>({
    name: '',
    description: '',
    services: [],
    discounts: [],
    additionalText: {
      introduction: '',
      conclusion: '',
      terms: []
    },
    priceFactors: {
      floorMultiplier: 25,
      noElevatorMultiplier: 1.15,
      distanceBaseKm: 50,
      pricePerExtraKm: 1.2
    }
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const loadedTemplates = await quoteTemplateService.getTemplates();
      setTemplates(loadedTemplates);
    } catch (error) {
      console.error('Fehler beim Laden der Templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    setEditMode('create');
    setFormData({
      name: '',
      description: '',
      services: [],
      discounts: [],
      additionalText: {
        introduction: '',
        conclusion: '',
        terms: []
      },
      priceFactors: {
        floorMultiplier: 25,
        noElevatorMultiplier: 1.15,
        distanceBaseKm: 50,
        pricePerExtraKm: 1.2
      }
    });
    setShowEditDialog(true);
  };

  const handleEditTemplate = (template: QuoteTemplate) => {
    if (template.createdBy === 'System') {
      alert('System-Templates können nicht bearbeitet werden. Erstellen Sie stattdessen eine Kopie.');
      return;
    }
    setEditMode('edit');
    setSelectedTemplate(template);
    setFormData(template);
    setShowEditDialog(true);
  };

  const handleDuplicateTemplate = (template: QuoteTemplate) => {
    setEditMode('duplicate');
    setSelectedTemplate(template);
    setFormData({
      ...template,
      name: `${template.name} (Kopie)`,
      isDefault: false
    });
    setShowEditDialog(true);
  };

  const handleDeleteTemplate = (template: QuoteTemplate) => {
    if (template.createdBy === 'System') {
      alert('System-Templates können nicht gelöscht werden.');
      return;
    }
    setSelectedTemplate(template);
    setShowDeleteDialog(true);
  };

  const handleSetDefault = async (template: QuoteTemplate) => {
    try {
      await quoteTemplateService.setDefaultTemplate(template.id);
      await loadTemplates();
    } catch (error) {
      console.error('Fehler beim Setzen des Standard-Templates:', error);
    }
  };

  const handleSaveTemplate = async () => {
    try {
      if (editMode === 'edit' && selectedTemplate) {
        await quoteTemplateService.updateTemplate(selectedTemplate.id, formData);
      } else {
        await quoteTemplateService.createTemplate({
          ...formData as any,
          createdBy: 'User'
        });
      }
      await loadTemplates();
      setShowEditDialog(false);
    } catch (error) {
      console.error('Fehler beim Speichern des Templates:', error);
      alert('Fehler beim Speichern des Templates');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedTemplate) return;
    
    try {
      await quoteTemplateService.deleteTemplate(selectedTemplate.id);
      await loadTemplates();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Fehler beim Löschen des Templates:', error);
      alert('Fehler beim Löschen des Templates');
    }
  };

  const addService = () => {
    setFormData({
      ...formData,
      services: [
        ...(formData.services || []),
        {
          name: '',
          basePrice: 0,
          pricePerUnit: 0,
          unit: 'Pauschale' as const,
          included: false,
          category: 'sonstiges' as const
        }
      ]
    });
  };

  const updateService = (index: number, updates: any) => {
    const newServices = [...(formData.services || [])];
    newServices[index] = { ...newServices[index], ...updates };
    setFormData({ ...formData, services: newServices });
  };

  const removeService = (index: number) => {
    const newServices = formData.services?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, services: newServices });
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Angebots-Templates
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Verwalten Sie Ihre Angebotsvorlagen für schnellere Angebotserstellung
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateTemplate}
        >
          Neues Template
        </Button>
      </Box>

      {/* Template Grid */}
      <Grid container spacing={3}>
        {templates.map((template, index) => (
          <Grid item xs={12} md={6} lg={4} key={template.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {template.name}
                      </Typography>
                      {template.isDefault && (
                        <Chip
                          icon={<StarIcon />}
                          label="Standard"
                          size="small"
                          color="primary"
                          sx={{ mb: 1 }}
                        />
                      )}
                    </Box>
                    <Box>
                      {template.createdBy === 'System' && (
                        <Chip label="System" size="small" variant="outlined" />
                      )}
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" paragraph>
                    {template.description}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  {/* Services Overview */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ServiceIcon fontSize="small" />
                      Leistungen ({template.services.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                      {template.services.slice(0, 3).map((service, idx) => (
                        <Chip
                          key={idx}
                          label={service.name}
                          size="small"
                          variant={service.included ? "filled" : "outlined"}
                          color={service.included ? "success" : "default"}
                        />
                      ))}
                      {template.services.length > 3 && (
                        <Chip
                          label={`+${template.services.length - 3} weitere`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>

                  {/* Discounts */}
                  {template.discounts && template.discounts.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DiscountIcon fontSize="small" />
                        Rabatte
                      </Typography>
                      {template.discounts.map((discount, idx) => (
                        <Typography key={idx} variant="body2" color="text.secondary">
                          • {discount.name}: {discount.type === 'percentage' ? `${discount.value}%` : `${discount.value}€`}
                        </Typography>
                      ))}
                    </Box>
                  )}

                  {/* Price Factors */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EuroIcon fontSize="small" />
                      Preisfaktoren
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Etage: +{template.priceFactors?.floorMultiplier || 0}€ | 
                      Ohne Aufzug: x{template.priceFactors?.noElevatorMultiplier || 1}
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Box>
                    <Tooltip title="Als Standard setzen">
                      <IconButton
                        size="small"
                        onClick={() => handleSetDefault(template)}
                        disabled={template.isDefault}
                        color={template.isDefault ? "primary" : "default"}
                      >
                        {template.isDefault ? <StarIcon /> : <StarBorderIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Duplizieren">
                      <IconButton
                        size="small"
                        onClick={() => handleDuplicateTemplate(template)}
                      >
                        <CopyIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Box>
                    <Tooltip title="Bearbeiten">
                      <IconButton
                        size="small"
                        onClick={() => handleEditTemplate(template)}
                        disabled={template.createdBy === 'System'}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Löschen">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteTemplate(template)}
                        color="error"
                        disabled={template.createdBy === 'System'}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardActions>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Edit/Create Dialog */}
      <Dialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editMode === 'create' ? 'Neues Template erstellen' : 
           editMode === 'edit' ? 'Template bearbeiten' : 
           'Template duplizieren'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              sx={{ mb: 2 }}
              required
            />
            
            <TextField
              fullWidth
              label="Beschreibung"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={2}
              sx={{ mb: 3 }}
            />

            {/* Services */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Leistungen
              </Typography>
              <List>
                {formData.services?.map((service, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={4}>
                        <TextField
                          size="small"
                          fullWidth
                          label="Leistung"
                          value={service.name}
                          onChange={(e) => updateService(index, { name: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={2}>
                        <TextField
                          size="small"
                          fullWidth
                          label="Basispreis"
                          type="number"
                          value={service.basePrice}
                          onChange={(e) => updateService(index, { basePrice: Number(e.target.value) })}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">€</InputAdornment>
                          }}
                        />
                      </Grid>
                      <Grid item xs={2}>
                        <FormControl size="small" fullWidth>
                          <InputLabel>Einheit</InputLabel>
                          <Select
                            value={service.unit || 'Pauschale'}
                            onChange={(e) => updateService(index, { unit: e.target.value })}
                            label="Einheit"
                          >
                            <MenuItem value="Pauschale">Pauschale</MenuItem>
                            <MenuItem value="Stunde">Stunde</MenuItem>
                            <MenuItem value="qm">qm</MenuItem>
                            <MenuItem value="km">km</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={2}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={service.included}
                              onChange={(e) => updateService(index, { included: e.target.checked })}
                            />
                          }
                          label="Inkl."
                        />
                      </Grid>
                      <Grid item xs={1}>
                        <IconButton
                          size="small"
                          onClick={() => removeService(index)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </ListItem>
                ))}
              </List>
              <Button
                startIcon={<AddIcon />}
                onClick={addService}
                variant="outlined"
                size="small"
              >
                Leistung hinzufügen
              </Button>
            </Box>

            {/* Additional Text */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Zusatztexte
              </Typography>
              <TextField
                fullWidth
                label="Einleitung"
                value={formData.additionalText?.introduction || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  additionalText: {
                    ...formData.additionalText,
                    introduction: e.target.value
                  }
                })}
                multiline
                rows={2}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Schlusstext"
                value={formData.additionalText?.conclusion || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  additionalText: {
                    ...formData.additionalText,
                    conclusion: e.target.value
                  }
                })}
                multiline
                rows={2}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)}>Abbrechen</Button>
          <Button onClick={handleSaveTemplate} variant="contained">
            {editMode === 'edit' ? 'Speichern' : 'Erstellen'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle>Template löschen?</DialogTitle>
        <DialogContent>
          <Typography>
            Möchten Sie das Template "{selectedTemplate?.name}" wirklich löschen?
            Diese Aktion kann nicht rückgängig gemacht werden.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Abbrechen</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuoteTemplateManager;