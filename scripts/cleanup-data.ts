import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import 'dotenv/config';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CSV_FILE_PATH = path.join(__dirname, '../docs/Bob University - GHL Video URLs  - Sheet1.csv');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function cleanupAndVerify() {
  console.log('--- CLEANUP STARTED ---');
  
  // 1. Delete Placeholders
  const { data: deleted, error: deleteError } = await supabase
    .from('videos')
    .delete()
    .ilike('video_url', '%placeholder%')
    .select();

  if (deleteError) {
    console.error('Delete Error:', deleteError);
  } else {
    console.log(`Deleted ${deleted?.length || 0} placeholder videos.`);
  }

  console.log('\n--- VERIFICATION AGAINST CSV ---');

  // 2. Load CSV
  const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  
  const csvTitles = new Set(records.map((r: any) => r['Course Name']?.trim()).filter(Boolean));
  console.log(`CSV contains ${csvTitles.size} unique video titles.`);

  // 3. Load DB Videos
  const { data: dbVideos, error: fetchError } = await supabase
    .from('videos')
    .select('title, video_url, mux_asset_id');

  if (fetchError) {
    console.error('Fetch Error:', fetchError);
    return;
  }

  const dbTitles = new Set(dbVideos?.map(v => v.title) || []);
  console.log(`Database contains ${dbTitles.size} unique video titles.`);

  // 4. Compare
  const missingInDb = [...csvTitles].filter(x => !dbTitles.has(x));
  const extraInDb = [...dbTitles].filter(x => !csvTitles.has(x));

  if (missingInDb.length > 0) {
    console.log('\n[WARNING] Missing from DB (present in CSV):');
    missingInDb.forEach(t => console.log(` - ${t}`));
  } else {
    console.log('\n[SUCCESS] All CSV titles are present in DB.');
  }

  if (extraInDb.length > 0) {
    console.log('\n[INFO] Extra in DB (not in CSV):');
    extraInDb.forEach(t => console.log(` - ${t}`));
  }
}

cleanupAndVerify();
