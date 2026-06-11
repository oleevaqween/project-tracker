'use server';

import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/db';
import { issues, projects } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

type IssueInsert = typeof issues.$inferInsert;
type IssueUpdate = Partial<Omit<typeof issues.$inferInsert, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>>;

// ---------- Queries ----------

export async function getIssues(projectId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)));

  if (!project) redirect('/projects');

  return db
    .select()
    .from(issues)
    .where(eq(issues.projectId, projectId))
    .orderBy(desc(issues.createdAt));
}

export async function getIssue(id: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const rows = await db
    .select({ item: issues })
    .from(issues)
    .innerJoin(projects, and(eq(issues.projectId, projects.id), eq(projects.userId, user.id)))
    .where(eq(issues.id, id));

  return rows[0]?.item ?? null;
}

// ---------- Mutations ----------

export async function createIssue(data: Omit<IssueInsert, 'id' | 'createdAt' | 'updatedAt'>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, data.projectId!), eq(projects.userId, user.id)));
  if (!project) redirect('/projects');

  const [issue] = await db
    .insert(issues)
    .values(data as IssueInsert)
    .returning();

  revalidatePath(`/projects/${data.projectId}`);
  return issue;
}

export async function updateIssue(id: number, projectId: number, data: IssueUpdate) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [owned] = await db
    .select({ id: issues.id })
    .from(issues)
    .innerJoin(projects, and(eq(issues.projectId, projects.id), eq(projects.userId, user.id)))
    .where(eq(issues.id, id));
  if (!owned) return null;

  const [issue] = await db
    .update(issues)
    .set(data)
    .where(eq(issues.id, id))
    .returning();

  revalidatePath(`/projects/${projectId}`);
  return issue;
}

export async function deleteIssue(id: number, projectId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [owned] = await db
    .select({ id: issues.id })
    .from(issues)
    .innerJoin(projects, and(eq(issues.projectId, projects.id), eq(projects.userId, user.id)))
    .where(eq(issues.id, id));
  if (!owned) return;

  await db.delete(issues).where(eq(issues.id, id));
  revalidatePath(`/projects/${projectId}`);
}
