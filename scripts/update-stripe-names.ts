/**
 * Update Stripe User Names
 *
 * Fetches customer names from Stripe and updates profiles
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_LIVE || '', {
  apiVersion: '2024-12-18.acacia',
});

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

async function main() {
  console.log('='.repeat(60));
  console.log('Update Stripe User Names');
  console.log('='.repeat(60));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}\n`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Get all profiles with Stripe customer IDs but no name
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name, stripe_customer_id')
    .not('stripe_customer_id', 'is', null);

  console.log(`Found ${profiles?.length || 0} profiles with Stripe IDs\n`);

  let updated = 0;
  let skipped = 0;

  for (const profile of profiles || []) {
    // Skip if already has a name
    if (profile.full_name) {
      skipped++;
      continue;
    }

    try {
      const customer = await stripe.customers.retrieve(profile.stripe_customer_id);

      if (customer.deleted) {
        console.log(`  ${profile.email}: Customer deleted in Stripe`);
        continue;
      }

      const name = customer.name;
      if (!name) {
        console.log(`  ${profile.email}: No name in Stripe`);
        continue;
      }

      const titleCaseName = toTitleCase(name);

      if (DRY_RUN) {
        console.log(`  Would update ${profile.email}: "${titleCaseName}"`);
      } else {
        await supabase
          .from('profiles')
          .update({ full_name: titleCaseName })
          .eq('id', profile.id);
        console.log(`  Updated ${profile.email}: "${titleCaseName}"`);
      }
      updated++;

      // Rate limiting
      await new Promise(r => setTimeout(r, 100));
    } catch (err: any) {
      console.error(`  Error for ${profile.email}:`, err.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Complete');
  console.log('='.repeat(60));
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (already has name): ${skipped}`);
}

main().catch(console.error);
