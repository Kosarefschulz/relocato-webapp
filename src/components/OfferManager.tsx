import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Alert,
  TextField,
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material';
import Grid from './GridCompat';
import {
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  CloudUpload as CloudUploadIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Euro as EuroIcon,
} from '@mui/icons-material';
import { offerService, Offer } from '../services/offerService';
import { ruempelPdfParserService } from '../services/ruempelPdfParserService';

interface OfferManagerProps {
  customerId: string;
  onOfferCreated?: (offer: Offer) => void;
}

const OfferManager: React.FC<OfferManagerProps> = ({ customerId, onOfferCreated }) => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string>('');
  const [tabValue, setTabValue] = useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadOffers();
  }, [customerId]);

  const loadOffers = async () => {
    setLoading(true);
    try {
      const data = await offerService.getOffersByCustomer(customerId);
      setOffers(data);
    } catch (error) {
      console.error('❌ Error loading offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (offerId: string, newStatus: Offer['status']) => {
    try {
      await offerService.updateOfferStatus(offerId, newStatus);
      loadOffers();
    } catch (error) {
      console.error('❌ Error updating status:', error);
      alert('Fehler beim Aktualisieren des Status');
    }
  };

  const handlePDFUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setParsing(true);
    setValidationMessage('');

    try {
      console.log('📄 Uploading and parsing PDF...');

      const result = await ruempelPdfParserService.parsePDFAndCreateOffer(file, customerId);

      if (!result.success) {
        setValidationMessage(`❌ Fehler: ${result.error}`);
        return;
      }

      if (result.validation) {
        const formatted = ruempelPdfParserService.formatValidationResults(result.validation);
        setValidationMessage(formatted);

        if (!result.validation.valid) {
          return;
        }
      }

      if (result.offer) {
        setValidationMessage(`✅ Angebot ${result.offer.offer_number} erfolgreich erstellt!`);
        loadOffers();
        setUploadDialogOpen(false);

        if (onOfferCreated) {
          onOfferCreated(result.offer);
        }
      }
    } catch (error: any) {
      console.error('❌ Error uploading PDF:', error);
      setValidationMessage(`❌ Fehler: ${error.message}`);
    } finally {
      setParsing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const viewDetails = (offer: Offer) => {
    setSelectedOffer(offer);
    setDetailsOpen(true);
  };

  const getStatusIcon = (status: Offer['status']) => {
    switch (status) {
      case 'angenommen':
        return <CheckCircleIcon />;
      case 'abgelehnt':
      case 'storniert':
        return <CancelIcon />;
      case 'abgelaufen':
        return <ScheduleIcon />;
      default:
        return <DescriptionIcon />;
    }
  };

  const getStatusColor = (status: Offer['status']) => {
    switch (status) {
      case 'offen':
        return 'info';
      case 'verhandlung':
        return 'warning';
      case 'angenommen':
        return 'success';
      case 'abgelehnt':
      case 'storniert':
        return 'error';
      case 'abgelaufen':
        return 'default';
      default:
        return 'default';
    }
  };

  const openOffers = offers.filter((o) => o.status === 'offen' || o.status === 'verhandlung');
  const acceptedOffers = offers.filter((o) => o.status === 'angenommen');
  const closedOffers = offers.filter((o) =>
    ['abgelehnt', 'abgelaufen', 'storniert'].includes(o.status)
  );

  const renderOffersList = (offersList: Offer[]) => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Angebot Nr.</TableCell>
            <TableCell>Datum</TableCell>
            <TableCell>Gültig bis</TableCell>
            <TableCell align="right">Betrag</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="center">Aktionen</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {offersList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                <Typography variant="body2" color="textSecondary">
                  Keine Angebote vorhanden
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            offersList.map((offer) => (
              <TableRow key={offer.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getStatusIcon(offer.status)}
                    <Typography variant="body2" fontWeight="bold">
                      {offer.offer_number}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {new Date(offer.offer_date).toLocaleDateString('de-DE')}
                </TableCell>
                <TableCell>
                  {offer.valid_until
                    ? new Date(offer.valid_until).toLocaleDateString('de-DE')
                    : '-'}
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="bold">
                    {offer.gross_amount.toFixed(2)} €
                  </Typography>
                </TableCell>
                <TableCell>
                  <FormControl size="small" fullWidth>
                    <Select
                      value={offer.status}
                      onChange={(e) =>
                        handleStatusChange(offer.id, e.target.value as Offer['status'])
                      }
                      variant="outlined"
                    >
                      <MenuItem value="offen">Offen</MenuItem>
                      <MenuItem value="verhandlung">In Verhandlung</MenuItem>
                      <MenuItem value="angenommen">Angenommen</MenuItem>
                      <MenuItem value="abgelehnt">Abgelehnt</MenuItem>
                      <MenuItem value="abgelaufen">Abgelaufen</MenuItem>
                      <MenuItem value="storniert">Storniert</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Details anzeigen">
                    <IconButton size="small" onClick={() => viewDetails(offer)}>
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <DescriptionIcon sx={{ fontSize: 32, mr: 2 }} />
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          Angebotsverwaltung
        </Typography>
        <Button
          variant="contained"
          startIcon={<CloudUploadIcon />}
          onClick={() => setUploadDialogOpen(true)}
        >
          PDF hochladen
        </Button>
      </Box>

      {/* Statistiken */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="info.main">
                    {openOffers.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Offene Angebote
                  </Typography>
                </Box>
                <DescriptionIcon sx={{ fontSize: 40, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="success.main">
                    {acceptedOffers.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Angenommen
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 40, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4">
                    {acceptedOffers
                      .reduce((sum, o) => sum + o.gross_amount, 0)
                      .toFixed(0)}{' '}
                    €
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Gesamtwert
                  </Typography>
                </Box>
                <EuroIcon sx={{ fontSize: 40, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label={`Offen (${openOffers.length})`} />
          <Tab label={`Angenommen (${acceptedOffers.length})`} />
          <Tab label={`Geschlossen (${closedOffers.length})`} />
        </Tabs>
      </Paper>

      {/* Listen */}
      <Paper>
        {tabValue === 0 && renderOffersList(openOffers)}
        {tabValue === 1 && renderOffersList(acceptedOffers)}
        {tabValue === 2 && renderOffersList(closedOffers)}
      </Paper>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => !parsing && setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Angebot-PDF hochladen</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Laden Sie ein Rümpel Schmiede Angebots-PDF hoch. Das System extrahiert automatisch alle
            relevanten Daten.
          </Alert>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={handlePDFUpload}
            disabled={parsing}
          />

          <Button
            fullWidth
            variant="outlined"
            startIcon={parsing ? null : <CloudUploadIcon />}
            onClick={() => fileInputRef.current?.click()}
            disabled={parsing}
            sx={{ mb: 2 }}
          >
            {parsing ? 'Verarbeite PDF...' : 'PDF auswählen'}
          </Button>

          {validationMessage && (
            <Paper sx={{ p: 2, bgcolor: 'grey.100', mt: 2 }}>
              <Typography
                variant="body2"
                component="pre"
                sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}
              >
                {validationMessage}
              </Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} disabled={parsing}>
            Schließen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Angebots-Details</DialogTitle>
        <DialogContent>
          {selectedOffer && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Angebotsnummer
                </Typography>
                <Typography variant="body1">{selectedOffer.offer_number}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Status
                </Typography>
                <Chip
                  label={selectedOffer.status}
                  color={getStatusColor(selectedOffer.status)}
                  icon={getStatusIcon(selectedOffer.status)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Angebotsdatum
                </Typography>
                <Typography variant="body1">
                  {new Date(selectedOffer.offer_date).toLocaleDateString('de-DE')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Gültig bis
                </Typography>
                <Typography variant="body1">
                  {selectedOffer.valid_until
                    ? new Date(selectedOffer.valid_until).toLocaleDateString('de-DE')
                    : 'Unbegrenzt'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" color="textSecondary">
                  Nettobetrag
                </Typography>
                <Typography variant="body1">
                  {selectedOffer.net_amount?.toFixed(2) || '0.00'} €
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" color="textSecondary">
                  MwSt ({selectedOffer.vat_rate}%)
                </Typography>
                <Typography variant="body1">
                  {selectedOffer.vat_amount?.toFixed(2) || '0.00'} €
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" color="textSecondary">
                  Bruttobetrag
                </Typography>
                <Typography variant="h6" color="primary">
                  {selectedOffer.gross_amount.toFixed(2)} €
                </Typography>
              </Grid>
              {selectedOffer.service_details && (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle1" gutterBottom>
                      Leistungsdetails
                    </Typography>
                  </Grid>
                  {selectedOffer.service_details.type && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Leistungstyp
                      </Typography>
                      <Typography variant="body1">
                        {selectedOffer.service_details.type}
                      </Typography>
                    </Grid>
                  )}
                  {selectedOffer.service_details.rooms && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Räume
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                        {selectedOffer.service_details.rooms.map((room, i) => (
                          <Chip key={i} label={room} size="small" />
                        ))}
                      </Box>
                    </Grid>
                  )}
                </>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Schließen</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OfferManager;
