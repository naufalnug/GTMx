import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function updateSession(request) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(items) {
          items.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const pathname = request.nextUrl.pathname;
  const isLogin = pathname === '/portal/login';
  const isRecovery = pathname === '/portal/reset-password' || pathname.startsWith('/auth/');

  if (!claims?.sub && !isLogin && !isRecovery) {
    const url = request.nextUrl.clone();
    url.pathname = '/portal/login';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (claims?.sub && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = claims.app_metadata?.portal_role === 'admin' ? '/portal-admin' : '/portal';
    url.search = '';
    return NextResponse.redirect(url);
  }
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
