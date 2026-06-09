'use server';

import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

type ProjectInsert = typeof projects.$inferInsert;
type ProjectUpdate = Partial<Omit<typeof projects.$inferInsert, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

// ---------- Queries ----------

export async function getProjects() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return db
    .select()
    .from(projects)
    .where(eq(projects.userId, user.id))
    .orderBy(desc(projects.updatedAt));
}

export async function getProject(id: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, user.id)));

  return project ?? null;
}

// ---------- Mutations ----------

export async function createProject(data: Omit<ProjectInsert, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [project] = await db
    .insert(projects)
    .values({ ...data, userId: user.id } as ProjectInsert)
    .returning();

  revalidatePath('/projects');
  return project;
}

export async function updateProject(id: number, data: ProjectUpdate) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [project] = await db
    .update(projects)
    .set(data)
    .where(and(eq(projects.id, id), eq(projects.userId, user.id)))
    .returning();

  revalidatePath('/projects');
  revalidatePath(`/projects/${id}`);
  return project;
}

export async function deleteProject(id: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  await db.delete(projects).where(and(eq(projects.id, id), eq(projects.userId, user.id)));
  revalidatePath('/projects');
}

export async function updateProjectStatus(id: number, status: string) {
  return updateProject(id, { status });
}

export async function updateFocusArea(id: number, currentFocusArea: string) {
  return updateProject(id, { currentFocusArea });
}