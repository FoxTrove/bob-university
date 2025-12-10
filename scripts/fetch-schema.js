#!/usr/bin/env node

/**
 * Fetch database schema from Supabase
 *
 * This script queries the information_schema to get table structures
 * for generating TypeScript types.
 *
 * Usage:
 *   node scripts/fetch-schema.js
 */

const https = require('https');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env file');
  process.exit(1);
}

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

// SQL query to get schema information
const schemaQuery = `
SELECT
  c.table_name,
  c.column_name,
  c.data_type,
  c.udt_name,
  c.character_maximum_length,
  c.numeric_precision,
  c.column_default,
  c.is_nullable,
  c.ordinal_position,
  CASE
    WHEN pk.column_name IS NOT NULL THEN true
    ELSE false
  END as is_primary_key
FROM information_schema.columns c
LEFT JOIN (
  SELECT ku.table_name, ku.column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage ku
    ON tc.constraint_name = ku.constraint_name
    AND tc.table_schema = ku.table_schema
  WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
WHERE c.table_schema = 'public'
  AND c.table_name = ANY(ARRAY[${tables.map(t => `'${t}'`).join(',')}])
ORDER BY c.table_name, c.ordinal_position;
`;

function makeRequest(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });

    const url = new URL(supabaseUrl);
    const options = {
      hostname: url.hostname,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

function mapPostgresTypeToTS(dataType, udtName, isNullable) {
  const nullable = isNullable === 'YES' ? ' | null' : '';

  const typeMap = {
    'bigint': 'number',
    'int8': 'number',
    'integer': 'number',
    'int': 'number',
    'int4': 'number',
    'smallint': 'number',
    'int2': 'number',
    'numeric': 'number',
    'decimal': 'number',
    'real': 'number',
    'float4': 'number',
    'double precision': 'number',
    'float8': 'number',
    'text': 'string',
    'varchar': 'string',
    'character varying': 'string',
    'char': 'string',
    'character': 'string',
    'uuid': 'string',
    'boolean': 'boolean',
    'bool': 'boolean',
    'date': 'string',
    'timestamp': 'string',
    'timestamp without time zone': 'string',
    'timestamp with time zone': 'string',
    'timestamptz': 'string',
    'time': 'string',
    'json': 'any',
    'jsonb': 'any',
    'array': 'any[]',
    'bytea': 'string',
  };

  let tsType = typeMap[dataType.toLowerCase()] || typeMap[udtName] || 'any';

  return tsType + nullable;
}

function generateTypeScriptTypes(schemaData) {
  const tableMap = {};

  // Group columns by table
  schemaData.forEach(col => {
    if (!tableMap[col.table_name]) {
      tableMap[col.table_name] = [];
    }
    tableMap[col.table_name].push(col);
  });

  let output = '// Generated TypeScript types from Supabase database schema\n';
  output += '// Generated at: ' + new Date().toISOString() + '\n\n';

  // Generate types for each table
  Object.keys(tableMap).sort().forEach(tableName => {
    const columns = tableMap[tableName];
    const typeName = tableName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');

    output += `export interface ${typeName} {\n`;

    columns.forEach(col => {
      const tsType = mapPostgresTypeToTS(col.data_type, col.udt_name, col.is_nullable);
      const comment = col.is_primary_key ? ' // Primary Key' : '';
      output += `  ${col.column_name}: ${tsType};${comment}\n`;
    });

    output += '}\n\n';
  });

  return output;
}

async function main() {
  console.log('Fetching database schema from Supabase...');
  console.log('Project URL:', supabaseUrl);
  console.log('Tables:', tables.join(', '));
  console.log('');

  try {
    const result = await makeRequest(schemaQuery);

    if (!result || result.length === 0) {
      console.error('Error: No schema data returned. This could mean:');
      console.error('  1. The exec_sql RPC function does not exist');
      console.error('  2. The tables do not exist');
      console.error('  3. The anon key does not have permission to query information_schema');
      console.error('');
      console.error('Please run the SQL query in scripts/get-schema.sql directly in the Supabase SQL Editor.');
      process.exit(1);
    }

    console.log(`Found ${result.length} columns across ${new Set(result.map(r => r.table_name)).size} tables\n`);

    // Display schema in readable format
    let currentTable = '';
    result.forEach(col => {
      if (col.table_name !== currentTable) {
        if (currentTable) console.log('');
        currentTable = col.table_name;
        console.log(`\n${currentTable}:`);
        console.log('─'.repeat(80));
      }

      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const pk = col.is_primary_key ? ' [PK]' : '';
      const defaultVal = col.column_default ? ` (default: ${col.column_default})` : '';
      const tsType = mapPostgresTypeToTS(col.data_type, col.udt_name, col.is_nullable);

      console.log(`  ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${nullable.padEnd(8)} ${tsType.padEnd(20)} ${pk}${defaultVal}`);
    });

    console.log('\n\n' + '='.repeat(80));
    console.log('GENERATED TYPESCRIPT TYPES');
    console.log('='.repeat(80) + '\n');

    const tsTypes = generateTypeScriptTypes(result);
    console.log(tsTypes);

    // Write to file
    const fs = require('fs');
    const outputPath = '/Users/kylerasmussen/Documents/Projects/bob-university/lib/database.types.ts';
    fs.writeFileSync(outputPath, tsTypes);
    console.log(`\nTypeScript types written to: ${outputPath}`);

  } catch (error) {
    console.error('Error fetching schema:', error.message);
    console.error('');
    console.error('This likely means the exec_sql RPC function does not exist.');
    console.error('Please run the SQL query in scripts/get-schema.sql directly in the Supabase SQL Editor.');
    console.error('Then copy the results to generate the TypeScript types manually.');
    process.exit(1);
  }
}

main();
