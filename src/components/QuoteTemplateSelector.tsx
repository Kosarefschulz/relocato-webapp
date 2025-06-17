import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Button, Card, CardContent, CardActionArea, Chip, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemIcon, ListItemText, Divider, Alert, Skeleton, useTheme, alpha } from '@mui/material';
import Grid from './GridCompat';
import {
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Star as StarIcon,
  Euro as EuroIcon,
  Build as ServiceIcon,
  LocalOffer as DiscountIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { QuoteTemplate } from '../types';
import { quoteTemplateService } from '../services/quoteTemplateService';
import { motion } from 'framer-motion';

interface QuoteTemplateSelectorProps {
  onSelect: (template: QuoteTemplate) => void;
  currentTemplateId?: string;
}

const QuoteTemplateSelector: React.FC<QuoteTemplateSelectorProps> = ({
  onSelect,
  currentTemplateId
}) => {
  const theme = useTheme();
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<QuoteTemplate | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showSelectionDialog, setShowSelectionDialog] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    // Wenn eine Template-ID übergeben wurde, dieses Template auswählen
    if (currentTemplateId && templates.length > 0) {
      const template = templates.find(t => t.id === currentTemplateId);
      if (template) {
        setSelectedTemplate(template);
      }
    }
  }, [currentTemplateId, templates]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const loadedTemplates = await quoteTemplateService.getTemplates();
      setTemplates(loadedTemplates);
      
      // Standard-Template auswählen
      const defaultTemplate = loadedTemplates.find(t => t.isDefault) || loadedTemplates[0];
      if (defaultTemplate && !currentTemplateId) {
        setSelectedTemplate(defaultTemplate);
        onSelect(defaultTemplate);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template: QuoteTemplate) => {
    setSelectedTemplate(template);
    onSelect(template);
    setShowSelectionDialog(false);
  };

  const handleShowDetails = (template: QuoteTemplate) => {
    setSelectedTemplate(template);
    setShowDetailsDialog(true);
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={100} />
      </Paper>
    );
  }

  return (
    <Box>
      {/* Current Selection */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Ausgewähltes Template
          </Typography>
          <Button
            variant="outlined"
            onClick={() => setShowSelectionDialog(true)}
          >
            Template ändern
          </Button>
        </Box>

        {selectedTemplate ? (
          <Card 
            sx={{ 
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
              border: `2px solid ${theme.palette.primary.main}`
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {selectedTemplate.name}
                    {selectedTemplate.isDefault && (
                      <Chip
                        icon={<StarIcon />}
                        label="Standard"
                        size="small"
                        color="primary"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {selectedTemplate.description}
                  </Typography>
                  
                  {/* Quick Stats */}
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Chip
                      icon={<ServiceIcon />}
                      label={`${selectedTemplate.services.length} Leistungen`}
                      size="small"
                      variant="outlined"
                    />
                    {selectedTemplate.discounts && selectedTemplate.discounts.length > 0 && (
                      <Chip
                        icon={<DiscountIcon />}
                        label={`${selectedTemplate.discounts.length} Rabatte`}
                        size="small"
                        variant="outlined"
                        color="success"
                      />
                    )}
                  </Box>
                </Box>
                
                <Button
                  variant="text"
                  startIcon={<InfoIcon />}
                  onClick={() => handleShowDetails(selectedTemplate)}
                >
                  Details
                </Button>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Alert severity="warning">
            Kein Template ausgewählt. Bitte wählen Sie ein Template aus.
          </Alert>
        )}
      </Paper>

      {/* Template Selection Dialog */}
      <Dialog
        open={showSelectionDialog}
        onClose={() => setShowSelectionDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Template auswählen</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {templates.map((template, index) => (
              <Grid item xs={12} md={6} key={template.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      border: selectedTemplate?.id === template.id ? 
                        `2px solid ${theme.palette.primary.main}` : 
                        '1px solid transparent',
                      transition: 'all 0.3s',
                      '&:hover': {
                        borderColor: theme.palette.primary.light,
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[4]
                      }
                    }}
                  >
                    <CardActionArea onClick={() => handleSelectTemplate(template)}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" gutterBottom>
                              {template.name}
                              {template.isDefault && (
                                <StarIcon 
                                  sx={{ 
                                    ml: 1, 
                                    fontSize: 20, 
                                    color: 'primary.main',
                                    verticalAlign: 'middle' 
                                  }} 
                                />
                              )}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                              {template.description}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                              <Chip
                                size="small"
                                label={`${template.services.filter(s => s.included).length} inkl. Leistungen`}
                                color="success"
                                variant="outlined"
                              />
                              {template.discounts && template.discounts.length > 0 && (
                                <Chip
                                  size="small"
                                  label={`${template.discounts.length} Rabatte`}
                                  color="primary"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          </Box>
                          <Box>
                            {selectedTemplate?.id === template.id ? (
                              <CheckIcon color="primary" />
                            ) : (
                              <UncheckedIcon color="action" />
                            )}
                          </Box>
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSelectionDialog(false)}>Abbrechen</Button>
        </DialogActions>
      </Dialog>

      {/* Template Details Dialog */}
      <Dialog
        open={showDetailsDialog}
        onClose={() => setShowDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedTemplate?.name}
        </DialogTitle>
        <DialogContent>
          {selectedTemplate && (
            <Box>
              <Typography variant="body1" paragraph>
                {selectedTemplate.description}
              </Typography>

              <Divider sx={{ my: 2 }} />

              {/* Services */}
              <Typography variant="h6" gutterBottom>
                Leistungen
              </Typography>
              <List dense>
                {selectedTemplate.services.map((service, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      {service.included ? (
                        <CheckIcon color="success" />
                      ) : (
                        <UncheckedIcon color="action" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={service.name}
                      secondary={
                        service.basePrice > 0 ? 
                          `${service.basePrice}€ ${service.unit ? `pro ${service.unit}` : ''}` : 
                          service.included ? 'Inklusive' : 'Optional'
                      }
                    />
                  </ListItem>
                ))}
              </List>

              {/* Discounts */}
              {selectedTemplate.discounts && selectedTemplate.discounts.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Rabatte
                  </Typography>
                  <List dense>
                    {selectedTemplate.discounts.map((discount, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <DiscountIcon color="success" />
                        </ListItemIcon>
                        <ListItemText
                          primary={discount.name}
                          secondary={
                            <>
                              {discount.type === 'percentage' ? `${discount.value}%` : `${discount.value}€`}
                              {discount.condition && ` - ${discount.condition}`}
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}

              {/* Price Factors */}
              {selectedTemplate.priceFactors && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Preisfaktoren
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Zuschlag pro Etage:
                      </Typography>
                      <Typography variant="body1">
                        +{selectedTemplate.priceFactors.floorMultiplier || 0}€
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Faktor ohne Aufzug:
                      </Typography>
                      <Typography variant="body1">
                        x{selectedTemplate.priceFactors.noElevatorMultiplier || 1}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Inkludierte Kilometer:
                      </Typography>
                      <Typography variant="body1">
                        {selectedTemplate.priceFactors.distanceBaseKm || 0} km
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Preis pro Extra-km:
                      </Typography>
                      <Typography variant="body1">
                        {selectedTemplate.priceFactors.pricePerExtraKm || 0}€
                      </Typography>
                    </Grid>
                  </Grid>
                </>
              )}

              {/* Additional Texts */}
              {selectedTemplate.additionalText && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Texte
                  </Typography>
                  {selectedTemplate.additionalText.introduction && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Einleitung:
                      </Typography>
                      <Typography variant="body2">
                        {selectedTemplate.additionalText.introduction}
                      </Typography>
                    </Box>
                  )}
                  {selectedTemplate.additionalText.conclusion && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Schlusstext:
                      </Typography>
                      <Typography variant="body2">
                        {selectedTemplate.additionalText.conclusion}
                      </Typography>
                    </Box>
                  )}
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailsDialog(false)}>Schließen</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuoteTemplateSelector;