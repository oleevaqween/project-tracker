import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { profiles } from '@/db/schema';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const VALID_OTP_TYPES: EmailOtpType[] = ['signup', 'magiclink', 'recovery', 'invite', 'email', 'email_change'];
  const typeRaw = searchParams.get('type');
  const type: EmailOtpType | null = typeRaw && (VALID_OTP_TYPES as string[]).includes(typeRaw)
    ? (typeRaw as EmailOtpType)
    : null;

  const supabase = await createClient();

  if (tokenHash && type) {
    // Email confirmation flow: ?token_hash=xxx&type=signup
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
    }
    // Recovery flow: session is active, send to reset-password
    if (type === 'recovery') {
      return NextResponse.redirect(`${origin}/reset-password`);
    }
  } else if (code) {
    // OAuth / PKCE code exchange flow: ?code=xxx
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
    }
  } else {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=no_user`);
  }

  const [existingProfile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (existingProfile) {
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  return NextResponse.redirect(`${origin}/onboarding`);
}
