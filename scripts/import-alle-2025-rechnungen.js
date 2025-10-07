/**
 * Import ALLER 140 Rechnungen aus 2025
 * Automatische Kunden-Anlage mit Umsatz-Tracking
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://kmxipuaqierjqaikuimi.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteGlwdWFxaWVyanFhaWt1aW1pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQyNTY0NSwiZXhwIjoyMDY2MDAxNjQ1fQ.VTT4d5nndvGQxJxlR6t0YyVHcZfFStqbI1KRbcIOH0c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const BASE_FOLDER = '/Users/sergejschulz/Downloads/Ausgangsrechnungen 2025 Kunden';

// Parse Kundenname aus Dateiname
function parseFilename(filename) {
  // Format: Rechnung_2025-12-0001142_Richter S.pdf
  const match = filename.match(/Rechnung_(\d{4}-\d{2}-\d{7})_(.+)\.pdf/);

  if (!match) return null;

  const [_, rechnungsnr, kundenname] = match;

  return {
    rechnungsnummer: rechnungsnr,
    kundenname: kundenname.trim(),
    filename
  };
}

// Bestimme Quartal aus Pfad
function getQuartalFromPath(filePath) {
  if (filePath.includes('Quartal 1')) return 'Q1';
  if (filePath.includes('Quartal 2')) return 'Q2';
  if (filePath.includes('Quartal 3')) return 'Q3';
  if (filePath.includes('Quartal 4')) return 'Q4';
  if (filePath.includes('Rechnungen Benny')) return 'Benny';
  if (filePath.includes('Rechnungen Ulm')) return 'Ulm';
  if (filePath.includes('Stornorechnungen')) return 'STORNO';
  return 'Unknown';
}

// Bestimme Monat aus Pfad
function getMonthFromPath(filePath) {
  const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  for (let i = 0; i < months.length; i++) {
    if (filePath.includes(months[i])) {
      return i + 1; // 1-12
    }
  }
  return null;
}

// Sammle alle PDFs
async function collectAllPDFs() {
  const allPDFs = [];

  function walkDir(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.pdf')) {
        const parsed = parseFilename(file);
        if (parsed) {
          allPDFs.push({
            ...parsed,
            fullPath: filePath,
            quartal: getQuartalFromPath(filePath),
            monat: getMonthFromPath(filePath)
          });
        }
      }
    }
  }

  walkDir(BASE_FOLDER);
  return allPDFs;
}

// Prüfe ob Kunde existiert
async function findOrCreateCustomer(kundenname, rechnungInfo) {
  // Suche bestehenden Kunden
  const searchTerms = [
    kundenname,
    kundenname.split(' ')[0], // Nachname
    kundenname.split(' ').slice(-1)[0] // Vorname
  ];

  for (const term of searchTerms) {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .ilike('name', `%${term}%`)
      .eq('is_deleted', false)
      .limit(1);

    if (data && data.length > 0) {
      return { customer: data[0], isNew: false };
    }
  }

  // Kunde existiert nicht → Neu anlegen
  const newCustomer = {
    name: kundenname,
    email: '',
    phone: '',
    from_address: '',
    to_address: '',
    moving_date: new Date().toISOString(),
    current_phase: 'archiviert', // Alte Rechnungen = abgeschlossen
    notes: `Rechnung: ${rechnungInfo.rechnungsnummer}\nQuartal: ${rechnungInfo.quartal}\nMonat: ${rechnungInfo.monat || 'unbekannt'}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    services: [],
    apartment: { rooms: 0, area: 0, floor: 0, hasElevator: false },
    is_deleted: false
  };

  const { data, error } = await supabase
    .from('customers')
    .insert(newCustomer)
    .select()
    .single();

  if (error) {
    console.error(`❌ Fehler beim Anlegen von ${kundenname}:`, error.message);
    return { customer: null, isNew: false };
  }

  return { customer: data, isNew: true };
}

// Haupt-Import
async function importAll2025Rechnungen() {
  console.log('🚀 Importing ALL 2025 Rechnungen...\n');

  const pdfs = await collectAllPDFs();
  console.log(`📄 Found ${pdfs.length} PDF files\n`);

  // Gruppiere nach Quartal
  const byQuartal = {};
  pdfs.forEach(pdf => {
    if (!byQuartal[pdf.quartal]) byQuartal[pdf.quartal] = [];
    byQuartal[pdf.quartal].push(pdf);
  });

  console.log('📊 Distribution:');
  Object.entries(byQuartal).forEach(([q, files]) => {
    console.log(`   ${q}: ${files.length} Rechnungen`);
  });

  console.log('\n═══════════════════════════════════════\n');

  let stats = {
    total: pdfs.length,
    processed: 0,
    newCustomers: 0,
    existingCustomers: 0,
    errors: 0,
    stornos: 0
  };

  // Verarbeite alle (mit Limit für Test)
  const LIMIT = process.argv.includes('--all') ? pdfs.length : 20;
  console.log(`Processing first ${LIMIT} files...\n`);

  for (let i = 0; i < Math.min(LIMIT, pdfs.length); i++) {
    const pdf = pdfs[i];

    console.log(`[${i + 1}/${LIMIT}] ${pdf.filename}`);
    console.log(`   Kunde: ${pdf.kundenname}`);
    console.log(`   Rechnung: ${pdf.rechnungsnummer}`);
    console.log(`   Quartal: ${pdf.quartal}, Monat: ${pdf.monat || '?'}`);

    // Skip Stornos
    if (pdf.quartal === 'STORNO') {
      console.log(`   ⏭️  Skipped (Storno)\n`);
      stats.stornos++;
      continue;
    }

    // Find or create customer
    const { customer, isNew } = await findOrCreateCustomer(pdf.kundenname, pdf);

    if (!customer) {
      console.log(`   ❌ Failed\n`);
      stats.errors++;
      continue;
    }

    if (isNew) {
      console.log(`   ✅ NEW Customer created`);
      stats.newCustomers++;
    } else {
      console.log(`   ✅ Existing customer found: ${customer.name}`);
      stats.existingCustomers++;

      // Update Notizen mit zusätzlicher Rechnung
      const updatedNotes = customer.notes + `\n+ Rechnung: ${pdf.rechnungsnummer} (${pdf.quartal})`;
      await supabase
        .from('customers')
        .update({ notes: updatedNotes })
        .eq('id', customer.id);
    }

    stats.processed++;
    console.log('');
  }

  console.log('═══════════════════════════════════════');
  console.log('📊 IMPORT SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`Total PDFs found: ${stats.total}`);
  console.log(`Processed: ${stats.processed}`);
  console.log(`New customers: ${stats.newCustomers}`);
  console.log(`Existing customers: ${stats.existingCustomers}`);
  console.log(`Stornos skipped: ${stats.stornos}`);
  console.log(`Errors: ${stats.errors}`);
  console.log('═══════════════════════════════════════\n');

  if (LIMIT < pdfs.length) {
    console.log(`💡 Processed only ${LIMIT}/${pdfs.length} files (TEST MODE)`);
    console.log(`   To process ALL, run: node scripts/import-alle-2025-rechnungen.js --all\n`);
  } else {
    console.log('✅ ALL files processed!\n');
  }
}

importAll2025Rechnungen();
