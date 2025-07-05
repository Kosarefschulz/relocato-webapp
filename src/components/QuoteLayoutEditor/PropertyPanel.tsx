import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Switch,
  FormControlLabel,
  IconButton,
  Divider,
  Button,
  Tabs,
  Tab,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Lock as LockIcon,
  LockOpen as UnlockIcon,
  Visibility as VisibleIcon,
  VisibilityOff as HiddenIcon,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  FormatAlignJustify,
  FormatBold,
  FormatItalic,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { LayoutElement, TextProperties, ImageProperties, TableProperties, ShapeProperties, VariableProperties, QRCodeProperties, SignatureProperties } from '../../types/layoutEditor';
import { ChromePicker } from 'react-color';

interface PropertyPanelProps {
  selectedElement: LayoutElement | null;
  onUpdateElement: (updates: Partial<LayoutElement>) => void;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({ selectedElement, onUpdateElement }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [colorPickerAnchor, setColorPickerAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setActiveTab(0);
  }, [selectedElement?.id]);

  if (!selectedElement) {
    return (
      <Paper
        elevation={2}
        sx={{
          width: 300,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderLeft: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">Eigenschaften</Typography>
        </Box>
        <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
          <Typography>Kein Element ausgewählt</Typography>
        </Box>
      </Paper>
    );
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const updateProperty = (path: string, value: any) => {
    const keys = path.split('.');
    const updates: any = {};
    let current = updates;

    keys.forEach((key, index) => {
      if (index === keys.length - 1) {
        current[key] = value;
      } else {
        current[key] = {};
        current = current[key];
      }
    });

    onUpdateElement(updates);
  };

  const renderGeneralProperties = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Position & Größe
      </Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
        <TextField
          label="X"
          type="number"
          size="small"
          value={selectedElement.position.x}
          onChange={(e) => updateProperty('position.x', Number(e.target.value))}
          InputProps={{
            endAdornment: <InputAdornment position="end">mm</InputAdornment>,
          }}
        />
        <TextField
          label="Y"
          type="number"
          size="small"
          value={selectedElement.position.y}
          onChange={(e) => updateProperty('position.y', Number(e.target.value))}
          InputProps={{
            endAdornment: <InputAdornment position="end">mm</InputAdornment>,
          }}
        />
        <TextField
          label="Breite"
          type="number"
          size="small"
          value={selectedElement.size.width}
          onChange={(e) => updateProperty('size.width', Number(e.target.value))}
          InputProps={{
            endAdornment: <InputAdornment position="end">mm</InputAdornment>,
          }}
        />
        <TextField
          label="Höhe"
          type="number"
          size="small"
          value={selectedElement.size.height}
          onChange={(e) => updateProperty('size.height', Number(e.target.value))}
          InputProps={{
            endAdornment: <InputAdornment position="end">mm</InputAdornment>,
          }}
        />
      </Box>

      <Typography variant="subtitle2" gutterBottom>
        Rotation
      </Typography>
      <Slider
        value={selectedElement.rotation || 0}
        onChange={(e, value) => updateProperty('rotation', value)}
        min={-180}
        max={180}
        marks={[
          { value: -180, label: '-180°' },
          { value: 0, label: '0°' },
          { value: 180, label: '180°' },
        ]}
        valueLabelDisplay="auto"
        sx={{ mb: 2 }}
      />

      <Typography variant="subtitle2" gutterBottom>
        Z-Index
      </Typography>
      <TextField
        fullWidth
        type="number"
        size="small"
        value={selectedElement.zIndex}
        onChange={(e) => updateProperty('zIndex', Number(e.target.value))}
        sx={{ mb: 2 }}
      />

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', gap: 1 }}>
        <FormControlLabel
          control={
            <Switch
              checked={!selectedElement.locked}
              onChange={(e) => updateProperty('locked', !e.target.checked)}
            />
          }
          label={selectedElement.locked ? 'Gesperrt' : 'Entsperrt'}
        />
        <FormControlLabel
          control={
            <Switch
              checked={selectedElement.visible}
              onChange={(e) => updateProperty('visible', e.target.checked)}
            />
          }
          label={selectedElement.visible ? 'Sichtbar' : 'Versteckt'}
        />
      </Box>
    </Box>
  );

  const renderTextProperties = () => {
    const props = selectedElement.properties as TextProperties;
    
    return (
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Text"
          value={props.content}
          onChange={(e) => updateProperty('properties.content', e.target.value)}
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Schriftart</InputLabel>
          <Select
            value={props.fontFamily}
            label="Schriftart"
            onChange={(e) => updateProperty('properties.fontFamily', e.target.value)}
          >
            <MenuItem value="Arial">Arial</MenuItem>
            <MenuItem value="Helvetica">Helvetica</MenuItem>
            <MenuItem value="Times New Roman">Times New Roman</MenuItem>
            <MenuItem value="Georgia">Georgia</MenuItem>
            <MenuItem value="Courier New">Courier New</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
          <TextField
            label="Schriftgröße"
            type="number"
            size="small"
            value={props.fontSize}
            onChange={(e) => updateProperty('properties.fontSize', Number(e.target.value))}
            InputProps={{
              endAdornment: <InputAdornment position="end">pt</InputAdornment>,
            }}
          />
          <TextField
            label="Zeilenhöhe"
            type="number"
            size="small"
            value={props.lineHeight}
            onChange={(e) => updateProperty('properties.lineHeight', Number(e.target.value))}
            inputProps={{ step: 0.1 }}
          />
        </Box>

        <ToggleButtonGroup
          value={[
            props.fontWeight === 'bold' && 'bold',
            props.fontStyle === 'italic' && 'italic',
          ].filter(Boolean)}
          onChange={(e, formats) => {
            updateProperty('properties.fontWeight', formats.includes('bold') ? 'bold' : 'normal');
            updateProperty('properties.fontStyle', formats.includes('italic') ? 'italic' : 'normal');
          }}
          size="small"
          sx={{ mb: 2 }}
        >
          <ToggleButton value="bold">
            <FormatBold />
          </ToggleButton>
          <ToggleButton value="italic">
            <FormatItalic />
          </ToggleButton>
        </ToggleButtonGroup>

        <ToggleButtonGroup
          value={props.textAlign}
          exclusive
          onChange={(e, alignment) => alignment && updateProperty('properties.textAlign', alignment)}
          size="small"
          fullWidth
          sx={{ mb: 2 }}
        >
          <ToggleButton value="left">
            <FormatAlignLeft />
          </ToggleButton>
          <ToggleButton value="center">
            <FormatAlignCenter />
          </ToggleButton>
          <ToggleButton value="right">
            <FormatAlignRight />
          </ToggleButton>
          <ToggleButton value="justify">
            <FormatAlignJustify />
          </ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              backgroundColor: props.color,
              border: '1px solid #ccc',
              borderRadius: 1,
              cursor: 'pointer',
            }}
            onClick={(e) => {
              setShowColorPicker('color');
              setColorPickerAnchor(e.currentTarget);
            }}
          />
          <TextField
            label="Textfarbe"
            value={props.color}
            onChange={(e) => updateProperty('properties.color', e.target.value)}
            size="small"
            fullWidth
          />
        </Box>

        {showColorPicker === 'color' && (
          <Box
            sx={{
              position: 'absolute',
              zIndex: 2,
              top: colorPickerAnchor?.offsetTop,
              left: colorPickerAnchor?.offsetLeft,
            }}
          >
            <Box
              sx={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
              }}
              onClick={() => setShowColorPicker(null)}
            />
            <ChromePicker
              color={props.color}
              onChange={(color) => updateProperty('properties.color', color.hex)}
            />
          </Box>
        )}
      </Box>
    );
  };

  const renderImageProperties = () => {
    const props = selectedElement.properties as ImageProperties;
    
    return (
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          label="Bild URL"
          value={props.src}
          onChange={(e) => updateProperty('properties.src', e.target.value)}
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Anpassung</InputLabel>
          <Select
            value={props.fit}
            label="Anpassung"
            onChange={(e) => updateProperty('properties.fit', e.target.value)}
          >
            <MenuItem value="contain">Einpassen</MenuItem>
            <MenuItem value="cover">Ausfüllen</MenuItem>
            <MenuItem value="fill">Strecken</MenuItem>
            <MenuItem value="none">Keine</MenuItem>
          </Select>
        </FormControl>

        <Typography variant="subtitle2" gutterBottom>
          Transparenz
        </Typography>
        <Slider
          value={(props.opacity || 1) * 100}
          onChange={(e, value) => updateProperty('properties.opacity', (value as number) / 100)}
          min={0}
          max={100}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => `${value}%`}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Eckenradius"
          type="number"
          size="small"
          value={props.borderRadius || 0}
          onChange={(e) => updateProperty('properties.borderRadius', Number(e.target.value))}
          InputProps={{
            endAdornment: <InputAdornment position="end">px</InputAdornment>,
          }}
        />
      </Box>
    );
  };

  const renderShapeProperties = () => {
    const props = selectedElement.properties as ShapeProperties;
    
    return (
      <Box sx={{ p: 2 }}>
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Form</InputLabel>
          <Select
            value={props.shapeType}
            label="Form"
            onChange={(e) => updateProperty('properties.shapeType', e.target.value)}
          >
            <MenuItem value="rectangle">Rechteck</MenuItem>
            <MenuItem value="circle">Kreis</MenuItem>
            <MenuItem value="line">Linie</MenuItem>
            <MenuItem value="arrow">Pfeil</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              backgroundColor: props.fillColor || 'transparent',
              border: '1px solid #ccc',
              borderRadius: 1,
              cursor: 'pointer',
            }}
            onClick={(e) => {
              setShowColorPicker('fill');
              setColorPickerAnchor(e.currentTarget);
            }}
          />
          <TextField
            label="Füllfarbe"
            value={props.fillColor || ''}
            onChange={(e) => updateProperty('properties.fillColor', e.target.value)}
            size="small"
            fullWidth
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              backgroundColor: props.strokeColor,
              border: '1px solid #ccc',
              borderRadius: 1,
              cursor: 'pointer',
            }}
            onClick={(e) => {
              setShowColorPicker('stroke');
              setColorPickerAnchor(e.currentTarget);
            }}
          />
          <TextField
            label="Linienfarbe"
            value={props.strokeColor}
            onChange={(e) => updateProperty('properties.strokeColor', e.target.value)}
            size="small"
            fullWidth
          />
        </Box>

        <TextField
          fullWidth
          label="Linienstärke"
          type="number"
          size="small"
          value={props.strokeWidth}
          onChange={(e) => updateProperty('properties.strokeWidth', Number(e.target.value))}
          InputProps={{
            endAdornment: <InputAdornment position="end">px</InputAdornment>,
          }}
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Linienstil</InputLabel>
          <Select
            value={props.strokeStyle}
            label="Linienstil"
            onChange={(e) => updateProperty('properties.strokeStyle', e.target.value)}
          >
            <MenuItem value="solid">Durchgezogen</MenuItem>
            <MenuItem value="dashed">Gestrichelt</MenuItem>
            <MenuItem value="dotted">Gepunktet</MenuItem>
          </Select>
        </FormControl>

        {props.shapeType === 'rectangle' && (
          <TextField
            fullWidth
            label="Eckenradius"
            type="number"
            size="small"
            value={props.borderRadius || 0}
            onChange={(e) => updateProperty('properties.borderRadius', Number(e.target.value))}
            InputProps={{
              endAdornment: <InputAdornment position="end">px</InputAdornment>,
            }}
          />
        )}
      </Box>
    );
  };

  const renderPropertiesByType = () => {
    switch (selectedElement.type) {
      case 'text':
        return renderTextProperties();
      case 'image':
        return renderImageProperties();
      case 'shape':
        return renderShapeProperties();
      // Add other property renderers as needed
      default:
        return <Box sx={{ p: 2 }}>Properties for {selectedElement.type} coming soon...</Box>;
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        width: 300,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: 1,
        borderColor: 'divider',
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Eigenschaften</Typography>
        <Typography variant="body2" color="text.secondary">
          {selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)} Element
        </Typography>
      </Box>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Spezifisch" />
        <Tab label="Allgemein" />
      </Tabs>

      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {activeTab === 0 && renderPropertiesByType()}
        {activeTab === 1 && renderGeneralProperties()}
      </Box>
    </Paper>
  );
};

export default PropertyPanel;