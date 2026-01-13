import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

// Load Env
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

// Initialize Supabase Client (Service Role for admin access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const DATA_FILE = path.join(__dirname, '../data/ghl_course_data.json');

async function main() {
  if (!fs.existsSync(DATA_FILE)) {
    console.error(`Error: Data file not found at ${DATA_FILE}`);
    return;
  }

  const courseData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  console.log(`Ingesting Course: ${courseData.title || 'Bob University'}`);

  // 1. Ingest Modules
  // Assuming structure from scraper: { title, modules: [ { title, description, lessons: [ { title, video_url } ] } ] }
  const modules = courseData.modules || [];

  for (let i = 0; i < modules.length; i++) {
    const mod = modules[i];
    console.log(`Processing Module: ${mod.title}`);

    // Upsert Module
    // We match on title if we don't have an ID, or create new.
    // Ideally we have a unique slug or we rely on titles being unique.
    const { data: moduleData, error: moduleError } = await supabase
      .from('modules')
      .upsert({
        title: mod.title,
        description: mod.description,
        sort_order: i,
        is_published: true, // Auto-publish for now
      }, { onConflict: 'title' }) // Warning: Title conflict assumption
      .select()
      .single();

    if (moduleError) {
      console.error(`Error upserting module ${mod.title}:`, moduleError);
      continue;
    }

    const moduleId = moduleData.id;

    // 2. Ingest Lessons/Videos
    const lessons = mod.lessons || [];
    for (let j = 0; j < lessons.length; j++) {
      const lesson = lessons[j];
      console.log(`  - Processing Video: ${lesson.title}`);

      const { error: videoError } = await supabase
        .from('videos')
        .upsert({
          module_id: moduleId,
          title: lesson.title,
          description: lesson.description,
          video_url: lesson.video_url || '',
          sort_order: j,
          is_published: true,
          // Mux IDs will be populated by a separate migration script later or if we scrape them
          mux_asset_id: lesson.mux_asset_id,
          mux_playback_id: lesson.mux_playback_id
        }, { onConflict: 'module_id, title' }) // Unique constraint might not exist, need to check
        .select();

      if (videoError) {
         // Fallback if no unique constraint on (module_id, title), rely on inserting?
         // This script assumes we want to update.
         console.error(`    Error upserting video ${lesson.title}:`, videoError);
      }
    }
  }

  console.log('Ingestion Complete.');
}

main();
