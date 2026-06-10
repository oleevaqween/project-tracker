import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { profiles, projects, tasks, risks, stakeholders, changeRequests, lessonsLearned, issues } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getLanguageModel, type AIConfig } from '@/lib/ai/models';
import { REPORT_SYSTEM_PROMPT, buildReportPrompt, buildContext } from '@/lib/reports/prompts';
import type { ReportType } from '@/lib/reports/types';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { projectId, reportType }: { projectId: number; reportType: ReportType } = await req.json();

  // Verify project ownership
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
    .limit(1);

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  // Fetch all project data in parallel
  const [projectTasks, projectRisks, projectStakeholders, projectChangeRequests, projectLessonsLearned, projectIssues] =
    await Promise.all([
      db.select().from(tasks).where(eq(tasks.projectId, projectId)),
      db.select().from(risks).where(eq(risks.projectId, projectId)),
      db.select().from(stakeholders).where(eq(stakeholders.projectId, projectId)),
      db.select().from(changeRequests).where(eq(changeRequests.projectId, projectId)),
      db.select().from(lessonsLearned).where(eq(lessonsLearned.projectId, projectId)),
      db.select().from(issues).where(eq(issues.projectId, projectId)),
    ]);

  // Get user's AI config
  const [profile] = await db
    .select({ aiConfig: profiles.aiConfig })
    .from(profiles)
    .where(eq(profiles.id, session.user.id))
    .limit(1);

  const aiConfig = (profile?.aiConfig as AIConfig | null) ?? { provider: 'openai' as const, model: 'gpt-4o-mini' };

  let model;
  try {
    model = getLanguageModel(aiConfig);
  } catch {
    return NextResponse.json({ error: 'AI provider not configured. Check your settings.' }, { status: 400 });
  }

  const context = buildContext({
    project: project as unknown as Record<string, unknown>,
    tasks: projectTasks as unknown as Record<string, unknown>[],
    risks: projectRisks as unknown as Record<string, unknown>[],
    stakeholders: projectStakeholders as unknown as Record<string, unknown>[],
    changeRequests: projectChangeRequests as unknown as Record<string, unknown>[],
    lessonsLearned: projectLessonsLearned as unknown as Record<string, unknown>[],
    issues: projectIssues as unknown as Record<string, unknown>[],
  });

  const prompt = buildReportPrompt(reportType, context);

  const result = streamText({
    model,
    system: REPORT_SYSTEM_PROMPT,
    prompt,
    maxOutputTokens: 4000,
  });

  return result.toTextStreamResponse();
}
