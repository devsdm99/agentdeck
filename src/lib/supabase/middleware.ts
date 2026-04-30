import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { serverEnv } from '@/lib/env';

const PUBLIC_PREFIXES = ['/login', '/signup', '/_next', '/favicon', '/api/scans'];
const ROOT_IS_PUBLIC = true;

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const env = serverEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  if (!user && requiresAuth(path)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', path);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

function requiresAuth(path: string): boolean {
  if (path === '/' && ROOT_IS_PUBLIC) return false;
  return !PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix));
}
