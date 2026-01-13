#!/usr/bin/env node

/**
 * Fetch database schema from Supabase (Admin Mode)
 *
 * This script queries the information_schema to get table structures
 * using the SERVICE ROLE KEY to ensure access.
 */

const https = require('https');
const fs = require('fs'); // Added fs
const path = require('path');
require('dotenv').config();

// USE SERVICE ROLE KEY
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env file');
  process.exit(1);
}

// SQL query to get schema information for ALL public tables
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
      res.on('data', (chunk) => { data += chunk; });
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

    req.on('error', (e) => { reject(e); });
    req.write(postData);
    req.end();
  });
}

async function main() {
  try {
    const result = await makeRequest(schemaQuery);
    // Output JSON to stdout so we can pipe it
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error fetching schema:', error.message);
    process.exit(1);
  }
}

main();
