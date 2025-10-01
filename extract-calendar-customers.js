const fs = require('fs');

// Read the calendar file
const content = fs.readFileSync('/Users/sergejschulz/Downloads/info@ruempelschmiede.de.ical/c_6d03ed0190b66e90d8c295db92ad07671de5d81eef64ed10e3bdecb41300d3cb@group.calendar.google.com.ics', 'utf8');

// Parse events
const events = content.split('BEGIN:VEVENT');
const customers = new Map(); // Use Map to track unique customers

events.slice(1).forEach(event => {
  // Extract summary (customer name)
  const summaryMatch = event.match(/SUMMARY:(.+?)(?=\r?\n)/);
  if (!summaryMatch) return;

  const summary = summaryMatch[1];

  // Skip non-customer entries (team meetings, monthly summaries, etc.)
  if (summary.includes('Teammeeting') ||
      summary.includes('Umsatz') ||
      summary.includes('Sanierung')) return;

  // Extract customer name and price from summary
  let customerName = '';
  let price = '';

  // Pattern: UT: Name - Price€ or just extract everything after UT:
  if (summary.includes('UT:')) {
    const utMatch = summary.match(/UT:\s*(.+?)(?:\s*-\s*([\d.,]+€?))?$/);
    if (utMatch) {
      customerName = utMatch[1].trim();
      price = utMatch[2] || '';
      // Clean price
      customerName = customerName.replace(/\s*-?\s*[\d.,]+€?$/, '').trim();
    }
  } else {
    // Try to extract any name from summary
    customerName = summary.replace(/[✅❌❓📌👏]/g, '').trim();
  }

  // Clean up customer name
  customerName = customerName
    .replace(/[✅❌❓📌👏]/g, '') // Remove emojis
    .replace(/ca\.\s*/, '') // Remove 'ca.'
    .replace(/über.+/, '') // Remove payment info
    .replace(/\s+/g, ' ') // Clean spaces
    .trim();

  if (customerName && customerName.length > 2) {
    // Extract location
    const locationMatch = event.match(/LOCATION:(.+?)(?=\r?\n)/);
    const location = locationMatch ? locationMatch[1].replace(/\\n/g, ', ').replace(/\\,/g, ',') : '';

    // Extract phone
    const urlMatch = event.match(/URL:(?:tel:)?(\d+)/);
    const phone = urlMatch ? urlMatch[1] : '';

    // Extract date
    const dateMatch = event.match(/DTSTART:(\d{8})/);
    const date = dateMatch ? dateMatch[1] : '';

    // Use customer name as key to avoid duplicates
    const key = customerName.toLowerCase();

    // Only store if not already present or if this entry has more info
    if (!customers.has(key) || (phone && !customers.get(key).phone)) {
      customers.set(key, {
        name: customerName,
        phone: phone,
        location: location,
        date: date,
        price: price
      });
    }
  }
});

// Convert to array and sort by name
const uniqueCustomers = Array.from(customers.values()).sort((a, b) => a.name.localeCompare(b.name));

console.log('=== EXTRAHIERTE KUNDEN AUS KALENDER ===');
console.log(`Anzahl eindeutiger Kunden: ${uniqueCustomers.length}`);
console.log('\n--- Kundenliste ---');

uniqueCustomers.forEach((customer, index) => {
  console.log(`\n${index + 1}. ${customer.name}`);
  if (customer.phone) console.log(`   Tel: ${customer.phone}`);
  if (customer.location) console.log(`   Ort: ${customer.location}`);
  if (customer.date) console.log(`   Termin: ${customer.date.substring(0,4)}-${customer.date.substring(4,6)}-${customer.date.substring(6,8)}`);
  if (customer.price) console.log(`   Preis: ${customer.price}€`);
});

// Create import data for Supabase
const importData = uniqueCustomers.map((customer, index) => ({
  customer_number: 'KAL-' + Date.now().toString().slice(-6) + '-' + (index + 1).toString().padStart(3, '0'),
  name: customer.name,
  email: '',
  phone: customer.phone || '',
  from_address: customer.location || 'Noch nicht angegeben',
  to_address: 'Noch nicht angegeben',
  moving_date: customer.date ? `${customer.date.substring(0,4)}-${customer.date.substring(4,6)}-${customer.date.substring(6,8)}` : null,
  apartment: 0,
  services: ['Umzug'],
  sales_status: 'customer',
  status: 'active',
  is_deleted: false,
  notes: customer.price ? `Preis: ${customer.price}€` : '',
  source: 'Kalender Import'
}));

// Save to file for import
fs.writeFileSync('calendar_customers.json', JSON.stringify(importData, null, 2));
console.log('\n✅ Daten für Import gespeichert in calendar_customers.json');