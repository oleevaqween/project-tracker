import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const ACCESS_COOKIE = 'site_access';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const secret = process.env.SITE_ACCESS_SECRET;

  // No secret configured — site is open (standard self-hosted setup).
  if (!secret) {
    return updateSession(request);
  }

  // Always allow the unlock endpoint through, otherwise it can never set the cookie.
  if (pathname.startsWith('/api/unlock')) {
    return NextResponse.next();
  }

  // Check for a valid access cookie.
  const cookie = request.cookies.get(ACCESS_COOKIE);
  if (!cookie || cookie.value !== secret) {
    return new NextResponse(
      `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Private</title>
    <style>
      body { margin: 0; display: flex; align-items: center; justify-content: center;
             min-height: 100vh; background: #0a0a0f; font-family: sans-serif; }
      .box { text-align: center; color: #888; }
      h1 { color: #fff; font-size: 1.5rem; margin-bottom: 0.5rem; }
    </style>
  </head>
  <body>
    <div class="box">
      <h1>Private</h1>
      <p>This site is not publicly accessible.</p>
    </div>
  </body>
</html>`,
      { status: 403, headers: { 'Content-Type': 'text/html' } }
    );
  }

  // Valid cookie — hand off to Supabase session handler.
  return updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|logo.*\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
