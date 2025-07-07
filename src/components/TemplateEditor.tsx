import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Tabs,
  Tab,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Paper,
  Chip,
  Switch,
  FormControlLabel,
  InputAdornment,
  Tooltip,
  Alert
} from '@mui/material';
import Grid from './GridCompat';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Preview as PreviewIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  PDFTemplate,
  TemplateContentBlock,
  ContentBlockType,
  CompanyBranding,
  ServiceCatalogItem,
  BlockSettings,
  BlockContent
} from '../types/pdfTemplate';
import { pdfTemplateService } from '../services/pdfTemplateService';
import ContentBlockEditor from './ContentBlockEditor';

interface TemplateEditorProps {
  template: PDFTemplate;
  branding: CompanyBranding | null;
  services: ServiceCatalogItem[];
  onClose: () => void;
  onSave: (template: PDFTemplate) => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  branding,
  services,
  onClose,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [editedTemplate, setEditedTemplate] = useState(template);
  const [contentBlocks, setContentBlocks] = useState<TemplateContentBlock[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<TemplateContentBlock | null>(null);
  const [blockEditorOpen, setBlockEditorOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadContentBlocks();
  }, [template.id]);

  const loadContentBlocks = async () => {
    try {
      const blocks = await pdfTemplateService.getContentBlocks(template.id);
      setContentBlocks(blocks);
    } catch (err) {
      setError('Fehler beim Laden der Inhaltsblöcke');
      console.error(err);
    }
  };

  const handleTemplateChange = (field: keyof PDFTemplate, value: any) => {
    setEditedTemplate({ ...editedTemplate, [field]: value });
  };

  const handlePageSettingChange = (field: string, value: any) => {
    setEditedTemplate({
      ...editedTemplate,
      pageSettings: {
        ...editedTemplate.pageSettings,
        [field]: value
      }
    });
  };

  const handleMarginChange = (side: string, value: number) => {
    setEditedTemplate({
      ...editedTemplate,
      pageSettings: {
        ...editedTemplate.pageSettings,
        margins: {
          ...editedTemplate.pageSettings.margins,
          [side]: value
        }
      }
    });
  };

  const handleAddBlock = () => {
    const newBlock: Partial<TemplateContentBlock> = {
      templateId: template.id,
      blockType: 'custom',
      name: 'Neuer Block',
      position: contentBlocks.length,
      pageNumber: 1,
      isVisible: true,
      settings: {},
      content: {}
    };
    setSelectedBlock(newBlock as TemplateContentBlock);
    setBlockEditorOpen(true);
  };

  const handleEditBlock = (block: TemplateContentBlock) => {
    setSelectedBlock(block);
    setBlockEditorOpen(true);
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!window.confirm('Möchten Sie diesen Block wirklich löschen?')) return;

    try {
      await pdfTemplateService.deleteContentBlock(blockId);
      setContentBlocks(contentBlocks.filter(b => b.id !== blockId));
    } catch (err) {
      setError('Fehler beim Löschen des Blocks');
      console.error(err);
    }
  };

  const handleToggleBlockVisibility = async (block: TemplateContentBlock) => {
    try {
      const updated = await pdfTemplateService.updateContentBlock(block.id, {
        isVisible: !block.isVisible
      });
      setContentBlocks(contentBlocks.map(b => b.id === block.id ? updated : b));
    } catch (err) {
      setError('Fehler beim Aktualisieren des Blocks');
      console.error(err);
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(contentBlocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update positions
    const updates = items.map((item, index) => ({
      id: item.id,
      position: index
    }));

    setContentBlocks(items);

    try {
      await pdfTemplateService.reorderContentBlocks(template.id, updates);
    } catch (err) {
      setError('Fehler beim Neuordnen der Blöcke');
      console.error(err);
    }
  };

  const handleSaveTemplate = async () => {
    setLoading(true);
    setError(null);
    try {
      const updated = await pdfTemplateService.updateTemplate(template.id, {
        name: editedTemplate.name,
        description: editedTemplate.description,
        pageSettings: editedTemplate.pageSettings
      });
      onSave(updated);
    } catch (err) {
      setError('Fehler beim Speichern der Vorlage');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getBlockTypeIcon = (type: ContentBlockType) => {
    const icons: Record<ContentBlockType, string> = {
      header: '📄',
      footer: '📑',
      logo: '🏢',
      company_info: '🏭',
      customer_info: '👤',
      service_list: '📋',
      pricing_table: '💰',
      terms: '📜',
      signature: '✍️',
      custom: '📝'
    };
    return icons[type] || '📝';
  };

  const getBlockTypeLabel = (type: ContentBlockType) => {
    const labels: Record<ContentBlockType, string> = {
      header: 'Kopfzeile',
      footer: 'Fußzeile',
      logo: 'Logo',
      company_info: 'Firmendaten',
      customer_info: 'Kundendaten',
      service_list: 'Leistungsliste',
      pricing_table: 'Preistabelle',
      terms: 'Bedingungen',
      signature: 'Unterschrift',
      custom: 'Benutzerdefiniert'
    };
    return labels[type] || type;
  };

  return (
    <Dialog open fullScreen>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Vorlage bearbeiten: {template.name}
          </Typography>
          <Box>
            <Button
              startIcon={<PreviewIcon />}
              onClick={() => {/* TODO: Preview */}}
              sx={{ mr: 2 }}
            >
              Vorschau
            </Button>
            <Button onClick={onClose}>
              Schließen
            </Button>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            <Tab label="Grundeinstellungen" />
            <Tab label="Inhaltsblöcke" />
            <Tab label="Variablen" />
          </Tabs>
        </Box>

        {/* Tab 1: Basic Settings */}
        {activeTab === 0 && (
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={editedTemplate.name}
                  onChange={(e) => handleTemplateChange('name', e.target.value)}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled>
                  <InputLabel>Vorlagentyp</InputLabel>
                  <Select value={editedTemplate.templateType} label="Vorlagentyp">
                    <MenuItem value="quote">Angebot</MenuItem>
                    <MenuItem value="invoice">Rechnung</MenuItem>
                    <MenuItem value="contract">Vertrag</MenuItem>
                    <MenuItem value="receipt">Quittung</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Beschreibung"
                  multiline
                  rows={3}
                  value={editedTemplate.description || ''}
                  onChange={(e) => handleTemplateChange('description', e.target.value)}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Seiteneinstellungen
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Format</InputLabel>
                  <Select
                    value={editedTemplate.pageSettings.format}
                    label="Format"
                    onChange={(e) => handlePageSettingChange('format', e.target.value)}
                  >
                    <MenuItem value="A4">A4</MenuItem>
                    <MenuItem value="Letter">Letter</MenuItem>
                    <MenuItem value="Legal">Legal</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Ausrichtung</InputLabel>
                  <Select
                    value={editedTemplate.pageSettings.orientation}
                    label="Ausrichtung"
                    onChange={(e) => handlePageSettingChange('orientation', e.target.value)}
                  >
                    <MenuItem value="portrait">Hochformat</MenuItem>
                    <MenuItem value="landscape">Querformat</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Seitenränder (mm)
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth
                      label="Oben"
                      type="number"
                      value={editedTemplate.pageSettings.margins.top}
                      onChange={(e) => handleMarginChange('top', Number(e.target.value))}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">mm</InputAdornment>
                      }}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth
                      label="Rechts"
                      type="number"
                      value={editedTemplate.pageSettings.margins.right}
                      onChange={(e) => handleMarginChange('right', Number(e.target.value))}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">mm</InputAdornment>
                      }}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth
                      label="Unten"
                      type="number"
                      value={editedTemplate.pageSettings.margins.bottom}
                      onChange={(e) => handleMarginChange('bottom', Number(e.target.value))}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">mm</InputAdornment>
                      }}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth
                      label="Links"
                      type="number"
                      value={editedTemplate.pageSettings.margins.left}
                      onChange={(e) => handleMarginChange('left', Number(e.target.value))}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">mm</InputAdornment>
                      }}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Tab 2: Content Blocks */}
        {activeTab === 1 && (
          <Box sx={{ mt: 3 }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Inhaltsblöcke
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddBlock}
              >
                Block hinzufügen
              </Button>
            </Box>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="blocks">
                {(provided) => (
                  <List {...provided.droppableProps} ref={provided.innerRef}>
                    {contentBlocks.map((block, index) => (
                      <Draggable key={block.id} draggableId={block.id} index={index}>
                        {(provided, snapshot) => (
                          <ListItem
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            sx={{
                              backgroundColor: snapshot.isDragging ? 'action.hover' : 'background.paper',
                              mb: 1,
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 1
                            }}
                          >
                            <Box {...provided.dragHandleProps} sx={{ mr: 2 }}>
                              <DragIcon />
                            </Box>
                            
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="h6" component="span">
                                    {getBlockTypeIcon(block.blockType)}
                                  </Typography>
                                  <Typography variant="subtitle1">
                                    {block.name}
                                  </Typography>
                                  <Chip
                                    label={getBlockTypeLabel(block.blockType)}
                                    size="small"
                                    color="primary"
                                  />
                                  {block.pageNumber > 1 && (
                                    <Chip
                                      label={`Seite ${block.pageNumber}`}
                                      size="small"
                                    />
                                  )}
                                </Box>
                              }
                              secondary={
                                <Typography variant="body2" color="text.secondary">
                                  Position: {block.position + 1}
                                  {block.xPosition && ` | X: ${block.xPosition}mm`}
                                  {block.yPosition && ` | Y: ${block.yPosition}mm`}
                                </Typography>
                              }
                            />
                            
                            <ListItemSecondaryAction>
                              <Tooltip title={block.isVisible ? 'Sichtbar' : 'Versteckt'}>
                                <IconButton
                                  edge="end"
                                  onClick={() => handleToggleBlockVisibility(block)}
                                >
                                  {block.isVisible ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                </IconButton>
                              </Tooltip>
                              <IconButton
                                edge="end"
                                onClick={() => handleEditBlock(block)}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                edge="end"
                                onClick={() => handleDeleteBlock(block.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </List>
                )}
              </Droppable>
            </DragDropContext>
          </Box>
        )}

        {/* Tab 3: Variables */}
        {activeTab === 2 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Template-Variablen
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Verwenden Sie diese Variablen in Ihren Inhaltsblöcken, um dynamische Inhalte einzufügen.
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Kundenvariablen
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="{{customer.name}}" 
                        secondary="Name des Kunden"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="{{customer.email}}" 
                        secondary="E-Mail-Adresse"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="{{customer.phone}}" 
                        secondary="Telefonnummer"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="{{customer.address}}" 
                        secondary="Adresse"
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Angebotsvariablen
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="{{quote.number}}" 
                        secondary="Angebotsnummer"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="{{quote.date}}" 
                        secondary="Angebotsdatum"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="{{quote.total}}" 
                        secondary="Gesamtbetrag"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="{{quote.validUntil}}" 
                        secondary="Gültig bis"
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Abbrechen
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSaveTemplate}
          disabled={loading}
        >
          Speichern
        </Button>
      </DialogActions>

      {/* Content Block Editor */}
      {blockEditorOpen && selectedBlock && (
        <ContentBlockEditor
          block={selectedBlock}
          services={services}
          onClose={() => {
            setBlockEditorOpen(false);
            setSelectedBlock(null);
          }}
          onSave={async (block) => {
            try {
              let saved: TemplateContentBlock;
              if (block.id) {
                saved = await pdfTemplateService.updateContentBlock(block.id, block);
                setContentBlocks(contentBlocks.map(b => b.id === saved.id ? saved : b));
              } else {
                saved = await pdfTemplateService.createContentBlock({
                  templateId: template.id,
                  blockType: block.blockType || 'custom',
                  name: block.name || 'Neuer Block',
                  position: block.position || contentBlocks.length,
                  pageNumber: block.pageNumber || 1,
                  settings: block.settings || {},
                  content: block.content || {},
                  isVisible: block.isVisible !== undefined ? block.isVisible : true,
                  ...(block.xPosition !== undefined && { xPosition: block.xPosition }),
                  ...(block.yPosition !== undefined && { yPosition: block.yPosition }),
                  ...(block.width !== undefined && { width: block.width }),
                  ...(block.height !== undefined && { height: block.height })
                });
                setContentBlocks([...contentBlocks, saved]);
              }
              setBlockEditorOpen(false);
              setSelectedBlock(null);
            } catch (err) {
              setError('Fehler beim Speichern des Blocks');
              console.error(err);
            }
          }}
        />
      )}
    </Dialog>
  );
};

export default TemplateEditor;