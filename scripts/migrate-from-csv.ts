import { createClient } from '@supabase/supabase-js';
import Mux from '@mux/mux-node';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import 'dotenv/config';

// --- Configuration ---
const CSV_FILE_PATH = path.join(__dirname, '../docs/Bob University - GHL Video URLs  - Sheet1.csv');
const DRY_RUN = process.env.DRY_RUN === 'true'; // Set to false to actually run

// Supabase Setup
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Mux Setup
const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
  console.error('Missing required environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const mux = new Mux({ tokenId: MUX_TOKEN_ID, tokenSecret: MUX_TOKEN_SECRET });

// --- Types ---
interface CsvRow {
  Module: string;
  Order: string;
  'Course Name': string; // This maps to Lesson Title
  'Video Link': string;
  Description: string;
  Transcript: string;
  'AI Description': string;
}

// --- Main ---
async function main() {
  console.log(`Starting Migration Script... (Dry Run: ${DRY_RUN})`);

  // 1. Parse CSV
  const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
  const records: CsvRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`Found ${records.length} records in CSV.`);

  // 2. Pre-process to group by Module
  // We need to upsert modules first to get IDs, then videos.
  
  // Helper to normalize strings
  const cleanStr = (s: string) => s?.trim() || '';

  let currentModuleOrder = 0;
  
  for (const record of records) {
    const moduleTitle = cleanStr(record.Module);
    const lessonTitle = cleanStr(record['Course Name']);
    const videoUrl = cleanStr(record['Video Link']);
    const description = cleanStr(record.Description);
    const orderRaw = parseInt(record.Order, 10);
    const lessonOrder = isNaN(orderRaw) ? 0 : orderRaw;

    if (!moduleTitle || !lessonTitle) {
      console.warn(`Skipping invalid row: Module="${moduleTitle}", Lesson="${lessonTitle}"`);
      continue;
    }

    console.log(`Processing: [${moduleTitle}] ${lessonTitle}`);

    if (DRY_RUN) continue;

    // --- A. Upsert Module ---
    // We assume module order matches CSV appearance implicitly if not specified? 
    // The CSV has 'Order' for lessons, but not for modules explicitly.
    // simpler to just query by title.
    
    // Check if module exists or upsert
    // Note: To preserve module order, we might need to track unique modules seen
    const { data: moduleData, error: modError } = await supabase
      .from('modules')
      .select('id')
      .eq('title', moduleTitle)
      .single();
    
    let moduleId: string;

    if (moduleData) {
      moduleId = moduleData.id;
    } else {
      // Create new module
      // We'll roughly guess sort_order by when we encounter it first?
      // Or we can just set it to 0 and fix later manually.
      // Let's increment a processed module counter.
      const { data: newMod, error: createError } = await supabase
        .from('modules')
        .insert({
          title: moduleTitle,
          is_published: true,
          sort_order: currentModuleOrder++, // Simple increment
        })
        .select()
        .single();
      
      if (createError) {
        // If it failed cleanly (e.g. race condition), try fetch again
        console.error(`Error creating module ${moduleTitle}:`, createError);
        continue;
      }
      moduleId = newMod.id;
    }

    // --- B. Handle Video (Mux) ---
    let muxAssetId: string | null = null;
    let muxPlaybackId: string | null = null;

    if (videoUrl && (videoUrl.includes('.mp4') || videoUrl.includes('.m3u8'))) {
       // Check if we already have this video in Supabase with Mux ID?
       // Or simpler: Check if we have an asset in Mux with this "passthrough_id" (using URL as ID?)
       // Using URL as passthrough_id is risky if URL changes.
       // Let's optimize: Check local DB first.
       
       const { data: existingVideo } = await supabase
         .from('videos')
         .select('mux_asset_id, mux_playback_id')
         .eq('module_id', moduleId)
         .eq('title', lessonTitle)
         .single();
       
       if (existingVideo?.mux_asset_id) {
         console.log(`  - Video already exists in DB (Mux ID: ${existingVideo.mux_asset_id})`);
         muxAssetId = existingVideo.mux_asset_id;
         muxPlaybackId = existingVideo.mux_playback_id;
       } else {
         // Upload to Mux
         console.log(`  - Uploading to Mux: ${videoUrl}`);
         try {
           const asset = await mux.video.assets.create({
             inputs: [{ url: videoUrl }],
             playback_policy: ['public'],
             passthrough: `${moduleId}_${lessonTitle}`, // Tracking
           });
           
           muxAssetId = asset.id;
           muxPlaybackId = asset.playback_ids?.[0]?.id || null;
           console.log(`    -> Created Asset: ${muxAssetId}`);

           // Note: Asset is processing. We store the IDs now.
         } catch (err) {
           console.error('    Mux Upload Error:', err);
         }
       }
    } else {
      console.warn(`  - No valid video URL for ${lessonTitle}`);
    }

    // --- C. Upsert Video Row in Supabase ---
    // Handle explicit check because we lack a unique constraint on (module_id, title)
    const { data: existingVideoRow } = await supabase
      .from('videos')
      .select('id')
      .eq('module_id', moduleId)
      .eq('title', lessonTitle)
      .single();

    if (existingVideoRow) {
      // Update
      const { error: updateError } = await supabase
        .from('videos')
        .update({
          description: description,
          video_url: videoUrl,
          sort_order: lessonOrder,
          is_published: true,
          // Only update Mux IDs if we have new ones (preserve existing if script re-runs without upload)
          ...(muxAssetId ? { mux_asset_id: muxAssetId, mux_playback_id: muxPlaybackId } : {})
        })
        .eq('id', existingVideoRow.id);
      
      if (updateError) console.error(`    Error updating video ${lessonTitle}:`, updateError);
      else console.log(`    -> Updated Video: ${lessonTitle}`);

    } else {
      // Insert
      const { error: insertError } = await supabase
        .from('videos')
        .insert({
          module_id: moduleId,
          title: lessonTitle,
          description: description,
          video_url: videoUrl,
          sort_order: lessonOrder,
          is_published: true,
          mux_asset_id: muxAssetId,
          mux_playback_id: muxPlaybackId,
        });

      if (insertError) console.error(`    Error inserting video ${lessonTitle}:`, insertError);
      else console.log(`    -> Inserted Video: ${lessonTitle}`);
    }
  }

  console.log('Migration Complete.');
}

main();
