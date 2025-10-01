/**
 * Sort Customer Phases - Node Script
 * Führt automatische Phasen-Zuordnung aus
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kmxipuaqierjqaikuimi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteGlwdWFxaWVyanFhaWt1aW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MjU2NDUsImV4cCI6MjA2NjAwMTY0NX0.2S3cAnBh4zDFFQNpJ-VN17YrSJXyclyFjywN2izuPaU';

const supabase = createClient(supabaseUrl, supabaseKey);

// Manuelle Zuordnungen basierend auf Kalender
const PHASE_ASSIGNMENTS = {
  // Umzugstermine ab 1. Oktober - Durchführung
  'Alexander Betz': 'durchfuehrung',
  'Christopher Francke': 'durchfuehrung',
  'Norbert Deckert': 'durchfuehrung',
  'Peter Bellmann': 'durchfuehrung',
  'ETW GmbH': 'durchfuehrung',
  'Franziska Weßler': 'durchfuehrung',
  'Fried': 'durchfuehrung',
  'Hayder Dhahir': 'durchfuehrung',
  'Axel Erfkamp': 'durchfuehrung',
  'Brigitte Erfkamp': 'durchfuehrung',
  'Manfred Gärtner': 'durchfuehrung',
  'Francke': 'durchfuehrung',
  'Melanie Hainke': 'durchfuehrung',
  'Sigrid Roski': 'durchfuehrung',
  'Norbert Fuest': 'durchfuehrung',
  'Bernd Hinrechs': 'durchfuehrung',
  'Vera Krüger': 'durchfuehrung',
  'Michaela Heine': 'durchfuehrung',
  'Xenia Möller': 'durchfuehrung',
  'Helmut Gröger': 'durchfuehrung',
  'Filiz Temiz': 'durchfuehrung',

  // Besichtigungstermine - Besichtigung geplant
  'Gerda Rohden': 'besichtigung_geplant',
  'Sabine Schwind': 'besichtigung_geplant',
  'Birgit Chrapia': 'besichtigung_geplant',
  'Scharke': 'besichtigung_geplant',
  'Hausmeister': 'besichtigung_geplant',
  'Jacqueline Leiwat': 'besichtigung_geplant',
  'Martina Steinke': 'besichtigung_geplant',
  'Von der Heide': 'besichtigung_geplant',
  'Christiane Hanswillemenke': 'besichtigung_geplant',
  'Thorsten Fischer': 'besichtigung_geplant',
  'Thomas Buekenhout': 'besichtigung_geplant',
  'Stefanie Käßner': 'besichtigung_geplant',
  'Esra Kudeyt': 'besichtigung_geplant',
  'Ralf Hallermann': 'besichtigung_geplant',
  'Heike Obermeyer': 'besichtigung_geplant',
  'Benninghoff': 'besichtigung_geplant',
  'Littmann': 'besichtigung_geplant',

  // Letzte Septemberwoche - Archiviert
  'Sergej Schulz': 'archiviert',
};

async function sortCustomerPhases() {
  console.log('🔄 Starting customer phase sorting...\n');

  try {
    // Lade alle Kunden
    const { data: customers, error } = await supabase
      .from('customers')
      .select('*')
      .eq('is_deleted', false);

    if (error) throw error;

    console.log(`📊 Loaded ${customers.length} customers\n`);

    let updatedCount = 0;
    const updates = [];

    for (const [namePattern, phase] of Object.entries(PHASE_ASSIGNMENTS)) {
      // Finde Kunde mit partiellem Namensabgleich
      const customer = customers.find(c =>
        c.name.toLowerCase().includes(namePattern.toLowerCase()) ||
        namePattern.toLowerCase().includes(c.name.toLowerCase().substring(0, 15))
      );

      if (customer) {
        // Update nur wenn Phase unterschiedlich
        if (customer.current_phase !== phase) {
          const { error: updateError } = await supabase
            .from('customers')
            .update({ current_phase: phase })
            .eq('id', customer.id);

          if (!updateError) {
            console.log(`✅ ${customer.name.substring(0, 30)}: ${customer.current_phase || 'keine'} → ${phase}`);
            updatedCount++;
            updates.push({
              name: customer.name,
              oldPhase: customer.current_phase || 'keine',
              newPhase: phase
            });
          } else {
            console.error(`❌ Fehler bei ${customer.name}:`, updateError.message);
          }
        } else {
          console.log(`⏭️  ${customer.name.substring(0, 30)}: bereits ${phase}`);
        }
      } else {
        console.log(`⚠️  Kunde nicht gefunden: ${namePattern}`);
      }
    }

    console.log(`\n✅ Sortierung abgeschlossen!`);
    console.log(`📈 ${updatedCount} Kunden aktualisiert`);
    console.log(`📋 ${customers.length - updatedCount} Kunden unverändert`);

    return { success: true, updatedCount, updates };

  } catch (error) {
    console.error('❌ Fehler:', error);
    return { success: false, error: error.message };
  }
}

// Führe aus
sortCustomerPhases()
  .then(result => {
    console.log('\n✨ Fertig!', result);
    process.exit(0);
  })
  .catch(err => {
    console.error('💥 Error:', err);
    process.exit(1);
  });
