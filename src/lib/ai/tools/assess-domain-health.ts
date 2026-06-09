import { tool } from 'ai';
import { zodSchema } from 'ai';
import { z } from 'zod';
import { db } from '@/db';
import { projects, tasks, risks, stakeholders, changeRequests } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { computeDomainHealth } from '@/lib/domain-health';

export const assessDomainHealthTool = tool({
  description: 'Assess the health of all 7 PMBOK performance domains for a project based on actual data. Returns Red/Amber/Green scores with detailed metrics and improvement recommendations.',
  inputSchema: zodSchema(z.object({
    projectId: z.number().describe('The project ID to assess'),
  })),
  execute: async ({ projectId }) => {
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!project) return { error: 'Project not found' };

    const [projectTasks, projectRisks, projectStakeholders, projectCRs] = await Promise.all([
      db.select().from(tasks).where(eq(tasks.projectId, projectId)),
      db.select().from(risks).where(eq(risks.projectId, projectId)),
      db.select().from(stakeholders).where(eq(stakeholders.projectId, projectId)),
      db.select().from(changeRequests).where(eq(changeRequests.projectId, projectId)),
    ]);

    const health = computeDomainHealth(
      project,
      projectTasks,
      projectRisks,
      projectStakeholders,
      projectCRs,
    );

    return {
      projectName: project.name,
      overallScore: health.overallScore,
      overallStatus: health.overallStatus,
      domains: health.domains.map(d => ({
        name: d.name,
        score: d.score,
        status: d.status,
        detail: d.detail,
      })),
      summary: `${project.name} has an overall domain health score of ${health.overallScore}/100 (${health.overallStatus.toUpperCase()}). ${health.domains.filter(d => d.status === 'red').length} domain(s) need immediate attention.`,
    };
  },
});
