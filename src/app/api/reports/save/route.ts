import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { projectReports, projects } from '@/db/schema';
import { and, eq, desc } from 'drizzle-orm';
import type { ReportType } from '@/lib/reports/types';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const projectId = req.nextUrl.searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });

  const reports = await db
    .select()
    .from(projectReports)
    .where(and(
      eq(projectReports.projectId, Number(projectId)),
      eq(projectReports.userId, session.user.id),
    ))
    .orderBy(desc(projectReports.createdAt));

  return NextResponse.json(reports);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { projectId, reportType, content }: { projectId: number; reportType: ReportType; content: string } = await req.json();

  // Verify the user owns this project before saving a report to it
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
    .limit(1);

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  const [report] = await db
    .insert(projectReports)
    .values({ userId: session.user.id, projectId, type: reportType, content })
    .returning();

  return NextResponse.json(report);
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const reportId = req.nextUrl.searchParams.get('id');
  if (!reportId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  await db
    .delete(projectReports)
    .where(and(
      eq(projectReports.id, Number(reportId)),
      eq(projectReports.userId, session.user.id),
    ));

  return NextResponse.json({ success: true });
}
