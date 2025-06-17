import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Chip, IconButton, FormControlLabel, Switch, Tabs, Tab, Badge, Card, CardContent, CircularProgress, Tooltip, Divider } from '@mui/material';
import Grid from './GridCompat';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  PlayArrow as PlayArrowIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { collection, query, orderBy, limit, getDocs, deleteDoc, doc, setDoc, addDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { parseEmail } from '../utils/emailParser';

interface FailedImport {
  id: string;
  emailData: {
    from: string;
    to?: string;
    subject: string;
    text?: string;
    html?: string;
    date: Date;
    messageId?: string;
  };
  reason: string;
  timestamp: Date;
  resolved: boolean;
  parsedData?: any;
}

interface CustomerData {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  fromAddress: string;
  toAddress: string;
  moveDate: string | null;
  apartment: {
    rooms: number;
    area: number;
    floor: number;
    hasElevator: boolean;
    type?: string;
  };
  services: string[];
  notes: string;
}

const FailedEmailRecovery: React.FC = () => {
  const [failedImports, setFailedImports] = useState<FailedImport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImport, setSelectedImport] = useState<FailedImport | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [lenientMode, setLenientMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    noName: 0,
    parseError: 0,
    duplicate: 0,
    other: 0
  });
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchResults, setBatchResults] = useState<any>(null);

  useEffect(() => {
    loadFailedImports();
  }, []);

  const loadFailedImports = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'failed_imports'),
        where('resolved', '==', false),
        orderBy('timestamp', 'desc'),
        limit(200)
      );
      
      const snapshot = await getDocs(q);
      const imports: FailedImport[] = [];
      const newStats = { total: 0, noName: 0, parseError: 0, duplicate: 0, other: 0 };
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const failedImport = {
          id: doc.id,
          ...data,
          emailData: {
            ...data.emailData,
            date: data.emailData?.date?.toDate() || new Date()
          },
          timestamp: data.timestamp?.toDate() || new Date()
        } as FailedImport;
        
        imports.push(failedImport);
        
        // Update stats
        newStats.total++;
        if (data.reason?.includes('No customer name') || data.reason?.includes('Kein Name')) {
          newStats.noName++;
        } else if (data.reason?.includes('Parse error')) {
          newStats.parseError++;
        } else if (data.reason?.includes('Duplicate')) {
          newStats.duplicate++;
        } else {
          newStats.other++;
        }
      });
      
      setFailedImports(imports);
      setStats(newStats);
    } catch (error) {
      console.error('Error loading failed imports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredImports = () => {
    let filtered = failedImports;
    
    switch (tabValue) {
      case 1: // No Name
        filtered = filtered.filter(imp => 
          imp.reason?.includes('No customer name') || imp.reason?.includes('Kein Name')
        );
        break;
      case 2: // Parse Errors
        filtered = filtered.filter(imp => imp.reason?.includes('Parse error'));
        break;
      case 3: // Duplicates
        filtered = filtered.filter(imp => imp.reason?.includes('Duplicate'));
        break;
      case 4: // Other
        filtered = filtered.filter(imp => 
          !imp.reason?.includes('No customer name') && 
          !imp.reason?.includes('Kein Name') &&
          !imp.reason?.includes('Parse error') &&
          !imp.reason?.includes('Duplicate')
        );
        break;
    }
    
    return filtered;
  };

  const handleViewDetails = (failedImport: FailedImport) => {
    setSelectedImport(failedImport);
    setEditMode(false);
    
    // Try to parse the email again
    const parsed = parseEmail(failedImport.emailData);
    
    // Initialize customer data
    setCustomerData({
      name: parsed.name || 'Unbekannt',
      firstName: parsed.firstName || '',
      lastName: parsed.lastName || '',
      email: parsed.email || '',
      phone: parsed.phone || '',
      fromAddress: parsed.fromAddress || '',
      toAddress: parsed.toAddress || '',
      moveDate: parsed.moveDate,
      apartment: {
        rooms: parsed.apartment?.rooms || 0,
        area: parsed.apartment?.area || 0,
        floor: parsed.apartment?.floor || 0,
        hasElevator: parsed.apartment?.hasElevator || false,
        type: parsed.apartment?.type || ''
      },
      services: parsed.services || ['Umzug'],
      notes: parsed.notes || ''
    });
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleSave = async () => {
    if (!selectedImport || !customerData) return;
    
    setSaving(true);
    try {
      // Validate minimum required data
      if (!lenientMode && (!customerData.name || customerData.name === 'Unbekannt')) {
        alert('Bitte geben Sie einen Kundennamen ein');
        setSaving(false);
        return;
      }

      if (!lenientMode && !customerData.email && !customerData.phone) {
        alert('Bitte geben Sie entweder eine E-Mail-Adresse oder Telefonnummer ein');
        setSaving(false);
        return;
      }

      // Generate customer number
      const customerNumber = await generateCustomerNumber();
      
      // Create customer
      const customer = {
        id: customerNumber,
        customerNumber,
        ...customerData,
        createdAt: new Date(),
        updatedAt: new Date(),
        importedAt: new Date(),
        importSource: 'manual_recovery',
        emailMessageId: selectedImport.emailData.messageId,
        originalFailureReason: selectedImport.reason
      };

      await setDoc(doc(db, 'customers', customerNumber), customer);

      // Create automatic quote
      await createAutomaticQuote(customer, selectedImport.emailData);

      // Mark as resolved
      await updateDoc(doc(db, 'failed_imports', selectedImport.id), {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: 'manual_recovery'
      });

      // Reload
      await loadFailedImports();
      setSelectedImport(null);
      setEditMode(false);
      
      alert(`Kunde ${customerNumber} erfolgreich angelegt!`);
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Fehler beim Speichern: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Möchten Sie diesen Eintrag wirklich löschen?')) return;
    
    try {
      await deleteDoc(doc(db, 'failed_imports', id));
      await loadFailedImports();
      if (selectedImport?.id === id) {
        setSelectedImport(null);
      }
    } catch (error) {
      console.error('Error deleting failed import:', error);
    }
  };

  const generateCustomerNumber = async () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    const counterRef = doc(db, 'counters', `customers_${year}_${month}`);
    
    // Get current counter value
    const counterDoc = await getDocs(query(collection(db, 'counters'), where('__name__', '==', `customers_${year}_${month}`)));
    let counter = 1;
    
    if (!counterDoc.empty) {
      counter = (counterDoc.docs[0].data().value || 0) + 1;
    }
    
    // Update counter
    await setDoc(counterRef, { value: counter });
    
    return `K${year}${month}${String(counter).padStart(3, '0')}`;
  };

  const handleBatchRetry = async () => {
    const currentImports = getFilteredImports();
    if (currentImports.length === 0) {
      alert('Keine Einträge zum Verarbeiten gefunden');
      return;
    }

    if (!window.confirm(`Möchten Sie ${currentImports.length} E-Mails erneut verarbeiten?`)) {
      return;
    }

    setBatchProcessing(true);
    setBatchResults(null);

    try {
      const response = await fetch(
        'https://europe-west1-umzugsapp.cloudfunctions.net/retryFailedImports',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            failedImportIds: currentImports.map(imp => imp.id),
            lenientMode: lenientMode
          })
        }
      );

      const result = await response.json();
      
      if (result.success) {
        setBatchResults(result.results);
        await loadFailedImports(); // Reload the list
        
        alert(
          `Batch-Verarbeitung abgeschlossen:\n` +
          `✅ Erfolgreich: ${result.results.successful}\n` +
          `❌ Fehlgeschlagen: ${result.results.failed}\n` +
          `Gesamt verarbeitet: ${result.results.processed}`
        );
      } else {
        alert('Fehler bei der Batch-Verarbeitung: ' + result.error);
      }
    } catch (error) {
      console.error('Batch retry error:', error);
      alert('Fehler bei der Batch-Verarbeitung');
    } finally {
      setBatchProcessing(false);
    }
  };

  const createAutomaticQuote = async (customer: any, emailData: any) => {
    // Base pricing
    const basePrice = 450;
    const pricePerRoom = 150;
    const pricePerSqm = 8;
    const pricePerFloor = 50;
    
    let price = basePrice;
    
    if (customer.apartment?.rooms) {
      price += customer.apartment.rooms * pricePerRoom;
    }
    
    if (customer.apartment?.area) {
      price += customer.apartment.area * pricePerSqm;
    }
    
    if (customer.apartment?.floor > 0 && !customer.apartment?.hasElevator) {
      price += customer.apartment.floor * pricePerFloor;
    }
    
    const volume = (customer.apartment?.rooms || 3) * 12;
    
    const quoteData = {
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      fromAddress: customer.fromAddress || '',
      toAddress: customer.toAddress || '',
      date: customer.moveDate || null,
      rooms: customer.apartment?.rooms || 0,
      area: customer.apartment?.area || 0,
      floor: customer.apartment?.floor || 0,
      hasElevator: customer.apartment?.hasElevator || false,
      items: [],
      services: customer.services.map(service => ({
        name: service,
        description: service,
        price: service === 'Umzug' ? price : 0
      })),
      volume: volume,
      distance: 10,
      price: price,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'manual_recovery',
      emailData: {
        subject: emailData.subject,
        date: emailData.date,
        messageId: emailData.messageId
      }
    };
    
    await addDoc(collection(db, 'quotes'), quoteData);
  };

  const filteredImports = getFilteredImports();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Failed Email Recovery
      </Typography>

      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="body2" gutterBottom>
          Diese E-Mails konnten nicht automatisch importiert werden. Sie können die Daten manuell bearbeiten und Kunden anlegen.
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={lenientMode}
              onChange={(e) => setLenientMode(e.target.checked)}
            />
          }
          label="Lenient Mode (erlaubt Import mit unvollständigen Daten)"
        />
      </Alert>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Gesamt
              </Typography>
              <Typography variant="h4">
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Kein Name
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.noName}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Parse-Fehler
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.parseError}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Duplikate
              </Typography>
              <Typography variant="h4" color="info.main">
                {stats.duplicate}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs and Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={<Badge badgeContent={stats.total} color="primary">Alle</Badge>} />
          <Tab label={<Badge badgeContent={stats.noName} color="warning">Kein Name</Badge>} />
          <Tab label={<Badge badgeContent={stats.parseError} color="error">Parse-Fehler</Badge>} />
          <Tab label={<Badge badgeContent={stats.duplicate} color="info">Duplikate</Badge>} />
          <Tab label={<Badge badgeContent={stats.other} color="default">Sonstige</Badge>} />
        </Tabs>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadFailedImports}
            disabled={loading}
          >
            Aktualisieren
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={batchProcessing ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
            onClick={handleBatchRetry}
            disabled={batchProcessing || filteredImports.length === 0}
          >
            {batchProcessing ? 'Verarbeite...' : `${filteredImports.length} Einträge erneut versuchen`}
          </Button>
        </Box>
      </Box>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Datum</TableCell>
              <TableCell>Absender</TableCell>
              <TableCell>Betreff</TableCell>
              <TableCell>Fehlergrund</TableCell>
              <TableCell align="center">Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredImports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Keine Einträge gefunden
                </TableCell>
              </TableRow>
            ) : (
              filteredImports.map((imp) => (
                <TableRow key={imp.id}>
                  <TableCell>
                    {format(imp.emailData.date, 'dd.MM.yyyy HH:mm', { locale: de })}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {imp.emailData.from}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                      {imp.emailData.subject}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={imp.reason}
                      size="small"
                      color={
                        imp.reason?.includes('No customer name') ? 'warning' :
                        imp.reason?.includes('Parse error') ? 'error' :
                        imp.reason?.includes('Duplicate') ? 'info' : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Details anzeigen">
                      <IconButton onClick={() => handleViewDetails(imp)}>
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Löschen">
                      <IconButton onClick={() => handleDelete(imp.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Details Dialog */}
      <Dialog
        open={!!selectedImport}
        onClose={() => {
          setSelectedImport(null);
          setEditMode(false);
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              E-Mail Details {editMode && '- Bearbeitungsmodus'}
            </Typography>
            {!editMode && (
              <Button
                startIcon={<EditIcon />}
                onClick={handleEdit}
                variant="outlined"
              >
                Bearbeiten
              </Button>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedImport && customerData && (
            <Box>
              {/* Original Email Info */}
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Von:</strong> {selectedImport.emailData.from}<br />
                  <strong>Betreff:</strong> {selectedImport.emailData.subject}<br />
                  <strong>Datum:</strong> {format(selectedImport.emailData.date, 'dd.MM.yyyy HH:mm', { locale: de })}<br />
                  <strong>Fehlergrund:</strong> {selectedImport.reason}
                </Typography>
              </Alert>

              {/* Customer Data Form */}
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    <PersonAddIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Kundendaten
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Vollständiger Name"
                    value={customerData.name}
                    onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                    disabled={!editMode}
                    error={!lenientMode && (!customerData.name || customerData.name === 'Unbekannt')}
                    helperText={!lenientMode && (!customerData.name || customerData.name === 'Unbekannt') ? 'Pflichtfeld' : ''}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Vorname"
                    value={customerData.firstName}
                    onChange={(e) => setCustomerData({ ...customerData, firstName: e.target.value })}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Nachname"
                    value={customerData.lastName}
                    onChange={(e) => setCustomerData({ ...customerData, lastName: e.target.value })}
                    disabled={!editMode}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="E-Mail"
                    value={customerData.email}
                    onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                    disabled={!editMode}
                    InputProps={{
                      startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                    error={!lenientMode && !customerData.email && !customerData.phone}
                    helperText={!lenientMode && !customerData.email && !customerData.phone ? 'E-Mail oder Telefon erforderlich' : ''}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Telefon"
                    value={customerData.phone}
                    onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                    disabled={!editMode}
                    InputProps={{
                      startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    <HomeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Umzugsdaten
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Von Adresse"
                    value={customerData.fromAddress}
                    onChange={(e) => setCustomerData({ ...customerData, fromAddress: e.target.value })}
                    disabled={!editMode}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nach Adresse"
                    value={customerData.toAddress}
                    onChange={(e) => setCustomerData({ ...customerData, toAddress: e.target.value })}
                    disabled={!editMode}
                    multiline
                    rows={2}
                  />
                </Grid>

                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Umzugsdatum"
                    type="date"
                    value={customerData.moveDate || ''}
                    onChange={(e) => setCustomerData({ ...customerData, moveDate: e.target.value })}
                    disabled={!editMode}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Zimmer"
                    type="number"
                    value={customerData.apartment.rooms}
                    onChange={(e) => setCustomerData({
                      ...customerData,
                      apartment: { ...customerData.apartment, rooms: parseInt(e.target.value) || 0 }
                    })}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Fläche (m²)"
                    type="number"
                    value={customerData.apartment.area}
                    onChange={(e) => setCustomerData({
                      ...customerData,
                      apartment: { ...customerData.apartment, area: parseInt(e.target.value) || 0 }
                    })}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Etage"
                    type="number"
                    value={customerData.apartment.floor}
                    onChange={(e) => setCustomerData({
                      ...customerData,
                      apartment: { ...customerData.apartment, floor: parseInt(e.target.value) || 0 }
                    })}
                    disabled={!editMode}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notizen"
                    value={customerData.notes}
                    onChange={(e) => setCustomerData({ ...customerData, notes: e.target.value })}
                    disabled={!editMode}
                    multiline
                    rows={3}
                  />
                </Grid>
              </Grid>

              {/* Original Email Text */}
              {selectedImport.emailData.text && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    <EmailIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Original E-Mail Text
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.100', maxHeight: 300, overflow: 'auto' }}>
                    <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedImport.emailData.text}
                    </Typography>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setSelectedImport(null);
            setEditMode(false);
          }}>
            Abbrechen
          </Button>
          {editMode && (
            <Button
              onClick={handleSave}
              variant="contained"
              color="primary"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              {saving ? 'Speichern...' : 'Kunde anlegen'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FailedEmailRecovery;