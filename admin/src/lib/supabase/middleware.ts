import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/reset-password', '/auth/callback', '/auth/confirm'];
  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Protect all routes except public ones
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If user is logged in but on login page, redirect to dashboard
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Check if user has admin role (stored in profiles table)
  // Skip for public routes and unauthorized page
  if (user && !isPublicRoute && !request.nextUrl.pathname.startsWith('/unauthorized')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const { data: roleFromRpc } = await supabase.rpc('get_user_role');

    const profileRole = profile?.role?.toLowerCase();
    const rpcRole = typeof roleFromRpc === 'string'
      ? roleFromRpc.toLowerCase()
      : null;
    const appMetadataRole = typeof user.app_metadata?.role === 'string'
      ? user.app_metadata.role.toLowerCase()
      : null;
    const userMetadataRole = typeof user.user_metadata?.role === 'string'
      ? user.user_metadata.role.toLowerCase()
      : null;
    const isAdmin = profileRole === 'admin'
      || rpcRole === 'admin'
      || appMetadataRole === 'admin'
      || userMetadataRole === 'admin';

    if (!isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = '/unauthorized';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
