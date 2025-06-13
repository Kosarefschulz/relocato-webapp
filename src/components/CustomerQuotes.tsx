import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Add as AddIcon,
  PictureAsPdf as PdfIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Quote, Customer } from '../types';
import { generatePDF } from '../services/pdfService';

interface CustomerQuotesProps {
  quotes: Quote[];
  customer: Customer;
  onTabChange: (tabIndex: number) => void;
}

const CustomerQuotes: React.FC<CustomerQuotesProps> = ({ quotes, customer, onTabChange }) => {
  const navigate = useNavigate();
  const [loadingPdf, setLoadingPdf] = useState<string | null>(null);

  const downloadPDF = async (quote: Quote) => {
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
      
      // Generiere PDF
      const pdfBlob = await generatePDF(customer, quoteData);
      console.log('✅ PDF erstellt, Größe:', pdfBlob.size, 'bytes');
      
      // Download/Öffnen
      const url = URL.createObjectURL(pdfBlob);
      const fileName = `Umzugsangebot_${(customer.name || 'Kunde').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      
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
    <Grid container spacing={2}>
      {quotes.map((quote, index) => (
        <Grid xs={12} md={6} key={quote.id}>
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Angebot #{quote.id}
                  </Typography>
                  <Chip 
                    label={quote.status}
                    color={quote.status === 'accepted' ? 'success' : quote.status === 'pending' ? 'warning' : 'default'}
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
                
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
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
                    startIcon={<EmailIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTabChange(4); // Zur E-Mail-Tab
                    }}
                  >
                    Senden
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      ))}
      
      {/* Add New Quote Card */}
      <Grid xs={12} md={6}>
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
  );
};

export default CustomerQuotes;