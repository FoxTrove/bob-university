const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const tables = [
  'profiles',
  'salons',
  'entitlements',
  'purchases',
  'modules',
  'videos',
  'video_progress',
  'push_tokens'
];

async function getTableSchema(tableName) {
  // Query information_schema to get column details
  const { data, error } = await supabase.rpc('get_table_schema', {
    table_name: tableName
  });

  if (error) {
    // Fallback: Use a direct query if the RPC doesn't exist
    return await getTableSchemaDirectly(tableName);
  }

  return data;
}

async function getTableSchemaDirectly(tableName) {
  // Query the information_schema directly
  const query = `
    SELECT
      column_name,
      data_type,
      character_maximum_length,
      column_default,
      is_nullable,
      udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = '${tableName}'
    ORDER BY ordinal_position;
  `;

  const { data, error } = await supabase.rpc('exec_sql', { query });

  if (error) {
    console.error(`Error querying ${tableName}:`, error);
    return null;
  }

  return data;
}

async function getTableConstraints(tableName) {
  // Get primary keys, foreign keys, and unique constraints
  const query = `
    SELECT
      tc.constraint_name,
      tc.constraint_type,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    LEFT JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name = '${tableName}'
    ORDER BY tc.constraint_type, kcu.column_name;
  `;

  const { data, error } = await supabase.rpc('exec_sql', { query });

  if (error) {
    // If exec_sql doesn't exist, we'll skip constraints for now
    return [];
  }

  return data;
}

async function main() {
  console.log('Fetching database schema from Supabase...\n');
  console.log('Project URL:', supabaseUrl);
  console.log('Tables:', tables.join(', '));
  console.log('\n' + '='.repeat(80) + '\n');

  for (const tableName of tables) {
    console.log(`\n### Table: ${tableName}\n`);

    try {
      // Try using Supabase's built-in schema inspection
      const { data: columns, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);

      if (error && error.code === 'PGRST116') {
        console.log(`Table '${tableName}' does not exist or is not accessible.`);
        continue;
      }

      // Get detailed schema using SQL query
      const { data: schemaData, error: schemaError } = await supabase
        .rpc('exec_sql', {
          sql: `
            SELECT
              c.column_name,
              c.data_type,
              c.udt_name,
              c.character_maximum_length,
              c.column_default,
              c.is_nullable,
              c.is_identity,
              c.identity_generation,
              CASE
                WHEN pk.column_name IS NOT NULL THEN 'YES'
                ELSE 'NO'
              END as is_primary_key
            FROM information_schema.columns c
            LEFT JOIN (
              SELECT ku.column_name
              FROM information_schema.table_constraints tc
              JOIN information_schema.key_column_usage ku
                ON tc.constraint_name = ku.constraint_name
                AND tc.table_schema = ku.table_schema
              WHERE tc.constraint_type = 'PRIMARY KEY'
                AND tc.table_schema = 'public'
                AND tc.table_name = '${tableName}'
            ) pk ON c.column_name = pk.column_name
            WHERE c.table_schema = 'public'
              AND c.table_name = '${tableName}'
            ORDER BY c.ordinal_position;
          `
        });

      if (schemaError) {
        console.log('Could not fetch schema details. Error:', schemaError.message);
        console.log('The table exists but schema details are not accessible via RPC.');
        continue;
      }

      if (!schemaData || schemaData.length === 0) {
        console.log('No columns found for this table.');
        continue;
      }

      // Display schema
      console.log('Columns:');
      schemaData.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const pk = col.is_primary_key === 'YES' ? ' [PRIMARY KEY]' : '';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';

        console.log(`  - ${col.column_name}: ${col.data_type}${pk} ${nullable}${defaultVal}`);
      });

    } catch (err) {
      console.error(`Error processing table ${tableName}:`, err.message);
    }

    console.log('\n' + '-'.repeat(80));
  }

  console.log('\n\nSchema fetch complete!');
}

main().catch(console.error);
