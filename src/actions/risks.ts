'use server';

import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/db';
import { risks, projects } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

type RiskInsert = typeof risks.$inferInsert;
type RiskUpdate = Partial<Omit<typeof risks.$inferInsert, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>>;

// ---------- Queries ----------

export async function getRisks(projectId: number) {
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
    .from(risks)
    .where(eq(risks.projectId, projectId))
    .orderBy(desc(risks.riskScore));
}

export async function getRisk(id: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const rows = await db
    .select({ item: risks })
    .from(risks)
    .innerJoin(projects, and(eq(risks.projectId, projects.id), eq(projects.userId, user.id)))
    .where(eq(risks.id, id));

  return rows[0]?.item ?? null;
}

// ---------- Mutations ----------

export async function createRisk(data: Omit<RiskInsert, 'id' | 'createdAt' | 'updatedAt'>) {
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

  const [risk] = await db
    .insert(risks)
    .values(data as RiskInsert)
    .returning();

  revalidatePath(`/projects/${data.projectId}`);
  return risk;
}

export async function updateRisk(id: number, projectId: number, data: RiskUpdate) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [owned] = await db
    .select({ id: risks.id })
    .from(risks)
    .innerJoin(projects, and(eq(risks.projectId, projects.id), eq(projects.userId, user.id)))
    .where(eq(risks.id, id));
  if (!owned) return null;

  const [risk] = await db
    .update(risks)
    .set(data)
    .where(eq(risks.id, id))
    .returning();

  revalidatePath(`/projects/${projectId}`);
  return risk;
}

export async function deleteRisk(id: number, projectId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [owned] = await db
    .select({ id: risks.id })
    .from(risks)
    .innerJoin(projects, and(eq(risks.projectId, projects.id), eq(projects.userId, user.id)))
    .where(eq(risks.id, id));
  if (!owned) return;

  await db.delete(risks).where(eq(risks.id, id));
  revalidatePath(`/projects/${projectId}`);
}