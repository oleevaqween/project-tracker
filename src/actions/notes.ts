'use server';

import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/db';
import { notes, projects } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

type NoteInsert = typeof notes.$inferInsert;
type NoteUpdate = Partial<Omit<typeof notes.$inferInsert, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>>;

// ---------- Queries ----------

export async function getNotes(projectId: number) {
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
    .from(notes)
    .where(eq(notes.projectId, projectId))
    .orderBy(desc(notes.createdAt));
}

export async function getNote(id: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const rows = await db
    .select({ item: notes })
    .from(notes)
    .innerJoin(projects, and(eq(notes.projectId, projects.id), eq(projects.userId, user.id)))
    .where(eq(notes.id, id));

  return rows[0]?.item ?? null;
}

// ---------- Mutations ----------

export async function createNote(data: Omit<NoteInsert, 'id' | 'createdAt' | 'updatedAt'>) {
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

  const [note] = await db
    .insert(notes)
    .values(data as NoteInsert)
    .returning();

  revalidatePath(`/projects/${data.projectId}`);
  return note;
}

export async function updateNote(id: number, projectId: number, data: NoteUpdate) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [owned] = await db
    .select({ id: notes.id })
    .from(notes)
    .innerJoin(projects, and(eq(notes.projectId, projects.id), eq(projects.userId, user.id)))
    .where(eq(notes.id, id));
  if (!owned) return null;

  const [note] = await db
    .update(notes)
    .set(data)
    .where(eq(notes.id, id))
    .returning();

  revalidatePath(`/projects/${projectId}`);
  return note;
}

export async function deleteNote(id: number, projectId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [owned] = await db
    .select({ id: notes.id })
    .from(notes)
    .innerJoin(projects, and(eq(notes.projectId, projects.id), eq(projects.userId, user.id)))
    .where(eq(notes.id, id));
  if (!owned) return;

  await db.delete(notes).where(eq(notes.id, id));
  revalidatePath(`/projects/${projectId}`);
}