import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Grid
} from '@mui/material';
import { UploadFile as UploadIcon, Check as CheckIcon } from '@mui/icons-material';
import { googleSheetsService } from '../services/googleSheetsService';
import { Customer } from '../types';

interface CustomerImportData {
  name: string;
  phone: string;
  email: string;
  movingDate: string;
  fromAddress: string;
  toAddress: string;
  apartment: {
    rooms: number;
    area: number;
    floor: number;
    hasElevator: boolean;
  };
  services: string[];
  notes: string;
  quotePrice: number;
}

const CustomerImportPage: React.FC = () => {
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ customer: string; success: boolean; message: string }[]>([]);

  const customersToImport: CustomerImportData[] = [
    {
      name: 'Carolina Klein',
      phone: '+49 177 5305094',
      email: '',
      movingDate: '2025-07-17',
      fromAddress: 'Viktoriastraße 27, Bielefeld (3. OG ohne Fahrstuhl)',
      toAddress: 'Obernstraße 1, Bielefeld (4. OG mit Fahrstuhl)',
      apartment: {
        rooms: 3,
        area: 70,
        floor: 3,
        hasElevator: false
      },
      services: ['Umzug', 'Verpackung', 'Montage'],
      notes: 'ca. 17 Kubik, Möbelmontage, 3 Lampen, Einpackservice Küche & Arbeitszimmer, 50 Kartons, USM Haller Möbel, hochwertige Kaffeemaschine',
      quotePrice: 1900
    },
    {
      name: 'Doris Mattson',
      phone: '+49 170 1120639',
      email: '',
      movingDate: '2025-07-18',
      fromAddress: 'Alte Verler Straße 22, Sennestadt, Bielefeld',
      toAddress: 'Solmser Weg 13, 61169 Friedberg (Hessen), EG',
      apartment: {
        rooms: 3,
        area: 80,
        floor: 0,
        hasElevator: false
      },
      services: ['Umzug', 'Montage'],
      notes: 'Möbelmontage, Gartentisch, Box, Waschmaschine, Trockner, Holzregale mit Lebensmitteln, 30 Kartons, Juli (in den Ferien), Tochter krank',
      quotePrice: 2897
    },
    {
      name: 'Lars Schuerstedt',
      phone: '+49 157 39103228',
      email: '',
      movingDate: '2025-07-18',
      fromAddress: 'An der Else 11, Kirchlengern',
      toAddress: 'An der Else 11, Kirchlengern',
      apartment: {
        rooms: 4,
        area: 100,
        floor: 1,
        hasElevator: false
      },
      services: ['Umzug', 'Material'],
      notes: '5m Sockelleiste und Arbeitsplatte 3,50m müssen besorgt werden',
      quotePrice: 5498.10
    },
    {
      name: 'André Fischer',
      phone: '',
      email: 'Mdivani.irma@gmail.com',
      movingDate: '2025-07-19',
      fromAddress: 'Landerweg 23, Oerlinghausen (EG, 86 qm)',
      toAddress: 'Stukenbrocker Weg 7, 33813 Oerlinghausen (1. OG)',
      apartment: {
        rooms: 3,
        area: 86,
        floor: 0,
        hasElevator: false
      },
      services: ['Montage'],
      notes: 'Budget 800 €, nur Möbelmontage, ca. 15 Kubik',
      quotePrice: 980
    }
  ];

  const handleImport = async () => {
    setImporting(true);
    setImportResults([]);
    const results: { customer: string; success: boolean; message: string }[] = [];

    for (const customerData of customersToImport) {
      try {
        // Create customer
        const newCustomer: Omit<Customer, 'id'> = {
          name: customerData.name,
          phone: customerData.phone,
          email: customerData.email,
          movingDate: customerData.movingDate,
          fromAddress: customerData.fromAddress,
          toAddress: customerData.toAddress,
          apartment: customerData.apartment,
          services: customerData.services,
          notes: customerData.notes,
          contacted: true,
          source: 'Telefon',
          status: 'lead',
          viewingScheduled: false
        };

        const success = await googleSheetsService.addCustomer(newCustomer);
        const customerId = Date.now().toString();

        // Wait a bit to ensure unique IDs
        await new Promise(resolve => setTimeout(resolve, 100));

        // Create quote if price exists
        if (customerData.quotePrice > 0) {
          const quoteData = {
            customerId: customerId,
            customerName: customerData.name,
            price: customerData.quotePrice,
            comment: customerData.notes,
            createdAt: new Date(),
            createdBy: 'System Import',
            status: 'draft' as const
          };

          await googleSheetsService.addQuote(quoteData);
        }

        results.push({
          customer: customerData.name,
          success: true,
          message: `Erfolgreich importiert mit Angebot über €${customerData.quotePrice}`
        });
      } catch (error) {
        results.push({
          customer: customerData.name,
          success: false,
          message: `Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
        });
      }
    }

    setImportResults(results);
    setImporting(false);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Kunden-Import aus Screenshots
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Diese Seite importiert die 4 Kunden aus den bereitgestellten Screenshots direkt in das System.
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Zu importierende Kunden
              </Typography>
              <List>
                {customersToImport.map((customer, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemText
                        primary={customer.name}
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              Umzug am: {new Date(customer.movingDate).toLocaleDateString('de-DE')}
                            </Typography>
                            <Typography variant="body2">
                              Angebot: €{customer.quotePrice.toFixed(2)}
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              {customer.services.map((service) => (
                                <Chip
                                  key={service}
                                  label={service}
                                  size="small"
                                  sx={{ mr: 0.5 }}
                                />
                              ))}
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < customersToImport.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Import-Status
              </Typography>
              
              {importResults.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Klicken Sie auf "Import starten" um die Kunden zu importieren
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={importing ? <CircularProgress size={20} /> : <UploadIcon />}
                    onClick={handleImport}
                    disabled={importing}
                    sx={{ mt: 2 }}
                  >
                    {importing ? 'Importiere...' : 'Import starten'}
                  </Button>
                </Box>
              ) : (
                <Box>
                  <List>
                    {importResults.map((result, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {result.success ? (
                                <CheckIcon color="success" />
                              ) : (
                                <Typography color="error">✗</Typography>
                              )}
                              {result.customer}
                            </Box>
                          }
                          secondary={result.message}
                        />
                      </ListItem>
                    ))}
                  </List>
                  
                  {importResults.every(r => r.success) && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      Alle Kunden wurden erfolgreich importiert!
                    </Alert>
                  )}
                  
                  <Button
                    variant="outlined"
                    onClick={() => window.location.reload()}
                    sx={{ mt: 2 }}
                  >
                    Seite neu laden
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CustomerImportPage;