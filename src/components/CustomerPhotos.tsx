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
  LinearProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  AddAPhoto as AddAPhotoIcon
} from '@mui/icons-material';
import { Customer } from '../types';
import googleDriveService, { StoredPhoto } from '../services/googleDriveService';

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

interface CustomerPhotosProps {
  customer: Customer;
}

const CustomerPhotos: React.FC<CustomerPhotosProps> = ({ customer }) => {
  const [photos, setPhotos] = useState<StoredPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('alle');
  const [selectedPhoto, setSelectedPhoto] = useState<StoredPhoto | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
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
      const customerPhotos = await googleDriveService.getCustomerPhotos(customer.id);
      setPhotos(customerPhotos);
    } catch (error) {
      console.error('Fehler beim Laden der Fotos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadFiles(files);
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0 || !uploadCategory) return;

    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      let uploadedCount = 0;
      let errorCount = 0;
      
      for (const file of uploadFiles) {
        const result = await googleDriveService.uploadPhotoDirect(
          customer.id,
          file,
          uploadCategory,
          uploadDescription
        );
        
        if (result) {
          uploadedCount++;
        } else {
          errorCount++;
        }
        setUploadProgress(((uploadedCount + errorCount) / uploadFiles.length) * 100);
      }

      // Fotos neu laden
      await loadPhotos();
      
      // Feedback anzeigen
      if (errorCount > 0) {
        setError(`${uploadedCount} Fotos erfolgreich hochgeladen, ${errorCount} Fehler aufgetreten.`);
      }
      
      // Dialog schließen und zurücksetzen
      setShowUploadDialog(false);
      setUploadFiles([]);
      setUploadCategory('');
      setUploadDescription('');
      setUploadProgress(0);
      
    } catch (error) {
      console.error('Fehler beim Upload:', error);
      setError('Fehler beim Hochladen der Fotos. Bitte versuchen Sie es erneut.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (window.confirm('Möchten Sie dieses Foto wirklich löschen?')) {
      try {
        setLoading(true);
        const success = await googleDriveService.deletePhoto(photoId);
        if (success) {
          await loadPhotos();
          console.log('✅ Foto erfolgreich gelöscht');
        } else {
          console.error('❌ Fehler beim Löschen des Fotos');
        }
      } catch (error) {
        console.error('Fehler beim Löschen:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredPhotos = selectedCategory === 'alle' 
    ? photos 
    : photos.filter(photo => photo.category === selectedCategory);

  const photosByCategory = PHOTO_CATEGORIES.reduce((acc, category) => {
    const categoryPhotos = photos.filter(p => p.category === category.value);
    if (categoryPhotos.length > 0) {
      acc[category.value] = {
        ...category,
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Fotos ({photos.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddAPhotoIcon />}
          onClick={() => setShowUploadDialog(true)}
        >
          Fotos hochladen
        </Button>
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
                    height="200"
                    image={photo.base64Thumbnail}
                    alt={photo.fileName}
                    sx={{ cursor: 'pointer', objectFit: 'cover' }}
                    onClick={() => setSelectedPhoto(photo)}
                  />
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip
                        size="small"
                        label={PHOTO_CATEGORIES.find(c => c.value === photo.category)?.label || photo.category}
                        icon={<span>{PHOTO_CATEGORIES.find(c => c.value === photo.category)?.icon}</span>}
                      />
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = photo.webContentLink || photo.base64Thumbnail;
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
              required
            >
              {PHOTO_CATEGORIES.map((category) => (
                <MenuItem key={category.value} value={category.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{category.icon}</span>
                    <span>{category.label}</span>
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
            disabled={uploadFiles.length === 0 || !uploadCategory || uploading}
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
                src={selectedPhoto.webViewLink || selectedPhoto.base64Thumbnail}
                alt={selectedPhoto.fileName}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '90vh', 
                  height: 'auto',
                  objectFit: 'contain'
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
                  {PHOTO_CATEGORIES.find(c => c.value === selectedPhoto.category)?.icon} {' '}
                  {PHOTO_CATEGORIES.find(c => c.value === selectedPhoto.category)?.label}
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