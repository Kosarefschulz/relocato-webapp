import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  Chip,
  TextField,
  MenuItem,
  InputAdornment,
  Fab,
  CircularProgress,
  Alert,
  Tooltip,
  ImageList,
  ImageListItem,
  ImageListItemBar
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  PhotoLibrary as PhotoIcon,
  ZoomIn as ZoomInIcon,
  FullscreenExit as FullscreenExitIcon
} from '@mui/icons-material';
import googleDriveService, { StoredPhoto } from '../services/googleDriveService';
import { motion, AnimatePresence } from 'framer-motion';

const PHOTO_CATEGORIES = [
  { value: 'alle', label: 'Alle Kategorien' },
  { value: 'Eingang', label: 'Eingang' },
  { value: 'Wohnzimmer', label: 'Wohnzimmer' },
  { value: 'Schlafzimmer', label: 'Schlafzimmer' },
  { value: 'Küche', label: 'Küche' },
  { value: 'Bad', label: 'Bad' },
  { value: 'Flur', label: 'Flur' },
  { value: 'Keller', label: 'Keller' },
  { value: 'Dachboden', label: 'Dachboden' },
  { value: 'Garage', label: 'Garage' },
  { value: 'Außenbereich', label: 'Außenbereich' },
  { value: 'Sonstiges', label: 'Sonstiges' }
];

const PhotoGallery: React.FC = () => {
  const [photos, setPhotos] = useState<StoredPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<StoredPhoto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('alle');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadAllPhotos();
  }, []);

  const loadAllPhotos = async () => {
    try {
      setLoading(true);
      // Lade alle Fotos aus localStorage
      const storedPhotos = JSON.parse(localStorage.getItem('customerPhotos') || '[]');
      
      // Sortiere nach Upload-Datum (neueste zuerst)
      const sortedPhotos = storedPhotos.sort((a: StoredPhoto, b: StoredPhoto) => 
        new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      );
      
      setPhotos(sortedPhotos);
    } catch (error) {
      console.error('Fehler beim Laden der Fotos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCustomerName = (customerId: string): string => {
    try {
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      const customer = customers.find((c: any) => c.id === customerId);
      return customer?.name || customerId;
    } catch {
      return customerId;
    }
  };

  const filteredPhotos = photos.filter(photo => {
    const matchesSearch = searchTerm === '' || 
      photo.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      photo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCustomerName(photo.customerId).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'alle' || photo.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleDownload = (photo: StoredPhoto) => {
    if (photo.webContentLink) {
      window.open(photo.webContentLink, '_blank');
    } else if (photo.base64Thumbnail) {
      // Fallback für lokale Fotos
      const link = document.createElement('a');
      link.href = photo.base64Thumbnail;
      link.download = photo.fileName;
      link.click();
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PhotoIcon fontSize="large" />
          Foto-Galerie
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {photos.length} Fotos von {new Set(photos.map(p => p.customerId)).size} Kunden
        </Typography>
      </Box>

      {/* Filter und Suche */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flexGrow: 1, minWidth: 200 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        <TextField
          select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          sx={{ minWidth: 200 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FilterIcon />
              </InputAdornment>
            ),
          }}
        >
          {PHOTO_CATEGORIES.map(cat => (
            <MenuItem key={cat.value} value={cat.value}>
              {cat.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {/* Foto-Grid */}
      {filteredPhotos.length === 0 ? (
        <Alert severity="info">
          Keine Fotos gefunden. {searchTerm && 'Versuchen Sie eine andere Suche.'}
        </Alert>
      ) : (
        <ImageList variant="masonry" cols={4} gap={8}>
          <AnimatePresence>
            {filteredPhotos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
              >
                <ImageListItem>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'scale(1.02)',
                        boxShadow: 3
                      }
                    }}
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <CardMedia
                      component="img"
                      image={photo.base64Thumbnail || '/placeholder-image.jpg'}
                      alt={photo.fileName}
                      sx={{ 
                        height: 'auto',
                        maxHeight: 300,
                        objectFit: 'cover'
                      }}
                    />
                    <ImageListItemBar
                      title={
                        <Typography variant="body2" noWrap>
                          {photo.fileName}
                        </Typography>
                      }
                      subtitle={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {getCustomerName(photo.customerId)}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                            <Chip 
                              label={photo.category} 
                              size="small" 
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                            <Chip 
                              label={new Date(photo.uploadDate).toLocaleDateString('de-DE')} 
                              size="small"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          </Box>
                        </Box>
                      }
                    />
                  </Card>
                </ImageListItem>
              </motion.div>
            ))}
          </AnimatePresence>
        </ImageList>
      )}

      {/* Foto-Detail Dialog */}
      <Dialog
        open={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        maxWidth="lg"
        fullWidth
      >
        {selectedPhoto && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6">{selectedPhoto.fileName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {getCustomerName(selectedPhoto.customerId)} • {selectedPhoto.category}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {selectedPhoto.webViewLink && (
                  <Tooltip title="In Google Drive öffnen">
                    <IconButton
                      onClick={() => window.open(selectedPhoto.webViewLink, '_blank')}
                      size="small"
                    >
                      <ZoomInIcon />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Herunterladen">
                  <IconButton
                    onClick={() => handleDownload(selectedPhoto)}
                    size="small"
                  >
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
                <IconButton
                  onClick={() => setSelectedPhoto(null)}
                  size="small"
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ textAlign: 'center' }}>
                <img
                  src={selectedPhoto.base64Thumbnail || '/placeholder-image.jpg'}
                  alt={selectedPhoto.fileName}
                  style={{ 
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    objectFit: 'contain'
                  }}
                />
                {selectedPhoto.description && (
                  <Typography variant="body1" sx={{ mt: 2 }}>
                    {selectedPhoto.description}
                  </Typography>
                )}
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Hochgeladen: {new Date(selectedPhoto.uploadDate).toLocaleString('de-DE')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Größe: {(selectedPhoto.fileSize / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </Box>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default PhotoGallery;