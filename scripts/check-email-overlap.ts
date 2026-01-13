import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_LIVE || '', {
  apiVersion: '2024-12-18.acacia',
});

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkOverlap() {
  // Get all Stripe customers with charges
  const stripeEmails = new Set<string>();
  let hasMore = true;
  let startingAfter: string | undefined;

  console.log('Fetching Stripe customers...');

  while (hasMore) {
    const params: Stripe.ChargeListParams = { limit: 100, expand: ['data.customer'] };
    if (startingAfter) params.starting_after = startingAfter;

    const response = await stripe.charges.list(params);

    for (const charge of response.data) {
      if (charge.status === 'succeeded') {
        const customer = charge.customer as Stripe.Customer;
        if (customer?.email) {
          stripeEmails.add(customer.email.toLowerCase());
        }
      }
    }

    hasMore = response.has_more;
    if (response.data.length > 0) {
      startingAfter = response.data[response.data.length - 1].id;
    }
  }

  // Get all Supabase users
  const { data: profiles } = await supabase.from('profiles').select('email');
  const supabaseEmails = new Set(
    profiles?.map(p => p.email?.toLowerCase()).filter((e): e is string => Boolean(e)) || []
  );

  // Calculate overlap
  const inBoth: string[] = [];
  const stripeOnly: string[] = [];
  const supabaseOnly: string[] = [];

  for (const email of stripeEmails) {
    if (supabaseEmails.has(email)) {
      inBoth.push(email);
    } else {
      stripeOnly.push(email);
    }
  }

  for (const email of supabaseEmails) {
    if (!stripeEmails.has(email)) {
      supabaseOnly.push(email);
    }
  }

  console.log('\nEmail Overlap Analysis:');
  console.log('  Stripe customers (with charges):', stripeEmails.size);
  console.log('  Supabase users:', supabaseEmails.size);
  console.log('  In both systems:', inBoth.length);
  console.log('  Stripe only:', stripeOnly.length);
  console.log('  Supabase only:', supabaseOnly.length);

  console.log('\nStripe-only emails (sample):');
  stripeOnly.slice(0, 15).forEach(e => console.log('  -', e));
}

checkOverlap().catch(e => console.error('Error:', e.message));
