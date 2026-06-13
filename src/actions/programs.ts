'use server';

import { revalidatePath } from 'next/cache';
import { eq, and } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { programs, projects } from '@/db/schema';

async function getAuthUserId(): Promise<string> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Unauthorized');
  return session.user.id;
}

export async function createProgram(input: {
  name: string;
  description?: string | null;
  objectives?: string | null;
  portfolioId?: number | null;
  status?: string;
  startDate?: Date | null;
  targetEndDate?: Date | null;
}) {
  const userId = await getAuthUserId();
  const [program] = await db.insert(programs).values({
    userId,
    name: input.name,
    description: input.description ?? null,
    objectives: input.objectives ?? null,
    portfolioId: input.portfolioId ?? null,
    status: input.status ?? 'active',
    startDate: input.startDate ?? null,
    targetEndDate: input.targetEndDate ?? null,
  }).returning();
  revalidatePath('/programs');
  return program;
}

export async function updateProgram(id: number, input: {
  name?: string;
  description?: string | null;
  objectives?: string | null;
  portfolioId?: number | null;
  status?: string;
  startDate?: Date | null;
  targetEndDate?: Date | null;
}) {
  const userId = await getAuthUserId();
  const [program] = await db
    .update(programs)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(programs.id, id), eq(programs.userId, userId)))
    .returning();
  revalidatePath('/programs');
  revalidatePath(`/programs/${id}`);
  return program;
}

export async function deleteProgram(id: number) {
  const userId = await getAuthUserId();
  // Unassign all projects from this program first
  await db
    .update(projects)
    .set({ programId: null })
    .where(eq(projects.programId, id));
  await db
    .delete(programs)
    .where(and(eq(programs.id, id), eq(programs.userId, userId)));
  revalidatePath('/programs');
}

export async function getProgramsByPortfolio(portfolioId: number) {
  const userId = await getAuthUserId();
  return db.select().from(programs).where(
    and(eq(programs.userId, userId), eq(programs.portfolioId, portfolioId))
  );
}

export async function getAllPrograms() {
  const userId = await getAuthUserId();
  return db.select().from(programs).where(eq(programs.userId, userId));
}

export async function assignProjectToProgram(projectId: number, programId: number | null) {
  const userId = await getAuthUserId();
  await db
    .update(projects)
    .set({ programId, updatedAt: new Date() })
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
  revalidatePath('/programs');
  revalidatePath('/projects');
}
