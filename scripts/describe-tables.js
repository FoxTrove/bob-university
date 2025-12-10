require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function describeTable(tableName) {
  console.log(`\n=== ${tableName.toUpperCase()} ===`);

  try {
    // Get a sample row to see the structure
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      console.log(`  Error: ${error.message}`);
      return;
    }

    if (!data || data.length === 0) {
      console.log('  (empty table - no rows to show structure)');
      return;
    }

    const columns = Object.keys(data[0]);
    console.log('  Columns:');
    columns.forEach(col => {
      const value = data[0][col];
      const type = typeof value;
      console.log(`    - ${col}: ${type}`);
    });

    // Get row count
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (!countError) {
      console.log(`  Row count: ${count}`);
    }
  } catch (err) {
    console.log(`  Error: ${err.message}`);
  }
}

async function describeTables() {
  console.log('Bob University Database Schema\n');
  console.log('Project URL:', supabaseUrl);
  console.log('Reference:', supabaseUrl.match(/https:\/\/(.+)\.supabase\.co/)?.[1]);

  const tables = ['users', 'profiles', 'videos', 'modules', 'certifications', 'stylists'];

  for (const table of tables) {
    await describeTable(table);
  }

  console.log('\n');
}

describeTables();
