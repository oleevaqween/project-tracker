import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { programs } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db
    .select({ id: programs.id, name: programs.name, portfolioId: programs.portfolioId })
    .from(programs)
    .where(eq(programs.userId, session.user.id))
    .orderBy(programs.name);

  return NextResponse.json(rows);
}
