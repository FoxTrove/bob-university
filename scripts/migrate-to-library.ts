
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from admin/.env.local
dotenv.config({ path: path.resolve(__dirname, '../admin/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in admin/.env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateData() {
  console.log('Starting migration to video_library...');

  // 1. Fetch all existing videos that have a Mux Asset ID
  const { data: videos, error: fetchError } = await supabase
    .from('videos')
    .select('*')
    .not('mux_asset_id', 'is', null);

  if (fetchError) {
    console.error('Error fetching videos:', fetchError);
    process.exit(1);
  }

  console.log(`Found ${videos.length} videos to migrate.`);

  for (const video of videos) {
    console.log(`Processing video: ${video.title} (${video.mux_asset_id})`);

    // Check if asset already exists in library (by mux_asset_id)
    const { data: existingLibItem } = await supabase
        .from('video_library')
        .select('id')
        .eq('mux_asset_id', video.mux_asset_id)
        .single();
    
    let libraryId = existingLibItem?.id;

    if (!libraryId) {
        // Create new library item
        const { data: newLibItem, error: insertError } = await supabase
        .from('video_library')
        .insert({
            title: video.title, // Use lesson title as initial library title
            filename: `migrated-${video.id}`, // Placeholder or original if we had it
            mux_asset_id: video.mux_asset_id,
            mux_playback_id: video.mux_playback_id,
            duration_seconds: video.duration_seconds,
            thumbnail_url: video.thumbnail_url
        })
        .select('id')
        .single();

        if (insertError) {
            console.error(`Failed to create library item for video ${video.id}:`, insertError);
            continue;
        }
        libraryId = newLibItem.id;
        console.log(`Created new library item: ${libraryId}`);
    } else {
        console.log(`Library item already exists: ${libraryId}`);
    }

    // Link the lesson (video row) to the library item
    const { error: updateError } = await supabase
        .from('videos')
        .update({ video_library_id: libraryId })
        .eq('id', video.id);

    if (updateError) {
        console.error(`Failed to link video ${video.id} to library item:`, updateError);
    } else {
        console.log(`Linked video ${video.id} to library item ${libraryId}`);
    }
  }

  console.log('Migration complete.');
}

migrateData();
