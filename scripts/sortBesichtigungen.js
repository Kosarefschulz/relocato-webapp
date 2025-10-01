/**
 * Sort Besichtigungstermine
 * Basierend auf Kalender-Screenshots
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://kmxipuaqierjqaikuimi.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY_HERE';

const supabase = createClient(supabaseUrl, supabaseKey);

// Besichtigungstermine aus Kalender (BT: = Besichtigungstermin)
const BESICHTIGUNGEN = [
  'Gerda Rohden',
  'Sabine Schwind',
  'Birgit Chrapia',
  'Scharke Hausmeister',
  'Jacqueline Leiwat',
  'Bernd Hinrechs', // ✓ im Kalender
  'Michaela Heine', // ✓ im Kalender
  'Martina Steinke',
  'Christiane Hanswillemenke',
  'Thorsten Fischer', // ✓ bereits gefunden
  'Thomas Buekenhout',
  'Stefanie Käßner',
  'Esra Kudeyt',
  'Ralf Hallermann',
  'Heike Obermeyer',
  'Benninghoff',
  'Littmann',
  'Pflegeberatung', // Aus Kalender
  'Enns',
  'Markmeier',
  'Kaßner',
  'Kudeyt',
  'Hallermann',
  'Obermeyer',
];

async function sortBesichtigungen() {
  console.log('🔄 Sortiere Besichtigungstermine...\n');

  try {
    const { data: customers, error } = await supabase
      .from('customers')
      .select('*')
      .eq('is_deleted', false);

    if (error) throw error;

    console.log(`📊 ${customers.length} Kunden geladen\n`);

    let updatedCount = 0;

    for (const namePattern of BESICHTIGUNGEN) {
      // Flexible Suche
      const customer = customers.find(c => {
        const cNameLower = c.name.toLowerCase();
        const patternLower = namePattern.toLowerCase();

        return (
          cNameLower.includes(patternLower) ||
          patternLower.includes(cNameLower.split(' ')[0].toLowerCase()) ||
          cNameLower.split(':').pop().trim().includes(patternLower)
        );
      });

      if (customer && customer.current_phase !== 'besichtigung_geplant') {
        const { error: updateError } = await supabase
          .from('customers')
          .update({ current_phase: 'besichtigung_geplant' })
          .eq('id', customer.id);

        if (!updateError) {
          console.log(`✅ ${customer.name.substring(0, 40)}: ${customer.current_phase || 'keine'} → besichtigung_geplant`);
          updatedCount++;
        }
      } else if (customer) {
        console.log(`⏭️  ${customer.name.substring(0, 40)}: bereits besichtigung_geplant`);
      } else {
        console.log(`⚠️  Nicht gefunden: ${namePattern}`);
      }
    }

    console.log(`\n✅ ${updatedCount} Besichtigungstermine aktualisiert`);
    return { success: true, updatedCount };

  } catch (error) {
    console.error('❌ Fehler:', error);
    return { success: false, error: error.message };
  }
}

sortBesichtigungen()
  .then(result => {
    console.log('\n✨ Fertig!', result);
    process.exit(0);
  })
  .catch(err => {
    console.error('💥 Error:', err);
    process.exit(1);
  });
