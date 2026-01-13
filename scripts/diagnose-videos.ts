
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Supabase Setup
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const TITLES_TO_CHECK = [
    "Live #7 Concave Layering Workshop - 90 mins",
    "Live # 5 Round Graduation",
    "Live # 4 Shape Shifter Bob",
    "Grunge Bob Part 1",
    "Grunge Bob Part 2",
    "Grunge Bob Part 3",
    "Grunge Bob Part 4",
    "Certification Cohorts - October Syllabus",
    "Not sure if BOB U Certification is right for you?",
    "About Ray"
];

async function checkVideos() {
    console.log("Checking video status...");
    const { data, error } = await supabase
        .from('videos')
        .select('id, title, mux_asset_id, mux_playback_id, video_url')
        .in('title', TITLES_TO_CHECK);

    if (error) {
        console.error("Error fetching videos:", error);
        return;
    }

    console.log("Found", data.length, "videos matching titles.");
    data.forEach(v => {
        console.log(`\nTitle: ${v.title}`);
        console.log(`  - ID: ${v.id}`);
        console.log(`  - Mux Asset ID: ${v.mux_asset_id}`);
        console.log(`  - Mux Playback ID: ${v.mux_playback_id}`);
        console.log(`  - Original URL: ${v.video_url}`);
    });
}

checkVideos();
