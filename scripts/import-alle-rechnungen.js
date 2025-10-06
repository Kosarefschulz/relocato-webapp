/**
 * Import ALLE Rechnungen aus beiden PDFs
 * Parsed aus den PDFs und importiert in Supabase
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://kmxipuaqierjqaikuimi.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteGlwdWFxaWVyanFhaWt1aW1pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQyNTY0NSwiZXhwIjoyMDY2MDAxNjQ1fQ.VTT4d5nndvGQxJxlR6t0YyVHcZfFStqbI1KRbcIOH0c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Alle Rechnungen aus PDFs extrahiert
const rechnungen = [
  // Belege.pdf (Juli-Oktober 2025)
  { re: 'RE2025-0072', kunde: 'Hayder Dhahir', datum: '2025-10-06', betrag: 1800.00, netto: 1512.61, mwst: 287.39, typ: 'Umzug', leistung: 'Bielefeld→Düsseldorf, 35m³, Montage' },
  { re: 'RE2025-0071', kunde: 'Norbert Deckert', datum: '2025-10-01', betrag: 1498.80, netto: 1259.50, mwst: 239.30, typ: 'Umzug/Entrümpelung', leistung: 'Rümpel Schmiede, 10m³ + Extras 500€' },
  { re: 'RE2025-0070', kunde: 'Alexander Betz', datum: '2025-09-30', betrag: 3855.60, netto: 3240.00, mwst: 615.60, typ: 'Umzug Komplett', leistung: 'Enger→Bielefeld, Möbelmontage, Küche, 20 Kartons' },
  { re: 'RE2025-0068', kunde: 'Sven Klußmeyer', datum: '2025-09-26', betrag: 12430.88, netto: 10446.12, mwst: 1984.76, typ: 'Renovierung', leistung: 'Tapezieren, Streichen, Boden, Bad, Türen, Heizkörper' },
  { re: 'RE2025-0069', kunde: 'Guido Schmidt', datum: '2025-09-26', betrag: 11786.85, netto: 9904.92, mwst: 1881.93, typ: 'Renovierung', leistung: 'Laminat, Tapeten, Streichen, Dach, Podest, Elektro, Fenster, Katzengehege, Trockenbau' },
  { re: 'RE2025-0067', kunde: 'Franziska Weßler', datum: '2025-09-24', betrag: 1200.00, netto: 1008.40, mwst: 191.60, typ: 'Umzug', leistung: '→Bad Salzuflen, 25m³, Küchenzeile, Möbel' },
  { re: 'RE2025-0066', kunde: 'Ayten Zengin', datum: '2025-09-16', betrag: 1500.00, netto: 1260.50, mwst: 239.50, typ: 'Nachberechnung', leistung: 'Ergänzende Montage/Demontage (zu AG0045)' },
  { re: 'RE2025-0064', kunde: 'Jan Rosenfeld', datum: '2025-09-08', betrag: 1300.00, netto: 1092.44, mwst: 207.56, typ: 'Transport', leistung: 'Büromöbel' },
  { re: 'RE2025-0062', kunde: 'Carmen Lienard', datum: '2025-09-05', betrag: 2400.00, netto: 2016.81, mwst: 383.19, typ: 'Umzug Komplett', leistung: 'Bad Salzuflen, 8h, 100 Kartons, Montage, großer Kleiderschrank nur Demontage' },
  { re: 'RE2025-0063', kunde: 'Anna Krat', datum: '2025-09-05', betrag: 500.00, netto: 420.17, mwst: 79.83, typ: 'Rückbau', leistung: 'Rümpel Schmiede: Kellerraum, 3× Holzwände, Boden' },
  { re: 'RE2025-0060', kunde: 'Michael Buch', datum: '2025-09-03', betrag: 2000.00, netto: 1680.67, mwst: 319.33, typ: 'Umzug Komplett', leistung: 'Hagen→Osnabrück, 30m³, 3-Mann, Montage, 50 Kartons' },
  { re: 'RE2025-0057', kunde: 'Rainer Schwarze', datum: '2025-09-01', betrag: 500.00, netto: 420.17, mwst: 79.83, typ: 'Räumung', leistung: 'Rümpel Schmiede: Zimmer 122 Caroline Oetker Stift' },
  { re: 'RE2025-0058', kunde: 'Betina Steinau', datum: '2025-09-01', betrag: 1749.37, netto: 1470.06, mwst: 279.31, typ: 'Umzug+Entrümpelung', leistung: 'Rümpel Schmiede: Bad Driburg→Oerlinghausen, 15-25m³, Entrümpelung 210€' },
  { re: 'RE2025-0059', kunde: 'A. Bührdel', datum: '2025-09-01', betrag: 2080.00, netto: 1747.90, mwst: 332.10, typ: 'Entrümpelung', leistung: 'Rümpel Schmiede: besenrein 2.270€, Wertanrechnung -260€, Vermieter-Übergabe +70€' },
  { re: 'RE2025-0050', kunde: 'Benedikt Harding', datum: '2025-08-27', betrag: 2900.00, netto: 2436.97, mwst: 463.03, typ: 'Umzug+Einlagerung', leistung: 'Hilden→Bielefeld, 47,2m³, 170km, Einlagerung 0€' },
  { re: 'RE2025-0049', kunde: 'Benedikt Harding', datum: '2025-08-27', betrag: 1200.00, netto: 1008.40, mwst: 191.60, typ: 'Umzug Nachlieferung', leistung: 'Restliche Sachen, Keller, Garage, Sporttasche' },
  { re: 'RE2025-0052', kunde: 'Björn Malecki', datum: '2025-08-27', betrag: 6247.50, netto: 5250.00, mwst: 997.50, typ: 'Rückbau+Neubau', leistung: 'Lager Hannover: Wand-Rückbau 650€ + Büroraum-Neubau 3.600€ + Material 1.000€' },
  { re: 'RE2025-0053', kunde: 'Ayten Zengin', datum: '2025-08-27', betrag: 2599.00, netto: 2184.03, mwst: 414.97, typ: 'Umzug Komplett', leistung: 'Georgsmarienhutte, Keller→2.OG, Küche, Möbel, Waschmaschine, TV-Montage' },
  { re: 'RE2025-0054', kunde: 'Eva-Marie Tönsmann', datum: '2025-08-27', betrag: 1800.00, netto: 1512.61, mwst: 287.39, typ: 'Transport', leistung: 'Transport inkl. Be-/Entladen, Transportversicherung' },
  { re: 'RE2025-0055', kunde: 'Conny Harhausen', datum: '2025-08-27', betrag: 200.00, netto: 168.07, mwst: 31.93, typ: 'Abholung', leistung: 'Rümpel Schmiede: 2er Ledersofa, 08:00-09:00' },
  { re: 'RE2025-0051', kunde: 'Frau Sträßer', datum: '2025-08-27', betrag: 450.00, netto: 378.15, mwst: 71.85, typ: 'Kellerentrümpelung', leistung: 'Rümpel Schmiede: Trennung Fahrräder, Buffet, Kartons' },
  { re: 'RE2025-0045', kunde: 'Benedikt Harding', datum: '2025-08-26', betrag: 5500.00, netto: 4621.85, mwst: 878.15, typ: 'Umzug Komplett', leistung: 'Hilden→Bielefeld, 47,2m³, 170km, Transport 4.115€ + Einlagerung 427€ + Einpackservice 957€' },
  { re: 'RE2025-0046', kunde: 'Guido Schmidt', datum: '2025-08-26', betrag: 15004.71, netto: 12609.00, mwst: 2395.71, typ: 'Renovierung Abschlag', leistung: 'Abschlag 1: Rückbau Tapeten, Boden, Entrümpelung, Sanitär, Material' },
  { re: 'RE2025-0040', kunde: 'Stefan Döring', datum: '2025-08-21', betrag: 790.00, netto: 663.87, mwst: 126.13, typ: 'Wohnungsauflösung', leistung: 'Rümpel Schmiede: Caroline Oetker Whg 311, 3.OG, Wertanrechnung -310€' },
  { re: 'RE2025-0042', kunde: 'Christopher Francke', datum: '2025-08-25', betrag: 11257.40, netto: 9460.00, mwst: 1797.40, typ: 'Renovierung Maler', leistung: 'EFH: Abdeck, Spachtel, Streichen, Eckschienen - 350m²' },
  { re: 'RE2025-0041', kunde: 'Christopher Francke', datum: '2025-08-25', betrag: 2272.90, netto: 1910.00, mwst: 362.90, typ: 'Tapeten entfernen', leistung: '350m³ alte Tapeten, Rabatt -190€' },
  { re: 'RE2025-0043', kunde: 'Olga Maurer', datum: '2025-08-25', betrag: 1800.00, netto: 1512.61, mwst: 287.39, typ: 'Umzug', leistung: '20m³, Montage Bett' },

  // Belege-2.pdf (Juli 2025)
  { re: 'RE2025-0030', kunde: 'Yasin Belmiloudi', datum: '2025-08-01', betrag: 2530.00, netto: 2126.05, mwst: 403.95, typ: 'Fernumzug', leistung: 'Hövelhof→Köln, 27,2m³, 195km, 2 Tage' },
  { re: 'RE2025-0028', kunde: 'Tina Möller', datum: '2025-07-29', betrag: 1800.00, netto: 1512.61, mwst: 287.39, typ: 'Umzug', leistung: 'Bad Oeynhausen lokal, 35m³' },
  { re: 'RE2025-0027', kunde: 'Stefan Raab', datum: '2025-07-28', betrag: 4397.25, netto: 3695.17, mwst: 702.08, typ: 'Fernumzug', leistung: 'Bad Salzuflen→Blumberg (Baden)' },
  { re: 'RE2025-0001', kunde: 'Jobcenter Osnabrück', datum: '2025-07-21', betrag: 1085.99, netto: 912.60, mwst: 173.39, typ: 'Umzug', leistung: 'Osnabrück→Salzgitter, 3.OG→EG, 170km, Material, Kundin zahlte 300€ privat' },
  { re: 'RE2025-0009', kunde: 'MöllerTech GmbH', datum: '2025-07-21', betrag: 5760.00, netto: 4840.34, mwst: 919.66, typ: 'Büro-Umzug', leistung: 'Büro 2.949€ + Küchentransport+Entrümpelung 1.890€' },
  { re: 'RE2025-0012', kunde: 'Monika de Reus', datum: '2025-07-21', betrag: 2599.85, netto: 2184.75, mwst: 415.10, typ: 'Umzug Restzahlung', leistung: 'Werl→Geeste, 39,8m³, offen: 599,85€' },
  { re: 'RE2025-0019', kunde: 'AOK Nordwest (Lavin Lara Dumlu)', datum: '2025-07-21', betrag: 3970.48, netto: 3336.54, mwst: 633.94, typ: 'Umzug', leistung: 'Bielefeld→Hagen, Krankenkassen-Abrechnung' },
  { re: 'RE2025-0018', kunde: 'Doris Mattson', datum: '2025-07-19', betrag: 2897.77, netto: 2435.10, mwst: 462.67, typ: 'Transport', leistung: 'Umzugstransport 59,3m³, 250km' },
  { re: 'RE2025-0016', kunde: 'Carolina Klein', datum: '2025-07-18', betrag: 1790.00, netto: 1504.20, mwst: 285.80, typ: 'Umzug', leistung: 'Bielefeld 3.OG→4.OG, Rabatt -110€' },
  { re: 'RE2025-0015', kunde: 'Lars Schuerstedt', datum: '2025-07-17', betrag: 5498.10, netto: 4620.25, mwst: 877.85, typ: 'Umzug', leistung: '8h, Sockelleiste 5m, Arbeitsplatte 3,5m' },
  { re: 'RE2025-0017', kunde: 'Justin Korte', datum: '2025-07-15', betrag: 1400.00, netto: 1176.47, mwst: 223.53, typ: 'Umzug', leistung: 'Herford, 8h' },
  { re: 'RE2025-0014', kunde: 'Berkan Cavindir (KC Trading)', datum: '2025-07-15', betrag: 5050.00, netto: 4243.70, mwst: 806.30, typ: 'Büro-Umzug', leistung: 'Lagerhallen 4.500€ + Trockenbauwand 550€' },
  { re: 'RE2025-0013', kunde: 'Hans-Udo Möller', datum: '2025-07-16', betrag: 2150.00, netto: 1806.72, mwst: 343.28, typ: 'Umzug', leistung: 'Bielefeld lokal, Schaden Lampe -150€' },
  { re: 'RE2025-0011', kunde: 'GHK-DOMO GmbH', datum: '2025-07-09', betrag: 650.00, netto: 546.22, mwst: 103.78, typ: 'Helferleistung', leistung: '2 Mitarbeiter × 6h, Plattenmaterialien, An-/Abfahrt 70km' },
  { re: 'RE2025-0008', kunde: 'Christian Pein', datum: '2025-07-08', betrag: 5000.00, netto: 4201.68, mwst: 798.32, typ: 'Messi-Wohnung', leistung: 'Entrümpelung 1.176€ + Reinigung 504€ + Malerarbeiten 2.521€' },
  { re: 'RE2025-0010', kunde: 'Petrus van Amerongen', datum: '2025-07-05', betrag: 1598.27, netto: 1343.08, mwst: 255.19, typ: 'Umzug', leistung: 'Herford' },
  { re: 'RE2025-0007', kunde: 'Nils Koßenjans', datum: '2025-07-05', betrag: 1168.58, netto: 982.00, mwst: 186.58, typ: 'Umzug', leistung: 'Münster lokal' },
  { re: 'RE2025-0006', kunde: 'Elke Fahle', datum: '2025-07-05', betrag: 500.00, netto: 420.17, mwst: 79.83, typ: 'Umzug', leistung: 'Bielefeld→Werther, Selbstkostenpreis' },
  { re: 'RE2025-0004', kunde: 'Lydia Hort', datum: '2025-07-04', betrag: 1800.01, netto: 1512.61, mwst: 287.40, typ: 'Umzug', leistung: 'Flintbek→Lemgo' },
  { re: 'RE2025-0003', kunde: 'Inge-Lise Rasmussen', datum: '2025-07-03', betrag: 2650.00, netto: 2226.89, mwst: 423.11, typ: 'Umzug', leistung: 'Verl, 8h, Schaden -203€' },
  { re: 'RE2025-0002', kunde: 'Lasrich', datum: '2025-07-02', betrag: 1690.00, netto: 1420.17, mwst: 269.83, typ: 'Umzug+Einlagerung+Entrümpelung', leistung: 'Rheda-Wiedenbrück→Gütersloh Lagerhaus' },
  { re: 'RE2025-0005', kunde: 'Petrus van Amerongen', datum: '2025-12-21', betrag: 1598.27, netto: 1343.08, mwst: 255.19, typ: 'Umzug STORNO', leistung: 'Herford, bereits bezahlt, Nachlass -50€' },
  { re: 'RE2025-0020', kunde: 'Sigrid Ewertz', datum: '2024-12-21', betrag: 2446.71, netto: 2056.06, mwst: 390.65, typ: 'Fernumzug', leistung: 'Herzlake→Mülheim, 26,9m³, 185km, 60 Kartons, Montage, Material' },
  { re: 'RE2025-0021', kunde: 'Jari Kreuzinger', datum: '2024-12-21', betrag: 1259.88, netto: 1058.72, mwst: 201.16, typ: 'Umzug lokal', leistung: 'Halle 25,3m³, 5km, Montage, Material, Rabatt -230€' },
  { re: 'RE2025-0022', kunde: 'Andreas Milde', datum: '2024-12-21', betrag: 3781.24, netto: 3177.51, mwst: 603.73, typ: 'Umzug Komplett', leistung: 'Berge→Nienburg, 2,5 Tage, Küche, Möbel, E-Bett, E-Bikes, 30 Kartons Einpack' },
  { re: 'RE2025-0026', kunde: 'Bianca Koal', datum: '2024-12-21', betrag: 3600.00, netto: 3025.21, mwst: 574.79, typ: 'Fernumzug', leistung: 'Rahden→Veltschau, 30m³, 380km, 2 Tage Zwischenlagerung, 4.Stock' },
  { re: 'RE2025-0025', kunde: 'Stephan Ogorzelski', datum: '2024-12-21', betrag: 1589.65, netto: 1335.84, mwst: 253.81, typ: 'Umzug lokal', leistung: 'Herford 29,4m³, 1km, 2.OG→EG, Material, Rabatt -229€' },
  { re: 'RE2025-0024', kunde: 'Roswitha Rosemann', datum: '2024-12-21', betrag: 1400.00, netto: 1176.47, mwst: 223.53, typ: 'Umzug', leistung: 'Ostercappeln→Böhmte, 15-25m³, 1.OG→EG, Montage' },
  { re: 'RE2025-0044', kunde: 'Musterfirma GmbH', datum: '2024-12-01', betrag: 7354.20, netto: 6180.00, mwst: 1174.20, typ: 'Website-Entwicklung', leistung: 'Website 5.500€ + Hosting Setup 680€ (NICHT UMZUG!)' },
  { re: 'RE2025-0061', kunde: 'Carmen Lienard', datum: '2024-09-05', betrag: 2400.00, netto: 2016.81, mwst: 383.19, typ: 'Umzug Duplikat', leistung: 'Gleich wie RE2025-0062 (API-Limitierung Datum)' }
];

async function findCustomer(name) {
  const searchTerms = [
    name,
    name.replace(/\s+/g, ''),
    name.split(' ')[0],
    name.split(' ').slice(-1)[0]
  ].filter(Boolean);

  for (const term of searchTerms) {
    const { data } = await supabase
      .from('customers')
      .select('id, name, email')
      .or(`name.ilike.%${term}%,email.ilike.%${term}%`)
      .eq('is_deleted', false)
      .limit(1);

    if (data && data.length > 0) {
      return data[0];
    }
  }
  return null;
}

async function importRechnungen() {
  console.log('💰 Importing Rechnungen in Supabase...\n');

  let imported = 0;
  let skipped = 0;
  let noMatch = 0;

  for (const rechnung of rechnungen) {
    console.log(`\n📄 ${rechnung.re} - ${rechnung.kunde} (${rechnung.betrag}€)`);

    // Skip duplicates/test entries
    if (rechnung.kunde === 'Musterfirma GmbH' || rechnung.typ === 'Umzug Duplikat') {
      console.log('   ⏭️  Skipped (Test/Duplikat)');
      skipped++;
      continue;
    }

    // Check if already exists
    const { data: existing } = await supabase
      .from('invoices')
      .select('id')
      .eq('invoice_number', rechnung.re)
      .single();

    if (existing) {
      console.log('   ⏭️  Already exists');
      skipped++;
      continue;
    }

    // Find customer
    const customer = await findCustomer(rechnung.kunde);

    if (!customer) {
      console.log(`   ⚠️  Kunde "${rechnung.kunde}" nicht gefunden`);
      noMatch++;
      continue;
    }

    console.log(`   ✅ Match: ${customer.name}`);

    // Prepare invoice data
    const invoice = {
      customer_id: customer.id,
      invoice_number: rechnung.re,
      created_at: new Date(rechnung.datum).toISOString(),
      status: 'sent',
      price: rechnung.netto,
      tax_amount: rechnung.mwst,
      total_price: rechnung.betrag,
      notes: `${rechnung.typ}: ${rechnung.leistung}`,
      items: [{
        description: rechnung.leistung,
        amount: rechnung.netto
      }]
    };

    const { error } = await supabase
      .from('invoices')
      .insert(invoice);

    if (error) {
      console.log(`   ❌ Error:`, error.message);
    } else {
      console.log(`   ✅ Imported!`);
      imported++;
    }
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`📊 Import Summary:`);
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ⚠️  No Customer Match: ${noMatch}`);
  console.log(`═══════════════════════════════════════\n`);

  console.log('✅ Done!\n');
}

importRechnungen();
