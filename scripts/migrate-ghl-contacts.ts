/**
 * GHL Contact Migration Script
 *
 * Pulls all contacts from GoHighLevel and creates Supabase accounts.
 * Paying members (tagged "current bob u member") get premium entitlements.
 *
 * Usage:
 *   npx ts-node scripts/migrate-ghl-contacts.ts [--dry-run] [--limit=N]
 *
 * Options:
 *   --dry-run   Preview what would be created without making changes
 *   --limit=N   Only process first N contacts (for testing)
 */

import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

// Configuration
const GHL_API_KEY = process.env.GOHIGHLEVEL_API_KEY;
const GHL_LOCATION_ID = process.env.GOHIGHLEVEL_LOCATION_ID || '3VpW3RGls3jMqf7MzgBK';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const PAYING_MEMBER_TAG = 'current bob u member';

// Parse command line args
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const PAYING_ONLY = args.includes('--paying-only');
const limitArg = args.find(a => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1]) : undefined;

interface GHLContact {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  tags?: string[];
  customFields?: Array<{ id: string; key: string; value: string }>;
  address1?: string;
  city?: string;
  state?: string;
  country?: string;
  companyName?: string;
  dateAdded?: string;
}

interface MigrationResult {
  total: number;
  created: number;
  skipped: number;
  errors: number;
  paying_members: number;
  details: Array<{
    email: string;
    status: 'created' | 'skipped' | 'error';
    reason?: string;
    is_paying: boolean;
  }>;
}

// Validate config
function validateConfig() {
  const missing: string[] = [];
  if (!GHL_API_KEY) missing.push('GOHIGHLEVEL_API_KEY');
  if (!SUPABASE_URL) missing.push('SUPABASE_URL or EXPO_PUBLIC_SUPABASE_URL');
  if (!SUPABASE_SERVICE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');

  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing.join(', '));
    console.error('Add them to your .env file');
    process.exit(1);
  }
}

// Fetch all contacts from GHL with pagination
async function fetchAllGHLContacts(): Promise<GHLContact[]> {
  const contacts: GHLContact[] = [];
  const seenIds = new Set<string>();
  let hasMore = true;
  let startAfter: number | undefined;
  let startAfterId: string | undefined;
  let page = 1;
  const MAX_PAGES = 15; // Safety limit: 15 pages * 100 = 1500 max contacts

  console.log('Fetching contacts from GHL...');

  while (hasMore && page <= MAX_PAGES) {
    const url = new URL(`${GHL_API_BASE}/contacts/`);
    url.searchParams.set('locationId', GHL_LOCATION_ID);
    url.searchParams.set('limit', '100');
    // GHL requires BOTH startAfter (timestamp) and startAfterId for pagination
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

      // Filter out duplicates
      let newContacts = 0;
      for (const contact of batch) {
        if (!seenIds.has(contact.id)) {
          seenIds.add(contact.id);
          contacts.push(contact);
          newContacts++;
        }
      }

      console.log(`  Page ${page}: fetched ${batch.length} contacts, ${newContacts} new (total: ${contacts.length}/${meta.total || '?'})`);

      // Check for more pages
      if (batch.length < 100 || newContacts === 0 || !meta.nextPage || (LIMIT && contacts.length >= LIMIT)) {
        hasMore = false;
      } else {
        // Use meta pagination cursors
        startAfter = meta.startAfter;
        startAfterId = meta.startAfterId;
        if (!startAfter || !startAfterId) {
          hasMore = false;
        }
      }
      page++;

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 250));
    } catch (error: any) {
      console.error('Error fetching contacts:', error.response?.data || error.message);
      hasMore = false;
    }
  }

  if (page > MAX_PAGES) {
    console.log(`  Warning: Stopped at page limit (${MAX_PAGES}). There may be more contacts.`);
  }

  return LIMIT ? contacts.slice(0, LIMIT) : contacts;
}

// Check if contact is a paying member
function isPayingMember(contact: GHLContact): boolean {
  if (!contact.tags) return false;
  return contact.tags.some(tag =>
    tag.toLowerCase() === PAYING_MEMBER_TAG.toLowerCase()
  );
}

// Extract name parts
function extractName(contact: GHLContact): { firstName: string; lastName: string; fullName: string } {
  let firstName = contact.firstName || '';
  let lastName = contact.lastName || '';

  if (!firstName && !lastName && contact.name) {
    const parts = contact.name.trim().split(' ');
    firstName = parts[0] || '';
    lastName = parts.slice(1).join(' ') || '';
  }

  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  return { firstName, lastName, fullName };
}

// Generate a secure random password
function generatePassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 24; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}

// Main migration function
async function migrateContacts(): Promise<MigrationResult> {
  validateConfig();

  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const result: MigrationResult = {
    total: 0,
    created: 0,
    skipped: 0,
    errors: 0,
    paying_members: 0,
    details: [],
  };

  // Fetch contacts from GHL
  const contacts = await fetchAllGHLContacts();
  result.total = contacts.length;

  console.log(`\nProcessing ${contacts.length} contacts...`);
  if (DRY_RUN) {
    console.log('DRY RUN MODE - No changes will be made\n');
  }

  // Get existing users to avoid duplicates
  const { data: existingProfiles } = await supabase
    .from('profiles')
    .select('email, ghl_contact_id');

  const existingEmails = new Set(existingProfiles?.map(p => p.email?.toLowerCase()) || []);
  const existingGhlIds = new Set(existingProfiles?.map(p => p.ghl_contact_id) || []);

  // Get the default subscription plan for paying members
  const { data: plans } = await supabase
    .from('subscription_plans')
    .select('id, plan')
    .eq('is_active', true)
    .order('amount_cents', { ascending: true });

  const individualPlan = plans?.find(p => p.plan === 'individual');

  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];
    const isPaying = isPayingMember(contact);

    if (isPaying) result.paying_members++;

    // Skip non-paying members if --paying-only flag is set
    if (PAYING_ONLY && !isPaying) {
      continue; // Don't count as skipped, just filter them out
    }

    // Skip if no email
    if (!contact.email) {
      result.skipped++;
      result.details.push({
        email: `(no email) ${contact.id}`,
        status: 'skipped',
        reason: 'No email address',
        is_paying: isPaying,
      });
      continue;
    }

    const email = contact.email.toLowerCase().trim();

    // Skip if already exists
    if (existingEmails.has(email) || existingGhlIds.has(contact.id)) {
      result.skipped++;
      result.details.push({
        email,
        status: 'skipped',
        reason: 'Already exists',
        is_paying: isPaying,
      });
      continue;
    }

    const { firstName, lastName, fullName } = extractName(contact);

    if (DRY_RUN) {
      result.created++;
      result.details.push({
        email,
        status: 'created',
        reason: `Would create${isPaying ? ' (PREMIUM)' : ''}`,
        is_paying: isPaying,
      });
      continue;
    }

    try {
      // Create auth user with a random password (they'll use magic link to login)
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: generatePassword(),
        email_confirm: true, // Pre-confirm so magic link works
        user_metadata: {
          full_name: fullName,
          ghl_contact_id: contact.id,
          migrated_from_ghl: true,
        },
      });

      if (authError) {
        // Check if user already exists in auth
        if (authError.message?.includes('already been registered')) {
          result.skipped++;
          result.details.push({
            email,
            status: 'skipped',
            reason: 'Auth user exists',
            is_paying: isPaying,
          });
          continue;
        }
        throw authError;
      }

      if (!authUser.user) {
        throw new Error('No user returned from createUser');
      }

      // Update profile with GHL data (only columns that exist in the schema)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName || null,
          ghl_contact_id: contact.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authUser.user.id);

      if (profileError) {
        console.warn(`  Warning: Could not update profile for ${email}:`, profileError.message);
      }

      // Create entitlement for paying members
      if (isPaying && individualPlan) {
        const { error: entitlementError } = await supabase
          .from('entitlements')
          .upsert({
            user_id: authUser.user.id,
            plan: 'individual',
            status: 'active',
            current_period_start: new Date().toISOString(),
            // No end date - they'll be migrated to proper billing
          }, {
            onConflict: 'user_id',
          });

        if (entitlementError) {
          console.warn(`  Warning: Could not create entitlement for ${email}:`, entitlementError.message);
        }
      }

      result.created++;
      result.details.push({
        email,
        status: 'created',
        is_paying: isPaying,
      });

      // Progress update
      if ((i + 1) % 50 === 0) {
        console.log(`  Progress: ${i + 1}/${contacts.length}`);
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error: any) {
      result.errors++;
      result.details.push({
        email,
        status: 'error',
        reason: error.message,
        is_paying: isPaying,
      });
      console.error(`  Error creating ${email}:`, error.message);
    }
  }

  return result;
}

// Run migration
async function main() {
  console.log('='.repeat(60));
  console.log('GHL Contact Migration');
  console.log('='.repeat(60));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  if (PAYING_ONLY) console.log(`Filter: PAYING MEMBERS ONLY`);
  if (LIMIT) console.log(`Limit: ${LIMIT} contacts`);
  console.log('');

  const startTime = Date.now();
  const result = await migrateContacts();
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n' + '='.repeat(60));
  console.log('Migration Complete');
  console.log('='.repeat(60));
  console.log(`Total contacts:    ${result.total}`);
  console.log(`Created:           ${result.created}`);
  console.log(`Skipped:           ${result.skipped}`);
  console.log(`Errors:            ${result.errors}`);
  console.log(`Paying members:    ${result.paying_members}`);
  console.log(`Duration:          ${duration}s`);

  // Save detailed results
  const outputPath = path.join(__dirname, '../data/migration-results.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`\nDetailed results saved to: ${outputPath}`);

  // Show paying members
  const payingCreated = result.details.filter(d => d.is_paying && d.status === 'created');
  if (payingCreated.length > 0) {
    console.log(`\nPaying members ${DRY_RUN ? 'to be ' : ''}created:`);
    payingCreated.slice(0, 10).forEach(d => console.log(`  - ${d.email}`));
    if (payingCreated.length > 10) {
      console.log(`  ... and ${payingCreated.length - 10} more`);
    }
  }

  // Show errors if any
  const errors = result.details.filter(d => d.status === 'error');
  if (errors.length > 0) {
    console.log(`\nErrors:`);
    errors.slice(0, 5).forEach(d => console.log(`  - ${d.email}: ${d.reason}`));
    if (errors.length > 5) {
      console.log(`  ... and ${errors.length - 5} more`);
    }
  }
}

main().catch(console.error);
