const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * Import customers from calendar CSV export
 * Expects CSV with columns: Subject, Start Date, Start Time, End Date, End Time, Location, Description
 */
exports.importCalendarCSV = functions
  .region('europe-west1')
  .runWith({
    timeoutSeconds: 300,
    memory: '1GB'
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
    
    console.log('📅 Starting Calendar CSV import...');
    
    try {
      const db = admin.firestore();
      const csvData = req.body.csvData || '';
      const startDate = req.body.startDate || '2025-06-01';
      
      if (!csvData) {
        throw new Error('No CSV data provided');
      }
      
      const result = await importCalendarData(db, csvData, startDate);
      
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

async function importCalendarData(db, csvData, startDateFilter) {
  const stats = {
    totalEvents: 0,
    imported: 0,
    skipped: 0,
    errors: 0,
    duplicates: 0,
    importedCustomers: []
  };
  
  try {
    // Parse CSV
    const lines = csvData.split('\n');
    const headers = parseCSVLine(lines[0]);
    
    // Find column indices
    const indices = {
      subject: headers.findIndex(h => h.toLowerCase().includes('subject') || h.toLowerCase().includes('betreff')),
      startDate: headers.findIndex(h => h.toLowerCase().includes('start date') || h.toLowerCase().includes('startdatum')),
      location: headers.findIndex(h => h.toLowerCase().includes('location') || h.toLowerCase().includes('ort')),
      description: headers.findIndex(h => h.toLowerCase().includes('description') || h.toLowerCase().includes('beschreibung'))
    };
    
    // If standard columns not found, try alternative formats
    if (indices.subject === -1) {
      indices.subject = 0; // Assume first column is subject
    }
    
    const events = lines.slice(1)
      .filter(line => line.trim())
      .map(line => {
        const cols = parseCSVLine(line);
        return {
          subject: cols[indices.subject] || cols[0] || '',
          startDate: cols[indices.startDate] || cols[1] || '',
          location: cols[indices.location] || cols[indices.location !== -1 ? indices.location : 5] || '',
          description: cols[indices.description] || cols[indices.description !== -1 ? indices.description : 6] || ''
        };
      });
    
    // Filter by date
    const filteredEvents = events.filter(event => {
      if (!event.startDate) return false;
      const eventDate = parseDate(event.startDate);
      const filterDate = new Date(startDateFilter);
      return eventDate >= filterDate;
    });
    
    stats.totalEvents = filteredEvents.length;
    console.log(`📅 Found ${filteredEvents.length} events since ${startDateFilter}`);
    
    // Process each event
    for (const event of filteredEvents) {
      try {
        // Extract customer data
        const customer = extractCustomerFromCalendarEvent(event);
        
        // Skip if no name
        if (!customer.name || customer.name === 'Unbekannt') {
          console.log(`⏭️ Skipping event: No customer name found - ${event.subject}`);
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
          importedFrom: 'calendar-csv',
          importDate: new Date()
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

function extractCustomerFromCalendarEvent(event) {
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
    source: 'Kalender',
    notes: ''
  };
  
  // Extract name from subject
  customer.name = extractNameFromText(event.subject);
  
  // Parse description for details
  const allText = `${event.subject}\n${event.description}\n${event.location}`;
  const lines = allText.split('\n');
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Phone patterns
    if (lowerLine.includes('tel:') || lowerLine.includes('telefon:') || 
        lowerLine.includes('handy:') || lowerLine.includes('mobil:')) {
      const phone = extractPhone(line);
      if (phone) customer.phone = phone;
    } else if (!customer.phone) {
      // Look for phone pattern anywhere
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
        lowerLine.includes('auszug:') || lowerLine.includes('alte adresse:')) {
      customer.fromAddress = line.split(/:|=/)[1]?.trim() || '';
    }
    
    if (lowerLine.includes('nach:') || lowerLine.includes('to:') || 
        lowerLine.includes('einzug:') || lowerLine.includes('neue adresse:')) {
      customer.toAddress = line.split(/:|=/)[1]?.trim() || '';
    }
    
    // Area
    const areaMatch = line.match(/(\d+)\s*(?:m²|qm|m2)/i);
    if (areaMatch) {
      customer.apartment.area = parseInt(areaMatch[1]);
    }
    
    // Rooms
    const roomMatch = line.match(/(\d+)\s*(?:zimmer|zi\.|raum|räume)/i);
    if (roomMatch) {
      customer.apartment.rooms = parseInt(roomMatch[1]);
    }
    
    // Floor
    const floorMatch = line.match(/(\d+)\.\s*(?:etage|stock|og|obergeschoss)/i);
    if (floorMatch) {
      customer.apartment.floor = parseInt(floorMatch[1]);
    }
  }
  
  // Use location as address if available
  if (!customer.fromAddress && event.location) {
    // Check if location looks like an address
    if (event.location.match(/\d/) || event.location.includes(',')) {
      customer.fromAddress = event.location;
    }
  }
  
  // Parse and format move date
  const eventDate = parseDate(event.startDate);
  customer.moveDate = eventDate.toLocaleDateString('de-DE');
  customer.movingDate = customer.moveDate;
  
  // Build notes
  const noteParts = [`Kalender-Import: ${event.subject}`];
  if (event.description) noteParts.push(event.description);
  customer.notes = noteParts.join('\n').trim();
  
  return customer;
}

function extractNameFromText(text) {
  if (!text) return 'Unbekannt';
  
  // Remove common prefixes
  let cleaned = text
    .replace(/^(umzug|move|termin|appointment|kunde|customer)[\s:]+/i, '')
    .trim();
  
  // Patterns to extract names
  const patterns = [
    // "Name: XYZ" pattern
    /(?:name|kunde|customer)[\s:]+([^\n,;]+)/i,
    // Name at beginning (Capital letters)
    /^([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)*)/,
    // "Herr/Frau Name" pattern
    /(?:herr|frau|mr|mrs|ms)\s+([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)*)/i,
    // Family name pattern
    /(?:familie|family|fam\.)\s+([A-ZÄÖÜ][a-zäöüß]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // If no pattern matches, try to use first part if it looks like a name
  const firstPart = cleaned.split(/[,;\-–]/)[0].trim();
  if (firstPart && firstPart.length < 40 && /^[A-ZÄÖÜ]/.test(firstPart)) {
    return firstPart;
  }
  
  return 'Unbekannt';
}

function extractPhone(text) {
  // Various phone patterns
  const patterns = [
    /(\+49[\s\-]?[\d\s\-]+)/,
    /(0[\d\s\-\/]{10,})/,
    /(\d{3,}[\s\-]?\d{3,}[\s\-]?\d{2,})/
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let phone = match[1].replace(/[\s\-\/]/g, '');
      
      // Ensure proper formatting
      if (!phone.startsWith('+')) {
        if (phone.startsWith('0')) {
          phone = '+49' + phone.substring(1);
        } else if (phone.length >= 10) {
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

function parseDate(dateStr) {
  if (!dateStr) return new Date();
  
  // Try different date formats
  const formats = [
    // ISO format
    /(\d{4})-(\d{2})-(\d{2})/,
    // German format
    /(\d{1,2})\.(\d{1,2})\.(\d{2,4})/,
    // US format
    /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/
  ];
  
  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      if (format === formats[0]) {
        // ISO format
        return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
      } else if (format === formats[1]) {
        // German format
        const year = match[3].length === 2 ? 2000 + parseInt(match[3]) : parseInt(match[3]);
        return new Date(year, parseInt(match[2]) - 1, parseInt(match[1]));
      } else {
        // US format
        const year = match[3].length === 2 ? 2000 + parseInt(match[3]) : parseInt(match[3]);
        return new Date(year, parseInt(match[1]) - 1, parseInt(match[2]));
      }
    }
  }
  
  // Fallback to Date constructor
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"' && (i === 0 || line[i-1] === ',')) {
      inQuotes = true;
    } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
      inQuotes = false;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
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