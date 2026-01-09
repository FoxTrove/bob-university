import Mux from '@mux/mux-node';
import 'dotenv/config';

const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID!;
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET!;

if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
  console.error('Missing env vars');
  process.exit(1);
}

const mux = new Mux({ tokenId: MUX_TOKEN_ID, tokenSecret: MUX_TOKEN_SECRET });

const ASSETS_TO_DELETE = [
    'BzpRHpGjyU00sOWMdmfGvKRoMiq3X7mD8HAuoN00Ij003c', // Grunge Bob 1
    '9u8sIR01rrKEX02IFwW7Ucde01WkSK1KRIH00DiaOACaDQE', // Grunge Bob 2
    'ti00mbn1XFGVFW4Cn02R1RtP00S100PjXrbhr0202k7xbsnX4', // Grunge Bob 3
    'Y00501RiEjfR7ZHK2yqurAQm7CAMYAuQtXv5MPzGWO01CE', // Grunge Bob 4
    '00vPvBFySdkBQjJxyawPa02QbcnD74hjqFRL8YZBO5ql00', // Live 4
    'kRhYEMpaePdxl4ryMkTquaTkbjzsl3a00VpfK00W87BaU'    // Live 5
];

async function deleteAssets() {
    for (const assetId of ASSETS_TO_DELETE) {
        console.log(`Deleting ${assetId}...`);
        try {
            await mux.video.assets.delete(assetId);
            console.log(' - Deleted.');
        } catch (err) {
            console.error(' - Delete Failed:', err);
        }
    }
}

deleteAssets();
