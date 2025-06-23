import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Box,
  Typography,
  Alert,
  Slider,
  MenuItem,
  Divider,
  IconButton,
  InputAdornment,
  Chip,
  FormGroup
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Save as SaveIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { aiConfigService, AIConfig } from '../../services/ai/aiConfigService';
import { useAuth } from '../../contexts/AuthContext';

interface AISettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onSave?: (config: AIConfig) => void;
}

export const AISettingsDialog: React.FC<AISettingsDialogProps> = ({
  open,
  onClose,
  onSave
}) => {
  const { user } = useAuth();
  const [config, setConfig] = useState<AIConfig>({
    apiKey: '',
    model: 'gpt-4o',
    enabled: false,
    maxTokens: 2000,
    temperature: 0.7,
    allowedUsers: [],
    features: {
      quoteGeneration: true,
      invoiceGeneration: true,
      emailAutomation: true,
      customerSearch: true,
      priceCalculation: true
    }
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      loadConfig();
    }
  }, [open]);

  const loadConfig = async () => {
    try {
      const existingConfig = await aiConfigService.getConfig();
      if (existingConfig) {
        setConfig(existingConfig);
      } else {
        const defaultConfig = await aiConfigService.getDefaultConfig();
        setConfig(prev => ({ ...prev, ...defaultConfig }));
      }
    } catch (error) {
      console.error('Error loading config:', error);
      setError('Fehler beim Laden der Konfiguration');
    }
  };

  const handleSave = async () => {
    if (!config.apiKey) {
      setError('Bitte geben Sie einen API-Schlüssel ein');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await aiConfigService.saveConfig(config);
      setSuccess(true);
      
      if (onSave) {
        onSave(config);
      }

      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (error) {
      console.error('Error saving config:', error);
      setError('Fehler beim Speichern der Konfiguration');
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureToggle = (feature: keyof AIConfig['features']) => {
    setConfig(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: !prev.features[feature]
      }
    }));
  };

  const models = [
    { value: 'gpt-4o', label: 'GPT-4 Optimized (Empfohlen)' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Günstig)' }
  ];

  const featureLabels = {
    quoteGeneration: 'Angebotserstellung',
    invoiceGeneration: 'Rechnungserstellung',
    emailAutomation: 'E-Mail-Automatisierung',
    customerSearch: 'Kundensuche',
    priceCalculation: 'Preisberechnung'
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">KI-Einstellungen</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Einstellungen erfolgreich gespeichert!
            </Alert>
          )}

          <FormControlLabel
            control={
              <Switch
                checked={config.enabled}
                onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
              />
            }
            label="KI-Assistent aktivieren"
            sx={{ mb: 3 }}
          />

          <TextField
            fullWidth
            label="OpenAI API-Schlüssel"
            type={showApiKey ? 'text' : 'password'}
            value={config.apiKey}
            onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
            margin="normal"
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowApiKey(!showApiKey)}
                    edge="end"
                  >
                    {showApiKey ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
            helperText="Ihr OpenAI API-Schlüssel wird verschlüsselt gespeichert"
          />

          <TextField
            fullWidth
            select
            label="Modell"
            value={config.model}
            onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
            margin="normal"
          >
            {models.map(model => (
              <MenuItem key={model.value} value={model.value}>
                {model.label}
              </MenuItem>
            ))}
          </TextField>

          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography gutterBottom>
              Max. Tokens: {config.maxTokens}
            </Typography>
            <Slider
              value={config.maxTokens}
              onChange={(_, value) => setConfig(prev => ({ ...prev, maxTokens: value as number }))}
              min={500}
              max={4000}
              step={100}
              marks={[
                { value: 500, label: '500' },
                { value: 2000, label: '2000' },
                { value: 4000, label: '4000' }
              ]}
            />
          </Box>

          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography gutterBottom>
              Temperatur: {config.temperature}
            </Typography>
            <Slider
              value={config.temperature}
              onChange={(_, value) => setConfig(prev => ({ ...prev, temperature: value as number }))}
              min={0}
              max={1}
              step={0.1}
              marks={[
                { value: 0, label: 'Präzise' },
                { value: 0.5, label: 'Ausgewogen' },
                { value: 1, label: 'Kreativ' }
              ]}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" gutterBottom>
            Verfügbare Funktionen
          </Typography>
          
          <FormGroup>
            {Object.entries(featureLabels).map(([key, label]) => (
              <FormControlLabel
                key={key}
                control={
                  <Switch
                    checked={config.features[key as keyof AIConfig['features']]}
                    onChange={() => handleFeatureToggle(key as keyof AIConfig['features'])}
                    disabled={!config.enabled}
                  />
                }
                label={label}
              />
            ))}
          </FormGroup>

          <Box sx={{ mt: 3 }}>
            <Typography variant="caption" color="text.secondary">
              Hinweis: Die KI-Funktionen verwenden Ihre OpenAI API-Kosten. 
              Überwachen Sie Ihre Nutzung im OpenAI Dashboard.
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading || !config.apiKey}
          startIcon={<SaveIcon />}
        >
          Speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
};