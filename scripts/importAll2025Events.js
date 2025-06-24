const fs = require('fs');
const ical = require('ical');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function importAll2025Events() {
  console.log('📅 Importing ALL events from 2025...\n');
  
  try {
    // Read the ICS file
    const icsData = fs.readFileSync('/Users/sergejschulz/Documents/UT - RELOCATO.ics', 'utf8');
    console.log('✅ ICS file loaded');
    
    // Parse ICS data
    const events = ical.parseICS(icsData);
    const allEvents = Object.values(events).filter(event => event.type === 'VEVENT');
    
    // Filter all 2025 events
    const events2025 = allEvents.filter(event => {
      if (!event.start) return false;
      const eventDate = new Date(event.start);
      return eventDate.getFullYear() === 2025;
    });
    
    console.log(`📊 Found ${allEvents.length} total events`);
    console.log(`📅 Found ${events2025.length} events in 2025\n`);
    
    // Sort events by date
    events2025.sort((a, b) => new Date(a.start) - new Date(b.start));
    
    // Group by month
    const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    const monthGroups = {};
    
    events2025.forEach(event => {
      const date = new Date(event.start);
      const month = date.getMonth();
      const monthKey = `${monthNames[month]} 2025`;
      
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = {
          events: [],
          month: month + 1,
          year: 2025
        };
      }
      monthGroups[monthKey].events.push(event);
    });
    
    console.log('📊 2025 Events by month:');
    Object.entries(monthGroups).forEach(([month, data]) => {
      console.log(`  ${month}: ${data.events.length} Termine`);
    });
    
    // Show events from May onwards in detail
    console.log('\n📋 Termine ab Mai 2025:');
    const mayOnwards = events2025.filter(event => {
      const date = new Date(event.start);
      return date.getMonth() >= 4; // May = 4 (0-indexed)
    });
    
    console.log(`\nTotal ab Mai: ${mayOnwards.length} Termine\n`);
    
    mayOnwards.forEach((event, idx) => {
      const date = new Date(event.start);
      const summary = event.summary || 'Kein Titel';
      console.log(`${idx + 1}. ${date.toLocaleDateString('de-DE')} (${monthNames[date.getMonth()]}): ${summary}`);
    });
    
    // Import all events from May onwards
    console.log('\n\n🚀 Importiere alle Termine ab Mai 2025...\n');
    
    const chunksToImport = [];
    const chunkSize = 25;
    
    for (let i = 0; i < mayOnwards.length; i += chunkSize) {
      chunksToImport.push(mayOnwards.slice(i, i + chunkSize));
    }
    
    let totalImported = 0;
    let totalCalendarEvents = 0;
    
    for (let i = 0; i < chunksToImport.length; i++) {
      const chunk = chunksToImport[i];
      console.log(`\n📦 Verarbeite Chunk ${i + 1}/${chunksToImport.length} (${chunk.length} Termine)...`);
      
      // Force new UIDs
      const modifiedEvents = chunk.map((event, idx) => ({
        ...event,
        uid: `IMPORT-2025-${Date.now()}-${i}-${idx}-${Math.random().toString(36).substr(2, 5)}`
      }));
      
      const chunkICS = createICSFromEvents(modifiedEvents);
      
      try {
        // Import as customers
        console.log('  👤 Importiere als Kunden...');
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
          console.log(`  ✅ ${customerResult.imported} neue Kunden angelegt`);
          totalImported += customerResult.imported || 0;
        }
        
        // Also add to calendar
        console.log('  📅 Füge zum Kalender hinzu...');
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
          console.log(`  ✅ ${calendarResult.imported} Kalendereinträge hinzugefügt`);
          totalCalendarEvents += calendarResult.imported || 0;
        }
        
      } catch (error) {
        console.error(`  ❌ Fehler:`, error.message);
      }
      
      // Short pause between chunks
      if (i < chunksToImport.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`\n\n🎉 Import abgeschlossen!
    ================================
    Termine ab Mai 2025: ${mayOnwards.length}
    Neue Kunden angelegt: ${totalImported}
    Kalendereinträge erstellt: ${totalCalendarEvents}
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
importAll2025Events();