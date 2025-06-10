import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  Button,
  TextField,
  InputAdornment
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  Euro as EuroIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { Invoice } from '../types';
import { googleSheetsPublicService as googleSheetsService } from '../services/googleSheetsPublic';

const InvoicesList: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        const invoices = await googleSheetsService.getInvoices();
        setInvoices(invoices);
      } catch (error) {
        console.error('Fehler beim Laden der Rechnungen:', error);
      }
    };
    
    loadInvoices();
  }, []);

  const filteredInvoices = invoices.filter(invoice => 
    invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.invoiceNumber.includes(searchTerm)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'sent': return 'warning';
      case 'overdue': return 'error';
      case 'cancelled': return 'default';
      case 'draft': return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Bezahlt';
      case 'sent': return 'Offen';
      case 'overdue': return 'Überfällig';
      case 'cancelled': return 'Storniert';
      case 'draft': return 'Entwurf';
      default: return status;
    }
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleMarkAsPaid = async (invoice: Invoice) => {
    try {
      const updatedInvoice = { ...invoice, status: 'paid' as const, paidDate: new Date() };
      
      // TODO: Update invoice status in Google Sheets
      console.log('Rechnung als bezahlt markieren:', invoice.invoiceNumber);
      
      // Refresh invoices
      const invoices = await googleSheetsService.getInvoices();
      setInvoices(invoices);
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Rechnung:', error);
    }
  };

  const handleSendReminder = async (invoice: Invoice) => {
    try {
      // TODO: Send payment reminder email
      console.log('Zahlungserinnerung senden:', invoice.invoiceNumber);
    } catch (error) {
      console.error('Fehler beim Senden der Zahlungserinnerung:', error);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate('/dashboard')} sx={{ mb: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" gutterBottom>
          Rechnungen
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Alle Rechnungen im Überblick
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <TextField
          fullWidth
          label="Rechnung suchen"
          variant="outlined"
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
      </Paper>

      <Paper elevation={3}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            {filteredInvoices.length} Rechnung{filteredInvoices.length !== 1 ? 'en' : ''} gefunden
          </Typography>
        </Box>
        
        <List>
          {filteredInvoices.map((invoice, index) => (
            <React.Fragment key={invoice.id}>
              {index > 0 && <Divider />}
              <ListItem>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6">
                        {invoice.customerName}
                      </Typography>
                      <Typography variant="h6" color="primary">
                        € {invoice.totalPrice.toFixed(2).replace('.', ',')}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            Rechnung #{invoice.invoiceNumber}
                          </Typography>
                          {invoice.id.startsWith('local_') && (
                            <Chip 
                              label="Lokal" 
                              color="warning" 
                              size="small"
                            />
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Chip 
                            label={getStatusText(invoice.status)} 
                            color={getStatusColor(invoice.status) as any}
                            size="small"
                          />
                          {invoice.status === 'sent' && getDaysUntilDue(invoice.dueDate) <= 0 && (
                            <Chip 
                              label={`${Math.abs(getDaysUntilDue(invoice.dueDate))} Tage überfällig`} 
                              color="error"
                              size="small"
                            />
                          )}
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          Erstellt: {invoice.createdAt.toLocaleDateString('de-DE')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Fällig: {invoice.dueDate.toLocaleDateString('de-DE')}
                        </Typography>
                        {invoice.paidDate && (
                          <Typography variant="body2" color="text.secondary">
                            Bezahlt: {invoice.paidDate.toLocaleDateString('de-DE')}
                          </Typography>
                        )}
                      </Box>
                      
                      {invoice.items && invoice.items.length > 0 && (
                        <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                          {invoice.items.map(item => item.description).join(', ')}
                        </Typography>
                      )}
                      
                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={() => console.log('PDF herunterladen:', invoice.invoiceNumber)}
                        >
                          PDF
                        </Button>
                        {invoice.status === 'sent' && (
                          <>
                            <Button
                              size="small"
                              startIcon={<EmailIcon />}
                              onClick={() => handleSendReminder(invoice)}
                              color="warning"
                            >
                              Zahlungserinnerung
                            </Button>
                            <Button
                              size="small"
                              startIcon={<CheckCircleIcon />}
                              onClick={() => handleMarkAsPaid(invoice)}
                              color="success"
                            >
                              Als bezahlt markieren
                            </Button>
                          </>
                        )}
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>

        {filteredInvoices.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              {searchTerm ? 'Keine Rechnungen gefunden' : 'Noch keine Rechnungen erstellt'}
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default InvoicesList;