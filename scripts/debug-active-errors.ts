import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const targetTitles = [
    'Live # 5 Round Graduation',
    'Live # 4 Shape Shifter Bob',
    'Grunge Bob Part 4',
    'Grunge Bob Part 3',
    'Grunge Bob Part 2',
    'Grunge Bob Part 1'
];

async function checkTargets() {
    const { data: videos } = await supabase
        .from('videos')
        .select('title, mux_asset_id')
        .in('title', targetTitles);

    console.log('Current DB State for Targets:');
    videos?.forEach(v => {
        console.log(`- ${v.title}: ${v.mux_asset_id}`);
    });
}

checkTargets();
