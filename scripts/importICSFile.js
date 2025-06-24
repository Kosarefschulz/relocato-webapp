const fs = require('fs');
const ical = require('ical');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

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
    
    // Process in chunks of 50 events
    const chunkSize = 50;
    let totalImported = 0;
    let totalDuplicates = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    
    for (let i = 0; i < eventsList.length; i += chunkSize) {
      const chunk = eventsList.slice(i, i + chunkSize);
      console.log(`\n🔄 Processing chunk ${Math.floor(i/chunkSize) + 1}/${Math.ceil(eventsList.length/chunkSize)} (${chunk.length} events)`);
      
      // Create a minimal ICS file with just this chunk
      const chunkICS = createICSFromEvents(chunk);
      
      try {
        const response = await fetch('https://europe-west1-umzugsapp.cloudfunctions.net/importICSToCalendar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            icsData: chunkICS
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          console.log(`✅ Chunk processed: ${result.imported} imported, ${result.duplicates} duplicates, ${result.skipped} skipped`);
          totalImported += result.imported || 0;
          totalDuplicates += result.duplicates || 0;
          totalSkipped += result.skipped || 0;
          totalErrors += result.errors || 0;
        } else {
          console.error(`❌ Chunk failed:`, result.error);
          totalErrors += chunk.length;
        }
      } catch (error) {
        console.error(`❌ Error processing chunk:`, error.message);
        totalErrors += chunk.length;
      }
      
      // Wait a bit between chunks to avoid overwhelming the server
      if (i + chunkSize < eventsList.length) {
        console.log('⏳ Waiting 2 seconds before next chunk...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`\n🎉 Import completed!
    ================================
    Total events: ${eventsList.length}
    Imported: ${totalImported}
    Duplicates: ${totalDuplicates}
    Skipped: ${totalSkipped}
    Errors: ${totalErrors}
    ================================`);
    
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
importICSToCalendar();