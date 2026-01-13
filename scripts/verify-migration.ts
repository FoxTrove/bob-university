import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verify() {
  console.log('Verifying Migration Status...');

  const { data: videos, error } = await supabase
    .from('videos')
    .select('id, title, video_url, mux_asset_id')
    .order('module_id');
  
  if (error) {
    console.error('DB Error:', error);
    return;
  }

  let total = 0;
  let success = 0;
  let failed = 0;
  let skipped = 0; // No URL

  console.log('\n--- FAILED / MISSING MUX ASSETS ---');
  for (const v of videos) {
    total++;
    if (!v.video_url) {
      skipped++;
      continue;
    }

    if (v.mux_asset_id) {
      success++;
    } else {
      failed++;
      console.log(`[MISSING] ${v.title}`);
      console.log(`   URL: ${v.video_url}`);
    }
  }

  console.log('\n--- SUMMARY ---');
  console.log(`Total Videos: ${total}`);
  console.log(`Success (Mux ID present): ${success}`);
  console.log(`Failed/Missing: ${failed}`);
  console.log(`Skipped (No URL): ${skipped}`);
}

verify();
