/**
 * Import Stripe Subscriptions Script
 *
 * Imports subscription data from Stripe to:
 * 1. Create/update subscription_records
 * 2. Update revenue_ledger with real payment history
 * 3. Set proper entitlement status for churned users
 * 4. Import canceled members who don't exist yet
 *
 * Usage:
 *   npx tsx scripts/import-stripe-subscriptions.ts [--dry-run]
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_LIVE || '', {
  apiVersion: '2024-12-18.acacia',
});

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

// Map Stripe price IDs to plan types
const PRICE_TO_PLAN: Record<string, string> = {
  'samcart_plan_98392_171036': 'individual',      // Bob University $17/mo
  'price_1RjRhMH8tgl1nRYlHRfoNAul': 'individual', // Stylist Membership $27/mo
  'subscription_plan_281117': 'individual',        // Founders $14/mo
  'samcart_plan_98392_198730': 'salon',           // Salon $49.97/mo
  'subscription_plan_219324': 'individual',        // Founders Premium $35/mo
};

interface SubscriptionData {
  stripeSubscriptionId: string;
  customerId: string;
  customerEmail: string;
  status: string;
  priceId: string;
  plan: string;
  amount: number;
  currency: string;
  created: Date;
  canceledAt: Date | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
}

interface PaymentData {
  chargeId: string;
  customerId: string;
  customerEmail: string;
  amount: number;
  currency: string;
  created: Date;
  status: string;
  description: string | null;
}

async function fetchAllCharges(): Promise<PaymentData[]> {
  const charges: PaymentData[] = [];
  let hasMore = true;
  let startingAfter: string | undefined;

  console.log('Fetching all charges from Stripe...');

  while (hasMore) {
    const params: Stripe.ChargeListParams = {
      limit: 100,
      expand: ['data.customer'],
    };
    if (startingAfter) params.starting_after = startingAfter;

    const response = await stripe.charges.list(params);

    for (const charge of response.data) {
      if (charge.status !== 'succeeded') continue;

      const customer = charge.customer as Stripe.Customer | null;
      if (!customer || !customer.email) continue;

      charges.push({
        chargeId: charge.id,
        customerId: customer.id,
        customerEmail: customer.email.toLowerCase(),
        amount: charge.amount,
        currency: charge.currency,
        created: new Date(charge.created * 1000),
        status: 'completed',
        description: charge.description,
      });
    }

    hasMore = response.has_more;
    if (response.data.length > 0) {
      startingAfter = response.data[response.data.length - 1].id;
    }
  }

  console.log(`  Found ${charges.length} successful charges`);
  return charges;
}

async function fetchAllSubscriptions(): Promise<SubscriptionData[]> {
  const subscriptions: SubscriptionData[] = [];

  console.log('Fetching subscriptions from Stripe...');

  // Fetch active subscriptions
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const params: Stripe.SubscriptionListParams = {
      status: 'all',
      limit: 100,
      expand: ['data.customer'],
    };
    if (startingAfter) params.starting_after = startingAfter;

    const response = await stripe.subscriptions.list(params);

    for (const sub of response.data) {
      const customer = sub.customer as Stripe.Customer;
      if (!customer.email) continue;

      const priceId = sub.items.data[0]?.price?.id || '';
      const plan = PRICE_TO_PLAN[priceId] || 'individual';

      subscriptions.push({
        stripeSubscriptionId: sub.id,
        customerId: customer.id,
        customerEmail: customer.email.toLowerCase(),
        status: sub.status,
        priceId,
        plan,
        amount: sub.items.data[0]?.price?.unit_amount || 0,
        currency: sub.currency,
        created: new Date(sub.created * 1000),
        canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
      });
    }

    hasMore = response.has_more;
    if (response.data.length > 0) {
      startingAfter = response.data[response.data.length - 1].id;
    }
  }

  console.log(`  Found ${subscriptions.length} total subscriptions`);
  const active = subscriptions.filter(s => s.status === 'active').length;
  const canceled = subscriptions.filter(s => s.status === 'canceled').length;
  console.log(`  Active: ${active}, Canceled: ${canceled}`);

  return subscriptions;
}

function generatePassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 24; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Import Stripe Subscriptions');
  console.log('='.repeat(60));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log('');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing required environment variables');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Fetch all subscriptions
  const subscriptions = await fetchAllSubscriptions();

  // Get existing users
  const { data: existingProfiles } = await supabase
    .from('profiles')
    .select('id, email, stripe_customer_id');

  const emailToProfile = new Map(
    existingProfiles?.map(p => [p.email?.toLowerCase(), p]) || []
  );

  // Get existing revenue entries to avoid duplicates
  const { data: existingRevenue } = await supabase
    .from('revenue_ledger')
    .select('external_id')
    .eq('source', 'stripe');

  const existingInvoiceIds = new Set(existingRevenue?.map(r => r.external_id) || []);

  const stats = {
    usersCreated: 0,
    usersUpdated: 0,
    subscriptionRecordsCreated: 0,
    revenueEntriesCreated: 0,
    revenueAmount: 0,
    entitlementsUpdated: 0,
  };

  console.log(`\nProcessing ${subscriptions.length} subscriptions...\n`);

  for (const sub of subscriptions) {
    let profile = emailToProfile.get(sub.customerEmail);

    // Create user if doesn't exist (for canceled members not yet imported)
    if (!profile) {
      if (DRY_RUN) {
        console.log(`  Would create user: ${sub.customerEmail} (${sub.status})`);
        stats.usersCreated++;
      } else {
        // Create auth user
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: sub.customerEmail,
          password: generatePassword(),
          email_confirm: true,
          user_metadata: {
            migrated_from_stripe: true,
          },
        });

        if (authError) {
          if (!authError.message?.includes('already been registered')) {
            console.error(`  Error creating ${sub.customerEmail}:`, authError.message);
            continue;
          }
          // User exists in auth but not profiles - skip
          continue;
        }

        if (!authUser.user) continue;

        // Update profile
        await supabase
          .from('profiles')
          .update({
            stripe_customer_id: sub.customerId,
            created_at: sub.created.toISOString(),
          })
          .eq('id', authUser.user.id);

        profile = { id: authUser.user.id, email: sub.customerEmail, stripe_customer_id: sub.customerId };
        emailToProfile.set(sub.customerEmail, profile);
        stats.usersCreated++;
        console.log(`  Created user: ${sub.customerEmail}`);
      }
    } else if (!profile.stripe_customer_id) {
      // Update existing user with Stripe customer ID
      if (!DRY_RUN) {
        await supabase
          .from('profiles')
          .update({ stripe_customer_id: sub.customerId })
          .eq('id', profile.id);
      }
      stats.usersUpdated++;
    }

    if (!profile) continue;

    // Create/update subscription record
    if (DRY_RUN) {
      console.log(`  Would create subscription record for ${sub.customerEmail}: ${sub.status} (${sub.plan} @ $${(sub.amount / 100).toFixed(2)})`);
    } else {
      const { error: subError } = await supabase
        .from('subscription_records')
        .upsert({
          user_id: profile.id,
          source: 'stripe',
          external_id: sub.stripeSubscriptionId,
          status: sub.status === 'active' ? 'active' : 'canceled',
          plan: sub.plan,
          current_period_start: sub.currentPeriodStart.toISOString(),
          current_period_end: sub.currentPeriodEnd.toISOString(),
          created_at: sub.created.toISOString(),
        }, {
          onConflict: 'user_id,source',
          ignoreDuplicates: false,
        });

      if (subError) {
        console.warn(`  Warning: subscription record for ${sub.customerEmail}:`, subError.message);
      }
    }
    stats.subscriptionRecordsCreated++;

    // NOTE: We do NOT update entitlements for existing users here.
    // Users imported from GHL are active. Only NEW users created from
    // Stripe (not in GHL) get canceled entitlements - handled in charge import below.

    // Rate limiting
    await new Promise(r => setTimeout(r, 50));
  }

  // Now fetch and import ALL charges
  console.log('\n--- Importing Revenue from Charges ---\n');
  const charges = await fetchAllCharges();

  // Get existing charge IDs to avoid duplicates
  const { data: existingCharges } = await supabase
    .from('revenue_ledger')
    .select('external_id')
    .eq('source', 'stripe');

  const existingChargeIds = new Set(existingCharges?.map(r => r.external_id) || []);

  for (const charge of charges) {
    if (existingChargeIds.has(charge.chargeId)) continue;

    // Find or create user
    let profile = emailToProfile.get(charge.customerEmail);

    if (!profile) {
      // Create user for this Stripe customer (marked as canceled since not in GHL)
      if (DRY_RUN) {
        console.log(`  Would create user from charge (canceled): ${charge.customerEmail}`);
        stats.usersCreated++;
        stats.entitlementsUpdated++;
        // Create a fake profile for tracking in dry run
        profile = { id: 'dry-run-' + charge.customerId, email: charge.customerEmail, stripe_customer_id: charge.customerId };
        emailToProfile.set(charge.customerEmail, profile);
      } else {
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: charge.customerEmail,
          password: generatePassword(),
          email_confirm: true,
          user_metadata: {
            migrated_from_stripe: true,
          },
        });

        if (authError) {
          if (!authError.message?.includes('already been registered')) {
            console.error(`  Error creating ${charge.customerEmail}:`, authError.message);
            continue;
          }
          continue;
        }

        if (!authUser.user) continue;

        // Update profile with Stripe customer ID and backdate created_at
        await supabase
          .from('profiles')
          .update({
            stripe_customer_id: charge.customerId,
            created_at: charge.created.toISOString(),
          })
          .eq('id', authUser.user.id);

        // Create entitlement as CANCELED (not in GHL = churned user)
        await supabase
          .from('entitlements')
          .upsert({
            user_id: authUser.user.id,
            plan: 'individual',
            status: 'canceled',
            current_period_start: charge.created.toISOString(),
          }, { onConflict: 'user_id' });

        profile = { id: authUser.user.id, email: charge.customerEmail, stripe_customer_id: charge.customerId };
        emailToProfile.set(charge.customerEmail, profile);
        stats.usersCreated++;
        stats.entitlementsUpdated++;
        console.log(`  Created user from charge (canceled): ${charge.customerEmail}`);
      }
    }

    if (!profile) continue;

    if (DRY_RUN) {
      stats.revenueEntriesCreated++;
      stats.revenueAmount += charge.amount;
      continue;
    }

    const { error: revError } = await supabase
      .from('revenue_ledger')
      .insert({
        user_id: profile.id,
        source: 'stripe',
        platform: 'unknown',
        product_type: 'subscription',
        plan: 'individual',
        status: 'completed',
        amount_cents: charge.amount,
        currency: charge.currency.toUpperCase(),
        external_id: charge.chargeId,
        occurred_at: charge.created.toISOString(),
        metadata: { imported_from: 'stripe_legacy', description: charge.description },
      });

    if (!revError) {
      stats.revenueEntriesCreated++;
      stats.revenueAmount += charge.amount;
      existingChargeIds.add(charge.chargeId);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Complete');
  console.log('='.repeat(60));
  console.log(`Users created: ${stats.usersCreated}`);
  console.log(`Users updated (added Stripe ID): ${stats.usersUpdated}`);
  console.log(`Subscription records: ${stats.subscriptionRecordsCreated}`);
  console.log(`Entitlements updated to canceled: ${stats.entitlementsUpdated}`);
  console.log(`Revenue entries created: ${stats.revenueEntriesCreated}`);
  console.log(`Total revenue imported: $${(stats.revenueAmount / 100).toFixed(2)}`);
}

main().catch(console.error);
