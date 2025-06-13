import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  IconButton,
  Button,
  Chip,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Divider,
  Snackbar,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  GetApp as GetAppIcon,
  Visibility as VisibilityIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Description as DraftIcon,
  Send as SendIcon,
  Euro as EuroIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { Quote, Customer, Invoice } from '../types';
import { googleSheetsPublicService as googleSheetsService } from '../services/googleSheetsPublic';
import { generatePDF, generateInvoicePDF } from '../services/pdfService';
import { sendEmail } from '../services/emailService';
import { motion } from 'framer-motion';

const MotionCard = motion(Card);

const QuotesList: React.FC = () => {
  const navigate = useNavigate();
  
  // State
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invoiceDialog, setInvoiceDialog] = useState<{open: boolean, quote: Quote | null}>({ open: false, quote: null });
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [sendInvoice, setSendInvoice] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [quotesData, customersData, invoicesData] = await Promise.all([
        googleSheetsService.getQuotes(),
        googleSheetsService.getCustomers(),
        googleSheetsService.getInvoices()
      ]);
      
      setQuotes(quotesData);
      setCustomers(customersData);
      setInvoices(invoicesData);
      
    } catch (err) {
      setError('Fehler beim Laden der Angebote');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getCustomer = (customerId: string): Customer | undefined => {
    return customers.find(c => c.id === customerId);
  };

  const handleDownloadPDF = async (quote: Quote) => {
    try {
      const customer = getCustomer(quote.customerId);
      if (!customer) {
        setSnackbar({ open: true, message: 'Kunde nicht gefunden', severity: 'error' });
        return;
      }

      const pdfBlob = await generatePDF(customer, quote);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Angebot_${quote.customerName}_${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      
      setSnackbar({ open: true, message: 'PDF heruntergeladen', severity: 'success' });
    } catch (error) {
      console.error('PDF Download Error:', error);
      setSnackbar({ open: true, message: 'Fehler beim PDF-Download', severity: 'error' });
    }
  };

  const handleSendEmail = async (quote: Quote) => {
    try {
      const customer = getCustomer(quote.customerId);
      if (!customer) {
        setSnackbar({ open: true, message: 'Kunde nicht gefunden', severity: 'error' });
        return;
      }

      const pdfBlob = await generatePDF(customer, quote);
      
      const emailData = {
        to: customer.email,
        subject: `Ihr Umzugsangebot von Relocato`,
        content: `
          <h2>Sehr geehrte/r ${customer.name},</h2>
          <p>vielen Dank für Ihre Anfrage. Anbei finden Sie Ihr persönliches Umzugsangebot.</p>
          <p><strong>Angebotsnummer:</strong> ${quote.id}</p>
          <p><strong>Gesamtpreis:</strong> €${quote.price.toFixed(2)}</p>
          <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
          <p>Mit freundlichen Grüßen<br>Ihr Relocato Team</p>
        `,
        attachments: [{
          filename: `Angebot_${customer.name.replace(/\s+/g, '_')}.pdf`,
          content: pdfBlob
        }]
      };

      const sent = await sendEmail(emailData);
      
      if (sent) {
        // Update quote status to sent
        const updatedQuote = { ...quote, status: 'sent' as const };
        await googleSheetsService.updateQuote(quote.id, { status: 'sent' });
        setQuotes(quotes.map(q => q.id === quote.id ? updatedQuote : q));
        
        setSnackbar({ open: true, message: 'Angebot erfolgreich versendet', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Fehler beim E-Mail-Versand', severity: 'error' });
      }
    } catch (error) {
      console.error('Email Error:', error);
      setSnackbar({ open: true, message: 'Fehler beim E-Mail-Versand', severity: 'error' });
    }
  };

  const handleConvertToInvoice = (quote: Quote) => {
    // Generate invoice number
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setInvoiceNumber(`RE-${year}${month}-${random}`);
    setInvoiceDialog({ open: true, quote });
  };

  const confirmConvertToInvoice = async () => {
    if (!invoiceDialog.quote || !invoiceNumber) return;

    try {
      const quote = invoiceDialog.quote;
      const customer = getCustomer(quote.customerId);
      
      if (!customer) {
        setSnackbar({ open: true, message: 'Kunde nicht gefunden', severity: 'error' });
        return;
      }

      // Create invoice
      const invoice: Omit<Invoice, 'id'> = {
        quoteId: quote.id,
        customerId: quote.customerId,
        customerName: quote.customerName,
        invoiceNumber: invoiceNumber,
        price: quote.price,
        taxAmount: quote.price * 0.19, // 19% MwSt
        totalPrice: quote.price * 1.19,
        items: [{
          description: 'Umzugsdienstleistung gemäß Angebot ' + quote.id,
          quantity: 1,
          unitPrice: quote.price,
          totalPrice: quote.price
        }],
        createdAt: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 Tage Zahlungsziel
        status: 'sent'
      };

      await googleSheetsService.addInvoice(invoice);

      // Update quote status
      await googleSheetsService.updateQuote(quote.id, { status: 'invoiced' });
      setQuotes(quotes.map(q => q.id === quote.id ? { ...q, status: 'invoiced' as const } : q));

      // Send invoice if requested
      if (sendInvoice) {
        try {
          // Get the saved invoice with ID
          const invoices = await googleSheetsService.getInvoices();
          const savedInvoice = invoices.find(inv => 
            inv.invoiceNumber === invoiceNumber && 
            inv.customerId === customer.id
          );
          
          if (savedInvoice) {
            // Generate invoice PDF
            const pdfBlob = await generateInvoicePDF(customer, savedInvoice);
            
            // Send email with invoice
            const emailData = {
              to: customer.email,
              subject: `Ihre Rechnung ${invoiceNumber} von Relocato`,
              content: `
                <h2>Sehr geehrte/r ${customer.name},</h2>
                <p>vielen Dank für Ihren Auftrag. Anbei erhalten Sie Ihre Rechnung.</p>
                <p><strong>Rechnungsnummer:</strong> ${invoiceNumber}</p>
                <p><strong>Gesamtbetrag:</strong> €${savedInvoice.totalPrice.toFixed(2)}</p>
                <p><strong>Zahlungsziel:</strong> ${new Date(savedInvoice.dueDate).toLocaleDateString('de-DE')}</p>
                <p>Bitte überweisen Sie den Betrag bis zum angegebenen Zahlungsziel auf das in der Rechnung angegebene Konto.</p>
                <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
                <p>Mit freundlichen Grüßen<br>Ihr Relocato Team</p>
              `,
              attachments: [{
                filename: `Rechnung_${invoiceNumber}_${customer.name.replace(/\s+/g, '_')}.pdf`,
                content: pdfBlob
              }]
            };
            
            const sent = await sendEmail(emailData);
            
            if (sent) {
              setSnackbar({ open: true, message: 'Rechnung erstellt und per E-Mail versendet', severity: 'success' });
            } else {
              setSnackbar({ open: true, message: 'Rechnung erstellt, E-Mail-Versand fehlgeschlagen', severity: 'warning' });
            }
          } else {
            setSnackbar({ open: true, message: 'Rechnung erstellt', severity: 'success' });
          }
        } catch (emailError) {
          console.error('Fehler beim E-Mail-Versand:', emailError);
          setSnackbar({ open: true, message: 'Rechnung erstellt, E-Mail-Versand fehlgeschlagen', severity: 'warning' });
        }
      } else {
        setSnackbar({ open: true, message: 'Rechnung erstellt', severity: 'success' });
      }

      setInvoiceDialog({ open: false, quote: null });
      setInvoiceNumber('');
    } catch (error) {
      console.error('Invoice Error:', error);
      setSnackbar({ open: true, message: 'Fehler beim Erstellen der Rechnung', severity: 'error' });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <DraftIcon />;
      case 'sent': return <SendIcon />;
      case 'accepted': return <CheckIcon />;
      case 'rejected': return <CancelIcon />;
      case 'invoiced': return <ReceiptIcon />;
      default: return <DraftIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'sent': return 'primary';
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      case 'invoiced': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Entwurf';
      case 'sent': return 'Versendet';
      case 'accepted': return 'Angenommen';
      case 'rejected': return 'Abgelehnt';
      case 'invoiced': return 'Abgerechnet';
      default: return status;
    }
  };

  // Statistics
  const totalQuotes = quotes.length;
  const totalValue = quotes.reduce((sum, quote) => sum + quote.price, 0);
  const acceptedQuotes = quotes.filter(q => q.status === 'accepted' || q.status === 'invoiced').length;
  const acceptanceRate = totalQuotes > 0 ? (acceptedQuotes / totalQuotes * 100) : 0;

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate('/dashboard')} sx={{ mb: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" gutterBottom>
          Angebote
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Verwaltung aller Umzugsangebote
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="primary">
                    {totalQuotes}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Angebote gesamt
                  </Typography>
                </Box>
                <AssessmentIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="success.main">
                    €{totalValue.toLocaleString('de-DE')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Gesamtwert
                  </Typography>
                </Box>
                <EuroIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="info.main">
                    {acceptedQuotes}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Angenommen
                  </Typography>
                </Box>
                <CheckIcon color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="warning.main">
                    {acceptanceRate.toFixed(0)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Erfolgsquote
                  </Typography>
                </Box>
                <TrendingUpIcon color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quotes List */}
      <Grid container spacing={2}>
        {quotes.map((quote, index) => (
          <Grid item xs={12} key={quote.id}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.01 }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Typography variant="h6">
                        {quote.customerName}
                      </Typography>
                      <Chip
                        icon={getStatusIcon(quote.status)}
                        label={getStatusLabel(quote.status)}
                        color={getStatusColor(quote.status) as any}
                        size="small"
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 3, mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>ID:</strong> {quote.id}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Datum:</strong> {new Date(quote.createdAt).toLocaleDateString('de-DE')}
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        €{quote.price.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                    
                    {quote.comment && (
                      <Typography variant="body2" color="text.secondary">
                        {quote.comment}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Status ändern Buttons */}
                    {quote.status === 'draft' && (
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        startIcon={updatingStatus === quote.id ? <CircularProgress size={16} /> : <SendIcon />}
                        onClick={async (e) => {
                          e.stopPropagation();
                          setUpdatingStatus(quote.id);
                          try {
                            await googleSheetsService.updateQuote(quote.id, { status: 'sent' });
                            setQuotes(quotes.map(q => q.id === quote.id ? { ...q, status: 'sent' as const } : q));
                            setSnackbar({ open: true, message: 'Status auf "Versendet" geändert', severity: 'success' });
                          } catch (error) {
                            console.error('Error updating quote status:', error);
                            setSnackbar({ open: true, message: 'Fehler beim Aktualisieren des Status', severity: 'error' });
                          } finally {
                            setUpdatingStatus(null);
                          }
                        }}
                        disabled={updatingStatus === quote.id}
                      >
                        Als gesendet markieren
                      </Button>
                    )}
                    
                    {quote.status === 'sent' && (
                      <>
                        <IconButton
                          size="small"
                          color="success"
                          title="Als angenommen markieren"
                          onClick={async (e) => {
                            e.stopPropagation();
                            setUpdatingStatus(quote.id);
                            try {
                              await googleSheetsService.updateQuote(quote.id, { status: 'accepted' });
                              setQuotes(quotes.map(q => q.id === quote.id ? { ...q, status: 'accepted' as const } : q));
                              setSnackbar({ open: true, message: 'Angebot wurde als angenommen markiert', severity: 'success' });
                            } catch (error) {
                              console.error('Error updating quote status:', error);
                              setSnackbar({ open: true, message: 'Fehler beim Aktualisieren des Status', severity: 'error' });
                            } finally {
                              setUpdatingStatus(null);
                            }
                          }}
                          disabled={updatingStatus === quote.id}
                        >
                          {updatingStatus === quote.id ? <CircularProgress size={20} /> : <CheckIcon />}
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          title="Als abgelehnt markieren"
                          onClick={async (e) => {
                            e.stopPropagation();
                            setUpdatingStatus(quote.id);
                            try {
                              await googleSheetsService.updateQuote(quote.id, { status: 'rejected' });
                              setQuotes(quotes.map(q => q.id === quote.id ? { ...q, status: 'rejected' as const } : q));
                              setSnackbar({ open: true, message: 'Angebot wurde als abgelehnt markiert', severity: 'success' });
                            } catch (error) {
                              console.error('Error updating quote status:', error);
                              setSnackbar({ open: true, message: 'Fehler beim Aktualisieren des Status', severity: 'error' });
                            } finally {
                              setUpdatingStatus(null);
                            }
                          }}
                          disabled={updatingStatus === quote.id}
                        >
                          <CancelIcon />
                        </IconButton>
                      </>
                    )}

                    <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                    
                    {/* Action Icons */}
                    <IconButton
                      size="small"
                      color="primary"
                      title="Details anzeigen"
                      onClick={() => navigate(`/customer-details/${quote.customerId}`, { state: { tabIndex: 2 } })}
                    >
                      <VisibilityIcon />
                    </IconButton>
                    
                    <IconButton
                      size="small"
                      color="info"
                      title="PDF herunterladen"
                      onClick={() => handleDownloadPDF(quote)}
                    >
                      <GetAppIcon />
                    </IconButton>
                    
                    <IconButton
                      size="small"
                      color="success"
                      title="Per E-Mail senden"
                      onClick={() => handleSendEmail(quote)}
                      disabled={quote.status === 'invoiced'}
                    >
                      <EmailIcon />
                    </IconButton>
                    
                    {quote.status === 'accepted' && (
                      <IconButton
                        size="small"
                        color="secondary"
                        title="In Rechnung umwandeln"
                        onClick={() => handleConvertToInvoice(quote)}
                      >
                        <ReceiptIcon />
                      </IconButton>
                    )}
                    
                    {quote.status === 'invoiced' && (
                      <IconButton
                        size="small"
                        color="secondary"
                        title="Rechnung anzeigen"
                        onClick={() => {
                          // Find invoice for this quote
                          const invoice = invoices.find(inv => inv.quoteId === quote.id);
                          if (invoice) {
                            navigate('/invoices', { state: { highlightInvoice: invoice.id } });
                          } else {
                            setSnackbar({ open: true, message: 'Rechnung nicht gefunden', severity: 'error' });
                          }
                        }}
                      >
                        <ReceiptIcon />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </MotionCard>
          </Grid>
        ))}
      </Grid>

      {quotes.length === 0 && !loading && (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Noch keine Angebote vorhanden
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/customers')}
            sx={{ mt: 2 }}
          >
            Kunden anzeigen
          </Button>
        </Card>
      )}

      {/* Convert to Invoice Dialog */}
      <Dialog open={invoiceDialog.open} onClose={() => setInvoiceDialog({ open: false, quote: null })} maxWidth="sm" fullWidth>
        <DialogTitle>
          Angebot in Rechnung umwandeln
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {invoiceDialog.quote && (
              <>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Das Angebot für <strong>{invoiceDialog.quote.customerName}</strong> über{' '}
                  <strong>€{invoiceDialog.quote.price.toFixed(2)}</strong> wird in eine Rechnung umgewandelt.
                </Alert>
                
                <TextField
                  fullWidth
                  label="Rechnungsnummer"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  sx={{ mb: 2 }}
                  required
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={sendInvoice}
                      onChange={(e) => setSendInvoice(e.target.checked)}
                    />
                  }
                  label="Rechnung direkt per E-Mail versenden"
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvoiceDialog({ open: false, quote: null })}>
            Abbrechen
          </Button>
          <Button 
            onClick={confirmConvertToInvoice} 
            variant="contained"
            disabled={!invoiceNumber}
          >
            Rechnung erstellen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Container>
  );
};

export default QuotesList;