import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Stack,
  Tooltip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import Grid from './GridCompat';
import {
  Email as EmailIcon,
  AttachFile as AttachFileIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Euro as EuroIcon,
  AccountBalance as BankIcon,
  Assignment as AssignIcon,
  Close as CloseIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  invoiceRecognitionService, 
  EmailInvoice 
} from '../services/invoiceRecognitionService';
import { motion } from 'framer-motion';

const MotionCard = motion(Card);

interface ProcessDialogData {
  emailInvoice: EmailInvoice;
  targetAccount: 'steinpfleger' | 'wertvoll';
  invoiceNumber: string;
  amount: number;
  notes: string;
}

const UnprocessedEmailInvoices: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [unprocessedInvoices, setUnprocessedInvoices] = useState<EmailInvoice[]>([]);
  const [processDialog, setProcessDialog] = useState(false);
  const [processingData, setProcessingData] = useState<ProcessDialogData | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadUnprocessedInvoices();
  }, []);

  const loadUnprocessedInvoices = async () => {
    setLoading(true);
    try {
      const invoices = await invoiceRecognitionService.getUnprocessedInvoices();
      setUnprocessedInvoices(invoices);
    } catch (error) {
      console.error('Error loading unprocessed invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProcessDialog = (invoice: EmailInvoice) => {
    setProcessingData({
      emailInvoice: invoice,
      targetAccount: invoice.recognizedCompany === 'unknown' || !invoice.recognizedCompany ? 'wertvoll' : invoice.recognizedCompany,
      invoiceNumber: invoice.invoiceNumber || '',
      amount: invoice.amount || 0,
      notes: ''
    });
    setProcessDialog(true);
  };

  const handleProcessInvoice = async () => {
    if (!processingData) return;

    setProcessing(true);
    try {
      // Mark as processed
      await invoiceRecognitionService.markAsProcessed(
        processingData.emailInvoice.id,
        processingData.notes
      );

      // TODO: Create actual invoice in the system
      console.log('Creating invoice:', {
        account: processingData.targetAccount,
        invoiceNumber: processingData.invoiceNumber,
        amount: processingData.amount
      });

      // Reload list
      await loadUnprocessedInvoices();
      setProcessDialog(false);
      setProcessingData(null);
    } catch (error) {
      console.error('Error processing invoice:', error);
      alert('Fehler beim Verarbeiten der Rechnung');
    } finally {
      setProcessing(false);
    }
  };

  const getAccountColor = (account: string) => {
    switch (account) {
      case 'steinpfleger': return 'primary';
      case 'wertvoll': return 'secondary';
      default: return 'default';
    }
  };

  const getAccountLabel = (account: string) => {
    switch (account) {
      case 'steinpfleger': return 'Steinpfleger';
      case 'wertvoll': return 'Wertvoll';
      default: return 'Unbekannt';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (unprocessedInvoices.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Keine unverarbeiteten E-Mail-Rechnungen vorhanden
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Unverarbeitete E-Mail-Rechnungen ({unprocessedInvoices.length})
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Datum</TableCell>
              <TableCell>Absender</TableCell>
              <TableCell>Betreff</TableCell>
              <TableCell>Erkanntes Konto</TableCell>
              <TableCell align="right">Betrag</TableCell>
              <TableCell align="center">Anhänge</TableCell>
              <TableCell align="center">Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {unprocessedInvoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  {format(invoice.receivedDate, 'dd.MM.yyyy', { locale: de })}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                    {invoice.sender}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                    {invoice.subject}
                  </Typography>
                  {invoice.invoiceNumber && (
                    <Typography variant="caption" color="text.secondary">
                      Rechnungsnr.: {invoice.invoiceNumber}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={getAccountLabel(invoice.recognizedCompany || 'unknown')}
                    color={getAccountColor(invoice.recognizedCompany || 'unknown')}
                    size="small"
                    icon={<BankIcon />}
                  />
                </TableCell>
                <TableCell align="right">
                  {invoice.amount ? (
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      €{invoice.amount.toFixed(2)}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      -
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="center">
                  {invoice.attachments.length > 0 && (
                    <Tooltip title={invoice.attachments.map(a => a.filename).join(', ')}>
                      <Chip
                        icon={<AttachFileIcon />}
                        label={invoice.attachments.length}
                        size="small"
                        variant="outlined"
                      />
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell align="center">
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AssignIcon />}
                    onClick={() => handleOpenProcessDialog(invoice)}
                  >
                    Verarbeiten
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Process Dialog */}
      <Dialog 
        open={processDialog} 
        onClose={() => !processing && setProcessDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          E-Mail-Rechnung verarbeiten
          <IconButton
            onClick={() => setProcessDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
            disabled={processing}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {processingData && (
            <Stack spacing={3} sx={{ mt: 2 }}>
              {/* Email Info */}
              <Alert severity="info" icon={<EmailIcon />}>
                <Typography variant="body2">
                  <strong>Von:</strong> {processingData.emailInvoice.sender}
                </Typography>
                <Typography variant="body2">
                  <strong>Betreff:</strong> {processingData.emailInvoice.subject}
                </Typography>
                <Typography variant="body2">
                  <strong>Datum:</strong> {format(processingData.emailInvoice.receivedDate, 'dd.MM.yyyy HH:mm', { locale: de })}
                </Typography>
              </Alert>

              {/* Target Account */}
              <FormControl fullWidth>
                <InputLabel>Zielkonto</InputLabel>
                <Select
                  value={processingData.targetAccount}
                  onChange={(e) => setProcessingData({
                    ...processingData,
                    targetAccount: e.target.value as 'steinpfleger' | 'wertvoll'
                  })}
                  label="Zielkonto"
                >
                  <MenuItem value="steinpfleger">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <BankIcon color="primary" />
                      <span>Steinpfleger</span>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="wertvoll">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <BankIcon color="secondary" />
                      <span>Wertvoll</span>
                    </Stack>
                  </MenuItem>
                </Select>
              </FormControl>

              {/* Invoice Details */}
              <TextField
                label="Rechnungsnummer"
                value={processingData.invoiceNumber}
                onChange={(e) => setProcessingData({
                  ...processingData,
                  invoiceNumber: e.target.value
                })}
                fullWidth
                required
              />

              <TextField
                label="Betrag"
                type="number"
                value={processingData.amount}
                onChange={(e) => setProcessingData({
                  ...processingData,
                  amount: parseFloat(e.target.value) || 0
                })}
                fullWidth
                required
                InputProps={{
                  startAdornment: '€',
                  inputProps: { min: 0, step: 0.01 }
                }}
              />

              <TextField
                label="Notizen (optional)"
                value={processingData.notes}
                onChange={(e) => setProcessingData({
                  ...processingData,
                  notes: e.target.value
                })}
                fullWidth
                multiline
                rows={2}
              />

              {/* Attachments */}
              {processingData.emailInvoice.attachments.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Anhänge:
                  </Typography>
                  <Stack spacing={1}>
                    {processingData.emailInvoice.attachments.map((attachment, index) => (
                      <Chip
                        key={index}
                        icon={<AttachFileIcon />}
                        label={attachment.filename}
                        variant="outlined"
                        deleteIcon={<DownloadIcon />}
                        onDelete={() => {
                          // TODO: Implement download
                          console.log('Download:', attachment.filename);
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setProcessDialog(false)}
            disabled={processing}
          >
            Abbrechen
          </Button>
          <Button
            variant="contained"
            onClick={handleProcessInvoice}
            disabled={
              processing || 
              !processingData?.invoiceNumber || 
              !processingData?.amount
            }
            startIcon={processing ? <CircularProgress size={20} /> : <CheckIcon />}
          >
            {processing ? 'Verarbeite...' : 'Verarbeiten'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UnprocessedEmailInvoices;