import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Button,
  IconButton,
  Chip,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
} from '@mui/material';
import Grid from '../GridCompat';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as DuplicateIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import { LayoutTemplate } from '../../types/layoutEditor';
import { getDefaultTemplates, loadTemplates, saveTemplates } from '../../services/layoutTemplateService';
import { motion } from 'framer-motion';

interface TemplateGalleryProps {
  onSelectTemplate: (template: LayoutTemplate) => void;
  currentTemplateId?: string;
}

const TemplateGallery: React.FC<TemplateGalleryProps> = ({ onSelectTemplate, currentTemplateId }) => {
  const [templates, setTemplates] = useState<LayoutTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<LayoutTemplate[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, activeTab, searchQuery]);

  const loadAllTemplates = async () => {
    setLoading(true);
    try {
      const savedTemplates = await loadTemplates();
      const defaultTemplates = getDefaultTemplates();
      setTemplates([...defaultTemplates, ...savedTemplates]);
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates(getDefaultTemplates());
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = [...templates];

    // Filter by tab
    if (activeTab === 1) {
      // Default templates
      filtered = filtered.filter(t => t.isDefault);
    } else if (activeTab === 2) {
      // Custom templates
      filtered = filtered.filter(t => !t.isDefault);
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTemplates(filtered);
  };

  const handleDuplicate = async (template: LayoutTemplate) => {
    const newTemplate: LayoutTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      name: `${template.name} (Kopie)`,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    
    // Save custom templates
    const customTemplates = updatedTemplates.filter(t => !t.isDefault);
    await saveTemplates(customTemplates);
  };

  const handleDelete = async (templateId: string) => {
    const updatedTemplates = templates.filter(t => t.id !== templateId);
    setTemplates(updatedTemplates);
    
    // Save custom templates
    const customTemplates = updatedTemplates.filter(t => !t.isDefault);
    await saveTemplates(customTemplates);
  };

  const getTemplatePreview = (template: LayoutTemplate) => {
    // In a real implementation, this would generate a thumbnail
    // For now, we'll create a simple preview
    const firstPage = template.pages[0];
    const elementCount = firstPage?.elements.length || 0;
    
    return (
      <Box
        sx={{
          height: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.100',
          position: 'relative',
        }}
      >
        <Typography variant="h1" sx={{ fontSize: 48, color: 'grey.300' }}>
          A4
        </Typography>
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            bgcolor: 'background.paper',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            boxShadow: 1,
          }}
        >
          <Typography variant="caption">
            {elementCount} Elemente
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Vorlagen durchsuchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab label="Alle" />
        <Tab label="Standard" />
        <Tab label="Eigene" />
      </Tabs>

      <Grid container spacing={3}>
        {filteredTemplates.map((template, index) => (
          <Grid item xs={12} sm={6} md={4} key={template.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 4,
                  },
                }}
              >
                <CardMedia
                  component="div"
                  onClick={() => onSelectTemplate(template)}
                >
                  {getTemplatePreview(template)}
                </CardMedia>
                
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'start', mb: 1 }}>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                      {template.name}
                    </Typography>
                    {template.isDefault && (
                      <Chip label="Standard" size="small" color="primary" />
                    )}
                  </Box>
                  
                  {template.description && (
                    <Typography variant="body2" color="text.secondary">
                      {template.description}
                    </Typography>
                  )}
                  
                  <Box sx={{ mt: 1, display: 'flex', gap: 0.5 }}>
                    {template.company && (
                      <Chip label={template.company} size="small" variant="outlined" />
                    )}
                    <Chip
                      label={`${template.pages.length} Seite${template.pages.length > 1 ? 'n' : ''}`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'space-between' }}>
                  <Button
                    size="small"
                    onClick={() => onSelectTemplate(template)}
                    variant={currentTemplateId === template.id ? 'contained' : 'text'}
                  >
                    {currentTemplateId === template.id ? 'Ausgewählt' : 'Verwenden'}
                  </Button>
                  
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleDuplicate(template)}
                      title="Duplizieren"
                    >
                      <DuplicateIcon fontSize="small" />
                    </IconButton>
                    
                    {!template.isDefault && (
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(template.id)}
                        title="Löschen"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </CardActions>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {filteredTemplates.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            Keine Vorlagen gefunden
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Versuchen Sie eine andere Suche oder erstellen Sie eine neue Vorlage
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default TemplateGallery;