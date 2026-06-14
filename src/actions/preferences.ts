'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { userPreferences } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function setFeaturedProject(projectId: number | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  await db
    .insert(userPreferences)
    .values({ userId: user.id, featuredProjectId: projectId })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: { featuredProjectId: projectId, updatedAt: new Date() },
    });

  revalidatePath('/projects');
}

export async function getFeaturedProjectId(): Promise<number | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [pref] = await db
    .select({ featuredProjectId: userPreferences.featuredProjectId })
    .from(userPreferences)
    .where(eq(userPreferences.userId, user.id))
    .limit(1);

  return pref?.featuredProjectId ?? null;
}
