/**
 * Import Rechnungen aus Beleg-Export
 * Liest PDFs aus und ordnet Kunden zu
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://kmxipuaqierjqaikuimi.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteGlwdWFxaWVyanFhaWt1aW1pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQyNTY0NSwiZXhwIjoyMDY2MDAxNjQ1fQ.VTT4d5nndvGQxJxlR6t0YyVHcZfFStqbI1KRbcIOH0c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const EXPORT_FOLDER = '/Users/sergejschulz/Downloads/Beleg-Export_von_2025-09-01_bis_2025-09-30_vom_2025-10-06_200518';

// Parse Dateinamen
function parseFilename(filename) {
  // Format: 2025-09-01_Einnahme_RE2025-0057_Schwarze-Rainer.pdf
  const parts = filename.replace('.pdf', '').split('_');

  if (parts.length < 4) return null;

  const datum = parts[0];
  const typ = parts[1]; // Einnahme oder Ausgabe
  const rechnungsnummer = parts[2];
  const kundenname = parts.slice(3).join(' '); // Falls Name Leerzeichen hat

  return {
    datum,
    typ,
    rechnungsnummer,
    kundenname,
    filename
  };
}

// Sucht Kunden in Supabase
async function findCustomer(name) {
  // Versuche verschiedene Varianten
  const searchTerms = [
    name,
    name.replace('-', ' '),
    name.split('-')[0], // Nur Nachname
    name.split('-')[1]  // Nur Vorname
  ].filter(Boolean);

  for (const term of searchTerms) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`name.ilike.%${term}%,email.ilike.%${term}%`)
      .limit(5);

    if (data && data.length > 0) {
      return data;
    }
  }

  return [];
}

async function processRechnungen() {
  console.log('🚀 Processing Rechnungen aus September 2025...\n');

  const files = fs.readdirSync(EXPORT_FOLDER)
    .filter(f => f.endsWith('.pdf') && f.includes('Einnahme')); // Nur Einnahmen

  console.log(`📄 Found ${files.length} Rechnung-PDFs\n`);

  const results = [];

  for (const file of files) {
    console.log(`\n📄 Processing: ${file}`);

    const parsed = parseFilename(file);
    if (!parsed) {
      console.log('   ⏭️  Skipped: Kein parsing möglich');
      continue;
    }

    console.log(`   📋 Rechnung: ${parsed.rechnungsnummer}`);
    console.log(`   👤 Name: ${parsed.kundenname}`);
    console.log(`   📅 Datum: ${parsed.datum}`);

    // Suche Kunde
    const customers = await findCustomer(parsed.kundenname);

    if (customers.length === 0) {
      console.log(`   ⚠️  Kunde "${parsed.kundenname}" nicht in Datenbank gefunden`);
      results.push({
        ...parsed,
        status: 'no_customer_match',
        matchedCustomerId: null
      });
      continue;
    }

    if (customers.length === 1) {
      console.log(`   ✅ Match gefunden: ${customers[0].name} (ID: ${customers[0].id})`);
      results.push({
        ...parsed,
        status: 'matched',
        matchedCustomerId: customers[0].id,
        matchedCustomerName: customers[0].name
      });
    } else {
      console.log(`   ⚠️  Mehrere Matches (${customers.length}):`);
      customers.forEach((c, i) => {
        console.log(`      ${i + 1}. ${c.name} (ID: ${c.id})`);
      });
      results.push({
        ...parsed,
        status: 'multiple_matches',
        matchedCustomerId: customers[0].id, // Nehme ersten
        matchedCustomerName: customers[0].name,
        allMatches: customers.map(c => ({ id: c.id, name: c.name }))
      });
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════\n');

  const matched = results.filter(r => r.status === 'matched');
  const multiple = results.filter(r => r.status === 'multiple_matches');
  const noMatch = results.filter(r => r.status === 'no_customer_match');

  console.log(`Total Rechnungen: ${results.length}`);
  console.log(`✅ Eindeutig zugeordnet: ${matched.length}`);
  console.log(`⚠️  Mehrere Matches: ${multiple.length}`);
  console.log(`❌ Kein Match: ${noMatch.length}\n`);

  // Details
  console.log('✅ ZUGEORDNET:');
  matched.forEach(r => {
    console.log(`   ${r.rechnungsnummer} → ${r.matchedCustomerName}`);
  });

  if (multiple.length > 0) {
    console.log('\n⚠️  MEHRFACH-MATCHES (verwende ersten):');
    multiple.forEach(r => {
      console.log(`   ${r.rechnungsnummer} → ${r.matchedCustomerName} (+ ${r.allMatches.length - 1} weitere)`);
    });
  }

  if (noMatch.length > 0) {
    console.log('\n❌ NICHT GEFUNDEN:');
    noMatch.forEach(r => {
      console.log(`   ${r.rechnungsnummer} → "${r.kundenname}" (Kunde existiert nicht)`);
    });
  }

  // Speichere Results
  fs.writeFileSync(
    'rechnung-import-results.json',
    JSON.stringify(results, null, 2)
  );

  console.log('\n💾 Results saved to: rechnung-import-results.json');

  return results;
}

// Optional: Erstelle Invoice-Einträge in Supabase
async function createInvoicesInSupabase(results) {
  console.log('\n🔄 Creating invoices in Supabase...\n');

  let created = 0;
  let skipped = 0;

  for (const result of results) {
    if (result.status === 'no_customer_match') {
      console.log(`⏭️  Skipped: ${result.rechnungsnummer} (no customer)`);
      skipped++;
      continue;
    }

    // Check if already exists
    const { data: existing } = await supabase
      .from('invoices')
      .select('id')
      .eq('invoice_number', result.rechnungsnummer)
      .single();

    if (existing) {
      console.log(`⏭️  Skipped: ${result.rechnungsnummer} (already exists)`);
      skipped++;
      continue;
    }

    // Create invoice
    const invoice = {
      customer_id: result.matchedCustomerId,
      customer_name: result.matchedCustomerName,
      invoice_number: result.rechnungsnummer,
      created_at: new Date(result.datum).toISOString(),
      status: 'sent', // Annahme: Alle wurden verschickt
      price: 0, // Müsste aus PDF geparst werden
      total_price: 0, // Müsste aus PDF geparst werden
      notes: `Importiert aus Beleg-Export (${result.filename})`
    };

    const { data, error } = await supabase
      .from('invoices')
      .insert(invoice)
      .select();

    if (error) {
      console.log(`   ❌ Error: ${result.rechnungsnummer} - ${error.message}`);
    } else {
      console.log(`   ✅ Created: ${result.rechnungsnummer} → ${result.matchedCustomerName}`);
      created++;
    }
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`📊 Invoice Creation Summary:`);
  console.log(`   ✅ Created: ${created}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`═══════════════════════════════════════\n`);
}

// Main
async function main() {
  const results = await processRechnungen();

  console.log('\n🎯 Möchtest du die Invoices auch in Supabase anlegen?');
  console.log('   Führe aus: node scripts/import-rechnung-september.js --create-invoices\n');

  if (process.argv.includes('--create-invoices')) {
    await createInvoicesInSupabase(results);
  }

  console.log('✅ Done!\n');
}

main();
