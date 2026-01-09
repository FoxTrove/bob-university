
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkNewestDurations() {
  const { data } = await supabase
    .from('video_library')
    .select('id, title, duration_seconds, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  console.log('Top 20 Newest Items:');
  data?.forEach(item => {
      console.log(`[${item.created_at}] ${item.title}: ${item.duration_seconds}s`);
  });
}

checkNewestDurations();
