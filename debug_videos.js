
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, 'admin/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVideos() {
  console.log('Fetching videos...');
  const { data, error } = await supabase
    .from('videos')
    .select('id, title, thumbnail_url, mux_playback_id, video_url')
    .not('mux_playback_id', 'is', null)
    .limit(10);

  if (error) {
    console.error('Error fetching videos:', error);
    return;
  }

  console.log('Video Data:');
  console.table(data);
}

checkVideos();
