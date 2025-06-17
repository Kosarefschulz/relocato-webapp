import React, { useState, Fragment } from 'react';
import { Card, CardContent, Typography, Button, Chip, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, FormControlLabel, Switch } from '@mui/material';
import Box from '@mui/material/Box';
import Grid from './GridCompat';
import {
  Description as DescriptionIcon,
  Add as AddIcon,
  PictureAsPdf as PdfIcon,
  Email as EmailIcon,
  Visibility as VisibilityIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Send as SendIcon,
  History as HistoryIcon,
  Draw as DrawIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Quote, Customer, Invoice } from '../types';
import { generatePDF, generateInvoicePDF, generatePDFWithSignature } from '../services/pdfService';
import { sendEmailViaSMTP } from '../services/smtpEmailService';
import { databaseService as googleSheetsService } from '../config/database.config';
import { useAnalytics } from '../hooks/useAnalytics';
import QuoteVersionManager from './QuoteVersionManager';
import SignatureModal from './SignatureModal';
import { SignatureData } from '../services/pdfSignatureService';
import EmailComposer from './EmailComposer';

interface CustomerQuotesProps {
  quotes: Quote[];
  customer: Customer;
  onTabChange: (tabIndex: number) => void;
}

const CustomerQuotes: React.FC<CustomerQuotesProps> = ({ quotes, customer, onTabChange }) => {
  const navigate = useNavigate();
  const analytics = useAnalytics();
  const [loadingPdf, setLoadingPdf] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [convertingQuote, setConvertingQuote] = useState<Quote | null>(null);
  const [sendInvoice, setSendInvoice] = useState(true);
  const [converting, setConverting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [versionManagerOpen, setVersionManagerOpen] = useState(false);
  const [selectedQuoteForVersions, setSelectedQuoteForVersions] = useState<Quote | null>(null);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [quoteForSignature, setQuoteForSignature] = useState<Quote | null>(null);
  const [signatureAction, setSignatureAction] = useState<'download' | 'email' | null>(null);
  const [emailComposerOpen, setEmailComposerOpen] = useState(false);
  const [quoteForEmail, setQuoteForEmail] = useState<Quote | null>(null);

  const downloadPDF = async (quote: Quote, signatureData?: SignatureData) => {
    try {
      setLoadingPdf(quote.id);
      console.log('📄 Erstelle PDF für Angebot:', quote.id);
      
      // Erstelle QuoteData aus dem Quote-Objekt
      const quoteData = {
        customerId: customer.id || 'temp-id',
        customerName: customer.name || 'Unbekannt',
        price: quote.price || 0,
        comment: quote.comment || '',
        createdAt: quote.createdAt || new Date(),
        createdBy: quote.createdBy || 'system',
        status: quote.status || 'draft',
        volume: quote.volume || 50,
        distance: quote.distance || 25
      };
      
      // Generiere PDF mit oder ohne digitale Unterschrift
      const pdfBlob = signatureData 
        ? await generatePDFWithSignature(customer, quoteData, signatureData)
        : await generatePDF(customer, quoteData);
        
      console.log('✅ PDF erstellt, Größe:', pdfBlob.size, 'bytes');
      
      // Analytics: PDF Export
      analytics.trackPDFExport('quote', quote.id);
      
      // Download/Öffnen
      const url = URL.createObjectURL(pdfBlob);
      const fileName = `Umzugsangebot_${(customer.name || 'Kunde').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}${signatureData ? '_signiert' : ''}.pdf`;
      
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        // iOS: Öffne in neuem Tab
        window.open(url, '_blank');
      } else {
        // Desktop: Download
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      
      // Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
    } catch (error) {
      console.error('❌ PDF Download Error:', error);
      alert('Fehler beim Erstellen der PDF. Bitte versuchen Sie es erneut.');
    } finally {
      setLoadingPdf(null);
    }
  };

  const handleSignatureRequest = (quote: Quote, action: 'download' | 'email') => {
    setQuoteForSignature(quote);
    setSignatureAction(action);
    setSignatureModalOpen(true);
  };

  const handleSignatureComplete = async (signatureData: SignatureData) => {
    if (!quoteForSignature) return;
    
    setSignatureModalOpen(false);
    
    if (signatureAction === 'download') {
      await downloadPDF(quoteForSignature, signatureData);
    } else if (signatureAction === 'email') {
      // Email mit digitaler Unterschrift wird später implementiert
      console.log('Email mit digitaler Unterschrift noch nicht implementiert');
    }
    
    setQuoteForSignature(null);
    setSignatureAction(null);
  };

  if (quotes.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <motion.div
          animate={{ 
            y: [0, -10, 0],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <DescriptionIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        </motion.div>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Noch keine Angebote erstellt
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate(`/create-quote/${customer.id}`, { state: { customer } })}
          sx={{ mt: 2 }}
          size="large"
        >
          Erstes Angebot erstellen
        </Button>
      </Box>
    );
  }

  return (
    <>
      <Grid container spacing={2}>
      {quotes.map((quote, index) => {
        // Debug: Log quote status
        console.log(`Quote ${quote.id} status:`, quote.status, 'Type:', typeof quote.status);
        console.log(`Quote ${quote.id} full data:`, quote);
        
        return (
        <Grid item xs={12} md={6} key={quote.id}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: (theme) => theme.shadows[8]
                }
              }}
              onClick={() => {
                console.log('Angebot anklicken:', quote.id);
              }}
            >
              <CardContent>
                <Fragment>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Angebot #{quote.id}
                  </Typography>
                  <Chip 
                    label={quote.status === 'draft' ? 'Entwurf' : quote.status === 'sent' ? 'Gesendet' : quote.status === 'accepted' ? 'Angenommen' : quote.status === 'rejected' ? 'Abgelehnt' : 'In Rechnung gestellt'}
                    color={quote.status === 'accepted' ? 'success' : quote.status === 'sent' ? 'warning' : quote.status === 'rejected' ? 'error' : 'default'}
                    size="small"
                  />
                </Box>
                
                <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                  €{quote.price.toFixed(2)}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Erstellt am {quote.createdAt.toLocaleDateString('de-DE')}
                </Typography>
                
                {quote.comment && (
                  <Typography variant="body2" sx={{ 
                    mb: 2,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {quote.comment}
                  </Typography>
                )}
                {/* @ts-ignore - MUI v7 TypeScript issue */}
                <Box component="div" sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<VisibilityIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedQuote(quote);
                      setPreviewOpen(true);
                    }}
                  >
                    Ansehen
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={loadingPdf === quote.id ? <CircularProgress size={16} /> : <PdfIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadPDF(quote);
                    }}
                    disabled={loadingPdf === quote.id}
                  >
                    {loadingPdf === quote.id ? 'Erstelle...' : 'PDF'}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DrawIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSignatureRequest(quote, 'download');
                    }}
                    disabled={loadingPdf === quote.id}
                  >
                    Signieren
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EmailIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuoteForEmail(quote);
                      setEmailComposerOpen(true);
                    }}
                  >
                    Email
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<HistoryIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedQuoteForVersions(quote);
                      setVersionManagerOpen(true);
                    }}
                  >
                    Versionen
                  </Button>
                  
                  {/* Status ändern Buttons */}
                  {console.log(`Checking quote status "${quote.status}"`)}
                  {quote.status === 'draft' && (
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      startIcon={updatingStatus === quote.id ? <CircularProgress size={16} /> : <EmailIcon />}
                      onClick={async (e) => {
                        e.stopPropagation();
                        setUpdatingStatus(quote.id);
                        try {
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
                            }],
                            customerId: customer.id,
                            customerName: customer.name,
                            templateType: 'quote_sent'
                          };
                          
                          const sent = await sendEmailViaSMTP(emailData);
                          if (sent) {
                            // Update quote status to sent
                            await googleSheetsService.updateQuote(quote.id, { status: 'sent' });
                            alert('Angebot erfolgreich versendet!');
                            window.location.reload();
                          } else {
                            alert('Fehler beim E-Mail-Versand');
                          }
                        } catch (error) {
                          console.error('Email Error:', error);
                          alert('Fehler beim E-Mail-Versand');
                        } finally {
                          setUpdatingStatus(null);
                        }
                      }}
                      disabled={updatingStatus === quote.id}
                    >
                      Angebot versenden
                    </Button>
                  )}
                  {quote.status === 'sent' && (
                    <>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={updatingStatus === quote.id ? <CircularProgress size={16} /> : <CheckCircleIcon />}
                        onClick={async (e) => {
                          e.stopPropagation();
                          setUpdatingStatus(quote.id);
                          try {
                            await googleSheetsService.updateQuote(quote.id, { ...quote, status: 'accepted' });
                            window.location.reload(); // Reload to refresh data
                          } catch (error) {
                            console.error('Error updating quote status:', error);
                            alert('Fehler beim Aktualisieren des Status');
                          } finally {
                            setUpdatingStatus(null);
                          }
                        }}
                        disabled={updatingStatus === quote.id}
                      >
                        Als angenommen markieren
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={async (e) => {
                          e.stopPropagation();
                          setUpdatingStatus(quote.id);
                          try {
                            await googleSheetsService.updateQuote(quote.id, { ...quote, status: 'rejected' });
                            window.location.reload(); // Reload to refresh data
                          } catch (error) {
                            console.error('Error updating quote status:', error);
                            alert('Fehler beim Aktualisieren des Status');
                          } finally {
                            setUpdatingStatus(null);
                          }
                        }}
                        disabled={updatingStatus === quote.id}
                      >
                        Als abgelehnt markieren
                      </Button>
                    </>
                  )}
                  
                  {quote.status === 'accepted' && (
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<ReceiptIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setConvertingQuote(quote);
                        setConvertDialogOpen(true);
                      }}
                    >
                      Rechnung
                    </Button>
                  )}
                </Box>
                </Fragment>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
        );
      })}
      
      {/* Add New Quote Card */}
      <Grid item xs={12} md={6}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: quotes.length * 0.1 }}
        >
          <Card
            sx={{
              height: '100%',
              cursor: 'pointer',
              border: (theme) => `2px dashed ${theme.palette.primary.main}`,
              backgroundColor: (theme) => theme.palette.primary.main + '05',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 200,
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: (theme) => theme.palette.primary.main + '0A',
                transform: 'translateY(-2px)'
              }
            }}
            onClick={() => navigate(`/create-quote/${customer.id}`, { state: { customer } })}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <AddIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                Neues Angebot erstellen
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>
    </Grid>

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Angebot #{selectedQuote?.id}</Typography>
            <IconButton onClick={() => setPreviewOpen(false)} size="small">
              ×
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedQuote && (
            <Box>
              <Typography variant="h4" color="primary" gutterBottom>
                €{selectedQuote.price.toFixed(2)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Status:</strong> {selectedQuote.status}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Erstellt am:</strong> {selectedQuote.createdAt.toLocaleDateString('de-DE')}
              </Typography>
              {selectedQuote.volume && (
                <Typography variant="body1" gutterBottom>
                  <strong>Volumen:</strong> {selectedQuote.volume} m³
                </Typography>
              )}
              {selectedQuote.distance && (
                <Typography variant="body1" gutterBottom>
                  <strong>Entfernung:</strong> {selectedQuote.distance} km
                </Typography>
              )}
              {selectedQuote.comment && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>Kommentar:</Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedQuote.comment}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Schließen</Button>
          {selectedQuote && (
            <Button
              variant="contained"
              startIcon={<PdfIcon />}
              onClick={() => {
                downloadPDF(selectedQuote);
                setPreviewOpen(false);
              }}
            >
              PDF herunterladen
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Convert to Invoice Dialog */}
      <Dialog
        open={convertDialogOpen}
        onClose={() => setConvertDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Angebot in Rechnung umwandeln</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Möchten Sie das Angebot #{convertingQuote?.id} in eine Rechnung umwandeln?
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Preis: €{convertingQuote?.price.toFixed(2)}
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={sendInvoice}
                onChange={(e) => setSendInvoice(e.target.checked)}
              />
            }
            label="Rechnung per E-Mail senden"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConvertDialogOpen(false)} disabled={converting}>
            Abbrechen
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={async () => {
              if (!convertingQuote) return;
              
              setConverting(true);
              try {
                // Create invoice
                const invoiceNumber = `R${Date.now().toString().slice(-6)}`;
                const newInvoice: Invoice = {
                  id: invoiceNumber,
                  customerId: customer.id || '',
                  customerName: customer.name,
                  quoteId: convertingQuote.id,
                  price: convertingQuote.price,
                  taxAmount: convertingQuote.price * 0.19,
                  totalPrice: convertingQuote.price * 1.19,
                  items: [{
                    description: 'Umzugsdienstleistung',
                    quantity: 1,
                    unitPrice: convertingQuote.price,
                    totalPrice: convertingQuote.price
                  }],
                  invoiceNumber: invoiceNumber,
                  createdAt: new Date(),
                  dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
                  status: 'sent' as const
                };

                // Save invoice
                await googleSheetsService.addInvoice(newInvoice);
                const savedInvoice = newInvoice;

                // Send invoice if requested
                if (sendInvoice && customer.email) {
                  const pdfBlob = await generateInvoicePDF(customer, savedInvoice);
                  const emailData = {
                    to: customer.email,
                    subject: `Ihre Rechnung ${invoiceNumber} von Relocato`,
                    content: `Sehr geehrte/r ${customer.name},\n\nanbei erhalten Sie Ihre Rechnung ${invoiceNumber} über €${convertingQuote.price.toFixed(2)}.\n\nZahlungsziel: 14 Tage\n\nVielen Dank für Ihr Vertrauen!\n\nMit freundlichen Grüßen\nIhr Relocato Team`,
                    attachments: [{
                      filename: `Rechnung_${invoiceNumber}_${customer.name.replace(/\s+/g, '_')}.pdf`,
                      content: pdfBlob
                    }],
                    customerId: customer.id,
                    customerName: customer.name,
                    templateType: 'invoice'
                  };
                  await sendEmailViaSMTP(emailData);
                }

                alert(`Rechnung ${invoiceNumber} wurde erfolgreich erstellt${sendInvoice ? ' und versendet' : ''}!`);
                setConvertDialogOpen(false);
                onTabChange(3); // Switch to invoices tab
              } catch (error) {
                console.error('Error converting quote to invoice:', error);
                alert('Fehler beim Erstellen der Rechnung');
              } finally {
                setConverting(false);
              }
            }}
            disabled={converting}
            startIcon={converting ? <CircularProgress size={16} /> : <ReceiptIcon />}
          >
            {converting ? 'Erstelle Rechnung...' : 'Rechnung erstellen'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quote Version Manager */}
      {selectedQuoteForVersions && (
        <QuoteVersionManager
          open={versionManagerOpen}
          onClose={() => {
            setVersionManagerOpen(false);
            setSelectedQuoteForVersions(null);
          }}
          quote={selectedQuoteForVersions}
          onVersionChange={(newVersion) => {
            // Reload to show the new version
            window.location.reload();
          }}
        />
      )}

      {/* Digital Signature Modal */}
      {quoteForSignature && (
        <SignatureModal
          open={signatureModalOpen}
          onClose={() => {
            setSignatureModalOpen(false);
            setQuoteForSignature(null);
            setSignatureAction(null);
          }}
          onSign={handleSignatureComplete}
          documentName={`Angebot ${quoteForSignature.id}`}
          signerType="customer"
        />
      )}

      {/* Email Composer */}
      {quoteForEmail && (
        <EmailComposer
          open={emailComposerOpen}
          onClose={() => {
            setEmailComposerOpen(false);
            setQuoteForEmail(null);
          }}
          customer={customer}
          quote={quoteForEmail}
          onEmailSent={async () => {
            // Update quote status to sent
            await googleSheetsService.updateQuote(quoteForEmail.id, { status: 'sent' });
            
            // Analytics: Quote sent
            analytics.trackQuoteSent(quoteForEmail.id, quoteForEmail.price);
            analytics.trackEmailSent('quote', customer.id);
            
            window.location.reload();
          }}
        />
      )}

    </>
  );
};

export default CustomerQuotes;