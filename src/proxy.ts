import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/projects',
  '/tasks',
  '/ai-chat',
  '/knowledge-base',
  '/analytics',
  '/settings',
  '/portfolios',
];

const AUTH_ONLY_PREFIXES = ['/login', '/signup'];

// Simple sliding-window rate limiter (in-memory, per-process)
const rateLimitWindows = new Map<string, { count: number; resetAt: number }>();

const API_RATE_LIMITS: Record<string, number> = {
  '/api/chat':       30, // requests per minute per user
  '/api/embeddings': 10, // requests per minute per user
};

function checkRateLimit(userId: string, pathname: string): boolean {
  const limit = API_RATE_LIMITS[pathname];
  if (!limit) return true; // no limit configured

  const key = `${userId}:${pathname}`;
  const now = Date.now();
  const window = rateLimitWindows.get(key);

  if (!window || now > window.resetAt) {
    rateLimitWindows.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (window.count >= limit) return false;

  window.count++;
  return true;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: (url: RequestInfo | URL, options?: RequestInit) =>
          fetch(url, { ...options, headers: { ...(options?.headers ?? {}), connection: 'close' } }),
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthOnly = AUTH_ONLY_PREFIXES.some((p) => pathname.startsWith(p));

  if (!user && isProtected) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthOnly) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Rate limit API routes for authenticated users
  if (user && pathname.startsWith('/api/')) {
    if (!checkRateLimit(user.id, pathname)) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please wait before trying again.' }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } }
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
