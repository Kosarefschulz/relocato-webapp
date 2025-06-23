const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { google } = require('googleapis');

/**
 * Import customers from Google Calendar events
 * Imports all events from June 1st onwards
 */
exports.importFromCalendar = functions
  .region('europe-west1')
  .runWith({
    timeoutSeconds: 540,
    memory: '2GB'
  })
  .https.onRequest(async (req, res) => {
    // CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    
    console.log('📅 Starting Google Calendar import...');
    
    try {
      const db = admin.firestore();
      const calendarId = req.query.calendarId || 'primary';
      const startDate = req.query.startDate || '2025-06-01';
      
      const result = await importCalendarEvents(db, calendarId, startDate);
      
      res.json({
        success: true,
        message: 'Calendar import completed',
        ...result
      });
    } catch (error) {
      console.error('❌ Import error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

async function importCalendarEvents(db, calendarId, startDate) {
  const stats = {
    totalEvents: 0,
    imported: 0,
    skipped: 0,
    errors: 0,
    duplicates: 0
  };
  
  try {
    // Setup Google Calendar API
    const auth = new google.auth.GoogleAuth({
      keyFile: './service-account-key.json', // You'll need to add this
      scopes: ['https://www.googleapis.com/auth/calendar.readonly']
    });
    
    const calendar = google.calendar({ version: 'v3', auth });
    
    // Get events from calendar
    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: new Date(startDate).toISOString(),
      maxResults: 2500,
      singleEvents: true,
      orderBy: 'startTime'
    });
    
    const events = response.data.items || [];
    stats.totalEvents = events.length;
    
    console.log(`📅 Found ${events.length} events since ${startDate}`);
    
    // Process each event
    for (const event of events) {
      try {
        // Skip events without proper data
        if (!event.summary && !event.description) {
          stats.skipped++;
          continue;
        }
        
        // Extract customer data from event
        const customer = extractCustomerFromEvent(event);
        
        if (!customer.name || customer.name === 'Unbekannt') {
          console.log(`⏭️ Skipping event: No customer name found`);
          stats.skipped++;
          continue;
        }
        
        // Check for duplicate
        const isDuplicate = await checkDuplicateCustomer(db, customer);
        
        if (isDuplicate) {
          console.log(`⚠️ Duplicate customer: ${customer.name}`);
          stats.duplicates++;
          continue;
        }
        
        // Generate customer number
        customer.customerNumber = await generateCustomerNumber(db);
        customer.id = customer.customerNumber;
        
        // Save to Firebase
        await db.collection('customers').doc(customer.id).set({
          ...customer,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          importedFrom: 'google-calendar',
          importDate: new Date(),
          calendarEventId: event.id
        });
        
        // Create automatic quote
        await createAutomaticQuote(customer, db);
        
        console.log(`✅ Imported: ${customer.customerNumber} - ${customer.name}`);
        stats.imported++;
        
      } catch (error) {
        console.error(`❌ Error processing event:`, error.message);
        stats.errors++;
      }
    }
    
    console.log(`\n🎉 Import completed:
    - Total events: ${stats.totalEvents}
    - Imported: ${stats.imported}
    - Duplicates: ${stats.duplicates}
    - Skipped: ${stats.skipped}
    - Errors: ${stats.errors}`);
    
    return stats;
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  }
}

function extractCustomerFromEvent(event) {
  const customer = {
    name: '',
    phone: '',
    email: '',
    fromAddress: '',
    toAddress: '',
    moveDate: '',
    movingDate: '',
    apartment: {
      rooms: 3,
      area: 60,
      floor: 0,
      hasElevator: false
    },
    services: ['Umzug'],
    notes: ''
  };
  
  // Extract from event title
  const title = event.summary || '';
  customer.name = extractName(title) || extractName(event.description);
  
  // Extract from description
  const description = event.description || '';
  const lines = description.split('\n');
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Phone number
    if (lowerLine.includes('tel:') || lowerLine.includes('telefon:') || lowerLine.includes('phone:')) {
      customer.phone = extractPhone(line);
    }
    
    // Email
    if (lowerLine.includes('email:') || lowerLine.includes('mail:') || line.includes('@')) {
      customer.email = extractEmail(line);
    }
    
    // From address
    if (lowerLine.includes('von:') || lowerLine.includes('from:') || lowerLine.includes('auszug:')) {
      customer.fromAddress = line.split(':').slice(1).join(':').trim();
    }
    
    // To address
    if (lowerLine.includes('nach:') || lowerLine.includes('to:') || lowerLine.includes('einzug:')) {
      customer.toAddress = line.split(':').slice(1).join(':').trim();
    }
    
    // Area
    if (lowerLine.includes('m²') || lowerLine.includes('qm') || lowerLine.includes('fläche')) {
      const area = extractNumber(line);
      if (area) customer.apartment.area = area;
    }
    
    // Rooms
    if (lowerLine.includes('zimmer') || lowerLine.includes('rooms')) {
      const rooms = extractNumber(line);
      if (rooms) customer.apartment.rooms = rooms;
    }
    
    // Floor
    if (lowerLine.includes('etage') || lowerLine.includes('stock') || lowerLine.includes('floor')) {
      const floor = extractNumber(line);
      if (floor !== null) customer.apartment.floor = floor;
    }
  }
  
  // Use event date as move date
  if (event.start) {
    const eventDate = event.start.dateTime || event.start.date;
    customer.moveDate = new Date(eventDate).toLocaleDateString('de-DE');
    customer.movingDate = customer.moveDate;
  }
  
  // Location as address if not found
  if (!customer.fromAddress && event.location) {
    customer.fromAddress = event.location;
  }
  
  // Add all event details to notes
  customer.notes = `Kalender-Import: ${title}\n${description}`.trim();
  
  return customer;
}

function extractName(text) {
  if (!text) return '';
  
  // Common patterns for names in calendar events
  const patterns = [
    /^([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)*)/,
    /Kunde:\s*([^\n,]+)/i,
    /Name:\s*([^\n,]+)/i,
    /Umzug\s+([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)*)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // Try to extract from first line if it looks like a name
  const firstLine = text.split('\n')[0].trim();
  if (firstLine && firstLine.length < 50 && /^[A-ZÄÖÜ]/.test(firstLine)) {
    return firstLine;
  }
  
  return '';
}

function extractPhone(text) {
  // Remove all non-numeric except + and spaces
  const phoneMatch = text.match(/[\+\d\s\-\(\)]+/);
  if (phoneMatch) {
    let phone = phoneMatch[0].replace(/[^\d+]/g, '');
    
    // Add German country code if missing
    if (phone && !phone.startsWith('+')) {
      if (phone.startsWith('0')) {
        phone = '+49' + phone.substring(1);
      } else {
        phone = '+49' + phone;
      }
    }
    
    return phone;
  }
  return '';
}

function extractEmail(text) {
  const emailMatch = text.match(/[\w\.-]+@[\w\.-]+\.\w+/);
  return emailMatch ? emailMatch[0].toLowerCase() : '';
}

function extractNumber(text) {
  const numberMatch = text.match(/\d+/);
  return numberMatch ? parseInt(numberMatch[0]) : null;
}

async function checkDuplicateCustomer(db, customer) {
  // Check by email
  if (customer.email) {
    const emailCheck = await db.collection('customers')
      .where('email', '==', customer.email)
      .limit(1)
      .get();
    
    if (!emailCheck.empty) return true;
  }
  
  // Check by phone
  if (customer.phone) {
    const phoneCheck = await db.collection('customers')
      .where('phone', '==', customer.phone)
      .limit(1)
      .get();
    
    if (!phoneCheck.empty) return true;
  }
  
  // Check by name and move date
  if (customer.name && customer.moveDate) {
    const nameCheck = await db.collection('customers')
      .where('name', '==', customer.name)
      .where('moveDate', '==', customer.moveDate)
      .limit(1)
      .get();
    
    if (!nameCheck.empty) return true;
  }
  
  return false;
}

async function generateCustomerNumber(db) {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  const counterRef = db.collection('counters').doc(`customers_${year}_${month}`);
  
  return await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(counterRef);
    
    let counter = 1;
    if (doc.exists) {
      counter = (doc.data().value || 0) + 1;
    }
    
    transaction.set(counterRef, { value: counter });
    
    return `K${year}${month}${String(counter).padStart(3, '0')}`;
  });
}

async function createAutomaticQuote(customer, db) {
  const basePrice = 450;
  const pricePerRoom = 150;
  const pricePerSqm = 8;
  const pricePerFloor = 50;
  
  let price = basePrice;
  
  if (customer.apartment?.rooms) {
    price += customer.apartment.rooms * pricePerRoom;
  }
  
  if (customer.apartment?.area) {
    price += customer.apartment.area * pricePerSqm;
  }
  
  if (customer.apartment?.floor > 0 && !customer.apartment?.hasElevator) {
    price += customer.apartment.floor * pricePerFloor;
  }
  
  const volume = (customer.apartment?.rooms || 3) * 12;
  const quoteId = `Q${Date.now()}_${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  
  const quote = {
    id: quoteId,
    customerId: customer.id,
    customerName: customer.name,
    price: Math.round(price),
    status: 'draft',
    comment: `Automatisch erstelltes Angebot basierend auf Kalender-Import.\n\nUmzugstermin: ${customer.moveDate}`,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'calendar-import',
    volume: volume,
    distance: 25,
    moveDate: customer.moveDate,
    fromAddress: customer.fromAddress,
    toAddress: customer.toAddress,
    services: customer.services || ['Umzug']
  };
  
  await db.collection('quotes').doc(quoteId).set(quote);
  
  return quote;
}