import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardMedia,
  CardContent,
  CardActions
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  ColorLens as ColorIcon,
  Delete as DeleteIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { ChromePicker } from 'react-color';
import { CompanyType } from '../types/company';
import { CompanyBranding } from '../types/pdfTemplate';
import { pdfTemplateService } from '../services/pdfTemplateService';
import { supabase } from '../config/supabase';

interface BrandingEditorProps {
  companyType: CompanyType;
  branding: CompanyBranding | null;
  onClose: () => void;
  onSave: (branding: CompanyBranding) => void;
}

const BrandingEditor: React.FC<BrandingEditorProps> = ({
  companyType,
  branding,
  onClose,
  onSave
}) => {
  const [editedBranding, setEditedBranding] = useState<Partial<CompanyBranding>>(
    branding || {
      companyType,
      primaryColor: '#000000',
      secondaryColor: '#666666',
      accentColor: '#0066CC',
      fontFamily: 'Helvetica'
    }
  );
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [letterheadFile, setLetterheadFile] = useState<File | null>(null);

  const handleFieldChange = (field: keyof CompanyBranding, value: any) => {
    setEditedBranding({ ...editedBranding, [field]: value });
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'letterhead') => {
    try {
      setLoading(true);
      
      // Upload to Supabase Storage
      const fileName = `${companyType}_${type}_${Date.now()}.${file.name.split('.').pop()}`;
      const { data, error } = await supabase.storage
        .from('branding')
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('branding')
        .getPublicUrl(fileName);

      if (type === 'logo') {
        handleFieldChange('logoUrl', urlData.publicUrl);
      } else {
        handleFieldChange('letterheadUrl', urlData.publicUrl);
      }
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = async (type: 'logo' | 'letterhead') => {
    if (type === 'logo') {
      handleFieldChange('logoUrl', null);
      setLogoFile(null);
    } else {
      handleFieldChange('letterheadUrl', null);
      setLetterheadFile(null);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Upload files if selected
      if (logoFile) {
        await handleFileUpload(logoFile, 'logo');
      }
      if (letterheadFile) {
        await handleFileUpload(letterheadFile, 'letterhead');
      }

      const updated = await pdfTemplateService.updateBranding(companyType, editedBranding);
      onSave(updated);
    } catch (error) {
      console.error('Error saving branding:', error);
    } finally {
      setLoading(false);
    }
  };

  const ColorPickerField = ({ 
    label, 
    value, 
    field 
  }: { 
    label: string; 
    value: string; 
    field: 'primaryColor' | 'secondaryColor' | 'accentColor';
  }) => (
    <Box sx={{ position: 'relative' }}>
      <TextField
        fullWidth
        label={label}
        value={value}
        onClick={() => setShowColorPicker(field)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Box sx={{ 
                width: 24, 
                height: 24, 
                backgroundColor: value,
                border: '1px solid #ccc',
                borderRadius: 1
              }} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowColorPicker(field)}>
                <ColorIcon />
              </IconButton>
            </InputAdornment>
          )
        }}
      />
      {showColorPicker === field && (
        <Box sx={{ position: 'absolute', zIndex: 2, top: '100%', left: 0, mt: 1 }}>
          <Box 
            sx={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0 }} 
            onClick={() => setShowColorPicker(null)} 
          />
          <ChromePicker
            color={value}
            onChange={(color) => handleFieldChange(field, color.hex)}
          />
        </Box>
      )}
    </Box>
  );

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Branding bearbeiten
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Logo Upload */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Firmenlogo
                </Typography>
                {editedBranding.logoUrl ? (
                  <CardMedia
                    component="img"
                    height="120"
                    image={editedBranding.logoUrl}
                    alt="Logo"
                    sx={{ objectFit: 'contain', mb: 2 }}
                  />
                ) : (
                  <Box sx={{ 
                    height: 120, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundColor: 'grey.100',
                    mb: 2
                  }}>
                    <ImageIcon sx={{ fontSize: 48, color: 'grey.400' }} />
                  </Box>
                )}
              </CardContent>
              <CardActions>
                <Button
                  component="label"
                  startIcon={<UploadIcon />}
                  size="small"
                >
                  Logo hochladen
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setLogoFile(file);
                        // Preview
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          handleFieldChange('logoUrl', e.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </Button>
                {editedBranding.logoUrl && (
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleRemoveFile('logo')}
                  >
                    Entfernen
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>

          {/* Letterhead Upload */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Briefkopf-Vorlage
                </Typography>
                {editedBranding.letterheadUrl ? (
                  <CardMedia
                    component="img"
                    height="120"
                    image={editedBranding.letterheadUrl}
                    alt="Briefkopf"
                    sx={{ objectFit: 'contain', mb: 2 }}
                  />
                ) : (
                  <Box sx={{ 
                    height: 120, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundColor: 'grey.100',
                    mb: 2
                  }}>
                    <ImageIcon sx={{ fontSize: 48, color: 'grey.400' }} />
                  </Box>
                )}
              </CardContent>
              <CardActions>
                <Button
                  component="label"
                  startIcon={<UploadIcon />}
                  size="small"
                >
                  Briefkopf hochladen
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setLetterheadFile(file);
                        // Preview
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          handleFieldChange('letterheadUrl', e.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </Button>
                {editedBranding.letterheadUrl && (
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleRemoveFile('letterhead')}
                  >
                    Entfernen
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>

          {/* Colors */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Farben
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <ColorPickerField
              label="Primärfarbe"
              value={editedBranding.primaryColor || '#000000'}
              field="primaryColor"
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <ColorPickerField
              label="Sekundärfarbe"
              value={editedBranding.secondaryColor || '#666666'}
              field="secondaryColor"
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <ColorPickerField
              label="Akzentfarbe"
              value={editedBranding.accentColor || '#0066CC'}
              field="accentColor"
            />
          </Grid>

          {/* Font */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Typografie
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Schriftart</InputLabel>
              <Select
                value={editedBranding.fontFamily || 'Helvetica'}
                label="Schriftart"
                onChange={(e) => handleFieldChange('fontFamily', e.target.value)}
              >
                <MenuItem value="Helvetica">Helvetica</MenuItem>
                <MenuItem value="Arial">Arial</MenuItem>
                <MenuItem value="Times New Roman">Times New Roman</MenuItem>
                <MenuItem value="Georgia">Georgia</MenuItem>
                <MenuItem value="Courier New">Courier New</MenuItem>
                <MenuItem value="Verdana">Verdana</MenuItem>
                <MenuItem value="Trebuchet MS">Trebuchet MS</MenuItem>
                <MenuItem value="Tahoma">Tahoma</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Preview */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Vorschau
            </Typography>
            <Card sx={{ p: 3 }}>
              <Box sx={{ 
                fontFamily: editedBranding.fontFamily,
                color: editedBranding.primaryColor 
              }}>
                <Typography variant="h4" sx={{ 
                  fontFamily: 'inherit',
                  color: 'inherit',
                  mb: 2
                }}>
                  Beispiel-Überschrift
                </Typography>
                <Typography variant="body1" sx={{ 
                  fontFamily: 'inherit',
                  color: editedBranding.secondaryColor,
                  mb: 2
                }}>
                  Dies ist ein Beispieltext, um zu zeigen, wie Ihre Branding-Einstellungen 
                  in den PDF-Dokumenten aussehen werden. Die Schriftart und Farben werden 
                  entsprechend Ihrer Auswahl angewendet.
                </Typography>
                <Button 
                  variant="contained"
                  sx={{ 
                    backgroundColor: editedBranding.accentColor,
                    '&:hover': {
                      backgroundColor: editedBranding.accentColor,
                      filter: 'brightness(0.9)'
                    }
                  }}
                >
                  Beispiel-Button
                </Button>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Abbrechen
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={loading}
        >
          Speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BrandingEditor;