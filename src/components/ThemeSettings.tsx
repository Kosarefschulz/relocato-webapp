import React from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Grid,
  Card,
  CardContent,
  Divider,
  Button,
  IconButton,
} from '@mui/material';
import {
  Palette as PaletteIcon,
  TextFields as TextFieldsIcon,
  BorderStyle as BorderStyleIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Restore as RestoreIcon,
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';

const ThemeSettings: React.FC = () => {
  const {
    darkMode,
    toggleDarkMode,
    themeColor,
    setThemeColor,
    fontSize,
    setFontSize,
    borderRadius,
    setBorderRadius,
  } = useTheme();

  const colorOptions = [
    { value: 'blue', label: 'Professional Blue', description: 'Trust & Reliability' },
    { value: 'purple', label: 'Premium Purple', description: 'Luxury Services' },
    { value: 'green', label: 'Success Green', description: 'Eco-Friendly' },
    { value: 'red', label: 'Alert Red', description: 'Urgent Actions' },
  ];

  const fontSizeOptions = [
    { value: 'small', label: 'Compact', description: 'More content visible' },
    { value: 'medium', label: 'Standard', description: 'Balanced readability' },
    { value: 'large', label: 'Comfortable', description: 'Enhanced readability' },
  ];

  const borderRadiusOptions = [
    { value: 'small', label: 'Sharp', description: 'Modern & crisp' },
    { value: 'medium', label: 'Balanced', description: 'Professional look' },
    { value: 'large', label: 'Rounded', description: 'Friendly & soft' },
  ];

  const resetToDefaults = () => {
    setThemeColor('blue');
    setFontSize('medium');
    setBorderRadius('medium');
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <SettingsIcon sx={{ mr: 2, fontSize: 28 }} color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Theme Settings
          </Typography>
        </Box>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Customize the corporate branding and appearance of your moving company application.
        </Typography>

        <Grid container spacing={4}>
          {/* Dark Mode Toggle */}
          <Grid item xs={12}>
            <Card elevation={1}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {darkMode ? <Brightness4Icon sx={{ mr: 2 }} /> : <Brightness7Icon sx={{ mr: 2 }} />}
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Dark Mode
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Switch between light and dark themes for better visibility
                      </Typography>
                    </Box>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={darkMode}
                        onChange={toggleDarkMode}
                        size="medium"
                      />
                    }
                    label=""
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Color Scheme */}
          <Grid item xs={12} md={6}>
            <Card elevation={1}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <PaletteIcon sx={{ mr: 2 }} color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Corporate Colors
                  </Typography>
                </Box>
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Color Scheme</InputLabel>
                  <Select
                    value={themeColor}
                    label="Color Scheme"
                    onChange={(e) => setThemeColor(e.target.value as any)}
                  >
                    {colorOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <Box>
                          <Typography variant="body1">{option.label}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  {colorOptions.map((option) => (
                    <Box
                      key={option.value}
                      onClick={() => setThemeColor(option.value as any)}
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 1,
                        cursor: 'pointer',
                        border: themeColor === option.value ? 3 : 1,
                        borderColor: themeColor === option.value ? 'primary.main' : 'divider',
                        backgroundColor: 
                          option.value === 'blue' ? '#1565C0' :
                          option.value === 'purple' ? '#7B1FA2' :
                          option.value === 'green' ? '#2E7D32' :
                          '#D32F2F',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'scale(1.1)',
                        },
                      }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Typography */}
          <Grid item xs={12} md={6}>
            <Card elevation={1}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <TextFieldsIcon sx={{ mr: 2 }} color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Typography
                  </Typography>
                </Box>
                
                <FormControl fullWidth>
                  <InputLabel>Font Size</InputLabel>
                  <Select
                    value={fontSize}
                    label="Font Size"
                    onChange={(e) => setFontSize(e.target.value as any)}
                  >
                    {fontSizeOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <Box>
                          <Typography variant="body1">{option.label}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Preview:
                  </Typography>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Relocato Moving Services
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Professional moving solutions for your business needs.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Border Radius */}
          <Grid item xs={12}>
            <Card elevation={1}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <BorderStyleIcon sx={{ mr: 2 }} color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Component Style
                  </Typography>
                </Box>
                
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Border Radius</InputLabel>
                  <Select
                    value={borderRadius}
                    label="Border Radius"
                    onChange={(e) => setBorderRadius(e.target.value as any)}
                  >
                    {borderRadiusOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <Box>
                          <Typography variant="body1">{option.label}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Preview:
                  </Typography>
                  <Box
                    sx={{
                      px: 3,
                      py: 1.5,
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      borderRadius: 
                        borderRadius === 'small' ? 1 :
                        borderRadius === 'medium' ? 2 :
                        3,
                      fontWeight: 600,
                    }}
                  >
                    Sample Button
                  </Box>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      borderRadius: 
                        borderRadius === 'small' ? 1 :
                        borderRadius === 'medium' ? 2 :
                        3,
                    }}
                  >
                    <Typography variant="body2">
                      Sample Card
                    </Typography>
                  </Paper>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Actions */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<RestoreIcon />}
                onClick={resetToDefaults}
              >
                Reset to Defaults
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => {
                  // Save settings (handled by localStorage in ThemeContext)
                  alert('Theme settings saved successfully!');
                }}
              >
                Save Settings
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default ThemeSettings;