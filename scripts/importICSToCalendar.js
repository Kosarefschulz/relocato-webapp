const fs = require('fs');
const ical = require('ical');
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function importICSToCalendar() {
  console.log('📅 Starting ICS to Calendar import...');
  
  try {
    // Read the ICS file
    const icsData = fs.readFileSync('/Users/sergejschulz/Documents/UT - RELOCATO.ics', 'utf8');
    console.log('✅ ICS file loaded');
    
    // Parse ICS data
    const events = ical.parseICS(icsData);
    const eventsList = Object.values(events).filter(event => event.type === 'VEVENT');
    
    console.log(`📊 Found ${eventsList.length} events in total`);
    
    let imported = 0;
    let errors = 0;
    
    for (const event of eventsList) {
      try {
        // Extract basic event data
        const summary = event.summary || 'Kein Titel';
        const description = event.description || '';
        const location = event.location || '';
        const start = event.start ? new Date(event.start) : new Date();
        const end = event.end ? new Date(event.end) : new Date(start.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours
        
        // Extract customer name and details from summary
        let customerName = 'Unbekannt';
        let price = '';
        
        // Try different patterns to extract name
        const patterns = [
          /(?:UT|UZ|UC|UK|UM)[\s:]+([^-–]+?)(?:\s*[-–]\s*([\d.,]+\s*€?))?$/,
          /(?:UT|UZ|UC|UK|UM)[\s:]+(.+?)(?:\s*[-–]\s*([\d.,]+\s*€?))?$/,
          /^[📌✅\s]*(?:UT|UZ|UC|UK|UM)[\s:]+([^-–]+?)(?:\s*[-–]\s*([\d.,]+\s*€?))?$/
        ];
        
        for (const pattern of patterns) {
          const match = summary.match(pattern);
          if (match) {
            customerName = match[1].trim();
            price = match[2] || '';
            break;
          }
        }
        
        // Clean up customer name
        customerName = customerName
          .replace(/^\s*📌\s*✅\s*/, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        // Create calendar event
        const calendarEvent = {
          title: summary,
          description: `${description}\n\nOrt: ${location}`.trim(),
          start: admin.firestore.Timestamp.fromDate(start),
          end: admin.firestore.Timestamp.fromDate(end),
          allDay: false,
          color: '#FF6B6B', // Red color for move events
          type: 'move',
          customerName: customerName,
          location: location,
          originalEvent: {
            uid: event.uid,
            summary: summary,
            price: price
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: 'ics-import',
          source: 'apple-calendar-import'
        };
        
        // Check if customer exists in our system
        const customerQuery = await db.collection('customers')
          .where('name', '==', customerName)
          .limit(1)
          .get();
        
        if (!customerQuery.empty) {
          const customer = customerQuery.docs[0].data();
          calendarEvent.customerId = customer.id;
          calendarEvent.customerNumber = customer.customerNumber;
        }
        
        // Add to calendar collection
        await db.collection('calendar').add(calendarEvent);
        
        imported++;
        
        if (imported % 10 === 0) {
          console.log(`✅ Imported ${imported} events so far...`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing event: ${event.summary}`, error.message);
        errors++;
      }
    }
    
    console.log(`\n🎉 Calendar import completed!
    ================================
    Total events: ${eventsList.length}
    Imported: ${imported}
    Errors: ${errors}
    ================================`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the import
importICSToCalendar();