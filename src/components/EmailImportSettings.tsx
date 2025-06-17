import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip
} from '@mui/material';
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { databaseService } from '../config/database.config';

interface ImportSettings {
  enabled: boolean;
  intervalHours: number;
  businessHoursOnly: boolean;
  businessHoursStart: number;
  businessHoursEnd: number;
  emailSources: string[];
  sendWelcomeEmail: boolean;
  createAutoQuote: boolean;
}

const EmailImportSettings: React.FC = () => {
  const [settings, setSettings] = useState<ImportSettings>({
    enabled: true,
    intervalHours: 2,
    businessHoursOnly: true,
    businessHoursStart: 6,
    businessHoursEnd: 22,
    emailSources: ['immobilienscout24.de', 'umzug365.de'],
    sendWelcomeEmail: true,
    createAutoQuote: true
  });
  const [newSource, setNewSource] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const doc = await databaseService.getDocument('system', 'import_settings');
      if (doc) {
        setSettings(doc as ImportSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      await databaseService.updateDocument('system', 'import_settings', settings);
      setMessage('Einstellungen gespeichert!');
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Fehler beim Speichern der Einstellungen');
    } finally {
      setSaving(false);
    }
  };

  const addEmailSource = () => {
    if (newSource && !settings.emailSources.includes(newSource)) {
      setSettings({
        ...settings,
        emailSources: [...settings.emailSources, newSource]
      });
      setNewSource('');
    }
  };

  const removeEmailSource = (source: string) => {
    setSettings({
      ...settings,
      emailSources: settings.emailSources.filter(s => s !== source)
    });
  };

  if (loading) {
    return <Box>Lade Einstellungen...</Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmailIcon />
          E-Mail Import Einstellungen
        </Typography>
        
        <Box sx={{ mt: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.enabled}
                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
              />
            }
            label="Automatischer E-Mail Import aktiviert"
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Import-Zeitplan
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          <TextField
            label="Import-Intervall (Stunden)"
            type="number"
            value={settings.intervalHours}
            onChange={(e) => setSettings({ ...settings, intervalHours: parseInt(e.target.value) || 2 })}
            helperText="Wie oft sollen neue E-Mails importiert werden?"
            sx={{ mr: 2 }}
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.businessHoursOnly}
                onChange={(e) => setSettings({ ...settings, businessHoursOnly: e.target.checked })}
              />
            }
            label="Nur während Geschäftszeiten importieren"
          />
        </Box>

        {settings.businessHoursOnly && (
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <TextField
              label="Start (Uhr)"
              type="number"
              value={settings.businessHoursStart}
              onChange={(e) => setSettings({ ...settings, businessHoursStart: parseInt(e.target.value) || 6 })}
              inputProps={{ min: 0, max: 23 }}
            />
            <TextField
              label="Ende (Uhr)"
              type="number"
              value={settings.businessHoursEnd}
              onChange={(e) => setSettings({ ...settings, businessHoursEnd: parseInt(e.target.value) || 22 })}
              inputProps={{ min: 0, max: 23 }}
            />
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          E-Mail Quellen
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Nur E-Mails von diesen Domains werden importiert:
        </Typography>

        <List>
          {settings.emailSources.map((source) => (
            <ListItem key={source}>
              <ListItemText primary={source} />
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => removeEmailSource(source)}>
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>

        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <TextField
            label="Neue E-Mail-Quelle"
            value={newSource}
            onChange={(e) => setNewSource(e.target.value)}
            placeholder="z.B. example.com"
            size="small"
          />
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addEmailSource}
            disabled={!newSource}
          >
            Hinzufügen
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Import-Aktionen
        </Typography>

        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.sendWelcomeEmail}
                onChange={(e) => setSettings({ ...settings, sendWelcomeEmail: e.target.checked })}
              />
            }
            label="Willkommens-E-Mail an neue Kunden senden"
          />
        </Box>

        <Box sx={{ mt: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.createAutoQuote}
                onChange={(e) => setSettings({ ...settings, createAutoQuote: e.target.checked })}
              />
            }
            label="Automatisches Angebot für neue Kunden erstellen"
          />
        </Box>

        {message && (
          <Alert severity={message.includes('Fehler') ? 'error' : 'success'} sx={{ mt: 3 }}>
            {message}
          </Alert>
        )}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={saveSettings}
            disabled={saving}
          >
            Einstellungen speichern
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default EmailImportSettings;