'use server';

import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/db';
import { stakeholders, projects } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

type StakeholderInsert = typeof stakeholders.$inferInsert;
type StakeholderUpdate = Partial<Omit<typeof stakeholders.$inferInsert, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>>;

// ---------- Queries ----------

export async function getStakeholders(projectId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Verify project ownership first
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)));

  if (!project) redirect('/projects');

  return db
    .select()
    .from(stakeholders)
    .where(eq(stakeholders.projectId, projectId))
    .orderBy(desc(stakeholders.influence), desc(stakeholders.interest));
}

export async function getStakeholder(id: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [stakeholder] = await db
    .select()
    .from(stakeholders)
    .where(eq(stakeholders.id, id));

  return stakeholder ?? null;
}

// ---------- Mutations ----------

export async function createStakeholder(data: Omit<StakeholderInsert, 'id' | 'createdAt' | 'updatedAt'>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [stakeholder] = await db
    .insert(stakeholders)
    .values(data as StakeholderInsert)
    .returning();

  revalidatePath(`/projects/${data.projectId}`);
  return stakeholder;
}

export async function updateStakeholder(id: number, projectId: number, data: StakeholderUpdate) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [stakeholder] = await db
    .update(stakeholders)
    .set(data)
    .where(eq(stakeholders.id, id))
    .returning();

  revalidatePath(`/projects/${projectId}`);
  return stakeholder;
}

export async function deleteStakeholder(id: number, projectId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  await db.delete(stakeholders).where(eq(stakeholders.id, id));
  revalidatePath(`/projects/${projectId}`);
}