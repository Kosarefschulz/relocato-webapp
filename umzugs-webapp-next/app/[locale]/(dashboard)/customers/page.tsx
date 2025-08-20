'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Button,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  LinearProgress,
  Alert,
} from '@mui/material';
import { Grid2 as Grid } from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { Customer } from '@/types';
import { supabaseService } from '@/lib/services/supabase';
import { useToast } from '@/components/ui/Toaster';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const MotionCard = motion(Card);

interface CustomerCardProps {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: string) => void;
  onView: (customerId: string) => void;
}

function CustomerCard({ customer, onEdit, onDelete, onView }: CustomerCardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const router = useRouter();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'reached':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <MotionCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: 3,
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                mr: 2,
                width: 48,
                height: 48,
              }}
            >
              {customer.name.charAt(0).toUpperCase()}
            </Avatar>
            
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" sx={{ mb: 0.5 }} noWrap>
                {customer.name}
              </Typography>
              
              {customer.company && (
                <Typography variant="body2" color="text.secondary" noWrap>
                  {customer.company}
                </Typography>
              )}
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <LocationIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary" noWrap>
                  {customer.fromAddress || 'Keine Adresse'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <CalendarIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {customer.movingDate ? format(new Date(customer.movingDate), 'dd.MM.yyyy', { locale: de }) : 'Kein Datum'}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <IconButton onClick={handleMenuOpen} size="small">
            <MoreVertIcon />
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={() => { onView(customer.id); handleMenuClose(); }}>
              <ViewIcon sx={{ mr: 1 }} fontSize="small" />
              Ansehen
            </MenuItem>
            <MenuItem onClick={() => { onEdit(customer); handleMenuClose(); }}>
              <EditIcon sx={{ mr: 1 }} fontSize="small" />
              Bearbeiten
            </MenuItem>
            <MenuItem onClick={() => { onDelete(customer.id); handleMenuClose(); }} sx={{ color: 'error.main' }}>
              <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
              Löschen
            </MenuItem>
          </Menu>
        </Box>
        
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {customer.status && (
            <Chip
              label={customer.status}
              size="small"
              color={getStatusColor(customer.status) as any}
              variant="outlined"
            />
          )}
          
          {customer.priority && (
            <Chip
              label={`${customer.priority} Priorität`}
              size="small"
              color={getPriorityColor(customer.priority) as any}
              variant="filled"
            />
          )}
          
          {customer.services.length > 0 && (
            <Chip
              label={`${customer.services.length} Services`}
              size="small"
              variant="outlined"
            />
          )}
        </Box>
        
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          {customer.phone && (
            <IconButton
              size="small"
              href={`tel:${customer.phone}`}
              sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}
            >
              <PhoneIcon fontSize="small" />
            </IconButton>
          )}
          
          {customer.email && (
            <IconButton
              size="small"
              href={`mailto:${customer.email}`}
              sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}
            >
              <EmailIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </CardContent>
    </MotionCard>
  );
}

export default function CustomersPage() {
  const t = useTranslations('common');
  const router = useRouter();
  const { addToast } = useToast();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);

  // Filter customers based on search term
  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    
    const term = searchTerm.toLowerCase();
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(term) ||
      customer.email.toLowerCase().includes(term) ||
      customer.phone.toLowerCase().includes(term) ||
      customer.company?.toLowerCase().includes(term) ||
      customer.fromAddress.toLowerCase().includes(term) ||
      customer.toAddress.toLowerCase().includes(term)
    );
  }, [customers, searchTerm]);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      await supabaseService.initialize();
      const data = await supabaseService.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
      addToast({
        type: 'error',
        title: 'Fehler',
        message: 'Kunden konnten nicht geladen werden',
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleEdit = (customer: Customer) => {
    router.push(`/customers/${customer.id}/edit`);
  };

  const handleView = (customerId: string) => {
    router.push(`/customers/${customerId}`);
  };

  const handleDelete = (customerId: string) => {
    setCustomerToDelete(customerId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;
    
    try {
      await supabaseService.deleteCustomer(customerToDelete);
      setCustomers(prev => prev.filter(c => c.id !== customerToDelete));
      addToast({
        type: 'success',
        title: 'Erfolg',
        message: 'Kunde wurde gelöscht',
      });
    } catch (error) {
      console.error('Error deleting customer:', error);
      addToast({
        type: 'error',
        title: 'Fehler',
        message: 'Kunde konnte nicht gelöscht werden',
      });
    } finally {
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

  const handleAddCustomer = () => {
    router.push('/customers/new');
  };

  if (loading) {
    return (
      <Box>
        <LinearProgress />
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            Laden...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Kunden ({filteredCustomers.length})
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddCustomer}
          size="large"
        >
          Neuer Kunde
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Kunden suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {filteredCustomers.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          {searchTerm ? 'Keine Kunden gefunden' : 'Noch keine Kunden vorhanden'}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          <AnimatePresence>
            {filteredCustomers.map((customer) => (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={customer.id}>
                <CustomerCard
                  customer={customer}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                />
              </Grid>
            ))}
          </AnimatePresence>
        </Grid>
      )}

      <Fab
        color="primary"
        aria-label="add customer"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={handleAddCustomer}
      >
        <AddIcon />
      </Fab>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Kunde löschen</DialogTitle>
        <DialogContent>
          <Typography>
            Sind Sie sicher, dass Sie diesen Kunden löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Abbrechen
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}