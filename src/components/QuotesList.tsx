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
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { Quote } from '../types';
import { googleSheetsPublicService as googleSheetsService } from '../services/googleSheetsPublic';

const QuotesList: React.FC = () => {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadQuotes = async () => {
      try {
        const quotes = await googleSheetsService.getQuotes();
        setQuotes(quotes);
      } catch (error) {
        console.error('Fehler beim Laden der Angebote:', error);
      }
    };
    
    loadQuotes();
  }, []);

  const filteredQuotes = quotes.filter(quote => 
    quote.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.id.includes(searchTerm)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'primary';
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      case 'invoiced': return 'info';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent': return 'Versendet';
      case 'accepted': return 'Angenommen';
      case 'rejected': return 'Abgelehnt';
      case 'draft': return 'Entwurf';
      case 'invoiced': return 'Rechnung erstellt';
      default: return status;
    }
  };

  const handleConvertToInvoice = async (quote: Quote) => {
    try {
      // Generate invoice number
      const currentYear = new Date().getFullYear();
      const invoiceCount = await googleSheetsService.getInvoices();
      const nextNumber = invoiceCount.filter(inv => inv.invoiceNumber.includes(currentYear.toString())).length + 1;
      const invoiceNumber = `RE-${currentYear}-${nextNumber.toString().padStart(4, '0')}`;
      
      // Calculate tax (19% MwSt)
      const netPrice = quote.price / 1.19;
      const taxAmount = quote.price - netPrice;
      
      // Create invoice from quote
      const newInvoice = {
        quoteId: quote.id,
        customerId: quote.customerId,
        customerName: quote.customerName,
        invoiceNumber: invoiceNumber,
        price: netPrice,
        taxAmount: taxAmount,
        totalPrice: quote.price,
        items: [{
          description: 'Umzugsservice - Transport, Be- und Entladung',
          quantity: 1,
          unitPrice: netPrice,
          totalPrice: netPrice
        }],
        createdAt: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 Tage Zahlungsziel
        status: 'sent' as const
      };
      
      // Save invoice
      await googleSheetsService.addInvoice(newInvoice);
      
      // Update quote status to invoiced
      // Note: In a real app, we would update the quote in the backend
      // For now, we'll just refresh the list
      
      console.log('✅ Rechnung erstellt:', invoiceNumber);
      
      // Navigate to invoices list
      navigate('/invoices');
      
    } catch (error) {
      console.error('Fehler beim Erstellen der Rechnung:', error);
      alert('Fehler beim Erstellen der Rechnung. Bitte versuchen Sie es erneut.');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate('/dashboard')} sx={{ mb: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" gutterBottom>
          Angebote
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Alle versendeten Angebote im Überblick
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <TextField
          fullWidth
          label="Angebot suchen"
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
            {filteredQuotes.length} Angebot{filteredQuotes.length !== 1 ? 'e' : ''} gefunden
          </Typography>
        </Box>
        
        <List>
          {filteredQuotes.map((quote, index) => (
            <React.Fragment key={quote.id}>
              {index > 0 && <Divider />}
              <ListItem>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6">
                        {quote.customerName}
                      </Typography>
                      <Typography variant="h6" color="primary">
                        € {quote.price.toFixed(2).replace('.', ',')}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            Angebot #{quote.id}
                          </Typography>
                          {quote.id.startsWith('local_') && (
                            <Chip 
                              label="Lokal" 
                              color="warning" 
                              size="small"
                            />
                          )}
                        </Box>
                        <Chip 
                          label={getStatusText(quote.status)} 
                          color={getStatusColor(quote.status) as any}
                          size="small"
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary">
                        Erstellt am: {quote.createdAt.toLocaleDateString('de-DE')}
                      </Typography>
                      
                      {quote.comment && (
                        <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                          "{quote.comment}"
                        </Typography>
                      )}
                      
                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={() => console.log('PDF herunterladen:', quote.id)}
                        >
                          PDF
                        </Button>
                        <Button
                          size="small"
                          startIcon={<EmailIcon />}
                          onClick={() => console.log('Erneut senden:', quote.id)}
                        >
                          Erneut senden
                        </Button>
                        <Button
                          size="small"
                          startIcon={<ReceiptIcon />}
                          onClick={() => handleConvertToInvoice(quote)}
                          color="success"
                          variant={quote.status === 'accepted' ? 'contained' : 'outlined'}
                        >
                          Rechnung erstellen
                        </Button>
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>

        {filteredQuotes.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              {searchTerm ? 'Keine Angebote gefunden' : 'Noch keine Angebote erstellt'}
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default QuotesList;