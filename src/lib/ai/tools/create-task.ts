import { tool, zodSchema } from 'ai';
import { z } from 'zod';

export const createTaskTool = tool({
  description: `Create a new task in a project. Use this when the user explicitly asks to add, create, or set up a new task. This action requires user confirmation before executing.`,
  inputSchema: zodSchema(z.object({
    projectId: z.number().describe('The project ID to create the task in'),
    title: z.string().describe('Task title'),
    description: z.string().optional().describe('Task description'),
    priority: z
      .enum(['low', 'medium', 'high', 'critical'])
      .optional()
      .describe('Task priority (default: medium)'),
    dueDate: z.string().optional().describe('Due date in ISO format (YYYY-MM-DD)'),
  })),
  // No execute — requires client-side confirmation before running
});