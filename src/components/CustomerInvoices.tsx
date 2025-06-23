import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, Button, Chip, IconButton, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import Grid from './GridCompat';
import {
  Receipt as ReceiptIcon,
  GetApp as GetAppIcon,
  Email as EmailIcon,
  Visibility as VisibilityIcon,
  Euro as EuroIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as PaidIcon,
  Warning as OverdueIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Invoice, Customer, Quote } from '../types';
import { generateInvoicePDF } from '../services/pdfService';
import { sendEmail } from '../services/emailService';
import { databaseService as googleSheetsService } from '../config/database.config';

interface CustomerInvoicesProps {
  invoices: Invoice[];
  customer: Customer;
  quotes?: Quote[];
}

const CustomerInvoices: React.FC<CustomerInvoicesProps> = ({ invoices, customer, quotes = [] }) => {
  const [loadingPdf, setLoadingPdf] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const getPaymentInfo = (invoice: Invoice) => {
    const quote = quotes.find(q => q.id === invoice.quoteId);
    return quote?.paymentInfo;
  };

  const downloadPDF = async (invoice: Invoice) => {
    try {
      setLoadingPdf(invoice.id || invoice.invoiceNumber);
      
      const paymentInfo = getPaymentInfo(invoice);
      const pdfBlob = await generateInvoicePDF(customer, invoice, paymentInfo);
      const url = URL.createObjectURL(pdfBlob);
      const fileName = `Rechnung_${invoice.invoiceNumber}_${customer.name.replace(/\s+/g, '_')}.pdf`;
      
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        window.open(url, '_blank');
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('PDF Download Error:', error);
      alert('Fehler beim PDF-Download');
    } finally {
      setLoadingPdf(null);
    }
  };

  const sendInvoiceEmail = async (invoice: Invoice) => {
    try {
      setSendingEmail(invoice.id || invoice.invoiceNumber);
      
      const paymentInfo = getPaymentInfo(invoice);
      const pdfBlob = await generateInvoicePDF(customer, invoice, paymentInfo);
      const emailData = {
        to: customer.email,
        subject: `Ihre Rechnung ${invoice.invoiceNumber} von Relocato`,
        content: `
          <h2>Sehr geehrte/r ${customer.name},</h2>
          <p>anbei erhalten Sie Ihre Rechnung.</p>
          <p><strong>Rechnungsnummer:</strong> ${invoice.invoiceNumber}</p>
          <p><strong>Gesamtbetrag:</strong> €${invoice.totalPrice.toFixed(2)}</p>
          <p><strong>Zahlungsziel:</strong> ${new Date(invoice.dueDate).toLocaleDateString('de-DE')}</p>
          <p>Bitte überweisen Sie den Betrag bis zum angegebenen Zahlungsziel.</p>
          <p>Mit freundlichen Grüßen<br>Ihr Relocato Team</p>
        `,
        attachments: [{
          filename: `Rechnung_${invoice.invoiceNumber}.pdf`,
          content: pdfBlob
        }]
      };

      const sent = await sendEmail(emailData);
      if (sent) {
        alert('Rechnung erfolgreich versendet');
      } else {
        alert('Fehler beim E-Mail-Versand');
      }
    } catch (error) {
      console.error('Email Error:', error);
      alert('Fehler beim E-Mail-Versand');
    } finally {
      setSendingEmail(null);
    }
  };

  const markAsPaid = async (invoice: Invoice) => {
    try {
      setUpdatingStatus(invoice.id || invoice.invoiceNumber);
      await googleSheetsService.updateInvoice(invoice.id!, { ...invoice, status: 'paid' });
      window.location.reload();
    } catch (error) {
      console.error('Error updating invoice:', error);
      alert('Fehler beim Aktualisieren');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'sent': return 'primary';
      case 'paid': return 'success';
      case 'overdue': return 'error';
      case 'cancelled': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Entwurf';
      case 'sent': return 'Versendet';
      case 'paid': return 'Bezahlt';
      case 'overdue': return 'Überfällig';
      case 'cancelled': return 'Storniert';
      default: return status;
    }
  };

  const isOverdue = (invoice: Invoice) => {
    return invoice.status === 'sent' && new Date() > new Date(invoice.dueDate);
  };

  if (invoices.length === 0) {
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
          <ReceiptIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        </motion.div>
        <Typography variant="h6" color="text.secondary">
          Noch keine Rechnungen erstellt
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {invoices.map((invoice, index) => (
        <Grid item xs={12} key={invoice.id}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Rechnung {invoice.invoiceNumber}
                      </Typography>
                      <Chip 
                        label={getStatusLabel(invoice.status)}
                        color={getStatusColor(invoice.status) as any}
                        size="small"
                        icon={invoice.status === 'paid' ? <PaidIcon /> : isOverdue(invoice) ? <OverdueIcon /> : undefined}
                      />
                      {(() => {
                        const paymentInfo = getPaymentInfo(invoice);
                        if (paymentInfo && (paymentInfo.status === 'paid' || paymentInfo.status === 'paid_on_site')) {
                          return (
                            <Chip
                              size="small"
                              icon={<EuroIcon />}
                              label={
                                paymentInfo.method === 'ec_card' ? 'EC-Karte' :
                                paymentInfo.method === 'cash' ? 'Bargeld' :
                                paymentInfo.method === 'bank_transfer' ? 'Überweisung' :
                                'PayPal'
                              }
                              color="success"
                              variant="outlined"
                            />
                          );
                        }
                        return null;
                      })()}
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 3, mb: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body2" color="text.secondary">
                        <CalendarIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                        Erstellt: {new Date(invoice.createdAt).toLocaleDateString('de-DE')}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color={isOverdue(invoice) ? 'error' : 'text.secondary'}
                        sx={{ fontWeight: isOverdue(invoice) ? 'bold' : 'normal' }}
                      >
                        <CalendarIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                        Fällig: {new Date(invoice.dueDate).toLocaleDateString('de-DE')}
                      </Typography>
                    </Box>

                    {invoice.quoteId && (
                      <Typography variant="body2" color="text.secondary">
                        Angebot: {invoice.quoteId}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h5" color="success.main" sx={{ fontWeight: 'bold' }}>
                      €{invoice.totalPrice.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      inkl. MwSt.
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<VisibilityIcon />}
                    onClick={() => {
                      setSelectedInvoice(invoice);
                      setPreviewOpen(true);
                    }}
                  >
                    Ansehen
                  </Button>
                  
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={loadingPdf === (invoice.id || invoice.invoiceNumber) ? <CircularProgress size={16} /> : <GetAppIcon />}
                    onClick={() => downloadPDF(invoice)}
                    disabled={loadingPdf === (invoice.id || invoice.invoiceNumber)}
                  >
                    PDF
                  </Button>
                  
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={sendingEmail === (invoice.id || invoice.invoiceNumber) ? <CircularProgress size={16} /> : <EmailIcon />}
                    onClick={() => sendInvoiceEmail(invoice)}
                    disabled={sendingEmail === (invoice.id || invoice.invoiceNumber)}
                  >
                    Senden
                  </Button>
                  
                  {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={updatingStatus === (invoice.id || invoice.invoiceNumber) ? <CircularProgress size={16} /> : <PaidIcon />}
                      onClick={() => markAsPaid(invoice)}
                      disabled={updatingStatus === (invoice.id || invoice.invoiceNumber)}
                    >
                      Als bezahlt markieren
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      ))}

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Rechnung {selectedInvoice?.invoiceNumber}</Typography>
            <IconButton onClick={() => setPreviewOpen(false)} size="small">
              ×
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Rechnungsnummer</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{selectedInvoice.invoiceNumber}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip 
                    label={getStatusLabel(selectedInvoice.status)}
                    color={getStatusColor(selectedInvoice.status) as any}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Erstellungsdatum</Typography>
                  <Typography variant="body1">{new Date(selectedInvoice.createdAt).toLocaleDateString('de-DE')}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Fälligkeitsdatum</Typography>
                  <Typography variant="body1" color={isOverdue(selectedInvoice) ? 'error' : 'text.primary'}>
                    {new Date(selectedInvoice.dueDate).toLocaleDateString('de-DE')}
                  </Typography>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>Positionen</Typography>
                {selectedInvoice.items?.map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">{item.description}</Typography>
                    <Typography variant="body2">€{(item.totalPrice || 0).toFixed(2)}</Typography>
                  </Box>
                ))}
                <Box sx={{ borderTop: 1, borderColor: 'divider', mt: 2, pt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Netto</Typography>
                    <Typography variant="body2">€{(selectedInvoice.price || 0).toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">MwSt. (19%)</Typography>
                    <Typography variant="body2">€{(selectedInvoice.taxAmount || 0).toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                    <Typography variant="body1">Gesamt</Typography>
                    <Typography variant="body1" color="success.main">€{selectedInvoice.totalPrice.toFixed(2)}</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Schließen</Button>
          {selectedInvoice && (
            <Button
              variant="contained"
              startIcon={<GetAppIcon />}
              onClick={() => {
                downloadPDF(selectedInvoice);
                setPreviewOpen(false);
              }}
            >
              PDF herunterladen
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default CustomerInvoices;