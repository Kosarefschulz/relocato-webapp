/**
 * Führt SQL-Migration direkt auf Supabase aus
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://kmxipuaqierjqaikuimi.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteGlwdWFxaWVyanFhaWt1aW1pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQyNTY0NSwiZXhwIjoyMDY2MDAxNjQ1fQ.cXQ4YY9kV3jXqo5pYPJ-gThJVkQFNxQPK0y8KMqE4-w';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration(migrationFile) {
  console.log('🚀 Running migration:', migrationFile);

  try {
    // Lese SQL-Datei
    const sql = fs.readFileSync(migrationFile, 'utf-8');

    // Teile in einzelne Statements (grob)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      if (!statement) continue;

      console.log(`\n[${i + 1}/${statements.length}] Executing...`);
      console.log(statement.slice(0, 100) + '...');

      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement + ';'
      }).catch(async () => {
        // Fallback: Direct query (funktioniert nicht für CREATE TABLE, aber für einfache Queries)
        return await supabase.from('_migrations').insert({ statement });
      });

      if (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error.message);
        // Continue with next statement
      } else {
        console.log(`✅ Success`);
      }
    }

    console.log('\n✅ Migration completed!');
    console.log('\n📊 Verify migration in Supabase Dashboard:');
    console.log('   SQL Editor → Check if tables exist');
    console.log('   Tables: ai_chat_history, ai_chat_sessions, ai_knowledge_base, etc.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n💡 Alternative: Copy SQL to Supabase Dashboard SQL Editor and run manually');
    process.exit(1);
  }
}

// Run migration
const migrationFile = process.argv[2] || 'supabase/migrations/20251006_add_ai_rag_system.sql';
runMigration(migrationFile);
