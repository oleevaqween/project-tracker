import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { portfolios, projects } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, description, color, projectIds } = body as {
    name: string;
    description?: string | null;
    color?: string;
    projectIds?: number[];
  };

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const [portfolio] = await db
    .insert(portfolios)
    .values({
      userId: session.user.id,
      name: name.trim(),
      description: description ?? null,
      color: color ?? 'amber',
    })
    .returning();

  if (projectIds && projectIds.length > 0) {
    await db
      .update(projects)
      .set({ portfolioId: portfolio.id })
      .where(inArray(projects.id, projectIds));
  }

  return NextResponse.json(portfolio, { status: 201 });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db
    .select()
    .from(portfolios)
    .where(eq(portfolios.userId, session.user.id))
    .orderBy(portfolios.createdAt);

  return NextResponse.json(rows);
}
