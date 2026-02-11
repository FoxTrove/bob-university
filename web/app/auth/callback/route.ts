import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';
  const type = requestUrl.searchParams.get('type');

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Handle different auth types
      if (type === 'recovery') {
        // Password reset - redirect to reset password page
        return NextResponse.redirect(new URL('/auth/reset-password', request.url));
      } else if (type === 'signup') {
        // Email confirmation - redirect to success
        return NextResponse.redirect(new URL('/auth/confirmed', request.url));
      } else if (type === 'invite') {
        // Team invite - redirect to app
        return NextResponse.redirect(new URL('/', request.url));
      }

      // Default redirect
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Error - redirect to error page
  return NextResponse.redirect(new URL('/auth/error', request.url));
}
