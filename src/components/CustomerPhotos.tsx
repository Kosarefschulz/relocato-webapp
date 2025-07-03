import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  IconButton,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  TextField,
  MenuItem,
  LinearProgress,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  AddAPhoto as AddAPhotoIcon,
  CameraAlt as CameraIcon
} from '@mui/icons-material';
import { Customer } from '../types';
import { StoredPhoto } from '../services/googleDriveService';
import { firebaseStorageService } from '../services/firebaseStorageService';
import { useAnalytics } from '../hooks/useAnalytics';
import PhotoCaptureSession from './PhotoCaptureSession';

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

const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    'Eingang': '🚪',
    'Wohnzimmer': '🛋️',
    'Schlafzimmer': '🛏️',
    'Küche': '🍳',
    'Bad': '🚿',
    'Flur': '🚶',
    'Keller': '📦',
    'Dachboden': '🏠',
    'Garage': '🚗',
    'Außenbereich': '🌳',
    'Sonstiges': '📷'
  };
  return icons[category] || '📷';
};

interface CustomerPhotosProps {
  customer: Customer;
}

const CustomerPhotos: React.FC<CustomerPhotosProps> = ({ customer }) => {
  const analytics = useAnalytics();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [photos, setPhotos] = useState<StoredPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('alle');
  const [selectedPhoto, setSelectedPhoto] = useState<StoredPhoto | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showCaptureSession, setShowCaptureSession] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPhotos();
  }, [customer.id]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      // Firebase Storage is disabled - return empty array
      const firebasePhotos = await firebaseStorageService.loadPhotos(customer.id);
      setPhotos(firebasePhotos); // Will be empty array from disabled service
      if (firebasePhotos.length === 0) {
        console.log('ℹ️ Keine Fotos verfügbar - Firebase Storage ist deaktiviert');
      }
    } catch (error) {
      console.error('Fehler beim Laden der Fotos:', error);
      setError('Foto-System ist derzeit nicht verfügbar.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadFiles(files);
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      // Firebase Storage is disabled
      setError('Foto-Upload ist derzeit deaktiviert. Firebase Storage wurde durch Supabase ersetzt. Upload-Funktionalität wird in Zukunft wieder verfügbar sein.');
      console.warn(`Upload attempted but Firebase Storage is disabled for ${uploadFiles.length} files`);
      
    } catch (error) {
      console.error('Fehler beim Upload:', error);
      setError('Foto-Upload ist nicht verfügbar.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (window.confirm('Möchten Sie dieses Foto wirklich löschen?')) {
      try {
        setLoading(true);
        // Firebase Storage is disabled
        setError('Foto-Löschung ist derzeit deaktiviert. Firebase Storage wurde durch Supabase ersetzt.');
        console.warn(`Delete attempted but Firebase Storage is disabled for photo: ${photoId}`);
      } catch (error) {
        console.error('Fehler beim Löschen:', error);
        setError('Foto-Löschung ist nicht verfügbar.');
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredPhotos = selectedCategory === 'alle' 
    ? photos 
    : photos.filter(photo => photo.category === selectedCategory);

  const photosByCategory = PHOTO_CATEGORIES.reduce((acc, category) => {
    const categoryPhotos = photos.filter(p => p.category === category);
    if (categoryPhotos.length > 0) {
      acc[category] = {
        value: category,
        label: category,
        photos: categoryPhotos
      };
    }
    return acc;
  }, {} as any);

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setSelectedCategory(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header mit Upload-Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6">
          Fotos ({photos.length})
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isMobile && (
            <Button
              variant="contained"
              startIcon={<CameraIcon />}
              onClick={() => setShowCaptureSession(true)}
              color="primary"
            >
              Fotografieren
            </Button>
          )}
          <Button
            variant={isMobile ? "outlined" : "contained"}
            startIcon={<AddAPhotoIcon />}
            onClick={() => setShowUploadDialog(true)}
          >
            Hochladen
          </Button>
        </Box>
      </Box>

      {photos.length === 0 ? (
        <Alert severity="info">
          Noch keine Fotos vorhanden. Klicken Sie auf "Fotos hochladen" um Bilder hinzuzufügen.
        </Alert>
      ) : (
        <>
          {/* Kategorie-Tabs */}
          <Tabs
            value={selectedCategory}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab value="alle" label={`Alle (${photos.length})`} />
            {Object.values(photosByCategory).map((category: any) => (
              <Tab
                key={category.value}
                value={category.value}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{category.icon}</span>
                    <span>{category.label} ({category.photos.length})</span>
                  </Box>
                }
              />
            ))}
          </Tabs>

          {/* Foto-Grid mit Box statt Grid */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {filteredPhotos.map((photo, index) => (
              <Box 
                key={photo.id} 
                sx={{ 
                  width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.333% - 11px)' },
                  minWidth: 0
                }}
              >
                <Card sx={{ height: '100%' }}>
                  <CardMedia
                    component="img"
                    height="400"
                    image={photo.webViewLink || photo.webContentLink || photo.thumbnailLink || photo.base64Thumbnail}
                    alt={photo.fileName}
                    loading="lazy"
                    sx={{ 
                      cursor: 'pointer', 
                      objectFit: 'cover',
                      imageRendering: '-webkit-optimize-contrast',
                      WebkitBackfaceVisibility: 'hidden',
                      backfaceVisibility: 'hidden',
                      backgroundColor: '#f5f5f5'
                    }}
                    onClick={() => setSelectedPhoto(photo)}
                  />
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip
                        size="small"
                        label={photo.category}
                        icon={<span>{getCategoryIcon(photo.category)}</span>}
                      />
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = photo.webContentLink || photo.webViewLink || photo.thumbnailLink || photo.base64Thumbnail || '';
                            link.download = photo.fileName;
                            link.click();
                          }}
                          title="Herunterladen"
                        >
                          <DownloadIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeletePhoto(photo.id)}
                          title="Löschen"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                    {photo.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {photo.description}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {new Date(photo.uploadDate).toLocaleDateString('de-DE')}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </>
      )}

      {/* Photo Capture Session */}
      <PhotoCaptureSession
        open={showCaptureSession}
        onClose={() => setShowCaptureSession(false)}
        customerId={customer.id}
        customerName={customer.name}
        onPhotosUploaded={() => {
          setShowCaptureSession(false);
          loadPhotos();
        }}
      />

      {/* Upload Dialog */}
      <Dialog
        open={showUploadDialog}
        onClose={() => !uploading && setShowUploadDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Fotos hochladen
          <IconButton
            sx={{ position: 'absolute', right: 8, top: 8 }}
            onClick={() => !uploading && setShowUploadDialog(false)}
            disabled={uploading}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<UploadIcon />}
              disabled={uploading}
              sx={{ 
                height: 100, 
                border: '2px dashed', 
                borderColor: uploadFiles.length > 0 ? 'success.main' : 'primary.main',
                bgcolor: uploadFiles.length > 0 ? 'success.light' : 'transparent',
                '&:hover': {
                  bgcolor: uploadFiles.length > 0 ? 'success.light' : 'action.hover'
                }
              }}
            >
              {uploadFiles.length > 0 
                ? `${uploadFiles.length} Datei${uploadFiles.length > 1 ? 'en' : ''} ausgewählt`
                : 'Dateien auswählen oder hier ablegen'
              }
              <input
                type="file"
                hidden
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                disabled={uploading}
              />
            </Button>
            
            {/* Dateiliste anzeigen */}
            {uploadFiles.length > 0 && (
              <Box sx={{ mt: 2, maxHeight: 150, overflow: 'auto' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Ausgewählte Dateien:
                </Typography>
                {uploadFiles.map((file, index) => (
                  <Chip
                    key={index}
                    label={`${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`}
                    size="small"
                    sx={{ m: 0.5 }}
                    onDelete={!uploading ? () => {
                      setUploadFiles(uploadFiles.filter((_, i) => i !== index));
                    } : undefined}
                  />
                ))}
              </Box>
            )}
            
            <TextField
              select
              fullWidth
              label="Kategorie"
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              margin="normal"
              // required - Kategorie ist jetzt optional
            >
              {PHOTO_CATEGORIES.map((category) => (
                <MenuItem key={category} value={category}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{getCategoryIcon(category)}</span>
                    <span>{category}</span>
                  </Box>
                </MenuItem>
              ))}
            </TextField>
            
            <TextField
              fullWidth
              label="Beschreibung (optional)"
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              margin="normal"
              multiline
              rows={2}
            />
            
            {uploading && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress variant="determinate" value={uploadProgress} />
                <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                  {Math.round(uploadProgress)}% hochgeladen
                </Typography>
              </Box>
            )}
            
            {error && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUploadDialog(false)}>Abbrechen</Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={uploadFiles.length === 0 || uploading}
          >
            Hochladen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Foto-Viewer Dialog */}
      <Dialog
        open={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0, bgcolor: 'black' }}>
          <IconButton
            sx={{ position: 'absolute', right: 8, top: 8, color: 'white', bgcolor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setSelectedPhoto(null)}
          >
            <CloseIcon />
          </IconButton>
          {selectedPhoto && (
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
              <img
                src={selectedPhoto.webContentLink || selectedPhoto.webViewLink || selectedPhoto.thumbnailLink || selectedPhoto.base64Thumbnail}
                alt={selectedPhoto.fileName}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '90vh', 
                  height: 'auto',
                  objectFit: 'contain',
                  imageRendering: '-webkit-optimize-contrast',
                  WebkitBackfaceVisibility: 'hidden',
                  backfaceVisibility: 'hidden'
                }}
              />
              {/* Foto-Informationen */}
              <Box sx={{ 
                position: 'absolute', 
                bottom: 0, 
                left: 0, 
                right: 0, 
                bgcolor: 'rgba(0,0,0,0.7)', 
                color: 'white', 
                p: 2 
              }}>
                <Typography variant="h6">{selectedPhoto.fileName}</Typography>
                <Typography variant="body2">
                  {getCategoryIcon(selectedPhoto.category)} {' '}
                  {selectedPhoto.category}
                </Typography>
                {selectedPhoto.description && (
                  <Typography variant="body2" sx={{ mt: 1 }}>{selectedPhoto.description}</Typography>
                )}
                <Typography variant="caption">
                  Hochgeladen am {new Date(selectedPhoto.uploadDate).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default CustomerPhotos;