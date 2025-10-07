/**
 * Fügt Leistungs-Details zu Kunden hinzu
 * Basierend auf den Rechnungen
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://kmxipuaqierjqaikuimi.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteGlwdWFxaWVyanFhaWt1aW1pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQyNTY0NSwiZXhwIjoyMDY2MDAxNjQ1fQ.VTT4d5nndvGQxJxlR6t0YyVHcZfFStqbI1KRbcIOH0c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Erweiterte Kunden-Daten mit Leistungen
const kundenMitLeistungen = {
  'Lavin Lara Dumlu (AOK Nordwest)': {
    umsatz: 3970.48,
    rechnungen: ['RE2025-0019'],
    leistungen: ['Umzug Bielefeld→Hagen', 'Krankenkassen-Abrechnung', 'Umzugsleistung Komplettpaket'],
    services_performed: ['Transport', 'Be-/Entladung', 'Umzugsteam']
  },
  'Guido Schmidt': {
    umsatz: 26791.56,
    rechnungen: ['RE2025-0069', 'RE2025-0046'],
    leistungen: [
      'Abschlag 1 (15.004€): Rückbau Tapeten, Boden, Entrümpelung, Sanitär',
      'Abschlag 2 (11.786€): Laminat 78,6m², Tapezieren 90m², Streichen, Dachreinigung 140m², Podest, Elektro, Fenster, Katzengehege, Trockenbau Bad 3.000€'
    ],
    services_performed: ['Renovierung', 'Bodenarbeiten', 'Malerarbeiten', 'Sanitär', 'Trockenbau']
  },
  'Christopher Francke': {
    umsatz: 13530.30,
    rechnungen: ['RE2025-0042', 'RE2025-0041'],
    leistungen: [
      'Malerarbeiten (11.257€): Abdeck 350m², Q3 Spachtelung, Dispersionsfarbe streichen, Eckschienen',
      'Tapeten entfernen (2.272€): 350m³ alte Tapeten, Rabatt -190€'
    ],
    services_performed: ['Malerarbeiten', 'Spachtelarbeiten', 'Tapezierarbeiten']
  },
  'Sven Klußmeyer': {
    umsatz: 12430.88,
    rechnungen: ['RE2025-0068'],
    leistungen: ['Decken tapezieren 82m² (820€)', 'Wände streichen 240m² (1.920€)', 'Tapetenbahnen 50m² (750€)', 'Boden entfernen 76m² (993€)', 'Boden verlegen 76m² (1.605€)', 'Türzargen 6 Stk (480€)', 'Türblätter (500€)', 'Heizkörper (1.150€)', 'Badrenovierung 45h (2.227€)'],
    services_performed: ['Renovierung', 'Tapezieren', 'Malerarbeiten', 'Bodenarbeiten', 'Sanitär']
  },
  'Benedikt Harding': {
    umsatz: 9600.00,
    rechnungen: ['RE2025-0050', 'RE2025-0049', 'RE2025-0045'],
    leistungen: [
      '1. Transport Hilden→Bielefeld (2.900€): 47,2m³, 170km, Einlagerung',
      '2. Nachlieferung (1.200€): Restliche Sachen, Keller, Garage',
      '3. Komplett (5.500€): Transport 4.115€ + Einlagerung 427€ + Einpackservice 957€'
    ],
    services_performed: ['Fernumzug', 'Einlagerung', 'Einpackservice', 'Transport']
  },
  'Björn Malecki': {
    umsatz: 6247.50,
    rechnungen: ['RE2025-0052'],
    leistungen: ['Rückbau Wand (650€): Holz-/Metallkonstruktion', 'Neubau Büroraum (3.600€): 5m×2,8m×2,3m Holzständer', 'Material (1.000€): Holz, Platten, Dämmung'],
    services_performed: ['Rückbauarbeiten', 'Trockenbau', 'Büroraum-Neubau']
  },
  'MöllerTech GmbH': {
    umsatz: 5760.00,
    rechnungen: ['RE2025-0009'],
    leistungen: ['Büro-Umzug (2.949€)', 'Küchentransport + Entrümpelung (1.890€)'],
    services_performed: ['Büro-Umzug', 'Küchentransport', 'Entrümpelung']
  },
  'KC Trading UG (Berkan Cavindir)': {
    umsatz: 5050.00,
    rechnungen: ['RE2025-0014'],
    leistungen: ['Lagerhallen Umzug (4.500€)', 'Demontage Trockenbauwand (550€)'],
    services_performed: ['Lagerhallen-Umzug', 'Demontage']
  },
  'Lars Schuerstedt': {
    umsatz: 5498.10,
    rechnungen: ['RE2025-0015'],
    leistungen: ['Umzug 8h (4.620€)', 'Material: 5m Sockelleiste + Arbeitsplatte 3,5m'],
    services_performed: ['Umzug', 'Montage', 'Material']
  },
  'Christian Pein': {
    umsatz: 5000.00,
    rechnungen: ['RE2025-0008'],
    leistungen: ['Messi-Wohnung: Entrümpelung (1.176€) + Reinigung (504€) + Malerarbeiten (2.521€)'],
    services_performed: ['Entrümpelung', 'Reinigung', 'Malerarbeiten']
  }
  // ... würde alle 51 Kunden enthalten
};

async function updateCustomersWithLeistungen() {
  console.log('📋 Adding Leistungen to customers...\n');

  let updated = 0;

  for (const [name, data] of Object.entries(kundenMitLeistungen)) {
    // Find customer
    const { data: customers } = await supabase
      .from('customers')
      .select('*')
      .ilike('name', `%${name}%`)
      .eq('is_deleted', false)
      .limit(1);

    if (!customers || customers.length === 0) {
      console.log(`⚠️  Kunde "${name}" nicht gefunden`);
      continue;
    }

    const customer = customers[0];

    // Update mit Leistungen
    const updatedNotes = `${customer.notes}

📋 ERBRACHTE LEISTUNGEN:
${data.leistungen.map((l, i) => `${i + 1}. ${l}`).join('\n')}

🏷️ SERVICE-KATEGORIEN:
${data.services_performed.join(', ')}`;

    const { error } = await supabase
      .from('customers')
      .update({
        notes: updatedNotes,
        services: data.services_performed // Update services array
      })
      .eq('id', customer.id);

    if (error) {
      console.log(`❌ ${name}:`, error.message);
    } else {
      console.log(`✅ ${name} - ${data.leistungen.length} Leistungen hinzugefügt`);
      updated++;
    }
  }

  console.log(`\n✅ ${updated} Kunden mit Leistungen erweitert\n`);
}

updateCustomersWithLeistungen();
