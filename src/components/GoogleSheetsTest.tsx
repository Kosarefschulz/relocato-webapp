import React, { useState } from 'react';
import { googleSheetsPublicService } from '../services/googleSheetsPublic';
import {
  Container,
  Paper,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { Customer } from '../types';

const GoogleSheetsTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const testApiAccess = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('🧪 Starte Google Sheets API Test...');
      await googleSheetsPublicService.testConnection();
      
      const loadedCustomers = await googleSheetsPublicService.getCustomers();
      setCustomers(loadedCustomers);
      
      if (loadedCustomers.length > 0) {
        setSuccess(`✅ ${loadedCustomers.length} Kunden erfolgreich geladen!`);
      } else {
        setError('⚠️ Keine Kunden gefunden - überprüfen Sie die Spreadsheet-Konfiguration');
      }
    } catch (err: any) {
      setError(`❌ Fehler: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom color="primary">
          🔧 Google Sheets API Test
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 3 }}>
          Testen Sie die Verbindung zu Ihren echten Google Sheets Daten.
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            onClick={testApiAccess}
            disabled={loading}
            size="large"
            sx={{ mr: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : '🧪 API Test starten'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {customers.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              📋 Geladene Kunden ({customers.length}):
            </Typography>
            <Paper elevation={1} sx={{ maxHeight: 400, overflow: 'auto' }}>
              <List>
                {customers.map((customer, index) => (
                  <ListItem key={customer.id} divider>
                    <ListItemText
                      primary={`${index + 1}. ${customer.name}`}
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            📞 {customer.phone} | ✉️ {customer.email}
                          </Typography>
                          <Typography variant="body2">
                            📍 Von: {customer.fromAddress}
                          </Typography>
                          <Typography variant="body2">
                            📍 Nach: {customer.toAddress}
                          </Typography>
                          <Typography variant="body2">
                            📅 Umzug: {customer.movingDate}
                          </Typography>
                          {customer.notes && (
                            <Typography variant="body2" color="text.secondary">
                              📝 {customer.notes}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>
        )}

        <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            📋 Setup-Anleitung:
          </Typography>
          <Typography variant="body2" component="div">
            1. <strong>Google Cloud Console:</strong> API-Schlüssel erstellen<br/>
            2. <strong>Google Sheets API:</strong> Aktivieren<br/>
            3. <strong>Spreadsheet:</strong> Öffentlich freigeben<br/>
            4. <strong>.env Datei:</strong> API-Schlüssel eintragen<br/>
            5. <strong>App neustarten:</strong> npm start<br/>
          </Typography>
          
          <Typography variant="body2" sx={{ mt: 2 }}>
            📊 <strong>Ihr Spreadsheet:</strong><br/>
            <a 
              href="https://docs.google.com/spreadsheets/d/178tpFCNqmnDZxkzOfgWQCS6BW7wn2rYyTB3hZh8H7PU" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Google Sheets öffnen
            </a>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default GoogleSheetsTest;