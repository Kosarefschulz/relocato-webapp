import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Button, 
  Chip, 
  IconButton, 
  CircularProgress, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Divider
} from '@mui/material';
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
  Business as BusinessIcon,
  Home as HomeIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Invoice, Customer } from '../types';
import { CompanyType, COMPANY_CONFIGS } from '../types/company';
import { generateInvoicePDF } from '../services/pdfService';
import { generateWertvollInvoicePDF } from '../services/pdfServiceWertvoll';
import { sendEmail } from '../services/emailService';
import { databaseService as googleSheetsService } from '../config/database.config';

interface CustomerInvoicesProps {
  invoices: Invoice[];
  customer: Customer;
}

const CustomerInvoicesMultiCompany: React.FC<CustomerInvoicesProps> = ({ invoices, customer }) => {
  const [loadingPdf, setLoadingPdf] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyType>('relocato');
  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({
    totalPrice: 0,
    notes: '',
    items: []
  });

  const handleCompanyChange = (event: React.MouseEvent<HTMLElement>, newCompany: CompanyType | null) => {
    if (newCompany !== null) {
      setSelectedCompany(newCompany);
    }
  };

  const downloadPDF = async (invoice: Invoice, companyType?: CompanyType) => {
    try {
      setLoadingPdf(invoice.id || invoice.invoiceNumber);
      
      const company = companyType || invoice.company || 'relocato';
      const pdfBlob = company === 'wertvoll'
        ? await generateWertvollInvoicePDF(customer, invoice)
        : await generateInvoicePDF(customer, invoice);
      
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

  const sendInvoiceEmail = async (invoice: Invoice, companyType?: CompanyType) => {
    try {
      setSendingEmail(invoice.id || invoice.invoiceNumber);
      
      const company = companyType || invoice.company || 'relocato';
      const companyConfig = COMPANY_CONFIGS[company];
      const pdfBlob = company === 'wertvoll'
        ? await generateWertvollInvoicePDF(customer, invoice)
        : await generateInvoicePDF(customer, invoice);
      
      const emailData = {
        to: customer.email,
        subject: `Ihre Rechnung ${invoice.invoiceNumber} von ${companyConfig.name}`,
        content: `
          <h2>Sehr geehrte/r ${customer.name},</h2>
          <p>anbei erhalten Sie Ihre Rechnung.</p>
          <p><strong>Rechnungsnummer:</strong> ${invoice.invoiceNumber}</p>
          <p><strong>Gesamtbetrag:</strong> €${invoice.totalPrice.toFixed(2)}</p>
          <p><strong>Zahlungsziel:</strong> ${new Date(invoice.dueDate).toLocaleDateString('de-DE')}</p>
          <p>Bitte überweisen Sie den Betrag bis zum angegebenen Zahlungsziel auf folgendes Konto:</p>
          <p>
            <strong>${companyConfig.bank.name}</strong><br>
            IBAN: ${companyConfig.bank.iban}
          </p>
          <p>Mit freundlichen Grüßen<br>Ihr ${companyConfig.name} Team</p>
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
      await googleSheetsService.updateInvoiceStatus(invoice.id!, 'bezahlt');
      window.location.reload();
    } catch (error) {
      console.error('Update status error:', error);
      alert('Fehler beim Aktualisieren des Status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const createNewInvoice = async () => {
    try {
      const invoiceData: Invoice = {
        ...newInvoice as Invoice,
        customerId: customer.id,
        customerName: customer.name,
        invoiceNumber: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        createdAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'offen',
        company: selectedCompany
      };

      await googleSheetsService.createInvoice(invoiceData);
      setCreateDialogOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Create invoice error:', error);
      alert('Fehler beim Erstellen der Rechnung');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'bezahlt':
        return 'success';
      case 'überfällig':
        return 'error';
      case 'teilbezahlt':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getCompanyIcon = (company?: string) => {
    return company === 'wertvoll' ? <BusinessIcon fontSize="small" /> : <HomeIcon fontSize="small" />;
  };

  const getCompanyChip = (company?: string) => {
    const companyType = company || 'relocato';
    const config = COMPANY_CONFIGS[companyType as CompanyType];
    return (
      <Chip
        icon={getCompanyIcon(company)}
        label={config.name}
        size="small"
        variant="outlined"
        color={company === 'wertvoll' ? 'secondary' : 'primary'}
      />
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Rechnungen ({invoices.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          size="small"
        >
          Neue Rechnung
        </Button>
      </Box>

      <Grid container spacing={2}>
        {invoices.map((invoice, index) => (
          <Grid item xs={12} key={invoice.id || index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" component="div">
                        Rechnung #{invoice.invoiceNumber}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip
                          icon={<CalendarIcon />}
                          label={new Date(invoice.createdAt).toLocaleDateString('de-DE')}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          icon={invoice.status === 'bezahlt' ? <PaidIcon /> : <OverdueIcon />}
                          label={invoice.status}
                          size="small"
                          color={getStatusColor(invoice.status)}
                        />
                        {getCompanyChip(invoice.company)}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => downloadPDF(invoice)}
                        disabled={loadingPdf === (invoice.id || invoice.invoiceNumber)}
                      >
                        {loadingPdf === (invoice.id || invoice.invoiceNumber) ? (
                          <CircularProgress size={20} />
                        ) : (
                          <GetAppIcon />
                        )}
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => sendInvoiceEmail(invoice)}
                        disabled={sendingEmail === (invoice.id || invoice.invoiceNumber) || !customer.email}
                      >
                        {sendingEmail === (invoice.id || invoice.invoiceNumber) ? (
                          <CircularProgress size={20} />
                        ) : (
                          <EmailIcon />
                        )}
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setPreviewOpen(true);
                        }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Fällig bis: {new Date(invoice.dueDate).toLocaleDateString('de-DE')}
                      </Typography>
                      {invoice.notes && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {invoice.notes}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h5" color="primary">
                        €{invoice.totalPrice.toFixed(2)}
                      </Typography>
                      {invoice.status !== 'bezahlt' && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => markAsPaid(invoice)}
                          disabled={updatingStatus === (invoice.id || invoice.invoiceNumber)}
                          sx={{ mt: 1 }}
                        >
                          Als bezahlt markieren
                        </Button>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Create Invoice Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Neue Rechnung erstellen</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Company Selection */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Firma auswählen:
              </Typography>
              <ToggleButtonGroup
                value={selectedCompany}
                exclusive
                onChange={handleCompanyChange}
                aria-label="Firma auswählen"
                fullWidth
              >
                <ToggleButton value="relocato" aria-label="Relocato">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HomeIcon />
                    <Typography variant="body2">Relocato</Typography>
                  </Box>
                </ToggleButton>
                <ToggleButton value="wertvoll" aria-label="Wertvoll">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusinessIcon />
                    <Typography variant="body2">Wertvoll</Typography>
                  </Box>
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <TextField
              fullWidth
              label="Gesamtbetrag"
              type="number"
              value={newInvoice.totalPrice || 0}
              onChange={(e) => setNewInvoice({ ...newInvoice, totalPrice: Number(e.target.value) })}
              InputProps={{
                startAdornment: '€'
              }}
            />

            <TextField
              fullWidth
              label="Notizen"
              multiline
              rows={3}
              value={newInvoice.notes || ''}
              onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={createNewInvoice} variant="contained">
            Rechnung erstellen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      {selectedInvoice && (
        <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Rechnung #{selectedInvoice.invoiceNumber}
            <Box sx={{ mt: 1 }}>
              {getCompanyChip(selectedInvoice.company)}
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1">
                <strong>Kunde:</strong> {customer.name}
              </Typography>
              <Typography variant="body1">
                <strong>Rechnungsdatum:</strong> {new Date(selectedInvoice.createdAt).toLocaleDateString('de-DE')}
              </Typography>
              <Typography variant="body1">
                <strong>Fälligkeitsdatum:</strong> {new Date(selectedInvoice.dueDate).toLocaleDateString('de-DE')}
              </Typography>
              <Typography variant="body1">
                <strong>Status:</strong> {selectedInvoice.status}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6">
                Gesamtbetrag: €{selectedInvoice.totalPrice.toFixed(2)}
              </Typography>
              {selectedInvoice.notes && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body1">
                    <strong>Notizen:</strong> {selectedInvoice.notes}
                  </Typography>
                </>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewOpen(false)}>Schließen</Button>
            <Button
              variant="contained"
              startIcon={<GetAppIcon />}
              onClick={() => {
                setPreviewOpen(false);
                downloadPDF(selectedInvoice);
              }}
            >
              PDF herunterladen
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default CustomerInvoicesMultiCompany;