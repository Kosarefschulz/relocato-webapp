import React, { useState, useEffect } from 'react';
import { Container, Paper, Typography, Box, IconButton, Button, Card, CardContent, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction, useTheme, alpha, Tooltip, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import Grid from './GridCompat';
import {
  ArrowBack as ArrowBackIcon,
  CalendarMonth as CalendarIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Event as EventIcon,
  Sync as SyncIcon,
  Apple as AppleIcon,
  Google as GoogleIcon,
  ChevronLeft,
  ChevronRight,
  Today as TodayIcon,
  FileUpload as FileUploadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { Customer } from '../types';
import { databaseService as googleSheetsService } from '../config/database.config';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time: string;
  type: 'viewing' | 'moving' | 'quote' | 'other';
  customer?: Customer;
  description?: string;
}

const CalendarView: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    title: '',
    time: '10:00',
    type: 'viewing',
    description: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const customersData = await googleSheetsService.getCustomers();
      setCustomers(customersData);
      
      // Erstelle Events aus Kundendaten
      const customerEvents: CalendarEvent[] = customersData
        .filter(customer => customer.movingDate)
        .map(customer => ({
          id: `move-${customer.id}`,
          title: `Umzug: ${customer.name}`,
          date: new Date(customer.movingDate),
          time: '08:00',
          type: 'moving' as const,
          customer: customer,
          description: `Von: ${customer.fromAddress}\nNach: ${customer.toAddress}`,
        }));
      
      setEvents(customerEvents);
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
    }
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  };

  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(event.date, day));
  };

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setNewEvent({
      ...newEvent,
      date: date,
    });
    setEventDialogOpen(true);
  };

  const handleCreateEvent = () => {
    if (newEvent.title && newEvent.date) {
      const event: CalendarEvent = {
        id: `event-${Date.now()}`,
        title: newEvent.title,
        date: newEvent.date,
        time: newEvent.time || '10:00',
        type: newEvent.type || 'other',
        description: newEvent.description,
        customer: newEvent.customer,
      };
      
      setEvents([...events, event]);
      setEventDialogOpen(false);
      setNewEvent({
        title: '',
        time: '10:00',
        type: 'viewing',
        description: '',
      });
    }
  };

  const generateICSFile = () => {
    let icsContent = 'BEGIN:VCALENDAR\n';
    icsContent += 'VERSION:2.0\n';
    icsContent += 'PRODID:-//Relocato//Umzugskalender//DE\n';
    icsContent += 'CALSCALE:GREGORIAN\n';
    icsContent += 'METHOD:PUBLISH\n';
    icsContent += 'X-WR-CALNAME:Relocato Umzugstermine\n';
    icsContent += 'X-WR-TIMEZONE:Europe/Berlin\n';

    events.forEach(event => {
      const startDate = new Date(event.date);
      const [hours, minutes] = event.time.split(':');
      startDate.setHours(parseInt(hours), parseInt(minutes));
      
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 2); // 2 Stunden Dauer als Standard

      icsContent += 'BEGIN:VEVENT\n';
      icsContent += `UID:${event.id}@relocato.de\n`;
      icsContent += `DTSTART:${formatDateToICS(startDate)}\n`;
      icsContent += `DTEND:${formatDateToICS(endDate)}\n`;
      icsContent += `SUMMARY:${event.title}\n`;
      
      if (event.description) {
        icsContent += `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}\n`;
      }
      
      if (event.customer) {
        icsContent += `LOCATION:${event.customer.fromAddress} → ${event.customer.toAddress}\n`;
      }
      
      icsContent += 'END:VEVENT\n';
    });

    icsContent += 'END:VCALENDAR';
    
    return icsContent;
  };

  const formatDateToICS = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}${month}${day}T${hours}${minutes}00`;
  };

  const handleExportToApple = () => {
    const icsContent = generateICSFile();
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const fileName = `Relocato_Kalender_${format(new Date(), 'yyyy-MM-dd')}.ics`;
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    
    URL.revokeObjectURL(url);
    setSyncDialogOpen(false);
  };

  const handleCalDAVSync = () => {
    // Zeige Anleitung für CalDAV
    setSyncDialogOpen(true);
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'moving':
        return theme.palette.error.main;
      case 'viewing':
        return theme.palette.info.main;
      case 'quote':
        return theme.palette.warning.main;
      default:
        return theme.palette.grey[500];
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Kalender
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Alle Umzugstermine und Besichtigungen
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<FileUploadIcon />}
              onClick={() => navigate('/calendar-import')}
            >
              Kalender importieren
            </Button>
            <Button
              variant="outlined"
              startIcon={<SyncIcon />}
              onClick={handleCalDAVSync}
            >
              Mit Apple Calendar
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedDate(new Date());
                setEventDialogOpen(true);
              }}
            >
              Termin erstellen
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Calendar Navigation */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={handlePreviousMonth}>
              <ChevronLeft />
            </IconButton>
            <Typography variant="h5" sx={{ fontWeight: 600, minWidth: 200, textAlign: 'center' }}>
              {format(currentDate, 'MMMM yyyy', { locale: de })}
            </Typography>
            <IconButton onClick={handleNextMonth}>
              <ChevronRight />
            </IconButton>
          </Box>
          <Button
            variant="outlined"
            startIcon={<TodayIcon />}
            onClick={handleToday}
          >
            Heute
          </Button>
        </Box>
      </Paper>

      {/* Calendar Grid */}
      <Paper sx={{ p: 2 }}>
        <Grid container spacing={1}>
          {/* Weekday Headers */}
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
            <Grid key={day} size={{ xs: 12/7 }}>
              <Typography
                variant="body2"
                sx={{
                  textAlign: 'center',
                  fontWeight: 600,
                  color: 'text.secondary',
                  py: 1,
                }}
              >
                {day}
              </Typography>
            </Grid>
          ))}

          {/* Calendar Days */}
          {getDaysInMonth().map(day => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);

            return (
              <Grid key={day.toISOString()} size={{ xs: 12/7 }}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Card
                    sx={{
                      minHeight: 100,
                      cursor: 'pointer',
                      backgroundColor: isTodayDate
                        ? alpha(theme.palette.primary.main, 0.1)
                        : isCurrentMonth
                        ? 'background.paper'
                        : alpha(theme.palette.action.disabled, 0.05),
                      border: isTodayDate
                        ? `2px solid ${theme.palette.primary.main}`
                        : '1px solid transparent',
                      '&:hover': {
                        boxShadow: theme.shadows[4],
                        borderColor: theme.palette.primary.light,
                      },
                    }}
                    onClick={() => handleDateClick(day)}
                  >
                    <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: isTodayDate ? 700 : 500,
                          color: isCurrentMonth ? 'text.primary' : 'text.disabled',
                          mb: 0.5,
                        }}
                      >
                        {format(day, 'd')}
                      </Typography>
                      
                      {/* Events */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {dayEvents.slice(0, 3).map(event => (
                          <Chip
                            key={event.id}
                            label={event.time}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              backgroundColor: alpha(getEventTypeColor(event.type), 0.2),
                              color: getEventTypeColor(event.type),
                              '& .MuiChip-label': {
                                px: 0.5,
                              },
                            }}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <Typography variant="caption" color="text.secondary">
                            +{dayEvents.length - 3} weitere
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* Create Event Dialog */}
      <Dialog open={eventDialogOpen} onClose={() => setEventDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Neuer Termin
          {selectedDate && (
            <Typography variant="body2" color="text.secondary">
              {format(selectedDate, 'dd. MMMM yyyy', { locale: de })}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Titel"
              value={newEvent.title || ''}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              fullWidth
              required
            />
            
            <TextField
              label="Uhrzeit"
              type="time"
              value={newEvent.time || '10:00'}
              onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
              fullWidth
              required
            />

            <FormControl fullWidth>
              <InputLabel>Typ</InputLabel>
              <Select
                value={newEvent.type || 'viewing'}
                onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as any })}
                label="Typ"
              >
                <MenuItem value="viewing">Besichtigung</MenuItem>
                <MenuItem value="moving">Umzug</MenuItem>
                <MenuItem value="quote">Angebotstermin</MenuItem>
                <MenuItem value="other">Sonstiges</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Kunde (optional)</InputLabel>
              <Select
                value={newEvent.customer?.id || ''}
                onChange={(e) => {
                  const customerId = e.target.value;
                  setNewEvent({ 
                    ...newEvent, 
                    customer: customerId ? customers.find(c => c.id === customerId) : undefined 
                  });
                }}
                label="Kunde (optional)"
              >
                <MenuItem value="">Kein Kunde</MenuItem>
                {customers.map(customer => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Beschreibung"
              value={newEvent.description || ''}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEventDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={handleCreateEvent} variant="contained">
            Erstellen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sync Dialog */}
      <Dialog open={syncDialogOpen} onClose={() => setSyncDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AppleIcon />
            <Typography variant="h6">Mit Apple Calendar synchronisieren</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Wählen Sie eine der folgenden Optionen, um Ihre Termine mit Apple Calendar zu synchronisieren
          </Alert>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Option 1: ICS Export */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Option 1: Einmaliger Export (Empfohlen)
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Exportieren Sie alle Termine als .ics Datei und importieren Sie diese in Apple Calendar.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AppleIcon />}
                  onClick={handleExportToApple}
                  fullWidth
                >
                  Kalender exportieren (.ics)
                </Button>
              </CardContent>
            </Card>

            {/* Option 2: CalDAV */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Option 2: Automatische Synchronisation (CalDAV)
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Für eine automatische Synchronisation benötigen Sie einen CalDAV-Server.
                  Sie können kostenlose Dienste wie Nextcloud oder kostenpflichtige wie iCloud+ nutzen.
                </Typography>
                
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Hinweis:</strong> Diese Option erfordert technisches Setup. 
                    Kontaktieren Sie Ihren IT-Administrator für die Einrichtung.
                  </Typography>
                </Alert>
              </CardContent>
            </Card>

            {/* Option 3: Google Calendar */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GoogleIcon />
                    Option 3: Über Google Calendar
                  </Box>
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Wenn Sie Google Calendar nutzen, können Sie diesen mit Apple Calendar synchronisieren:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="1. Exportieren Sie die .ics Datei"
                      secondary="Klicken Sie oben auf 'Kalender exportieren'"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="2. Importieren in Google Calendar"
                      secondary="Öffnen Sie Google Calendar → Einstellungen → Importieren"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="3. Mit Apple Calendar verbinden"
                      secondary="Fügen Sie Ihr Google-Konto in den Apple Calendar Einstellungen hinzu"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSyncDialogOpen(false)}>Schließen</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CalendarView;