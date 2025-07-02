import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Tooltip,
  Alert,
  Snackbar,
  useTheme,
  alpha,
  Checkbox,
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  Link as LinkIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  ArrowBack as BackIcon,
  Delete as DeleteIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  IndeterminateCheckBox as IndeterminateCheckBoxIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { databaseService as googleSheetsService } from '../config/database.config';
import { firebaseService } from '../services/firebaseService';
import { prepareArbeitsscheinData, generateArbeitsscheinHTML } from '../services/arbeitsscheinService';

interface Vehicle {
  id: string;
  name: string;
  type: string;
  licensePlate?: string;
}

interface DispositionCustomer {
  id: string;
  customerNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  moveDate: string;
  fromAddress: string;
  toAddress: string;
  status: 'accepted' | 'in_planning' | 'assigned' | 'completed';
  assignedVehicles?: Vehicle[];
  quoteId: string;
  createdAt: string;
}

interface ShareLink {
  id: string;
  customerId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  quoteId: string;
}

const DispositionPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [customers, setCustomers] = useState<DispositionCustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<DispositionCustomer | null>(null);
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [availableVehicles] = useState<Vehicle[]>([
    { id: '1', name: 'LKW 1', type: 'LKW', licensePlate: 'B-RL 1234' },
    { id: '2', name: 'LKW 2', type: 'LKW', licensePlate: 'B-RL 5678' },
    { id: '3', name: 'Transporter 1', type: 'Transporter', licensePlate: 'B-RL 9012' },
    { id: '4', name: 'Transporter 2', type: 'Transporter', licensePlate: 'B-RL 3456' },
  ]);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);

  // Load customers with accepted quotes
  useEffect(() => {
    loadDispositionCustomers();
  }, []);

  const loadDispositionCustomers = async () => {
    try {
      console.log('🔍 Lade Dispositionsdaten...');
      
      // Load quotes and customers from Google Sheets
      const [quotes, allCustomers] = await Promise.all([
        googleSheetsService.getQuotes(),
        googleSheetsService.getCustomers()
      ]);
      
      console.log(`📊 Gefundene Angebote: ${quotes.length}`);
      console.log(`👥 Gefundene Kunden: ${allCustomers.length}`);
      
      // Debug: Zeige alle Quote-Status
      const statusCounts = quotes.reduce((acc: any, quote: any) => {
        acc[quote.status] = (acc[quote.status] || 0) + 1;
        return acc;
      }, {});
      console.log('📈 Status-Verteilung:', statusCounts);
      
      // Filter für angenommene (accepted) und bestätigte (confirmed) Angebote
      const acceptedQuotes = quotes.filter((quote: any) => 
        quote.status === 'accepted' || quote.status === 'confirmed'
      );
      
      console.log(`✅ Angenommene/Bestätigte Angebote: ${acceptedQuotes.length}`);
      acceptedQuotes.forEach((q: any) => {
        console.log(`- Angebot ${q.id}: Status=${q.status}, Kunde=${q.customerId}, Erstellt=${q.createdAt}`);
      });
      
      const dispositionCustomers = acceptedQuotes.map((quote: any) => {
        const customer = allCustomers.find((c: any) => c.id === quote.customerId);
        if (!customer) return null;
        
        // Load saved disposition data from localStorage
        const savedDispositions = JSON.parse(localStorage.getItem('dispositions') || '{}');
        const savedData = savedDispositions[quote.id] || {};
        
        return {
          id: customer.id,
          customerNumber: customer.customerNumber,
          firstName: '',
          lastName: '',
          email: customer.email,
          phone: customer.phone,
          moveDate: customer.movingDate || new Date().toISOString(),
          fromAddress: customer.fromAddress || '',
          toAddress: customer.toAddress || '',
          status: savedData.status || 'accepted' as const,
          quoteId: quote.id,
          createdAt: quote.createdAt,
          assignedVehicles: savedData.assignedVehicles || [],
        };
      }).filter(Boolean);
      
      const validCustomers = dispositionCustomers.filter(c => c !== null) as DispositionCustomer[];
      console.log(`🎯 Gültige Dispositionskunden: ${validCustomers.length}`);
      
      setCustomers(validCustomers);
    } catch (error) {
      console.error('❌ Fehler beim Laden der Dispositionsdaten:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'warning';
      case 'in_planning':
        return 'info';
      case 'assigned':
        return 'primary';
      case 'completed':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Angenommen';
      case 'in_planning':
        return 'In Planung';
      case 'assigned':
        return 'Zugewiesen';
      case 'completed':
        return 'Abgeschlossen';
      default:
        return status;
    }
  };

  const handleOpenVehicleDialog = (customer: DispositionCustomer) => {
    setSelectedCustomer(customer);
    setSelectedVehicles(customer.assignedVehicles?.map(v => v.id) || []);
    setVehicleDialogOpen(true);
  };

  const handleAssignVehicles = () => {
    if (!selectedCustomer) return;

    const assignedVehicles = availableVehicles.filter(v => 
      selectedVehicles.includes(v.id)
    );

    const updatedCustomer = {
      ...selectedCustomer,
      assignedVehicles,
      status: assignedVehicles.length > 0 ? 'assigned' as const : 'in_planning' as const,
    };

    // Save to localStorage
    const savedDispositions = JSON.parse(localStorage.getItem('dispositions') || '{}');
    savedDispositions[selectedCustomer.quoteId] = {
      status: updatedCustomer.status,
      assignedVehicles: updatedCustomer.assignedVehicles,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem('dispositions', JSON.stringify(savedDispositions));

    setCustomers(customers.map(c => 
      c.id === selectedCustomer.id ? updatedCustomer : c
    ));

    setVehicleDialogOpen(false);
    setSnackbarMessage('Fahrzeuge erfolgreich zugewiesen');
    setSnackbarOpen(true);
  };

  const handleGenerateLink = async (customer: DispositionCustomer) => {
    setSelectedCustomer(customer);
    
    try {
      // First, get the quote and full customer data
      const [quotes, customers] = await Promise.all([
        googleSheetsService.getQuotes(),
        googleSheetsService.getCustomers()
      ]);
      
      const quote = quotes.find((q: any) => q.id === customer.quoteId);
      const fullCustomer = customers.find((c: any) => c.id === customer.id);
      
      if (!quote || !fullCustomer) {
        throw new Error('Angebot oder Kunde nicht gefunden');
      }
      
      // Generate Arbeitsschein HTML
      const arbeitsscheinData = prepareArbeitsscheinData(quote, fullCustomer);
      const arbeitsscheinHTML = generateArbeitsscheinHTML(arbeitsscheinData);
      
      // Create share link in Firebase with Arbeitsschein
      const shareLink = await firebaseService.createShareLink(
        customer.id,
        customer.quoteId,
        'disposition', // You can add user ID here if available
        {
          arbeitsscheinHTML,
          arbeitsscheinData: JSON.stringify(arbeitsscheinData)
        }
      );
      
      // Generate URL
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/share/${shareLink.token}`;
      setGeneratedLink(link);
      setLinkDialogOpen(true);
    } catch (error) {
      console.error('Fehler beim Generieren des Links:', error);
      setSnackbarMessage('Fehler beim Generieren des Links');
      setSnackbarOpen(true);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setSnackbarMessage('Link in Zwischenablage kopiert');
    setSnackbarOpen(true);
  };

  // Selection functions
  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomers(prev => {
      if (prev.includes(customerId)) {
        return prev.filter(id => id !== customerId);
      } else {
        return [...prev, customerId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map(c => c.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedCustomers.length === 0) return;
    
    const confirmMessage = selectedCustomers.length === 1 
      ? 'Möchten Sie die ausgewählte Disposition wirklich löschen?'
      : `Möchten Sie die ${selectedCustomers.length} ausgewählten Dispositionen wirklich löschen?`;
    
    if (window.confirm(confirmMessage)) {
      try {
        // Remove from localStorage
        const savedDispositions = JSON.parse(localStorage.getItem('dispositions') || '{}');
        selectedCustomers.forEach(customerId => {
          const customer = customers.find(c => c.id === customerId);
          if (customer) {
            delete savedDispositions[customer.quoteId];
          }
        });
        localStorage.setItem('dispositions', JSON.stringify(savedDispositions));
        
        // Update local state
        setCustomers(customers.filter(c => !selectedCustomers.includes(c.id)));
        setSelectedCustomers([]);
        setSelectMode(false);
        
        setSnackbarMessage(
          selectedCustomers.length === 1 
            ? 'Disposition erfolgreich gelöscht' 
            : `${selectedCustomers.length} Dispositionen erfolgreich gelöscht`
        );
        setSnackbarOpen(true);
      } catch (error) {
        console.error('Fehler beim Löschen:', error);
        setSnackbarMessage('Fehler beim Löschen der Dispositionen');
        setSnackbarOpen(true);
      }
    }
  };

  const handleDeleteCustomer = async (customerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (window.confirm('Möchten Sie diese Disposition wirklich löschen?')) {
      try {
        // Remove from localStorage
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
          const savedDispositions = JSON.parse(localStorage.getItem('dispositions') || '{}');
          delete savedDispositions[customer.quoteId];
          localStorage.setItem('dispositions', JSON.stringify(savedDispositions));
        }
        
        // Update local state
        setCustomers(customers.filter(c => c.id !== customerId));
        setSnackbarMessage('Disposition erfolgreich gelöscht');
        setSnackbarOpen(true);
      } catch (error) {
        console.error('Fehler beim Löschen:', error);
        setSnackbarMessage('Fehler beim Löschen der Disposition');
        setSnackbarOpen(true);
      }
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: theme.palette.background.default,
      pb: { xs: 10, sm: 8 },
    }}>
      <Container maxWidth="xl" sx={{ pt: { xs: 2, sm: 3 } }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <IconButton onClick={() => navigate('/')} sx={{ mr: 1 }}>
                  <BackIcon />
                </IconButton>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  Disposition
                </Typography>
              </Stack>
              <Stack direction="row" spacing={2}>
                {!selectMode ? (
                  <Button
                    variant="outlined"
                    startIcon={<CheckBoxIcon />}
                    onClick={() => {
                      setSelectMode(true);
                      setSelectedCustomers([]);
                    }}
                  >
                    Auswählen
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setSelectMode(false);
                        setSelectedCustomers([]);
                      }}
                    >
                      Abbrechen
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={
                        selectedCustomers.length === customers.length && customers.length > 0
                          ? <CheckBoxIcon />
                          : selectedCustomers.length > 0
                          ? <IndeterminateCheckBoxIcon />
                          : <CheckBoxOutlineBlankIcon />
                      }
                      onClick={handleSelectAll}
                    >
                      {selectedCustomers.length === customers.length && customers.length > 0
                        ? 'Alle abwählen'
                        : 'Alle auswählen'}
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={handleDeleteSelected}
                      disabled={selectedCustomers.length === 0}
                    >
                      {selectedCustomers.length > 0 
                        ? `${selectedCustomers.length} löschen`
                        : 'Löschen'}
                    </Button>
                  </>
                )}
              </Stack>
            </Stack>
            <Typography variant="body1" color="text.secondary">
              Verwaltung von angenommenen Angeboten und Fahrzeugzuweisungen
            </Typography>
          </Box>

          {/* Stats Cards */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 2,
            mb: 4,
          }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Angenommen
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                {customers.filter(c => c.status === 'accepted').length}
              </Typography>
            </Paper>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                In Planung
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
                {customers.filter(c => c.status === 'in_planning').length}
              </Typography>
            </Paper>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Zugewiesen
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                {customers.filter(c => c.status === 'assigned').length}
              </Typography>
            </Paper>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Abgeschlossen
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                {customers.filter(c => c.status === 'completed').length}
              </Typography>
            </Paper>
          </Box>

          {/* Customer Table */}
          <Paper sx={{ 
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(10px)',
          }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {selectMode && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          indeterminate={selectedCustomers.length > 0 && selectedCustomers.length < customers.length}
                          checked={customers.length > 0 && selectedCustomers.length === customers.length}
                          onChange={handleSelectAll}
                          color="primary"
                        />
                      </TableCell>
                    )}
                    <TableCell>Kundennr.</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Umzugsdatum</TableCell>
                    <TableCell>Von</TableCell>
                    <TableCell>Nach</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Fahrzeuge</TableCell>
                    <TableCell align="right">Aktionen</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow 
                      key={customer.id}
                      hover
                      onClick={() => {
                        if (selectMode) {
                          toggleCustomerSelection(customer.id);
                        }
                      }}
                      sx={{
                        cursor: selectMode ? 'pointer' : 'default',
                        backgroundColor: selectMode && selectedCustomers.includes(customer.id) 
                          ? alpha(theme.palette.primary.main, 0.08)
                          : 'inherit',
                      }}
                    >
                      {selectMode && (
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedCustomers.includes(customer.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleCustomerSelection(customer.id);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            color="primary"
                          />
                        </TableCell>
                      )}
                      <TableCell>{customer.customerNumber}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {customer.firstName} {customer.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {customer.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {format(new Date(customer.moveDate), 'dd.MM.yyyy', { locale: de })}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap>
                          {customer.fromAddress}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap>
                          {customer.toAddress}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(customer.status)}
                          color={getStatusColor(customer.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {customer.assignedVehicles && customer.assignedVehicles.length > 0 ? (
                          <Stack direction="row" spacing={0.5}>
                            {customer.assignedVehicles.map((vehicle) => (
                              <Chip
                                key={vehicle.id}
                                label={vehicle.name}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Keine zugewiesen
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Details anzeigen">
                            <IconButton 
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/customers/${customer.id}`);
                              }}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Fahrzeuge zuweisen">
                            <IconButton 
                              size="small"
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenVehicleDialog(customer);
                              }}
                            >
                              <CarIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Link generieren">
                            <IconButton 
                              size="small"
                              color="secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateLink(customer);
                              }}
                            >
                              <LinkIcon />
                            </IconButton>
                          </Tooltip>
                          {!selectMode && (
                            <Tooltip title="Disposition löschen">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => handleDeleteCustomer(customer.id, e)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </motion.div>
      </Container>

      {/* Vehicle Assignment Dialog */}
      <Dialog 
        open={vehicleDialogOpen} 
        onClose={() => setVehicleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Fahrzeuge zuweisen</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Wählen Sie die Fahrzeuge aus, die für diesen Umzug eingeplant werden sollen.
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Fahrzeuge</InputLabel>
              <Select
                multiple
                value={selectedVehicles}
                onChange={(e) => setSelectedVehicles(e.target.value as string[])}
                renderValue={(selected) => (
                  <Stack direction="row" flexWrap="wrap" gap={0.5}>
                    {selected.map((value) => {
                      const vehicle = availableVehicles.find(v => v.id === value);
                      return vehicle ? (
                        <Chip key={value} label={vehicle.name} size="small" />
                      ) : null;
                    })}
                  </Stack>
                )}
              >
                {availableVehicles.map((vehicle) => (
                  <MenuItem key={vehicle.id} value={vehicle.id}>
                    <Box>
                      <Typography variant="body2">{vehicle.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {vehicle.type} - {vehicle.licensePlate}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVehicleDialogOpen(false)}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleAssignVehicles}
            variant="contained"
            startIcon={<CarIcon />}
          >
            Zuweisen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Link Generation Dialog */}
      <Dialog 
        open={linkDialogOpen} 
        onClose={() => setLinkDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Mitarbeiter-Link generiert</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Dieser Link ist 7 Tage gültig und ermöglicht Mitarbeitern den Zugriff auf Kundendaten und Fotos.
            </Alert>
            <TextField
              fullWidth
              value={generatedLink}
              InputProps={{
                readOnly: true,
              }}
              variant="outlined"
              label="Link"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialogOpen(false)}>
            Schließen
          </Button>
          <Button 
            onClick={handleCopyLink}
            variant="contained"
            startIcon={<LinkIcon />}
          >
            Link kopieren
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default DispositionPage;