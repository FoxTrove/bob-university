
import { createClient } from '@supabase/supabase-js';
import Mux from '@mux/mux-node';
import 'dotenv/config';

// Config
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID!;
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const mux = new Mux({ tokenId: MUX_TOKEN_ID, tokenSecret: MUX_TOKEN_SECRET });

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

async function main() {
    const { data: videos } = await supabase
        .from('videos')
        .select('*')
        .in('title', TITLES_TO_CHECK);

    if (!videos) return;

    for (const v of videos) {
        console.log(`\nChecking: ${v.title}`);
        if (!v.mux_asset_id) {
            console.log(`  - No Mux Asset ID. (URL: ${v.video_url})`);
            continue;
        }

        try {
            const asset = await mux.video.assets.retrieve(v.mux_asset_id);
            console.log(`  - Mux Status: ${asset.status}`);
            if (asset.errors) {
                console.log(`  - Errors:`, asset.errors);
            }
        } catch (e: any) {
            console.log(`  - Error fetching Mux asset: ${e.message}`);
        }
    }
}

main();
