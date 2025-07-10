import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  IconButton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  Tooltip,
  Badge
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import {
  Add as AddIcon,
  Send as SendIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Preview as PreviewIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  Language as LanguageIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { whatsappService, WhatsAppTemplate } from '../services/whatsappService';
import { Customer } from '../types';

interface WhatsAppTemplateManagerProps {
  customer?: Customer;
  onTemplateSent?: () => void;
}

const WhatsAppTemplateManager: React.FC<WhatsAppTemplateManagerProps> = ({ customer, onTemplateSent }) => {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [parameters, setParameters] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await whatsappService.getTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('Error loading templates:', err);
      setError('Fehler beim Laden der Templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTemplate = async () => {
    if (!selectedTemplate || !customer?.phone) return;

    setLoading(true);
    setError('');

    try {
      // Format phone number
      let phoneNumber = customer.phone.replace(/\s/g, '');
      if (!phoneNumber.startsWith('+')) {
        phoneNumber = '+49' + phoneNumber.replace(/^0/, '');
      }

      // Prepare components with parameters
      const components = [];
      
      // Add header parameters if needed
      if (selectedTemplate.header_type === 'text' && selectedTemplate.header_content?.includes('{{')) {
        const headerParams = extractParameters(selectedTemplate.header_content);
        components.push({
          type: 'header',
          parameters: headerParams.map(param => ({
            type: 'text',
            text: parameters[`header_${param}`] || param
          }))
        });
      }

      // Add body parameters
      const bodyParams = extractParameters(selectedTemplate.body_content);
      if (bodyParams.length > 0) {
        components.push({
          type: 'body',
          parameters: bodyParams.map((param, index) => ({
            type: 'text',
            text: parameters[`body_${index}`] || param
          }))
        });
      }

      await whatsappService.sendTemplateMessage(
        phoneNumber,
        selectedTemplate.template_name,
        selectedTemplate.language,
        components.length > 0 ? components : undefined
      );

      setSuccess('Template erfolgreich gesendet!');
      setSendDialogOpen(false);
      setSelectedTemplate(null);
      setParameters({});
      
      if (onTemplateSent) {
        onTemplateSent();
      }
    } catch (err) {
      console.error('Error sending template:', err);
      setError('Fehler beim Senden des Templates');
    } finally {
      setLoading(false);
    }
  };

  const extractParameters = (text: string): string[] => {
    const regex = /\{\{(\d+)\}\}/g;
    const params = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      params.push(match[1]);
    }
    return params;
  };

  const renderTemplatePreview = (template: WhatsAppTemplate) => {
    let previewText = template.body_content;
    
    // Replace parameters with example values
    const bodyParams = extractParameters(template.body_content);
    bodyParams.forEach((param, index) => {
      const value = parameters[`body_${index}`] || `[Parameter ${parseInt(param)}]`;
      previewText = previewText.replace(`{{${param}}}`, value);
    });

    return (
      <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
        {template.header_content && (
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            {template.header_content}
          </Typography>
        )}
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {previewText}
        </Typography>
        {template.footer_content && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {template.footer_content}
          </Typography>
        )}
        {template.buttons && template.buttons.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            {template.buttons.map((button: any, index: number) => (
              <Button
                key={index}
                size="small"
                variant="outlined"
                disabled
              >
                {button.text}
              </Button>
            ))}
          </Box>
        )}
      </Box>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon color="success" fontSize="small" />;
      case 'pending':
        return <ScheduleIcon color="warning" fontSize="small" />;
      case 'rejected':
        return <CancelIcon color="error" fontSize="small" />;
      default:
        return null;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'MARKETING':
        return 'primary';
      case 'UTILITY':
        return 'success';
      case 'AUTHENTICATION':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          WhatsApp Templates
        </Typography>
        <Box>
          <Tooltip title="Templates aktualisieren">
            <IconButton onClick={loadTemplates} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Templates Grid */}
      <Grid container spacing={2}>
        {templates.map((template) => (
          <Grid item xs={12} md={6} lg={4} key={template.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {template.template_name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <Chip
                        label={template.category}
                        size="small"
                        color={getCategoryColor(template.category)}
                        icon={<CategoryIcon />}
                      />
                      <Chip
                        label={template.language.toUpperCase()}
                        size="small"
                        variant="outlined"
                        icon={<LanguageIcon />}
                      />
                    </Box>
                  </Box>
                  {getStatusIcon(template.status)}
                </Box>

                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'grey.50', 
                  borderRadius: 1,
                  maxHeight: 200,
                  overflow: 'auto'
                }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {template.body_content}
                  </Typography>
                </Box>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  startIcon={<PreviewIcon />}
                  onClick={() => {
                    setSelectedTemplate(template);
                    setPreviewOpen(true);
                  }}
                >
                  Vorschau
                </Button>
                {customer && (
                  <Button
                    size="small"
                    color="primary"
                    startIcon={<SendIcon />}
                    onClick={() => {
                      setSelectedTemplate(template);
                      setSendDialogOpen(true);
                    }}
                    disabled={template.status !== 'approved'}
                  >
                    Senden
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setSelectedTemplate(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Template Vorschau</DialogTitle>
        <DialogContent>
          {selectedTemplate && renderTemplatePreview(selectedTemplate)}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Schließen</Button>
        </DialogActions>
      </Dialog>

      {/* Send Dialog */}
      <Dialog
        open={sendDialogOpen}
        onClose={() => {
          setSendDialogOpen(false);
          setSelectedTemplate(null);
          setParameters({});
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Template senden an {customer?.name}</DialogTitle>
        <DialogContent>
          {selectedTemplate && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Empfänger: {customer?.phone}
              </Alert>

              {/* Parameter Inputs */}
              {extractParameters(selectedTemplate.body_content).map((param, index) => (
                <TextField
                  key={`body_${index}`}
                  fullWidth
                  label={`Parameter ${parseInt(param)}`}
                  value={parameters[`body_${index}`] || ''}
                  onChange={(e) => setParameters({
                    ...parameters,
                    [`body_${index}`]: e.target.value
                  })}
                  margin="normal"
                  helperText={`Wert für {{${param}}} im Template`}
                />
              ))}

              {/* Template Preview */}
              <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
                Vorschau:
              </Typography>
              {renderTemplatePreview(selectedTemplate)}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendDialogOpen(false)}>Abbrechen</Button>
          <Button
            onClick={handleSendTemplate}
            variant="contained"
            color="success"
            disabled={loading}
            startIcon={<SendIcon />}
          >
            Template senden
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WhatsAppTemplateManager;