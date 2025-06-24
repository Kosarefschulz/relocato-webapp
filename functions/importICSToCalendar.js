const functions = require('firebase-functions');
const admin = require('firebase-admin');
const ical = require('ical');

/**
 * Import all events from ICS file to calendar collection
 */
exports.importICSToCalendar = functions
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
    
    console.log('📅 Starting ICS to Calendar import...');
    
    try {
      const db = admin.firestore();
      const icsData = req.body.icsData || '';
      
      if (!icsData) {
        throw new Error('No ICS data provided');
      }
      
      const result = await importEventsToCalendar(db, icsData);
      
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

async function importEventsToCalendar(db, icsData) {
  const stats = {
    totalEvents: 0,
    imported: 0,
    skipped: 0,
    errors: 0,
    duplicates: 0
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
        // Check for duplicate by UID
        if (event.uid) {
          const existingEvent = await db.collection('calendar')
            .where('originalEvent.uid', '==', event.uid)
            .limit(1)
            .get();
          
          if (!existingEvent.empty) {
            console.log(`⚠️ Duplicate event: ${event.summary}`);
            stats.duplicates++;
            continue;
          }
        }
        
        // Extract basic event data
        const summary = event.summary || 'Kein Titel';
        const description = event.description || '';
        const location = event.location || '';
        const start = event.start ? new Date(event.start) : new Date();
        const end = event.end ? new Date(event.end) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
        
        // Extract customer name and price from summary
        let customerName = 'Unbekannt';
        let price = '';
        
        // Enhanced patterns to match more variations
        const patterns = [
          // Standard patterns with UT/UZ/UC/UK/UM
          /(?:UT|UZ|UC|UK|UM)\s*:\s*([^-–]+?)(?:\s*[-–]\s*([\d.,]+\s*€?))?$/,
          // With emojis at start
          /^[📌✅\s]*(?:UT|UZ|UC|UK|UM)\s*:\s*([^-–]+?)(?:\s*[-–]\s*([\d.,]+\s*€?))?$/,
          // With spaces before prefix
          /^\s*(?:UT|UZ|UC|UK|UM)\s*:\s*([^-–]+?)(?:\s*[-–]\s*([\d.,]+\s*€?))?$/,
          // More flexible pattern
          /(?:UT|UZ|UC|UK|UM)[:\s]+(.+?)(?:\s*[-–]\s*([\d.,]+))?$/,
          // Very flexible - just look for name after colon
          /:\s*([A-ZÄÖÜ][^-–]+?)(?:\s*[-–]\s*([\d.,]+\s*€?))?$/
        ];
        
        for (const pattern of patterns) {
          const match = summary.match(pattern);
          if (match && match[1]) {
            customerName = match[1].trim();
            price = match[2] || '';
            break;
          }
        }
        
        // Clean up customer name
        customerName = customerName
          .replace(/^\s*[📌✅]+\s*/, '')
          .replace(/\s+/g, ' ')
          .replace(/\s*\d+\s*Mann\s*$/, '') // Remove "2 Mann" etc
          .trim();
        
        // Skip if no valid customer name found
        if (!customerName || customerName === 'Unbekannt' || customerName.length < 3) {
          console.log(`⏭️ Skipping event: Invalid customer name - ${summary}`);
          stats.skipped++;
          continue;
        }
        
        // Extract additional info from description
        let fromAddress = '';
        let toAddress = '';
        let phoneNumber = '';
        
        if (description) {
          const lines = description.split('\n');
          for (const line of lines) {
            const lowerLine = line.toLowerCase();
            
            // Extract addresses
            if (lowerLine.includes('von:') || lowerLine.includes('from:') || 
                lowerLine.includes('auszug:') || lowerLine.includes('abholadresse:')) {
              fromAddress = line.split(/[:=]/)[1]?.trim() || '';
            }
            
            if (lowerLine.includes('nach:') || lowerLine.includes('to:') || 
                lowerLine.includes('einzug:') || lowerLine.includes('lieferadresse:')) {
              toAddress = line.split(/[:=]/)[1]?.trim() || '';
            }
            
            // Extract phone
            const phoneMatch = line.match(/(?:tel|telefon|handy|mobil|phone)[\s:]*([+\d\s\-\/\(\)]+)/i);
            if (phoneMatch) {
              phoneNumber = phoneMatch[1].trim();
            }
          }
        }
        
        // Create calendar event
        const calendarEvent = {
          title: summary,
          description: description || `Umzugstermin für ${customerName}`,
          start: admin.firestore.Timestamp.fromDate(start),
          end: admin.firestore.Timestamp.fromDate(end),
          allDay: false,
          color: determineEventColor(summary, price),
          type: 'move',
          customerName: customerName,
          location: location || fromAddress || 'Keine Adresse angegeben',
          details: {
            price: price,
            fromAddress: fromAddress,
            toAddress: toAddress,
            phoneNumber: phoneNumber,
            originalSummary: summary
          },
          originalEvent: {
            uid: event.uid || `imported-${Date.now()}-${Math.random()}`,
            summary: summary,
            description: description,
            location: location
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: 'ics-calendar-import',
          source: 'apple-calendar',
          imported: true
        };
        
        // Try to link to existing customer
        const customerQuery = await db.collection('customers')
          .where('name', '==', customerName)
          .limit(1)
          .get();
        
        if (!customerQuery.empty) {
          const customer = customerQuery.docs[0].data();
          calendarEvent.customerId = customer.id;
          calendarEvent.customerNumber = customer.customerNumber;
          calendarEvent.linked = true;
        } else {
          calendarEvent.linked = false;
        }
        
        // Add to calendar collection
        await db.collection('calendar').add(calendarEvent);
        
        console.log(`✅ Imported calendar event: ${customerName} - ${start.toLocaleDateString('de-DE')}`);
        stats.imported++;
        
      } catch (error) {
        console.error(`❌ Error processing event:`, error.message);
        stats.errors++;
      }
    }
    
    console.log(`\n🎉 Calendar import completed:
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

function determineEventColor(summary, price) {
  // Color based on price range or summary content
  if (summary.includes('✅')) return '#4CAF50'; // Green for completed
  if (summary.includes('📌')) return '#FF9800'; // Orange for pinned
  
  const priceNum = parseFloat(price.replace(/[^\d,]/g, '').replace(',', '.'));
  if (priceNum) {
    if (priceNum > 10000) return '#F44336'; // Red for high value
    if (priceNum > 5000) return '#FF9800'; // Orange for medium value
    if (priceNum > 2000) return '#2196F3'; // Blue for standard
  }
  
  return '#9E9E9E'; // Grey as default
}