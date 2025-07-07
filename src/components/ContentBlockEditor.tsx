import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  InputAdornment,
  Tabs,
  Tab,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatAlignLeft as AlignLeftIcon,
  FormatAlignCenter as AlignCenterIcon,
  FormatAlignRight as AlignRightIcon,
  ColorLens as ColorIcon
} from '@mui/icons-material';
import { ChromePicker } from 'react-color';
import Grid from './GridCompat';
import {
  TemplateContentBlock,
  ContentBlockType,
  ServiceCatalogItem
} from '../types/pdfTemplate';

interface ContentBlockEditorProps {
  block: Partial<TemplateContentBlock>;
  services: ServiceCatalogItem[];
  onClose: () => void;
  onSave: (block: Partial<TemplateContentBlock>) => void;
}

const ContentBlockEditor: React.FC<ContentBlockEditorProps> = ({
  block,
  services,
  onClose,
  onSave
}) => {
  const [editedBlock, setEditedBlock] = useState<Partial<TemplateContentBlock>>(block);
  const [activeTab, setActiveTab] = useState(0);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const handleFieldChange = (field: string, value: any) => {
    setEditedBlock({ ...editedBlock, [field]: value });
  };

  const handleSettingChange = (field: string, value: any) => {
    setEditedBlock({
      ...editedBlock,
      settings: {
        ...editedBlock.settings,
        [field]: value
      }
    });
  };

  const handleFontSettingChange = (field: string, value: any) => {
    setEditedBlock({
      ...editedBlock,
      settings: {
        ...editedBlock.settings,
        font: {
          ...editedBlock.settings?.font,
          [field]: value
        }
      }
    });
  };

  const handleContentChange = (field: string, value: any) => {
    setEditedBlock({
      ...editedBlock,
      content: {
        ...editedBlock.content,
        [field]: value
      }
    });
  };

  const handleAddService = (serviceId: string) => {
    if (!selectedServices.includes(serviceId)) {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  const handleRemoveService = (serviceId: string) => {
    setSelectedServices(selectedServices.filter(id => id !== serviceId));
  };

  const handleSave = () => {
    // Add selected services to content if applicable
    if (editedBlock.blockType === 'service_list' && selectedServices.length > 0) {
      const selectedServiceItems = services.filter(s => selectedServices.includes(s.id));
      handleContentChange('items', selectedServiceItems);
    }
    onSave(editedBlock);
  };

  const renderContentEditor = () => {
    switch (editedBlock.blockType) {
      case 'header':
      case 'footer':
      case 'custom':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Text/Template"
                multiline
                rows={4}
                value={editedBlock.content?.template || editedBlock.content?.text || ''}
                onChange={(e) => handleContentChange('template', e.target.value)}
                helperText="Verwenden Sie {{variable}} für dynamische Inhalte"
              />
            </Grid>
          </Grid>
        );

      case 'logo':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Das Logo wird aus den Branding-Einstellungen übernommen.
              </Typography>
            </Grid>
          </Grid>
        );

      case 'company_info':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Anzuzeigende Felder:
              </Typography>
              {['name', 'address', 'phone', 'email', 'website'].map(field => (
                <FormControlLabel
                  key={field}
                  control={
                    <Switch
                      checked={editedBlock.content?.data?.[field] !== false}
                      onChange={(e) => handleContentChange('data', {
                        ...editedBlock.content?.data,
                        [field]: e.target.checked
                      })}
                    />
                  }
                  label={field.charAt(0).toUpperCase() + field.slice(1)}
                />
              ))}
            </Grid>
          </Grid>
        );

      case 'customer_info':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Anzuzeigende Kundenfelder:
              </Typography>
              {['name', 'address', 'email', 'phone', 'company'].map(field => (
                <FormControlLabel
                  key={field}
                  control={
                    <Switch
                      checked={editedBlock.content?.data?.[field] !== false}
                      onChange={(e) => handleContentChange('data', {
                        ...editedBlock.content?.data,
                        [field]: e.target.checked
                      })}
                    />
                  }
                  label={field.charAt(0).toUpperCase() + field.slice(1)}
                />
              ))}
            </Grid>
          </Grid>
        );

      case 'service_list':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Überschrift"
                value={editedBlock.content?.title || ''}
                onChange={(e) => handleContentChange('title', e.target.value)}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Leistungen auswählen:
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Leistung hinzufügen</InputLabel>
                <Select
                  value=""
                  label="Leistung hinzufügen"
                  onChange={(e) => handleAddService(e.target.value as string)}
                >
                  {services
                    .filter(s => !selectedServices.includes(s.id))
                    .map(service => (
                      <MenuItem key={service.id} value={service.id}>
                        {service.serviceName}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              <List>
                {selectedServices.map(serviceId => {
                  const service = services.find(s => s.id === serviceId);
                  return service ? (
                    <ListItem key={serviceId}>
                      <ListItemText
                        primary={service.serviceName}
                        secondary={service.description}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveService(serviceId)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ) : null;
                })}
              </List>
            </Grid>
          </Grid>
        );

      case 'pricing_table':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Die Preistabelle wird automatisch aus den ausgewählten Leistungen generiert.
              </Typography>
            </Grid>
          </Grid>
        );

      case 'terms':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Überschrift"
                value={editedBlock.content?.title || 'Allgemeine Geschäftsbedingungen'}
                onChange={(e) => handleContentChange('title', e.target.value)}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bedingungstext"
                multiline
                rows={6}
                value={editedBlock.content?.text || ''}
                onChange={(e) => handleContentChange('text', e.target.value)}
              />
            </Grid>
          </Grid>
        );

      case 'signature':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Linke Beschriftung"
                value={editedBlock.content?.leftLabel || 'Ort, Datum'}
                onChange={(e) => handleContentChange('leftLabel', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Rechte Beschriftung"
                value={editedBlock.content?.rightLabel || 'Unterschrift'}
                onChange={(e) => handleContentChange('rightLabel', e.target.value)}
              />
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {block.id ? 'Block bearbeiten' : 'Neuen Block erstellen'}
      </DialogTitle>
      
      <DialogContent>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
          <Tab label="Grundeinstellungen" />
          <Tab label="Inhalt" />
          <Tab label="Styling" />
        </Tabs>

        {/* Tab 1: Basic Settings */}
        {activeTab === 0 && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                value={editedBlock.name || ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Blocktyp</InputLabel>
                <Select
                  value={editedBlock.blockType || 'custom'}
                  label="Blocktyp"
                  onChange={(e) => handleFieldChange('blockType', e.target.value)}
                >
                  <MenuItem value="header">Kopfzeile</MenuItem>
                  <MenuItem value="footer">Fußzeile</MenuItem>
                  <MenuItem value="logo">Logo</MenuItem>
                  <MenuItem value="company_info">Firmendaten</MenuItem>
                  <MenuItem value="customer_info">Kundendaten</MenuItem>
                  <MenuItem value="service_list">Leistungsliste</MenuItem>
                  <MenuItem value="pricing_table">Preistabelle</MenuItem>
                  <MenuItem value="terms">Bedingungen</MenuItem>
                  <MenuItem value="signature">Unterschrift</MenuItem>
                  <MenuItem value="custom">Benutzerdefiniert</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Seite"
                type="number"
                value={editedBlock.pageNumber || 1}
                onChange={(e) => handleFieldChange('pageNumber', Number(e.target.value))}
                inputProps={{ min: 1 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Position"
                type="number"
                value={editedBlock.position || 0}
                onChange={(e) => handleFieldChange('position', Number(e.target.value))}
                inputProps={{ min: 0 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editedBlock.isVisible !== false}
                    onChange={(e) => handleFieldChange('isVisible', e.target.checked)}
                  />
                }
                label="Sichtbar"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Position & Größe (optional)
              </Typography>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="X-Position"
                type="number"
                value={editedBlock.xPosition || ''}
                onChange={(e) => handleFieldChange('xPosition', e.target.value ? Number(e.target.value) : undefined)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">mm</InputAdornment>
                }}
              />
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Y-Position"
                type="number"
                value={editedBlock.yPosition || ''}
                onChange={(e) => handleFieldChange('yPosition', e.target.value ? Number(e.target.value) : undefined)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">mm</InputAdornment>
                }}
              />
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Breite"
                type="number"
                value={editedBlock.width || ''}
                onChange={(e) => handleFieldChange('width', e.target.value ? Number(e.target.value) : undefined)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">mm</InputAdornment>
                }}
              />
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="Höhe"
                type="number"
                value={editedBlock.height || ''}
                onChange={(e) => handleFieldChange('height', e.target.value ? Number(e.target.value) : undefined)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">mm</InputAdornment>
                }}
              />
            </Grid>
          </Grid>
        )}

        {/* Tab 2: Content */}
        {activeTab === 1 && (
          <Box>
            {renderContentEditor()}
          </Box>
        )}

        {/* Tab 3: Styling */}
        {activeTab === 2 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Schriftart
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Schriftfamilie</InputLabel>
                <Select
                  value={editedBlock.settings?.font?.family || 'helvetica'}
                  label="Schriftfamilie"
                  onChange={(e) => handleFontSettingChange('family', e.target.value)}
                >
                  <MenuItem value="helvetica">Helvetica</MenuItem>
                  <MenuItem value="times">Times</MenuItem>
                  <MenuItem value="courier">Courier</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Schriftgröße"
                type="number"
                value={editedBlock.settings?.font?.size || 10}
                onChange={(e) => handleFontSettingChange('size', Number(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">pt</InputAdornment>
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <IconButton
                  color={editedBlock.settings?.font?.weight === 'bold' ? 'primary' : 'default'}
                  onClick={() => handleFontSettingChange('weight', 
                    editedBlock.settings?.font?.weight === 'bold' ? 'normal' : 'bold'
                  )}
                >
                  <BoldIcon />
                </IconButton>
                <IconButton
                  color={editedBlock.settings?.font?.style === 'italic' ? 'primary' : 'default'}
                  onClick={() => handleFontSettingChange('style', 
                    editedBlock.settings?.font?.style === 'italic' ? 'normal' : 'italic'
                  )}
                >
                  <ItalicIcon />
                </IconButton>
                <Box sx={{ mx: 2 }}>|</Box>
                <IconButton
                  color={editedBlock.settings?.alignment === 'left' ? 'primary' : 'default'}
                  onClick={() => handleSettingChange('alignment', 'left')}
                >
                  <AlignLeftIcon />
                </IconButton>
                <IconButton
                  color={editedBlock.settings?.alignment === 'center' ? 'primary' : 'default'}
                  onClick={() => handleSettingChange('alignment', 'center')}
                >
                  <AlignCenterIcon />
                </IconButton>
                <IconButton
                  color={editedBlock.settings?.alignment === 'right' ? 'primary' : 'default'}
                  onClick={() => handleSettingChange('alignment', 'right')}
                >
                  <AlignRightIcon />
                </IconButton>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ position: 'relative' }}>
                <TextField
                  fullWidth
                  label="Textfarbe"
                  value={editedBlock.settings?.color || '#000000'}
                  onClick={() => setShowColorPicker(true)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box sx={{ 
                          width: 20, 
                          height: 20, 
                          backgroundColor: editedBlock.settings?.color || '#000000',
                          border: '1px solid #ccc'
                        }} />
                      </InputAdornment>
                    )
                  }}
                />
                {showColorPicker && (
                  <Box sx={{ position: 'absolute', zIndex: 2, top: '100%', left: 0 }}>
                    <Box sx={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0 }} 
                      onClick={() => setShowColorPicker(false)} 
                    />
                    <ChromePicker
                      color={editedBlock.settings?.color || '#000000'}
                      onChange={(color) => handleSettingChange('color', color.hex)}
                    />
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Abbrechen
        </Button>
        <Button onClick={handleSave} variant="contained">
          Speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContentBlockEditor;