import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { portfolios, projects } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const body = await req.json();
  const { name, description, color } = body as { name?: string; description?: string | null; color?: string };

  const [updated] = await db
    .update(portfolios)
    .set({
      ...(name ? { name: name.trim() } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(color ? { color } : {}),
    })
    .where(and(eq(portfolios.id, id), eq(portfolios.userId, session.user.id)))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  // Unassign projects from this portfolio before deleting
  await db
    .update(projects)
    .set({ portfolioId: null })
    .where(and(eq(projects.portfolioId, id), eq(projects.userId, session.user.id)));

  const [deleted] = await db
    .delete(portfolios)
    .where(and(eq(portfolios.id, id), eq(portfolios.userId, session.user.id)))
    .returning();

  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
