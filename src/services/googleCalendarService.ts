import { google } from 'googleapis';
import { CalendarEvent } from '../types';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

class GoogleCalendarService {
  private calendar: any;
  private auth: any;
  private initialized = false;
  private calendarId: string = '';

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      // In production, these should come from environment variables
      const serviceAccountKey = {
        type: "service_account",
        project_id: "umzugsapp",
        private_key_id: "84833a08c159b73412f83988401bf89980522a22",
        private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCnX1DibLKoHUZa\np2Uhb9u/0NhiMj8t67IGP9bVWX38tFE5iIbnM2ytBr4vuF9bHlPaql0cR0HiuYjW\nGvQTgV2XO9obdE3mt7pyEImx/eBPV39HSZOtiRj5DVEr1RC/0b3aGJaG9Vsdaa2e\nvzyKROelCIy8GmXtEYOwynKMYR6+mwr61WQv27aoQmLV52eV9nZmggGfYPSt4t0M\nTvah5tQ+O237l60uGOKgFZG8bZEO7VreLwC/mIfbbnRiv/zh3bk3/tysOsoH2KGg\njzYdLAfGcMsipPVpoX7/T1xHw9pumzDEnq5J+WJv9nFBaD6W6iEO/yiyoC6sNEqS\nNPqS3tbtAgMBAAECggEAJrGLcn0spF74N9cBM0S36dVvYOw63PPjWTyC/xnMXZKW\nQJXGkka6Nhob985JBTiyrBe8pN/4ZGD+OHlMugGrUF4+4x/1LoSFLv+Rxbtqkw0o\nWKOy52iNhG5GuLpuP9pOaNBMZHDumpMm109gwJqDbwzV9Fqp+6+T4Vg8OSXuxKOV\nlWDUrCkr9lV6CPJ9+LJDyphaN+vNTizq+mUzr/ARcZbSCvTR/6a4zey5c/Bgjt2R\nbYG08uq+Y1ucoOoyS/mS6ooowmZudIaEQVfm/KgETtjkqgFqJ4VpG7sdAUAkZXDN\nvauXlBsClw4Wbpf1zN+frROVI4n3OYXBuc5z3QCj5QKBgQDWsa5b/1zZok634OXG\nMx3338J+HfLFU6jGdxC7D1LJCODWu0fcNJHgumh1aqlA0vmue6CUc/wFl0E6YKM+\nWXg2zNMqIlqb4j+cZRXovH/6+s1NE08C3PoPZMlKRQ+CbW74SnD4AINx9GhzDxKo\n5r4VDo56oYdiQlHszHgLrcTtnwKBgQDHkuYl9hqHiPGMq9XV+2JLYf7hBgR55ohE\nHSxJgofa2zB0/R3Nnwi294KTWDUSoAuGwUsMdt8tde/kaw9TJvTG//pAw7Wex7iJ\nSArPWoE3v7TNgmIX6KnKdD/NTY3GXPfsMreidJrHcJPMEeLiVXbOEF6Hhg2d8JWE\nODFBOWgX8wKBgBv06zWDnT2hywpauNEEWwSqGJN/pttXN4UQgBc7uZYAF/ceUA82\nsUBIRc30Y7HTRzwXUSPDrq+zsIS/jMJTuDm6lkzISHBAF/RvnVi/IxM1kYJV31YK\nHG3gu+117L0ZLvgaCXfh6TvvjaJd9hoUYfAwAxGo8w4ygKSLQ56RtDEVAoGADsBA\n2pVyKIpqsCcTSxmljkTT/fXf5tKvR7mQSG6pc/e3gS4kQcp7bmqk8BcY9SN3NqKa\n1XUD0exhqtRu8YpzlTHeYWMVzYKdlSgKBIGAA4rb5kS402OTCS/Gd3o//GVqvb6R\n7CQKPKuJgQ/hYTFH8rsrAYFbCE17/6XXniaMFxkCgYBpgW7YbzQFva/YGpkbf1Mc\nUdV3NHDdPACBa321ptUdUm+g+YsLIqrXct3pbrnnQ3xd3V+YOZ/RCU3Q67teqsPp\nrcsPaZtl85q3V87UAhd5/buoOzxk6BNNkg03OWwa3f3lnMJ74soNN61tSOFJEN2S\n5t4FK5Y8F51HuwJQEtWYzw==\n-----END PRIVATE KEY-----\n",
        client_email: "firebase-adminsdk-fbsvc@umzugsapp.iam.gserviceaccount.com",
        client_id: "112817206994539713989",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40umzugsapp.iam.gserviceaccount.com"
      };

      this.auth = new google.auth.JWT(
        serviceAccountKey.client_email,
        undefined,
        serviceAccountKey.private_key,
        SCOPES
      );

      this.calendar = google.calendar({ version: 'v3', auth: this.auth });
      
      // Get calendar ID from environment
      this.calendarId = process.env.REACT_APP_GOOGLE_CALENDAR_ID || '6d1a99795c95e37c8bc26c6415bd22bc0c309b0a9d65daa0e22d7b2174eb0f4e@group.calendar.google.com';
      
      this.initialized = true;
      console.log('✅ Google Calendar Service initialized');
    } catch (error) {
      console.error('❌ Error initializing Google Calendar:', error);
      this.initialized = false;
    }
  }

  async createEvent(calendarEvent: CalendarEvent): Promise<string | null> {
    if (!this.initialized) {
      console.error('Google Calendar Service not initialized');
      return null;
    }

    try {
      // Convert our CalendarEvent to Google Calendar event format
      const startDateTime = this.getEventDateTime(calendarEvent.date, calendarEvent.startTime);
      const endDateTime = this.getEventDateTime(calendarEvent.date, calendarEvent.endTime || this.addHours(calendarEvent.startTime, 4));

      const event = {
        summary: calendarEvent.title,
        description: calendarEvent.description || '',
        location: calendarEvent.location || '',
        start: {
          dateTime: startDateTime,
          timeZone: 'Europe/Berlin',
        },
        end: {
          dateTime: endDateTime,
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
      };

      const response = await this.calendar.events.insert({
        calendarId: this.calendarId,
        resource: event,
      });

      console.log('✅ Event created in Google Calendar:', response.data.id);
      return response.data.id;
    } catch (error) {
      console.error('❌ Error creating Google Calendar event:', error);
      return null;
    }
  }

  async updateEvent(googleEventId: string, calendarEvent: Partial<CalendarEvent>): Promise<boolean> {
    if (!this.initialized) {
      console.error('Google Calendar Service not initialized');
      return false;
    }

    try {
      const existingEvent = await this.calendar.events.get({
        calendarId: this.calendarId,
        eventId: googleEventId,
      });

      const updatedEvent = {
        ...existingEvent.data,
        summary: calendarEvent.title || existingEvent.data.summary,
        description: calendarEvent.description || existingEvent.data.description,
        location: calendarEvent.location || existingEvent.data.location,
      };

      if (calendarEvent.date || calendarEvent.startTime) {
        const startDateTime = this.getEventDateTime(
          calendarEvent.date || existingEvent.data.start.dateTime,
          calendarEvent.startTime
        );
        updatedEvent.start = {
          dateTime: startDateTime,
          timeZone: 'Europe/Berlin',
        };
      }

      if (calendarEvent.date || calendarEvent.endTime) {
        const endDateTime = this.getEventDateTime(
          calendarEvent.date || existingEvent.data.end.dateTime,
          calendarEvent.endTime
        );
        updatedEvent.end = {
          dateTime: endDateTime,
          timeZone: 'Europe/Berlin',
        };
      }

      await this.calendar.events.update({
        calendarId: this.calendarId,
        eventId: googleEventId,
        resource: updatedEvent,
      });

      console.log('✅ Event updated in Google Calendar');
      return true;
    } catch (error) {
      console.error('❌ Error updating Google Calendar event:', error);
      return false;
    }
  }

  async deleteEvent(googleEventId: string): Promise<boolean> {
    if (!this.initialized) {
      console.error('Google Calendar Service not initialized');
      return false;
    }

    try {
      await this.calendar.events.delete({
        calendarId: this.calendarId,
        eventId: googleEventId,
      });

      console.log('✅ Event deleted from Google Calendar');
      return true;
    } catch (error) {
      console.error('❌ Error deleting Google Calendar event:', error);
      return false;
    }
  }

  async getEvents(startDate: Date, endDate: Date): Promise<any[]> {
    if (!this.initialized) {
      console.error('Google Calendar Service not initialized');
      return [];
    }

    try {
      const response = await this.calendar.events.list({
        calendarId: this.calendarId,
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items || [];
    } catch (error) {
      console.error('❌ Error fetching Google Calendar events:', error);
      return [];
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
    return this.initialized;
  }

  setCalendarId(calendarId: string) {
    this.calendarId = calendarId;
    console.log('📅 Calendar ID set to:', calendarId);
  }
}

export const googleCalendarService = new GoogleCalendarService();