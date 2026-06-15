'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq, and, ne } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { db } from '@/db';
import { profiles } from '@/db/schema';

export async function updateProfile(data: {
  displayName: string;
  username: string;
  bio: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [taken] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.username, data.username), ne(profiles.id, user.id)))
    .limit(1);

  if (taken) return { error: 'That username is already taken.' };

  await db
    .update(profiles)
    .set({
      displayName: data.displayName || null,
      username: data.username,
      bio: data.bio || null,
    })
    .where(eq(profiles.id, user.id));

  revalidatePath('/profile');
  return {};
}

export async function deleteAccount(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) throw new Error(`Failed to delete account: ${error.message}`);

  await supabase.auth.signOut();
  redirect('/login');
}
