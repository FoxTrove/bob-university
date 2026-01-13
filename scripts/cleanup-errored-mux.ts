import Mux from '@mux/mux-node';
import 'dotenv/config';

const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID!;
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET!;

if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
  console.error('Missing env vars');
  process.exit(1);
}

const mux = new Mux({ tokenId: MUX_TOKEN_ID, tokenSecret: MUX_TOKEN_SECRET });

async function cleanupErrored() {
    console.log('Fetching all errored assets to delete...');
    const erroredAssets = [];
    try {
        for await (const asset of mux.video.assets.list({ limit: 100 })) {
            if (asset.status === 'errored') {
                erroredAssets.push(asset);
            }
        }
    } catch (err) {
        console.error('Mux API Error:', err);
        return;
    }

    console.log(`Found ${erroredAssets.length} errored assets.`);
    if (erroredAssets.length === 0) return;

    for (const asset of erroredAssets) {
        console.log(`Deleting ${asset.id}...`);
        try {
            await mux.video.assets.delete(asset.id);
            console.log(` - Deleted.`);
        } catch (err) {
            console.error(` - Failed to delete ${asset.id}:`, err);
        }
    }
    console.log('Cleanup complete.');
}

cleanupErrored();
