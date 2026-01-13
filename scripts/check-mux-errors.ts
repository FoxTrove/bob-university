import { createClient } from '@supabase/supabase-js';
import Mux from '@mux/mux-node';
import 'dotenv/config';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const mux = new Mux({ tokenId: MUX_TOKEN_ID, tokenSecret: MUX_TOKEN_SECRET });

async function checkErrors() {
  console.log('Fetching Errored Assets from Mux...');
  
  const erroredAssets = [];
  try {
      // List all assets and filter? Or use params?
      // Mux list params don't support status filter directly in all SDK versions, but let's try or iterate.
      // Iterating recent assets.
      for await (const asset of mux.video.assets.list({ limit: 100 })) {
          if (asset.status === 'errored') {
              erroredAssets.push(asset);
          }
      }
  } catch (err) {
      console.error('Mux API Error:', err);
      return;
  }

  console.log(`Found ${erroredAssets.length} errored assets in Mux.`);

  if (erroredAssets.length === 0) return;

  // Check DB references
  const assetIds = erroredAssets.map(a => a.id);
  const { data: dbMatches, error } = await supabase
    .from('videos')
    .select('title, mux_asset_id')
    .in('mux_asset_id', assetIds);
  
  if (error) {
      console.error('DB Error:', error);
      return;
  }

  const linkedIds = new Set(dbMatches?.map(v => v.mux_asset_id));

  console.log('\n--- ANALYSIS ---');
  let staleCount = 0;
  let activeErrorCount = 0;

  for (const asset of erroredAssets) {
      if (linkedIds.has(asset.id)) {
          const video = dbMatches?.find(v => v.mux_asset_id === asset.id);
          console.log(`[ACTIVE ERROR] Asset ${asset.id} is linked to "${video?.title}"`);
          activeErrorCount++;
      } else {
          console.log(`[STALE] Asset ${asset.id} is NOT in DB. (Safe to delete)`);
          staleCount++;
      }
  }

  console.log(`\nSummary:`);
  console.log(`- Active Errors (Broken Videos): ${activeErrorCount}`);
  console.log(`- Stale Errors (Can be deleted): ${staleCount}`);
}

checkErrors();
