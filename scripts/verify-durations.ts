
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDurations() {
  const { data } = await supabase
    .from('video_library')
    .select('title, duration_seconds')
    .not('duration_seconds', 'is', null)
    .limit(10);

  console.log('Sample updated records:');
  console.log(JSON.stringify(data, null, 2));
}

checkDurations();
