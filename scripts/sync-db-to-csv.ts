
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CSV_PATH = path.join(__dirname, '../docs/Bob University - GHL Video URLs  - Sheet1.csv');

interface CsvRow {
  Module: string;
  Order: string;
  'Course Name': string; // This is the Video Title
  'Video Link': string;
  Description: string;
}

async function syncDbToCsv() {
  console.log('Starting DB Sync...');

  if (!fs.existsSync(CSV_PATH)) {
    console.error(`CSV file not found at: ${CSV_PATH}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const records: CsvRow[] = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`Parsed ${records.length} rows from CSV.`);

  // 1. Upsert Modules
  // We want to keep track of Module IDs by name to link videos later.
  const moduleMap = new Map<string, string>(); // Name -> ID
  
  // Extract unique modules preserving order in CSV effectively (though we can just use a set)
  // We'll trust the order they appear in the CSV for now, or just use 0 if not specified.
  // Actually, we can assign a sort_order based on the first appearance.
  
  const uniqueModules = Array.from(new Set(records.map(r => r.Module))).filter(m => m);
  
  for (let i = 0; i < uniqueModules.length; i++) {
    const moduleName = uniqueModules[i];
    // console.log(`Processing module: ${moduleName}`);
    
    // Check if module exists
    const { data: existingModules, error: fetchError } = await supabase
      .from('modules')
      .select('id')
      .eq('title', moduleName)
      .limit(1);

    if (fetchError) {
        console.error(`Error fetching module ${moduleName}:`, fetchError);
        continue;
    }

    let moduleId: string;

    if (existingModules && existingModules.length > 0) {
        moduleId = existingModules[0].id;
        // Update sort order? Maybe. Let's assume CSV order implies module order if we want strictness.
        // But for now let's just ensure it exists. 
    } else {
        // Create
        const { data: newModule, error: createError } = await supabase
            .from('modules')
            .insert({ 
                title: moduleName,
                is_published: true, // Default to true for imported content
                sort_order: i + 1
            })
            .select('id')
            .single();
        
        if (createError) {
             console.error(`Error creating module ${moduleName}:`, createError);
             continue;
        }
        moduleId = newModule.id;
        console.log(`Created new module: ${moduleName}`);
    }
    moduleMap.set(moduleName, moduleId);
  }

  // 2. Upsert Videos and Link to Modules
  // We will track which Video IDs (from DB) were touched. Any Video NOT touched but in a synced Module might need removal?
  // The user said "Remove any old placeholder modules and videos".
  // So we should collect ALL video IDs found/upserted from the CSV. 
  // Then finding any videos in DB that are NOT in this list -> DELETE.
  
  const validVideoIds: string[] = [];

  for (const record of records) {
      if (!record.Module || !record['Course Name']) continue;

      const moduleId = moduleMap.get(record.Module);
      if (!moduleId) {
          console.warn(`Module ID not found for ${record.Module} (Skipping video ${record['Course Name']})`);
          continue;
      }

      const videoTitle = record['Course Name'];
      const sortOrder = parseInt(record.Order) || 0;
      const description = record.Description || '';
      const videoUrl = record['Video Link']; // Source URL, helpful reference but we rely on Mux assets mostly.

      // Check if video exists by title (assuming title uniqueness within the project for now, or at least we treat it as key)
      // Actually, better to check by title AND module if possible, but title is likely unique enough from GHL.
      const { data: existingVideos, error: videoFetchError } = await supabase
          .from('videos')
          .select('id, mux_asset_id')
          .eq('title', videoTitle)
          .limit(1);

      if (videoFetchError) {
          console.error(`Error fetching video ${videoTitle}:`, videoFetchError);
          continue;
      }

      let videoId: string;

      if (existingVideos && existingVideos.length > 0) {
          videoId = existingVideos[0].id;
          // Update details to match CSV
          const { error: updateError } = await supabase
            .from('videos')
            .update({
                module_id: moduleId,
                sort_order: sortOrder,
                description: description,
                // We do NOT update video_url or mux_ids here as those are handled by the Mux migration/fix scripts
                // Unless we want to ensure the 'video_url' column matches the CSV source link?
                video_url: videoUrl,
                is_published: true 
            })
            .eq('id', videoId);
          
          if (updateError) console.error(`Failed to update video ${videoTitle}:`, updateError);
          else {
              // console.log(`Updated video: ${videoTitle}`);
          }

      } else {
          // New Video? 
          // If it wasn't in DB, it might not have been migrated to Mux yet?
          // Or perahps it was just missing from DB.
          // We will verify this. For now, insert it.
          const { data: newVideo, error: insertError } = await supabase
            .from('videos')
            .insert({
                title: videoTitle,
                module_id: moduleId,
                sort_order: sortOrder,
                description: description,
                video_url: videoUrl,
                is_published: true
            })
            .select('id')
            .single();

            if (insertError) {
                console.error(`Failed to insert video ${videoTitle}:`, insertError);
                continue;
            }
            videoId = newVideo.id;
            console.log(`Created new video record: ${videoTitle}`);
      }
      validVideoIds.push(videoId);
  }

  console.log(`Processed ${validVideoIds.length} videos from CSV.`);

  // 3. Cleanup Orphans
  // Delete Videos not in CSV
  const { data: allVideos, error: allVideosError } = await supabase.from('videos').select('id, title');
  if (allVideosError) {
      console.error("Error fetching all videos for cleanup:", allVideosError);
  } else {
      const videosToDelete = allVideos.filter(v => !validVideoIds.includes(v.id));
      if (videosToDelete.length > 0) {
          console.log(`Found ${videosToDelete.length} videos NOT in CSV. Deleting...`);
          for (const v of videosToDelete) {
             console.log(`Deleting video: ${v.title} (${v.id})`);
             // Perform delete
             const { error: delError } = await supabase.from('videos').delete().eq('id', v.id);
             if (delError) console.error(`Failed to delete ${v.id}:`, delError);
          }
      } else {
          console.log("No videos to delete.");
      }
  }

  // Delete Modules not in CSV
  const validModuleIds = Array.from(moduleMap.values());
  const { data: allModules, error: allModulesError } = await supabase.from('modules').select('id, title');
  if (allModulesError) {
      console.error("Error fetching all modules for cleanup:", allModulesError);
  } else {
      const modulesToDelete = allModules.filter(m => !validModuleIds.includes(m.id));
      if (modulesToDelete.length > 0) {
          console.log(`Found ${modulesToDelete.length} modules NOT in CSV. Deleting...`);
          for (const m of modulesToDelete) {
              console.log(`Deleting module: ${m.title} (${m.id})`);
              const { error: delModError } = await supabase.from('modules').delete().eq('id', m.id);
              if (delModError) console.error(`Failed to delete module ${m.id}:`, delModError);
          }
      } else {
          console.log("No modules to delete.");
      }
  }

  console.log('Sync Complete.');
}

syncDbToCsv();
