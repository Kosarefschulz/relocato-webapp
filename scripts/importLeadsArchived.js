/**
 * Import Leads from Excel as Archived
 * Importiert 443 Leads und setzt sie direkt auf "archiviert"
 */

const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const { v4: uuidv4 } = require('uuid');

const supabaseUrl = 'https://kmxipuaqierjqaikuimi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteGlwdWFxaWVyanFhaWt1aW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MjU2NDUsImV4cCI6MjA2NjAwMTY0NX0.2S3cAnBh4zDFFQNpJ-VN17YrSJXyclyFjywN2izuPaU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function importLeads() {
  console.log('🔄 Starte Lead-Import als Archiviert...\n');

  try {
    // Lese Excel-Datei
    const workbook = XLSX.readFile('/Users/sergejschulz/Downloads/Leads.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📊 ${data.length} Leads gefunden in Excel\n`);

    // Prüfe existierende Kunden
    const { data: existingCustomers, error: fetchError } = await supabase
      .from('customers')
      .select('email, phone, name');

    if (fetchError) throw fetchError;

    const existingEmails = new Set(existingCustomers.map(c => c.email?.toLowerCase()));
    const existingPhones = new Set(existingCustomers.map(c => c.phone));
    const existingNames = new Set(existingCustomers.map(c => c.name.toLowerCase()));

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const row of data) {
      const name = row['Kontakt Name']?.trim();
      const email = row['Kontakt Email']?.trim()?.toLowerCase() || '';
      const phone = row['Kontakt Telefon']?.trim() || '';
      const fromAddress = row['Von Adresse']?.trim() || '';
      const toAddress = row['Nach Adresse']?.trim() || '';
      const movingDate = row['Umzugstag'] || null;

      // Skip wenn kein Name
      if (!name) {
        skipped++;
        continue;
      }

      // Skip wenn bereits existiert (Email, Telefon oder Name)
      if (
        (email && existingEmails.has(email)) ||
        (phone && existingPhones.has(phone)) ||
        existingNames.has(name.toLowerCase())
      ) {
        console.log(`⏭️  Übersprungen (existiert): ${name}`);
        skipped++;
        continue;
      }

      // Erstelle Kunde
      const customer = {
        firebase_id: uuidv4(),
        customer_number: `LEAD-${Date.now()}-${imported}`,
        name: name,
        email: email || '',
        phone: phone || '',
        from_address: fromAddress,
        to_address: toAddress,
        moving_date: movingDate ? new Date(movingDate).toISOString() : null,
        apartment: {},
        services: [],
        current_phase: 'archiviert', // Direkt archiviert!
        notes: `Lead-Import aus Excel\nQuelle: ${row['Quelle'] || 'Unbekannt'}\nEingang: ${row['EIngang'] || 'Unbekannt'}`,
        is_deleted: false,
        sales_status: null,
        status: 'lead'
      };

      const { error: insertError } = await supabase
        .from('customers')
        .insert(customer);

      if (!insertError) {
        console.log(`✅ ${name}`);
        imported++;
      } else {
        console.error(`❌ Fehler bei ${name}:`, insertError.message);
        errors++;
      }
    }

    console.log(`\n\n✅ Import abgeschlossen!`);
    console.log(`📈 ${imported} Leads importiert (als archiviert)`);
    console.log(`⏭️  ${skipped} übersprungen (bereits vorhanden)`);
    console.log(`❌ ${errors} Fehler`);

    return { success: true, imported, skipped, errors };

  } catch (error) {
    console.error('❌ Fehler:', error);
    return { success: false, error: error.message };
  }
}

importLeads()
  .then(result => {
    console.log('\n✨ Fertig!', result);
    process.exit(0);
  })
  .catch(err => {
    console.error('💥 Error:', err);
    process.exit(1);
  });
