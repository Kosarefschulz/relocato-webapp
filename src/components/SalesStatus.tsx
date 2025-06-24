import React, { useState, useEffect } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Chip,
  Stack,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Phone as PhoneIcon,
  PhoneDisabled as PhoneDisabledIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { Customer } from '../types';
import { databaseService as googleSheetsService } from '../config/database.config';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface SalesStatusProps {
  customer: Customer;
  onUpdate: (updatedFields?: Partial<Customer>) => void;
}

const SalesStatus: React.FC<SalesStatusProps> = ({ customer, onUpdate }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(false);
  const [localCustomer, setLocalCustomer] = useState(customer);

  useEffect(() => {
    setLocalCustomer(customer);
  }, [customer]);

  const handleReached = async () => {
    try {
      setLoading(true);
      const updatedFields = {
        salesStatus: 'reached' as const,
        contacted: true,
        notReachedCount: 0 // Reset counter when reached
      };
      
      setLocalCustomer(prev => ({ ...prev, ...updatedFields }));
      await googleSheetsService.updateCustomer(customer.id, updatedFields);
      onUpdate(updatedFields);
    } catch (error) {
      console.error('Error updating customer:', error);
      alert('Fehler beim Aktualisieren des Status');
      setLocalCustomer(customer);
    } finally {
      setLoading(false);
    }
  };

  const handleNotReached = async () => {
    try {
      setLoading(true);
      const currentCount = localCustomer.notReachedCount || 0;
      const newCount = currentCount + 1;
      
      const updatedFields = {
        salesStatus: 'not_reached' as const,
        contacted: false,
        notReachedCount: newCount,
        lastNotReachedAt: new Date()
      };
      
      setLocalCustomer(prev => ({ ...prev, ...updatedFields }));
      await googleSheetsService.updateCustomer(customer.id, updatedFields);
      onUpdate(updatedFields);
    } catch (error) {
      console.error('Error updating customer:', error);
      alert('Fehler beim Aktualisieren des Status');
      setLocalCustomer(customer);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setLoading(true);
      const cancelledAt = new Date();
      
      const updatedFields = {
        salesStatus: 'cancelled' as const,
        cancelledAt,
        cancelledReason: 'Vom Vertrieb storniert'
      };
      
      setLocalCustomer(prev => ({ ...prev, ...updatedFields }));
      await googleSheetsService.updateCustomer(customer.id, updatedFields);
      onUpdate(updatedFields);
    } catch (error) {
      console.error('Error cancelling customer:', error);
      alert('Fehler beim Stornieren');
      setLocalCustomer(customer);
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = () => {
    if (localCustomer.salesStatus === 'reached') {
      return <Chip label="Erreicht" color="success" icon={<CheckIcon />} size={isMobile ? "small" : "medium"} />;
    } else if (localCustomer.salesStatus === 'not_reached') {
      const count = localCustomer.notReachedCount || 0;
      const label = count > 1 ? `Nicht erreicht (${count}x)` : 'Nicht erreicht';
      return <Chip label={label} color="warning" icon={<PhoneDisabledIcon />} size={isMobile ? "small" : "medium"} />;
    } else if (localCustomer.salesStatus === 'cancelled') {
      return <Chip label="Storniert" color="error" icon={<CancelIcon />} size={isMobile ? "small" : "medium"} />;
    }
    return null;
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant={isMobile ? "subtitle1" : "h6"}>Vertriebsstatus</Typography>
          {getStatusChip()}
        </Box>

        {/* Action Buttons */}
        <Stack 
          direction={isMobile ? "column" : "row"} 
          spacing={isMobile ? 1 : 2} 
          sx={{ mb: 2 }}
        >
          <Stack direction="row" spacing={1} sx={{ width: isMobile ? '100%' : 'auto' }}>
            <Button
              variant="contained"
              color="success"
              size={isMobile ? "small" : "medium"}
              startIcon={!isMobile && <PhoneIcon />}
              onClick={handleReached}
              disabled={loading || localCustomer.salesStatus === 'reached'}
              fullWidth={isMobile}
              sx={{ 
                minWidth: isMobile ? 0 : 'auto',
                px: isMobile ? 1 : 2
              }}
            >
              {isMobile ? <PhoneIcon fontSize="small" /> : 'Erreicht'}
            </Button>
            <Button
              variant="outlined"
              color="warning"
              size={isMobile ? "small" : "medium"}
              startIcon={!isMobile && <PhoneDisabledIcon />}
              onClick={handleNotReached}
              disabled={loading}
              fullWidth={isMobile}
              sx={{ 
                minWidth: isMobile ? 0 : 'auto',
                px: isMobile ? 1 : 2
              }}
            >
              {isMobile ? <PhoneDisabledIcon fontSize="small" /> : 'Nicht erreicht'}
            </Button>
            <Button
              variant="outlined"
              color="error"
              size={isMobile ? "small" : "medium"}
              startIcon={!isMobile && <CancelIcon />}
              onClick={handleCancel}
              disabled={loading || localCustomer.salesStatus === 'cancelled'}
              fullWidth={isMobile}
              sx={{ 
                minWidth: isMobile ? 0 : 'auto',
                px: isMobile ? 1 : 2
              }}
            >
              {isMobile ? <CancelIcon fontSize="small" /> : 'Storno'}
            </Button>
          </Stack>
        </Stack>

        {/* Status Info */}
        {localCustomer.salesStatus === 'not_reached' && (localCustomer.notReachedCount || 0) > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">
              {localCustomer.notReachedCount} Mal nicht erreicht
            </Typography>
            {localCustomer.lastNotReachedAt && (
              <Typography variant="body2">
                Zuletzt versucht: {format(new Date(localCustomer.lastNotReachedAt), 'dd.MM.yyyy HH:mm', { locale: de })}
              </Typography>
            )}
          </Alert>
        )}

        {/* Cancel Info */}
        {localCustomer.salesStatus === 'cancelled' && (
          <Alert severity="error">
            <Typography variant="subtitle2">
              Storniert am {localCustomer.cancelledAt ? format(new Date(localCustomer.cancelledAt), 'dd.MM.yyyy', { locale: de }) : ''}
            </Typography>
            {localCustomer.cancelledReason && (
              <Typography variant="body2">Grund: {localCustomer.cancelledReason}</Typography>
            )}
          </Alert>
        )}

        {/* Info about attempts */}
        {(localCustomer.notReachedCount || 0) > 3 && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon color="info" fontSize="small" />
            <Typography variant="caption" color="text.secondary">
              Tipp: Nach mehreren erfolglosen Versuchen könnte eine andere Kontaktmethode sinnvoll sein.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesStatus;