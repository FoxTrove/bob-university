import { createClient } from '@supabase/supabase-js';
import Mux from '@mux/mux-node';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { execSync } from 'child_process';
import 'dotenv/config';

// --- Configuration ---
const CSV_FILE_PATH = path.join(__dirname, '../docs/Bob University - GHL Video URLs  - Sheet1.csv');
const TEMP_DIR = path.join(__dirname, '../temp_fix_auto');

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

interface CsvRow {
    Module: string;
    Order: string;
    'Course Name': string; 
    'Video Link': string;
}

async function autoFixErrors() {
    console.log('--- Starting Auto-Fix Script ---');

    // 1. Load CSV Data
    console.log('Loading CSV headers...');
    const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
    const records: CsvRow[] = parse(csvContent, { 
        columns: true, 
        skip_empty_lines: true, 
        trim: true 
    });
    console.log(`Loaded ${records.length} rows from CSV.`);

    // 2. Fetch Errored Assets from Mux
    console.log('Fetching Errored Assets from Mux...');
    const erroredAssets = [];
    try {
        for await (const asset of mux.video.assets.list({ limit: 100 })) {
            if (asset.status === 'errored') {
                erroredAssets.push(asset);
            }
        }
    } catch (err) {
        console.error('Mux API Error:', err);
        return;
    }
    console.log(`Found ${erroredAssets.length} errored assets.`);

    if (erroredAssets.length === 0) {
        console.log('No errored assets found. Exiting.');
        return;
    }

    // 3. Process Each Error
    for (const asset of erroredAssets) {
        const assetId = asset.id;
        console.log(`\nProcessing Errored Asset: ${assetId}`);

        // A. Find in DB
        const { data: videoRecord, error: dbError } = await supabase
            .from('videos')
            .select('id, title, module_id')
            .eq('mux_asset_id', assetId)
            .single();

        if (dbError || !videoRecord) {
            console.error(`  - [SKIP] Could not find video in DB for asset ${assetId}`);
            continue;
        }

        const title = videoRecord.title;
        console.log(`  - Linked to Video Title: "${title}"`);

        // B. Find in CSV to get Authoritative URL
        const csvRow = records.find(r => r['Course Name'] === title);
        
        if (!csvRow) {
             console.error(`  - [SKIP] Title "${title}" not found in CSV.`);
             continue;
        }

        const sourceUrl = csvRow['Video Link'];
        if (!sourceUrl) {
            console.error(`  - [SKIP] No video link in CSV for "${title}".`);
            continue;
        }
        console.log(`  - Source URL from CSV: ${sourceUrl}`);

        // C. Local Conversion
        const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const localMp4Path = path.join(TEMP_DIR, `${safeTitle}.mp4`);

        if (!fs.existsSync(localMp4Path)) {
            console.log(`  - Local file not found, converting...`);
            try {
                // Try copy first (fast)
                const ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
                const cmd = `ffmpeg -user_agent "${ua}" -reconnect 1 -reconnect_at_eof 1 -reconnect_streamed 1 -reconnect_delay_max 5 -i "${sourceUrl}" -c copy -bsf:a aac_adtstoasc -y "${localMp4Path}"`;
                execSync(cmd, { stdio: 'ignore' });
                console.log(`  - Conversion (copy) successful.`);
            } catch (err) {
                console.log(`  - Copy failed, attempting full re-encode...`);
                try {
                     execSync(`ffmpeg -i "${sourceUrl}" -c:v libx264 -c:a aac -y "${localMp4Path}"`, { stdio: 'ignore' });
                     console.log(`  - Re-encode successful.`);
                } catch (e2) {
                    console.error(`  - [SKIP] All conversion attempts failed.`);
                    continue;
                }
            }
        } else {
            console.log(`  - Local file already exists, skipping conversion.`);
        }

        // D. Upload to Mux
        console.log(`  - Uploading to Mux...`);
        let newAssetId: string | null = null;
        let newPlaybackId: string | null = null;

        try {
            const upload = await mux.video.uploads.create({
                new_asset_settings: {
                    playback_policy: ['public'],
                    passthrough: `${videoRecord.module_id}_${title}_repaired`,
                },
                cors_origin: '*', 
            });
    
            const uploadUrl = upload.url;
            const uploadId = upload.id;
    
            const fileBuffer = fs.readFileSync(localMp4Path);
            await fetch(uploadUrl, { method: 'PUT', body: fileBuffer });
            
            console.log(`  - Uploaded. Waiting for processing...`);
            
            // Wait for Asset ID
            for (let i = 0; i < 45; i++) { 
                await new Promise(r => setTimeout(r, 2000));
                const updatedUpload = await mux.video.uploads.retrieve(uploadId);
                if (updatedUpload.asset_id) {
                    newAssetId = updatedUpload.asset_id;
                    break;
                }
            }

            if (!newAssetId) {
                throw new Error("Timed out waiting for Mux Asset ID");
            }
            console.log(`  - New Asset Created: ${newAssetId}`);

             // Get Playback ID
            const assetData = await mux.video.assets.retrieve(newAssetId);
            newPlaybackId = assetData.playback_ids?.[0]?.id || null;

        } catch (uploadErr) {
            console.error(`  - [SKIP] Upload failed:`, uploadErr);
            continue;
        }

        // E. Update Database
        if (newAssetId) {
            const { error: updateError } = await supabase
                .from('videos')
                .update({ 
                    mux_asset_id: newAssetId, 
                    mux_playback_id: newPlaybackId 
                })
                .eq('id', videoRecord.id);

            if (updateError) {
                console.error(`  - [ERROR] DB Update failed:`, updateError);
                // Don't delete old asset if DB update fails, to be safe? 
                // Or maybe we should, since we have the file locally?
                // Let's keep it safe.
                continue;
            }
            console.log(`  - Database updated successfully.`);

            // F. Delete Old Mux Asset
            try {
                await mux.video.assets.delete(assetId);
                console.log(`  - Deleted old errored asset: ${assetId}`);
            } catch (delErr) {
                console.error(`  - [WARN] Failed to delete old asset:`, delErr);
            }
            
            // Cleanup Local File
            fs.unlinkSync(localMp4Path);
            console.log(`  - Process complete for "${title}"`);
        }
    }

    // Cleanup Temp Dir
    // fs.rmdirSync(TEMP_DIR);
    console.log(`\n--- Auto-Fix Complete ---`);
}

autoFixErrors();
