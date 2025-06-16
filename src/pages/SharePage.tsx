import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Alert,
  Button,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip,
  Divider,
  IconButton,
  Dialog,
  DialogContent,
  useTheme,
  alpha,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  PhotoCamera as PhotoIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface CustomerData {
  id: string;
  customerNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  moveDate: string;
  fromAddress: string;
  toAddress: string;
  assignedVehicles?: any[];
  photos?: string[];
}

const SharePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    loadShareData();
  }, [token]);

  const loadShareData = () => {
    try {
      // Get share links from localStorage
      const shareLinks = JSON.parse(localStorage.getItem('shareLinks') || '[]');
      const shareLink = shareLinks.find((link: any) => link.token === token);

      if (!shareLink) {
        setError('Ungültiger oder abgelaufener Link');
        setLoading(false);
        return;
      }

      // Check if link is expired
      const expirationDate = new Date(shareLink.expiresAt);
      if (expirationDate < new Date()) {
        setError('Dieser Link ist abgelaufen');
        setLoading(false);
        return;
      }

      // Get customer data
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      const customer = customers.find((c: any) => c.id === shareLink.customerId);

      if (!customer) {
        setError('Kundendaten nicht gefunden');
        setLoading(false);
        return;
      }

      // Get quote data for move details
      const quotes = JSON.parse(localStorage.getItem('quotes') || '[]');
      const acceptedQuote = quotes.find((q: any) => 
        q.customerId === customer.id && q.status === 'accepted'
      );

      if (!acceptedQuote) {
        setError('Keine angenommenen Angebote gefunden');
        setLoading(false);
        return;
      }

      // Mock photos for demonstration
      const mockPhotos = [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
      ];

      setCustomerData({
        id: customer.id,
        customerNumber: customer.customerNumber,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        moveDate: acceptedQuote.moveDate || new Date().toISOString(),
        fromAddress: acceptedQuote.fromAddress || customer.address,
        toAddress: acceptedQuote.toAddress || '',
        assignedVehicles: [],
      });
      setPhotos(mockPhotos);
      setLoading(false);
    } catch (err) {
      setError('Fehler beim Laden der Daten');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
      }}>
        <Typography>Lade Daten...</Typography>
      </Box>
    );
  }

  if (error || !customerData) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
      }}>
        <Container maxWidth="sm">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Alert severity="error" sx={{ mb: 3 }}>
                {error || 'Ein Fehler ist aufgetreten'}
              </Alert>
              <Button 
                variant="contained" 
                onClick={() => navigate('/')}
                color="primary"
              >
                Zur Startseite
              </Button>
            </Paper>
          </motion.div>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: theme.palette.background.default,
      pb: 4,
    }}>
      <Container maxWidth="lg" sx={{ pt: 3 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <Paper 
            sx={{ 
              p: 3, 
              mb: 3,
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
              borderColor: theme.palette.primary.main,
              borderWidth: 2,
              borderStyle: 'solid',
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Umzugsauftrag - {customerData.firstName} {customerData.lastName}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Kundennummer: {customerData.customerNumber}
            </Typography>
          </Paper>

          {/* Customer Info */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Kundendaten
                </Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon color="action" />
                    <Typography>{customerData.phone}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon color="action" />
                    <Typography>{customerData.email}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon color="action" />
                    <Typography>
                      Umzugsdatum: {format(new Date(customerData.moveDate), 'dd.MM.yyyy', { locale: de })}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Umzugsdetails
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Von:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <LocationIcon color="action" sx={{ mt: 0.5 }} />
                      <Typography>{customerData.fromAddress}</Typography>
                    </Box>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Nach:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <LocationIcon color="action" sx={{ mt: 0.5 }} />
                      <Typography>{customerData.toAddress}</Typography>
                    </Box>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          {/* Photos Section */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <PhotoIcon sx={{ mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Fotos
              </Typography>
              <Chip 
                label={`${photos.length} Fotos`} 
                size="small" 
                sx={{ ml: 2 }}
              />
            </Box>

            <Grid container spacing={2}>
              {photos.map((photo, index) => (
                <Grid item xs={6} sm={4} md={3} key={index}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'scale(1.05)',
                      },
                    }}
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <CardMedia
                      component="img"
                      height="200"
                      image={photo}
                      alt={`Foto ${index + 1}`}
                      sx={{ objectFit: 'cover' }}
                    />
                  </Card>
                </Grid>
              ))}
            </Grid>

            {photos.length === 0 && (
              <Alert severity="info">
                Noch keine Fotos hochgeladen
              </Alert>
            )}
          </Paper>

          {/* Info Alert */}
          <Alert severity="info" sx={{ mt: 3 }}>
            Dieser Link ist nur für autorisierte Mitarbeiter bestimmt und läuft nach 7 Tagen ab.
          </Alert>
        </motion.div>
      </Container>

      {/* Photo Dialog */}
      <Dialog
        open={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <IconButton
            onClick={() => setSelectedPhoto(null)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              backgroundColor: alpha(theme.palette.background.paper, 0.8),
              zIndex: 1,
            }}
          >
            <CloseIcon />
          </IconButton>
          {selectedPhoto && (
            <Box
              component="img"
              src={selectedPhoto}
              alt="Foto"
              sx={{
                width: '100%',
                height: 'auto',
                maxHeight: '90vh',
                objectFit: 'contain',
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SharePage;