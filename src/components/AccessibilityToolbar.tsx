import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Button,
  Tooltip,
  Chip,
  Alert,
  useTheme,
  alpha,
  Fab,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Slider,
} from '@mui/material';
import {
  Accessibility as AccessibilityIcon,
  Close as CloseIcon,
  Contrast as ContrastIcon,
  TextFields as TextFieldsIcon,
  MotionPhotosOff as MotionPhotosOffIcon,
  VolumeUp as VolumeUpIcon,
  Keyboard as KeyboardIcon,
  Visibility as VisibilityIcon,
  ColorLens as ColorLensIcon,
  RestartAlt as RestartAltIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAccessibility } from './AccessibilityProvider';
import { useI18n } from '../i18n/i18nContext';

interface AccessibilityToolbarProps {
  variant?: 'fab' | 'button' | 'embedded';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const AccessibilityToolbar: React.FC<AccessibilityToolbarProps> = ({
  variant = 'fab',
  position = 'bottom-right',
}) => {
  const theme = useTheme();
  const { t } = useI18n();
  const { settings, updateSetting, resetSettings, announceToScreenReader } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const getPositionStyles = () => {
    const baseStyles = { position: 'fixed' as const, zIndex: 1300 };
    
    switch (position) {
      case 'bottom-right':
        return { ...baseStyles, bottom: 16, right: 16 };
      case 'bottom-left':
        return { ...baseStyles, bottom: 16, left: 16 };
      case 'top-right':
        return { ...baseStyles, top: 16, right: 16 };
      case 'top-left':
        return { ...baseStyles, top: 16, left: 16 };
      default:
        return { ...baseStyles, bottom: 16, right: 16 };
    }
  };

  const handleToggle = (event?: React.MouseEvent<HTMLElement>) => {
    if (variant === 'embedded') {
      setIsOpen(!isOpen);
    } else {
      setAnchorEl(event?.currentTarget || null);
    }
    
    if (!isOpen) {
      announceToScreenReader('Barrierefreiheits-Einstellungen geöffnet');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setAnchorEl(null);
    announceToScreenReader('Barrierefreiheits-Einstellungen geschlossen');
  };

  const handleSettingChange = (key: keyof typeof settings, value: any, description: string) => {
    updateSetting(key, value);
    announceToScreenReader(description);
  };

  const renderSettingsContent = () => (
    <Box sx={{ width: variant === 'embedded' ? '100%' : 350, p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessibilityIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Barrierefreiheit
          </Typography>
        </Box>
        {variant !== 'embedded' && (
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      {/* Quick Actions */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>
          Schnellzugriff
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            icon={<ContrastIcon />}
            label="Hoher Kontrast"
            clickable
            color={settings.highContrast ? 'primary' : 'default'}
            onClick={() => handleSettingChange('highContrast', !settings.highContrast, 
              settings.highContrast ? 'Hoher Kontrast deaktiviert' : 'Hoher Kontrast aktiviert')}
          />
          <Chip
            icon={<TextFieldsIcon />}
            label="Große Schrift"
            clickable
            color={settings.largeText ? 'primary' : 'default'}
            onClick={() => handleSettingChange('largeText', !settings.largeText,
              settings.largeText ? 'Große Schrift deaktiviert' : 'Große Schrift aktiviert')}
          />
          <Chip
            icon={<MotionPhotosOffIcon />}
            label="Weniger Bewegung"
            clickable
            color={settings.reducedMotion ? 'primary' : 'default'}
            onClick={() => handleSettingChange('reducedMotion', !settings.reducedMotion,
              settings.reducedMotion ? 'Animationen aktiviert' : 'Animationen reduziert')}
          />
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Detailed Settings */}
      <List dense>
        {/* Visual Settings */}
        <ListItem>
          <ListItemIcon>
            <VisibilityIcon />
          </ListItemIcon>
          <ListItemText
            primary="Hoher Kontrast"
            secondary="Verbessert die Lesbarkeit durch erhöhten Kontrast"
          />
          <ListItemSecondaryAction>
            <Switch
              checked={settings.highContrast}
              onChange={(e) => handleSettingChange('highContrast', e.target.checked,
                e.target.checked ? 'Hoher Kontrast aktiviert' : 'Hoher Kontrast deaktiviert')}
            />
          </ListItemSecondaryAction>
        </ListItem>

        <ListItem>
          <ListItemIcon>
            <TextFieldsIcon />
          </ListItemIcon>
          <ListItemText
            primary="Schriftgröße"
            secondary="Anpassung der Textgröße für bessere Lesbarkeit"
          />
        </ListItem>
        <ListItem sx={{ pl: 4 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>Schriftgröße</InputLabel>
            <Select
              value={settings.fontSize}
              label="Schriftgröße"
              onChange={(e) => handleSettingChange('fontSize', e.target.value,
                `Schriftgröße geändert zu ${e.target.value}`)}
            >
              <MenuItem value="small">Klein</MenuItem>
              <MenuItem value="medium">Normal</MenuItem>
              <MenuItem value="large">Groß</MenuItem>
              <MenuItem value="extra-large">Sehr groß</MenuItem>
            </Select>
          </FormControl>
        </ListItem>

        <ListItem>
          <ListItemIcon>
            <ColorLensIcon />
          </ListItemIcon>
          <ListItemText
            primary="Farbenblindheit-Unterstützung"
            secondary="Anpassung für verschiedene Arten der Farbenblindheit"
          />
        </ListItem>
        <ListItem sx={{ pl: 4 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>Filter</InputLabel>
            <Select
              value={settings.colorBlindnessSupport}
              label="Filter"
              onChange={(e) => handleSettingChange('colorBlindnessSupport', e.target.value,
                `Farbenblindheit-Filter geändert zu ${e.target.value}`)}
            >
              <MenuItem value="none">Kein Filter</MenuItem>
              <MenuItem value="protanopia">Protanopie (Rot-Grün)</MenuItem>
              <MenuItem value="deuteranopia">Deuteranopie (Rot-Grün)</MenuItem>
              <MenuItem value="tritanopia">Tritanopie (Blau-Gelb)</MenuItem>
            </Select>
          </FormControl>
        </ListItem>

        {/* Motion Settings */}
        <ListItem>
          <ListItemIcon>
            <MotionPhotosOffIcon />
          </ListItemIcon>
          <ListItemText
            primary="Bewegung reduzieren"
            secondary="Reduziert Animationen und Übergänge"
          />
          <ListItemSecondaryAction>
            <Switch
              checked={settings.reducedMotion}
              onChange={(e) => handleSettingChange('reducedMotion', e.target.checked,
                e.target.checked ? 'Bewegung reduziert' : 'Bewegung aktiviert')}
            />
          </ListItemSecondaryAction>
        </ListItem>

        {/* Navigation Settings */}
        <ListItem>
          <ListItemIcon>
            <KeyboardIcon />
          </ListItemIcon>
          <ListItemText
            primary="Tastaturnavigation"
            secondary="Verbesserte Unterstützung für Tastaturbenutzer"
          />
          <ListItemSecondaryAction>
            <Switch
              checked={settings.keyboardNavigation}
              onChange={(e) => handleSettingChange('keyboardNavigation', e.target.checked,
                e.target.checked ? 'Tastaturnavigation aktiviert' : 'Tastaturnavigation deaktiviert')}
            />
          </ListItemSecondaryAction>
        </ListItem>

        <ListItem>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText
            primary="Fokus-Indikatoren"
            secondary="Zeigt deutliche Umrandungen bei fokussierten Elementen"
          />
          <ListItemSecondaryAction>
            <Switch
              checked={settings.focusIndicators}
              onChange={(e) => handleSettingChange('focusIndicators', e.target.checked,
                e.target.checked ? 'Fokus-Indikatoren aktiviert' : 'Fokus-Indikatoren deaktiviert')}
            />
          </ListItemSecondaryAction>
        </ListItem>

        {/* Screen Reader Settings */}
        <ListItem>
          <ListItemIcon>
            <VolumeUpIcon />
          </ListItemIcon>
          <ListItemText
            primary="Screenreader-Optimierung"
            secondary="Optimiert die Anwendung für Screenreader"
          />
          <ListItemSecondaryAction>
            <Switch
              checked={settings.screenReaderOptimized}
              onChange={(e) => handleSettingChange('screenReaderOptimized', e.target.checked,
                e.target.checked ? 'Screenreader-Optimierung aktiviert' : 'Screenreader-Optimierung deaktiviert')}
            />
          </ListItemSecondaryAction>
        </ListItem>
      </List>

      <Divider sx={{ my: 2 }} />

      {/* Keyboard Shortcuts Info */}
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Tastenkürzel:
        </Typography>
        <Typography variant="body2" component="div">
          • Alt + S: Zum Hauptinhalt springen<br />
          • Alt + A: Barrierefreiheits-Menü öffnen<br />
          • Alt + H: Hohen Kontrast umschalten
        </Typography>
      </Alert>

      {/* Reset Button */}
      <Button
        fullWidth
        variant="outlined"
        startIcon={<RestartAltIcon />}
        onClick={() => {
          resetSettings();
          announceToScreenReader('Alle Barrierefreiheits-Einstellungen zurückgesetzt');
          handleClose();
        }}
      >
        Einstellungen zurücksetzen
      </Button>
    </Box>
  );

  if (variant === 'embedded') {
    return (
      <Box>
        <Button
          onClick={() => handleToggle()}
          startIcon={<AccessibilityIcon />}
          data-accessibility-menu
        >
          Barrierefreiheit
        </Button>
        {isOpen && renderSettingsContent()}
      </Box>
    );
  }

  if (variant === 'button') {
    return (
      <Box sx={getPositionStyles()}>
        <Tooltip title="Barrierefreiheits-Einstellungen">
          <IconButton
            onClick={handleToggle}
            data-accessibility-menu
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: 'white',
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            <AccessibilityIcon />
          </IconButton>
        </Tooltip>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          PaperProps={{
            sx: {
              maxHeight: '80vh',
              overflow: 'auto',
            },
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          {renderSettingsContent()}
        </Menu>
      </Box>
    );
  }

  // FAB variant (default)
  return (
    <Box sx={getPositionStyles()}>
      <Tooltip title="Barrierefreiheits-Einstellungen öffnen">
        <Fab
          color="primary"
          onClick={() => setIsOpen(true)}
          data-accessibility-menu
          size="medium"
          sx={{
            boxShadow: theme.shadows[8],
            '&:hover': {
              transform: 'scale(1.1)',
            },
          }}
        >
          <AccessibilityIcon />
        </Fab>
      </Tooltip>

      <Drawer
        anchor="right"
        open={isOpen}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 400 },
            maxWidth: '100vw',
          },
        }}
      >
        {renderSettingsContent()}
      </Drawer>
    </Box>
  );
};

// Accessibility Status Indicator
export const AccessibilityStatus: React.FC = () => {
  const { settings } = useAccessibility();
  const theme = useTheme();
  
  const activeFeatures = Object.entries(settings).filter(([key, value]) => {
    if (key === 'fontSize') return value !== 'medium';
    if (key === 'colorBlindnessSupport') return value !== 'none';
    return Boolean(value);
  }).length;

  if (activeFeatures === 0) return null;

  return (
    <Chip
      icon={<AccessibilityIcon />}
      label={`${activeFeatures} Barrierefreiheits-Feature${activeFeatures > 1 ? 's' : ''} aktiv`}
      color="primary"
      variant="outlined"
      size="small"
      sx={{
        position: 'fixed',
        top: 10,
        left: 10,
        zIndex: 1200,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
      }}
    />
  );
};

export default AccessibilityToolbar;