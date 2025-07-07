import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Card,
  CardContent,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Zoom,
  useTheme,
  alpha
} from '@mui/material';
import Grid from './GridCompat';
import {
  DragIndicator as DragIcon,
  TextFields as TextIcon,
  Image as ImageIcon,
  TableChart as TableIcon,
  AccountBox as CustomerIcon,
  Business as CompanyIcon,
  FormatListBulleted as ListIcon,
  AttachMoney as PriceIcon,
  Create as SignatureIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Save as SaveIcon,
  Preview as PreviewIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  FormatBold,
  FormatItalic,
  Undo,
  Redo,
  Layers,
  ZoomIn,
  ZoomOut,
  FitScreen
} from '@mui/icons-material';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TemplateContentBlock, ContentBlockType, PDFTemplate, CompanyBranding } from '../types/pdfTemplate';
import { pdfTemplateService } from '../services/pdfTemplateService';
import { PDFPreview } from './PDFPreview';
import ContentBlockEditor from './ContentBlockEditor';

interface InteractivePDFEditorProps {
  template: PDFTemplate;
  companyBranding?: CompanyBranding;
  onSave: (template: PDFTemplate) => void;
  onClose: () => void;
}

interface DraggableBlockProps {
  block: TemplateContentBlock;
  onEdit: (block: TemplateContentBlock) => void;
  onDelete: (blockId: string) => void;
  onToggleVisibility: (blockId: string) => void;
  onDuplicate: (block: TemplateContentBlock) => void;
}

const DraggableBlock: React.FC<DraggableBlockProps> = ({ 
  block, 
  onEdit, 
  onDelete, 
  onToggleVisibility,
  onDuplicate 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getBlockIcon = (type: ContentBlockType) => {
    switch (type) {
      case 'header':
      case 'footer':
        return <TextIcon />;
      case 'logo':
      case 'company_info':
        return <CompanyIcon />;
      case 'customer_info':
        return <CustomerIcon />;
      case 'service_list':
        return <ListIcon />;
      case 'pricing_table':
        return <PriceIcon />;
      case 'signature':
        return <SignatureIcon />;
      default:
        return <TextIcon />;
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      sx={{
        mb: 1,
        opacity: block.isVisible ? 1 : 0.5,
        cursor: 'move',
        '&:hover': {
          boxShadow: 3,
        },
      }}
    >
      <CardContent sx={{ p: 1.5 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" flex={1}>
            <IconButton
              size="small"
              {...attributes}
              {...listeners}
              sx={{ cursor: 'grab', '&:active': { cursor: 'grabbing' } }}
            >
              <DragIcon />
            </IconButton>
            <ListItemIcon sx={{ minWidth: 36 }}>
              {getBlockIcon(block.blockType)}
            </ListItemIcon>
            <Box flex={1}>
              <Typography variant="body2" noWrap>
                {block.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Seite {block.pageNumber} • Position {block.position}
              </Typography>
            </Box>
          </Box>
          <Box>
            <Tooltip title="Bearbeiten">
              <IconButton size="small" onClick={() => onEdit(block)}>
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={block.isVisible ? "Ausblenden" : "Einblenden"}>
              <IconButton size="small" onClick={() => onToggleVisibility(block.id)}>
                {block.isVisible ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Duplizieren">
              <IconButton size="small" onClick={() => onDuplicate(block)}>
                <CopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Löschen">
              <IconButton size="small" onClick={() => onDelete(block.id)} color="error">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const InteractivePDFEditor: React.FC<InteractivePDFEditorProps> = ({
  template,
  companyBranding,
  onSave,
  onClose
}) => {
  const theme = useTheme();
  const [blocks, setBlocks] = useState<TemplateContentBlock[]>(template.contentBlocks || []);
  const [selectedBlock, setSelectedBlock] = useState<TemplateContentBlock | null>(null);
  const [showBlockEditor, setShowBlockEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [history, setHistory] = useState<TemplateContentBlock[][]>([blocks]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Add to history
  const addToHistory = (newBlocks: TemplateContentBlock[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newBlocks);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo/Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setBlocks(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setBlocks(history[historyIndex + 1]);
    }
  };

  // Block Templates
  const blockTemplates: { type: ContentBlockType; name: string; icon: JSX.Element }[] = [
    { type: 'header', name: 'Kopfzeile', icon: <TextIcon /> },
    { type: 'footer', name: 'Fußzeile', icon: <TextIcon /> },
    { type: 'logo', name: 'Logo', icon: <ImageIcon /> },
    { type: 'company_info', name: 'Firmendaten', icon: <CompanyIcon /> },
    { type: 'customer_info', name: 'Kundendaten', icon: <CustomerIcon /> },
    { type: 'service_list', name: 'Leistungsliste', icon: <ListIcon /> },
    { type: 'pricing_table', name: 'Preistabelle', icon: <TableIcon /> },
    { type: 'signature', name: 'Unterschrift', icon: <SignatureIcon /> },
    { type: 'custom', name: 'Eigener Block', icon: <TextIcon /> }
  ];

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = blocks.findIndex((block) => block.id === active.id);
      const newIndex = blocks.findIndex((block) => block.id === over.id);

      const newBlocks = arrayMove(blocks, oldIndex, newIndex).map((block, index) => ({
        ...block,
        position: index
      }));

      setBlocks(newBlocks);
      addToHistory(newBlocks);
    }
  };

  const handleAddBlock = (type: ContentBlockType) => {
    const newBlock: TemplateContentBlock = {
      id: `temp_${Date.now()}`,
      templateId: template.id,
      blockType: type,
      name: `Neuer ${blockTemplates.find(t => t.type === type)?.name || 'Block'}`,
      position: blocks.length,
      pageNumber: currentPage,
      settings: {
        fontSize: 12,
        fontFamily: 'Helvetica',
        textColor: '#000000',
        backgroundColor: 'transparent',
        alignment: 'left'
      },
      content: {},
      isVisible: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    addToHistory(newBlocks);
    setSelectedBlock(newBlock);
    setShowBlockEditor(true);
  };

  const handleEditBlock = (block: TemplateContentBlock) => {
    setSelectedBlock(block);
    setShowBlockEditor(true);
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (window.confirm('Möchten Sie diesen Block wirklich löschen?')) {
      const newBlocks = blocks.filter(b => b.id !== blockId);
      setBlocks(newBlocks);
      addToHistory(newBlocks);
    }
  };

  const handleToggleVisibility = (blockId: string) => {
    const newBlocks = blocks.map(b =>
      b.id === blockId ? { ...b, isVisible: !b.isVisible } : b
    );
    setBlocks(newBlocks);
    addToHistory(newBlocks);
  };

  const handleDuplicateBlock = (block: TemplateContentBlock) => {
    const newBlock: TemplateContentBlock = {
      ...block,
      id: `temp_${Date.now()}`,
      name: `${block.name} (Kopie)`,
      position: blocks.length
    };

    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    addToHistory(newBlocks);
  };

  const handleSaveBlock = (updatedBlock: Partial<TemplateContentBlock>) => {
    const newBlocks = blocks.map(b =>
      b.id === selectedBlock?.id ? { ...b, ...updatedBlock } : b
    );
    setBlocks(newBlocks);
    addToHistory(newBlocks);
    setShowBlockEditor(false);
    setSelectedBlock(null);
  };

  const handleSaveTemplate = async () => {
    try {
      const updatedTemplate = {
        ...template,
        contentBlocks: blocks
      };
      await onSave(updatedTemplate);
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const pageBlocks = blocks.filter(b => b.pageNumber === currentPage);

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth={false}
      fullScreen
      PaperProps={{
        sx: {
          backgroundColor: theme.palette.grey[100],
        }
      }}
    >
      <Box sx={{ display: 'flex', height: '100vh' }}>
        {/* Sidebar */}
        <Drawer
          variant="persistent"
          anchor="left"
          open={drawerOpen}
          sx={{
            width: drawerOpen ? 320 : 0,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 320,
              boxSizing: 'border-box',
              position: 'relative',
              height: '100%',
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Template bearbeiten
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {template.name}
            </Typography>
          </Box>

          <Divider />

          {/* Block Templates */}
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Blöcke hinzufügen
            </Typography>
            <Grid container spacing={1}>
              {blockTemplates.map((blockTemplate) => (
                <Grid item xs={6} key={blockTemplate.type}>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    startIcon={blockTemplate.icon}
                    onClick={() => handleAddBlock(blockTemplate.type)}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    {blockTemplate.name}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Divider />

          {/* Current Blocks */}
          <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
            <Typography variant="subtitle2" gutterBottom>
              Seite {currentPage} - Blöcke
            </Typography>
            
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={pageBlocks.map(b => b.id)}
                strategy={verticalListSortingStrategy}
              >
                {pageBlocks.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                    Keine Blöcke auf dieser Seite
                  </Typography>
                ) : (
                  pageBlocks.map((block) => (
                    <DraggableBlock
                      key={block.id}
                      block={block}
                      onEdit={handleEditBlock}
                      onDelete={handleDeleteBlock}
                      onToggleVisibility={handleToggleVisibility}
                      onDuplicate={handleDuplicateBlock}
                    />
                  ))
                )}
              </SortableContext>
            </DndContext>
          </Box>

          <Divider />

          {/* Actions */}
          <Box sx={{ p: 2 }}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<SaveIcon />}
              onClick={handleSaveTemplate}
              sx={{ mb: 1 }}
            >
              Template speichern
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={onClose}
            >
              Abbrechen
            </Button>
          </Box>
        </Drawer>

        {/* Main Content Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Toolbar */}
          <Paper
            elevation={0}
            sx={{
              p: 1,
              borderBottom: 1,
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <IconButton onClick={() => setDrawerOpen(!drawerOpen)}>
              <Layers />
            </IconButton>

            <Divider orientation="vertical" flexItem />

            <IconButton onClick={handleUndo} disabled={historyIndex === 0}>
              <Undo />
            </IconButton>
            <IconButton onClick={handleRedo} disabled={historyIndex === history.length - 1}>
              <Redo />
            </IconButton>

            <Divider orientation="vertical" flexItem />

            <IconButton onClick={() => setZoomLevel(Math.max(25, zoomLevel - 10))}>
              <ZoomOut />
            </IconButton>
            <Typography variant="body2" sx={{ minWidth: 50, textAlign: 'center' }}>
              {zoomLevel}%
            </Typography>
            <IconButton onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}>
              <ZoomIn />
            </IconButton>
            <IconButton onClick={() => setZoomLevel(100)}>
              <FitScreen />
            </IconButton>

            <Divider orientation="vertical" flexItem />

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Seite</InputLabel>
              <Select
                value={currentPage}
                label="Seite"
                onChange={(e) => setCurrentPage(e.target.value as number)}
              >
                <MenuItem value={1}>Seite 1</MenuItem>
                <MenuItem value={2}>Seite 2</MenuItem>
                <MenuItem value={3}>Seite 3</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ flex: 1 }} />

            <Button
              variant="outlined"
              startIcon={<PreviewIcon />}
              onClick={() => setShowPreview(true)}
            >
              Vorschau
            </Button>
          </Paper>

          {/* Canvas Area */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              backgroundColor: theme.palette.grey[200],
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              p: 4,
            }}
          >
            <Paper
              elevation={3}
              sx={{
                width: 210 * (zoomLevel / 100) + 'mm',
                height: 297 * (zoomLevel / 100) + 'mm',
                backgroundColor: 'white',
                position: 'relative',
                backgroundImage: companyBranding?.letterheadUrl
                  ? `url(${companyBranding.letterheadUrl})`
                  : 'none',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center',
              }}
            >
              {/* Visual representation of blocks */}
              {pageBlocks.filter(b => b.isVisible).map((block) => (
                <Box
                  key={block.id}
                  onClick={() => handleEditBlock(block)}
                  sx={{
                    position: 'absolute',
                    left: block.xPosition || 20,
                    top: block.yPosition || (block.position * 50 + 20),
                    width: block.width || 'calc(100% - 40px)',
                    minHeight: block.height || 40,
                    border: '1px dashed',
                    borderColor: selectedBlock?.id === block.id ? 'primary.main' : 'grey.400',
                    backgroundColor: selectedBlock?.id === block.id
                      ? alpha(theme.palette.primary.main, 0.1)
                      : 'transparent',
                    p: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    },
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {block.name}
                  </Typography>
                </Box>
              ))}
            </Paper>
          </Box>
        </Box>

        {/* Floating Action Button */}
        <Zoom in={!drawerOpen}>
          <Fab
            color="primary"
            sx={{
              position: 'fixed',
              bottom: 16,
              left: 16,
            }}
            onClick={() => setDrawerOpen(true)}
          >
            <Layers />
          </Fab>
        </Zoom>
      </Box>

      {/* Block Editor Dialog */}
      {selectedBlock && (
        <ContentBlockEditor
          open={showBlockEditor}
          block={selectedBlock}
          services={[]} // TODO: Load from service catalog
          onClose={() => {
            setShowBlockEditor(false);
            setSelectedBlock(null);
          }}
          onSave={handleSaveBlock}
        />
      )}

      {/* Preview Dialog */}
      <Dialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          PDF Vorschau
          <IconButton
            onClick={() => setShowPreview(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <DeleteIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <PDFPreview
            template={template}
            contentBlocks={blocks}
            companyBranding={companyBranding}
          />
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default InteractivePDFEditor;