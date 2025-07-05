import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  AppBar,
  Toolbar,
  IconButton,
  Button,
  Typography,
  Divider,
  Menu,
  MenuItem,
  Tooltip,
  Select,
  FormControl,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Save as SaveIcon,
  SaveAs as SaveAsIcon,
  FileOpen as OpenIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  ContentCopy as CopyIcon,
  ContentPaste as PasteIcon,
  Delete as DeleteIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  GridOn as GridIcon,
  Straighten as RulerIcon,
  Layers as LayersIcon,
  Settings as SettingsIcon,
  Add as AddPageIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { LayoutTemplate, EditorState, LayoutElement, LayoutPage } from '../../types/layoutEditor';
import LayoutCanvas from './LayoutCanvas';
import ElementLibrary from './ElementLibrary';
import PropertyPanel from './PropertyPanel';
import TemplateGallery from './TemplateGallery';
import { generateLayoutPDF } from '../../services/layoutPdfService';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface QuoteLayoutEditorProps {
  initialTemplate?: LayoutTemplate;
  quoteData?: any; // Quote data to fill variables
  onSave?: (template: LayoutTemplate) => void;
}

const QuoteLayoutEditor: React.FC<QuoteLayoutEditorProps> = ({
  initialTemplate,
  quoteData,
  onSave,
}) => {
  const navigate = useNavigate();
  const canvasRef = useRef<any>(null);

  // Initialize template
  const [template, setTemplate] = useState<LayoutTemplate>(
    initialTemplate || {
      id: `template-${Date.now()}`,
      name: 'Neues Angebot',
      pages: [
        {
          id: `page-1`,
          pageNumber: 1,
          elements: [],
          width: 210, // A4 width in mm
          height: 297, // A4 height in mm
        },
      ],
      settings: {
        pageSize: 'A4',
        orientation: 'portrait',
        margins: { top: 20, right: 20, bottom: 20, left: 20 },
        gridSize: 5,
        snapToGrid: true,
        showRulers: true,
        showGuides: true,
        units: 'mm',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  );

  // Editor state
  const [editorState, setEditorState] = useState<EditorState>({
    selectedElementId: null,
    selectedPageId: template.pages[0].id,
    zoom: 100,
    showGrid: true,
    showRulers: true,
    isDragging: false,
    isResizing: false,
    clipboard: null,
    history: {
      past: [],
      future: [],
    },
  });

  // UI state
  const [showGallery, setShowGallery] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState(template.name);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Get current page
  const currentPage = template.pages.find(p => p.id === editorState.selectedPageId) || template.pages[0];

  // Handle element operations
  const handleAddElement = useCallback((element: LayoutElement) => {
    const updatedTemplate = { ...template };
    const page = updatedTemplate.pages.find(p => p.id === editorState.selectedPageId);
    if (page) {
      page.elements.push(element);
      setTemplate(updatedTemplate);
      setEditorState({ ...editorState, selectedElementId: element.id });
      addToHistory(template);
    }
  }, [template, editorState]);

  const handleUpdateElement = useCallback((elementId: string, updates: Partial<LayoutElement>) => {
    const updatedTemplate = { ...template };
    const page = updatedTemplate.pages.find(p => p.id === editorState.selectedPageId);
    if (page) {
      const elementIndex = page.elements.findIndex(e => e.id === elementId);
      if (elementIndex >= 0) {
        page.elements[elementIndex] = { ...page.elements[elementIndex], ...updates };
        setTemplate(updatedTemplate);
        addToHistory(template);
      }
    }
  }, [template, editorState]);

  const handleDeleteElement = useCallback(() => {
    if (!editorState.selectedElementId) return;
    
    const updatedTemplate = { ...template };
    const page = updatedTemplate.pages.find(p => p.id === editorState.selectedPageId);
    if (page) {
      page.elements = page.elements.filter(e => e.id !== editorState.selectedElementId);
      setTemplate(updatedTemplate);
      setEditorState({ ...editorState, selectedElementId: null });
      addToHistory(template);
    }
  }, [template, editorState]);

  // History management
  const addToHistory = (state: LayoutTemplate) => {
    setEditorState(prev => ({
      ...prev,
      history: {
        past: [...prev.history.past.slice(-19), state], // Keep last 20 states
        future: [],
      },
    }));
  };

  const handleUndo = () => {
    if (editorState.history.past.length === 0) return;
    
    const previous = editorState.history.past[editorState.history.past.length - 1];
    const newPast = editorState.history.past.slice(0, -1);
    
    setEditorState(prev => ({
      ...prev,
      history: {
        past: newPast,
        future: [template, ...prev.history.future],
      },
    }));
    setTemplate(previous);
  };

  const handleRedo = () => {
    if (editorState.history.future.length === 0) return;
    
    const next = editorState.history.future[0];
    const newFuture = editorState.history.future.slice(1);
    
    setEditorState(prev => ({
      ...prev,
      history: {
        past: [...prev.history.past, template],
        future: newFuture,
      },
    }));
    setTemplate(next);
  };

  // Copy/Paste
  const handleCopy = () => {
    if (!editorState.selectedElementId) return;
    
    const page = template.pages.find(p => p.id === editorState.selectedPageId);
    const element = page?.elements.find(e => e.id === editorState.selectedElementId);
    if (element) {
      setEditorState({ ...editorState, clipboard: element });
    }
  };

  const handlePaste = () => {
    if (!editorState.clipboard) return;
    
    const newElement: LayoutElement = {
      ...editorState.clipboard,
      id: `element-${Date.now()}`,
      position: {
        x: editorState.clipboard.position.x + 10,
        y: editorState.clipboard.position.y + 10,
      },
    };
    
    handleAddElement(newElement);
  };

  // Export functions
  const handleExportPDF = async () => {
    try {
      const blob = await generateLayoutPDF(template, quoteData);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave({ ...template, name: templateName, updatedAt: new Date() });
    }
    setShowSaveDialog(false);
  };

  // Zoom controls
  const handleZoomIn = () => {
    setEditorState({ ...editorState, zoom: Math.min(editorState.zoom + 10, 200) });
  };

  const handleZoomOut = () => {
    setEditorState({ ...editorState, zoom: Math.max(editorState.zoom - 10, 50) });
  };

  const handleZoomChange = (event: Event, newValue: number | number[]) => {
    setEditorState({ ...editorState, zoom: newValue as number });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Toolbar */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar variant="dense">
          <Tooltip title="Zurück">
            <IconButton edge="start" onClick={() => navigate(-1)}>
              <BackIcon />
            </IconButton>
          </Tooltip>
          
          <Typography variant="h6" sx={{ mx: 2 }}>
            {template.name}
          </Typography>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          
          {/* File operations */}
          <Tooltip title="Template öffnen">
            <IconButton onClick={() => setShowGallery(true)}>
              <OpenIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Speichern">
            <IconButton onClick={() => setShowSaveDialog(true)}>
              <SaveIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Als Vorlage speichern">
            <IconButton>
              <SaveAsIcon />
            </IconButton>
          </Tooltip>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          
          {/* Edit operations */}
          <Tooltip title="Rückgängig">
            <span>
              <IconButton 
                onClick={handleUndo}
                disabled={editorState.history.past.length === 0}
              >
                <UndoIcon />
              </IconButton>
            </span>
          </Tooltip>
          
          <Tooltip title="Wiederholen">
            <span>
              <IconButton 
                onClick={handleRedo}
                disabled={editorState.history.future.length === 0}
              >
                <RedoIcon />
              </IconButton>
            </span>
          </Tooltip>
          
          <Tooltip title="Kopieren">
            <span>
              <IconButton 
                onClick={handleCopy}
                disabled={!editorState.selectedElementId}
              >
                <CopyIcon />
              </IconButton>
            </span>
          </Tooltip>
          
          <Tooltip title="Einfügen">
            <span>
              <IconButton 
                onClick={handlePaste}
                disabled={!editorState.clipboard}
              >
                <PasteIcon />
              </IconButton>
            </span>
          </Tooltip>
          
          <Tooltip title="Löschen">
            <span>
              <IconButton 
                onClick={handleDeleteElement}
                disabled={!editorState.selectedElementId}
              >
                <DeleteIcon />
              </IconButton>
            </span>
          </Tooltip>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          
          {/* View controls */}
          <ToggleButtonGroup
            size="small"
            value={[
              editorState.showGrid && 'grid',
              editorState.showRulers && 'rulers',
            ].filter(Boolean)}
            onChange={(e, newFormats) => {
              setEditorState({
                ...editorState,
                showGrid: newFormats.includes('grid'),
                showRulers: newFormats.includes('rulers'),
              });
            }}
          >
            <ToggleButton value="grid">
              <Tooltip title="Raster">
                <GridIcon />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="rulers">
              <Tooltip title="Lineale">
                <RulerIcon />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
          
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Zoom controls */}
          <IconButton onClick={handleZoomOut} size="small">
            <ZoomOutIcon />
          </IconButton>
          
          <Slider
            value={editorState.zoom}
            onChange={handleZoomChange}
            min={50}
            max={200}
            step={10}
            sx={{ width: 100, mx: 1 }}
          />
          
          <Typography variant="body2" sx={{ minWidth: 45 }}>
            {editorState.zoom}%
          </Typography>
          
          <IconButton onClick={handleZoomIn} size="small">
            <ZoomInIcon />
          </IconButton>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          
          {/* Export actions */}
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handleExportPDF}
            sx={{ ml: 1 }}
          >
            PDF Export
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<EmailIcon />}
            sx={{ ml: 1 }}
          >
            Senden
          </Button>
        </Toolbar>
      </AppBar>
      
      {/* Main content */}
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* Element Library */}
        <ElementLibrary onAddElement={handleAddElement} />
        
        {/* Canvas */}
        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
          <LayoutCanvas
            ref={canvasRef}
            template={template}
            currentPage={currentPage}
            editorState={editorState}
            onUpdateElement={handleUpdateElement}
            onSelectElement={(id) => setEditorState({ ...editorState, selectedElementId: id })}
            quoteData={quoteData}
          />
        </Box>
        
        {/* Property Panel */}
        <PropertyPanel
          selectedElement={
            currentPage.elements.find(e => e.id === editorState.selectedElementId) || null
          }
          onUpdateElement={(updates) => {
            if (editorState.selectedElementId) {
              handleUpdateElement(editorState.selectedElementId, updates);
            }
          }}
        />
      </Box>
      
      {/* Template Gallery Dialog */}
      <Dialog
        open={showGallery}
        onClose={() => setShowGallery(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Vorlagen auswählen</DialogTitle>
        <DialogContent>
          <TemplateGallery
            onSelectTemplate={(t) => {
              setTemplate(t);
              setShowGallery(false);
            }}
          />
        </DialogContent>
      </Dialog>
      
      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onClose={() => setShowSaveDialog(false)}>
        <DialogTitle>Vorlage speichern</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Vorlagenname"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSaveDialog(false)}>Abbrechen</Button>
          <Button onClick={handleSave} variant="contained">Speichern</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuoteLayoutEditor;