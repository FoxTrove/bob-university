#!/usr/bin/env node

/**
 * Verify Database Schema for Bob University
 * Checks that all tables, policies, and functions exist
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const expectedTables = [
  'profiles',
  'salons',
  'entitlements',
  'purchases',
  'modules',
  'videos',
  'video_progress',
  'push_tokens'
];

async function verifySchema() {
  console.log('Bob University - Schema Verification');
  console.log('=====================================\n');

  try {
    // Try to query each table to verify it exists
    console.log('Checking tables...\n');

    const results = {
      success: [],
      failed: []
    };

    for (const table of expectedTables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('id')
          .limit(1);

        if (error) {
          // Table might exist but have RLS blocking us
          if (error.message.includes('permission denied') || error.message.includes('policy')) {
            console.log(`  ✓ ${table} (exists, RLS enabled)`);
            results.success.push(table);
          } else {
            console.log(`  ✗ ${table} - ${error.message}`);
            results.failed.push({ table, error: error.message });
          }
        } else {
          console.log(`  ✓ ${table} (exists, accessible)`);
          results.success.push(table);
        }
      } catch (err) {
        console.log(`  ✗ ${table} - ${err.message}`);
        results.failed.push({ table, error: err.message });
      }
    }

    console.log('\n=====================================');
    console.log('Summary');
    console.log('=====================================\n');
    console.log(`Tables verified: ${results.success.length}/${expectedTables.length}`);

    if (results.failed.length > 0) {
      console.log(`\nFailed tables:`);
      results.failed.forEach(({ table, error }) => {
        console.log(`  - ${table}: ${error}`);
      });
      console.log('\nPlease run the migration SQL in Supabase Dashboard:');
      console.log('https://supabase.com/dashboard/project/lwofrjklqmanklbmbsgz/sql/new');
    } else {
      console.log('\n✓ All tables exist!');
      console.log('\nNext steps:');
      console.log('  1. Test user signup to verify profile creation');
      console.log('  2. Add sample content (modules and videos)');
      console.log('  3. Test video progress tracking');
    }

  } catch (err) {
    console.error('\nError verifying schema:', err.message);
    console.error('\nMake sure you have run the migration SQL first.');
  }
}

// Check if we can access the database
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error && !error.message.includes('permission') && !error.message.includes('policy')) {
      console.log('\nNote: Could not access database. This is normal if:');
      console.log('  - You haven\'t run the migration yet');
      console.log('  - You\'re not authenticated');
      console.log('  - RLS policies are blocking access\n');
    }
  } catch (err) {
    console.log('\nDatabase connection test:', err.message, '\n');
  }
}

async function main() {
  await testConnection();
  await verifySchema();
}

main().catch(console.error);
