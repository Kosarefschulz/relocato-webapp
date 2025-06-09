import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent
} from '@mui/material';
import { sendEmail } from '../services/emailService';
import { generatePDF } from '../services/pdfService';
import { quoteCalculationService } from '../services/quoteCalculation';

const EmailTest: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Demo-Kundendaten für Test
  const demoCustomer = {
    id: 'test_001',
    name: 'Max Mustermann',
    email: email || 'max@mustermann.de',
    phone: '+49 30 12345678',
    movingDate: '2024-06-15',
    fromAddress: 'Musterstraße 15, 10115 Berlin - Etage 3',
    toAddress: 'Neue Straße 22, 20095 Hamburg - Etage 2',
    apartment: {
      rooms: 3,
      area: 75,
      floor: 3,
      hasElevator: false
    },
    services: ['Umzug', 'Verpackung'],
    notes: 'Demo-Test für RELOCATO® E-Mail-System'
  };

  const demoQuoteDetails = {
    volume: 20,
    distance: 290,
    packingRequested: true,
    additionalServices: [],
    notes: 'Testangebot mit Verpackungsservice'
  };

  const handleSendTestEmail = async () => {
    if (!email) {
      setError('Bitte geben Sie eine E-Mail-Adresse ein');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Preiskalkulation durchführen
      const calculation = quoteCalculationService.calculateQuote(demoCustomer, demoQuoteDetails);
      
      // HTML für PDF generieren
      const htmlContent = quoteCalculationService.generateQuoteHTML(demoCustomer, calculation, demoQuoteDetails);
      
      // PDF generieren
      const pdfBlob = await generatePDF(demoCustomer, {
        customerId: demoCustomer.id,
        customerName: demoCustomer.name,
        price: calculation.totalPrice,
        comment: demoQuoteDetails.notes,
        createdAt: new Date(),
        createdBy: 'test-user',
        status: 'sent'
      }, htmlContent);

      // E-Mail-Text generieren
      const emailText = quoteCalculationService.generateEmailText(demoCustomer, calculation);

      // E-Mail senden
      const emailSuccess = await sendEmail({
        to: email,
        subject: `Ihr Umzugsangebot - RELOCATO® - ${demoCustomer.name}`,
        content: emailText,
        attachments: [{
          filename: `RELOCATO_Testangebot_${demoCustomer.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
          content: pdfBlob
        }]
      });

      if (emailSuccess) {
        setSuccess(`✅ Test-E-Mail erfolgreich gesendet an: ${email}`);
      } else {
        setError('❌ E-Mail-Versand fehlgeschlagen. Prüfen Sie die SendGrid-Konfiguration.');
      }

    } catch (err) {
      console.error('Test-E-Mail Fehler:', err);
      setError('❌ Fehler beim Erstellen der Test-E-Mail');
    } finally {
      setLoading(false);
    }
  };

  // Preiskalkulation für Vorschau
  const calculation = quoteCalculationService.calculateQuote(demoCustomer, demoQuoteDetails);

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        📧 E-Mail Test - RELOCATO®
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Testen Sie das E-Mail-System mit einem Demo-Angebot
      </Typography>

      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            Demo-Angebot Vorschau
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Kunde:</strong> {demoCustomer.name} ({demoCustomer.email})
            </Typography>
            <Typography variant="body2">
              <strong>Von:</strong> {demoCustomer.fromAddress}
            </Typography>
            <Typography variant="body2">
              <strong>Nach:</strong> {demoCustomer.toAddress}
            </Typography>
            <Typography variant="body2">
              <strong>Volumen:</strong> {demoQuoteDetails.volume} m³
            </Typography>
            <Typography variant="body2">
              <strong>Entfernung:</strong> {demoQuoteDetails.distance} km
            </Typography>
            <Typography variant="body2">
              <strong>Verpackung:</strong> {demoQuoteDetails.packingRequested ? 'Ja' : 'Nein'}
            </Typography>
          </Box>

          <Box sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', p: 2, borderRadius: 1 }}>
            <Typography variant="h6">
              Gesamtpreis: €{calculation.totalPrice.toFixed(2).replace('.', ',')}
            </Typography>
            <Typography variant="body2">
              Basis: €{calculation.priceBreakdown.base} + 
              Etagen: €{calculation.priceBreakdown.floors} + 
              Entfernung: €{calculation.priceBreakdown.distance} + 
              Verpackung: €{calculation.priceBreakdown.packing}
            </Typography>
          </Box>
        </CardContent>
      </Card>

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
          {loading ? <CircularProgress size={24} /> : '📧 Test-E-Mail mit PDF senden'}
        </Button>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            📋 SendGrid Setup:
          </Typography>
          <Typography variant="body2" component="div">
            1. <strong>SendGrid Account:</strong> https://sendgrid.com/<br/>
            2. <strong>API-Schlüssel erstellen:</strong> Settings → API Keys<br/>
            3. <strong>.env aktualisieren:</strong> REACT_APP_SENDGRID_API_KEY=IhrSchlüssel<br/>
            4. <strong>App neustarten:</strong> npm start<br/>
          </Typography>
          
          <Typography variant="body2" sx={{ mt: 2 }}>
            📧 <strong>Aktuelle Konfiguration:</strong><br/>
            API-Key: {process.env.REACT_APP_SENDGRID_API_KEY === 'demo-sendgrid-key' ? '❌ Demo-Modus' : '✅ Konfiguriert'}<br/>
            Von-Adresse: {process.env.REACT_APP_SENDGRID_FROM_EMAIL}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default EmailTest;