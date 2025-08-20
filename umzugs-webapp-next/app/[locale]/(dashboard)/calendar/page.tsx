'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Fab,
} from '@mui/material';
import { Grid2 as Grid } from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Today as TodayIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
} from '@mui/icons-material';
import { CalendarEvent, Customer } from '@/types';
import { supabaseService } from '@/lib/services/supabase';
import { useToast } from '@/components/ui/Toaster';
import { format, addDays, subDays, startOfWeek, endOfWeek, isSameDay, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

interface EventFormData {
  title: string;
  type: 'viewing' | 'moving' | 'quote' | 'other';
  start: string;
  end: string;
  customerId?: string;
  customerName?: string;
  description?: string;
  location?: string;
}

const eventTypeColors = {
  viewing: '#2196F3',
  moving: '#4CAF50',
  quote: '#FF9800',
  other: '#9C27B0',
};

const eventTypeLabels = {
  viewing: 'Besichtigung',
  moving: 'Umzug',
  quote: 'Angebotstermin',
  other: 'Sonstiges',
};

export default function CalendarPage() {
  const { addToast } = useToast();
  const t = useTranslations('common');

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    type: 'viewing',
    start: '',
    end: '',
    customerId: '',
    customerName: '',
    description: '',
    location: '',
  });

  // Generate week days for the current week
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = [];
  
  for (let i = 0; i < 7; i++) {
    weekDays.push(addDays(weekStart, i));
  }

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await supabaseService.initialize();
      
      // Load customers for the dropdown
      const customersData = await supabaseService.getCustomers();
      setCustomers(customersData);
      
      // For now, we'll create mock calendar events
      // In a real implementation, you'd have a calendar_events table
      const mockEvents: CalendarEvent[] = [
        {
          id: '1',
          title: 'Besichtigung Familie Müller',
          type: 'viewing',
          start: format(addDays(currentDate, 1), 'yyyy-MM-dd\'T\'10:00'),
          end: format(addDays(currentDate, 1), 'yyyy-MM-dd\'T\'11:00'),
          customerName: 'Familie Müller',
          location: 'Berlin Mitte',
          description: 'Wohnungsbesichtigung für Umzug nach Hamburg',
        },
        {
          id: '2',
          title: 'Umzug Schmidt',
          type: 'moving',
          start: format(addDays(currentDate, 3), 'yyyy-MM-dd\'T\'08:00'),
          end: format(addDays(currentDate, 3), 'yyyy-MM-dd\'T\'16:00'),
          customerName: 'Herr Schmidt',
          location: 'Berlin → Hamburg',
          description: '4-Zimmer Wohnung, 3. Stock ohne Aufzug',
        },
        {
          id: '3',
          title: 'Angebot erstellen',
          type: 'quote',
          start: format(currentDate, 'yyyy-MM-dd\'T\'14:00'),
          end: format(currentDate, 'yyyy-MM-dd\'T\'15:00'),
          customerName: 'Familie Weber',
          description: 'Angebot für Fernumzug München → Berlin',
        },
      ];
      
      setEvents(mockEvents);
    } catch (error) {
      console.error('Error loading calendar data:', error);
      addToast({
        type: 'error',
        title: 'Fehler',
        message: 'Kalenderdaten konnten nicht geladen werden',
      });
    } finally {
      setLoading(false);
    }
  }, [currentDate, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePreviousWeek = () => {
    setCurrentDate(prev => subDays(prev, 7));
  };

  const handleNextWeek = () => {
    setCurrentDate(prev => addDays(prev, 7));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleOpenDialog = (event?: CalendarEvent) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        title: event.title,
        type: event.type,
        start: event.start.toString().slice(0, 16),
        end: event.end.toString().slice(0, 16),
        customerId: event.customerId || '',
        customerName: event.customerName || '',
        description: event.description || '',
        location: event.location || '',
      });
    } else {
      setEditingEvent(null);
      setFormData({
        title: '',
        type: 'viewing',
        start: format(new Date(), 'yyyy-MM-dd\'T\'09:00'),
        end: format(new Date(), 'yyyy-MM-dd\'T\'10:00'),
        customerId: '',
        customerName: '',
        description: '',
        location: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingEvent(null);
  };

  const handleSaveEvent = async () => {
    if (!formData.title || !formData.start || !formData.end) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Bitte füllen Sie alle Pflichtfelder aus',
      });
      return;
    }

    try {
      const eventData: CalendarEvent = {
        id: editingEvent?.id || Date.now().toString(),
        title: formData.title,
        type: formData.type,
        start: formData.start,
        end: formData.end,
        customerId: formData.customerId || undefined,
        customerName: formData.customerName || undefined,
        description: formData.description || undefined,
        location: formData.location || undefined,
      };

      if (editingEvent) {
        // Update existing event
        setEvents(prev => prev.map(e => e.id === editingEvent.id ? eventData : e));
        addToast({
          type: 'success',
          title: 'Erfolg',
          message: 'Termin wurde aktualisiert',
        });
      } else {
        // Create new event
        setEvents(prev => [...prev, eventData]);
        addToast({
          type: 'success',
          title: 'Erfolg',
          message: 'Neuer Termin wurde erstellt',
        });
      }

      handleCloseDialog();
    } catch (error) {
      console.error('Error saving event:', error);
      addToast({
        type: 'error',
        title: 'Fehler',
        message: 'Termin konnte nicht gespeichert werden',
      });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      setEvents(prev => prev.filter(e => e.id !== eventId));
      addToast({
        type: 'success',
        title: 'Erfolg',
        message: 'Termin wurde gelöscht',
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      addToast({
        type: 'error',
        title: 'Fehler',
        message: 'Termin konnte nicht gelöscht werden',
      });
    }
  };

  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = typeof event.start === 'string' ? parseISO(event.start) : new Date(event.start);
      return isSameDay(eventDate, date);
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Lade Kalenderdaten...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">
          Kalender
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<TodayIcon />}
            onClick={handleToday}
          >
            Heute
          </Button>
          <IconButton onClick={handlePreviousWeek}>
            <PrevIcon />
          </IconButton>
          <Typography variant="h6" sx={{ mx: 2, minWidth: 200, textAlign: 'center' }}>
            {format(weekStart, 'dd.MM.', { locale: de })} - {format(weekEnd, 'dd.MM.yyyy', { locale: de })}
          </Typography>
          <IconButton onClick={handleNextWeek}>
            <NextIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Neuer Termin
          </Button>
        </Box>
      </Box>

      {/* Calendar Grid */}
      <Grid container spacing={1} sx={{ minHeight: '600px' }}>
        {weekDays.map((day, index) => {
          const dayEvents = getEventsForDay(day);
          const isToday = isSameDay(day, new Date());
          
          return (
            <Grid size={{ xs: 12, md: 12 / 7 }} key={index}>
              <Card sx={{ height: '100%', minHeight: 500 }}>
                <CardContent sx={{ height: '100%', p: 1 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 1, 
                      textAlign: 'center',
                      fontWeight: isToday ? 'bold' : 'normal',
                      color: isToday ? 'primary.main' : 'inherit',
                    }}
                  >
                    {format(day, 'EEE dd.MM.', { locale: de })}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {dayEvents.map(event => (
                      <Card 
                        key={event.id}
                        sx={{ 
                          borderLeft: `4px solid ${eventTypeColors[event.type]}`,
                          cursor: 'pointer',
                          '&:hover': { boxShadow: 2 }
                        }}
                        onClick={() => handleOpenDialog(event)}
                      >
                        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                          <Typography variant="body2" fontWeight="bold" noWrap>
                            {event.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {format(parseISO(event.start.toString()), 'HH:mm', { locale: de })} - {format(parseISO(event.end.toString()), 'HH:mm', { locale: de })}
                          </Typography>
                          {event.customerName && (
                            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                              <PersonIcon sx={{ fontSize: 12, mr: 0.5 }} />
                              {event.customerName}
                            </Typography>
                          )}
                          {event.location && (
                            <Typography variant="caption" display="block">
                              <LocationIcon sx={{ fontSize: 12, mr: 0.5 }} />
                              {event.location}
                            </Typography>
                          )}
                          <Chip 
                            label={eventTypeLabels[event.type]}
                            size="small"
                            sx={{ 
                              mt: 0.5,
                              bgcolor: eventTypeColors[event.type] + '20',
                              color: eventTypeColors[event.type],
                              fontSize: '0.6rem',
                              height: 20
                            }}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Fab
        color="primary"
        aria-label="add event"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>

      {/* Event Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingEvent ? 'Termin bearbeiten' : 'Neuer Termin'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Titel"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
            
            <FormControl fullWidth>
              <InputLabel>Typ</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                label="Typ"
              >
                <MenuItem value="viewing">Besichtigung</MenuItem>
                <MenuItem value="moving">Umzug</MenuItem>
                <MenuItem value="quote">Angebotstermin</MenuItem>
                <MenuItem value="other">Sonstiges</MenuItem>
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Start"
                  type="datetime-local"
                  value={formData.start}
                  onChange={(e) => setFormData(prev => ({ ...prev, start: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Ende"
                  type="datetime-local"
                  value={formData.end}
                  onChange={(e) => setFormData(prev => ({ ...prev, end: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Kundenname"
              value={formData.customerName}
              onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
            />

            <TextField
              fullWidth
              label="Ort"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            />

            <TextField
              fullWidth
              label="Beschreibung"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          {editingEvent && (
            <Button 
              color="error" 
              onClick={() => {
                handleDeleteEvent(editingEvent.id);
                handleCloseDialog();
              }}
              startIcon={<DeleteIcon />}
            >
              Löschen
            </Button>
          )}
          <Button onClick={handleCloseDialog}>
            Abbrechen
          </Button>
          <Button onClick={handleSaveEvent} variant="contained">
            {editingEvent ? 'Aktualisieren' : 'Erstellen'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}