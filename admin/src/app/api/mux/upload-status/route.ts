import { NextRequest, NextResponse } from 'next/server';
import Mux from '@mux/mux-node';

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function GET(request: NextRequest) {
  const uploadId = request.nextUrl.searchParams.get('uploadId');

  if (!uploadId) {
    return NextResponse.json(
      { error: 'Upload ID is required' },
      { status: 400 }
    );
  }

  try {
    const upload = await mux.video.uploads.retrieve(uploadId);
    console.log('Mux upload status:', upload.status, 'asset_id:', upload.asset_id);

    if (upload.status === 'asset_created' && upload.asset_id) {
      // Get the asset details to retrieve the playback ID
      const asset = await mux.video.assets.retrieve(upload.asset_id);
      console.log('Mux asset status:', asset.status, 'playback_ids:', asset.playback_ids);

      // Asset might still be processing even after upload is complete
      if (asset.status === 'ready' && asset.playback_ids?.[0]?.id) {
        return NextResponse.json({
          status: 'asset_created',
          assetId: upload.asset_id,
          playbackId: asset.playback_ids[0].id,
          duration: asset.duration || null,
        });
      }

      // Asset exists but still processing
      return NextResponse.json({
        status: 'processing',
        assetId: upload.asset_id,
        playbackId: null,
        duration: null,
      });
    }

    return NextResponse.json({
      status: upload.status,
      assetId: upload.asset_id || null,
      playbackId: null,
      duration: null,
    });
  } catch (error) {
    console.error('Mux status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check upload status' },
      { status: 500 }
    );
  }
}
