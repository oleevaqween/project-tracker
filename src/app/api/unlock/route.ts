import { NextRequest, NextResponse } from 'next/server';

const ACCESS_COOKIE = 'site_access';

// GET /api/unlock?secret=YOUR_SECRET
// Sets the access cookie and redirects to the dashboard.
// GET /api/unlock?secret=YOUR_SECRET&revoke=1
// Clears the access cookie and redirects to root (logs you out of the gate).
export async function GET(request: NextRequest) {
  const secret = process.env.SITE_ACCESS_SECRET;
  const provided = request.nextUrl.searchParams.get('secret');
  const revoke = request.nextUrl.searchParams.get('revoke');

  if (!secret || provided !== secret) {
    return new NextResponse('Invalid secret.', { status: 401 });
  }

  const response = NextResponse.redirect(new URL('/dashboard', request.url));

  if (revoke === '1') {
    // Clear the cookie — this browser loses access.
    response.cookies.set(ACCESS_COOKIE, '', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
  } else {
    // Set the cookie — valid for 30 days.
    response.cookies.set(ACCESS_COOKIE, secret, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });
  }

  return response;
}
