import { NextRequest, NextResponse } from 'next/server';
import Mux from '@mux/mux-node';
import { createClient } from '@/lib/supabase/server';

const { video } = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

export async function POST(
  request: NextRequest
) {
  try {
    const { playbackId, videoId } = await request.json();

    if (!playbackId) {
      return NextResponse.json(
        { error: 'Playback ID is required' },
        { status: 400 }
      );
    }
    
    // Authorization check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get Asset ID from Playback ID if not provided? 
    // Actually typically we need Asset ID to get tracks. 
    // But MuxVideoPlayer often just has PlaybackID.
    // Let's assume we have Asset ID in the database `mux_asset_id`.
    // If not, we might need to look it up from playback ID, but usually we store both.
    
    // Re-fetch video to get asset_id (securely)
    if (videoId) {
        const { data: videoData } = await supabase.from('videos').select('mux_asset_id').eq('id', videoId).single();
        if (videoData?.mux_asset_id) {
             // Fetch tracks
             const mux_asset_id = videoData.mux_asset_id;
             const asset = await video.assets.retrieve(mux_asset_id);
    
             const captionTrack = asset.tracks?.find(
               (track) => track.type === 'text' && (track.text_type === 'subtitles' || track.text_type === 'captions') && track.status === 'ready'
             );

             if (!captionTrack || !captionTrack.id) {
               console.log('No caption track found for asset:', mux_asset_id);
               console.log('Available tracks:', asset.tracks);
               return NextResponse.json(
                 { error: 'No transcript found for this video. Ensure "Auto-generate captions" was enabled during upload or that processing is complete.' },
                 { status: 404 }
               );
             }

             // Get the playback ID for the asset to construct the URL
             // We can use the playbackId passed in request or find it on the asset
             const finalPlaybackId = asset.playback_ids?.[0]?.id || playbackId;
             
             // Download the caption track
             // Mux doesn't provide direct download URL in list? 
             // https://docs.mux.com/guides/add-captions#retrieve-captions
             // "Construct the URL: https://stream.mux.com/{playback_id}/text/{track_id}.vtt"
             
             // So we actually need PlaybackID and Track ID.
             
             const url = `https://stream.mux.com/${finalPlaybackId}/text/${captionTrack.id}.vtt`;
             const response = await fetch(url);
             if (!response.ok) {
                 throw new Error('Failed to fetch caption file');
             }
             const vttText = await response.text();
             
             // Simple VTT to Text cleaner (optional, or just save VTT)
             // For now, let's just save the raw VTT or maybe clean it up? 
             // User wants "transcript". Raw VTT is okay but maybe strip timestamps for "Article" view?
             // Let's return raw VTT for now, admin can edit.
             
             return NextResponse.json({ transcript: vttText });
        }
    }
    
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });

  } catch (error) {
    console.error('Error fetching transcript:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
