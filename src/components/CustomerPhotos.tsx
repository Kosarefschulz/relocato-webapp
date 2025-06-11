import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  IconButton,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Grid
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  QrCode2 as QrCodeIcon
} from '@mui/icons-material';
import { Customer } from '../types';
import { googleDriveService, PHOTO_CATEGORIES } from '../services/googleDriveService';
import QRCode from 'react-qr-code';

interface CustomerPhotosProps {
  customer: Customer;
}

const CustomerPhotos: React.FC<CustomerPhotosProps> = ({ customer }) => {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('alle');
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [uploadToken, setUploadToken] = useState<any>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

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

  const generateUploadToken = async () => {
    try {
      const token = await googleDriveService.generateUploadToken(customer);
      setUploadToken(token);
      const url = googleDriveService.generateQRCodeData(token);
      setQrCodeUrl(url);
      setShowQRDialog(true);
    } catch (error) {
      console.error('Fehler beim Generieren des Upload-Tokens:', error);
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
          startIcon={<QrCodeIcon />}
          onClick={generateUploadToken}
        >
          Upload QR-Code
        </Button>
      </Box>

      {photos.length === 0 ? (
        <Alert severity="info">
          Noch keine Fotos vorhanden. Generieren Sie einen QR-Code für den Upload.
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

          {/* Foto-Grid */}
          <Grid container spacing={2}>
            {filteredPhotos.map((photo, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={photo.id}>
                <Card sx={{ height: '100%' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={photo.thumbnailLink || photo.webContentLink}
                    alt={photo.name}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => setSelectedPhoto(photo)}
                  />
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip
                        size="small"
                        label={PHOTO_CATEGORIES.find(c => c.value === photo.category)?.label || photo.category}
                        icon={<span>{PHOTO_CATEGORIES.find(c => c.value === photo.category)?.icon}</span>}
                      />
                      <IconButton
                        size="small"
                        href={photo.webContentLink}
                        target="_blank"
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Box>
                    {photo.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {photo.description}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {new Date(photo.createdTime).toLocaleDateString('de-DE')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* QR-Code Dialog */}
      <Dialog
        open={showQRDialog}
        onClose={() => setShowQRDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <IconButton
            sx={{ position: 'absolute', right: 8, top: 8 }}
            onClick={() => setShowQRDialog(false)}
          >
            <CloseIcon />
          </IconButton>
          
          <Typography variant="h6" gutterBottom>
            QR-Code für Foto-Upload
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Scannen Sie diesen Code mit dem Smartphone des Beraters
          </Typography>
          
          <Box sx={{ p: 2, bgcolor: 'white', display: 'inline-block' }}>
            <QRCode value={qrCodeUrl} size={256} />
          </Box>
          
          <Typography variant="body2" sx={{ mt: 2 }}>
            <strong>Kunde:</strong> {customer.name}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Gültig bis: {uploadToken?.validUntil.toLocaleString('de-DE')}
          </Typography>
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Oder öffnen Sie direkt: {qrCodeUrl}
          </Typography>
        </DialogContent>
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
            <img
              src={selectedPhoto.webContentLink}
              alt={selectedPhoto.name}
              style={{ width: '100%', height: 'auto' }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default CustomerPhotos;