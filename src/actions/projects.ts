'use server';

import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { recomputeProjectProgress } from './tasks';
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

const PHASE_WEIGHTS: Record<string, number> = {
  initiating: 10,
  planning: 25,
  executing: 50,
  monitoring_controlling: 75,
  closing: 90,
};

export async function updateProject(id: number, data: ProjectUpdate) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const patch: ProjectUpdate = { ...data };

  // When reverting away from completed, clear the completion stamp and reset
  // progress to the phase weight so it reflects the new phase, not stale tasks
  if (patch.status && patch.status !== 'completed') {
    const [current] = await db
      .select({ status: projects.status })
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, user.id)));

    if (current?.status === 'completed') {
      patch.completedDate = null;
      if (patch.currentFocusArea) {
        patch.progressPercent = PHASE_WEIGHTS[patch.currentFocusArea as string] ?? 10;
      }
    }
  }

  const [project] = await db
    .update(projects)
    .set(patch)
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
  // Auto-advance status: planning → in_progress when entering execution phases
  // Never overwrite on_hold or archived; those are intentional manual states
  const [current] = await db.select({ status: projects.status }).from(projects).where(eq(projects.id, id));
  const autoStatus =
    current?.status === 'planning' &&
    ['executing', 'monitoring_controlling', 'closing'].includes(currentFocusArea)
      ? 'in_progress'
      : undefined;

  await updateProject(id, { currentFocusArea, ...(autoStatus ? { status: autoStatus } : {}) });
  await recomputeProjectProgress(id);
  const [updated] = await db
    .select({ progressPercent: projects.progressPercent, status: projects.status })
    .from(projects)
    .where(eq(projects.id, id));
  revalidatePath(`/projects/${id}`);
  revalidatePath('/projects');
  return { progressPercent: updated?.progressPercent ?? null, status: updated?.status ?? null };
}

export async function completeProject(id: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [project] = await db
    .update(projects)
    .set({ status: 'completed', completedDate: new Date(), progressPercent: 100 })
    .where(and(eq(projects.id, id), eq(projects.userId, user.id)))
    .returning();

  revalidatePath(`/projects/${id}`);
  revalidatePath('/projects');
  return project;
}

type LegacySummary = NonNullable<typeof projects.$inferSelect['legacySummary']>;

export async function createLegacyProject(data: {
  name: string;
  description?: string | null;
  category?: string | null;
  portfolioId?: number | null;
  startDate?: Date | null;
  completedDate?: Date | null;
  legacySummary?: LegacySummary;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [project] = await db
    .insert(projects)
    .values({
      ...data,
      userId: user.id,
      isLegacy: true,
      status: 'completed',
      updatedAt: new Date(),
    } as ProjectInsert)
    .returning();

  revalidatePath('/projects');
  return project;
}

export async function updateLegacySummary(id: number, legacySummary: LegacySummary) {
  return updateProject(id, { legacySummary });
}