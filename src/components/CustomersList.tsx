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
  ListItemButton,
  Divider,
  TextField,
  InputAdornment,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  Upload as UploadIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';
import { Customer } from '../types';
import { googleSheetsPublicService as googleSheetsService } from '../services/googleSheetsPublic';

const CustomersList: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportData, setExportData] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const customers = await googleSheetsService.getCustomers();
        setCustomers(customers);
      } catch (error) {
        console.error('Fehler beim Laden der Kunden:', error);
      }
    };
    
    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.id.includes(searchTerm) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectCustomer = (customer: Customer) => {
    navigate('/create-quote', { state: { customer } });
  };

  const isUpcomingMove = (movingDate: string) => {
    const moveDate = new Date(movingDate);
    const today = new Date();
    return moveDate > today;
  };

  const handleExportClick = () => {
    const csvData = googleSheetsService.exportLocalCustomersForSheets();
    setExportData(csvData);
    setExportDialogOpen(true);
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(exportData);
      setSnackbarMessage('Daten wurden in die Zwischenablage kopiert!');
      setSnackbarOpen(true);
      setExportDialogOpen(false);
    } catch (error) {
      console.error('Fehler beim Kopieren:', error);
      setSnackbarMessage('Fehler beim Kopieren in die Zwischenablage');
      setSnackbarOpen(true);
    }
  };

  const handleClearLocalCustomers = () => {
    googleSheetsService.clearLocalCustomers();
    setExportDialogOpen(false);
    setSnackbarMessage('Lokale Kunden wurden gelöscht');
    setSnackbarOpen(true);
    // Reload customers
    window.location.reload();
  };

  const hasLocalCustomers = customers.some(customer => customer.id.startsWith('local_'));

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate('/dashboard')} sx={{ mb: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" gutterBottom>
          Kunden
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Alle Kunden verwalten und Angebote erstellen
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
          <TextField
            fullWidth
            label="Kunde suchen"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Name, ID oder Email"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          {hasLocalCustomers && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<UploadIcon />}
              onClick={handleExportClick}
              sx={{ minWidth: 200 }}
            >
              Export für Google Sheets
            </Button>
          )}
        </Box>
      </Paper>

      <Paper elevation={3}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            {filteredCustomers.length} Kunde{filteredCustomers.length !== 1 ? 'n' : ''} gefunden
          </Typography>
        </Box>
        
        <List>
          {filteredCustomers.map((customer, index) => (
            <React.Fragment key={customer.id}>
              {index > 0 && <Divider />}
              <ListItem disablePadding>
                <ListItemButton onClick={() => handleSelectCustomer(customer)}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6">
                          {customer.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {customer.id.startsWith('local_') && (
                            <Chip 
                              label="Lokal" 
                              color="warning" 
                              size="small"
                            />
                          )}
                          {isUpcomingMove(customer.movingDate) && (
                            <Chip 
                              label="Bevorstehend" 
                              color="primary" 
                              size="small"
                            />
                          )}
                          <Chip 
                            label={`${customer.apartment.rooms} Zi.`} 
                            variant="outlined" 
                            size="small"
                          />
                        </Box>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <EmailIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {customer.email}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <PhoneIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {customer.phone}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                          <HomeIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary', mt: 0.2 }} />
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Von: {customer.fromAddress}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Nach: {customer.toAddress}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Typography variant="body2" color="primary" fontWeight="medium">
                          Umzugsdatum: {new Date(customer.movingDate).toLocaleDateString('de-DE')}
                        </Typography>
                        
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          ID: {customer.id} • {customer.apartment.area} m² • 
                          {customer.apartment.floor}. Stock {customer.apartment.hasElevator ? '(Aufzug)' : '(kein Aufzug)'}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            </React.Fragment>
          ))}
        </List>

        {filteredCustomers.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              {searchTerm ? 'Keine Kunden gefunden' : 'Noch keine Kunden angelegt'}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Export Dialog */}
      <Dialog 
        open={exportDialogOpen} 
        onClose={() => setExportDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Lokale Kunden für Google Sheets exportieren
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Kopieren Sie die folgenden Daten und fügen Sie sie in Ihr Google Sheet ein:
          </Alert>
          <TextField
            multiline
            fullWidth
            value={exportData}
            rows={10}
            variant="outlined"
            InputProps={{
              readOnly: true,
              sx: { fontFamily: 'monospace', fontSize: '12px' }
            }}
          />
          <Alert severity="warning" sx={{ mt: 2 }}>
            Nach dem Export und Einfügen in Google Sheets können Sie die lokalen Kunden löschen, 
            um Duplikate zu vermeiden.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleClearLocalCustomers}
            color="error"
          >
            Lokale Kunden löschen
          </Button>
          <Button 
            onClick={handleCopyToClipboard}
            variant="contained"
            startIcon={<ContentCopyIcon />}
          >
            In Zwischenablage kopieren
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar für Benachrichtigungen */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default CustomersList;