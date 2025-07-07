import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Chip,
  Divider,
  Alert
} from '@mui/material';
import Grid from './GridCompat';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { CompanyType } from '../types/company';
import { ServiceCatalogItem } from '../types/pdfTemplate';
import { pdfTemplateService } from '../services/pdfTemplateService';

interface ServiceCatalogEditorProps {
  companyType: CompanyType;
  services: ServiceCatalogItem[];
  onClose: () => void;
  onSave: (services: ServiceCatalogItem[]) => void;
}

interface ServiceForm {
  serviceCode: string;
  serviceName: string;
  description: string;
  unit: string;
  basePrice: number;
  category: string;
}

const ServiceCatalogEditor: React.FC<ServiceCatalogEditorProps> = ({
  companyType,
  services,
  onClose,
  onSave
}) => {
  const [editingService, setEditingService] = useState<ServiceCatalogItem | null>(null);
  const [formData, setFormData] = useState<ServiceForm>({
    serviceCode: '',
    serviceName: '',
    description: '',
    unit: '',
    basePrice: 0,
    category: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get unique categories
  const categories = Array.from(new Set(services.map(s => s.category).filter(Boolean)));

  const handleAddService = () => {
    setEditingService(null);
    setFormData({
      serviceCode: '',
      serviceName: '',
      description: '',
      unit: '',
      basePrice: 0,
      category: ''
    });
    setShowForm(true);
  };

  const handleEditService = (service: ServiceCatalogItem) => {
    setEditingService(service);
    setFormData({
      serviceCode: service.serviceCode,
      serviceName: service.serviceName,
      description: service.description || '',
      unit: service.unit || '',
      basePrice: service.basePrice || 0,
      category: service.category || ''
    });
    setShowForm(true);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!window.confirm('Möchten Sie diese Leistung wirklich löschen?')) return;

    try {
      setLoading(true);
      await pdfTemplateService.deleteService(serviceId);
      const updatedServices = services.filter(s => s.id !== serviceId);
      onSave(updatedServices);
    } catch (err) {
      setError('Fehler beim Löschen der Leistung');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      if (editingService) {
        // Update existing service
        const updated = await pdfTemplateService.updateService(editingService.id, {
          serviceName: formData.serviceName,
          description: formData.description,
          unit: formData.unit,
          basePrice: formData.basePrice,
          category: formData.category
        });
        
        const updatedServices = services.map(s => s.id === updated.id ? updated : s);
        onSave(updatedServices);
      } else {
        // Create new service
        const newService = await pdfTemplateService.createService({
          companyType,
          serviceCode: formData.serviceCode,
          serviceName: formData.serviceName,
          description: formData.description,
          unit: formData.unit,
          basePrice: formData.basePrice,
          category: formData.category,
          isActive: true
        });
        
        onSave([...services, newService]);
      }

      setShowForm(false);
    } catch (err) {
      setError('Fehler beim Speichern der Leistung');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const groupedServices = services.reduce((acc, service) => {
    const category = service.category || 'Ohne Kategorie';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, ServiceCatalogItem[]>);

  const getUnitLabel = (unit: string) => {
    const units: Record<string, string> = {
      hour: 'Stunde',
      piece: 'Stück',
      sqm: 'm²',
      cbm: 'm³',
      km: 'km',
      flat: 'pauschal'
    };
    return units[unit] || unit;
  };

  return (
    <Dialog open onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Leistungskatalog verwalten
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddService}
          >
            Neue Leistung
          </Button>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {!showForm ? (
          <Box>
            {Object.entries(groupedServices).map(([category, categoryServices]) => (
              <Box key={category} sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CategoryIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="h6" color="text.secondary">
                    {category}
                  </Typography>
                  <Chip 
                    label={categoryServices.length} 
                    size="small" 
                    sx={{ ml: 1 }}
                  />
                </Box>
                <List>
                  {categoryServices.map((service, index) => (
                    <React.Fragment key={service.id}>
                      {index > 0 && <Divider />}
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle1">
                                {service.serviceName}
                              </Typography>
                              <Chip 
                                label={service.serviceCode} 
                                size="small" 
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              {service.description && (
                                <Typography variant="body2" color="text.secondary">
                                  {service.description}
                                </Typography>
                              )}
                              {service.basePrice !== undefined && service.basePrice > 0 && (
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                  Preis: € {service.basePrice.toFixed(2)} / {getUnitLabel(service.unit || 'flat')}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleEditService(service)}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() => handleDeleteService(service.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              </Box>
            ))}

            {services.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  Keine Leistungen vorhanden. Fügen Sie eine neue Leistung hinzu.
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          <Box>
            <Typography variant="h6" gutterBottom>
              {editingService ? 'Leistung bearbeiten' : 'Neue Leistung erstellen'}
            </Typography>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Leistungscode"
                  value={formData.serviceCode}
                  onChange={(e) => setFormData({ ...formData, serviceCode: e.target.value })}
                  disabled={!!editingService}
                  helperText="Eindeutiger Code, z.B. 'UMZ-001'"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Leistungsname"
                  value={formData.serviceName}
                  onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Beschreibung"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Kategorie</InputLabel>
                  <Select
                    value={formData.category}
                    label="Kategorie"
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <MenuItem value="">
                      <em>Neue Kategorie...</em>
                    </MenuItem>
                    {categories.map(cat => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {formData.category === '' && (
                  <TextField
                    fullWidth
                    label="Neue Kategorie"
                    sx={{ mt: 2 }}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                )}
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Einheit</InputLabel>
                  <Select
                    value={formData.unit}
                    label="Einheit"
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  >
                    <MenuItem value="flat">Pauschal</MenuItem>
                    <MenuItem value="hour">Stunde</MenuItem>
                    <MenuItem value="piece">Stück</MenuItem>
                    <MenuItem value="sqm">m²</MenuItem>
                    <MenuItem value="cbm">m³</MenuItem>
                    <MenuItem value="km">km</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Basispreis"
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>
                  }}
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button onClick={() => setShowForm(false)}>
                Abbrechen
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSubmit}
                disabled={loading || !formData.serviceCode || !formData.serviceName}
              >
                Speichern
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Schließen
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ServiceCatalogEditor;