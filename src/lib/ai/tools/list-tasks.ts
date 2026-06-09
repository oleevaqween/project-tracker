import { tool, zodSchema } from 'ai';
import { z } from 'zod';
import { db } from '@/db';
import { tasks, projects } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

export const listTasksTool = tool({
  description: `List tasks for a project. Can filter by status and priority. Use this when the user asks about tasks, to-do items, or work items in a project.`,
  inputSchema: zodSchema(z.object({
    projectId: z.number().describe('The project ID'),
    status: z
      .enum(['todo', 'in_progress', 'review', 'done'])
      .optional()
      .describe('Filter by status'),
    priority: z
      .enum(['low', 'medium', 'high', 'critical'])
      .optional()
      .describe('Filter by priority'),
  })),
  execute: async ({ projectId, status, priority }) => {
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

    const allTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId));

    let filtered = allTasks;
    if (status) filtered = filtered.filter((t) => t.status === status);
    if (priority) filtered = filtered.filter((t) => t.priority === priority);

    return {
      tasks: filtered.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        estimatedHours: t.estimatedHours,
        wbsCode: t.wbsCode,
      })),
      total: filtered.length,
    };
  },
});