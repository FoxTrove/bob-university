#!/usr/bin/env node

/**
 * Simple migration runner for Bob University
 * Reads SQL file and executes it via Supabase REST API
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env file');
  console.error('Required: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const sqlFile = path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

console.log('Bob University - Database Migration Runner');
console.log('===========================================\n');
console.log(`Supabase URL: ${supabaseUrl}`);
console.log(`Migration file: ${sqlFile}`);
console.log(`SQL length: ${sql.length} characters\n`);

console.log('\nIMPORTANT: The anon key cannot execute DDL statements.');
console.log('Please run this migration in one of these ways:\n');
console.log('1. Copy the SQL from:');
console.log(`   ${sqlFile}`);
console.log('   and paste it into the Supabase SQL Editor at:');
console.log(`   ${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/')}/sql/new\n`);
console.log('2. OR, if you have the service role key, add it to your .env:');
console.log('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
console.log('   (found in Supabase Dashboard > Settings > API > service_role key)\n');

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (projectRef) {
  console.log('\nDirect link to SQL Editor:');
  console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new`);
}

console.log('\n===========================================');
console.log('After running the migration, verify with:');
console.log('===========================================\n');
console.log('SELECT table_name FROM information_schema.tables');
console.log("WHERE table_schema = 'public'");
console.log('ORDER BY table_name;');
console.log('');
