import { tool } from 'ai';
import { zodSchema } from 'ai';
import { z } from 'zod';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const identifyStakeholdersTool = tool({
  description: 'Identify likely stakeholders for a project based on its type and description, following PMBOK 8 stakeholder identification best practices.',
  inputSchema: zodSchema(z.object({
    projectId: z.number().describe('The project to identify stakeholders for'),
  })),
  execute: async ({ projectId }) => {
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!project) return { error: 'Project not found' };

    return {
      projectId,
      projectName: project.name,
      category: project.category,
      description: project.description,
      instruction: `For the project "${project.name}" (${project.category ?? 'general'}), identify 5-8 key stakeholders following PMBOK 8 stakeholder identification. Include internal and external stakeholders. For each: name/role, organization context, interest level (1-5), influence level (1-5), and initial engagement strategy.`,
    };
  },
});
