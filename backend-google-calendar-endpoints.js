// Diese Datei zeigt, wie die Google Calendar Endpoints auf Ihrem Backend implementiert werden sollten
// Fügen Sie diesen Code zu Ihrer api.ruempel-schmiede.com Backend-Implementierung hinzu

const { google } = require('googleapis');
const calendar = google.calendar('v3');

// Service Account Credentials sollten aus Umgebungsvariablen oder einer sicheren Quelle geladen werden
// NIEMALS Credentials direkt im Code speichern!
const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');

// Alternative: Laden Sie die Credentials aus einer Datei
// const serviceAccountKey = require('./path/to/serviceAccountKey.json');

// Initialize auth
const auth = new google.auth.JWT(
  serviceAccountKey.client_email,
  null,
  serviceAccountKey.private_key,
  ['https://www.googleapis.com/auth/calendar']
);

google.options({ auth });

// API Endpoints

// POST /api/google-calendar/create-event
app.post('/api/google-calendar/create-event', async (req, res) => {
  try {
    const { calendarId, event } = req.body;
    
    const response = await calendar.events.insert({
      calendarId: calendarId,
      requestBody: event
    });
    
    res.json({ success: true, eventId: response.data.id });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/google-calendar/update-event
app.put('/api/google-calendar/update-event', async (req, res) => {
  try {
    const { calendarId, eventId, updates } = req.body;
    
    // Get existing event first
    const existingEvent = await calendar.events.get({
      calendarId: calendarId,
      eventId: eventId
    });
    
    // Merge updates
    const updatedEvent = {
      ...existingEvent.data,
      ...updates
    };
    
    const response = await calendar.events.update({
      calendarId: calendarId,
      eventId: eventId,
      requestBody: updatedEvent
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/google-calendar/delete-event
app.delete('/api/google-calendar/delete-event', async (req, res) => {
  try {
    const { calendarId, eventId } = req.body;
    
    await calendar.events.delete({
      calendarId: calendarId,
      eventId: eventId
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/google-calendar/events
app.get('/api/google-calendar/events', async (req, res) => {
  try {
    const { calendarId, timeMin, timeMax } = req.query;
    
    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: timeMin,
      timeMax: timeMax,
      singleEvents: true,
      orderBy: 'startTime'
    });
    
    res.json({ success: true, events: response.data.items || [] });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});