import { createClient } from '@supabase/supabase-js';
import Mux from '@mux/mux-node';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { execSync } from 'child_process';
import 'dotenv/config';

// --- Configuration ---
const CSV_FILE_PATH = path.join(__dirname, '../docs/Bob University - GHL Video URLs  - Sheet1.csv');
const TEMP_DIR = path.join(__dirname, '../temp_fix');

// Supabase Setup
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

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR);
}

const TARGET_TITLES = [
    'Live #7 Concave Layering Workshop - 90 mins',
    'Live # 5 Round Graduation',
    'Live # 4 Shape Shifter Bob',
    'Grunge Bob Part 1',
    'Grunge Bob Part 2',
    'Grunge Bob Part 3',
    'Grunge Bob Part 4'
];

async function fixBrokenVideos() {
  console.log(`Starting Fix for ${TARGET_TITLES.length} videos...`);
  
  const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
  const records = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true });

  const targets = records.filter((r: any) => TARGET_TITLES.includes(r['Course Name']));
  console.log(`Found ${targets.length} matching rows in CSV.`);

  for (const record of targets) {
    const title = record['Course Name'];
    let url = record['Video Link'];
    
    // Handle Google Drive Links
    if (url.includes('drive.google.com')) {
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        url = `https://drive.google.com/uc?export=download&id=${match[1]}`;
        console.log(`  - Converted Google Drive Link: ${url}`);
      }
    }

    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const localMp4Path = path.join(TEMP_DIR, `${safeTitle}.mp4`);
    
    console.log(`\nProcessing: ${title}`);
    console.log(`  - URL: ${url}`);

    // Verify DB linkage first
    const moduleTitle = record.Module;
    const { data: moduleData } = await supabase.from('modules').select('id').eq('title', moduleTitle).single();
    if (!moduleData) {
       console.error(`  - Module not found: ${moduleTitle}`);
       continue;
    }

    const { data: videoRow } = await supabase
        .from('videos')
        .select('id, mux_asset_id')
        .eq('module_id', moduleData.id)
        .eq('title', title)
        .single();
    
    // Create video row if missing (rare case for these specific ones, but good safety)
    if (!videoRow) {
         console.log(`  - Video row not found, creating placeholder...`);
         const { data: newVideo, error: createErr } = await supabase.from('videos').insert({
             module_id: moduleData.id,
             title: title,
             description: record.Description,
             video_url: url,
             is_published: true,
             sort_order: parseInt(record.Order) || 0
         }).select().single();
         if(createErr) {
             console.error(`  - Failed to create video row:`, createErr);
             continue;
         }
         // continue with newVideo...
    } else {
        console.log(`  - Found existing video row: ${videoRow.id}`);
    }

    // Always Download/Convert because we know these are broken
    if (!fs.existsSync(localMp4Path)) {
        console.log(`  - Converting/Downloading to MP4...`);
        try {
            const ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
            // Check if it's a direct mp4/download or streaming list
            let cmd = '';
            if (url.includes('drive.google.com') || url.includes('.mp4') || url.includes('export=download')) {
                 // Direct download with curl might be safer for GDrive, but ffmpeg usually handles it if redirected.
                 // Let's use curl for GDrive to be safe? ffmpeg is good.
                 cmd = `ffmpeg -user_agent "${ua}" -reconnect 1 -reconnect_at_eof 1 -reconnect_streamed 1 -reconnect_delay_max 5 -i "${url}" -c copy -y "${localMp4Path}"`;
            } else {
                 // HLS/M3U8
                 cmd = `ffmpeg -user_agent "${ua}" -reconnect 1 -reconnect_at_eof 1 -reconnect_streamed 1 -reconnect_delay_max 5 -i "${url}" -c copy -bsf:a aac_adtstoasc -y "${localMp4Path}"`;
            }
            
            execSync(cmd, { stdio: 'ignore' });
            console.log(`  - Download/Conversion successful.`);
        } catch (err) {
            console.log(`  - Copy failed, attempting re-encode...`);
            try {
                execSync(`ffmpeg -i "${url}" -c:v libx264 -c:a aac -y "${localMp4Path}"`, { stdio: 'ignore' });
                console.log(`  - Re-encode successful.`);
            } catch (e2) {
                console.error(`  - Re-encode failed. Skipping.`);
                continue;
            }
        }
    } else {
        console.log(`  - Local file found, skipping download.`);
    }

    // Upload
    console.log(`  - Uploading to Mux...`);
    try {
        const upload = await mux.video.uploads.create({
            new_asset_settings: {
                playback_policy: ['public'],
                passthrough: `${moduleData.id}_${title}`,
            },
            cors_origin: '*', 
        });

        const uploadUrl = upload.url;
        const uploadId = upload.id;

        const fileBuffer = fs.readFileSync(localMp4Path);
        const putRes = await fetch(uploadUrl, { method: 'PUT', body: fileBuffer });
        
        if (!putRes.ok) {
            console.error(`  - PUT failed: ${putRes.statusText}`);
            continue;
        }

        console.log(`  - Upload complete. Waiting for Asset ID...`);
        
        let assetId = null;
        for (let i = 0; i < 30; i++) { 
            await new Promise(r => setTimeout(r, 2000));
            const updatedUpload = await mux.video.uploads.retrieve(uploadId);
            if (updatedUpload.asset_id) {
                assetId = updatedUpload.asset_id;
                break;
            }
        }

        if (!assetId) {
            console.error(`  - Timed out getting Asset ID.`);
            continue;
        }
        console.log(`  - Asset Created: ${assetId}`);

        // Get Playback ID
        const asset = await mux.video.assets.retrieve(assetId);
        const playbackId = asset.playback_ids?.[0]?.id;

        // Update DB
        const { error: updateError } = await supabase
            .from('videos')
            .update({ mux_asset_id: assetId, mux_playback_id: playbackId })
            .eq('title', title) // update by title to be safe
            .eq('module_id', moduleData.id);
        
        if (updateError) console.error(`  - DB Update Error:`, updateError);
        else console.log(`  - DB Updated Successfully.`);

        // Cleanup
        // fs.unlinkSync(localMp4Path); // Keep for now in case we need to debug
        
    } catch (muxErr) {
        console.error(`  - Mux Error:`, muxErr);
    }
  }
}

fixBrokenVideos();
