import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  Button,
  Chip,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Rocket as RocketIcon,
  Science as ScienceIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  RemoveRedEye as EyeIcon,
  AutoAwesome as AutoAwesomeIcon,
  Hub as HubIcon
} from '@mui/icons-material';
import { featureFlagService, PHOENIX_FEATURES, FeatureFlag } from '../../services/featureFlagService';

const PhoenixDashboard: React.FC = () => {
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [phoenixEnabled, setPhoenixEnabled] = useState(false);
  const [expanded, setExpanded] = useState<string | false>(false);

  useEffect(() => {
    loadFeatures();
    
    // Listen for feature flag changes
    const handleFeatureChange = () => {
      loadFeatures();
    };
    
    window.addEventListener('featureFlagChanged', handleFeatureChange);
    return () => {
      window.removeEventListener('featureFlagChanged', handleFeatureChange);
    };
  }, []);

  const loadFeatures = () => {
    const phoenixFlags = featureFlagService.getPhoenixFlags();
    setFeatures(phoenixFlags);
    setPhoenixEnabled(featureFlagService.isPhoenixEnabled());
  };

  const handleTogglePhoenix = (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    setPhoenixEnabled(enabled);
    featureFlagService.setPhoenixEnabled(enabled);
  };

  const handleToggleFeature = (featureId: string, enabled: boolean) => {
    featureFlagService.enableFeature(featureId, enabled);
  };

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const getFeatureIcon = (featureId: string) => {
    if (featureId.includes('genesis_eye')) return <EyeIcon />;
    if (featureId.includes('autonomy_core')) return <HubIcon />;
    if (featureId.includes('oracle')) return <AutoAwesomeIcon />;
    return <ScienceIcon />;
  };

  const getModuleFeatures = (modulePrefix: string) => {
    return features.filter(f => f.id.startsWith(modulePrefix));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <RocketIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" gutterBottom>
            Phoenix Engine
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Autonome Dienstleistungsplattform - Experimentelle Features
          </Typography>
        </Box>
      </Box>

      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          <WarningIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
          Experimentelle Features
        </Typography>
        <Typography variant="body2">
          Die Phoenix Engine befindet sich in der Entwicklung. Aktivieren Sie Features nur nach sorgfältiger Prüfung.
          Alle Features sind standardmäßig deaktiviert und können schrittweise aktiviert werden.
        </Typography>
      </Alert>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            Phoenix Engine Status
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={phoenixEnabled}
                onChange={handleTogglePhoenix}
                color="primary"
              />
            }
            label={phoenixEnabled ? 'Aktiviert' : 'Deaktiviert'}
          />
        </Box>
        
        {phoenixEnabled && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Phoenix Engine ist aktiviert. Sie können nun einzelne Module konfigurieren.
          </Alert>
        )}
      </Paper>

      {/* Genesis-Auge Modul */}
      <Accordion 
        expanded={expanded === 'genesis'} 
        onChange={handleAccordionChange('genesis')}
        disabled={!phoenixEnabled}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
            <EyeIcon color={phoenixEnabled ? 'primary' : 'disabled'} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography>Genesis-Auge</Typography>
              <Typography variant="caption" color="text.secondary">
                KI-gestützte Projekterfassung und Angebotserstellung
              </Typography>
            </Box>
            <Chip 
              label={`${getModuleFeatures('phoenix_genesis_eye').filter(f => f.enabled).length}/${getModuleFeatures('phoenix_genesis_eye').length} aktiv`}
              size="small"
              color={getModuleFeatures('phoenix_genesis_eye').some(f => f.enabled) ? 'primary' : 'default'}
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            {getModuleFeatures('phoenix_genesis_eye').map((feature) => (
              <ListItem key={feature.id}>
                <ListItemText
                  primary={feature.name}
                  secondary={
                    <>
                      {feature.description}
                      {feature.dependencies && (
                        <Typography variant="caption" color="warning.main" display="block">
                          Benötigt: {feature.dependencies.join(', ')}
                        </Typography>
                      )}
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={featureFlagService.isEnabled(feature.id)}
                    onChange={(e) => handleToggleFeature(feature.id, e.target.checked)}
                    disabled={!feature.enabled && feature.dependencies && 
                      !feature.dependencies.every(dep => featureFlagService.isEnabled(dep))}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      {/* Autonomie-Kern Modul */}
      <Accordion 
        expanded={expanded === 'autonomy'} 
        onChange={handleAccordionChange('autonomy')}
        disabled={!phoenixEnabled}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
            <HubIcon color={phoenixEnabled ? 'primary' : 'disabled'} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography>Autonomie-Kern</Typography>
              <Typography variant="caption" color="text.secondary">
                Selbstverwaltende Aufträge und Ressourcenplanung
              </Typography>
            </Box>
            <Chip 
              label={`${getModuleFeatures('phoenix_autonomy_core').filter(f => f.enabled).length}/${getModuleFeatures('phoenix_autonomy_core').length} aktiv`}
              size="small"
              color={getModuleFeatures('phoenix_autonomy_core').some(f => f.enabled) ? 'primary' : 'default'}
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            {getModuleFeatures('phoenix_autonomy_core').map((feature) => (
              <ListItem key={feature.id}>
                <ListItemText
                  primary={feature.name}
                  secondary={
                    <>
                      {feature.description}
                      {feature.dependencies && (
                        <Typography variant="caption" color="warning.main" display="block">
                          Benötigt: {feature.dependencies.join(', ')}
                        </Typography>
                      )}
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={featureFlagService.isEnabled(feature.id)}
                    onChange={(e) => handleToggleFeature(feature.id, e.target.checked)}
                    disabled={!feature.enabled && feature.dependencies && 
                      !feature.dependencies.every(dep => featureFlagService.isEnabled(dep))}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      {/* Orakel Modul */}
      <Accordion 
        expanded={expanded === 'oracle'} 
        onChange={handleAccordionChange('oracle')}
        disabled={!phoenixEnabled}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
            <AutoAwesomeIcon color={phoenixEnabled ? 'primary' : 'disabled'} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography>Orakel</Typography>
              <Typography variant="caption" color="text.secondary">
                Finanzen, Analyse und Optimierung
              </Typography>
            </Box>
            <Chip 
              label={`${getModuleFeatures('phoenix_oracle').filter(f => f.enabled).length}/${getModuleFeatures('phoenix_oracle').length} aktiv`}
              size="small"
              color={getModuleFeatures('phoenix_oracle').some(f => f.enabled) ? 'primary' : 'default'}
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            {getModuleFeatures('phoenix_oracle').map((feature) => (
              <ListItem key={feature.id}>
                <ListItemText
                  primary={feature.name}
                  secondary={
                    <>
                      {feature.description}
                      {feature.dependencies && (
                        <Typography variant="caption" color="warning.main" display="block">
                          Benötigt: {feature.dependencies.join(', ')}
                        </Typography>
                      )}
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={featureFlagService.isEnabled(feature.id)}
                    onChange={(e) => handleToggleFeature(feature.id, e.target.checked)}
                    disabled={!feature.enabled && feature.dependencies && 
                      !feature.dependencies.every(dep => featureFlagService.isEnabled(dep))}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          <InfoIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
          Implementierungsstrategie
        </Typography>
        <Typography variant="body2" component="div">
          <strong>Phase 1:</strong> Genesis-Auge Basis (Foto-Upload, KI-Analyse)<br />
          <strong>Phase 2:</strong> Autonomie-Kern (Aufgabenverwaltung, Ressourcenplanung)<br />
          <strong>Phase 3:</strong> Orakel (Finanzanalyse, Marktplatz-Integration)<br />
          <strong>Phase 4:</strong> Erweiterte Features (AR, Vollautomatisierung)
        </Typography>
      </Alert>
    </Box>
  );
};

export default PhoenixDashboard;