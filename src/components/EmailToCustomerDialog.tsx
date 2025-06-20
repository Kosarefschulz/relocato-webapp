import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Box,
  Typography,
  Divider,
  Alert,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Chip,
  Avatar
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  Add as AddIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import { Email } from '../types/email';
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  notes?: string;
  createdAt: Date;
  emailIds?: string[];
}

interface EmailToCustomerDialogProps {
  open: boolean;
  onClose: () => void;
  email: Email;
  onCustomerLinked?: (customerId: string) => void;
}

const EmailToCustomerDialog: React.FC<EmailToCustomerDialogProps> = ({
  open,
  onClose,
  email,
  onCustomerLinked
}) => {
  const [mode, setMode] = useState<'link' | 'create'>('link');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New customer form
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: email.from?.address || '',
    phone: '',
    company: '',
    address: '',
    notes: ''
  });

  // Load customers on mount
  useEffect(() => {
    if (open) {
      loadCustomers();
      // Pre-fill name from email if available
      if (email.from?.name) {
        setNewCustomer(prev => ({ ...prev, name: email.from?.name || '' }));
      }
    }
  }, [open, email]);

  // Load customers from Firestore
  const loadCustomers = async () => {
    try {
      setLoading(true);
      const customersRef = collection(db, 'customers');
      const snapshot = await getDocs(customersRef);
      const customersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Customer));
      setCustomers(customersList);
      
      // Try to find existing customer by email
      const existingCustomer = customersList.find(
        c => c.email.toLowerCase() === email.from?.address?.toLowerCase()
      );
      if (existingCustomer) {
        setSelectedCustomer(existingCustomer);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Link email to existing customer
  const linkToCustomer = async () => {
    if (!selectedCustomer) return;
    
    try {
      setSaving(true);
      
      // Update customer with email ID
      const customerRef = doc(db, 'customers', selectedCustomer.id);
      const emailIds = selectedCustomer.emailIds || [];
      emailIds.push(email.id);
      
      await updateDoc(customerRef, {
        emailIds: emailIds,
        lastEmailAt: new Date()
      });
      
      // Also store the link in the email collection
      await addDoc(collection(db, 'emailCustomerLinks'), {
        emailId: email.id,
        customerId: selectedCustomer.id,
        linkedAt: new Date(),
        emailSubject: email.subject,
        emailFrom: email.from?.address
      });
      
      onCustomerLinked?.(selectedCustomer.id);
      onClose();
    } catch (error) {
      console.error('Error linking email to customer:', error);
    } finally {
      setSaving(false);
    }
  };

  // Create new customer from email
  const createNewCustomer = async () => {
    if (!newCustomer.name || !newCustomer.email) {
      return;
    }
    
    try {
      setSaving(true);
      
      // Create new customer
      const customerData = {
        ...newCustomer,
        createdAt: new Date(),
        emailIds: [email.id],
        lastEmailAt: new Date(),
        source: 'email'
      };
      
      const docRef = await addDoc(collection(db, 'customers'), customerData);
      
      // Store the link
      await addDoc(collection(db, 'emailCustomerLinks'), {
        emailId: email.id,
        customerId: docRef.id,
        linkedAt: new Date(),
        emailSubject: email.subject,
        emailFrom: email.from?.address
      });
      
      onCustomerLinked?.(docRef.id);
      onClose();
    } catch (error) {
      console.error('Error creating customer:', error);
    } finally {
      setSaving(false);
    }
  };

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer => {
    const search = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(search) ||
      customer.email.toLowerCase().includes(search) ||
      (customer.company && customer.company.toLowerCase().includes(search))
    );
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        E-Mail zu Kunde zuordnen
      </DialogTitle>
      
      <DialogContent dividers>
        {/* Email Info */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            E-Mail von: {email.from?.name || email.from?.address}
          </Typography>
          <Typography variant="body2">
            Betreff: {email.subject}
          </Typography>
        </Alert>

        {/* Mode Selection */}
        <FormControl component="fieldset" sx={{ mb: 3 }}>
          <FormLabel component="legend">Was möchten Sie tun?</FormLabel>
          <RadioGroup
            value={mode}
            onChange={(e) => setMode(e.target.value as 'link' | 'create')}
          >
            <FormControlLabel 
              value="link" 
              control={<Radio />} 
              label="Mit vorhandenem Kunden verknüpfen" 
            />
            <FormControlLabel 
              value="create" 
              control={<Radio />} 
              label="Neuen Kunden erstellen" 
            />
          </RadioGroup>
        </FormControl>

        <Divider sx={{ my: 3 }} />

        {mode === 'link' ? (
          // Link to existing customer
          <Box>
            <Typography variant="h6" gutterBottom>
              Kunde auswählen
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Autocomplete
                options={filteredCustomers}
                value={selectedCustomer}
                onChange={(_, value) => setSelectedCustomer(value)}
                getOptionLabel={(option) => `${option.name} (${option.email})`}
                renderOption={(props, option) => (
                  <Box component="li" sx={{ display: 'flex', alignItems: 'center', gap: 2 }} {...props}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {option.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.email}
                        {option.company && ` • ${option.company}`}
                      </Typography>
                    </Box>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Kunde suchen"
                    placeholder="Name, E-Mail oder Firma eingeben..."
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                )}
                sx={{ mb: 2 }}
              />
            )}

            {selectedCustomer && (
              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="subtitle2">
                  Ausgewählter Kunde: {selectedCustomer.name}
                </Typography>
                {selectedCustomer.emailIds && selectedCustomer.emailIds.length > 0 && (
                  <Typography variant="body2">
                    Bereits {selectedCustomer.emailIds.length} E-Mail(s) verknüpft
                  </Typography>
                )}
              </Alert>
            )}
          </Box>
        ) : (
          // Create new customer
          <Box>
            <Typography variant="h6" gutterBottom>
              Neuen Kunden erstellen
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Name"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                required
                fullWidth
                InputProps={{
                  startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
              
              <TextField
                label="E-Mail"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                required
                fullWidth
                type="email"
                InputProps={{
                  startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
              
              <TextField
                label="Telefon"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                fullWidth
                InputProps={{
                  startAdornment: <PhoneIcon sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
              
              <TextField
                label="Firma"
                value={newCustomer.company}
                onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })}
                fullWidth
                InputProps={{
                  startAdornment: <BusinessIcon sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
              
              <TextField
                label="Adresse"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                fullWidth
                multiline
                rows={2}
                InputProps={{
                  startAdornment: <HomeIcon sx={{ mr: 1, color: 'action.active', alignSelf: 'flex-start', mt: 1 }} />
                }}
              />
              
              <TextField
                label="Notizen"
                value={newCustomer.notes}
                onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                fullWidth
                multiline
                rows={3}
                placeholder="Weitere Informationen zum Kunden..."
              />
            </Box>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Abbrechen
        </Button>
        <Button
          variant="contained"
          onClick={mode === 'link' ? linkToCustomer : createNewCustomer}
          disabled={
            saving || 
            (mode === 'link' && !selectedCustomer) ||
            (mode === 'create' && (!newCustomer.name || !newCustomer.email))
          }
          startIcon={saving ? <CircularProgress size={20} /> : (mode === 'link' ? <LinkIcon /> : <AddIcon />)}
        >
          {mode === 'link' ? 'Verknüpfen' : 'Kunde erstellen'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailToCustomerDialog;