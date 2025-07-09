import React, { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardMedia,
  CardActions,
  TextField,
  MenuItem,
  Badge,
  Fab,
  useTheme,
  useMediaQuery,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Close as CloseIcon,
  CameraAlt as CameraIcon,
  PhotoCamera as PhotoCameraIcon,
  Check as CheckIcon,
  Delete as DeleteIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { supabase } from '../config/supabase';

interface PhotoCaptureSessionProps {
  open: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  onPhotosUploaded: () => void;
}

interface CapturedPhoto {
  id: string;
  file: File;
  preview: string;
  category: string;
}

const PHOTO_CATEGORIES = [
  'Eingang',
  'Wohnzimmer',
  'Schlafzimmer',
  'Küche',
  'Bad',
  'Flur',
  'Keller',
  'Dachboden',
  'Garage',
  'Außenbereich',
  'Sonstiges'
];

const PhotoCaptureSession: React.FC<PhotoCaptureSessionProps> = ({
  open,
  onClose,
  customerId,
  customerName,
  onPhotosUploaded
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Wohnzimmer');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [continuousMode, setContinuousMode] = useState(true);

  const handleCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: CapturedPhoto[] = [];
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const newPhoto: CapturedPhoto = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          preview: reader.result as string,
          category: selectedCategory
        };
        setCapturedPhotos(prev => [...prev, newPhoto]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input für nächste Aufnahme
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      
      // Automatisch Kamera wieder öffnen für kontinuierliche Aufnahme
      if (continuousMode) {
        setTimeout(() => {
          if (fileInputRef.current && !uploading) {
            fileInputRef.current.click();
          }
        }, 500); // Kurze Verzögerung für bessere UX
      }
    }
  }, [selectedCategory, uploading, continuousMode]);

  const handleDeletePhoto = (photoId: string) => {
    setCapturedPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const handleCategoryChange = (photoId: string, newCategory: string) => {
    setCapturedPhotos(prev => 
      prev.map(p => p.id === photoId ? { ...p, category: newCategory } : p)
    );
  };

  const handleUploadAll = async () => {
    if (capturedPhotos.length === 0) return;

    setUploading(true);
    setError('');
    
    try {
      // Check if bucket exists
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('Error listing buckets:', bucketsError);
        throw new Error('Storage-Service nicht verfügbar');
      }
      
      const bucketExists = buckets?.some(bucket => bucket.name === 'furniture-scans');
      
      if (!bucketExists) {
        throw new Error('Storage-Bucket nicht konfiguriert. Bitte wenden Sie sich an den Administrator.');
      }
      
      let uploadedCount = 0;
      const totalPhotos = capturedPhotos.length;
      
      for (const photo of capturedPhotos) {
        const fileExt = photo.file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `customers/${customerId}/${photo.category}_${Date.now()}_${photo.id}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('furniture-scans')
          .upload(fileName, photo.file, {
            contentType: photo.file.type || 'image/jpeg',
            upsert: false,
            cacheControl: '3600'
          });
        
        if (error) {
          console.error('Error uploading photo:', error);
          // Continue with other uploads
          continue;
        }
        
        uploadedCount++;
        setUploadProgress((uploadedCount / totalPhotos) * 100);
      }
      
      if (uploadedCount === 0) {
        throw new Error('Keine Fotos konnten hochgeladen werden');
      }
      
      // Success - close dialog and refresh
      onPhotosUploaded();
      setCapturedPhotos([]);
      onClose();
    } catch (error) {
      console.error('Fehler beim Upload:', error);
      setError(error instanceof Error ? error.message : 'Fehler beim Hochladen der Fotos');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    if (capturedPhotos.length > 0 && !uploading) {
      if (!window.confirm('Es gibt noch nicht hochgeladene Fotos. Möchten Sie wirklich schließen?')) {
        return;
      }
    }
    setCapturedPhotos([]);
    setSelectedCategory('Wohnzimmer');
    setError('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            Fotos aufnehmen - {customerName}
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <Badge badgeContent={capturedPhotos.length} color="primary">
              <PhotoCameraIcon />
            </Badge>
            <IconButton onClick={handleClose} disabled={uploading}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Kategorie-Auswahl und Einstellungen */}
        <Box sx={{ mb: 3 }}>
          <TextField
            select
            fullWidth
            label="Standard-Kategorie für neue Fotos"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            variant="outlined"
            sx={{ mb: 2 }}
          >
            {PHOTO_CATEGORIES.map(category => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </TextField>
          
          <FormControlLabel
            control={
              <Switch
                checked={continuousMode}
                onChange={(e) => setContinuousMode(e.target.checked)}
                color="primary"
              />
            }
            label="Kontinuierliche Aufnahme (Kamera öffnet sich automatisch wieder)"
          />
        </Box>

        {/* Kamera-Button mit Vorschau */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCapture}
            style={{ display: 'none' }}
            id="camera-input"
          />
          
          {/* Letzte Foto-Vorschau */}
          {capturedPhotos.length > 0 && (
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
              <Box sx={{ position: 'relative' }}>
                <img 
                  src={capturedPhotos[capturedPhotos.length - 1].preview}
                  alt="Letztes Foto"
                  style={{ 
                    width: 80, 
                    height: 80, 
                    objectFit: 'cover',
                    borderRadius: 8,
                    border: '2px solid #1976d2'
                  }}
                />
                <Chip
                  label={capturedPhotos.length}
                  size="small"
                  color="primary"
                  sx={{ 
                    position: 'absolute', 
                    top: -8, 
                    right: -8,
                    fontWeight: 'bold'
                  }}
                />
              </Box>
            </Box>
          )}
          
          <label htmlFor="camera-input">
            <Fab
              color="primary"
              component="span"
              size="large"
              disabled={uploading}
              sx={{ position: 'relative' }}
            >
              <CameraIcon />
              {capturedPhotos.length > 0 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    bgcolor: 'error.main',
                    color: 'white',
                    borderRadius: '50%',
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}
                >
                  {capturedPhotos.length}
                </Box>
              )}
            </Fab>
          </label>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {capturedPhotos.length === 0 
              ? 'Tippen Sie zum Fotografieren'
              : 'Nächstes Foto aufnehmen'
            }
          </Typography>
        </Box>

        {/* Aufgenommene Fotos */}
        {capturedPhotos.length > 0 && (
          <>
            <Typography variant="h6" gutterBottom>
              Aufgenommene Fotos ({capturedPhotos.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {capturedPhotos.map((photo) => (
                <Box 
                  key={photo.id}
                  sx={{ 
                    width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.333% - 11px)' },
                    minWidth: 0
                  }}
                >
                  <Card>
                    <CardMedia
                      component="img"
                      height="200"
                      image={photo.preview}
                      alt="Aufgenommenes Foto"
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardActions sx={{ justifyContent: 'space-between' }}>
                      <TextField
                        select
                        size="small"
                        value={photo.category}
                        onChange={(e) => handleCategoryChange(photo.id, e.target.value)}
                        sx={{ minWidth: 120 }}
                      >
                        {PHOTO_CATEGORIES.map(category => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </TextField>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeletePhoto(photo.id)}
                        disabled={uploading}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Box>
              ))}
            </Box>
          </>
        )}

        {uploading && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" gutterBottom>
              Lade Fotos hoch... {Math.round(uploadProgress)}%
            </Typography>
            <CircularProgress variant="determinate" value={uploadProgress} />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between' }}>
        <Button onClick={handleClose} disabled={uploading}>
          Abbrechen
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {capturedPhotos.length > 0 && !uploading && (
            <Button
              variant="outlined"
              onClick={handleClose}
            >
              Fertig
            </Button>
          )}
          <Button
            variant="contained"
            onClick={handleUploadAll}
            disabled={capturedPhotos.length === 0 || uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {uploading 
              ? `Lade hoch... (${Math.round(uploadProgress)}%)`
              : `${capturedPhotos.length} Fotos speichern`
            }
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default PhotoCaptureSession;