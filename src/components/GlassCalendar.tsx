import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Today as TodayIcon,
  Add as AddIcon,
  Event as EventIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, isWeekend, startOfWeek, endOfWeek, getDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { Customer } from '../types';
import { databaseService as googleSheetsService } from '../config/database.config';
import './GlassCalendar.css';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time: string;
  type: 'viewing' | 'moving' | 'quote' | 'other';
  customer?: Customer;
  description?: string;
  location?: string;
}

const GlassCalendar: React.FC = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [viewType, setViewType] = useState<'month' | 'week' | 'day'>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    title: '',
    time: '10:00',
    type: 'viewing',
    description: '',
    location: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const customersData = await googleSheetsService.getCustomers();
      setCustomers(customersData);
      
      // Create events from customer data
      const customerEvents: CalendarEvent[] = [];
      
      // Add moving events
      customersData.forEach(customer => {
        if (customer.movingDate) {
          customerEvents.push({
            id: `move-${customer.id}`,
            title: `Umzug: ${customer.name}`,
            date: new Date(customer.movingDate),
            time: '08:00',
            type: 'moving',
            customer: customer,
            description: `Von: ${customer.fromAddress}\nNach: ${customer.toAddress}`,
            location: customer.toAddress,
          });
        }
      });

      // Add some demo events for better visualization
      const today = new Date();
      customerEvents.push(
        {
          id: 'demo-1',
          title: 'Besichtigung Familie Schmidt',
          date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2),
          time: '14:00',
          type: 'viewing',
          description: 'Erste Besichtigung für Umzug',
          location: 'Musterstraße 123, Berlin',
        },
        {
          id: 'demo-2',
          title: 'Angebot erstellen',
          date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5),
          time: '10:00',
          type: 'quote',
          description: 'Angebot für Büroumzug',
          location: 'Büro',
        }
      );
      
      setEvents(customerEvents);
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const startWeek = startOfWeek(start, { locale: de, weekStartsOn: 1 });
    const endWeek = endOfWeek(end, { locale: de, weekStartsOn: 1 });
    return eachDayOfInterval({ start: startWeek, end: endWeek });
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

  const handleDateClick = (day: Date) => {
    setSelectedDate(day);
    const dayEvents = getEventsForDay(day);
    if (dayEvents.length === 1) {
      setSelectedEvent(dayEvents[0]);
      setEventDialogOpen(true);
    } else if (dayEvents.length > 1) {
      // Show event list dialog
      setEventDialogOpen(true);
    } else {
      // Create new event
      setNewEvent({
        ...newEvent,
        date: day,
      });
      setEventDialogOpen(true);
    }
  };

  const handleCreateEvent = () => {
    setSelectedDate(new Date());
    setSelectedEvent(null);
    setNewEvent({
      title: '',
      time: '10:00',
      type: 'viewing',
      description: '',
      location: '',
      date: new Date(),
    });
    setEventDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEventDialogOpen(false);
    setSelectedEvent(null);
    setNewEvent({
      title: '',
      time: '10:00',
      type: 'viewing',
      description: '',
      location: '',
    });
  };

  const handleSaveEvent = () => {
    if (newEvent.title && newEvent.date) {
      const event: CalendarEvent = {
        id: `event-${Date.now()}`,
        title: newEvent.title,
        date: newEvent.date,
        time: newEvent.time || '10:00',
        type: newEvent.type || 'other',
        description: newEvent.description,
        location: newEvent.location,
      };
      setEvents([...events, event]);
      handleCloseDialog();
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'moving': return 'Umzug';
      case 'viewing': return 'Besichtigung';
      case 'quote': return 'Angebot';
      default: return 'Termin';
    }
  };

  return (
    <div className="glass-calendar">
      {/* Header */}
      <div className="calendar-header">
        <h1 className="calendar-title">Kalender</h1>
        <p className="calendar-subtitle">Alle Termine und Umzüge im Überblick</p>
      </div>

      {/* Navigation */}
      <div className="calendar-nav">
        <div className="calendar-nav-group">
          <button className="calendar-nav-button" onClick={handlePreviousMonth}>
            <ChevronLeft />
          </button>
          <h2 className="calendar-month-year">
            {format(currentDate, 'MMMM yyyy', { locale: de })}
          </h2>
          <button className="calendar-nav-button" onClick={handleNextMonth}>
            <ChevronRight />
          </button>
        </div>

        <div className="calendar-nav-group">
          <div className="calendar-view-toggle">
            <button 
              className={`view-toggle-button ${viewType === 'month' ? 'active' : ''}`}
              onClick={() => setViewType('month')}
            >
              Monat
            </button>
            <button 
              className={`view-toggle-button ${viewType === 'week' ? 'active' : ''}`}
              onClick={() => setViewType('week')}
            >
              Woche
            </button>
            <button 
              className={`view-toggle-button ${viewType === 'day' ? 'active' : ''}`}
              onClick={() => setViewType('day')}
            >
              Tag
            </button>
          </div>
          <button className="calendar-today-button" onClick={handleToday}>
            <TodayIcon />
            Heute
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid-container">
        {/* Weekdays */}
        <div className="calendar-weekdays">
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
            <div key={day} className="calendar-weekday">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="calendar-grid">
          {getDaysInMonth().map(day => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);
            const isWeekendDay = isWeekend(day);

            return (
              <div
                key={day.toISOString()}
                className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isTodayDate ? 'today' : ''} ${isWeekendDay ? 'weekend' : ''}`}
                onClick={() => handleDateClick(day)}
              >
                <div className="calendar-day-number">
                  {format(day, 'd')}
                </div>
                
                <div className="calendar-events">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className={`calendar-event-dot ${event.type}`}
                      title={`${event.time} - ${event.title}`}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="calendar-more-events">
                      +{dayEvents.length - 3} weitere
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Action Button */}
      <button className="calendar-fab" onClick={handleCreateEvent}>
        <AddIcon />
      </button>

      {/* Event Dialog */}
      {eventDialogOpen && (
        <div className="event-dialog-overlay" onClick={handleCloseDialog}>
          <div className="event-dialog" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ color: 'rgba(255, 255, 255, 0.95)', fontSize: '24px', fontWeight: '600', margin: 0 }}>
                {selectedEvent ? selectedEvent.title : 'Neuer Termin'}
              </h2>
              <button 
                onClick={handleCloseDialog}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '0.5px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'rgba(255, 255, 255, 0.7)',
                }}
              >
                <CloseIcon />
              </button>
            </div>

            {selectedEvent ? (
              // Show event details
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <EventIcon style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                  <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    {format(selectedEvent.date, 'dd. MMMM yyyy', { locale: de })}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <TimeIcon style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                  <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    {selectedEvent.time} Uhr
                  </span>
                </div>
                {selectedEvent.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <LocationIcon style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                    <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      {selectedEvent.location}
                    </span>
                  </div>
                )}
                {selectedEvent.customer && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <PersonIcon style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                    <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      {selectedEvent.customer.name}
                    </span>
                  </div>
                )}
                {selectedEvent.description && (
                  <div style={{ 
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '12px',
                    border: '0.5px solid rgba(255, 255, 255, 0.08)',
                  }}>
                    <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: 0, whiteSpace: 'pre-line' }}>
                      {selectedEvent.description}
                    </p>
                  </div>
                )}
                <div style={{ 
                  display: 'inline-flex',
                  padding: '6px 12px',
                  background: `${selectedEvent.type === 'moving' ? 'rgba(245, 87, 108, 0.2)' : selectedEvent.type === 'viewing' ? 'rgba(79, 172, 254, 0.2)' : 'rgba(254, 225, 64, 0.2)'}`,
                  borderRadius: '8px',
                  border: `0.5px solid ${selectedEvent.type === 'moving' ? 'rgba(245, 87, 108, 0.3)' : selectedEvent.type === 'viewing' ? 'rgba(79, 172, 254, 0.3)' : 'rgba(254, 225, 64, 0.3)'}`,
                  alignSelf: 'flex-start',
                }}>
                  <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px', fontWeight: '500' }}>
                    {getEventTypeLabel(selectedEvent.type)}
                  </span>
                </div>
              </div>
            ) : (
              // New event form
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <input
                  type="text"
                  placeholder="Titel"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '0.5px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '14px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '16px',
                    outline: 'none',
                  }}
                />
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    type="date"
                    value={newEvent.date ? format(newEvent.date, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setNewEvent({ ...newEvent, date: new Date(e.target.value) })}
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '0.5px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '14px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '16px',
                      outline: 'none',
                    }}
                  />
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '0.5px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '14px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '16px',
                      outline: 'none',
                    }}
                  />
                </div>

                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as CalendarEvent['type'] })}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '0.5px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '14px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '16px',
                    outline: 'none',
                  }}
                >
                  <option value="viewing">Besichtigung</option>
                  <option value="moving">Umzug</option>
                  <option value="quote">Angebot</option>
                  <option value="other">Sonstiges</option>
                </select>

                <input
                  type="text"
                  placeholder="Ort"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '0.5px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '14px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '16px',
                    outline: 'none',
                  }}
                />

                <textarea
                  placeholder="Beschreibung"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  rows={3}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '0.5px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '14px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '16px',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />

                <button
                  onClick={handleSaveEvent}
                  style={{
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2))',
                    border: '0.5px solid rgba(102, 126, 234, 0.3)',
                    borderRadius: '12px',
                    padding: '14px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                >
                  Termin speichern
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlassCalendar;