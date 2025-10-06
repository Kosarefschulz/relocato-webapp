/**
 * Cleanup Customer Duplicates
 * Findet Duplikate und behält nur den besten Eintrag
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://kmxipuaqierjqaikuimi.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteGlwdWFxaWVyanFhaWt1aW1pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQyNTY0NSwiZXhwIjoyMDY2MDAxNjQ1fQ.VTT4d5nndvGQxJxlR6t0YyVHcZfFStqbI1KRbcIOH0c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Normalisiere Namen für Vergleich
function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Entferne Sonderzeichen
    .trim();
}

// Bewerte welcher Kunde der "beste" ist
function scoreCustomer(customer) {
  let score = 0;

  // Hat Email? +10
  if (customer.email && customer.email !== '') score += 10;

  // Hat Telefon? +10
  if (customer.phone && customer.phone !== '') score += 10;

  // Hat Adresse? +5
  if (customer.from_address && customer.from_address !== '') score += 5;
  if (customer.to_address && customer.to_address !== '') score += 5;

  // Hat Datum? +5
  if (customer.moving_date) score += 5;

  // Neuerer Eintrag? +1 pro Tag seit 2025-01-01
  if (customer.created_at) {
    const created = new Date(customer.created_at);
    const daysSince2025 = (created - new Date('2025-01-01')) / (1000 * 60 * 60 * 24);
    score += Math.floor(daysSince2025 / 10); // +1 pro 10 Tage
  }

  // Hat Notizen? +3
  if (customer.notes && customer.notes.length > 10) score += 3;

  return score;
}

async function findDuplicates() {
  console.log('🔍 Finding duplicates...\n');

  // Hole alle Kunden
  const { data: customers, error } = await supabase
    .from('customers')
    .select('*')
    .eq('is_deleted', false);

  if (error) {
    console.error('❌ Error fetching customers:', error);
    return [];
  }

  console.log(`📊 Total customers: ${customers.length}\n`);

  // Gruppiere nach normalisiertem Namen
  const groups = {};

  customers.forEach(customer => {
    const normalized = normalizeName(customer.name);
    if (!normalized) return;

    if (!groups[normalized]) {
      groups[normalized] = [];
    }
    groups[normalized].push(customer);
  });

  // Finde Gruppen mit >1 Kunden (Duplikate)
  const duplicates = Object.entries(groups)
    .filter(([_, group]) => group.length > 1)
    .map(([normalized, group]) => ({
      normalized,
      originalName: group[0].name,
      count: group.length,
      customers: group
    }));

  console.log(`🔍 Found ${duplicates.length} duplicate groups\n`);

  return duplicates;
}

async function cleanupDuplicates(dryRun = true) {
  console.log('🧹 Cleanup Duplicates\n');
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN (no changes)' : '⚠️  LIVE (will delete!)'}\n`);

  const duplicates = await findDuplicates();

  if (duplicates.length === 0) {
    console.log('✅ No duplicates found!');
    return;
  }

  const stats = {
    groups: duplicates.length,
    totalCustomers: duplicates.reduce((sum, d) => sum + d.count, 0),
    toKeep: duplicates.length,
    toDelete: duplicates.reduce((sum, d) => sum + d.count - 1, 0)
  };

  console.log('═══════════════════════════════════════');
  console.log('📊 STATISTICS');
  console.log('═══════════════════════════════════════');
  console.log(`Duplicate groups: ${stats.groups}`);
  console.log(`Total duplicated customers: ${stats.totalCustomers}`);
  console.log(`Will keep: ${stats.toKeep} (beste von jeder Gruppe)`);
  console.log(`Will delete: ${stats.toDelete}`);
  console.log('═══════════════════════════════════════\n');

  const deletedIds = [];
  const keptIds = [];

  for (const group of duplicates) {
    console.log(`\n👥 Group: "${group.originalName}" (${group.count} duplicates)`);

    // Score alle Kunden
    const scored = group.customers.map(c => ({
      ...c,
      score: scoreCustomer(c)
    }));

    // Sortiere nach Score (höchster zuerst)
    scored.sort((a, b) => b.score - a.score);

    const best = scored[0];
    const toDelete = scored.slice(1);

    console.log(`   ✅ KEEP: ${best.name} (Score: ${best.score}, ID: ${best.id})`);
    if (best.email) console.log(`      Email: ${best.email}`);
    if (best.phone) console.log(`      Phone: ${best.phone}`);

    keptIds.push(best.id);

    console.log(`   ❌ DELETE (${toDelete.length}):`);
    toDelete.forEach((c, i) => {
      console.log(`      ${i + 1}. ${c.name} (Score: ${c.score}, ID: ${c.id})`);
      deletedIds.push(c.id);
    });

    // Lösche Duplikate (wenn nicht dry-run)
    if (!dryRun) {
      for (const customer of toDelete) {
        const { error } = await supabase
          .from('customers')
          .update({ is_deleted: true })
          .eq('id', customer.id);

        if (error) {
          console.log(`      ❌ Error deleting ${customer.id}: ${error.message}`);
        } else {
          console.log(`      ✅ Deleted ${customer.id}`);
        }
      }
    }
  }

  console.log('\n═══════════════════════════════════════');
  console.log('📊 FINAL SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`✅ Kept: ${keptIds.length} customers`);
  console.log(`${dryRun ? '🔍 Would delete' : '❌ Deleted'}: ${deletedIds.length} customers`);
  console.log('═══════════════════════════════════════\n');

  if (dryRun) {
    console.log('💡 This was a DRY RUN - no changes made!');
    console.log('   To actually delete, run:');
    console.log('   node scripts/cleanup-duplicates.js --delete\n');
  } else {
    console.log('✅ Cleanup complete!\n');
  }

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    mode: dryRun ? 'dry-run' : 'live',
    statistics: stats,
    kept: keptIds,
    deleted: deletedIds,
    groups: duplicates.map(d => ({
      name: d.originalName,
      count: d.count,
      kept: d.customers.find(c => keptIds.includes(c.id))?.id,
      deleted: d.customers.filter(c => deletedIds.includes(c.id)).map(c => c.id)
    }))
  };

  const filename = `duplicate-cleanup-report-${Date.now()}.json`;
  require('fs').writeFileSync(filename, JSON.stringify(report, null, 2));
  console.log(`💾 Report saved: ${filename}\n`);
}

// Check parameter
const shouldDelete = process.argv.includes('--delete');

if (shouldDelete) {
  console.log('⚠️  WARNING: This will DELETE duplicate customers!\n');
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

  setTimeout(() => {
    cleanupDuplicates(false); // LIVE mode
  }, 5000);
} else {
  cleanupDuplicates(true); // DRY RUN mode
}
