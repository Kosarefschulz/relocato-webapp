import ICAL from 'ical.js';

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  date: Date;
  startTime?: Date;
  endTime?: Date;
  customerName?: string;
  phone?: string;
  email?: string;
  attendees?: string[];
  organizer?: string;
  uid?: string;
  recurrence?: any;
}

export async function parseICSFile(icsContent: string): Promise<CalendarEvent[]> {
  try {
    const jcalData = ICAL.parse(icsContent);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');
    
    const events: CalendarEvent[] = [];
    
    for (const vevent of vevents) {
      const event = new ICAL.Event(vevent);
      
      // Extract basic event data
      const calendarEvent: CalendarEvent = {
        id: event.uid || `event-${Date.now()}-${Math.random()}`,
        summary: event.summary || 'Unbenannter Termin',
        description: event.description || '',
        location: event.location || '',
        date: event.startDate ? event.startDate.toJSDate() : new Date(),
        startTime: event.startDate ? event.startDate.toJSDate() : undefined,
        endTime: event.endDate ? event.endDate.toJSDate() : undefined,
        uid: event.uid,
      };
      
      // Extract customer information from various fields
      const extractedData = extractCustomerData(calendarEvent);
      Object.assign(calendarEvent, extractedData);
      
      // Extract attendees
      const attendees: string[] = [];
      const attendeeProps = vevent.getAllProperties('attendee');
      for (const attendeeProp of attendeeProps) {
        const attendeeValue = attendeeProp.getFirstValue();
        if (attendeeValue) {
          attendees.push(attendeeValue.toString());
        }
      }
      calendarEvent.attendees = attendees;
      
      // Extract organizer
      const organizerProp = vevent.getFirstProperty('organizer');
      if (organizerProp) {
        calendarEvent.organizer = organizerProp.getFirstValue()?.toString();
      }
      
      events.push(calendarEvent);
    }
    
    return events;
  } catch (error) {
    console.error('Error parsing ICS file:', error);
    throw new Error('Fehler beim Parsen der ICS-Datei. Bitte überprüfen Sie das Format.');
  }
}

function extractCustomerData(event: CalendarEvent): Partial<CalendarEvent> {
  const extracted: Partial<CalendarEvent> = {};
  
  // Combine all text fields for analysis
  const allText = `${event.summary}\n${event.description}\n${event.location}`.toLowerCase();
  const lines = allText.split('\n');
  
  // Extract customer name
  extracted.customerName = extractCustomerName(event.summary, event.description || '');
  
  // Extract phone number
  for (const line of lines) {
    const phone = extractPhoneNumber(line);
    if (phone && !extracted.phone) {
      extracted.phone = phone;
    }
  }
  
  // Extract email
  const emailMatch = allText.match(/[\w\.-]+@[\w\.-]+\.\w+/);
  if (emailMatch) {
    extracted.email = emailMatch[0];
  }
  
  // Extract from attendees
  if (event.attendees) {
    for (const attendee of event.attendees) {
      // Extract email from attendee
      if (!extracted.email && attendee.includes('@')) {
        const emailMatch = attendee.match(/[\w\.-]+@[\w\.-]+\.\w+/);
        if (emailMatch) {
          extracted.email = emailMatch[0];
        }
      }
      
      // Extract name from attendee CN field
      if (attendee.includes('CN=')) {
        const cnMatch = attendee.match(/CN=([^;,]+)/);
        if (cnMatch && cnMatch[1] && (!extracted.customerName || extracted.customerName === 'Unbekannt')) {
          extracted.customerName = cnMatch[1].trim();
        }
      }
    }
  }
  
  return extracted;
}

function extractCustomerName(summary: string, description: string): string {
  if (!summary) return 'Unbekannt';
  
  // Remove common prefixes
  let cleaned = summary
    .replace(/^(umzug|move|termin|appointment|kunde|customer|auftrag)[\s:]+/i, '')
    .replace(/^(UT|UC|UK|UM)[\s\-:]+/i, '')
    .trim();
  
  // Patterns to extract names
  const patterns = [
    // "Name: XYZ" pattern
    /(?:name|kunde|customer)[\s:]+([^\n,;]+)/i,
    // Name at beginning (Capital letters)
    /^([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß\-]+)*)/,
    // "Herr/Frau Name" pattern
    /(?:herr|frau|mr|mrs|ms|dr|prof)\s+([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß\-]+)*)/i,
    // Family name pattern
    /(?:familie|family|fam\.)\s+([A-ZÄÖÜ][a-zäöüß]+)/i,
    // Company pattern
    /(?:firma|company|gmbh|ag|kg|ohg|gbr)\s*:?\s*([^,;\n]+)/i
  ];
  
  // Try patterns on summary first
  for (const pattern of patterns) {
    const match = summary.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // Try patterns on description
  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // Try to extract from common formats like "Müller, 15.6"
  const commaMatch = cleaned.match(/^([A-ZÄÖÜ][a-zäöüß\-]+(?:\s+[A-ZÄÖÜ][a-zäöüß\-]+)*)\s*,/);
  if (commaMatch) {
    return commaMatch[1].trim();
  }
  
  // If no pattern matches, try to use first part if it looks like a name
  const firstPart = cleaned.split(/[,;\-–\|]/)[0].trim();
  if (firstPart && firstPart.length < 50 && /^[A-ZÄÖÜ]/.test(firstPart) && !firstPart.match(/\d{2}/)) {
    return firstPart;
  }
  
  return 'Unbekannt';
}

function extractPhoneNumber(text: string): string | null {
  // Remove common prefixes
  const cleanText = text.replace(/tel[\.:]\s*/i, '').replace(/telefon[\.:]\s*/i, '');
  
  // Various phone patterns
  const patterns = [
    /(\+49[\s\-]?[\d\s\-\/\(\)]+)/,
    /(0[\d\s\-\/\(\)]{10,})/,
    /(\d{3,}[\s\-\/]?\d{3,}[\s\-\/]?\d{2,})/
  ];
  
  for (const pattern of patterns) {
    const match = cleanText.match(pattern);
    if (match) {
      let phone = match[1].replace(/[\s\-\/\(\)]/g, '');
      
      // Ensure proper formatting
      if (!phone.startsWith('+')) {
        if (phone.startsWith('0')) {
          // German number starting with 0
          phone = '+49' + phone.substring(1);
        } else if (phone.startsWith('49')) {
          // Already has German country code, just add +
          phone = '+' + phone;
        } else if (phone.length >= 10) {
          // Other number without country code
          phone = '+49' + phone;
        }
      }
      
      // Validate length
      if (phone.length >= 10 && phone.length <= 15) {
        return phone;
      }
    }
  }
  
  return null;
}

// Export function to convert calendar event to customer data
export function calendarEventToCustomer(event: CalendarEvent): any {
  return {
    name: event.customerName || 'Unbekannt',
    phone: event.phone || '',
    email: event.email || '',
    fromAddress: event.location || '',
    toAddress: '',
    movingDate: event.date.toISOString(),
    apartment: {
      rooms: 3,
      area: 60,
      floor: 0,
      hasElevator: false
    },
    services: ['Umzug'],
    source: 'Apple Calendar Import',
    notes: `Importiert aus: ${event.summary}\n${event.description || ''}`.trim(),
  };
}