const functions = require('firebase-functions');
const admin = require('firebase-admin');
const ical = require('ical');

/**
 * Import customers from ICS file (Apple Calendar export)
 */
exports.importFromICS = functions
  .region('europe-west1')
  .runWith({
    timeoutSeconds: 540,
    memory: '2GB'
  })
  .https.onRequest(async (req, res) => {
    // CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }
    
    console.log('📅 Starting ICS (Apple Calendar) import...');
    
    try {
      const db = admin.firestore();
      const icsData = req.body.icsData || '';
      
      if (!icsData) {
        throw new Error('No ICS data provided');
      }
      
      const result = await importICSData(db, icsData);
      
      res.json({
        success: true,
        message: 'ICS import completed',
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

async function importICSData(db, icsData) {
  const stats = {
    totalEvents: 0,
    imported: 0,
    skipped: 0,
    errors: 0,
    duplicates: 0,
    importedCustomers: []
  };
  
  try {
    // Parse ICS data
    const events = ical.parseICS(icsData);
    const eventsList = Object.values(events).filter(event => event.type === 'VEVENT');
    
    stats.totalEvents = eventsList.length;
    console.log(`📅 Found ${eventsList.length} events in ICS file`);
    
    // Process each event
    for (const event of eventsList) {
      try {
        // Extract customer data from event
        const customer = extractCustomerFromICSEvent(event);
        
        // Skip if no name found
        if (!customer.name || customer.name === 'Unbekannt') {
          console.log(`⏭️ Skipping event: No customer name found - ${event.summary}`);
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
          importedFrom: 'apple-calendar-ics',
          importDate: new Date(),
          icsEventId: event.uid
        });
        
        // Create automatic quote
        await createAutomaticQuote(customer, db);
        
        console.log(`✅ Imported: ${customer.customerNumber} - ${customer.name}`);
        stats.imported++;
        stats.importedCustomers.push({
          customerNumber: customer.customerNumber,
          name: customer.name,
          moveDate: customer.moveDate
        });
        
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

function extractCustomerFromICSEvent(event) {
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
    source: 'Apple Kalender',
    notes: ''
  };
  
  // Extract name from summary/title
  const summary = event.summary || '';
  customer.name = extractNameFromText(summary);
  
  // Combine all text fields for parsing
  const description = event.description || '';
  const location = event.location || '';
  const attendees = event.attendee ? (Array.isArray(event.attendee) ? event.attendee : [event.attendee]) : [];
  
  const allText = `${summary}\n${description}\n${location}\n${attendees.join('\n')}`;
  const lines = allText.split('\n');
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Phone patterns
    if (lowerLine.includes('tel:') || lowerLine.includes('telefon:') || 
        lowerLine.includes('handy:') || lowerLine.includes('mobil:') || 
        lowerLine.includes('phone:')) {
      const phone = extractPhone(line);
      if (phone) customer.phone = phone;
    } else if (!customer.phone) {
      // Look for phone pattern anywhere in line
      const phoneInLine = extractPhone(line);
      if (phoneInLine) customer.phone = phoneInLine;
    }
    
    // Email
    const emailMatch = line.match(/[\w\.-]+@[\w\.-]+\.\w+/);
    if (emailMatch) {
      customer.email = emailMatch[0].toLowerCase();
    }
    
    // Addresses
    if (lowerLine.includes('von:') || lowerLine.includes('from:') || 
        lowerLine.includes('auszug:') || lowerLine.includes('alte adresse:') ||
        lowerLine.includes('abholadresse:')) {
      customer.fromAddress = line.split(/[:=]/)[1]?.trim() || '';
    }
    
    if (lowerLine.includes('nach:') || lowerLine.includes('to:') || 
        lowerLine.includes('einzug:') || lowerLine.includes('neue adresse:') ||
        lowerLine.includes('lieferadresse:')) {
      customer.toAddress = line.split(/[:=]/)[1]?.trim() || '';
    }
    
    // Area
    const areaMatch = line.match(/(\d+)\s*(?:m²|qm|m2|quadratmeter)/i);
    if (areaMatch) {
      customer.apartment.area = parseInt(areaMatch[1]);
    }
    
    // Rooms
    const roomMatch = line.match(/(\d+)\s*(?:zimmer|zi\.|raum|räume|zkb|zkdb)/i);
    if (roomMatch) {
      customer.apartment.rooms = parseInt(roomMatch[1]);
    }
    
    // Floor
    const floorMatch = line.match(/(\d+)\.\s*(?:etage|stock|og|obergeschoss|eg|erdgeschoss)/i);
    if (floorMatch) {
      customer.apartment.floor = parseInt(floorMatch[1]);
    } else if (lowerLine.includes('erdgeschoss') || lowerLine.includes('eg')) {
      customer.apartment.floor = 0;
    }
    
    // Elevator
    if (lowerLine.includes('aufzug') || lowerLine.includes('fahrstuhl') || lowerLine.includes('lift')) {
      customer.apartment.hasElevator = true;
    }
  }
  
  // Use location as address if no from address found
  if (!customer.fromAddress && location) {
    // Check if location looks like an address
    if (location.match(/\d/) || location.includes(',') || location.includes('straße') || location.includes('str.')) {
      customer.fromAddress = location;
    }
  }
  
  // Extract attendee info if no email/phone found
  if (!customer.email || !customer.phone) {
    for (const attendee of attendees) {
      const attendeeStr = typeof attendee === 'string' ? attendee : attendee.val || '';
      
      // Extract email from attendee
      if (!customer.email && attendeeStr.includes('@')) {
        const emailMatch = attendeeStr.match(/[\w\.-]+@[\w\.-]+\.\w+/);
        if (emailMatch) customer.email = emailMatch[0].toLowerCase();
      }
      
      // Extract name from attendee if better than current
      if (attendeeStr.includes('CN=')) {
        const cnMatch = attendeeStr.match(/CN=([^;,]+)/);
        if (cnMatch && cnMatch[1] && (!customer.name || customer.name === 'Unbekannt')) {
          customer.name = cnMatch[1].trim();
        }
      }
    }
  }
  
  // Use event date as move date
  if (event.start) {
    const eventDate = new Date(event.start);
    customer.moveDate = eventDate.toLocaleDateString('de-DE');
    customer.movingDate = customer.moveDate;
  }
  
  // Build comprehensive notes
  const noteParts = [`Apple Kalender Import: ${summary}`];
  if (description) noteParts.push(`Beschreibung: ${description}`);
  if (location && customer.fromAddress !== location) noteParts.push(`Ort: ${location}`);
  if (event.uid) noteParts.push(`Event-ID: ${event.uid}`);
  customer.notes = noteParts.join('\n').trim();
  
  return customer;
}

function extractNameFromText(text) {
  if (!text) return 'Unbekannt';
  
  // Remove common prefixes
  let cleaned = text
    .replace(/^(umzug|move|termin|appointment|kunde|customer|auftrag)[\s:]+/i, '')
    .replace(/^(UT|UC|UK|UM)[\s\-:]+/i, '') // Common abbreviations
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
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
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

function extractPhone(text) {
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
  
  return '';
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
  if (customer.name && customer.name !== 'Unbekannt' && customer.moveDate) {
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
    comment: `Automatisch erstelltes Angebot basierend auf Apple Kalender Import.\n\nUmzugstermin: ${customer.moveDate}`,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'apple-calendar-import',
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