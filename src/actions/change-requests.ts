'use server';

import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/db';
import { changeRequests, projects } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

type ChangeRequestInsert = typeof changeRequests.$inferInsert;
type ChangeRequestUpdate = Partial<Omit<typeof changeRequests.$inferInsert, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>>;

// ---------- Queries ----------

export async function getChangeRequests(projectId: number) {
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
    .from(changeRequests)
    .where(eq(changeRequests.projectId, projectId))
    .orderBy(desc(changeRequests.createdAt));
}

export async function getChangeRequest(id: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const rows = await db
    .select({ item: changeRequests })
    .from(changeRequests)
    .innerJoin(projects, and(eq(changeRequests.projectId, projects.id), eq(projects.userId, user.id)))
    .where(eq(changeRequests.id, id));

  return rows[0]?.item ?? null;
}

// ---------- Mutations ----------

export async function createChangeRequest(data: Omit<ChangeRequestInsert, 'id' | 'createdAt' | 'updatedAt'>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, data.projectId!), eq(projects.userId, user.id)));
  if (!project) redirect('/projects');

  const [changeRequest] = await db
    .insert(changeRequests)
    .values(data as ChangeRequestInsert)
    .returning();

  revalidatePath(`/projects/${data.projectId}`);
  return changeRequest;
}

export async function updateChangeRequest(id: number, projectId: number, data: ChangeRequestUpdate) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [owned] = await db
    .select({ id: changeRequests.id })
    .from(changeRequests)
    .innerJoin(projects, and(eq(changeRequests.projectId, projects.id), eq(projects.userId, user.id)))
    .where(eq(changeRequests.id, id));
  if (!owned) return null;

  const [changeRequest] = await db
    .update(changeRequests)
    .set(data)
    .where(eq(changeRequests.id, id))
    .returning();

  revalidatePath(`/projects/${projectId}`);
  return changeRequest;
}

export async function deleteChangeRequest(id: number, projectId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [owned] = await db
    .select({ id: changeRequests.id })
    .from(changeRequests)
    .innerJoin(projects, and(eq(changeRequests.projectId, projects.id), eq(projects.userId, user.id)))
    .where(eq(changeRequests.id, id));
  if (!owned) return;

  await db.delete(changeRequests).where(eq(changeRequests.id, id));
  revalidatePath(`/projects/${projectId}`);
}