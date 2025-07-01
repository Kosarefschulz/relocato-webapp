import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Chip,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Stack,
  useTheme,
  alpha
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Download as DownloadIcon,
  Euro as EuroIcon,
  CalendarToday as CalendarIcon,
  Home as HomeIcon,
  ArrowForward as ArrowIcon,
  Close as CloseIcon,
  Draw as DrawIcon
} from '@mui/icons-material';
import { Quote, Customer } from '../types';
import { databaseService } from '../config/database.config';
import { generatePDF } from '../services/pdfService';
import { tokenService } from '../services/tokenService';
import { motion } from 'framer-motion';
import SignatureModal from '../components/SignatureModal';
import { SignatureData } from '../services/pdfSignatureService';
import { sendConfirmationEmail } from '../services/confirmationEmailService';
import { notificationService } from '../services/notificationService';
import { databaseService as unifiedService } from '../services/unifiedDatabaseService.optimized';

const MotionCard = motion(Card);

const QuoteConfirmationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState<string>('');
  const [agbAccepted, setAgbAccepted] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [dateConfirmed, setDateConfirmed] = useState(true); // Default: Datum ist bestätigt
  const [dateUncertain, setDateUncertain] = useState(false); // Datum noch ungenau
  const [confirmedDate, setConfirmedDate] = useState('');
  const [confirmedAddress, setConfirmedAddress] = useState('');

  useEffect(() => {
    loadQuoteData();
  }, [token]);

  const loadQuoteData = async () => {
    if (!token) {
      setError('Ungültiger Link');
      setLoading(false);
      return;
    }

    try {
      // Lade alle Angebote und finde das mit dem Token
      console.log('🔍 Suche Angebot mit Token:', token);
      const quotes = await databaseService.getQuotes();
      console.log(`📊 ${quotes.length} Angebote gefunden`);
      
      // Debug: Zeige alle Tokens
      quotes.forEach(q => {
        if (q.confirmationToken) {
          console.log(`Angebot ${q.id}: Token = ${q.confirmationToken}`);
        }
      });
      
      const foundQuote = quotes.find(q => q.confirmationToken === token);
      console.log('🎯 Gefundenes Angebot:', foundQuote);
      
      if (!foundQuote) {
        console.error('❌ Kein Angebot mit diesem Token gefunden');
        setError('Angebot nicht gefunden oder Link abgelaufen');
        setLoading(false);
        return;
      }

      // Prüfe ob bereits bestätigt
      if (foundQuote.status === 'confirmed' || foundQuote.status === 'accepted' || foundQuote.status === 'invoiced') {
        setError('Dieses Angebot wurde bereits bestätigt');
        setConfirmed(true);
      }

      setQuote(foundQuote);
      console.log('✅ Angebot gesetzt, lade Kundendaten...');

      // Lade Kundendaten
      console.log('🔍 Suche Kunde mit ID:', foundQuote.customerId);
      try {
        // Verwende getCustomer statt getCustomers für bessere Performance und Kundennummer-Suche
        const foundCustomer = await databaseService.getCustomer(foundQuote.customerId);
        console.log('🎯 Gefundener Kunde:', foundCustomer);
        
        if (foundCustomer) {
          setCustomer(foundCustomer);
          setCustomerName(foundCustomer.name);
          setCustomerEmail(foundCustomer.email);
          setConfirmedDate(foundCustomer.movingDate ? new Date(foundCustomer.movingDate).toISOString().split('T')[0] : '');
          setConfirmedAddress(foundCustomer.fromAddress || '');
        } else {
          console.warn('⚠️ Kunde nicht gefunden, verwende Angebotsdaten');
          // Fallback: Verwende Daten aus dem Angebot
          setCustomerName(foundQuote.customerName || 'Kunde');
          setCustomerEmail('');
          setConfirmedDate('');
          setConfirmedAddress('');
        }
      } catch (customerError) {
        console.error('⚠️ Fehler beim Laden des Kunden:', customerError);
        // Fallback: Verwende Daten aus dem Angebot
        setCustomerName(foundQuote.customerName || 'Kunde');
        setCustomerEmail('');
      }
    } catch (err) {
      console.error('❌ Fehler beim Laden des Angebots:', err);
      if (err instanceof Error) {
        console.error('Stack trace:', err.stack);
        setError('Fehler beim Laden des Angebots: ' + err.message);
      } else {
        setError('Fehler beim Laden des Angebots');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmQuote = async () => {
    if (!quote || !agbAccepted || !customerEmail) return;

    setConfirming(true);
    try {
      // Update quote status - WICHTIG: customerId beibehalten!
      const updatedQuote = {
        ...quote,
        customerId: quote.customerId, // Explizit customerId beibehalten
        status: 'confirmed' as const,
        confirmedAt: new Date(),
        confirmedBy: customerEmail || customerName || 'Kunde',
        confirmedDate: dateUncertain ? 'Noch zu klären' : confirmedDate,
        confirmedAddress: confirmedAddress,
        dateUncertain: dateUncertain
      };
      
      console.log('📝 Aktualisiere Angebot:', {
        quoteId: quote.id,
        customerId: updatedQuote.customerId,
        status: updatedQuote.status
      });
      
      await databaseService.updateQuote(quote.id, updatedQuote);
      
      // Update customer status if exists
      if (customer) {
        try {
          console.log('📝 Aktualisiere Kundenstatus...');
          await databaseService.updateCustomer(customer.id, {
            salesStatus: 'reached' as const,
            status: 'Angebot bestätigt'
          });
          console.log('✅ Kundenstatus aktualisiert');
        } catch (customerError) {
          console.error('⚠️ Fehler beim Aktualisieren des Kundenstatus:', customerError);
        }
      }
      
      // Send confirmation email
      try {
        console.log('📧 Sende Bestätigungsmail...');
        await sendConfirmationEmail(
          customer || { 
            id: quote.customerId,
            name: customerName || quote.customerName || 'Kunde',
            email: customerEmail || ''
          } as Customer,
          updatedQuote,
          customerEmail || ''
        );
        console.log('✅ Bestätigungsmail gesendet');
      } catch (emailError) {
        console.error('⚠️ Fehler beim Senden der Bestätigungsmail:', emailError);
        // Don't fail the whole confirmation if email fails
      }

      // Create notification for dashboard
      try {
        console.log('📢 Erstelle Dashboard-Benachrichtigung...');
        await notificationService.createQuoteConfirmedNotification(
          customerName || quote.customerName || 'Kunde',
          quote.customerId,
          quote.id
        );
        console.log('✅ Benachrichtigung erstellt');
      } catch (notificationError) {
        console.error('⚠️ Fehler beim Erstellen der Benachrichtigung:', notificationError);
        // Don't fail the whole confirmation if notification fails
      }

      // Create calendar event if date is confirmed
      if (!dateUncertain && (confirmedDate || customer?.movingDate)) {
        try {
          console.log('📅 Erstelle Kalendereintrag...');
          const eventDate = confirmedDate || customer?.movingDate || '';
          const calendarEvent = {
            title: `Umzug: ${customerName || quote.customerName || 'Kunde'}`,
            date: eventDate,
            type: 'moving' as const,
            customerId: quote.customerId,
            customerName: customerName || quote.customerName || 'Kunde',
            description: `Bestätigtes Angebot #${quote.id}\nPreis: ${quote.price.toFixed(2)} €\nVolumen: ${quote.volume || 50} m³`,
            location: `Von: ${confirmedAddress || customer?.fromAddress || 'TBD'} Nach: ${customer?.toAddress || 'TBD'}`,
            source: 'manual' as const,
            metadata: {
              quoteId: quote.id,
              confirmed: true,
              price: quote.price,
              volume: quote.volume || 50
            }
          };
          
          const eventId = await unifiedService.addCalendarEvent(calendarEvent);
          console.log('✅ Kalendereintrag erstellt:', eventId);
        } catch (calendarError) {
          console.error('⚠️ Fehler beim Erstellen des Kalendereintrags:', calendarError);
          // Don't fail the whole confirmation if calendar entry fails
        }
      }

      setConfirmed(true);
      setConfirmDialog(false);
    } catch (err) {
      console.error('Error confirming quote:', err);
      alert('Fehler bei der Bestätigung. Bitte versuchen Sie es erneut.');
    } finally {
      setConfirming(false);
    }
  };

  const handleDownloadPdf = async (withSignature: boolean = false, signatureData?: SignatureData) => {
    if (!quote) return;

    try {
      setDownloadingPdf(true);
      
      // Erstelle ein Fallback-Customer-Objekt wenn keiner gefunden wurde
      const customerForPdf = customer || {
        id: quote.customerId,
        name: customerName || quote.customerName || 'Kunde',
        email: customerEmail || '',
        phone: '',
        fromAddress: 'Wird noch mitgeteilt',
        toAddress: 'Wird noch mitgeteilt',
        movingDate: new Date().toISOString(),
        apartment: {
          rooms: 0,
          area: 0,
          floor: 0,
          hasElevator: false
        },
        services: []
      };
      
      const quoteData = {
        customerId: customerForPdf.id,
        customerName: customerForPdf.name,
        price: quote.price,
        comment: quote.comment || '',
        createdAt: quote.createdAt,
        createdBy: quote.createdBy,
        status: quote.status,
        volume: quote.volume || 50,
        distance: quote.distance || 25,
        company: quote.company
      };

      const pdfBlob = await generatePDF(customerForPdf, quoteData);
      
      // Download
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Angebot_${(customer?.name || customerName || 'Kunde').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      
      if (withSignature && signatureData) {
        setSignatureModalOpen(false);
      }
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Fehler beim Download. Bitte versuchen Sie es erneut.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !confirmed) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={() => navigate('/')}>
          Zur Startseite
        </Button>
      </Container>
    );
  }

  if (!quote) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error">
          Angebot konnte nicht geladen werden
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: alpha(theme.palette.primary.main, 0.02),
      py: 4 
    }}>
      <Container maxWidth="md">
        {/* Header */}
        <MotionCard
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{ mb: 4, overflow: 'visible' }}
        >
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
              {confirmed ? 'Angebot bestätigt' : 'Ihr Umzugsangebot'}
            </Typography>
            {customer && (
              <Typography variant="h6" color="text.secondary">
                {customer.name}
              </Typography>
            )}
          </CardContent>
        </MotionCard>

        {/* Status Alert */}
        {confirmed && (
          <Alert 
            severity="success" 
            icon={<CheckCircleIcon />}
            sx={{ mb: 3 }}
          >
            Vielen Dank! Ihr Angebot wurde erfolgreich bestätigt. 
            Sie erhalten in Kürze eine Bestätigungs-E-Mail.
          </Alert>
        )}

        {/* Quote Details */}
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          sx={{ mb: 3 }}
        >
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              Angebotsdetails
            </Typography>
            
            <Stack spacing={3}>
              {/* Preis */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <EuroIcon color="primary" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Gesamtpreis
                  </Typography>
                  <Typography variant="h4" color="primary">
                    €{quote.price.toFixed(2)}
                  </Typography>
                </Box>
              </Box>

              <Divider />

              {/* Umzugsdatum */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CalendarIcon color="action" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Umzugsdatum
                  </Typography>
                  <Typography variant="body1">
                    {customer?.movingDate ? new Date(customer.movingDate).toLocaleDateString('de-DE', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    }) : 'Noch nicht festgelegt'}
                  </Typography>
                </Box>
              </Box>

              <Divider />

              {/* Adressen */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <HomeIcon color="action" />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Umzugsstrecke
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        Von:
                      </Typography>
                      <Typography variant="body2">
                        {customer?.fromAddress || 'Nicht angegeben'}
                      </Typography>
                    </Box>
                    <ArrowIcon color="primary" />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        Nach:
                      </Typography>
                      <Typography variant="body2">
                        {customer?.toAddress || 'Nicht angegeben'}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Box>

              {/* Kommentar */}
              {quote.comment && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Details
                    </Typography>
                    <Typography variant="body1">
                      {quote.comment}
                    </Typography>
                  </Box>
                </>
              )}
            </Stack>
          </CardContent>
        </MotionCard>

        {/* Action Buttons */}
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <CardContent>
            <Stack spacing={2}>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                startIcon={downloadingPdf ? <CircularProgress size={20} /> : <DownloadIcon />}
                onClick={() => handleDownloadPdf()}
                disabled={downloadingPdf}
              >
                Angebot als PDF herunterladen
              </Button>

              {!confirmed && quote.status === 'sent' && (
                <>
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => setConfirmDialog(true)}
                  >
                    Angebot verbindlich bestätigen
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="large"
                    fullWidth
                    startIcon={<DrawIcon />}
                    onClick={() => setSignatureModalOpen(true)}
                  >
                    Mit digitaler Unterschrift bestätigen
                  </Button>
                </>
              )}
            </Stack>
          </CardContent>
        </MotionCard>

        {/* Info Box */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Bei Fragen erreichen Sie uns unter:
          </Typography>
          <Typography variant="body2" color="primary">
            info@relocato.de | Tel: 0521 123456
          </Typography>
        </Box>
      </Container>

      {/* Confirmation Dialog */}
      <Dialog 
        open={confirmDialog} 
        onClose={() => setConfirmDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Angebot verbindlich bestätigen
          <IconButton
            onClick={() => setConfirmDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {/* Kundendetails Anzeige */}
            <Box sx={{ 
              backgroundColor: 'grey.50', 
              p: 2, 
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'grey.300'
            }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Ihre Angaben:
              </Typography>
              <Typography variant="body2">
                <strong>Name:</strong> {customerName || customer?.name || 'Nicht angegeben'}
              </Typography>
              <Typography variant="body2">
                <strong>Adresse:</strong> {confirmedAddress || customer?.fromAddress || 'Nicht angegeben'}
              </Typography>
            </Box>

            {/* Name und Email Eingabe */}
            <TextField
              label="Ihr Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Ihre E-Mail"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              fullWidth
              required
            />
            
            {/* Adresse Eingabe */}
            <TextField
              label="Umzugsadresse (Von)"
              value={confirmedAddress}
              onChange={(e) => setConfirmedAddress(e.target.value)}
              fullWidth
              multiline
              rows={2}
              helperText="Bitte geben Sie die vollständige Adresse ein"
            />
            
            {/* Datum Bestätigung */}
            <Box sx={{ 
              backgroundColor: 'primary.50', 
              p: 2, 
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'primary.200'
            }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Umzugsdatum:
              </Typography>
              
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={dateConfirmed && !dateUncertain} 
                    onChange={(e) => {
                      setDateConfirmed(e.target.checked);
                      if (e.target.checked) setDateUncertain(false);
                    }}
                  />
                }
                label="Datum bestätigt"
              />
              
              {dateConfirmed && !dateUncertain && (
                <TextField
                  label="Umzugsdatum"
                  type="date"
                  value={confirmedDate}
                  onChange={(e) => setConfirmedDate(e.target.value)}
                  fullWidth
                  sx={{ mt: 2 }}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              )}
              
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={dateUncertain} 
                    onChange={(e) => {
                      setDateUncertain(e.target.checked);
                      if (e.target.checked) setDateConfirmed(false);
                    }}
                  />
                }
                label="Datum noch ungenau (wird später geklärt)"
              />
            </Box>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              Mit der Bestätigung erteilen Sie uns den verbindlichen Auftrag zur 
              Durchführung des Umzugs zu den genannten Konditionen.
            </Alert>

            <FormControlLabel
              control={
                <Checkbox 
                  checked={agbAccepted} 
                  onChange={(e) => setAgbAccepted(e.target.checked)}
                />
              }
              label="Ich akzeptiere die AGB und Datenschutzbestimmungen"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setConfirmDialog(false)}>
            Abbrechen
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleConfirmQuote}
            disabled={!agbAccepted || !customerName || !customerEmail || (!dateUncertain && !confirmedDate) || confirming}
            startIcon={confirming ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          >
            Verbindlich bestätigen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Signature Modal */}
      <SignatureModal
        open={signatureModalOpen}
        onClose={() => setSignatureModalOpen(false)}
        onSign={(signatureData) => {
          // Nach Unterschrift: Angebot bestätigen und PDF mit Unterschrift generieren
          handleConfirmQuote();
          handleDownloadPdf(true, signatureData);
        }}
        documentName={`Angebot ${quote.id}`}
        signerType="customer"
      />
    </Box>
  );
};

export default QuoteConfirmationPage;