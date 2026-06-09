import { tool, zodSchema } from 'ai';
import { z } from 'zod';
import { db } from '@/db';
import { risks, projects } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

export const listRisksTool = tool({
  description: `List risks for a project. Use this when the user asks about project risks, potential issues, or risk management.`,
  inputSchema: zodSchema(z.object({
    projectId: z.number().describe('The project ID'),
    status: z
      .enum(['identified', 'mitigating', 'closed'])
      .optional()
      .describe('Filter by risk status'),
  })),
  execute: async ({ projectId, status }) => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    // Verify ownership
    const [project] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)));
    if (!project) return { error: 'Project not found' };

    let query = db.select().from(risks).where(eq(risks.projectId, projectId));
    const allRisks = await query;

    let filtered = allRisks;
    if (status) filtered = filtered.filter((r) => r.status === status);

    return {
      risks: filtered.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        probability: r.probability,
        impact: r.impact,
        status: r.status,
        mitigationStrategy: r.responseAction,
      })),
      total: filtered.length,
    };
  },
});