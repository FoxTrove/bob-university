
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseLibrary() {
  console.log('Diagnosing video_library table...');

  // Fetch all rows
  const { data, error } = await supabase
    .from('video_library')
    .select('*');

  if (error) {
    console.error('Error fetching data:', error);
    return;
  }

  console.log(`Found ${data.length} records in video_library.`);

  let missingPlaybackId = 0;
  let missingThumbnail = 0;
  let hasBoth = 0;

  data.forEach((item, index) => {
    const hasPid = !!item.mux_playback_id;
    const hasThumb = !!item.thumbnail_url;

    if (!hasPid) missingPlaybackId++;
    if (!hasThumb) missingThumbnail++;
    if (hasPid && hasThumb) hasBoth++;

    if (index < 5) {
       console.log(`[Item ${index}] ID: ${item.id}`);
       console.log(`   Title: ${item.title}`);
       console.log(`   Mux Asset ID: ${item.mux_asset_id}`);
       console.log(`   Mux Playback ID: ${item.mux_playback_id} ${hasPid ? 'OK' : 'MISSING'}`);
       console.log(`   Thumbnail URL: ${item.thumbnail_url}`);
       console.log('---');
    }
  });

  console.log('--- SUGGESTED DIAGNOSIS ---');
  console.log(`Total Records: ${data.length}`);
  console.log(`Missing Playback ID: ${missingPlaybackId}`);
  console.log(`Missing Thumbnail URL: ${missingThumbnail}`);
  
  if (missingPlaybackId > 0) {
      console.log('ROOT CAUSE: Many records are missing mux_playback_id, so the fallback image generation cannot work.');
  }
}

diagnoseLibrary();
