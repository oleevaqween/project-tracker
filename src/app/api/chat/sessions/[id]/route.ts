import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { chatSessions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// PATCH /api/chat/sessions/[id] — Update session title
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { title } = await request.json();
  if (!title) return Response.json({ error: 'Title is required' }, { status: 400 });

  const [updated] = await db
    .update(chatSessions)
    .set({ title })
    .where(and(eq(chatSessions.id, parseInt(id)), eq(chatSessions.userId, user.id)))
    .returning();

  if (!updated) return Response.json({ error: 'Session not found' }, { status: 404 });
  return Response.json(updated);
}

// DELETE /api/chat/sessions/[id] — Delete a session
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  await db
    .delete(chatSessions)
    .where(and(eq(chatSessions.id, parseInt(id)), eq(chatSessions.userId, user.id)));

  return Response.json({ success: true });
}