import { createClient } from '@supabase/supabase-js';
import Mux from '@mux/mux-node';
import 'dotenv/config';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID!;
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const mux = new Mux({ tokenId: MUX_TOKEN_ID, tokenSecret: MUX_TOKEN_SECRET });

async function recoverAndFix() {
  console.log('Fetching ALL assets from Mux...');
  
  const updates = [];
  let totalScanned = 0;
  
  try {
      // Using the async iterator which handles pagination automatically
      for await (const asset of mux.video.assets.list()) {
          totalScanned++;
          if (asset.status === 'ready' && asset.passthrough) {
              // Standard format is UUID_Title (UUID is 36 chars)
              // Example: c71a..._Title
              
              if (asset.passthrough.length > 37) {
                  const moduleId = asset.passthrough.substring(0, 36);
                  const title = asset.passthrough.substring(37);
                  
                  // Only push if valid UUID-like prefix
                  if (moduleId.length === 36) {
                    updates.push({
                        title,
                        moduleId,
                        assetId: asset.id,
                        playbackId: asset.playback_ids?.[0]?.id
                    });
                  }
              }
          }
      }
      console.log(`Scanned ${totalScanned} total assets.`);
  } catch (err) {
      console.error('Mux API Error:', err);
      return;
  }

  console.log(`Found ${updates.length} potential matches in Mux.`);

  let updatedCount = 0;
  
  for (const item of updates) {
      // Check if DB needs update
      // Logic: If DB has DIFFERENT asset ID or NULL, update it.
      
      const { data: video } = await supabase
        .from('videos')
        .select('id, mux_asset_id')
        .eq('module_id', item.moduleId)
        .eq('title', item.title)
        .single();
      
      if (video) {
          if (video.mux_asset_id !== item.assetId) {
              console.log(`Addressing [${item.title}]:`);
              console.log(`   Old ID: ${video.mux_asset_id}`);
              console.log(`   New ID: ${item.assetId}`);
              
              const { error } = await supabase
                .from('videos')
                .update({ 
                    mux_asset_id: item.assetId,
                     mux_playback_id: item.playbackId 
                })
                .eq('id', video.id);
                
              if (!error) {
                  console.log(`   -> FIXED.`);
                  updatedCount++;
              } else {
                  console.error(`   -> Update Failed:`, error);
              }
          }
      }
  }

  console.log(`\nRecovery Complete. Updated ${updatedCount} videos.`);
}

recoverAndFix();
