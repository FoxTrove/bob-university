
import { createClient } from '@supabase/supabase-js';
import Mux from '@mux/mux-node';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const muxTokenId = process.env.MUX_TOKEN_ID;
const muxTokenSecret = process.env.MUX_TOKEN_SECRET;

if (!supabaseUrl || !supabaseServiceKey || !muxTokenId || !muxTokenSecret) {
  console.error('Missing environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const mux = new Mux({ tokenId: muxTokenId, tokenSecret: muxTokenSecret });

async function syncMuxData() {
  console.log('Syncing Mux data...');

  const { data: libraryItems, error } = await supabase
    .from('video_library')
    .select('*')
    .is('duration_seconds', null);

  if (error) {
    console.error('Error fetching library items:', error);
    return;
  }

  console.log(`Found ${libraryItems.length} items with missing duration.`);

  for (const item of libraryItems) {
      if (!item.mux_asset_id) continue;

      try {
          const asset = await mux.video.assets.retrieve(item.mux_asset_id);
          
          if (asset) {
              const updates: any = {};
              if (asset.duration) {
                  updates.duration_seconds = Math.round(asset.duration);
              }
              if (asset.max_stored_resolution === 'HH') {
                   // Just example logic, mostly we want duration
              }
              
              if (Object.keys(updates).length > 0) {
                  const { error: updateError } = await supabase
                    .from('video_library')
                    .update(updates)
                    .eq('id', item.id);
                  
                  if (updateError) {
                      console.error(`Failed to update DB for ${item.title}:`, updateError.message);
                  } else {
                      console.log(`Updated ${item.title} (${item.id}): Duration ${updates.duration_seconds}`);
                  }
              }
          }
      } catch (err) {
          console.error(`Failed to sync ${item.title} (${item.mux_asset_id}):`, err.message);
      }
      // Rate limit safety
      await new Promise(resolve => setTimeout(resolve, 200)); 
  }
}

syncMuxData();
