'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export type CharterData = {
  projectPurpose?: string;
  objectives?: string;
  scopeSummary?: string;
  deliverables?: string;
  acceptanceCriteria?: string;
  assumptions?: string;
  constraints?: string;
  scheduleSummary?: string;
  stakeholderOverview?: string;
  riskApproach?: string;
  successMetrics?: string;
};

export async function saveCharter(projectId: number, charter: CharterData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  await db
    .update(projects)
    .set({ charter })
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)));

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}
