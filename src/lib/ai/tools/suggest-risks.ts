import { tool } from 'ai';
import { zodSchema } from 'ai';
import { z } from 'zod';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const suggestRisksTool = tool({
  description: 'Suggest likely risks for a project based on its type, description, and PMBOK 8 risk domain best practices. Returns a list of risks with probability, impact, and response suggestions.',
  inputSchema: zodSchema(z.object({
    projectId: z.number().describe('The project to suggest risks for'),
  })),
  execute: async ({ projectId }) => {
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!project) return { error: 'Project not found' };

    return {
      projectId,
      projectName: project.name,
      category: project.category,
      description: project.description,
      instruction: `Based on the project "${project.name}" (${project.category ?? 'general'} project), suggest 5-8 likely risks following PMBOK 8 risk identification best practices. Include technical, schedule, resource, stakeholder, and external risks. For each risk provide: title, category, probability (1-5), impact (1-5), and a brief response strategy.`,
    };
  },
});
