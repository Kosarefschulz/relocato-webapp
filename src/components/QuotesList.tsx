import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, IconButton, Button, Chip, Card, CardContent, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Divider, Snackbar, FormControlLabel, Switch, Checkbox, Tooltip, alpha, useTheme } from '@mui/material';
import Grid from './GridCompat';
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
  History as HistoryIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  IndeterminateCheckBox as IndeterminateCheckBoxIcon,
} from '@mui/icons-material';
import { Quote, Customer, Invoice } from '../types';
import { databaseService } from '../config/database.config';
import { generatePDF, generateInvoicePDF } from '../services/pdfService';
import { sendEmail } from '../services/emailService';
import { generateQuoteEmailHTMLSync } from '../services/quoteEmailTemplate';
import { tokenService } from '../services/tokenService';
import { motion } from 'framer-motion';
import QuoteVersionManager from './QuoteVersionManager';

const MotionCard = motion(Card);

const QuotesList: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  
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
  const [versionManagerOpen, setVersionManagerOpen] = useState(false);
  const [selectedQuoteForVersions, setSelectedQuoteForVersions] = useState<Quote | null>(null);
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [quotesData, customersData, invoicesData] = await Promise.all([
        databaseService.getQuotes(),
        databaseService.getCustomers(),
        databaseService.getInvoices()
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

  // Selection functions
  const toggleQuoteSelection = (quoteId: string) => {
    setSelectedQuotes(prev => {
      if (prev.includes(quoteId)) {
        return prev.filter(id => id !== quoteId);
      } else {
        return [...prev, quoteId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedQuotes.length === quotes.length) {
      setSelectedQuotes([]);
    } else {
      setSelectedQuotes(quotes.map(q => q.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedQuotes.length === 0) return;
    
    const confirmMessage = selectedQuotes.length === 1 
      ? 'Möchten Sie das ausgewählte Angebot wirklich löschen?'
      : `Möchten Sie die ${selectedQuotes.length} ausgewählten Angebote wirklich löschen?`;
    
    if (window.confirm(confirmMessage)) {
      try {
        let successCount = 0;
        let errorCount = 0;
        
        for (const quoteId of selectedQuotes) {
          try {
            await databaseService.deleteQuote(quoteId);
            successCount++;
          } catch (error) {
            errorCount++;
          }
        }
        
        // Update local state
        setQuotes(quotes.filter(q => !selectedQuotes.includes(q.id)));
        setSelectedQuotes([]);
        
        if (errorCount === 0) {
          setSnackbar({ 
            open: true, 
            message: `${successCount} Angebote erfolgreich gelöscht`, 
            severity: 'success' 
          });
        } else {
          setSnackbar({ 
            open: true, 
            message: `${successCount} gelöscht, ${errorCount} Fehler`, 
            severity: 'error' 
          });
        }
        
        if (successCount > 0) {
          setSelectMode(false);
        }
      } catch (error) {
        console.error('Fehler beim Löschen:', error);
        setSnackbar({ open: true, message: 'Fehler beim Löschen der Angebote', severity: 'error' });
      }
    }
  };

  const handleDeleteQuote = async (quoteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (window.confirm('Möchten Sie dieses Angebot wirklich löschen?')) {
      try {
        await databaseService.deleteQuote(quoteId);
        
        // Entferne das Angebot aus der lokalen Liste
        setQuotes(quotes.filter(q => q.id !== quoteId));
        setSnackbar({ open: true, message: 'Angebot erfolgreich gelöscht', severity: 'success' });
        
        // Lade die Angebote nach 1 Sekunde neu, um sicherzustellen, dass die Änderung persistiert wurde
        setTimeout(() => {
          loadData();
        }, 1000);
      } catch (error) {
        console.error('Fehler beim Löschen:', error);
        setSnackbar({ open: true, message: 'Fehler beim Löschen des Angebots', severity: 'error' });
        
        // Bei Fehler: Lade die Liste neu, um den korrekten Stand anzuzeigen
        loadData();
      }
    }
  };

  const handleDownloadPDF = async (quote: Quote) => {
    try {
      const customer = getCustomer(quote.customerId);
      if (!customer) {
        setSnackbar({ open: true, message: 'Kunde nicht gefunden', severity: 'error' });
        return;
      }

      await generatePDF(customer, quote);
      setSnackbar({ open: true, message: 'PDF wurde heruntergeladen', severity: 'success' });
    } catch (error) {
      console.error('PDF Error:', error);
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

      // Generate PDF first
      const pdfBlob = await generatePDF(customer, quote);
      
      // Generate or use existing confirmation token
      const token = quote.confirmationToken || tokenService.generateQuoteToken(quote);
      
      // Generate email with QR code and confirmation link
      const emailContent = generateQuoteEmailHTMLSync({
        customer,
        calculation: { finalPrice: quote.price } as any,
        quoteDetails: { volume: quote.volume || 0, distance: quote.distance || 0 },
        confirmationToken: token
      });
      
      // Send email
      const emailData = {
        to: customer.email,
        subject: `Ihr Umzugsangebot von Relocato`,
        content: emailContent,
        attachments: [{
          filename: `Angebot_${customer.name.replace(/\s+/g, '_')}.pdf`,
          content: pdfBlob
        }]
      };

      const sent = await sendEmail(emailData);
      
      if (sent) {
        // Update quote status to sent and save token if newly generated
        const updateData: any = { 
          status: 'sent',
          customerId: quote.customerId // Stelle sicher, dass customerId erhalten bleibt
        };
        if (!quote.confirmationToken) {
          updateData.confirmationToken = token;
        }
        await databaseService.updateQuote(quote.id, updateData);
        
        // Update local state immediately without reload
        setQuotes(prevQuotes => prevQuotes.map(q => 
          q.id === quote.id ? { ...q, status: 'sent' as const, confirmationToken: token } : q
        ));
        
        setSnackbar({ open: true, message: 'Angebot erfolgreich versendet. Sie können jetzt den Status aktualisieren.', severity: 'success' });
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
        createdAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 Tage Zahlungsziel
        status: 'sent'
      };

      await databaseService.addInvoice({...invoice, id: `INV-${Date.now()}`});

      // Update quote status
      await databaseService.updateQuote(quote.id, { status: 'invoiced' });
      setQuotes(quotes.map(q => q.id === quote.id ? { ...q, status: 'invoiced' as const } : q));

      // Send invoice if requested
      if (sendInvoice) {
        try {
          // Get the saved invoice with ID
          const invoices = await databaseService.getInvoices();
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
                <p>anbei erhalten Sie Ihre Rechnung für die Umzugsdienstleistung.</p>
                <p><strong>Rechnungsnummer:</strong> ${invoiceNumber}</p>
                <p><strong>Rechnungsbetrag:</strong> €${savedInvoice.totalPrice.toFixed(2)} (inkl. MwSt.)</p>
                <p><strong>Zahlungsziel:</strong> ${new Date(savedInvoice.dueDate).toLocaleDateString('de-DE')}</p>
                <p>Bitte überweisen Sie den Betrag unter Angabe der Rechnungsnummer auf unser Konto.</p>
                <p>Mit freundlichen Grüßen<br>Ihr Relocato Team</p>
              `,
              attachments: [{
                filename: `Rechnung_${invoiceNumber}.pdf`,
                content: pdfBlob
              }]
            };

            await sendEmail(emailData);
          }
        } catch (error) {
          console.error('Error sending invoice email:', error);
          // Don't fail the whole process if email fails
        }
      }

      setSnackbar({ open: true, message: `Rechnung ${invoiceNumber} wurde erstellt${sendInvoice ? ' und versendet' : ''}`, severity: 'success' });
      setInvoiceDialog({ open: false, quote: null });
      setSendInvoice(true);
    } catch (error) {
      console.error('Error creating invoice:', error);
      setSnackbar({ open: true, message: 'Fehler beim Erstellen der Rechnung', severity: 'error' });
    }
  };

  // Status helpers
  const getStatusIcon = (status: Quote['status']) => {
    switch (status) {
      case 'draft': return <DraftIcon />;
      case 'sent': return <SendIcon />;
      case 'accepted': return <CheckIcon />;
      case 'rejected': return <CancelIcon />;
      case 'invoiced': return <ReceiptIcon />;
      default: return null;
    }
  };

  const getStatusLabel = (status: Quote['status']) => {
    switch (status) {
      case 'draft': return 'Entwurf';
      case 'sent': return 'Versendet';
      case 'accepted': return 'Angenommen';
      case 'rejected': return 'Abgelehnt';
      case 'invoiced': return 'Abgerechnet';
      default: return status;
    }
  };

  const getStatusColor = (status: Quote['status']) => {
    switch (status) {
      case 'draft': return 'default';
      case 'sent': return 'primary';
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      case 'invoiced': return 'info';
      default: return 'default';
    }
  };

  // Statistics
  const totalQuotes = quotes.length;
  const totalValue = quotes.reduce((sum, q) => sum + q.price, 0);
  const acceptedQuotes = quotes.filter(q => q.status === 'accepted' || q.status === 'invoiced').length;
  const acceptanceRate = totalQuotes > 0 ? (acceptedQuotes / totalQuotes) * 100 : 0;

  // Sort quotes by status: accepted first, then rejected, then rest
  const sortedQuotes = [...quotes].sort((a, b) => {
    const statusOrder = {
      'accepted': 0,
      'invoiced': 1,
      'rejected': 2,
      'sent': 3,
      'draft': 4
    };
    
    const orderA = statusOrder[a.status as keyof typeof statusOrder] ?? 5;
    const orderB = statusOrder[b.status as keyof typeof statusOrder] ?? 5;
    
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    // If same status, sort by date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Get border color based on status
  const getBorderColor = (status: Quote['status']) => {
    switch (status) {
      case 'accepted':
      case 'invoiced':
        return theme.palette.success.main;
      case 'rejected':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[400];
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
              Angebote
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {!selectMode ? (
              <>
                <Button
                  variant="contained"
                  onClick={() => navigate('/search-customer')}
                  startIcon={<DraftIcon />}
                >
                  Neues Angebot
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CheckBoxIcon />}
                  onClick={() => {
                    setSelectMode(true);
                    setSelectedQuotes([]);
                  }}
                >
                  Auswählen
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSelectMode(false);
                    setSelectedQuotes([]);
                  }}
                >
                  Abbrechen
                </Button>
                <Button
                  variant="outlined"
                  startIcon={
                    selectedQuotes.length === quotes.length && quotes.length > 0
                      ? <CheckBoxIcon />
                      : selectedQuotes.length > 0
                      ? <IndeterminateCheckBoxIcon />
                      : <CheckBoxOutlineBlankIcon />
                  }
                  onClick={handleSelectAll}
                >
                  {selectedQuotes.length === quotes.length && quotes.length > 0
                    ? 'Alle abwählen'
                    : 'Alle auswählen'}
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteSelected}
                  disabled={selectedQuotes.length === 0}
                >
                  {selectedQuotes.length > 0 
                    ? `${selectedQuotes.length} löschen`
                    : 'Löschen'}
                </Button>
              </>
            )}
          </Box>
        </Box>
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
        {sortedQuotes.map((quote, index) => {
          // Check if we need to show a status group header
          const showStatusHeader = index === 0 || sortedQuotes[index - 1].status !== quote.status;
          const statusGroupTitle = quote.status === 'accepted' || quote.status === 'invoiced' 
            ? '✅ Angenommene Angebote'
            : quote.status === 'rejected'
            ? '❌ Abgelehnte Angebote'
            : '📋 Offene Angebote';
          
          return (
            <React.Fragment key={quote.id}>
              {showStatusHeader && (
                <Grid item xs={12}>
                  <Box sx={{ 
                    mt: index === 0 ? 0 : 3, 
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: getBorderColor(quote.status)
                      }}
                    >
                      {statusGroupTitle}
                    </Typography>
                    <Divider sx={{ flex: 1 }} />
                  </Box>
                </Grid>
              )}
              <Grid item xs={12}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.01 }}
              onClick={() => {
                if (selectMode) {
                  toggleQuoteSelection(quote.id);
                }
              }}
              sx={{
                cursor: selectMode ? 'pointer' : 'default',
                border: selectMode && selectedQuotes.includes(quote.id) 
                  ? `3px solid ${theme.palette.primary.main}` 
                  : `2px solid ${getBorderColor(quote.status)}`,
                boxShadow: quote.status === 'accepted' || quote.status === 'invoiced' 
                  ? `0 0 8px ${alpha(theme.palette.success.main, 0.3)}`
                  : quote.status === 'rejected'
                  ? `0 0 8px ${alpha(theme.palette.error.main, 0.3)}`
                  : 'none',
                transition: 'all 0.3s ease',
              }}
            >
              <CardContent>
                <Grid container spacing={2}>
                  {/* Checkbox in select mode */}
                  {selectMode && (
                    <Grid item xs="auto">
                      <Checkbox
                        checked={selectedQuotes.includes(quote.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleQuoteSelection(quote.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        color="primary"
                      />
                    </Grid>
                  )}
                  
                  {/* Left side - Customer info */}
                  <Grid item xs={12} md={selectMode ? 7 : 8}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {quote.customerName}
                      </Typography>
                      <Chip
                        icon={getStatusIcon(quote.status) || undefined}
                        label={getStatusLabel(quote.status)}
                        color={getStatusColor(quote.status) as any}
                        size="small"
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 3, mb: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>ID:</strong> {quote.id}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Datum:</strong> {new Date(quote.createdAt).toLocaleDateString('de-DE')}
                      </Typography>
                    </Box>
                    
                    {quote.comment && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          mt: 1,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {quote.comment}
                      </Typography>
                    )}
                  </Grid>
                  
                  {/* Right side - Price */}
                  <Grid item xs={12} md={4}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: { xs: 'flex-start', md: 'flex-end' },
                      height: '100%'
                    }}>
                      <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold', mb: 2 }}>
                        €{quote.price.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Actions */}
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {/* Status ändern Buttons */}
                        {quote.status === 'draft' && (
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            startIcon={<EmailIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendEmail(quote);
                            }}
                          >
                            Angebot versenden
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
                              await databaseService.updateQuote(quote.id, { status: 'accepted' });
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
                              await databaseService.updateQuote(quote.id, { status: 'rejected' });
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
                      </Box>
                      
                      {/* Action Icons */}
                      <Box sx={{ display: 'flex', gap: 1 }}>
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
                    
                    {quote.status === 'accepted' && !invoices.find(inv => inv.quoteId === quote.id) && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="info"
                        startIcon={<ReceiptIcon />}
                        onClick={() => handleConvertToInvoice(quote)}
                      >
                        Rechnung erstellen
                      </Button>
                    )}
                    
                    <IconButton
                      size="small"
                      color="secondary"
                      title="Versionen verwalten"
                      onClick={() => {
                        setSelectedQuoteForVersions(quote);
                        setVersionManagerOpen(true);
                      }}
                    >
                      <HistoryIcon />
                    </IconButton>
                    
                    {!selectMode && (
                      <Tooltip title="Angebot löschen">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => handleDeleteQuote(quote.id, e)}
                          sx={{
                            backgroundColor: alpha(theme.palette.error.main, 0.08),
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.error.main, 0.16),
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </MotionCard>
              </Grid>
            </React.Fragment>
          );
        })}
      </Grid>

      {/* Invoice Dialog */}
      <Dialog open={invoiceDialog.open} onClose={() => setInvoiceDialog({ open: false, quote: null })}>
        <DialogTitle>Rechnung erstellen</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Rechnungsnummer"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={sendInvoice}
                  onChange={(e) => setSendInvoice(e.target.checked)}
                />
              }
              label="Rechnung per E-Mail senden"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvoiceDialog({ open: false, quote: null })}>
            Abbrechen
          </Button>
          <Button onClick={confirmConvertToInvoice} variant="contained" color="primary">
            Rechnung erstellen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Version Manager */}
      <QuoteVersionManager
        open={versionManagerOpen}
        onClose={() => {
          setVersionManagerOpen(false);
          setSelectedQuoteForVersions(null);
        }}
        quote={selectedQuoteForVersions!}
        onVersionChange={(version: any) => {
          // Handle version restore logic here
          console.log('Restoring version:', version);
        }}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Container>
  );
};

export default QuotesList;