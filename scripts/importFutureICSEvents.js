const fs = require('fs');
const ical = require('ical');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function importFutureICSEvents() {
  console.log('📅 Starting ICS import for future events (01.05.2025 - 31.12.2025)...');
  
  try {
    // Read the ICS file
    const icsData = fs.readFileSync('/Users/sergejschulz/Documents/UT - RELOCATO.ics', 'utf8');
    console.log('✅ ICS file loaded');
    
    // Parse ICS data
    const events = ical.parseICS(icsData);
    const allEvents = Object.values(events).filter(event => event.type === 'VEVENT');
    
    // Filter events from May 1, 2025 to December 31, 2025
    const startDate = new Date('2025-05-01');
    const endDate = new Date('2025-12-31');
    endDate.setHours(23, 59, 59, 999);
    
    const futureEvents = allEvents.filter(event => {
      if (!event.start) return false;
      const eventDate = new Date(event.start);
      return eventDate >= startDate && eventDate <= endDate;
    });
    
    console.log(`📊 Found ${allEvents.length} total events`);
    console.log(`📅 Found ${futureEvents.length} events from 01.06.2025 to 31.12.2025`);
    
    if (futureEvents.length === 0) {
      console.log('⚠️ No events found in the specified date range');
      return;
    }
    
    // Sort events by date
    futureEvents.sort((a, b) => new Date(a.start) - new Date(b.start));
    
    // Show first few events
    console.log('\n📋 First 5 events in date range:');
    futureEvents.slice(0, 5).forEach(event => {
      const date = new Date(event.start);
      console.log(`  - ${date.toLocaleDateString('de-DE')}: ${event.summary}`);
    });
    
    // Process in chunks of 30 events
    const chunkSize = 30;
    let totalImported = 0;
    let totalDuplicates = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    let importedCustomers = [];
    
    console.log('\n🚀 Starting import process...\n');
    
    for (let i = 0; i < futureEvents.length; i += chunkSize) {
      const chunk = futureEvents.slice(i, i + chunkSize);
      console.log(`🔄 Processing chunk ${Math.floor(i/chunkSize) + 1}/${Math.ceil(futureEvents.length/chunkSize)} (${chunk.length} events)`);
      
      // Create a minimal ICS file with just this chunk
      const chunkICS = createICSFromEvents(chunk);
      
      try {
        // First import as customers
        console.log('  📥 Importing as customers...');
        const customerResponse = await fetch('https://europe-west1-umzugsapp.cloudfunctions.net/importFromICS', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            icsData: chunkICS
          })
        });
        
        const customerResult = await customerResponse.json();
        
        if (customerResult.success) {
          console.log(`  ✅ Customers: ${customerResult.imported} imported, ${customerResult.duplicates} duplicates`);
          totalImported += customerResult.imported || 0;
          totalDuplicates += customerResult.duplicates || 0;
          
          if (customerResult.importedCustomers) {
            importedCustomers = importedCustomers.concat(customerResult.importedCustomers);
          }
        }
        
        // Then import to calendar
        console.log('  📅 Adding to calendar...');
        const calendarResponse = await fetch('https://europe-west1-umzugsapp.cloudfunctions.net/importICSToCalendar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            icsData: chunkICS
          })
        });
        
        const calendarResult = await calendarResponse.json();
        
        if (calendarResult.success) {
          console.log(`  ✅ Calendar: ${calendarResult.imported} events added`);
        }
        
      } catch (error) {
        console.error(`  ❌ Error processing chunk:`, error.message);
        totalErrors += chunk.length;
      }
      
      // Wait a bit between chunks
      if (i + chunkSize < futureEvents.length) {
        console.log('  ⏳ Waiting 1 second...\n');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`\n🎉 Import completed!
    ================================
    📅 Date Range: 01.06.2025 - 31.12.2025
    Total events in range: ${futureEvents.length}
    
    Customer Import:
    - New customers created: ${totalImported}
    - Duplicates skipped: ${totalDuplicates}
    - Errors: ${totalErrors}
    ================================`);
    
    if (importedCustomers.length > 0) {
      console.log('\n📋 Imported customers:');
      importedCustomers.slice(0, 10).forEach(customer => {
        console.log(`  - ${customer.customerNumber}: ${customer.name} (${customer.moveDate})`);
      });
      if (importedCustomers.length > 10) {
        console.log(`  ... and ${importedCustomers.length - 10} more`);
      }
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

function createICSFromEvents(events) {
  let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Relocato//Import//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
`;

  for (const event of events) {
    ics += `BEGIN:VEVENT
`;
    
    // Add all event properties
    for (const [key, value] of Object.entries(event)) {
      if (key !== 'type' && value !== undefined && value !== null) {
        if (key.toUpperCase() === 'SUMMARY' || key.toUpperCase() === 'DESCRIPTION' || key.toUpperCase() === 'LOCATION') {
          ics += `${key.toUpperCase()}:${String(value).replace(/\n/g, '\\n')}
`;
        } else if (key.toUpperCase() === 'DTSTART' || key.toUpperCase() === 'DTEND' || key.toUpperCase() === 'START' || key.toUpperCase() === 'END') {
          if (value instanceof Date) {
            ics += `${key.toUpperCase().replace('START', 'DTSTART').replace('END', 'DTEND')}:${formatDate(value)}
`;
          } else {
            ics += `${key.toUpperCase().replace('START', 'DTSTART').replace('END', 'DTEND')}:${value}
`;
          }
        } else if (key.toUpperCase() === 'UID') {
          ics += `UID:${value}
`;
        } else if (key.toUpperCase() === 'ATTENDEE') {
          if (Array.isArray(value)) {
            for (const attendee of value) {
              ics += `ATTENDEE:${attendee}
`;
            }
          } else {
            ics += `ATTENDEE:${value}
`;
          }
        }
      }
    }
    
    ics += `END:VEVENT
`;
  }
  
  ics += `END:VCALENDAR`;
  
  return ics;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

// Run the import
importFutureICSEvents();