/**
 * Create Historical Revenue Script
 *
 * Creates monthly revenue_ledger entries for GHL-migrated users
 * based on their subscription start date.
 *
 * Usage:
 *   npx tsx scripts/create-historical-revenue.ts [--dry-run]
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const MONTHLY_AMOUNT_CENTS = 4900; // $49/month individual plan

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

interface RevenueEntry {
  user_id: string;
  source: 'manual';
  platform: 'unknown';
  product_type: 'subscription';
  plan: 'individual';
  status: 'completed';
  amount_cents: number;
  currency: 'USD';
  occurred_at: string;
  metadata: { migration: string; month: string };
}

function getMonthsBetween(startDate: Date, endDate: Date): Date[] {
  const months: Date[] = [];
  const current = new Date(startDate);
  current.setDate(1); // Start of month
  current.setHours(12, 0, 0, 0);

  while (current <= endDate) {
    months.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Create Historical Revenue');
  console.log('='.repeat(60));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Amount: $${(MONTHLY_AMOUNT_CENTS / 100).toFixed(2)}/month`);
  console.log('');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing required environment variables');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Get all GHL-migrated users with their subscription start dates
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, created_at')
    .not('ghl_contact_id', 'is', null);

  if (error) {
    console.error('Error fetching profiles:', error.message);
    process.exit(1);
  }

  // Check for existing migration revenue entries
  const { data: existingRevenue } = await supabase
    .from('revenue_ledger')
    .select('user_id')
    .eq('source', 'manual')
    .contains('metadata', { migration: 'ghl' });

  const usersWithRevenue = new Set(existingRevenue?.map(r => r.user_id) || []);

  const now = new Date();
  let totalEntries = 0;
  let totalRevenue = 0;
  const entries: RevenueEntry[] = [];

  console.log(`Processing ${profiles?.length || 0} GHL-migrated users...\n`);

  for (const profile of profiles || []) {
    // Skip if already has migration revenue
    if (usersWithRevenue.has(profile.id)) {
      console.log(`  Skipping ${profile.email} - already has revenue entries`);
      continue;
    }

    const startDate = new Date(profile.created_at);
    const months = getMonthsBetween(startDate, now);

    for (const month of months) {
      const entry: RevenueEntry = {
        user_id: profile.id,
        source: 'manual',
        platform: 'unknown',
        product_type: 'subscription',
        plan: 'individual',
        status: 'completed',
        amount_cents: MONTHLY_AMOUNT_CENTS,
        currency: 'USD',
        occurred_at: month.toISOString(),
        metadata: {
          migration: 'ghl',
          month: month.toISOString().slice(0, 7), // YYYY-MM
        },
      };
      entries.push(entry);
      totalEntries++;
      totalRevenue += MONTHLY_AMOUNT_CENTS;
    }
  }

  console.log(`\nWill create ${totalEntries} revenue entries`);
  console.log(`Total historical revenue: $${(totalRevenue / 100).toFixed(2)}`);

  if (DRY_RUN) {
    console.log('\nDRY RUN - No changes made');
    console.log('\nSample entries:');
    entries.slice(0, 5).forEach(e => {
      console.log(`  ${e.occurred_at.slice(0, 7)}: $${(e.amount_cents / 100).toFixed(2)}`);
    });
    return;
  }

  // Insert in batches of 100
  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    const { error: insertError } = await supabase
      .from('revenue_ledger')
      .insert(batch);

    if (insertError) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError.message);
    } else {
      inserted += batch.length;
      console.log(`  Inserted ${inserted}/${entries.length} entries`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Complete');
  console.log('='.repeat(60));
  console.log(`Entries created: ${inserted}`);
  console.log(`Total revenue: $${(totalRevenue / 100).toFixed(2)}`);
}

main().catch(console.error);
