'use server';

import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '@/db';
import { tasks, projects } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

type TaskInsert = typeof tasks.$inferInsert;
type TaskUpdate = Partial<Omit<typeof tasks.$inferInsert, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>>;

// ---------- Queries ----------

export async function getTasks(projectId: number) {
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
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .orderBy(tasks.orderIndex, desc(tasks.createdAt));
}

export async function getTask(id: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const rows = await db
    .select({ item: tasks })
    .from(tasks)
    .innerJoin(projects, and(eq(tasks.projectId, projects.id), eq(projects.userId, user.id)))
    .where(eq(tasks.id, id));

  return rows[0]?.item ?? null;
}

// ---------- Mutations ----------

export async function createTask(data: Omit<TaskInsert, 'id' | 'createdAt' | 'updatedAt'>) {
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

  // Get max orderIndex for this project
  const [maxOrder] = await db
    .select({ maxOrder: sql<number>`coalesce(max(${tasks.orderIndex}), -1) + 1` })
    .from(tasks)
    .where(eq(tasks.projectId, data.projectId!));

  const orderIndex = data.orderIndex ?? maxOrder?.maxOrder ?? 0;

  const [task] = await db
    .insert(tasks)
    .values({ ...data, orderIndex } as TaskInsert)
    .returning();

  revalidatePath(`/projects/${data.projectId}`);
  return task;
}

export async function updateTask(id: number, projectId: number, data: TaskUpdate) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [owned] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .innerJoin(projects, and(eq(tasks.projectId, projects.id), eq(projects.userId, user.id)))
    .where(eq(tasks.id, id));
  if (!owned) return null;

  const [task] = await db
    .update(tasks)
    .set(data)
    .where(eq(tasks.id, id))
    .returning();

  revalidatePath(`/projects/${projectId}`);
  return task;
}

export async function deleteTask(id: number, projectId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [owned] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .innerJoin(projects, and(eq(tasks.projectId, projects.id), eq(projects.userId, user.id)))
    .where(eq(tasks.id, id));
  if (!owned) return;

  await db.delete(tasks).where(eq(tasks.id, id));
  revalidatePath(`/projects/${projectId}`);
}

export async function updateTaskStatus(id: number, projectId: number, status: string) {
  const updateData: TaskUpdate = { status };
  if (status === 'done') {
    updateData.completedDate = new Date();
  }
  return updateTask(id, projectId, updateData);
}