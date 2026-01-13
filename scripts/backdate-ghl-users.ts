/**
 * Backdate GHL Users Script
 *
 * Updates profiles and entitlements to reflect actual GHL join dates
 * instead of migration date.
 *
 * Usage:
 *   npx tsx scripts/backdate-ghl-users.ts [--dry-run]
 */

import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const GHL_API_KEY = process.env.GOHIGHLEVEL_API_KEY;
const GHL_LOCATION_ID = process.env.GOHIGHLEVEL_LOCATION_ID || '3VpW3RGls3jMqf7MzgBK';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const PAYING_MEMBER_TAG = 'current bob u member';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

interface GHLContact {
  id: string;
  email?: string;
  dateAdded?: string;
  tags?: string[];
}

async function fetchPayingMembers(): Promise<Map<string, string>> {
  const contactDates = new Map<string, string>(); // ghl_contact_id -> dateAdded
  const seenIds = new Set<string>();
  let hasMore = true;
  let startAfter: number | undefined;
  let startAfterId: string | undefined;
  let page = 1;
  const MAX_PAGES = 15;

  console.log('Fetching paying members from GHL...');

  while (hasMore && page <= MAX_PAGES) {
    const url = new URL(`${GHL_API_BASE}/contacts/`);
    url.searchParams.set('locationId', GHL_LOCATION_ID);
    url.searchParams.set('limit', '100');
    if (startAfter && startAfterId) {
      url.searchParams.set('startAfter', startAfter.toString());
      url.searchParams.set('startAfterId', startAfterId);
    }

    try {
      const response = await axios.get(url.toString(), {
        headers: {
          Authorization: `Bearer ${GHL_API_KEY}`,
          Version: '2021-07-28',
          Accept: 'application/json',
        },
      });

      const data = response.data;
      const meta = data.meta || {};
      const batch: GHLContact[] = data.contacts || [];

      for (const contact of batch) {
        if (seenIds.has(contact.id)) continue;
        seenIds.add(contact.id);

        // Only include paying members
        const isPaying = contact.tags?.some(
          tag => tag.toLowerCase() === PAYING_MEMBER_TAG.toLowerCase()
        );

        if (isPaying && contact.dateAdded) {
          contactDates.set(contact.id, contact.dateAdded);
        }
      }

      console.log(`  Page ${page}: processed ${batch.length} contacts`);

      if (batch.length < 100 || !meta.nextPage) {
        hasMore = false;
      } else {
        startAfter = meta.startAfter;
        startAfterId = meta.startAfterId;
        if (!startAfter || !startAfterId) hasMore = false;
      }
      page++;

      await new Promise(resolve => setTimeout(resolve, 250));
    } catch (error: any) {
      console.error('Error fetching contacts:', error.response?.data || error.message);
      hasMore = false;
    }
  }

  console.log(`Found ${contactDates.size} paying members with dates`);
  return contactDates;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Backdate GHL Users');
  console.log('='.repeat(60));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log('');

  if (!GHL_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing required environment variables');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Fetch GHL dates
  const ghlDates = await fetchPayingMembers();

  // Get all GHL-migrated profiles
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, ghl_contact_id, created_at')
    .not('ghl_contact_id', 'is', null);

  if (error) {
    console.error('Error fetching profiles:', error.message);
    process.exit(1);
  }

  console.log(`\nProcessing ${profiles?.length || 0} profiles...`);

  let updated = 0;
  let skipped = 0;

  for (const profile of profiles || []) {
    const ghlDate = ghlDates.get(profile.ghl_contact_id);

    if (!ghlDate) {
      skipped++;
      continue;
    }

    const dateAdded = new Date(ghlDate);

    if (DRY_RUN) {
      console.log(`  Would update ${profile.email}: ${profile.created_at} -> ${ghlDate}`);
      updated++;
      continue;
    }

    // Update profile created_at
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ created_at: dateAdded.toISOString() })
      .eq('id', profile.id);

    if (profileError) {
      console.warn(`  Warning: Could not update profile for ${profile.email}:`, profileError.message);
      continue;
    }

    // Update entitlement dates
    const { error: entitlementError } = await supabase
      .from('entitlements')
      .update({
        current_period_start: dateAdded.toISOString(),
        created_at: dateAdded.toISOString(),
      })
      .eq('user_id', profile.id);

    if (entitlementError) {
      console.warn(`  Warning: Could not update entitlement for ${profile.email}:`, entitlementError.message);
    }

    updated++;

    if (updated % 50 === 0) {
      console.log(`  Progress: ${updated} updated`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Complete');
  console.log('='.repeat(60));
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped} (no GHL date found)`);
}

main().catch(console.error);
