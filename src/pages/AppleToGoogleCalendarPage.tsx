import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  LinearProgress,
  Chip,
  Stack,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Event as EventIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CalendarMonth as CalendarIcon,
  Delete as DeleteIcon,
  SelectAll as SelectAllIcon,
} from '@mui/icons-material';
import { parseICS } from '../utils/icsParser';
import { googleCalendarService } from '../services/googleCalendarService';
import { CalendarEvent } from '../types';

interface ImportedEvent {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  description?: string;
  selected: boolean;
  imported?: boolean;
  error?: string;
}

const AppleToGoogleCalendarPage: React.FC = () => {
  const [importing, setImporting] = useState(false);
  const [events, setEvents] = useState<ImportedEvent[]>([]);
  const [progress, setProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  }>({ success: 0, failed: 0, errors: [] });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsedEvents = parseICS(text);
      
      // Convert to our format
      const importedEvents: ImportedEvent[] = parsedEvents.map((event, index) => ({
        id: `event-${index}`,
        title: event.summary || 'Kein Titel',
        date: event.start || new Date().toISOString(),
        startTime: event.start,
        endTime: event.end,
        location: event.location,
        description: event.description,
        selected: true,
        imported: false,
      }));

      setEvents(importedEvents);
      setShowResults(false);
    } catch (error) {
      console.error('Error parsing ICS file:', error);
      alert('Fehler beim Lesen der Kalenderdatei');
    }
  };

  const toggleEvent = (eventId: string) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId ? { ...event, selected: !event.selected } : event
    ));
  };

  const selectAll = () => {
    setEvents(prev => prev.map(event => ({ ...event, selected: true })));
  };

  const deselectAll = () => {
    setEvents(prev => prev.map(event => ({ ...event, selected: false })));
  };

  const importToGoogleCalendar = async () => {
    const selectedEvents = events.filter(e => e.selected);
    if (selectedEvents.length === 0) {
      alert('Bitte wählen Sie mindestens einen Termin aus');
      return;
    }

    setImporting(true);
    setProgress(0);
    setImportResults({ success: 0, failed: 0, errors: [] });

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < selectedEvents.length; i++) {
      const event = selectedEvents[i];
      try {
        // Create calendar event for Google Calendar
        const calendarEvent: CalendarEvent = {
          id: event.id,
          title: event.title,
          date: event.date,
          startTime: event.startTime ? new Date(event.startTime) : undefined,
          endTime: event.endTime ? new Date(event.endTime) : undefined,
          type: 'imported',
          description: event.description,
          location: event.location,
          source: 'apple-calendar',
          importedAt: new Date(),
        };

        const googleEventId = await googleCalendarService.createEvent(calendarEvent);
        
        if (googleEventId) {
          successCount++;
          setEvents(prev => prev.map(e => 
            e.id === event.id ? { ...e, imported: true } : e
          ));
        } else {
          failedCount++;
          errors.push(`${event.title}: Konnte nicht erstellt werden`);
          setEvents(prev => prev.map(e => 
            e.id === event.id ? { ...e, error: 'Import fehlgeschlagen' } : e
          ));
        }
      } catch (error) {
        failedCount++;
        const errorMsg = `${event.title}: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`;
        errors.push(errorMsg);
        setEvents(prev => prev.map(e => 
          e.id === event.id ? { ...e, error: errorMsg } : e
        ));
      }

      setProgress(((i + 1) / selectedEvents.length) * 100);
    }

    setImportResults({
      success: successCount,
      failed: failedCount,
      errors,
    });
    setShowResults(true);
    setImporting(false);
  };

  const formatEventDate = (date: string, startTime?: string) => {
    const eventDate = new Date(date);
    const dateStr = eventDate.toLocaleDateString('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    if (startTime) {
      const time = new Date(startTime).toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${dateStr} um ${time}`;
    }

    return dateStr;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CalendarIcon fontSize="large" />
          Apple Calendar → Google Calendar Import
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>So funktioniert's:</strong>
          </Typography>
          <ol style={{ marginBottom: 0, paddingLeft: 20 }}>
            <li>Exportieren Sie Ihren Apple Calendar als .ics Datei</li>
            <li>Laden Sie die Datei hier hoch</li>
            <li>Wählen Sie die Termine aus, die importiert werden sollen</li>
            <li>Die Termine werden automatisch in Ihren Google Calendar übertragen</li>
          </ol>
        </Alert>

        {/* File Upload */}
        <Box sx={{ mb: 4 }}>
          <input
            accept=".ics"
            style={{ display: 'none' }}
            id="raised-button-file"
            type="file"
            onChange={handleFileUpload}
            disabled={importing}
          />
          <label htmlFor="raised-button-file">
            <Button
              variant="contained"
              component="span"
              startIcon={<UploadIcon />}
              disabled={importing}
              size="large"
            >
              Apple Calendar (.ics) hochladen
            </Button>
          </label>
        </Box>

        {/* Events List */}
        {events.length > 0 && (
          <>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                {events.filter(e => e.selected).length} von {events.length} Terminen ausgewählt
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={selectAll} startIcon={<SelectAllIcon />}>
                  Alle auswählen
                </Button>
                <Button size="small" onClick={deselectAll}>
                  Alle abwählen
                </Button>
              </Stack>
            </Box>

            <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto', mb: 3 }}>
              <List>
                {events.map((event, index) => (
                  <React.Fragment key={event.id}>
                    {index > 0 && <Divider />}
                    <ListItem
                      secondaryAction={
                        event.imported ? (
                          <Chip
                            icon={<CheckIcon />}
                            label="Importiert"
                            color="success"
                            size="small"
                          />
                        ) : event.error ? (
                          <Tooltip title={event.error}>
                            <Chip
                              icon={<ErrorIcon />}
                              label="Fehler"
                              color="error"
                              size="small"
                            />
                          </Tooltip>
                        ) : null
                      }
                    >
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={event.selected}
                          onChange={() => toggleEvent(event.id)}
                          disabled={importing || event.imported}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={event.title}
                        secondary={
                          <Stack spacing={0.5}>
                            <Typography variant="caption">
                              {formatEventDate(event.date, event.startTime)}
                            </Typography>
                            {event.location && (
                              <Typography variant="caption" color="text.secondary">
                                📍 {event.location}
                              </Typography>
                            )}
                          </Stack>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </Paper>

            {/* Import Button */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={importToGoogleCalendar}
                disabled={importing || events.filter(e => e.selected && !e.imported).length === 0}
                startIcon={importing ? <CircularProgress size={20} /> : <EventIcon />}
              >
                {importing ? 'Importiere...' : 'In Google Calendar importieren'}
              </Button>
            </Box>

            {/* Progress */}
            {importing && (
              <Box sx={{ mb: 3 }}>
                <LinearProgress variant="determinate" value={progress} />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  {Math.round(progress)}% abgeschlossen
                </Typography>
              </Box>
            )}
          </>
        )}

        {/* Results Dialog */}
        <Dialog open={showResults} onClose={() => setShowResults(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Import abgeschlossen</DialogTitle>
          <DialogContent>
            <Stack spacing={2}>
              <Alert severity={importResults.failed === 0 ? "success" : "warning"}>
                <Typography variant="body2">
                  <strong>{importResults.success}</strong> Termine erfolgreich importiert
                </Typography>
                {importResults.failed > 0 && (
                  <Typography variant="body2">
                    <strong>{importResults.failed}</strong> Termine konnten nicht importiert werden
                  </Typography>
                )}
              </Alert>

              {importResults.errors.length > 0 && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Fehlerdetails:
                    </Typography>
                    <List dense>
                      {importResults.errors.map((error, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <ErrorIcon color="error" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={error}
                            primaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowResults(false)}>Schließen</Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default AppleToGoogleCalendarPage;