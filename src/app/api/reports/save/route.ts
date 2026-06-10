import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { projectReports } from '@/db/schema';
import type { ReportType } from '@/lib/reports/types';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { projectId, reportType, content }: { projectId: number; reportType: ReportType; content: string } = await req.json();

  const [report] = await db
    .insert(projectReports)
    .values({ userId: session.user.id, projectId, type: reportType, content })
    .returning();

  return NextResponse.json(report);
}
