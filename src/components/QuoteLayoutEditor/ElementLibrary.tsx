import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Input,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  TextFields as TextIcon,
  Image as ImageIcon,
  TableChart as TableIcon,
  CropSquare as RectangleIcon,
  Circle as CircleIcon,
  Timeline as LineIcon,
  QrCode2 as QrCodeIcon,
  Draw as SignatureIcon,
  Code as VariableIcon,
  CloudUpload as UploadIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { LayoutElement, AVAILABLE_VARIABLES } from '../../types/layoutEditor';
import { useDrag } from 'react-dnd';

interface ElementLibraryProps {
  onAddElement: (element: LayoutElement) => void;
}

// Draggable element item
const DraggableElement: React.FC<{
  type: LayoutElement['type'];
  icon: React.ReactNode;
  label: string;
  onCreate: () => LayoutElement;
}> = ({ type, icon, label, onCreate }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'NEW_ELEMENT',
    item: { type, onCreate },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <Box ref={drag as any}>
      <ListItem
        sx={{
          opacity: isDragging ? 0.5 : 1,
          cursor: 'grab',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <ListItemIcon>{icon}</ListItemIcon>
        <ListItemText primary={label} />
      </ListItem>
    </Box>
  );
};

const ElementLibrary: React.FC<ElementLibraryProps> = ({ onAddElement }) => {
  const [expanded, setExpanded] = useState<string | false>('basic');
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showVariableDialog, setShowVariableDialog] = useState(false);
  const [selectedVariable, setSelectedVariable] = useState('');

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  // Create element functions
  const createElement = (type: LayoutElement['type']): LayoutElement => {
    const baseElement = {
      id: `element-${Date.now()}`,
      position: { x: 50, y: 50 },
      size: { width: 200, height: 50 },
      zIndex: 1,
      locked: false,
      visible: true,
    };

    switch (type) {
      case 'text':
        return {
          ...baseElement,
          type: 'text',
          size: { width: 200, height: 60 },
          properties: {
            type: 'text',
            content: 'Neuer Text',
            fontFamily: 'Arial',
            fontSize: 14,
            fontWeight: 'normal',
            fontStyle: 'normal',
            textAlign: 'left',
            lineHeight: 1.5,
            letterSpacing: 0,
            color: '#000000',
            padding: 10,
          },
        };

      case 'image':
        return {
          ...baseElement,
          type: 'image',
          size: { width: 150, height: 150 },
          properties: {
            type: 'image',
            src: imageUrl || 'https://via.placeholder.com/150',
            alt: 'Bild',
            fit: 'contain',
            opacity: 1,
          },
        };

      case 'table':
        return {
          ...baseElement,
          type: 'table',
          size: { width: 400, height: 200 },
          properties: {
            type: 'table',
            headers: ['Position', 'Beschreibung', 'Menge', 'Preis'],
            rows: [
              ['1', 'Umzugsservice', '1', '€ 450,00'],
              ['2', 'Verpackungsmaterial', '1', '€ 50,00'],
            ],
            showHeaders: true,
            headerStyle: {
              backgroundColor: '#f5f5f5',
              color: '#000000',
              fontWeight: 'bold',
              fontSize: 12,
            },
            cellStyle: {
              borderColor: '#dddddd',
              borderWidth: 1,
              padding: 8,
              fontSize: 11,
            },
          },
        };

      case 'shape':
        return {
          ...baseElement,
          type: 'shape',
          size: { width: 100, height: 100 },
          properties: {
            type: 'shape',
            shapeType: 'rectangle',
            fillColor: '#e3f2fd',
            strokeColor: '#1976d2',
            strokeWidth: 2,
            strokeStyle: 'solid',
          },
        };

      case 'variable':
        return {
          ...baseElement,
          type: 'variable',
          size: { width: 150, height: 30 },
          properties: {
            type: 'variable',
            variableName: selectedVariable || 'customerName',
            format: 'text',
            fallback: '[Nicht verfügbar]',
            style: {
              fontFamily: 'Arial',
              fontSize: 14,
              fontWeight: 'normal',
              color: '#000000',
            },
          },
        };

      case 'qrcode':
        return {
          ...baseElement,
          type: 'qrcode',
          size: { width: 120, height: 120 },
          properties: {
            type: 'qrcode',
            data: 'https://example.com/confirm',
            errorCorrectionLevel: 'M',
            margin: 4,
            darkColor: '#000000',
            lightColor: '#ffffff',
          },
        };

      case 'signature':
        return {
          ...baseElement,
          type: 'signature',
          size: { width: 200, height: 80 },
          properties: {
            type: 'signature',
            label: 'Unterschrift Kunde',
            lineColor: '#000000',
            lineWidth: 1,
            showDate: true,
            showName: true,
          },
        };

      default:
        throw new Error(`Unknown element type: ${type}`);
    }
  };

  const handleAddElement = (type: LayoutElement['type']) => {
    if (type === 'image') {
      setShowImageDialog(true);
      return;
    }
    if (type === 'variable') {
      setShowVariableDialog(true);
      return;
    }
    const element = createElement(type);
    onAddElement(element);
  };

  const handleAddImage = () => {
    const element = createElement('image');
    onAddElement(element);
    setShowImageDialog(false);
    setImageUrl('');
  };

  const handleAddVariable = () => {
    const element = createElement('variable');
    onAddElement(element);
    setShowVariableDialog(false);
    setSelectedVariable('');
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        width: 280,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: 1,
        borderColor: 'divider',
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Elemente</Typography>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {/* Basic Elements */}
        <Accordion expanded={expanded === 'basic'} onChange={handleAccordionChange('basic')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Basis Elemente</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <List dense>
              <ListItem onClick={() => handleAddElement('text')} sx={{ cursor: 'pointer' }}>
                <ListItemIcon><TextIcon /></ListItemIcon>
                <ListItemText primary="Text" />
              </ListItem>
              <ListItem onClick={() => handleAddElement('image')} sx={{ cursor: 'pointer' }}>
                <ListItemIcon><ImageIcon /></ListItemIcon>
                <ListItemText primary="Bild" />
              </ListItem>
              <ListItem onClick={() => handleAddElement('table')} sx={{ cursor: 'pointer' }}>
                <ListItemIcon><TableIcon /></ListItemIcon>
                <ListItemText primary="Tabelle" />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>

        {/* Shapes */}
        <Accordion expanded={expanded === 'shapes'} onChange={handleAccordionChange('shapes')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Formen</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <List dense>
              <ListItem onClick={() => {
                const element = createElement('shape');
                onAddElement(element);
              }} sx={{ cursor: 'pointer' }}>
                <ListItemIcon><RectangleIcon /></ListItemIcon>
                <ListItemText primary="Rechteck" />
              </ListItem>
              <ListItem onClick={() => {
                const element = createElement('shape');
                element.properties = {
                  ...element.properties,
                  type: 'shape',
                  shapeType: 'circle',
                } as any;
                onAddElement(element);
              }} sx={{ cursor: 'pointer' }}>
                <ListItemIcon><CircleIcon /></ListItemIcon>
                <ListItemText primary="Kreis" />
              </ListItem>
              <ListItem onClick={() => {
                const element = createElement('shape');
                element.properties = {
                  ...element.properties,
                  type: 'shape',
                  shapeType: 'line',
                } as any;
                element.size = { width: 200, height: 2 };
                onAddElement(element);
              }} sx={{ cursor: 'pointer' }}>
                <ListItemIcon><LineIcon /></ListItemIcon>
                <ListItemText primary="Linie" />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>

        {/* Dynamic Elements */}
        <Accordion expanded={expanded === 'dynamic'} onChange={handleAccordionChange('dynamic')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Dynamische Elemente</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <List dense>
              <ListItem onClick={() => handleAddElement('variable')} sx={{ cursor: 'pointer' }}>
                <ListItemIcon><VariableIcon /></ListItemIcon>
                <ListItemText primary="Variable" />
              </ListItem>
              <ListItem onClick={() => handleAddElement('qrcode')} sx={{ cursor: 'pointer' }}>
                <ListItemIcon><QrCodeIcon /></ListItemIcon>
                <ListItemText primary="QR-Code" />
              </ListItem>
              <ListItem onClick={() => handleAddElement('signature')} sx={{ cursor: 'pointer' }}>
                <ListItemIcon><SignatureIcon /></ListItemIcon>
                <ListItemText primary="Unterschrift" />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>

        {/* Company Assets */}
        <Accordion expanded={expanded === 'assets'} onChange={handleAccordionChange('assets')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Firmen-Assets</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ p: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<UploadIcon />}
                sx={{ mb: 1 }}
              >
                Briefpapier hochladen
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ImageIcon />}
              >
                Logo hochladen
              </Button>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* Image Upload Dialog */}
      <Dialog open={showImageDialog} onClose={() => setShowImageDialog(false)}>
        <DialogTitle>Bild hinzufügen</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Bild URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
            <Divider>ODER</Divider>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
            >
              Bild hochladen
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleImageUpload}
              />
            </Button>
            {imageUrl && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <img
                  src={imageUrl}
                  alt="Preview"
                  style={{ maxWidth: '100%', maxHeight: 200 }}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={() => setShowImageDialog(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleAddImage} disabled={!imageUrl}>
            Hinzufügen
          </Button>
        </Box>
      </Dialog>

      {/* Variable Selection Dialog */}
      <Dialog open={showVariableDialog} onClose={() => setShowVariableDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Variable auswählen</DialogTitle>
        <DialogContent>
          <List>
            {AVAILABLE_VARIABLES.map((variable) => (
              <ListItem
                key={variable.name}
                selected={selectedVariable === variable.name}
                onClick={() => setSelectedVariable(variable.name)}
                sx={{ cursor: 'pointer' }}
              >
                <ListItemText
                  primary={variable.displayName}
                  secondary={`{{${variable.name}}} - Beispiel: ${variable.example}`}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={() => setShowVariableDialog(false)}>Abbrechen</Button>
          <Button
            variant="contained"
            onClick={handleAddVariable}
            disabled={!selectedVariable}
          >
            Hinzufügen
          </Button>
        </Box>
      </Dialog>
    </Paper>
  );
};

export default ElementLibrary;