require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabase() {
  console.log('Connecting to Supabase...');
  console.log(`URL: ${supabaseUrl}`);
  console.log('');

  try {
    // Query the information_schema to get all tables in the public schema
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (error) {
      // If we can't query information_schema, try a simpler query
      console.log('Note: Cannot query information_schema directly (expected with RLS)');
      console.log('Attempting alternative method...\n');

      // Try to query auth.users to confirm connection
      const { data: authData, error: authError } = await supabase.auth.getSession();

      if (authError) {
        console.error('Connection error:', authError.message);
        return;
      }

      console.log('✓ Successfully connected to Supabase!');
      console.log('\nTo list tables, we need to use SQL query with proper permissions.');
      console.log('Attempting SQL query...\n');

      // Use RPC or direct SQL query
      const { data: sqlData, error: sqlError } = await supabase.rpc('exec_sql', {
        query: `
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
          ORDER BY table_name
        `
      });

      if (sqlError) {
        console.log('RPC method not available. Using direct query method...\n');

        // List known tables by attempting to query them
        const knownTables = ['users', 'profiles', 'videos', 'modules', 'certifications', 'stylists'];
        console.log('Checking for common tables:');

        for (const tableName of knownTables) {
          const { error: checkError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

          if (!checkError) {
            console.log(`  ✓ ${tableName} exists`);
          }
        }
      } else {
        console.log('Tables found:');
        sqlData.forEach(table => {
          console.log(`  - ${table.table_name}`);
        });
      }
    } else {
      console.log('✓ Successfully connected to Supabase!');
      console.log('\nTables in public schema:');

      if (!tables || tables.length === 0) {
        console.log('  (no tables found)');
      } else {
        tables.forEach(table => {
          console.log(`  - ${table.table_name}`);
        });
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

checkDatabase();
