import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Collapse,
  Tooltip,
} from '@mui/material';
import Grid from './GridCompat';
import {
  CloudUpload as CloudUploadIcon,
  PictureAsPdf as PdfIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Euro as EuroIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { Customer } from '../types';
import { pdfParserService, ParsedPDFData } from '../services/pdfParserService';
import { databaseService } from '../config/database.config';

interface CustomerPdfParserProps {
  customer: Customer;
  onDataUpdated?: () => void;
}

const CustomerPdfParser: React.FC<CustomerPdfParserProps> = ({ customer, onDataUpdated }) => {
  const [processing, setProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedPDFData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [servicesExpanded, setServicesExpanded] = useState(true);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validiere PDF
    const validation = pdfParserService.validatePDFFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setProcessing(true);
    setError(null);
    setParsedData(null);

    try {
      console.log('📄 Parsing PDF for customer:', customer.id);

      // Parse PDF
      const result = await pdfParserService.parsePDFAndAssignToCustomer(file, customer.id);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to parse PDF');
      }

      setParsedData(result.data);

      // Callback
      if (onDataUpdated) {
        onDataUpdated();
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('❌ Error parsing PDF:', err);
      setError(err.message || 'Failed to parse PDF');
    } finally {
      setProcessing(false);
    }
  };

  const handleApplyData = async () => {
    if (!parsedData) return;

    try {
      setProcessing(true);

      // Aktualisiere Kundendaten
      const updates: Partial<Customer> = {};

      if (parsedData.customerEmail && !customer.email) {
        updates.email = parsedData.customerEmail;
      }

      if (parsedData.customerPhone && !customer.phone) {
        updates.phone = parsedData.customerPhone;
      }

      if (parsedData.totalPrice) {
        updates.estimatedPrice = parsedData.totalPrice;
      }

      if (parsedData.services.length > 0) {
        // Füge neue Services hinzu (ohne Duplikate)
        const existingServices = customer.services || [];
        const newServices = parsedData.services.map((s) => s.name);
        updates.services = [...new Set([...existingServices, ...newServices])];
      }

      // Füge Notiz mit PDF-Info hinzu
      const pdfNote = `\n\n--- PDF Import (${new Date().toLocaleDateString()}) ---\nRechnungsnummer: ${parsedData.invoiceNumber || 'N/A'}\nDatum: ${parsedData.date || 'N/A'}\nPreis: ${parsedData.totalPrice ? `${parsedData.totalPrice.toFixed(2)} €` : 'N/A'}`;

      updates.notes = (customer.notes || '') + pdfNote;

      if (Object.keys(updates).length > 0) {
        await databaseService.updateCustomer(customer.id, updates);

        // Callback
        if (onDataUpdated) {
          onDataUpdated();
        }

        alert('✅ Daten erfolgreich übernommen!');
      } else {
        alert('ℹ️ Keine neuen Daten zum Übernehmen gefunden.');
      }
    } catch (err: any) {
      console.error('❌ Error applying data:', err);
      alert('Fehler beim Übernehmen der Daten: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Laden Sie eine PDF-Rechnung oder ein Angebot hoch, um automatisch Preise, Leistungen und
          weitere Informationen zu extrahieren.
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
          accept=".pdf"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          disabled={processing}
        />
        <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          PDF hochladen und parsen
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Rechnungen, Angebote oder andere PDFs (max. 10MB)
        </Typography>
      </Paper>

      {/* Processing */}
      {processing && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
          <CircularProgress size={40} sx={{ mr: 2 }} />
          <Typography variant="body1">PDF wird verarbeitet...</Typography>
        </Box>
      )}

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      )}

      {/* Parsed Data */}
      {parsedData && (
        <Box>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">PDF erfolgreich geparst!</Typography>
            </Box>

            <Grid container spacing={3}>
              {/* Customer Info */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Kundeninformationen
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <PersonIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Name"
                          secondary={parsedData.customerName || 'Nicht gefunden'}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <EmailIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary="E-Mail"
                          secondary={parsedData.customerEmail || 'Nicht gefunden'}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <PhoneIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Telefon"
                          secondary={parsedData.customerPhone || 'Nicht gefunden'}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Invoice Info */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Rechnungsinformationen
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <ReceiptIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Rechnungsnummer"
                          secondary={parsedData.invoiceNumber || 'Nicht gefunden'}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CalendarIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Datum"
                          secondary={parsedData.date || 'Nicht gefunden'}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <EuroIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Gesamtpreis"
                          secondary={
                            parsedData.totalPrice
                              ? `${parsedData.totalPrice.toFixed(2)} €`
                              : 'Nicht gefunden'
                          }
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Services */}
              {parsedData.services.length > 0 && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <AssignmentIcon sx={{ mr: 1 }} />
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ flexGrow: 1 }}>
                          Extrahierte Leistungen ({parsedData.services.length})
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => setServicesExpanded(!servicesExpanded)}
                        >
                          {servicesExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </Box>
                      <Collapse in={servicesExpanded}>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Leistung</TableCell>
                                <TableCell>Beschreibung</TableCell>
                                <TableCell align="right">Menge</TableCell>
                                <TableCell align="right">Preis</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {parsedData.services.map((service, index) => (
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
                      </Collapse>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Raw Text Preview */}
              {parsedData.rawText && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Rohdaten (Vorschau):
                      </Typography>
                      <Paper
                        sx={{
                          p: 2,
                          bgcolor: 'grey.100',
                          maxHeight: 150,
                          overflow: 'auto',
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.75rem' }}
                        >
                          {parsedData.rawText.substring(0, 500)}...
                        </Typography>
                      </Paper>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<CheckCircleIcon />}
                onClick={handleApplyData}
                disabled={processing}
              >
                Daten übernehmen
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setParsedData(null);
                  setError(null);
                }}
              >
                Verwerfen
              </Button>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Existing Data */}
      {customer.estimatedPrice && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Aktueller Preis:</strong> {customer.estimatedPrice.toFixed(2)} €
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default CustomerPdfParser;
