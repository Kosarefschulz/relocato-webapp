const fs = require('fs');
const ical = require('ical');

function analyzeFutureEvents() {
  console.log('📅 Analyzing future events in ICS file...\n');
  
  try {
    // Read the ICS file
    const icsData = fs.readFileSync('/Users/sergejschulz/Documents/UT - RELOCATO.ics', 'utf8');
    const events = ical.parseICS(icsData);
    const allEvents = Object.values(events).filter(event => event.type === 'VEVENT');
    
    // Define date ranges
    const ranges = [
      { name: '2025 (Jan-Mai)', start: new Date('2025-01-01'), end: new Date('2025-05-31') },
      { name: '2025 (Juni)', start: new Date('2025-06-01'), end: new Date('2025-06-30') },
      { name: '2025 (Juli)', start: new Date('2025-07-01'), end: new Date('2025-07-31') },
      { name: '2025 (Aug)', start: new Date('2025-08-01'), end: new Date('2025-08-31') },
      { name: '2025 (Sep)', start: new Date('2025-09-01'), end: new Date('2025-09-30') },
      { name: '2025 (Okt)', start: new Date('2025-10-01'), end: new Date('2025-10-31') },
      { name: '2025 (Nov)', start: new Date('2025-11-01'), end: new Date('2025-11-30') },
      { name: '2025 (Dez)', start: new Date('2025-12-01'), end: new Date('2025-12-31') },
      { name: '2026+', start: new Date('2026-01-01'), end: new Date('2030-12-31') }
    ];
    
    console.log('📊 Event Distribution by Time Period:\n');
    
    ranges.forEach(range => {
      const eventsInRange = allEvents.filter(event => {
        if (!event.start) return false;
        const eventDate = new Date(event.start);
        return eventDate >= range.start && eventDate <= range.end;
      });
      
      if (eventsInRange.length > 0) {
        console.log(`${range.name}: ${eventsInRange.length} events`);
        
        // Show first 3 events of each range
        eventsInRange.slice(0, 3).forEach(event => {
          const date = new Date(event.start);
          console.log(`  - ${date.toLocaleDateString('de-DE')}: ${event.summary}`);
        });
        
        if (eventsInRange.length > 3) {
          console.log(`  ... and ${eventsInRange.length - 3} more\n`);
        } else {
          console.log('');
        }
      }
    });
    
    // Analyze future events (from June 2025)
    const futureStart = new Date('2025-06-01');
    const futureEvents = allEvents.filter(event => {
      if (!event.start) return false;
      return new Date(event.start) >= futureStart;
    });
    
    console.log('\n📅 Detailed Future Events (ab 01.06.2025):\n');
    console.log(`Total: ${futureEvents.length} events\n`);
    
    // Sort by date and show all
    futureEvents.sort((a, b) => new Date(a.start) - new Date(b.start));
    
    futureEvents.forEach((event, index) => {
      const date = new Date(event.start);
      const summary = event.summary || 'No title';
      
      // Extract customer name and price
      let customerName = 'Unknown';
      let price = '';
      
      const match = summary.match(/(?:UT|UZ|UC|UK|UM)[\s:]+([^-–]+?)(?:\s*[-–]\s*([\d.,]+\s*€?))?$/);
      if (match) {
        customerName = match[1].trim();
        price = match[2] || '';
      }
      
      console.log(`${index + 1}. ${date.toLocaleDateString('de-DE')} (${date.toLocaleDateString('de-DE', { weekday: 'short' })})`);
      console.log(`   Customer: ${customerName}`);
      console.log(`   Price: ${price || 'Not specified'}`);
      console.log(`   Full: ${summary}`);
      
      if (event.description) {
        const firstLine = event.description.split('\n')[0];
        if (firstLine) {
          console.log(`   Details: ${firstLine.substring(0, 60)}...`);
        }
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run analysis
analyzeFutureEvents();