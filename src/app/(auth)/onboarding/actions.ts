'use server';

import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';

const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(50, 'Username must be at most 50 characters')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, hyphens, and underscores'
  )
  .toLowerCase();

export async function createProfile(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const rawUsername = formData.get('username');
  const parsed = usernameSchema.safeParse(rawUsername);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const username = parsed.data;

  const [existing] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.username, username))
    .limit(1);

  if (existing) {
    return { error: 'Username already taken. Try another.' };
  }

  try {
    await db.insert(profiles).values({
      id: user.id,
      username,
      displayName: (user.user_metadata?.full_name as string | undefined) ?? null,
      avatarUrl: (user.user_metadata?.avatar_url as string | undefined) ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (err) {
    console.error('Failed to create profile:', err);
    return { error: 'Failed to create profile. Please try again.' };
  }

  redirect('/dashboard');
}