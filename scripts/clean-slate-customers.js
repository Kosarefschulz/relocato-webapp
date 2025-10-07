/**
 * Clean Slate - Kunden-Datenbank komplett neu aufbauen
 *
 * Schritt 1: Backup aller Kunden
 * Schritt 2: Alle Kunden löschen
 * Schritt 3: Nur Kunden mit echten Aufträgen (aus Rechnungen) neu anlegen
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://kmxipuaqierjqaikuimi.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteGlwdWFxaWVyanFhaWt1aW1pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQyNTY0NSwiZXhwIjoyMDY2MDAxNjQ1fQ.VTT4d5nndvGQxJxlR6t0YyVHcZfFStqbI1KRbcIOH0c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ============================================
// SCHRITT 1: BACKUP
// ============================================

async function backupCustomers() {
  console.log('💾 SCHRITT 1: Backup aller Kunden...\n');

  const { data: customers, error } = await supabase
    .from('customers')
    .select('*')
    .eq('is_deleted', false);

  if (error) {
    console.error('❌ Backup failed:', error);
    return null;
  }

  const filename = `customer-backup-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(customers, null, 2));

  console.log(`✅ Backup created: ${filename}`);
  console.log(`   Total: ${customers.length} Kunden gesichert\n`);

  return customers;
}

// ============================================
// SCHRITT 2: ALLE LÖSCHEN
// ============================================

async function deleteAllCustomers() {
  console.log('🗑️  SCHRITT 2: Alle Kunden löschen...\n');

  const { data, error } = await supabase
    .from('customers')
    .update({ is_deleted: true })
    .eq('is_deleted', false)
    .select();

  if (error) {
    console.error('❌ Delete failed:', error);
    return 0;
  }

  console.log(`✅ Deleted: ${data.length} Kunden\n`);
  return data.length;
}

// ============================================
// SCHRITT 3: NUR ECHTE KUNDEN NEU ANLEGEN
// ============================================

// Kunden aus Rechnungen (nur die mit echten Aufträgen)
const echteKunden = [
  // Oktober 2025
  { name: 'Hayder Dhahir', email: '', phone: '', address: 'Josefstraße 2, 33602 Bielefeld', rechnungen: ['RE2025-0072'], umsatz: 1800.00 },

  // September 2025
  { name: 'Norbert Deckert', email: '', phone: '', address: 'Ringstraße 20, 33184 Altenbeken', rechnungen: ['RE2025-0071'], umsatz: 1498.80 },
  { name: 'Alexander Betz', email: '', phone: '', address: 'zum Höhnerbrock 45, 32130 Enger', rechnungen: ['RE2025-0070'], umsatz: 3855.60 },
  { name: 'Sven Klußmeyer', email: '', phone: '', address: 'Potsdamer Straße 82, Bielefeld', rechnungen: ['RE2025-0068'], umsatz: 12430.88 },
  { name: 'Guido Schmidt', email: '', phone: '', address: 'Sonnenweg 6, 32120 Hiddenhausen', rechnungen: ['RE2025-0069', 'RE2025-0046'], umsatz: 26791.56 },
  { name: 'Franziska Weßler', email: '', phone: '', address: 'Von-Möller-Straße 46, Bielefeld', rechnungen: ['RE2025-0067'], umsatz: 1200.00 },
  { name: 'Ayten Zengin', email: '', phone: '', address: 'Talstr. 19, 49124 Georgsmarienhütte', rechnungen: ['RE2025-0066', 'RE2025-0053'], umsatz: 4099.00 },
  { name: 'Jan Rosenfeld', email: '', phone: '', address: 'Falkenweg 15, 32339 Espelkamp', rechnungen: ['RE2025-0064'], umsatz: 1300.00 },
  { name: 'Carmen Lienard', email: '', phone: '', address: 'Montessoriweg 7, 32108 Bad Salzuflen', rechnungen: ['RE2025-0062'], umsatz: 2400.00 },
  { name: 'Anna Krat', email: '', phone: '', address: 'Bielefeldstraße 87, 32139 Spenge', rechnungen: ['RE2025-0063'], umsatz: 500.00 },
  { name: 'Michael Buch', email: 'bumix46@yahoo.de', phone: '', address: 'Lerchenstraße 2, Hagen am Teutoburger Wald', rechnungen: ['RE2025-0060'], umsatz: 2000.00 },
  { name: 'Rainer Schwarze', email: '', phone: '', address: 'Caroline Oetker Stift - Zimmer 122, Hochstraße 2, 33615 Bielefeld', rechnungen: ['RE2025-0057'], umsatz: 500.00 },
  { name: 'Betina Steinau', email: '', phone: '', address: 'Hinter den Höfen 1, 33014 Bad Driburg', rechnungen: ['RE2025-0058'], umsatz: 1749.37 },
  { name: 'A. Bührdel', email: '', phone: '', address: 'Gaudigstraße 8, 33739 Bielefeld', rechnungen: ['RE2025-0059'], umsatz: 2080.00 },

  // August 2025
  { name: 'Benedikt Harding', email: '', phone: '', address: 'Zur Verlach 21, 40723 Hilden', rechnungen: ['RE2025-0050', 'RE2025-0049', 'RE2025-0045'], umsatz: 9600.00 },
  { name: 'Björn Malecki', email: '', phone: '', address: 'Walter-Welp-Straße 32, 44149 Dortmund', rechnungen: ['RE2025-0052'], umsatz: 6247.50 },
  { name: 'Eva-Marie Tönsmann', email: '', phone: '', address: 'Ernst-Rein-Straße 54, 33613 Bielefeld', rechnungen: ['RE2025-0054'], umsatz: 1800.00 },
  { name: 'Conny Harhausen', email: '', phone: '', address: 'Diesterwegstraße 77, 33604 Bielefeld', rechnungen: ['RE2025-0055'], umsatz: 200.00 },
  { name: 'Frau Sträßer', email: '', phone: '', address: 'Stapenhorststraße 157, 33615 Bielefeld', rechnungen: ['RE2025-0051'], umsatz: 450.00 },
  { name: 'Stefan Döring', email: '', phone: '', address: 'Caroline Oetker Stift - Wohnung 311, Hochstraße 2, 33615 Bielefeld', rechnungen: ['RE2025-0040'], umsatz: 790.00 },
  { name: 'Christopher Francke', email: '', phone: '', address: 'Treppenstraße 26, 33647 Bielefeld', rechnungen: ['RE2025-0042', 'RE2025-0041'], umsatz: 13530.30 },
  { name: 'Olga Maurer', email: '', phone: '', address: 'Rolfshof 44, 33104 Paderborn', rechnungen: ['RE2025-0043'], umsatz: 1800.00 },

  // Juli 2025
  { name: 'Yasin Belmiloudi', email: '', phone: '', address: 'Allee 37, 33161 Hövelhof', rechnungen: ['RE2025-0030'], umsatz: 2530.00 },
  { name: 'Tina Möller', email: '', phone: '', address: 'Turmstraße 52, 32547 Bad Oeynhausen', rechnungen: ['RE2025-0028'], umsatz: 1800.00 },
  { name: 'Stefan Raab', email: '', phone: '', address: 'Woldemarstraße 7, 32105 Bad Salzuflen', rechnungen: ['RE2025-0027'], umsatz: 4397.25 },
  { name: 'Jobcenter Osnabrück', email: '', phone: '', address: 'Johannistorwall 56, 49080 Osnabrück', rechnungen: ['RE2025-0001'], umsatz: 1085.99 },
  { name: 'MöllerTech GmbH', email: '', phone: '', address: 'Kupferhammer, 33649 Bielefeld', rechnungen: ['RE2025-0009'], umsatz: 5760.00 },
  { name: 'Monika de Reus', email: '', phone: '', address: 'Veilchenweg 12, 33154 Werl-Aspe', rechnungen: ['RE2025-0012'], umsatz: 2599.85 },
  { name: 'Lavin Lara Dumlu (AOK Nordwest)', email: '', phone: '', address: 'Graf-von-Stauffenberg-Straße 2, Bielefeld', rechnungen: ['RE2025-0019'], umsatz: 3970.48 },
  { name: 'Doris Mattson', email: '', phone: '', address: 'Alte Verler Straße 22, 33689 Bielefeld', rechnungen: ['RE2025-0018'], umsatz: 2897.77 },
  { name: 'Carolina Klein', email: '', phone: '', address: 'Viktoriastraße 27, 33602 Bielefeld', rechnungen: ['RE2025-0016'], umsatz: 1790.00 },
  { name: 'Lars Schuerstedt', email: '', phone: '', address: 'An der Else 11, 32278 Kirchlengern', rechnungen: ['RE2025-0015'], umsatz: 5498.10 },
  { name: 'Justin Korte', email: '', phone: '', address: 'Sudetenstraße 15, 32052 Herford', rechnungen: ['RE2025-0017'], umsatz: 1400.00 },
  { name: 'KC Trading UG (Berkan Cavindir)', email: '', phone: '', address: 'Erwitter Straße 34, 59590 Geseke', rechnungen: ['RE2025-0014'], umsatz: 5050.00 },
  { name: 'Hans-Udo Möller', email: '', phone: '', address: 'Bessemerweg 2, 33609 Bielefeld', rechnungen: ['RE2025-0013'], umsatz: 2150.00 },
  { name: 'GHK-DOMO GmbH', email: '', phone: '', address: 'Darre 2a, 37581 Bad Gandersheim', rechnungen: ['RE2025-0011'], umsatz: 650.00 },
  { name: 'Christian Pein', email: '', phone: '', address: 'Spinnereistraße 23A, 33602 Bielefeld', rechnungen: ['RE2025-0008'], umsatz: 5000.00 },
  { name: 'Petrus van Amerongen', email: '', phone: '015756204446', address: 'Birkenstraße 48, 32052 Herford', rechnungen: ['RE2025-0010', 'RE2025-0005'], umsatz: 3196.54 },
  { name: 'Nils Koßenjans', email: '', phone: '', address: 'Am Kalvarienberg, 48143 Münster', rechnungen: ['RE2025-0007'], umsatz: 1168.58 },
  { name: 'Elke Fahle', email: '', phone: '', address: 'An der Rehwiese 20, 33617 Bielefeld', rechnungen: ['RE2025-0006'], umsatz: 500.00 },
  { name: 'Lydia Hort', email: '', phone: '', address: 'Vogelsang 1, 32657 Lemgo', rechnungen: ['RE2025-0004'], umsatz: 1800.01 },
  { name: 'Inge-Lise Rasmussen', email: '', phone: '', address: 'Zum Meierhof 16, 33739 Verl', rechnungen: ['RE2025-0003'], umsatz: 2650.00 },
  { name: 'Lasrich', email: '', phone: '', address: 'Heinrich-Püts-Str. 27, 33378 Rheda-Wiedenbrück', rechnungen: ['RE2025-0002'], umsatz: 1690.00 },
  { name: 'Sigrid Ewertz', email: 'hidalgo3949@gmail.com', phone: '01577 0254414', address: 'Am Feldkamp 30, 49770 Herzlake', rechnungen: ['RE2025-0020'], umsatz: 2446.71 },
  { name: 'Jari Kreuzinger', email: 'jari.kreuzinger@web.de', phone: '0173 7063016', address: 'Ernteweg 14, 33790 Halle', rechnungen: ['RE2025-0021'], umsatz: 1259.88 },
  { name: 'Andreas Milde', email: '', phone: '0171 4536531', address: 'Sipe 4, 31582 Berge', rechnungen: ['RE2025-0022'], umsatz: 3781.24 },
  { name: 'Bianca Koal', email: 'bkoal@live.de', phone: '0172 7383918', address: 'Am Blanken Boom 2, 32369 Rahden', rechnungen: ['RE2025-0026'], umsatz: 3600.00 },
  { name: 'Stephan Michael Ogorzelski', email: 's.ogorzelski@gmail.com', phone: '0174 1784326', address: 'Meierstraße 41, 32049 Herford', rechnungen: ['RE2025-0025'], umsatz: 1589.65 },
  { name: 'Roswitha Rosemann', email: 'rose01@gmx.net', phone: '+49 1522 6136840', address: 'Auf dem Kampe, 49179 Ostercappeln', rechnungen: ['RE2025-0024'], umsatz: 1400.00 },
  { name: 'S. Potthast', email: '', phone: '', address: 'Pöppelmannstraße 3, 33611 Bielefeld-Jöllenbeck', rechnungen: ['RE2025-0056'], umsatz: 758.50 },
  { name: 'Christoph Diehl', email: '', phone: '', address: 'Bielefeld', rechnungen: ['RE2025-0047', 'RE2025-0048'], umsatz: 2800.00 }
];

async function createEchteKunden() {
  console.log('👥 SCHRITT 3: Echte Kunden neu anlegen...\n');

  let created = 0;
  let errors = 0;

  for (const kunde of echteKunden) {
    try {
      const customerData = {
        name: kunde.name,
        email: kunde.email || '',
        phone: kunde.phone || '',
        from_address: kunde.address || '',
        moving_date: new Date().toISOString(),
        current_phase: 'rechnung', // Haben alle schon Rechnung
        notes: `Umsatz: ${kunde.umsatz}€. Rechnungen: ${kunde.rechnungen.join(', ')}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        services: [],
        apartment: { rooms: 0, area: 0, floor: 0, hasElevator: false },
        is_deleted: false
      };

      const { data, error } = await supabase
        .from('customers')
        .insert(customerData)
        .select();

      if (error) {
        console.error(`   ❌ ${kunde.name}:`, error.message);
        errors++;
      } else {
        console.log(`   ✅ ${kunde.name} - ${kunde.umsatz}€ (${kunde.rechnungen.length} Rechnungen)`);
        created++;
      }
    } catch (error) {
      console.error(`   ❌ Exception ${kunde.name}:`, error.message);
      errors++;
    }
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`📊 Results:`);
  console.log(`   ✅ Created: ${created} Kunden`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`═══════════════════════════════════════\n`);

  return created;
}

// ============================================
// MAIN WORKFLOW
// ============================================

async function cleanSlate() {
  console.log('═══════════════════════════════════════');
  console.log('🔄 CLEAN SLATE - Kunden-Datenbank neu aufbauen');
  console.log('═══════════════════════════════════════\n');

  // Schritt 1: Backup
  const backup = await backupCustomers();
  if (!backup) {
    console.error('❌ Backup failed - ABBRUCH!');
    return;
  }

  console.log('⚠️  WARNUNG: Alle Kunden werden gelöscht in 5 Sekunden...');
  console.log('   Press Ctrl+C to CANCEL\n');

  // Wait 5 seconds
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Schritt 2: Löschen
  const deleted = await deleteAllCustomers();
  console.log(`✅ ${deleted} alte Kunden gelöscht\n`);

  // Schritt 3: Neu anlegen
  const created = await createEchteKunden();

  console.log('═══════════════════════════════════════');
  console.log('📊 FINAL SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`Vorher: ${backup.length} Kunden (viele ohne Auftrag)`);
  console.log(`Gelöscht: ${deleted} Kunden`);
  console.log(`Neu angelegt: ${created} Kunden (NUR mit echten Aufträgen)`);
  console.log(`\nDatenbank ist jetzt SAUBER! ✨`);
  console.log(`Backup: customer-backup-*.json\n`);
  console.log('═══════════════════════════════════════\n');

  console.log('✅ Clean Slate Complete!\n');
}

// Run
if (require.main === module) {
  cleanSlate();
}

module.exports = { cleanSlate, echteKunden };
