import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Paper, Button, IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Tooltip, Badge, useTheme, alpha, Alert, Fab, Menu, ListItemIcon, ListItemText } from '@mui/material';
import Grid from './GridCompat';
import {
  CalendarToday as CalendarIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  LocalShipping as TruckIcon,
  Info as InfoIcon,
  FilterList as FilterIcon,
  Today as TodayIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  ViewWeek as ViewWeekIcon,
  ViewDay as ViewDayIcon,
  CalendarMonth as ViewMonthIcon,
} from '@mui/icons-material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { de } from 'date-fns/locale';
import { AnimatedCard, SlideInContainer } from './MicroAnimations';
import { CustomIcons } from './CustomIcons';

interface MovingEvent {
  id: string;
  title: string;
  customer: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  type: 'standard' | 'office' | 'piano' | 'storage' | 'cleaning';
  fromAddress: string;
  toAddress: string;
  crew: string[];
  truck: string;
  notes: string;
  price: number;
  priority: 'low' | 'medium' | 'high';
  estimatedDuration: number; // in hours
}

interface MovingCalendarProps {
  events?: MovingEvent[];
  onEventCreate?: (event: Omit<MovingEvent, 'id'>) => void;
  onEventUpdate?: (event: MovingEvent) => void;
  onEventDelete?: (eventId: string) => void;
  view?: 'month' | 'week' | 'day';
}

const MovingCalendar: React.FC<MovingCalendarProps> = ({
  events: propEvents = [],
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  view: initialView = 'month',
}) => {
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState(initialView);
  const [events, setEvents] = useState<MovingEvent[]>(propEvents);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<MovingEvent | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Generate sample events if none provided
  useEffect(() => {
    if (propEvents.length === 0) {
      const sampleEvents = generateSampleEvents();
      setEvents(sampleEvents);
    }
  }, [propEvents]);

  const generateSampleEvents = (): MovingEvent[] => {
    const today = new Date();
    const events: MovingEvent[] = [];

    for (let i = 0; i < 20; i++) {
      const date = addDays(today, Math.floor(Math.random() * 60) - 30);
      const startTime = new Date(date);
      startTime.setHours(8 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 4) * 15);
      
      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + 2 + Math.floor(Math.random() * 6));

      const types: Array<MovingEvent['type']> = ['standard', 'office', 'piano', 'storage', 'cleaning'];
      const statuses: Array<MovingEvent['status']> = ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled'];
      const priorities: Array<MovingEvent['priority']> = ['low', 'medium', 'high'];

      events.push({
        id: `event-${i}`,
        title: `Umzug ${i + 1}`,
        customer: `Kunde ${i + 1}`,
        date,
        startTime,
        endTime,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        type: types[Math.floor(Math.random() * types.length)],
        fromAddress: `Musterstraße ${i + 1}, Berlin`,
        toAddress: `Neue Straße ${i + 10}, Berlin`,
        crew: [`Team ${Math.floor(i / 3) + 1}`],
        truck: `LKW-${Math.floor(i / 2) + 1}`,
        notes: `Notizen für Umzug ${i + 1}`,
        price: 800 + Math.floor(Math.random() * 1500),
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        estimatedDuration: 2 + Math.floor(Math.random() * 6),
      });
    }

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const getStatusColor = (status: MovingEvent['status']) => {
    switch (status) {
      case 'scheduled': return theme.palette.info.main;
      case 'confirmed': return theme.palette.primary.main;
      case 'in-progress': return theme.palette.warning.main;
      case 'completed': return theme.palette.success.main;
      case 'cancelled': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  const getStatusLabel = (status: MovingEvent['status']) => {
    switch (status) {
      case 'scheduled': return 'Geplant';
      case 'confirmed': return 'Bestätigt';
      case 'in-progress': return 'In Arbeit';
      case 'completed': return 'Abgeschlossen';
      case 'cancelled': return 'Storniert';
      default: return status;
    }
  };

  const getTypeIcon = (type: MovingEvent['type']) => {
    switch (type) {
      case 'standard': return <CustomIcons.Furniture />;
      case 'office': return <CustomIcons.Office />;
      case 'piano': return <CustomIcons.Piano />;
      case 'storage': return <CustomIcons.Storage />;
      case 'cleaning': return <CustomIcons.Cleaning />;
      default: return <EventIcon />;
    }
  };

  const getTypeLabel = (type: MovingEvent['type']) => {
    switch (type) {
      case 'standard': return 'Standard';
      case 'office': return 'Büro';
      case 'piano': return 'Klavier';
      case 'storage': return 'Lagerung';
      case 'cleaning': return 'Reinigung';
      default: return type;
    }
  };

  const filteredEvents = events.filter(event => {
    if (statusFilter !== 'all' && event.status !== statusFilter) return false;
    if (typeFilter !== 'all' && event.type !== typeFilter) return false;
    return true;
  });

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => isSameDay(event.date, date));
  };

  const getMonthDays = () => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    const days = [];
    let current = start;

    while (current <= end) {
      days.push(current);
      current = addDays(current, 1);
    }

    return days;
  };

  const handleEventClick = (event: MovingEvent) => {
    setSelectedEvent(event);
    setIsCreateMode(false);
    setIsEventDialogOpen(true);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedEvent({
      id: '',
      title: '',
      customer: '',
      date,
      startTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0),
      endTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 17, 0),
      status: 'scheduled',
      type: 'standard',
      fromAddress: '',
      toAddress: '',
      crew: [],
      truck: '',
      notes: '',
      price: 0,
      priority: 'medium',
      estimatedDuration: 4,
    });
    setIsCreateMode(true);
    setIsEventDialogOpen(true);
  };

  const handleEventSave = () => {
    if (!selectedEvent) return;

    if (isCreateMode) {
      const newEvent = {
        ...selectedEvent,
        id: `event-${Date.now()}`,
      };
      setEvents(prev => [...prev, newEvent]);
      onEventCreate?.(selectedEvent);
    } else {
      setEvents(prev => prev.map(event => 
        event.id === selectedEvent.id ? selectedEvent : event
      ));
      onEventUpdate?.(selectedEvent);
    }

    setIsEventDialogOpen(false);
    setSelectedEvent(null);
  };

  const handleEventDelete = () => {
    if (!selectedEvent || !selectedEvent.id) return;

    setEvents(prev => prev.filter(event => event.id !== selectedEvent.id));
    onEventDelete?.(selectedEvent.id);
    setIsEventDialogOpen(false);
    setSelectedEvent(null);
  };

  const renderMonthView = () => {
    const days = getMonthDays();
    
    return (
      <Grid container spacing={1}>
        {/* Day headers */}
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
          <Grid item xs key={day} sx={{ textAlign: 'center', p: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              {day}
            </Typography>
          </Grid>
        ))}
        
        {/* Calendar days */}
        {days.map((date, index) => {
          const dayEvents = getEventsForDate(date);
          const isCurrentMonth = isSameMonth(date, currentDate);
          const isToday = isSameDay(date, new Date());
          
          return (
            <Grid item xs key={index}>
              <Card
                sx={{
                  minHeight: 120,
                  cursor: 'pointer',
                  opacity: isCurrentMonth ? 1 : 0.3,
                  backgroundColor: isToday ? alpha(theme.palette.primary.main, 0.1) : 'background.paper',
                  border: isToday ? `2px solid ${theme.palette.primary.main}` : '1px solid',
                  borderColor: isToday ? 'primary.main' : 'divider',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
                onClick={() => handleDateClick(date)}
              >
                <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                  <Typography variant="body2" sx={{ fontWeight: isToday ? 'bold' : 'normal', mb: 1 }}>
                    {format(date, 'd')}
                  </Typography>
                  
                  <Box sx={{ maxHeight: 80, overflow: 'hidden' }}>
                    {dayEvents.slice(0, 3).map((event) => (
                      <Chip
                        key={event.id}
                        label={event.title}
                        size="small"
                        sx={{
                          mb: 0.5,
                          width: '100%',
                          height: 20,
                          backgroundColor: getStatusColor(event.status),
                          color: 'white',
                          fontSize: '0.7rem',
                          '& .MuiChip-label': {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          },
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
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
            </Grid>
          );
        })}
      </Grid>
    );
  };

  const renderWeekView = () => {
    const startWeek = startOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startWeek, i));
    
    return (
      <Grid container spacing={2}>
        {weekDays.map((date) => {
          const dayEvents = getEventsForDate(date);
          const isToday = isSameDay(date, new Date());
          
          return (
            <Grid item xs key={date.toString()}>
              <Paper
                elevation={1}
                sx={{
                  minHeight: 400,
                  p: 2,
                  backgroundColor: isToday ? alpha(theme.palette.primary.main, 0.05) : 'background.paper',
                  border: isToday ? `2px solid ${theme.palette.primary.main}` : undefined,
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, textAlign: 'center', fontWeight: 600 }}>
                  {format(date, 'EEE d.M.', { locale: de })}
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {dayEvents.map((event) => (
                    <Card
                      key={event.id}
                      sx={{
                        cursor: 'pointer',
                        backgroundColor: alpha(getStatusColor(event.status), 0.1),
                        border: `2px solid ${getStatusColor(event.status)}`,
                        '&:hover': {
                          backgroundColor: alpha(getStatusColor(event.status), 0.2),
                        },
                      }}
                      onClick={() => handleEventClick(event)}
                    >
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          {getTypeIcon(event.type)}
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {event.title}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {format(event.startTime, 'HH:mm')} - {format(event.endTime, 'HH:mm')}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block' }}>
                          {event.customer}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => handleDateClick(date)}
                    sx={{ mt: 1 }}
                  >
                    Termin hinzufügen
                  </Button>
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <Paper elevation={1} sx={{ p: 2 }}>
        <Typography variant="h5" sx={{ mb: 3, textAlign: 'center', fontWeight: 600 }}>
          {format(currentDate, 'EEEE, d. MMMM yyyy', { locale: de })}
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={2}>
            {hours.map((hour) => (
              <Box key={hour} sx={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {hour.toString().padStart(2, '0')}:00
                </Typography>
              </Box>
            ))}
          </Grid>
          
          <Grid item xs={10}>
            <Box sx={{ position: 'relative', height: 60 * 24 }}>
              {hours.map((hour) => (
                <Box
                  key={hour}
                  sx={{
                    position: 'absolute',
                    top: hour * 60,
                    left: 0,
                    right: 0,
                    height: 60,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    const clickDate = new Date(currentDate);
                    clickDate.setHours(hour, 0, 0, 0);
                    handleDateClick(clickDate);
                  }}
                />
              ))}
              
              {dayEvents.map((event) => {
                const startHour = event.startTime.getHours() + event.startTime.getMinutes() / 60;
                const endHour = event.endTime.getHours() + event.endTime.getMinutes() / 60;
                const duration = endHour - startHour;
                
                return (
                  <Card
                    key={event.id}
                    sx={{
                      position: 'absolute',
                      top: startHour * 60,
                      left: 8,
                      right: 8,
                      height: duration * 60 - 4,
                      backgroundColor: alpha(getStatusColor(event.status), 0.2),
                      border: `2px solid ${getStatusColor(event.status)}`,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: alpha(getStatusColor(event.status), 0.3),
                      },
                    }}
                    onClick={() => handleEventClick(event)}
                  >
                    <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {event.title}
                      </Typography>
                      <Typography variant="caption">
                        {format(event.startTime, 'HH:mm')} - {format(event.endTime, 'HH:mm')}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block' }}>
                        {event.customer}
                      </Typography>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          </Grid>
        </Grid>
      </Paper>
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
      <Box>
        {/* Header */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon color="primary" />
              Umzugs-Kalender
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Filter">
                <IconButton onClick={(e) => setFilterAnchorEl(e.currentTarget)}>
                  <Badge badgeContent={statusFilter !== 'all' || typeFilter !== 'all' ? 1 : 0} color="primary">
                    <FilterIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Heute">
                <IconButton onClick={() => setCurrentDate(new Date())}>
                  <TodayIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            {/* Navigation */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={() => setCurrentDate(prev => subMonths(prev, 1))}>
                <NavigateBeforeIcon />
              </IconButton>
              
              <Typography variant="h6" sx={{ minWidth: 200, textAlign: 'center', fontWeight: 600 }}>
                {format(currentDate, view === 'day' ? 'EEEE, d. MMMM yyyy' : 'MMMM yyyy', { locale: de })}
              </Typography>
              
              <IconButton onClick={() => setCurrentDate(prev => addMonths(prev, 1))}>
                <NavigateNextIcon />
              </IconButton>
            </Box>
            
            {/* View Toggle */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant={view === 'month' ? 'contained' : 'outlined'}
                startIcon={<ViewMonthIcon />}
                onClick={() => setView('month')}
                size="small"
              >
                Monat
              </Button>
              <Button
                variant={view === 'week' ? 'contained' : 'outlined'}
                startIcon={<ViewWeekIcon />}
                onClick={() => setView('week')}
                size="small"
              >
                Woche
              </Button>
              <Button
                variant={view === 'day' ? 'contained' : 'outlined'}
                startIcon={<ViewDayIcon />}
                onClick={() => setView('day')}
                size="small"
              >
                Tag
              </Button>
            </Box>
          </Box>
        </Paper>
        
        {/* Calendar Content */}
        <Box sx={{ mb: 3 }}>
          {view === 'month' && renderMonthView()}
          {view === 'week' && renderWeekView()}
          {view === 'day' && renderDayView()}
        </Box>
        
        {/* Quick Stats */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={1}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <EventIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {filteredEvents.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Termine gesamt
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={1}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <ScheduleIcon color="warning" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {filteredEvents.filter(e => e.status === 'scheduled').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Geplant
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={1}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TruckIcon color="success" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {filteredEvents.filter(e => e.status === 'completed').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Abgeschlossen
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={1}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <InfoIcon color="info" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {filteredEvents.filter(e => isSameDay(e.date, new Date())).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Heute
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Add Event FAB */}
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 80, right: 16 }}
          onClick={() => handleDateClick(new Date())}
        >
          <AddIcon />
        </Fab>
        
        {/* Filter Menu */}
        <Menu
          anchorEl={filterAnchorEl}
          open={Boolean(filterAnchorEl)}
          onClose={() => setFilterAnchorEl(null)}
        >
          <Box sx={{ p: 2, minWidth: 200 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Filter
            </Typography>
            
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">Alle</MenuItem>
                <MenuItem value="scheduled">Geplant</MenuItem>
                <MenuItem value="confirmed">Bestätigt</MenuItem>
                <MenuItem value="in-progress">In Arbeit</MenuItem>
                <MenuItem value="completed">Abgeschlossen</MenuItem>
                <MenuItem value="cancelled">Storniert</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth size="small">
              <InputLabel>Typ</InputLabel>
              <Select
                value={typeFilter}
                label="Typ"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="all">Alle</MenuItem>
                <MenuItem value="standard">Standard</MenuItem>
                <MenuItem value="office">Büro</MenuItem>
                <MenuItem value="piano">Klavier</MenuItem>
                <MenuItem value="storage">Lagerung</MenuItem>
                <MenuItem value="cleaning">Reinigung</MenuItem>
              </Select>
            </FormControl>
            
            <Button
              fullWidth
              variant="outlined"
              size="small"
              sx={{ mt: 2 }}
              onClick={() => {
                setStatusFilter('all');
                setTypeFilter('all');
              }}
            >
              Filter zurücksetzen
            </Button>
          </Box>
        </Menu>
        
        {/* Event Dialog */}
        <Dialog
          open={isEventDialogOpen}
          onClose={() => setIsEventDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {isCreateMode ? 'Neuen Termin erstellen' : 'Termin bearbeiten'}
          </DialogTitle>
          <DialogContent>
            {selectedEvent && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Titel"
                    value={selectedEvent.title}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, title: e.target.value })}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Kunde"
                    value={selectedEvent.customer}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, customer: e.target.value })}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <DatePicker
                    label="Datum"
                    value={selectedEvent.date}
                    onChange={(date) => date && setSelectedEvent({ ...selectedEvent, date })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TimePicker
                    label="Startzeit"
                    value={selectedEvent.startTime}
                    onChange={(time) => time && setSelectedEvent({ ...selectedEvent, startTime: time })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TimePicker
                    label="Endzeit"
                    value={selectedEvent.endTime}
                    onChange={(time) => time && setSelectedEvent({ ...selectedEvent, endTime: time })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={selectedEvent.status}
                      label="Status"
                      onChange={(e) => setSelectedEvent({ ...selectedEvent, status: e.target.value as any })}
                    >
                      <MenuItem value="scheduled">Geplant</MenuItem>
                      <MenuItem value="confirmed">Bestätigt</MenuItem>
                      <MenuItem value="in-progress">In Arbeit</MenuItem>
                      <MenuItem value="completed">Abgeschlossen</MenuItem>
                      <MenuItem value="cancelled">Storniert</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Typ</InputLabel>
                    <Select
                      value={selectedEvent.type}
                      label="Typ"
                      onChange={(e) => setSelectedEvent({ ...selectedEvent, type: e.target.value as any })}
                    >
                      <MenuItem value="standard">Standard</MenuItem>
                      <MenuItem value="office">Büro</MenuItem>
                      <MenuItem value="piano">Klavier</MenuItem>
                      <MenuItem value="storage">Lagerung</MenuItem>
                      <MenuItem value="cleaning">Reinigung</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Von Adresse"
                    value={selectedEvent.fromAddress}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, fromAddress: e.target.value })}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nach Adresse"
                    value={selectedEvent.toAddress}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, toAddress: e.target.value })}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Team"
                    value={selectedEvent.crew.join(', ')}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, crew: e.target.value.split(', ') })}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Fahrzeug"
                    value={selectedEvent.truck}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, truck: e.target.value })}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Preis (€)"
                    type="number"
                    value={selectedEvent.price}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, price: Number(e.target.value) })}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Geschätzte Dauer (Std)"
                    type="number"
                    value={selectedEvent.estimatedDuration}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, estimatedDuration: Number(e.target.value) })}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Priorität</InputLabel>
                    <Select
                      value={selectedEvent.priority}
                      label="Priorität"
                      onChange={(e) => setSelectedEvent({ ...selectedEvent, priority: e.target.value as any })}
                    >
                      <MenuItem value="low">Niedrig</MenuItem>
                      <MenuItem value="medium">Normal</MenuItem>
                      <MenuItem value="high">Hoch</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notizen"
                    multiline
                    rows={3}
                    value={selectedEvent.notes}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, notes: e.target.value })}
                  />
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            {!isCreateMode && (
              <Button onClick={handleEventDelete} color="error">
                Löschen
              </Button>
            )}
            <Button onClick={() => setIsEventDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleEventSave} variant="contained">
              {isCreateMode ? 'Erstellen' : 'Speichern'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default MovingCalendar;