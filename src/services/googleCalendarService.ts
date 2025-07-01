import { CalendarEvent } from '../types';

class GoogleCalendarService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || 'https://api.ruempel-schmiede.com';
  }

  async createEvent(calendarEvent: CalendarEvent): Promise<string | null> {
    try {
      const response = await fetch(`${this.apiUrl}/api/google-calendar/create-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        body: JSON.stringify({
          calendarId: process.env.REACT_APP_GOOGLE_CALENDAR_ID || '6d1a99795c95e37c8bc26c6415bd22bc0c309b0a9d65daa0e22d7b2174eb0f4e@group.calendar.google.com',
          event: {
            summary: calendarEvent.title,
            description: calendarEvent.description || '',
            location: calendarEvent.location || '',
            start: {
              dateTime: this.getEventDateTime(calendarEvent.date, calendarEvent.startTime),
              timeZone: 'Europe/Berlin',
            },
            end: {
              dateTime: this.getEventDateTime(calendarEvent.date, calendarEvent.endTime || this.addHours(calendarEvent.startTime, 4)),
              timeZone: 'Europe/Berlin',
            },
            extendedProperties: {
              private: {
                customerId: calendarEvent.customerId || '',
                type: calendarEvent.type,
                appEventId: calendarEvent.id,
                source: 'umzugs-webapp'
              }
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Calendar service responded with status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Event created in Google Calendar:', data.eventId);
      return data.eventId;
    } catch (error) {
      console.error('❌ Error creating Google Calendar event:', error);
      return null;
    }
  }

  async updateEvent(googleEventId: string, calendarEvent: Partial<CalendarEvent>): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/api/google-calendar/update-event`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        body: JSON.stringify({
          calendarId: process.env.REACT_APP_GOOGLE_CALENDAR_ID || '6d1a99795c95e37c8bc26c6415bd22bc0c309b0a9d65daa0e22d7b2174eb0f4e@group.calendar.google.com',
          eventId: googleEventId,
          updates: {
            summary: calendarEvent.title,
            description: calendarEvent.description,
            location: calendarEvent.location,
            start: calendarEvent.date || calendarEvent.startTime ? {
              dateTime: this.getEventDateTime(
                calendarEvent.date || new Date(),
                calendarEvent.startTime
              ),
              timeZone: 'Europe/Berlin',
            } : undefined,
            end: calendarEvent.date || calendarEvent.endTime ? {
              dateTime: this.getEventDateTime(
                calendarEvent.date || new Date(),
                calendarEvent.endTime
              ),
              timeZone: 'Europe/Berlin',
            } : undefined,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Calendar service responded with status: ${response.status}`);
      }

      console.log('✅ Event updated in Google Calendar');
      return true;
    } catch (error) {
      console.error('❌ Error updating Google Calendar event:', error);
      return false;
    }
  }

  async deleteEvent(googleEventId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/api/google-calendar/delete-event`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        body: JSON.stringify({
          calendarId: process.env.REACT_APP_GOOGLE_CALENDAR_ID || '6d1a99795c95e37c8bc26c6415bd22bc0c309b0a9d65daa0e22d7b2174eb0f4e@group.calendar.google.com',
          eventId: googleEventId
        })
      });

      if (!response.ok) {
        throw new Error(`Calendar service responded with status: ${response.status}`);
      }

      console.log('✅ Event deleted from Google Calendar');
      return true;
    } catch (error) {
      console.error('❌ Error deleting Google Calendar event:', error);
      return false;
    }
  }

  private getEventDateTime(date: Date | string, time?: Date | string): string {
    const eventDate = typeof date === 'string' ? new Date(date) : date;
    
    if (time) {
      const timeDate = typeof time === 'string' ? new Date(time) : time;
      eventDate.setHours(timeDate.getHours());
      eventDate.setMinutes(timeDate.getMinutes());
    } else {
      // Default to 9:00 AM if no time specified
      eventDate.setHours(9, 0, 0, 0);
    }

    return eventDate.toISOString();
  }

  private addHours(time: Date | string | undefined, hours: number): Date {
    const date = time ? (typeof time === 'string' ? new Date(time) : time) : new Date();
    date.setHours(date.getHours() + hours);
    return date;
  }

  isInitialized(): boolean {
    // Always return true for browser-based service
    return true;
  }
}

export const googleCalendarService = new GoogleCalendarService();