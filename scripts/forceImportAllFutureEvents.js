const fs = require('fs');
const ical = require('ical');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function forceImportAllFutureEvents() {
  console.log('📅 FORCE importing ALL events from TODAY onwards...\n');
  
  try {
    // Read the ICS file
    const icsData = fs.readFileSync('/Users/sergejschulz/Documents/UT - RELOCATO.ics', 'utf8');
    console.log('✅ ICS file loaded');
    
    // Parse ICS data
    const events = ical.parseICS(icsData);
    const allEvents = Object.values(events).filter(event => event.type === 'VEVENT');
    
    // Filter events from today onwards
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const futureEvents = allEvents.filter(event => {
      if (!event.start) return false;
      const eventDate = new Date(event.start);
      return eventDate >= today;
    });
    
    console.log(`📊 Found ${allEvents.length} total events`);
    console.log(`📅 Found ${futureEvents.length} events from today (${today.toLocaleDateString('de-DE')}) onwards\n`);
    
    // Sort events by date
    futureEvents.sort((a, b) => new Date(a.start) - new Date(b.start));
    
    // Group by month
    const monthGroups = {};
    futureEvents.forEach(event => {
      const date = new Date(event.start);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = [];
      }
      monthGroups[monthKey].push(event);
    });
    
    console.log('📊 Events by month:');
    Object.entries(monthGroups).forEach(([month, events]) => {
      console.log(`  ${month}: ${events.length} events`);
    });
    
    console.log('\n🚀 Starting FORCE import (ignoring duplicates)...\n');
    
    // Process ALL events, create unique IDs for force import
    let totalImported = 0;
    let totalCalendarEvents = 0;
    
    for (const [month, monthEvents] of Object.entries(monthGroups)) {
      console.log(`\n📅 Processing ${month} (${monthEvents.length} events)...`);
      
      for (let i = 0; i < monthEvents.length; i += 20) {
        const chunk = monthEvents.slice(i, i + 20);
        
        // Create ICS with modified UIDs to force new imports
        const modifiedEvents = chunk.map(event => ({
          ...event,
          uid: `FORCE-IMPORT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${event.uid || ''}`
        }));
        
        const chunkICS = createICSFromEvents(modifiedEvents);
        
        try {
          // Import to calendar (not as customers to avoid duplicates)
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
            console.log(`  ✅ Added ${calendarResult.imported} to calendar`);
            totalCalendarEvents += calendarResult.imported || 0;
          }
        } catch (error) {
          console.error(`  ❌ Error:`, error.message);
        }
      }
    }
    
    console.log(`\n🎉 FORCE import completed!
    ================================
    Total future events: ${futureEvents.length}
    Added to calendar: ${totalCalendarEvents}
    ================================`);
    
    // List all future events with details
    console.log('\n📋 ALL future events:');
    futureEvents.forEach((event, idx) => {
      const date = new Date(event.start);
      console.log(`${idx + 1}. ${date.toLocaleDateString('de-DE')} - ${event.summary || 'No title'}`);
    });
    
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
forceImportAllFutureEvents();