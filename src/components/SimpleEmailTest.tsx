import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';

const SimpleEmailTest: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSendTestEmail = async () => {
    if (!email) {
      setError('Bitte geben Sie eine E-Mail-Adresse ein');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Einfacher E-Mail Test ohne komplexe Imports
      const emailData = {
        to: email,
        subject: 'RELOCATO® Test-E-Mail',
        content: `Hallo!

Dies ist eine Test-E-Mail von RELOCATO®.

Wenn Sie diese E-Mail erhalten, funktioniert das E-Mail-System!

Mit freundlichen Grüßen
Ihr RELOCATO® Team

📞 0800 - RELOCATO
📧 info@relocato.de`,
        attachments: []
      };

      // Simuliere E-Mail-Versand
      console.log('📧 Sende Test-E-Mail:', emailData);
      
      // Kurze Verzögerung simulieren
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess(`✅ Test-E-Mail wurde simuliert an: ${email}`);
      
    } catch (err) {
      console.error('Test-E-Mail Fehler:', err);
      setError('❌ Fehler beim Senden der Test-E-Mail');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        📧 Einfacher E-Mail Test
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Grundlegendes E-Mail-System testen
      </Typography>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test-E-Mail senden
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Ihre E-Mail-Adresse"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ihre.email@domain.de"
          sx={{ mb: 3 }}
        />

        <Button
          fullWidth
          variant="contained"
          onClick={handleSendTestEmail}
          disabled={loading}
          size="large"
          sx={{ height: 48 }}
        >
          {loading ? <CircularProgress size={24} /> : '📧 Einfachen Test senden'}
        </Button>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            📋 Status:
          </Typography>
          <Typography variant="body2">
            SendGrid API: {process.env.REACT_APP_SENDGRID_API_KEY === 'demo-sendgrid-key' ? '❌ Demo-Modus' : '✅ Konfiguriert'}<br/>
            Von-Adresse: {process.env.REACT_APP_SENDGRID_FROM_EMAIL}<br/>
            Status: Simulation läuft
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default SimpleEmailTest;