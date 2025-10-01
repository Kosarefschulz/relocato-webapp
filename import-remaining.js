const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://kmxipuaqierjqaikuimi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteGlwdWFxaWVyanFhaWt1aW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MjU2NDUsImV4cCI6MjA2NjAwMTY0NX0.2S3cAnBh4zDFFQNpJ-VN17YrSJXyclyFjywN2izuPaU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function importRemaining() {
  const calendarData = JSON.parse(fs.readFileSync('calendar_customers.json', 'utf8'));

  // Get already imported KAL- customers
  const { data: existing } = await supabase
    .from('customers')
    .select('customer_number')
    .like('customer_number', 'KAL-%');

  const existingNumbers = new Set(existing?.map(c => c.customer_number) || []);

  // Filter out already imported
  const toImport = calendarData.filter(c => !existingNumbers.has(c.customer_number));

  console.log(`📊 Noch zu importieren: ${toImport.length} Kunden`);

  if (toImport.length === 0) {
    console.log('✅ Alle Kalenderkunden bereits importiert!');
    return;
  }

  // Import one by one to avoid duplicates
  let success = 0;
  let failed = 0;

  for (const customer of toImport) {
    const { error } = await supabase.from('customers').insert([customer]);
    if (error) {
      failed++;
      if (!error.message?.includes('duplicate')) {
        console.log(`❌ Fehler bei ${customer.name}: ${error.message}`);
      }
    } else {
      success++;
      if (success % 10 === 0) {
        console.log(`✅ ${success} importiert...`);
      }
    }
  }

  // Final count
  const { count } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true });

  console.log(`\n=== IMPORT ABGESCHLOSSEN ===`);
  console.log(`✅ Erfolgreich: ${success}`);
  console.log(`❌ Fehlgeschlagen: ${failed}`);
  console.log(`📊 Gesamt in DB: ${count}`);
}

importRemaining();