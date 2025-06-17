import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Button, Checkbox, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Chip, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Card, CardContent, IconButton, Collapse, Tooltip, FormControlLabel, LinearProgress } from '@mui/material';
import Grid from './GridCompat';
import {
  Email as EmailIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Preview as PreviewIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Upload as UploadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface EmailPreview {
  seqno: number;
  from: string;
  subject: string;
  date: Date;
  preview: string;
  isImported: boolean;
  customerNumber?: string;
  parsedData?: any;
}

interface EmailImportPreviewProps {
  onImportComplete?: (imported: number) => void;
}

const EmailImportPreview: React.FC<EmailImportPreviewProps> = ({ onImportComplete }) => {
  const [loading, setLoading] = useState(false);
  const [emails, setEmails] = useState<EmailPreview[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<number[]>([]);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch emails from IONOS
  const fetchEmails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        'https://europe-west1-umzugsapp.cloudfunctions.net/getEmailsWithStatus?limit=20',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Fehler beim Abrufen der E-Mails');
      }

      const result = await response.json();
      
      if (result.success) {
        setEmails(result.emails.map((email: any) => ({
          ...email,
          date: new Date(email.date)
        })));
      } else {
        throw new Error(result.error || 'Unbekannter Fehler');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  // Handle row expansion
  const handleExpandRow = (seqno: number) => {
    setExpandedRows(prev => 
      prev.includes(seqno) 
        ? prev.filter(id => id !== seqno)
        : [...prev, seqno]
    );
  };

  // Handle email selection
  const handleSelectEmail = (seqno: number) => {
    setSelectedEmails(prev =>
      prev.includes(seqno)
        ? prev.filter(id => id !== seqno)
        : [...prev, seqno]
    );
  };

  // Handle select all
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const unimportedEmails = emails
        .filter(email => !email.isImported)
        .map(email => email.seqno);
      setSelectedEmails(unimportedEmails);
    } else {
      setSelectedEmails([]);
    }
  };

  // Preview email data
  const handlePreviewEmail = async (email: EmailPreview) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://europe-west1-umzugsapp.cloudfunctions.net/previewEmailData?seqno=${email.seqno}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();
      
      if (result.success) {
        setPreviewData({
          email,
          parsedData: result.parsedData
        });
        setPreviewDialogOpen(true);
      } else {
        throw new Error(result.error || 'Fehler beim Abrufen der E-Mail-Daten');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Import selected emails
  const handleImportSelected = async () => {
    if (selectedEmails.length === 0) {
      setError('Bitte wählen Sie mindestens eine E-Mail aus');
      return;
    }

    setImporting(true);
    setImportProgress(0);
    setError(null);
    setSuccessMessage(null);

    try {
      let imported = 0;
      let failed = 0;

      for (let i = 0; i < selectedEmails.length; i++) {
        const seqno = selectedEmails[i];
        setImportProgress((i / selectedEmails.length) * 100);

        try {
          const response = await fetch(
            'https://europe-west1-umzugsapp.cloudfunctions.net/importSingleEmail',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ seqno })
            }
          );

          const result = await response.json();
          
          if (result.success) {
            imported++;
            // Update email status locally
            setEmails(prev => prev.map(email => 
              email.seqno === seqno 
                ? { ...email, isImported: true, customerNumber: result.customerNumber }
                : email
            ));
          } else {
            failed++;
          }
        } catch (err) {
          failed++;
        }
      }

      setImportProgress(100);
      setSuccessMessage(`Import abgeschlossen: ${imported} erfolgreich, ${failed} fehlgeschlagen`);
      setSelectedEmails([]);
      
      if (onImportComplete) {
        onImportComplete(imported);
      }

      // Refresh email list
      await fetchEmails();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const unimportedCount = emails.filter(e => !e.isImported).length;
  const isAllSelected = unimportedCount > 0 && selectedEmails.length === unimportedCount;
  const isIndeterminate = selectedEmails.length > 0 && selectedEmails.length < unimportedCount;

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            <EmailIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            E-Mail Import Vorschau
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchEmails}
            disabled={loading}
          >
            Aktualisieren
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        {loading && !importing ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={isIndeterminate}
                    onChange={handleSelectAll}
                    disabled={importing}
                  />
                }
                label="Alle nicht importierten E-Mails auswählen"
              />
              <Button
                variant="contained"
                startIcon={importing ? <CircularProgress size={20} /> : <UploadIcon />}
                onClick={handleImportSelected}
                disabled={selectedEmails.length === 0 || importing}
              >
                {importing 
                  ? `Importiere ${selectedEmails.length} E-Mails...` 
                  : `${selectedEmails.length} ausgewählte E-Mails importieren`
                }
              </Button>
            </Box>

            {importing && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress variant="determinate" value={importProgress} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {Math.round(importProgress)}% abgeschlossen
                </Typography>
              </Box>
            )}

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" />
                    <TableCell>Status</TableCell>
                    <TableCell>Datum</TableCell>
                    <TableCell>Absender</TableCell>
                    <TableCell>Betreff</TableCell>
                    <TableCell>Aktionen</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {emails
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((email) => (
                      <React.Fragment key={email.seqno}>
                        <TableRow hover>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedEmails.includes(email.seqno)}
                              onChange={() => handleSelectEmail(email.seqno)}
                              disabled={email.isImported || importing}
                            />
                          </TableCell>
                          <TableCell>
                            {email.isImported ? (
                              <Chip
                                label={`Importiert${email.customerNumber ? ` (${email.customerNumber})` : ''}`}
                                color="success"
                                size="small"
                                icon={<CheckCircleIcon />}
                              />
                            ) : (
                              <Chip
                                label="Nicht importiert"
                                color="default"
                                size="small"
                                icon={<CancelIcon />}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {format(email.date, 'dd.MM.yyyy HH:mm', { locale: de })}
                          </TableCell>
                          <TableCell>{email.from}</TableCell>
                          <TableCell>{email.subject}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="Vorschau">
                                <IconButton
                                  size="small"
                                  onClick={() => handlePreviewEmail(email)}
                                  disabled={loading}
                                >
                                  <PreviewIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Details anzeigen">
                                <IconButton
                                  size="small"
                                  onClick={() => handleExpandRow(email.seqno)}
                                >
                                  {expandedRows.includes(email.seqno) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                            <Collapse in={expandedRows.includes(email.seqno)} timeout="auto" unmountOnExit>
                              <Box sx={{ margin: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                  E-Mail Vorschau
                                </Typography>
                                <Card variant="outlined">
                                  <CardContent>
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                      {email.preview}
                                    </Typography>
                                  </CardContent>
                                </Card>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 20]}
              component="div"
              count={emails.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="E-Mails pro Seite:"
            />
          </>
        )}
      </Paper>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>E-Mail Daten Vorschau</DialogTitle>
        <DialogContent>
          {previewData && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>E-Mail Informationen:</strong>
                </Typography>
                <Typography variant="body2">Von: {previewData.email.from}</Typography>
                <Typography variant="body2">Betreff: {previewData.email.subject}</Typography>
                <Typography variant="body2">
                  Datum: {format(previewData.email.date, 'dd.MM.yyyy HH:mm', { locale: de })}
                </Typography>
              </Grid>
              
              {previewData.parsedData && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    <strong>Extrahierte Kundendaten:</strong>
                  </Typography>
                  <Card variant="outlined">
                    <CardContent>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="body2"><strong>Name:</strong> {previewData.parsedData.name}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2"><strong>E-Mail:</strong> {previewData.parsedData.email}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2"><strong>Telefon:</strong> {previewData.parsedData.phone}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2"><strong>Umzugsdatum:</strong> {previewData.parsedData.moveDate}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2"><strong>Von:</strong> {previewData.parsedData.fromAddress}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2"><strong>Nach:</strong> {previewData.parsedData.toAddress}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2">
                            <strong>Services:</strong> {previewData.parsedData.services?.join(', ')}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Schließen</Button>
          {previewData && !previewData.email.isImported && (
            <Button
              variant="contained"
              onClick={() => {
                setSelectedEmails([previewData.email.seqno]);
                setPreviewDialogOpen(false);
                handleImportSelected();
              }}
            >
              Diese E-Mail importieren
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmailImportPreview;