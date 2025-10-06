import React, { useState, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Divider,
  Tooltip,
} from '@mui/material';
import Grid from '../components/GridCompat';
import {
  CloudUpload as UploadIcon,
  PictureAsPdf as PdfIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Person as PersonIcon,
  Euro as EuroIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  HourglassEmpty as PendingIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { ruempelPdfParserService } from '../services/ruempelPdfParserService';
import { parseRuempelPdfFrontend } from '../services/frontendPdfParser';
import { databaseService } from '../config/database.config';
import { Customer } from '../types';

interface PdfImportItem {
  id: string;
  file: File;
  status: 'pending' | 'parsing' | 'parsed' | 'creating' | 'completed' | 'error';
  parsedData?: any;
  customerId?: string;
  customerName?: string;
  error?: string;
  validation?: any;
}

const PdfBulkImportPage: React.FC = () => {
  const [items, setItems] = useState<PdfImportItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PdfImportItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newItems: PdfImportItem[] = acceptedFiles
      .filter((file) => file.type === 'application/pdf')
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        status: 'pending',
      }));

    setItems((prev) => [...prev, ...newItems]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: true,
  });

  const processAllPdfs = async () => {
    setProcessing(true);

    for (const item of items) {
      if (item.status !== 'pending') continue;

      await processSinglePdf(item);
    }

    setProcessing(false);
  };

  const processSinglePdf = async (item: PdfImportItem) => {
    try {
      // Schritt 1: PDF parsen (Frontend-Parser verwenden!)
      updateItemStatus(item.id, 'parsing');

      let parsedData: any;
      try {
        // Verwende Frontend-Parser mit pdf.js
        parsedData = await parseRuempelPdfFrontend(item.file);
        console.log('✅ Frontend PDF parsing successful:', parsedData);
      } catch (frontendError: any) {
        console.warn('⚠️ Frontend parsing failed, trying backend:', frontendError);

        // Fallback: Backend-Parser
        const parseResult = await ruempelPdfParserService.parsePDF(item.file);
        if (!parseResult.success || !parseResult.data) {
          updateItem(item.id, {
            status: 'error',
            error: parseResult.error || 'Parsing fehlgeschlagen',
          });
          return;
        }
        parsedData = parseResult.data;
      }

      updateItem(item.id, {
        status: 'parsed',
        parsedData: parsedData,
        validation: { valid: true, errors: [], warnings: [] },
      });

      // Schritt 2: Kunde erstellen
      updateItemStatus(item.id, 'creating');

      const customerId = await createCustomerFromParsedData(parsedData);

      if (!customerId) {
        updateItem(item.id, {
          status: 'error',
          error: 'Kunde konnte nicht erstellt werden',
        });
        return;
      }

      // Schritt 3: Angebot erstellen
      const { offerService } = await import('../services/offerService');
      await offerService.createOfferFromPDF(parsedData, customerId, item.file.name);

      updateItem(item.id, {
        status: 'completed',
        customerId,
        customerName: `${parsedData.customer?.firstName || ''} ${parsedData.customer?.lastName || ''}`.trim(),
      });

      console.log('✅ PDF import completed:', item.file.name);
    } catch (error: any) {
      console.error('❌ Error processing PDF:', error);
      updateItem(item.id, {
        status: 'error',
        error: error.message || 'Unbekannter Fehler',
      });
    }
  };

  const createCustomerFromParsedData = async (parsedData: any): Promise<string | null> => {
    try {
      console.log('🔍 Checking for existing customer...');
      console.log('Parsed data:', parsedData);

      // Prüfe ob Kunde bereits existiert
      let existingCustomerId: string | null = null;
      try {
        existingCustomerId = await ruempelPdfParserService.findExistingCustomer(parsedData);
      } catch (findError) {
        console.warn('⚠️ Error finding existing customer (continuing):', findError);
      }

      if (existingCustomerId) {
        console.log('✅ Existing customer found:', existingCustomerId);
        return existingCustomerId;
      }

      console.log('📝 Creating new customer...');

      // Erstelle neuen Kunden (auch wenn Daten unvollständig sind)
      const customerData: Partial<Customer> = {
        name:
          `${parsedData.customer?.firstName || ''} ${parsedData.customer?.lastName || ''}`.trim() ||
          'Unbekannt',
        customerNumber: parsedData.customerNumber,
        email: parsedData.customer?.email || '', // Kann leer sein
        phone: parsedData.customer?.phone || '', // Kann leer sein
        fromAddress: parsedData.customer?.fullAddress || '',
        toAddress: '',
        movingDate: '',
        apartment: {
          rooms: 0,
          area: parseInt(parsedData.service?.objectSize?.replace(/\D/g, '') || '0'),
          floor: 0,
          hasElevator: false,
        },
        services: parsedData.service?.type ? [parsedData.service.type] : [],
        notes: `PDF Import: ${parsedData.documentType || 'Dokument'}\n\nAngebotsnummer: ${parsedData.offerNumber || 'N/A'}\nDatum: ${parsedData.offerDate || 'N/A'}\n\nLeistung: ${parsedData.service?.type || 'N/A'}\nObjektgröße: ${parsedData.service?.objectSize || 'N/A'}`,
        source: 'PDF Bulk Import',
        tags: ['PDF Import', 'Rümpel Schmiede'],
        currentPhase: 'angebot_erstellt',
        estimatedPrice: parsedData.pricing?.grossAmount,
      };

      const customerId = `K${Date.now()}`;

      // Stelle sicher dass alle Pflichtfelder vorhanden sind
      const newCustomer: any = {
        id: customerId,
        name: customerData.name || 'Unbekannt',
        email: customerData.email || '',
        phone: customerData.phone || '',
        movingDate: null, // NULL statt leerer String für Datum
        fromAddress: customerData.fromAddress || '',
        toAddress: customerData.toAddress || '',
        apartment: customerData.apartment || {
          rooms: 0,
          area: 0,
          floor: 0,
          hasElevator: false,
        },
        services: customerData.services || [],
        notes: customerData.notes,
        source: customerData.source,
        tags: customerData.tags,
        currentPhase: customerData.currentPhase,
        estimatedPrice: customerData.estimatedPrice,
        createdAt: new Date(),
      };

      console.log('📝 Creating customer:', newCustomer.name, 'ID:', customerId);
      console.log('Customer data:', JSON.stringify(newCustomer, null, 2));

      try {
        await databaseService.addCustomer(newCustomer);
        console.log('✅ New customer created:', customerId, newCustomer.name);
        return customerId;
      } catch (dbError: any) {
        console.error('❌ Database error creating customer:', dbError);
        console.error('Error details:', dbError.message, dbError.stack);
        throw new Error(`Kunde konnte nicht in DB erstellt werden: ${dbError.message}`);
      }
    } catch (error: any) {
      console.error('❌ Error creating customer:', error);
      console.error('Full error:', error);
      return null;
    }
  };

  const updateItem = (id: string, updates: Partial<PdfImportItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const updateItemStatus = (id: string, status: PdfImportItem['status']) => {
    updateItem(id, { status });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const viewDetails = (item: PdfImportItem) => {
    setSelectedItem(item);
    setDetailsOpen(true);
  };

  const goToCustomer = (customerId: string) => {
    navigate(`/customer/${customerId}`);
  };

  const getStatusIcon = (status: PdfImportItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'parsing':
      case 'creating':
        return <CircularProgress size={24} />;
      default:
        return <PendingIcon color="action" />;
    }
  };

  const getStatusColor = (status: PdfImportItem['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'error':
        return 'error';
      case 'parsing':
      case 'creating':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: PdfImportItem['status']) => {
    const labels: Record<string, string> = {
      pending: 'Ausstehend',
      parsing: 'Parst...',
      parsed: 'Geparst',
      creating: 'Erstellt Kunde...',
      completed: 'Abgeschlossen',
      error: 'Fehler',
    };
    return labels[status] || status;
  };

  const pendingCount = items.filter((i) => i.status === 'pending').length;
  const completedCount = items.filter((i) => i.status === 'completed').length;
  const errorCount = items.filter((i) => i.status === 'error').length;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          PDF Bulk-Import
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Lade mehrere PDFs gleichzeitig hoch. Das System erstellt automatisch Kunden und
          Angebote.
        </Typography>
      </Box>

      {/* Statistiken */}
      {items.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h4">{items.length}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Gesamt
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="warning.main">
                  {pendingCount}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Ausstehend
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="success.main">
                  {completedCount}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Erfolgreich
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="error.main">
                  {errorCount}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Fehler
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Upload Area */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 6,
          mb: 3,
          border: '3px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          bgcolor: isDragActive ? 'action.hover' : 'background.paper',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'action.hover',
            transform: 'scale(1.01)',
          },
        }}
      >
        <input {...getInputProps()} />
        <UploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          {isDragActive ? 'PDFs hier ablegen...' : 'PDFs hierher ziehen'}
        </Typography>
        <Typography variant="body1" color="textSecondary" gutterBottom>
          oder klicken zum Auswählen
        </Typography>
        <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
          📄 Rümpel Schmiede Angebots-PDFs
          <br />
          System erstellt automatisch Kunden + Angebote
        </Typography>
      </Paper>

      {/* Action Buttons */}
      {items.length > 0 && (
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={processing ? <CircularProgress size={20} /> : <AddIcon />}
            onClick={processAllPdfs}
            disabled={processing || pendingCount === 0}
          >
            {processing ? 'Verarbeite...' : `${pendingCount} PDFs verarbeiten`}
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => setItems([])}
            disabled={processing}
          >
            Alle entfernen
          </Button>
        </Box>
      )}

      {/* Import-Liste */}
      {items.length > 0 && (
        <Paper>
          <List>
            {items.map((item, index) => (
              <React.Fragment key={item.id}>
                {index > 0 && <Divider />}
                <ListItem>
                  <ListItemIcon>{getStatusIcon(item.status)}</ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PdfIcon fontSize="small" />
                        <Typography variant="body1">{item.file.name}</Typography>
                        <Chip
                          label={getStatusText(item.status)}
                          size="small"
                          color={getStatusColor(item.status) as any}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        {item.customerName && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <PersonIcon fontSize="small" />
                            <Typography variant="body2">{item.customerName}</Typography>
                          </Box>
                        )}
                        {item.parsedData?.pricing?.grossAmount && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EuroIcon fontSize="small" />
                            <Typography variant="body2">
                              {item.parsedData.pricing.grossAmount.toFixed(2)} €
                            </Typography>
                          </Box>
                        )}
                        {item.error && (
                          <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
                            ❌ {item.error}
                          </Typography>
                        )}
                        {item.validation?.warnings?.length > 0 && (
                          <Typography variant="caption" color="warning.main">
                            ⚠️ {item.validation.warnings.length} Warnungen
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {item.status === 'completed' && item.customerId && (
                      <Tooltip title="Kunde öffnen">
                        <IconButton
                          color="primary"
                          onClick={() => goToCustomer(item.customerId!)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {(item.status === 'parsed' || item.status === 'completed') && (
                      <Tooltip title="Details">
                        <IconButton onClick={() => viewDetails(item)}>
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {item.status === 'pending' && (
                      <Tooltip title="Entfernen">
                        <IconButton color="error" onClick={() => removeItem(item.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {items.length === 0 && (
        <Alert severity="info">
          Noch keine PDFs hochgeladen. Ziehe PDFs in den Upload-Bereich oben.
        </Alert>
      )}

      {/* Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>PDF-Details</DialogTitle>
        <DialogContent>
          {selectedItem?.parsedData && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Kundendaten
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={`${selectedItem.parsedData.customer?.firstName || ''} ${selectedItem.parsedData.customer?.lastName || ''}`.trim()}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Adresse"
                  value={selectedItem.parsedData.customer?.fullAddress || 'Nicht gefunden'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6" gutterBottom>
                  Angebotsdaten
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Angebotsnummer"
                  value={selectedItem.parsedData.offerNumber || 'N/A'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Bruttobetrag"
                  value={
                    selectedItem.parsedData.pricing?.grossAmount
                      ? `${selectedItem.parsedData.pricing.grossAmount.toFixed(2)} €`
                      : 'N/A'
                  }
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Leistung"
                  value={selectedItem.parsedData.service?.type || 'N/A'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              {selectedItem.parsedData.service?.rooms && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Räume
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedItem.parsedData.service.rooms.map((room: string, i: number) => (
                      <Chip key={i} label={room} size="small" />
                    ))}
                  </Box>
                </Grid>
              )}
              {selectedItem.validation && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Validierung
                  </Typography>
                  {selectedItem.validation.errors?.length > 0 && (
                    <Alert severity="error" sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        {selectedItem.validation.errors.join(', ')}
                      </Typography>
                    </Alert>
                  )}
                  {selectedItem.validation.warnings?.length > 0 && (
                    <Alert severity="warning">
                      <Typography variant="body2">
                        {selectedItem.validation.warnings.join(', ')}
                      </Typography>
                    </Alert>
                  )}
                  {selectedItem.validation.valid && (
                    <Alert severity="success">Alle Pflichtfelder vorhanden</Alert>
                  )}
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Schließen</Button>
          {selectedItem?.customerId && (
            <Button
              variant="contained"
              onClick={() => {
                setDetailsOpen(false);
                goToCustomer(selectedItem.customerId!);
              }}
            >
              Kunde öffnen
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PdfBulkImportPage;
