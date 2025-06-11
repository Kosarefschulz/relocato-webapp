import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid2 as Grid,
  LinearProgress,
  Alert,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Fab
} from '@mui/material';
import {
  Camera as CameraIcon,
  PhotoLibrary as PhotoLibraryIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { googleDriveService, PHOTO_CATEGORIES } from '../services/googleDriveService';

interface UploadedPhoto {
  file: File;
  preview: string;
  category: string;
  description?: string;
  uploadStatus: 'pending' | 'uploading' | 'success' | 'error';
}

const MobilePhotoUpload: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentDescription, setCurrentDescription] = useState('');

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    if (!token) {
      setError('Kein Upload-Token gefunden');
      setLoading(false);
      return;
    }

    const info = googleDriveService.validateToken(token);
    if (!info) {
      setError('Ungültiger oder abgelaufener Token');
      setLoading(false);
      return;
    }

    setTokenInfo(info);
    setLoading(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (tokenInfo && photos.length + files.length > tokenInfo.maxFiles) {
      setError(`Maximale Anzahl von ${tokenInfo.maxFiles} Fotos erreicht`);
      return;
    }

    if (!selectedCategory) {
      setShowCategoryDialog(true);
      // Store files temporarily
      (window as any).tempFiles = files;
      return;
    }

    addPhotosToQueue(files, selectedCategory);
  };

  const addPhotosToQueue = (files: File[], category: string) => {
    const newPhotos: UploadedPhoto[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      category,
      description: currentDescription,
      uploadStatus: 'pending' as const
    }));

    setPhotos([...photos, ...newPhotos]);
    setCurrentDescription('');
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setShowCategoryDialog(false);
    
    // Process temporarily stored files if any
    const tempFiles = (window as any).tempFiles;
    if (tempFiles) {
      addPhotosToQueue(tempFiles, category);
      delete (window as any).tempFiles;
    }
  };

  const uploadPhotos = async () => {
    if (!token) return;

    setUploadProgress(0);
    const totalPhotos = photos.filter(p => p.uploadStatus === 'pending').length;
    let uploadedCount = 0;

    for (let i = 0; i < photos.length; i++) {
      if (photos[i].uploadStatus !== 'pending') continue;

      // Update status to uploading
      const updatedPhotos = [...photos];
      updatedPhotos[i].uploadStatus = 'uploading';
      setPhotos(updatedPhotos);

      try {
        const result = await googleDriveService.uploadPhoto(
          photos[i].file,
          token,
          photos[i].category,
          photos[i].description
        );

        if (result) {
          updatedPhotos[i].uploadStatus = 'success';
          uploadedCount++;
        } else {
          updatedPhotos[i].uploadStatus = 'error';
        }
      } catch (error) {
        updatedPhotos[i].uploadStatus = 'error';
      }

      setPhotos(updatedPhotos);
      setUploadProgress((uploadedCount / totalPhotos) * 100);
    }

    if (uploadedCount === totalPhotos) {
      setTimeout(() => {
        alert('Alle Fotos wurden erfolgreich hochgeladen!');
      }, 500);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, textAlign: 'center' }}>
        <Typography>Lade...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>
          Zur Startseite
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ pb: 10 }}>
      <Box sx={{ mt: 2, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          📸 Fotos hochladen
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Kunde: {tokenInfo?.customerName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {photos.length} / {tokenInfo?.maxFiles} Fotos
        </Typography>
      </Box>

      {/* Kategorie-Auswahl */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            Aktuelle Kategorie:
          </Typography>
          <Chip
            label={selectedCategory ? PHOTO_CATEGORIES.find(c => c.value === selectedCategory)?.label : 'Kategorie wählen'}
            icon={selectedCategory ? <span>{PHOTO_CATEGORIES.find(c => c.value === selectedCategory)?.icon}</span> : undefined}
            onClick={() => setShowCategoryDialog(true)}
            color={selectedCategory ? 'primary' : 'default'}
          />
        </CardContent>
      </Card>

      {/* Foto-Grid */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {photos.map((photo, index) => (
          <Grid size={6} key={index}>
            <Card sx={{ position: 'relative' }}>
              <img
                src={photo.preview}
                alt={`Upload ${index + 1}`}
                style={{ width: '100%', height: 150, objectFit: 'cover' }}
              />
              <IconButton
                sx={{ position: 'absolute', top: 5, right: 5, bgcolor: 'white' }}
                size="small"
                onClick={() => removePhoto(index)}
              >
                <CloseIcon />
              </IconButton>
              {photo.uploadStatus === 'success' && (
                <CheckCircleIcon 
                  sx={{ 
                    position: 'absolute', 
                    bottom: 5, 
                    right: 5, 
                    color: 'success.main',
                    bgcolor: 'white',
                    borderRadius: '50%'
                  }} 
                />
              )}
              <Typography 
                variant="caption" 
                sx={{ 
                  position: 'absolute', 
                  bottom: 5, 
                  left: 5, 
                  bgcolor: 'rgba(0,0,0,0.7)', 
                  color: 'white',
                  px: 1,
                  borderRadius: 1
                }}
              >
                {PHOTO_CATEGORIES.find(c => c.value === photo.category)?.label}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Upload Progress */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress variant="determinate" value={uploadProgress} />
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
            {Math.round(uploadProgress)}% hochgeladen
          </Typography>
        </Box>
      )}

      {/* Beschreibung (optional) */}
      <TextField
        fullWidth
        label="Beschreibung (optional)"
        placeholder="z.B. Wasserschaden im Bad"
        value={currentDescription}
        onChange={(e) => setCurrentDescription(e.target.value)}
        sx={{ mb: 2 }}
        size="small"
      />

      {/* Action Buttons */}
      <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, p: 2, bgcolor: 'background.paper', boxShadow: 3 }}>
        <Grid container spacing={2}>
          <Grid size={6}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<CameraIcon />}
              component="label"
              disabled={!selectedCategory}
            >
              Kamera
              <input
                hidden
                accept="image/*"
                type="file"
                capture="environment"
                onChange={handleFileSelect}
              />
            </Button>
          </Grid>
          <Grid size={6}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<PhotoLibraryIcon />}
              component="label"
              disabled={!selectedCategory}
            >
              Galerie
              <input
                hidden
                accept="image/*"
                type="file"
                multiple
                onChange={handleFileSelect}
              />
            </Button>
          </Grid>
        </Grid>
        
        {photos.some(p => p.uploadStatus === 'pending') && (
          <Fab
            color="primary"
            sx={{ position: 'absolute', bottom: 80, right: 20 }}
            onClick={uploadPhotos}
          >
            <CloudUploadIcon />
          </Fab>
        )}
      </Box>

      {/* Kategorie-Dialog */}
      <Dialog open={showCategoryDialog} onClose={() => setShowCategoryDialog(false)} fullWidth>
        <DialogTitle>Kategorie wählen</DialogTitle>
        <DialogContent>
          <List>
            {PHOTO_CATEGORIES.map((category) => (
              <ListItem
                key={category.value}
                button
                onClick={() => handleCategorySelect(category.value)}
              >
                <ListItemIcon>
                  <Typography variant="h6">{category.icon}</Typography>
                </ListItemIcon>
                <ListItemText primary={category.label} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default MobilePhotoUpload;