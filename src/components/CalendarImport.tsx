import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Upload as UploadIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';

const CalendarImport: React.FC = () => {
  const [importing, setImporting] = useState(false);
  const [fileData, setFileData] = useState('');
  const [fileType, setFileType] = useState<'csv' | 'ics' | null>(null);
  const [fileName, setFileName] = useState('');
  const [startDate, setStartDate] = useState('2025-06-01');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'csv' || extension === 'ics') {
        setFileType(extension as 'csv' | 'ics');
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
          setFileData(e.target?.result as string);
        };
        reader.readAsText(file);
      } else {
        setError('Bitte wählen Sie eine CSV- oder ICS-Datei aus');
      }
    }
  };

  const handleImport = async () => {
    if (!fileData) {
      setError('Bitte wählen Sie eine Datei aus');
      return;
    }

    setImporting(true);
    setError('');
    setResult(null);

    try {
      const endpoint = fileType === 'ics' 
        ? 'https://europe-west1-umzugsapp.cloudfunctions.net/importFromICS'
        : 'https://europe-west1-umzugsapp.cloudfunctions.net/importFromCalendarCSV';

      const body = fileType === 'ics'
        ? { icsData: fileData, startDate }
        : { csvData: fileData, startDate };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Import fehlgeschlagen');
      }
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          <CalendarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Kalender Import
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Importieren Sie Kundentermine aus Ihrem Kalender (CSV oder ICS/iCal Format)
        </Typography>
      </Paper>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            So exportieren Sie Ihren Kalender:
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="1. Google Kalender"
                secondary="Einstellungen → Import & Export → Exportieren"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="2. Outlook"
                secondary="Datei → Öffnen & Exportieren → Import/Export → In Datei exportieren → CSV"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="3. Apple Kalender"
                secondary="Ablage → Exportieren → Exportieren (ICS-Format)"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Ab Datum importieren"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="Nur Termine ab diesem Datum werden importiert"
              sx={{ mb: 3 }}
            />

            <input
              accept=".csv,.ics"
              style={{ display: 'none' }}
              id="calendar-file-upload"
              type="file"
              onChange={handleFileUpload}
            />
            <label htmlFor="calendar-file-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadIcon />}
                fullWidth
                sx={{ mb: 2 }}
              >
                Kalender-Datei auswählen (CSV oder ICS)
              </Button>
            </label>

            {fileData && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {fileName} geladen - {fileType?.toUpperCase()}-Format erkannt
              </Alert>
            )}

            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={importing ? <CircularProgress size={20} /> : <CalendarIcon />}
              onClick={handleImport}
              disabled={importing || !fileData}
            >
              {importing ? 'Importiere...' : 'Kalender importieren'}
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {result && (
            <Box>
              <Divider sx={{ my: 3 }} />
              <Alert severity="success" icon={<CheckIcon />} sx={{ mb: 2 }}>
                Import erfolgreich abgeschlossen!
              </Alert>
              
              <Typography variant="h6" gutterBottom>
                Import-Statistik:
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemText 
                    primary={`${result.totalEvents} Termine gefunden`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary={`${result.imported} neue Kunden importiert`}
                    secondary="Mit automatisch erstellten Angeboten"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary={`${result.duplicates} Duplikate übersprungen`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary={`${result.skipped} Termine ohne Kundendaten`}
                  />
                </ListItem>
              </List>

              {result.importedCustomers && result.importedCustomers.length > 0 && (
                <>
                  <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                    Importierte Kunden:
                  </Typography>
                  <List dense>
                    {result.importedCustomers.slice(0, 10).map((customer: any, index: number) => (
                      <ListItem key={index}>
                        <ListItemText 
                          primary={`${customer.customerNumber} - ${customer.name}`}
                          secondary={`Umzugstermin: ${customer.moveDate}`}
                        />
                      </ListItem>
                    ))}
                    {result.importedCustomers.length > 10 && (
                      <ListItem>
                        <ListItemText 
                          primary={`... und ${result.importedCustomers.length - 10} weitere`}
                        />
                      </ListItem>
                    )}
                  </List>
                </>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default CalendarImport;