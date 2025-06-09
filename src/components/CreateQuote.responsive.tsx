import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useResponsive } from '../hooks/useResponsive';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  IconButton,
  Grid,
  Card,
  CardContent,
  InputAdornment,
  AppBar,
  Toolbar,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Euro as EuroIcon,
  Send as SendIcon,
  Preview as PreviewIcon
} from '@mui/icons-material';
import { Customer } from '../types';
import { generatePDF } from '../services/pdfService';
import { sendEmail } from '../services/emailService';
import { googleSheetsPublicService as googleSheetsService } from '../services/googleSheetsPublic';

const CreateQuote: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const customer = location.state?.customer as Customer;
  const { isMobile, getContainerProps, getButtonProps, getTextFieldProps, titleVariant } = useResponsive();
  
  const [price, setPrice] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  if (!customer) {
    navigate('/search-customer');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      setError('Bitte geben Sie einen gültigen Preis ein');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const quoteData = {
        customerId: customer.id,
        customerName: customer.name,
        price: Number(price),
        comment,
        createdAt: new Date(),
        createdBy: 'current-user-id',
        status: 'sent' as const
      };

      const pdfBlob = await generatePDF(customer, quoteData);
      
      await sendEmail({
        to: customer.email,
        subject: `Ihr Umzugsangebot - ${customer.name}`,
        content: `Sehr geehrte/r ${customer.name},\n\nanbei finden Sie Ihr persönliches Umzugsangebot.`,
        attachments: [{
          filename: `Angebot_${customer.name}_${new Date().toISOString().split('T')[0]}.pdf`,
          content: pdfBlob
        }]
      });

      // Angebot in Google Sheets speichern
      await googleSheetsService.addQuote(quoteData);

      setSuccess(true);
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (err) {
      setError('Fehler beim Erstellen des Angebots. Bitte versuchen Sie es erneut.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      setError('Bitte geben Sie einen gültigen Preis ein');
      return;
    }

    const quoteData = {
      customerId: customer.id,
      customerName: customer.name,
      price: Number(price),
      comment,
      createdAt: new Date(),
      createdBy: 'current-user-id',
      status: 'draft' as const
    };

    try {
      const pdfBlob = await generatePDF(customer, quoteData);
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
    } catch (err) {
      setError('Fehler beim Erstellen der PDF-Vorschau');
    }
  };

  const CustomerInfoCard = () => (
    <Card elevation={isMobile ? 1 : 3} sx={{ mb: 2 }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" color="primary" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            Kundendaten
          </Typography>
          <Chip label={`ID: ${customer.id}`} size="small" variant="outlined" />
        </Box>
        
        <Typography variant="h6" sx={{ mb: 1, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
          {customer.name}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <EmailIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            {customer.email}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PhoneIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            {customer.phone}
          </Typography>
        </Box>

        {!isMobile && <Divider sx={{ my: 2 }} />}

        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
          <HomeIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary', mt: 0.5 }} />
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              Von:
            </Typography>
            <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              {customer.fromAddress}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
          <LocationIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary', mt: 0.5 }} />
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              Nach:
            </Typography>
            <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              {customer.toAddress}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <CalendarIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
          <Typography variant="body2" color="primary" fontWeight="medium">
            Umzugsdatum: {new Date(customer.movingDate).toLocaleDateString('de-DE')}
          </Typography>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          {customer.apartment.rooms} Zimmer • {customer.apartment.area} m² • 
          {customer.apartment.floor}. Stock {customer.apartment.hasElevator ? '(mit Aufzug)' : '(ohne Aufzug)'}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <>
      {isMobile && (
        <AppBar position="sticky" color="default" elevation={1}>
          <Toolbar>
            <IconButton 
              edge="start" 
              onClick={() => navigate('/search-customer')}
              sx={{ mr: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Angebot erstellen
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      <Container {...getContainerProps()}>
        {!isMobile && (
          <Box sx={{ mb: 3 }}>
            <IconButton onClick={() => navigate('/search-customer')} sx={{ mb: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant={titleVariant} gutterBottom>
              Angebot erstellen
            </Typography>
          </Box>
        )}

        {isMobile ? (
          <Box>
            <CustomerInfoCard />
            
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Angebotspreis
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Angebot wurde erfolgreich versendet!
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  required
                  fullWidth
                  label="Preis in Euro"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  {...getTextFieldProps()}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EuroIcon />
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{
                    step: "0.01",
                    min: "0"
                  }}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Kommentar (optional)"
                  multiline
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="z.B. Zusätzliche Leistungen, Besonderheiten..."
                  {...getTextFieldProps()}
                  sx={{ mb: 3 }}
                />

                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={handlePreview}
                    disabled={loading || success}
                    startIcon={<PreviewIcon />}
                    sx={{ flex: 1 }}
                  >
                    Vorschau
                  </Button>
                  
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading || success}
                    startIcon={loading ? undefined : <SendIcon />}
                    sx={{ flex: 2 }}
                    {...getButtonProps()}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Angebot senden'}
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid xs={12} md={6}>
              <CustomerInfoCard />
            </Grid>

            <Grid xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Angebotspreis
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Angebot wurde erfolgreich versendet!
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                  <TextField
                    required
                    fullWidth
                    label="Preis in Euro"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">€</InputAdornment>,
                    }}
                    inputProps={{
                      step: "0.01",
                      min: "0"
                    }}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="Kommentar (optional)"
                    multiline
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="z.B. Zusätzliche Leistungen, Besonderheiten..."
                    sx={{ mb: 3 }}
                  />

                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={handlePreview}
                      disabled={loading || success}
                      startIcon={<PreviewIcon />}
                      sx={{ flex: 1 }}
                    >
                      Vorschau
                    </Button>
                  </Box>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading || success}
                    size="large"
                    sx={{ height: 48 }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Angebot senden'}
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Container>
    </>
  );
};

export default CreateQuote;