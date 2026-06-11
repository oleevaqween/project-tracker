'use server';

import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/db';
import { lessonsLearned, projects } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

type LessonInsert = typeof lessonsLearned.$inferInsert;
type LessonUpdate = Partial<Omit<typeof lessonsLearned.$inferInsert, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>>;

// ---------- Queries ----------

export async function getLessonsLearned(projectId: number) {
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
    .from(lessonsLearned)
    .where(eq(lessonsLearned.projectId, projectId))
    .orderBy(desc(lessonsLearned.createdAt));
}

export async function getLessonLearned(id: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const rows = await db
    .select({ item: lessonsLearned })
    .from(lessonsLearned)
    .innerJoin(projects, and(eq(lessonsLearned.projectId, projects.id), eq(projects.userId, user.id)))
    .where(eq(lessonsLearned.id, id));

  return rows[0]?.item ?? null;
}

// ---------- Mutations ----------

export async function createLessonLearned(data: Omit<LessonInsert, 'id' | 'createdAt' | 'updatedAt'>) {
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

  const [lesson] = await db
    .insert(lessonsLearned)
    .values(data as LessonInsert)
    .returning();

  revalidatePath(`/projects/${data.projectId}`);
  return lesson;
}

export async function updateLessonLearned(id: number, projectId: number, data: LessonUpdate) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [owned] = await db
    .select({ id: lessonsLearned.id })
    .from(lessonsLearned)
    .innerJoin(projects, and(eq(lessonsLearned.projectId, projects.id), eq(projects.userId, user.id)))
    .where(eq(lessonsLearned.id, id));
  if (!owned) return null;

  const [lesson] = await db
    .update(lessonsLearned)
    .set(data)
    .where(eq(lessonsLearned.id, id))
    .returning();

  revalidatePath(`/projects/${projectId}`);
  return lesson;
}

export async function deleteLessonLearned(id: number, projectId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [owned] = await db
    .select({ id: lessonsLearned.id })
    .from(lessonsLearned)
    .innerJoin(projects, and(eq(lessonsLearned.projectId, projects.id), eq(projects.userId, user.id)))
    .where(eq(lessonsLearned.id, id));
  if (!owned) return;

  await db.delete(lessonsLearned).where(eq(lessonsLearned.id, id));
  revalidatePath(`/projects/${projectId}`);
}