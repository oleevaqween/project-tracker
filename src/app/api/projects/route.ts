import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db
    .select({ id: projects.id, name: projects.name, status: projects.status, portfolioId: projects.portfolioId })
    .from(projects)
    .where(eq(projects.userId, session.user.id))
    .orderBy(projects.name);

  return NextResponse.json(rows);
}
