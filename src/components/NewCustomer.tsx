import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  FormControlLabel,
  Checkbox,
  MenuItem
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { googleSheetsPublicService as googleSheetsService } from '../services/googleSheetsPublic';

const NewCustomer: React.FC = () => {
  const navigate = useNavigate();
  const { customerId } = useParams<{ customerId: string }>();
  const isEditMode = !!customerId;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    movingDate: '',
    fromAddress: '',
    toAddress: '',
    rooms: 2,
    area: 50,
    floor: 1,
    hasElevator: false,
    notes: ''
  });

  useEffect(() => {
    if (isEditMode && customerId) {
      loadCustomer();
    }
  }, [customerId, isEditMode]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      const customers = await googleSheetsService.getCustomers();
      const customer = customers.find(c => c.id === customerId);
      
      if (customer) {
        setFormData({
          name: customer.name || '',
          email: customer.email || '',
          phone: customer.phone || '',
          movingDate: customer.movingDate || '',
          fromAddress: customer.fromAddress || '',
          toAddress: customer.toAddress || '',
          rooms: customer.apartment?.rooms || 2,
          area: customer.apartment?.area || 50,
          floor: customer.apartment?.floor || 1,
          hasElevator: customer.apartment?.hasElevator || false,
          notes: customer.notes || ''
        });
      } else {
        setError('Kunde nicht gefunden');
        setTimeout(() => navigate('/customers'), 2000);
      }
    } catch (err) {
      console.error('Fehler beim Laden des Kunden:', err);
      setError('Kunde konnte nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone) {
      setError('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const customerData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        movingDate: formData.movingDate,
        fromAddress: formData.fromAddress,
        toAddress: formData.toAddress,
        apartment: {
          rooms: formData.rooms,
          area: formData.area,
          floor: formData.floor,
          hasElevator: formData.hasElevator
        },
        services: [], // Kann später erweitert werden
        notes: formData.notes
      };

      let success;
      
      if (isEditMode && customerId) {
        // Update existing customer
        success = await googleSheetsService.updateCustomer(customerId, customerData);
      } else {
        // Add new customer
        success = await googleSheetsService.addCustomer(customerData);
      }
      
      if (success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/customers');
        }, 1500);
      } else {
        setError(isEditMode 
          ? 'Fehler beim Aktualisieren des Kunden' 
          : 'Kunde wurde lokal gespeichert (Google Sheets nicht verfügbar)');
        setTimeout(() => {
          navigate('/customers');
        }, 2000);
      }
      
    } catch (err) {
      setError('Fehler beim Erstellen des Kunden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate('/dashboard')} sx={{ mb: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" gutterBottom>
          {isEditMode ? 'Kunde bearbeiten' : 'Neuer Kunde'}
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {isEditMode 
              ? 'Kunde wurde erfolgreich aktualisiert!' 
              : 'Kunde wurde erfolgreich erstellt!'}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Typography variant="h6" gutterBottom color="primary">
            Kontaktdaten
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 48%' } }}>
              <TextField
                required
                fullWidth
                label="Name"
                value={formData.name}
                onChange={handleInputChange('name')}
              />
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 48%' } }}>
              <TextField
                required
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
              />
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 48%' } }}>
              <TextField
                required
                fullWidth
                label="Telefon"
                value={formData.phone}
                onChange={handleInputChange('phone')}
              />
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 48%' } }}>
              <TextField
                fullWidth
                label="Umzugsdatum"
                type="date"
                value={formData.movingDate}
                onChange={handleInputChange('movingDate')}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Box>
          </Box>

          <Typography variant="h6" gutterBottom color="primary">
            Umzugsdetails
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
            <TextField
              fullWidth
              label="Von (Adresse)"
              value={formData.fromAddress}
              onChange={handleInputChange('fromAddress')}
              multiline
              rows={2}
            />
            <TextField
              fullWidth
              label="Nach (Adresse)"
              value={formData.toAddress}
              onChange={handleInputChange('toAddress')}
              multiline
              rows={2}
            />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 30%' } }}>
                <TextField
                  fullWidth
                  label="Anzahl Zimmer"
                  type="number"
                  value={formData.rooms}
                  onChange={handleInputChange('rooms')}
                  inputProps={{ min: 1, max: 10 }}
                />
              </Box>
              <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 30%' } }}>
                <TextField
                  fullWidth
                  label="Wohnfläche (m²)"
                  type="number"
                  value={formData.area}
                  onChange={handleInputChange('area')}
                  inputProps={{ min: 10, max: 500 }}
                />
              </Box>
              <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 30%' } }}>
                <TextField
                  fullWidth
                  label="Stockwerk"
                  type="number"
                  value={formData.floor}
                  onChange={handleInputChange('floor')}
                  inputProps={{ min: 0, max: 50 }}
                />
              </Box>
            </Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.hasElevator}
                  onChange={handleInputChange('hasElevator')}
                />
              }
              label="Aufzug vorhanden"
            />
            <TextField
              fullWidth
              label="Notizen"
              multiline
              rows={3}
              value={formData.notes}
              onChange={handleInputChange('notes')}
              placeholder="Besonderheiten, zusätzliche Services..."
            />
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading || success}
            size="large"
            sx={{ height: 48 }}
          >
            {loading ? <CircularProgress size={24} /> : (isEditMode ? 'Änderungen speichern' : 'Kunde erstellen')}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default NewCustomer;