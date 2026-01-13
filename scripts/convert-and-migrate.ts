import { createClient } from '@supabase/supabase-js';
import Mux from '@mux/mux-node';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { execSync } from 'child_process';
import 'dotenv/config';

// --- Configuration ---
const CSV_FILE_PATH = path.join(__dirname, '../docs/Bob University - GHL Video URLs  - Sheet1.csv');
const TEMP_DIR = path.join(__dirname, '../temp_videos');

// Supabase Setup
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

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR);
}

async function convertAndMigrate() {
  console.log('Starting HLS -> MP4 -> Mux Migration...');
  
  const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
  const records = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true });

  // Filter for m3u8 links
  const targetVideos = records.filter((r: any) => r['Video Link'].includes('.m3u8'));
  console.log(`Found ${targetVideos.length} HLS videos to process.`);

  for (const record of targetVideos) {
    const title = record['Course Name'];
    const url = record['Video Link'];
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const localMp4Path = path.join(TEMP_DIR, `${safeTitle}.mp4`);
    
    console.log(`\nProcessing: ${title}`);

    // 1. Check if already uploaded (skip if Mux ID exists in DB)
    // We need to look up module ID first to find video row
    const moduleTitle = record.Module;
    const { data: moduleData } = await supabase.from('modules').select('id').eq('title', moduleTitle).single();
    if (!moduleData) {
      console.error(`  - Module not found: ${moduleTitle}`);
      continue;
    }
    
    // Check video
    const { data: videoRow } = await supabase
      .from('videos')
      .select('id, mux_asset_id')
      .eq('module_id', moduleData.id)
      .eq('title', title)
      .single();

    if (videoRow?.mux_asset_id) {
       console.log(`  - Video already has Mux ID (${videoRow.mux_asset_id}). checking logic...`);
       // If it has ID, verify it didn't error? Mux API check?
       // The previous script might have failed to upload but NOT saved ID, or saved ID of errored asset?
       // Let's assume if it's in DB, we check its status in Mux?
       try {
         const asset = await mux.video.assets.retrieve(videoRow.mux_asset_id);
         if (asset.status === 'errored') {
            console.log(`  - Existing asset is ERRORED. Re-processing.`);
         } else {
            console.log(`  - Asset status is ${asset.status}. Skipping.`);
            continue;
         }
       } catch (err) {
         console.log(`  - Could not retrieve asset (404?). Re-processing.`);
       }
    } else {
        console.log(`  - No Mux ID in DB. Processing.`);
    }

    // 2. Download/Convert with ffmpeg
    if (!fs.existsSync(localMp4Path)) {
        console.log(`  - Converting to MP4...`);
        try {
            // ffmpeg -i INPUT_URL -c copy -bsf:a aac_adtstoasc OUTPUT.mp4
            // Using -c copy is fastest (remuxing not transcoding).
            execSync(`ffmpeg -i "${url}" -c copy -bsf:a aac_adtstoasc -y "${localMp4Path}"`, { stdio: 'ignore' });
            console.log(`  - Conversion successful.`);
        } catch (err) {
            console.error(`  - FFmpeg failed. Attempting re-encode...`);
             // Fallback to re-encode if copy fails
             try {
               execSync(`ffmpeg -i "${url}" -c:v libx264 -c:a aac -y "${localMp4Path}"`, { stdio: 'ignore' });
             } catch (e2) {
               console.error(`  - Re-encode failed too for ${title}. Skipping.`);
               continue;
             }
        }
    } else {
        console.log(`  - Local MP4 exists. Using it.`);
    }

    // 3. Upload to Mux via Local File
    console.log(`  - Uploading to Mux...`);
    try {
        const upload = await mux.video.uploads.create({
            new_asset_settings: {
                playback_policy: ['public'],
                passthrough: `${moduleData.id}_${title}`,
                // inputs: we can't do local file upload via this SDK method directly?
                // Wait, Mux Node SDK `uplods.create` gives a signed URL for us to PUT to.
                // OR `assets.create` takes a URL.
                // We don't have a public URL for our local file.
                // We must use direct upload: (1) create upload url (2) PUT file (3) Mux creates asset.
            },
            cors_origin: '*', 
        });

        const uploadUrl = upload.url;
        const uploadId = upload.id;

        // streaming upload using axios or fetch? or fs read stream
        // Need to PUT the file content.
        const fileStats = fs.statSync(localMp4Path);
        // Using fetch to PUT
        const fileBuffer = fs.readFileSync(localMp4Path);
        const putRes = await fetch(uploadUrl, { method: 'PUT', body: fileBuffer });
        
        if (!putRes.ok) {
            console.error(`  - PUT failed: ${putRes.statusText}`);
            continue;
        }

        console.log(`  - Upload complete. Waiting for Asset ID...`);
        
        // Poll for asset ID
        let assetId = null;
        for (let i = 0; i < 20; i++) { // wait up to 20s
            await new Promise(r => setTimeout(r, 1000));
            const updatedUpload = await mux.video.uploads.retrieve(uploadId);
            if (updatedUpload.asset_id) {
                assetId = updatedUpload.asset_id;
                break;
            }
        }

        if (!assetId) {
            console.error(`  - Timed out waiting for Asset ID.`);
            continue;
        }

        console.log(`  - Asset Created: ${assetId}`);

        // 4. Update Supabase
        const asset = await mux.video.assets.retrieve(assetId);
        const playbackId = asset.playback_ids?.[0]?.id;

        const { error: updateError } = await supabase
            .from('videos')
            .update({ mux_asset_id: assetId, mux_playback_id: playbackId })
            .eq('id', videoRow?.id || '00000000-0000-0000-0000-000000000000') // Safety fallback logic
            .eq('module_id', moduleData.id)
            .eq('title', title); // safer
        
        if (updateError) console.error(`  - DB Update Error:`, updateError);
        else console.log(`  - DB Updated.`);

        // 5. Cleanup
        fs.unlinkSync(localMp4Path);
        
    } catch (muxErr) {
        console.error(`  - Mux Error:`, muxErr);
    }
  }
}

convertAndMigrate();
