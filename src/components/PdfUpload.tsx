import React, { useState, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Card,
  CardContent,
  Divider,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import Grid from './GridCompat';
import {
  CloudUpload as CloudUploadIcon,
  PictureAsPdf as PdfIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Euro as EuroIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { Customer } from '../types';
import { databaseService } from '../config/database.config';
import { pdfParserService, ParsedPDFData } from '../services/pdfParserService';

interface PdfFile {
  name: string;
  file: File;
  parsed?: ParsedPDFData;
  status: 'pending' | 'parsed' | 'error' | 'imported';
  error?: string;
  customer?: Partial<Customer>;
}

interface PdfUploadProps {
  customerId?: string;
  onParsed?: (data: ParsedPDFData) => void;
  onCustomerCreated?: (customerId: string) => void;
}

const PdfUpload: React.FC<PdfUploadProps> = ({ customerId, onParsed, onCustomerCreated }) => {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<PdfFile | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [servicesDialogOpen, setServicesDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const newFiles: PdfFile[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];

      // Validiere PDF
      const validation = pdfParserService.validatePDFFile(file);
      if (!validation.valid) {
        alert(`${file.name}: ${validation.error}`);
        continue;
      }

      newFiles.push({
        name: file.name,
        file,
        status: 'pending',
      });
    }

    setFiles([...files, ...newFiles]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFiles = async () => {
    setProcessing(true);
    const updatedFiles = [...files];

    for (let i = 0; i < updatedFiles.length; i++) {
      if (updatedFiles[i].status === 'pending') {
        try {
          console.log(`📄 Processing PDF: ${updatedFiles[i].name}`);

          // Parse PDF
          const result = await pdfParserService.parsePDF(
            updatedFiles[i].file,
            customerId
          );

          if (!result.success || !result.data) {
            throw new Error(result.error || 'Failed to parse PDF');
          }

          updatedFiles[i].parsed = result.data;

          // Erstelle Kundenobjekt aus geparsten Daten
          const customer: Partial<Customer> = {
            name: result.data.customerName || 'Unbekannt',
            email: result.data.customerEmail || '',
            phone: result.data.customerPhone || '',
            services: result.data.services.map(s => s.name),
            notes: `PDF Import: ${updatedFiles[i].name}\n\nRechnungsnummer: ${result.data.invoiceNumber || 'N/A'}\nDatum: ${result.data.date || 'N/A'}`,
            source: 'PDF Import',
            tags: ['PDF Import'],
          };

          // Wenn Preis vorhanden, füge hinzu
          if (result.data.totalPrice) {
            customer.estimatedPrice = result.data.totalPrice;
          }

          updatedFiles[i].customer = customer;
          updatedFiles[i].status = 'parsed';

          // Callback
          if (onParsed) {
            onParsed(result.data);
          }
        } catch (error) {
          console.error(`❌ Error processing ${updatedFiles[i].name}:`, error);
          updatedFiles[i].status = 'error';
          updatedFiles[i].error = (error as Error).message;
        }
      }
    }

    setFiles(updatedFiles);
    setProcessing(false);
  };

  const handleEditCustomer = (file: PdfFile) => {
    if (!file.customer) return;
    setSelectedFile(file);
    setEditingCustomer({ ...file.customer });
    setEditDialogOpen(true);
  };

  const handleShowServices = (file: PdfFile) => {
    if (!file.parsed?.services) return;
    setSelectedFile(file);
    setServicesDialogOpen(true);
  };

  const handleSaveCustomer = () => {
    if (!selectedFile || !editingCustomer) return;

    const updatedFiles = files.map((f) => {
      if (f.name === selectedFile.name) {
        return {
          ...f,
          customer: editingCustomer,
        };
      }
      return f;
    });

    setFiles(updatedFiles);
    setEditDialogOpen(false);
    setSelectedFile(null);
    setEditingCustomer(null);
  };

  const handleImportCustomer = async (file: PdfFile) => {
    if (!file.customer) return;

    try {
      // Check for duplicates
      const existingCustomers = await databaseService.getCustomers();
      const duplicate = existingCustomers.find(
        (c) =>
          (c.email && c.email === file.customer!.email) ||
          (c.phone && c.phone === file.customer!.phone)
      );

      if (duplicate) {
        if (
          !window.confirm(
            `Ein Kunde mit dieser E-Mail/Telefonnummer existiert bereits (${duplicate.name}). Trotzdem importieren?`
          )
        ) {
          return;
        }
      }

      // Generate ID
      const newCustomerId = `K${Date.now()}`;

      // Create customer
      const newCustomer: Customer = {
        ...file.customer as Customer,
        id: newCustomerId,
        createdAt: new Date(),
      };

      await databaseService.addCustomer(newCustomer);

      // Update file status
      const updatedFiles = files.map((f) => {
        if (f.name === file.name) {
          return {
            ...f,
            status: 'imported' as const,
          };
        }
        return f;
      });

      setFiles(updatedFiles);

      // Callback
      if (onCustomerCreated) {
        onCustomerCreated(newCustomerId);
      }

      alert(`✅ Kunde "${newCustomer.name}" erfolgreich importiert!`);
    } catch (error) {
      console.error('Error importing customer:', error);
      alert('Fehler beim Importieren: ' + (error as Error).message);
    }
  };

  const handleImportAll = async () => {
    const parsedFiles = files.filter((f) => f.status === 'parsed' && f.customer);
    if (parsedFiles.length === 0) {
      alert('Keine Dateien zum Importieren verfügbar');
      return;
    }

    if (!window.confirm(`Möchten Sie ${parsedFiles.length} Kunden importieren?`)) {
      return;
    }

    setProcessing(true);
    let successful = 0;
    let failed = 0;

    for (const file of parsedFiles) {
      try {
        await handleImportCustomer(file);
        successful++;
      } catch (error) {
        failed++;
      }
    }

    setProcessing(false);

    alert(`Import abgeschlossen:\n✅ Erfolgreich: ${successful}\n❌ Fehlgeschlagen: ${failed}`);
  };

  const handleRemoveFile = (fileName: string) => {
    setFiles(files.filter((f) => f.name !== fileName));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'parsed':
        return <CheckCircleIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'imported':
        return <CheckCircleIcon color="primary" />;
      default:
        return <PdfIcon color="action" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'parsed':
        return 'success';
      case 'error':
        return 'error';
      case 'imported':
        return 'primary';
      default:
        return 'default';
    }
  };

  const pendingFiles = files.filter((f) => f.status === 'pending').length;
  const parsedFiles = files.filter((f) => f.status === 'parsed').length;
  const importedFiles = files.filter((f) => f.status === 'imported').length;

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Laden Sie PDF-Dateien (Rechnungen, Angebote) hoch, um automatisch Kunden- und
          Leistungsdaten zu extrahieren.
        </Typography>
      </Alert>

      {/* Upload Area */}
      <Paper
        sx={{
          p: 4,
          mb: 3,
          border: '2px dashed',
          borderColor: 'divider',
          textAlign: 'center',
          cursor: 'pointer',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'action.hover',
          },
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          PDF Dateien hier ablegen oder klicken zum Auswählen
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Unterstützt werden PDF-Dateien bis 10MB (mehrere Dateien möglich)
        </Typography>
      </Paper>

      {/* Stats */}
      {files.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Gesamt
                </Typography>
                <Typography variant="h4">{files.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Ausstehend
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {pendingFiles}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Bereit
                </Typography>
                <Typography variant="h4" color="success.main">
                  {parsedFiles}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Importiert
                </Typography>
                <Typography variant="h4" color="primary">
                  {importedFiles}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Action Buttons */}
      {files.length > 0 && (
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            onClick={processFiles}
            disabled={processing || pendingFiles === 0}
            startIcon={processing ? <CircularProgress size={20} /> : <DescriptionIcon />}
          >
            {processing ? 'Verarbeite...' : `${pendingFiles} PDFs verarbeiten`}
          </Button>
          {!customerId && (
            <Button
              variant="contained"
              color="success"
              onClick={handleImportAll}
              disabled={processing || parsedFiles === 0}
              startIcon={<SaveIcon />}
            >
              Alle importieren ({parsedFiles})
            </Button>
          )}
          <Button
            variant="outlined"
            color="error"
            onClick={() => setFiles([])}
            disabled={processing}
          >
            Alle entfernen
          </Button>
        </Box>
      )}

      {/* File List */}
      {files.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <List>
            {files.map((file, index) => (
              <React.Fragment key={file.name}>
                {index > 0 && <Divider />}
                <ListItem>
                  <ListItemIcon>{getStatusIcon(file.status)}</ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">{file.name}</Typography>
                        <Chip
                          label={file.status}
                          size="small"
                          color={getStatusColor(file.status) as any}
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        {file.error && (
                          <Typography variant="body2" color="error">
                            ❌ {file.error}
                          </Typography>
                        )}
                        {file.customer && (
                          <Box sx={{ mt: 1 }}>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <PersonIcon fontSize="small" />
                                  <Typography variant="body2">
                                    {file.customer.name || 'Kein Name'}
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <EmailIcon fontSize="small" />
                                  <Typography variant="body2">
                                    {file.customer.email || 'Keine E-Mail'}
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <PhoneIcon fontSize="small" />
                                  <Typography variant="body2">
                                    {file.customer.phone || 'Kein Telefon'}
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <EuroIcon fontSize="small" />
                                  <Typography variant="body2">
                                    {file.customer.estimatedPrice
                                      ? `${file.customer.estimatedPrice.toFixed(2)} €`
                                      : 'Kein Preis'}
                                  </Typography>
                                </Box>
                              </Grid>
                              {file.parsed?.services && file.parsed.services.length > 0 && (
                                <Grid item xs={12}>
                                  <Button
                                    size="small"
                                    startIcon={<AssignmentIcon />}
                                    onClick={() => handleShowServices(file)}
                                  >
                                    {file.parsed.services.length} Leistungen anzeigen
                                  </Button>
                                </Grid>
                              )}
                            </Grid>
                          </Box>
                        )}
                      </>
                    }
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {file.status === 'parsed' && (
                      <>
                        <Tooltip title="Bearbeiten">
                          <IconButton onClick={() => handleEditCustomer(file)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        {!customerId && (
                          <Tooltip title="Importieren">
                            <IconButton
                              color="primary"
                              onClick={() => handleImportCustomer(file)}
                            >
                              <SaveIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </>
                    )}
                    <Tooltip title="Entfernen">
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveFile(file.name)}
                        disabled={file.status === 'imported'}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Kundendaten bearbeiten</DialogTitle>
        <DialogContent>
          {editingCustomer && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Name"
                  value={editingCustomer.name || ''}
                  onChange={(e) =>
                    setEditingCustomer({
                      ...editingCustomer,
                      name: e.target.value,
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="E-Mail"
                  value={editingCustomer.email || ''}
                  onChange={(e) =>
                    setEditingCustomer({
                      ...editingCustomer,
                      email: e.target.value,
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Telefon"
                  value={editingCustomer.phone || ''}
                  onChange={(e) =>
                    setEditingCustomer({
                      ...editingCustomer,
                      phone: e.target.value,
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Geschätzter Preis (€)"
                  type="number"
                  value={editingCustomer.estimatedPrice || ''}
                  onChange={(e) =>
                    setEditingCustomer({
                      ...editingCustomer,
                      estimatedPrice: parseFloat(e.target.value) || undefined,
                    })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notizen"
                  value={editingCustomer.notes || ''}
                  onChange={(e) =>
                    setEditingCustomer({
                      ...editingCustomer,
                      notes: e.target.value,
                    })
                  }
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={handleSaveCustomer} variant="contained" color="primary">
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      {/* Services Dialog */}
      <Dialog
        open={servicesDialogOpen}
        onClose={() => setServicesDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Extrahierte Leistungen</DialogTitle>
        <DialogContent>
          {selectedFile?.parsed?.services && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Leistung</TableCell>
                    <TableCell>Beschreibung</TableCell>
                    <TableCell align="right">Menge</TableCell>
                    <TableCell align="right">Preis</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedFile.parsed.services.map((service, index) => (
                    <TableRow key={index}>
                      <TableCell>{service.name}</TableCell>
                      <TableCell>{service.description || '-'}</TableCell>
                      <TableCell align="right">{service.quantity || '-'}</TableCell>
                      <TableCell align="right">
                        {service.price ? `${service.price.toFixed(2)} €` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {selectedFile?.parsed?.rawText && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Rohdaten (Vorschau):
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.100', maxHeight: 200, overflow: 'auto' }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                  {selectedFile.parsed.rawText.substring(0, 500)}...
                </Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setServicesDialogOpen(false)}>Schließen</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PdfUpload;
