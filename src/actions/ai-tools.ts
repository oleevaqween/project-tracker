'use server';

import { db } from '@/db';
import { tasks, risks, lessonsLearned, projects } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const probabilityMap: Record<string, number> = {
  very_low: 1, low: 2, medium: 3, high: 4, very_high: 5,
};

export async function aiCreateTask(input: {
  projectId: number;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [project] = await db.select({ id: projects.id }).from(projects)
    .where(and(eq(projects.id, input.projectId), eq(projects.userId, user.id)));
  if (!project) return { error: 'Project not found' };

  const [maxOrder] = await db
    .select({ val: sql<number>`coalesce(max(${tasks.orderIndex}), -1) + 1` })
    .from(tasks).where(eq(tasks.projectId, input.projectId));

  const [task] = await db.insert(tasks).values({
    projectId: input.projectId,
    title: input.title,
    description: input.description ?? null,
    status: 'todo',
    priority: input.priority ?? 'medium',
    dueDate: input.dueDate ? new Date(input.dueDate) : null,
    orderIndex: maxOrder?.val ?? 0,
  } as typeof tasks.$inferInsert).returning();

  revalidatePath(`/projects/${input.projectId}`);
  return { success: true, task: { id: task.id, title: task.title, status: task.status, priority: task.priority } };
}

export async function aiCreateRisk(input: {
  projectId: number;
  title: string;
  description?: string;
  probability?: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  impact?: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  mitigationStrategy?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [project] = await db.select({ id: projects.id }).from(projects)
    .where(and(eq(projects.id, input.projectId), eq(projects.userId, user.id)));
  if (!project) return { error: 'Project not found' };

  const [risk] = await db.insert(risks).values({
    projectId: input.projectId,
    title: input.title,
    description: input.description ?? null,
    probability: probabilityMap[input.probability ?? 'medium'] ?? 3,
    impact: probabilityMap[input.impact ?? 'medium'] ?? 3,
    status: 'identified',
    responseAction: input.mitigationStrategy ?? null,
  } as typeof risks.$inferInsert).returning();

  revalidatePath(`/projects/${input.projectId}`);
  return { success: true, risk: { id: risk.id, title: risk.title, probability: risk.probability, impact: risk.impact } };
}

export async function aiLogLesson(input: {
  projectId: number;
  title: string;
  description: string;
  focusArea?: string;
  category?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [project] = await db.select({ id: projects.id }).from(projects)
    .where(and(eq(projects.id, input.projectId), eq(projects.userId, user.id)));
  if (!project) return { error: 'Project not found' };

  const [lesson] = await db.insert(lessonsLearned).values({
    projectId: input.projectId,
    title: input.title,
    description: input.description,
    focusArea: input.focusArea ?? null,
    category: input.category ?? null,
  } as typeof lessonsLearned.$inferInsert).returning();

  revalidatePath(`/projects/${input.projectId}`);
  return { success: true, lesson: { id: lesson.id, title: lesson.title } };
}
