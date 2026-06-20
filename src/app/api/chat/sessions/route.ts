import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { chatSessions } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/chat/sessions: List user's chat sessions
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const sessions = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.userId, user.id))
    .orderBy(desc(chatSessions.updatedAt));

  return Response.json(sessions);
}

// POST /api/chat/sessions: Create a new chat session
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { projectId, title } = await request.json();

  const [session] = await db
    .insert(chatSessions)
    .values({
      userId: user.id,
      projectId: projectId ?? null,
      title: title ?? 'New Chat',
    })
    .returning();

  return Response.json(session);
}