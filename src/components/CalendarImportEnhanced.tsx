import React, { useState, useCallback } from 'react';
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
  ListItemButton,
  ListItemText,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Checkbox,
  FormControlLabel,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Upload as UploadIcon,
  CheckCircle as CheckIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Add as AddIcon,
  FileUpload as FileUploadIcon,
} from '@mui/icons-material';
import Grid from './GridCompat';
import { useDropzone } from 'react-dropzone';
import Fuse from 'fuse.js';
import { Customer } from '../types';
import { databaseService } from '../config/database.config';
import { parseICSFile, CalendarEvent } from '../utils/icsParser';

interface CustomerMatch {
  customer: Customer;
  score: number;
  matchReasons: string[];
}

interface EventPreview {
  event: CalendarEvent;
  selected: boolean;
  matches: CustomerMatch[];
  selectedCustomerId?: string;
  isNewCustomer?: boolean;
}

const CalendarImportEnhanced: React.FC = () => {
  const theme = useTheme();
  const [importing, setImporting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [fileData, setFileData] = useState('');
  const [fileName, setFileName] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [events, setEvents] = useState<EventPreview[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  // Load customers on mount
  React.useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const loadedCustomers = await databaseService.getCustomers();
      setCustomers(loadedCustomers);
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  };

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFileData(content);
        parseICSContent(content);
      };
      reader.readAsText(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/calendar': ['.ics', '.ical'],
    },
    maxFiles: 1,
  });

  const parseICSContent = async (content: string) => {
    setParsing(true);
    setError('');
    try {
      const parsedEvents = await parseICSFile(content);
      
      // Filter events by start date
      const filteredEvents = parsedEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= new Date(startDate);
      });

      // Find matches for each event
      const eventsWithMatches = filteredEvents.map(event => ({
        event,
        selected: true,
        matches: findCustomerMatches(event),
        selectedCustomerId: undefined,
        isNewCustomer: false,
      }));

      setEvents(eventsWithMatches);
      setShowPreview(true);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Parsen der ICS-Datei');
    } finally {
      setParsing(false);
    }
  };

  const findCustomerMatches = (event: CalendarEvent): CustomerMatch[] => {
    const matches: CustomerMatch[] = [];

    // Setup Fuse for fuzzy name matching
    const nameFuse = new Fuse(customers, {
      keys: ['name'],
      threshold: 0.3,
    });

    // Search by name
    if (event.customerName && event.customerName !== 'Unbekannt') {
      const nameResults = nameFuse.search(event.customerName);
      nameResults.forEach(result => {
        const match: CustomerMatch = {
          customer: result.item,
          score: 1 - (result.score || 0),
          matchReasons: [`Name: ${Math.round((1 - (result.score || 0)) * 100)}% Übereinstimmung`],
        };
        matches.push(match);
      });
    }

    // Exact matches for phone and email
    customers.forEach(customer => {
      let score = 0;
      const reasons: string[] = [];

      // Phone match
      if (event.phone && customer.phone) {
        const cleanEventPhone = event.phone.replace(/\D/g, '');
        const cleanCustomerPhone = customer.phone.replace(/\D/g, '');
        if (cleanEventPhone === cleanCustomerPhone) {
          score += 0.9;
          reasons.push('Telefonnummer stimmt überein');
        }
      }

      // Email match
      if (event.email && customer.email) {
        if (event.email.toLowerCase() === customer.email.toLowerCase()) {
          score += 0.9;
          reasons.push('E-Mail stimmt überein');
        }
      }

      // Address similarity
      if (event.location && customer.fromAddress) {
        const locationLower = event.location.toLowerCase();
        const addressLower = customer.fromAddress.toLowerCase();
        if (locationLower.includes(addressLower) || addressLower.includes(locationLower)) {
          score += 0.5;
          reasons.push('Adresse ähnlich');
        }
      }

      if (score > 0) {
        // Check if we already have this customer in matches
        const existingIndex = matches.findIndex(m => m.customer.id === customer.id);
        if (existingIndex >= 0) {
          matches[existingIndex].score = Math.max(matches[existingIndex].score, score);
          matches[existingIndex].matchReasons = [...new Set([...matches[existingIndex].matchReasons, ...reasons])];
        } else {
          matches.push({ customer, score, matchReasons: reasons });
        }
      }
    });

    // Sort by score
    return matches.sort((a, b) => b.score - a.score).slice(0, 5);
  };

  const handleEventToggle = (index: number) => {
    const updated = [...events];
    updated[index].selected = !updated[index].selected;
    setEvents(updated);
  };

  const handleCustomerSelect = (eventIndex: number, customerId?: string) => {
    const updated = [...events];
    updated[eventIndex].selectedCustomerId = customerId;
    updated[eventIndex].isNewCustomer = !customerId;
    setEvents(updated);
  };

  const handleImport = async () => {
    const selectedEvents = events.filter(e => e.selected);
    if (selectedEvents.length === 0) {
      setError('Bitte wählen Sie mindestens einen Termin aus');
      return;
    }

    setImporting(true);
    setError('');
    setImportProgress(0);

    try {
      const stats = {
        totalEvents: selectedEvents.length,
        imported: 0,
        matched: 0,
        newCustomers: 0,
        errors: 0,
      };

      for (let i = 0; i < selectedEvents.length; i++) {
        const eventPreview = selectedEvents[i];
        setImportProgress((i / selectedEvents.length) * 100);

        try {
          if (eventPreview.isNewCustomer) {
            // Create new customer
            await createCustomerFromEvent(eventPreview.event);
            stats.newCustomers++;
            stats.imported++;
          } else if (eventPreview.selectedCustomerId) {
            // Update existing customer
            await updateCustomerWithEvent(eventPreview.selectedCustomerId, eventPreview.event);
            stats.matched++;
            stats.imported++;
          }
        } catch (err) {
          console.error('Error importing event:', err);
          stats.errors++;
        }
      }

      setImportProgress(100);
      setResult(stats);
      setShowPreview(false);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Import');
    } finally {
      setImporting(false);
    }
  };

  const createCustomerFromEvent = async (event: CalendarEvent) => {
    // Create customer from event data
    const customerData = {
      name: event.customerName || 'Unbekannt',
      phone: event.phone || '',
      email: event.email || '',
      fromAddress: event.location || '',
      toAddress: '',
      movingDate: event.date.toISOString(),
      source: 'Apple Calendar Import',
      notes: event.description || '',
      apartment: {
        rooms: 3,
        area: 60,
        floor: 0,
        hasElevator: false
      },
      services: ['Umzug']
    } as Omit<Customer, 'id'>;

    const customerId = await databaseService.addCustomer(customerData);
    
    // Also create a calendar event if the method exists
    if ('addCalendarEvent' in databaseService && typeof databaseService.addCalendarEvent === 'function' && typeof customerId === 'string') {
      await databaseService.addCalendarEvent({
      title: event.summary,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      type: 'imported',
      customerId: customerId,
      customerName: event.customerName,
      description: event.description,
      location: event.location,
      source: 'apple-calendar',
      originalEventId: event.uid,
      metadata: {
        importedFrom: 'ics',
        originalUid: event.uid
      }
    });
    }
  };

  const updateCustomerWithEvent = async (customerId: string, event: CalendarEvent) => {
    // Update customer with calendar event data if needed
    const customer = await databaseService.getCustomer(customerId);
    if (customer) {
      const updates: Partial<Customer> = {
        movingDate: event.date.toISOString(),
      };

      if (!customer.phone && event.phone) {
        updates.phone = event.phone;
      }
      if (!customer.email && event.email) {
        updates.email = event.email;
      }

      await databaseService.updateCustomer(customerId, updates);
    }

    // Create calendar event linked to existing customer
    if ('addCalendarEvent' in databaseService && typeof databaseService.addCalendarEvent === 'function') {
      await databaseService.addCalendarEvent({
        title: event.summary,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        type: 'imported',
        customerId: customerId,
        customerName: event.customerName || customer?.name,
        description: event.description,
        location: event.location,
        source: 'apple-calendar',
        originalEventId: event.uid,
        metadata: {
          importedFrom: 'ics',
          originalUid: event.uid
        }
      });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          <CalendarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Kalender Import (Erweitert)
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Importieren Sie Termine aus Apple Calendar und ordnen Sie diese automatisch Ihren Kunden zu
        </Typography>
      </Paper>

      {!showPreview && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
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

              <Box
                {...getRootProps()}
                sx={{
                  border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`,
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: isDragActive ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                <input {...getInputProps()} />
                <FileUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {isDragActive
                    ? 'Datei hier ablegen...'
                    : 'ICS-Datei hier ablegen oder klicken zum Auswählen'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Unterstützt werden .ics und .ical Dateien aus Apple Calendar
                </Typography>
              </Box>

              {fileName && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {fileName} geladen
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                So exportieren Sie aus Apple Calendar:
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="1. Öffnen Sie die Kalender-App auf Ihrem Mac"
                    secondary="Stellen Sie sicher, dass der gewünschte Kalender sichtbar ist"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="2. Wählen Sie Ablage → Exportieren → Exportieren..."
                    secondary="Oder verwenden Sie die Tastenkombination ⌘+E"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="3. Speichern Sie die .ics Datei"
                    secondary="Wählen Sie einen Speicherort und klicken Sie auf 'Exportieren'"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </>
      )}

      {parsing && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              Kalender-Import Vorschau ({events.filter(e => e.selected).length} von {events.length} ausgewählt)
            </Typography>
            <IconButton onClick={() => setShowPreview(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {events.map((eventPreview, index) => (
            <Accordion key={index} defaultExpanded={index === 0}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                  <Checkbox
                    checked={eventPreview.selected}
                    onChange={() => handleEventToggle(index)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1">
                      {eventPreview.event.summary}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {eventPreview.event.date.toLocaleDateString('de-DE', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Typography>
                  </Box>
                  {eventPreview.matches.length > 0 && (
                    <Chip
                      label={`${eventPreview.matches.length} Übereinstimmungen`}
                      color="primary"
                      size="small"
                    />
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Event-Details
                    </Typography>
                    <List dense>
                      {eventPreview.event.customerName && (
                        <ListItem>
                          <PersonIcon sx={{ mr: 1 }} />
                          <ListItemText primary={eventPreview.event.customerName} />
                        </ListItem>
                      )}
                      {eventPreview.event.phone && (
                        <ListItem>
                          <PhoneIcon sx={{ mr: 1 }} />
                          <ListItemText primary={eventPreview.event.phone} />
                        </ListItem>
                      )}
                      {eventPreview.event.email && (
                        <ListItem>
                          <EmailIcon sx={{ mr: 1 }} />
                          <ListItemText primary={eventPreview.event.email} />
                        </ListItem>
                      )}
                      {eventPreview.event.location && (
                        <ListItem>
                          <HomeIcon sx={{ mr: 1 }} />
                          <ListItemText primary={eventPreview.event.location} />
                        </ListItem>
                      )}
                    </List>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Kundenauswahl
                    </Typography>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={eventPreview.isNewCustomer}
                          onChange={(e) => handleCustomerSelect(index, e.target.checked ? undefined : eventPreview.matches[0]?.customer.id)}
                        />
                      }
                      label="Als neuen Kunden anlegen"
                    />
                    {!eventPreview.isNewCustomer && (
                      <List dense>
                        {eventPreview.matches.map((match, matchIndex) => (
                          <ListItemButton
                            key={matchIndex}
                            selected={eventPreview.selectedCustomerId === match.customer.id}
                            onClick={() => handleCustomerSelect(index, match.customer.id)}
                          >
                            <ListItemText
                              primary={match.customer.name}
                              secondary={match.matchReasons.join(', ')}
                            />
                            <Chip
                              label={`${Math.round(match.score * 100)}%`}
                              size="small"
                              color={match.score > 0.8 ? 'success' : match.score > 0.5 ? 'warning' : 'default'}
                            />
                          </ListItemButton>
                        ))}
                      </List>
                    )}
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>Abbrechen</Button>
          <Button
            variant="contained"
            onClick={handleImport}
            disabled={importing || events.filter(e => e.selected).length === 0}
            startIcon={importing ? <CircularProgress size={20} /> : <CheckIcon />}
          >
            {importing ? 'Importiere...' : 'Import starten'}
          </Button>
        </DialogActions>
      </Dialog>

      {importing && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress variant="determinate" value={importProgress} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Import läuft... {Math.round(importProgress)}%
          </Typography>
        </Box>
      )}

      {result && (
        <Alert severity="success" sx={{ mt: 2 }}>
          <Typography variant="subtitle1">Import erfolgreich!</Typography>
          <List dense>
            <ListItem>
              <ListItemText primary={`${result.imported} Termine importiert`} />
            </ListItem>
            <ListItem>
              <ListItemText primary={`${result.matched} bestehende Kunden zugeordnet`} />
            </ListItem>
            <ListItem>
              <ListItemText primary={`${result.newCustomers} neue Kunden angelegt`} />
            </ListItem>
            {result.errors > 0 && (
              <ListItem>
                <ListItemText primary={`${result.errors} Fehler aufgetreten`} />
              </ListItem>
            )}
          </List>
        </Alert>
      )}
    </Box>
  );
};

export default CalendarImportEnhanced;