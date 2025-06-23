import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
  Chip,
  Stack,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Euro as EuroIcon,
  CreditCard as CreditCardIcon,
  Money as MoneyIcon,
  AccountBalance as BankIcon,
  PaymentOutlined as PaymentIcon,
  CheckCircle as CheckIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { Quote, PaymentInfo } from '../types';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  quote: Quote | null;
  onSave: (paymentInfo: PaymentInfo) => Promise<void>;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  onClose,
  quote,
  onSave
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentInfo['method']>('not_paid');
  const [paymentStatus, setPaymentStatus] = useState<PaymentInfo['status']>('pending');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [paidDate, setPaidDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [confirmedBy, setConfirmedBy] = useState<string>('');
  const [receiptNumber, setReceiptNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open && quote) {
      if (quote.paymentInfo) {
        setPaymentMethod(quote.paymentInfo.method);
        setPaymentStatus(quote.paymentInfo.status);
        setPaidAmount(quote.paymentInfo.paidAmount?.toString() || quote.price.toString());
        setPaidDate(quote.paymentInfo.paidDate ? 
          new Date(quote.paymentInfo.paidDate).toISOString().split('T')[0] : 
          new Date().toISOString().split('T')[0]
        );
        setConfirmedBy(quote.paymentInfo.confirmedBy || '');
        setReceiptNumber(quote.paymentInfo.receiptNumber || '');
        setNotes(quote.paymentInfo.notes || '');
      } else {
        // Reset to defaults
        setPaymentMethod('not_paid');
        setPaymentStatus('pending');
        setPaidAmount(quote.price.toString());
        setPaidDate(new Date().toISOString().split('T')[0]);
        setConfirmedBy('');
        setReceiptNumber('');
        setNotes('');
      }
    }
  }, [open, quote]);

  const handleMethodChange = (method: PaymentInfo['method']) => {
    setPaymentMethod(method);
    
    // Auto-set status based on method
    if (method === 'ec_card' || method === 'cash') {
      setPaymentStatus('paid_on_site');
      setPaidDate(new Date().toISOString().split('T')[0]);
    } else if (method === 'bank_transfer' || method === 'paypal') {
      setPaymentStatus('pending');
    } else {
      setPaymentStatus('pending');
    }
  };

  const handleSave = async () => {
    if (!quote) return;

    // Validation
    if (paymentMethod !== 'not_paid' && !confirmedBy.trim()) {
      setError('Bitte geben Sie an, wer die Zahlung bestätigt hat');
      return;
    }

    if ((paymentStatus === 'paid' || paymentStatus === 'paid_on_site') && !paidAmount) {
      setError('Bitte geben Sie den bezahlten Betrag ein');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const paymentInfo: PaymentInfo = {
        method: paymentMethod,
        status: paymentStatus,
        paidAmount: paidAmount ? parseFloat(paidAmount) : undefined,
        paidDate: (paymentStatus === 'paid' || paymentStatus === 'paid_on_site') ? new Date(paidDate) : undefined,
        confirmedBy: confirmedBy.trim() || undefined,
        confirmedAt: new Date(),
        receiptNumber: receiptNumber.trim() || undefined,
        notes: notes.trim() || undefined
      };

      await onSave(paymentInfo);
      onClose();
    } catch (err) {
      console.error('Error saving payment info:', err);
      setError('Fehler beim Speichern der Zahlungsinformationen');
    } finally {
      setSaving(false);
    }
  };

  const getMethodIcon = (method: PaymentInfo['method']) => {
    switch (method) {
      case 'ec_card': return <CreditCardIcon />;
      case 'cash': return <MoneyIcon />;
      case 'bank_transfer': return <BankIcon />;
      case 'paypal': return <PaymentIcon />;
      default: return <CloseIcon />;
    }
  };

  const getStatusColor = (status: PaymentInfo['status']) => {
    switch (status) {
      case 'paid':
      case 'paid_on_site': return 'success';
      case 'partially_paid': return 'warning';
      default: return 'default';
    }
  };

  if (!quote) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Zahlungsinformationen erfassen</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {/* Quote Info */}
          <Alert severity="info" icon={<ReceiptIcon />}>
            <Typography variant="body2">
              <strong>Angebot {quote.id}</strong> - {quote.customerName}
            </Typography>
            <Typography variant="body2">
              Betrag: <strong>€{quote.price.toFixed(2)}</strong>
            </Typography>
          </Alert>

          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Payment Method */}
          <FormControl component="fieldset">
            <FormLabel component="legend">Zahlungsmethode</FormLabel>
            <RadioGroup
              value={paymentMethod}
              onChange={(e) => handleMethodChange(e.target.value as PaymentInfo['method'])}
            >
              <FormControlLabel 
                value="ec_card" 
                control={<Radio />} 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CreditCardIcon fontSize="small" />
                    EC-Karte (vor Ort)
                  </Box>
                }
              />
              <FormControlLabel 
                value="cash" 
                control={<Radio />} 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MoneyIcon fontSize="small" />
                    Bargeld (vor Ort)
                  </Box>
                }
              />
              <FormControlLabel 
                value="bank_transfer" 
                control={<Radio />} 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BankIcon fontSize="small" />
                    Überweisung
                  </Box>
                }
              />
              <FormControlLabel 
                value="paypal" 
                control={<Radio />} 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PaymentIcon fontSize="small" />
                    PayPal
                  </Box>
                }
              />
              <FormControlLabel 
                value="not_paid" 
                control={<Radio />} 
                label="Noch nicht bezahlt"
              />
            </RadioGroup>
          </FormControl>

          <Divider />

          {/* Payment Status */}
          {paymentMethod !== 'not_paid' && (
            <>
              <FormControl component="fieldset">
                <FormLabel component="legend">Zahlungsstatus</FormLabel>
                <RadioGroup
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as PaymentInfo['status'])}
                >
                  <FormControlLabel 
                    value="paid_on_site" 
                    control={<Radio />} 
                    label={
                      <Chip 
                        label="Vor Ort bezahlt" 
                        color="success" 
                        size="small" 
                        icon={<CheckIcon />}
                      />
                    }
                    disabled={paymentMethod !== 'ec_card' && paymentMethod !== 'cash'}
                  />
                  <FormControlLabel 
                    value="paid" 
                    control={<Radio />} 
                    label={
                      <Chip 
                        label="Bezahlt" 
                        color="success" 
                        size="small"
                        icon={<CheckIcon />}
                      />
                    }
                  />
                  <FormControlLabel 
                    value="partially_paid" 
                    control={<Radio />} 
                    label={
                      <Chip 
                        label="Teilweise bezahlt" 
                        color="warning" 
                        size="small"
                      />
                    }
                  />
                  <FormControlLabel 
                    value="pending" 
                    control={<Radio />} 
                    label={
                      <Chip 
                        label="Ausstehend" 
                        color="default" 
                        size="small"
                      />
                    }
                  />
                </RadioGroup>
              </FormControl>

              {/* Payment Details */}
              {(paymentStatus === 'paid' || paymentStatus === 'paid_on_site' || paymentStatus === 'partially_paid') && (
                <>
                  <TextField
                    label="Bezahlter Betrag"
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    fullWidth
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EuroIcon />
                        </InputAdornment>
                      ),
                    }}
                    helperText={
                      paymentStatus === 'partially_paid' && paidAmount && 
                      `Restbetrag: €${(quote.price - parseFloat(paidAmount)).toFixed(2)}`
                    }
                  />

                  <TextField
                    label="Zahlungsdatum"
                    type="date"
                    value={paidDate}
                    onChange={(e) => setPaidDate(e.target.value)}
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </>
              )}

              <TextField
                label="Bestätigt von"
                value={confirmedBy}
                onChange={(e) => setConfirmedBy(e.target.value)}
                fullWidth
                required
                placeholder="Name des Mitarbeiters"
                helperText="Wer hat die Zahlung entgegengenommen/bestätigt?"
              />

              <TextField
                label="Belegnummer (optional)"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                fullWidth
                placeholder="z.B. EC-Terminal Belegnummer"
              />

              <TextField
                label="Notizen (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                fullWidth
                multiline
                rows={2}
                placeholder="Zusätzliche Informationen zur Zahlung"
              />
            </>
          )}
        </Stack>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose}>
          Abbrechen
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={<CheckIcon />}
        >
          {saving ? 'Speichere...' : 'Speichern'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentDialog;