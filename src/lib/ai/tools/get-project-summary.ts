import { tool, zodSchema } from 'ai';
import { z } from 'zod';
import { db } from '@/db';
import { projects, tasks, risks, stakeholders } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

export const getProjectSummaryTool = tool({
  description: `Get a comprehensive summary of a project including its status, task statistics, risk summary, and stakeholder overview. Use this when the user asks about project health, progress, or overall status.`,
  inputSchema: zodSchema(z.object({
    projectId: z.number().describe('The project ID to get a summary for'),
  })),
  execute: async ({ projectId }) => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)));

    if (!project) return { error: 'Project not found' };

    const projectTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId));

    const projectRisks = await db
      .select()
      .from(risks)
      .where(eq(risks.projectId, projectId));

    const projectStakeholders = await db
      .select()
      .from(stakeholders)
      .where(eq(stakeholders.projectId, projectId));

    const taskStats = {
      total: projectTasks.length,
      todo: projectTasks.filter((t) => t.status === 'todo').length,
      inProgress: projectTasks.filter((t) => t.status === 'in_progress').length,
      review: projectTasks.filter((t) => t.status === 'review').length,
      done: projectTasks.filter((t) => t.status === 'done').length,
    };

    const riskStats = {
      total: projectRisks.length,
      identified: projectRisks.filter((r) => r.status === 'identified').length,
      mitigating: projectRisks.filter((r) => r.status === 'mitigating').length,
      closed: projectRisks.filter((r) => r.status === 'closed').length,
    };

    return {
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        focusArea: project.currentFocusArea,
        progressPercent: project.progressPercent,
        budget: project.budget,
        startDate: project.startDate,
        targetEndDate: project.targetEndDate,
      },
      taskStats,
      riskStats,
      stakeholderCount: projectStakeholders.length,
    };
  },
});