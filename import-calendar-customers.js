const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Supabase configuration
const supabaseUrl = 'https://kmxipuaqierjqaikuimi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteGlwdWFxaWVyanFhaWt1aW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MjU2NDUsImV4cCI6MjA2NjAwMTY0NX0.2S3cAnBh4zDFFQNpJ-VN17YrSJXyclyFjywN2izuPaU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function importCalendarCustomers() {
  console.log('📅 Importiere Kunden aus Kalender...');

  try {
    // Read calendar customers
    const calendarData = JSON.parse(fs.readFileSync('calendar_customers.json', 'utf8'));
    console.log(`📊 ${calendarData.length} Kunden aus Kalender geladen`);

    // Get existing customers to avoid duplicates
    const { data: existingCustomers, error: fetchError } = await supabase
      .from('customers')
      .select('name, phone');

    if (fetchError) {
      console.error('❌ Fehler beim Abrufen vorhandener Kunden:', fetchError);
      return;
    }

    console.log(`📊 ${existingCustomers?.length || 0} Kunden bereits in Datenbank`);

    // Create a Set of existing customer identifiers
    const existingSet = new Set();
    existingCustomers?.forEach(customer => {
      // Use normalized name as key
      const normalizedName = customer.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      existingSet.add(normalizedName);

      // Also add phone if available
      if (customer.phone) {
        existingSet.add(customer.phone);
      }
    });

    // Filter out duplicates
    const newCustomers = calendarData.filter(customer => {
      const normalizedName = customer.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const isDuplicate = existingSet.has(normalizedName) ||
                         (customer.phone && existingSet.has(customer.phone));

      if (isDuplicate) {
        console.log(`⚠️  Überspringe Duplikat: ${customer.name}`);
      }

      return !isDuplicate;
    });

    console.log(`\n✅ ${newCustomers.length} neue Kunden zum Importieren`);

    if (newCustomers.length === 0) {
      console.log('Keine neuen Kunden zum Importieren.');
      return;
    }

    // Import in batches
    const batchSize = 20;
    let imported = 0;
    let failed = 0;

    for (let i = 0; i < newCustomers.length; i += batchSize) {
      const batch = newCustomers.slice(i, i + batchSize);

      const { error } = await supabase
        .from('customers')
        .insert(batch);

      if (error) {
        console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} fehlgeschlagen:`, error.message);
        failed += batch.length;
      } else {
        imported += batch.length;
        console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} importiert (${imported}/${newCustomers.length})`);
      }
    }

    // Get final count
    const { count: finalCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    console.log('\n=== IMPORT ABGESCHLOSSEN ===');
    console.log(`✅ Erfolgreich importiert: ${imported}`);
    console.log(`❌ Fehlgeschlagen: ${failed}`);
    console.log(`📊 Gesamtzahl Kunden in Datenbank: ${finalCount || 0}`);

  } catch (error) {
    console.error('❌ Unerwarteter Fehler:', error);
  }
}

// Run the import
importCalendarCustomers();