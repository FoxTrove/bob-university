import { NextResponse } from 'next/server';
import Mux from '@mux/mux-node';
import { createClient } from '@/lib/supabase/server';

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function POST() {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Create a direct upload URL
    const upload = await mux.video.uploads.create({
      cors_origin: process.env.NEXT_PUBLIC_APP_URL || 'https://admin.bobuniversity.com',
      new_asset_settings: {
        playback_policy: ['public'],
        encoding_tier: 'baseline',
      },
    });

    return NextResponse.json({
      uploadUrl: upload.url,
      uploadId: upload.id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create upload URL' },
      { status: 500 }
    );
  }
}
