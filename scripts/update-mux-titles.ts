import { createClient } from '@supabase/supabase-js';
import Mux from '@mux/mux-node';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import 'dotenv/config';

// --- Configuration ---
const CSV_FILE_PATH = path.join(__dirname, '../docs/Bob University - GHL Video URLs  - Sheet1.csv');

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

interface CsvRow {
    'Course Name': string; 
}

async function updateMuxTitles() {
    console.log('--- Updating Mux Titles ---');

    // 1. Load CSV
    const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
    const records: CsvRow[] = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true });
    
    // Create map of Title -> Row (for existence check, though we mostly iterate DB)
    // Actually, we should iterate DB videos that have Mux IDs.
    
    // 2. Fetch all videos with Mux IDs
    const { data: videos, error } = await supabase
        .from('videos')
        .select('id, title, mux_asset_id')
        .not('mux_asset_id', 'is', null);

    if (error) {
        console.error('DB Error:', error);
        return;
    }

    console.log(`Found ${videos.length} videos with Mux IDs in DB.`);

    let updatedCount = 0;

    for (const video of videos) {
        // Find matching CSV record to be sure (optional, but good strictly to follow "as mentioned in csv")
        const csvRecord = records.find(r => r['Course Name'] === video.title);
        
        // Use the title from the DB (which came from CSV) or CSV directly. 
        // They should be identical.
        const targetTitle = csvRecord ? csvRecord['Course Name'] : video.title;
        
        if (!targetTitle) continue;

        console.log(`Updating Asset ${video.mux_asset_id} -> "${targetTitle}"`);
        
        try {
            await mux.video.assets.update(video.mux_asset_id, {
                passthrough: targetTitle
            });
            updatedCount++;
            // Rate limit generic protection
            await new Promise(r => setTimeout(r, 200)); 
        } catch (err) {
            console.error(` - Failed to update ${video.mux_asset_id}:`, err);
        }
    }

    console.log(`\n--- Completed ---`);
    console.log(`Updated ${updatedCount} assets.`);
}

updateMuxTitles();
