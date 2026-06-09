import { tool, zodSchema } from 'ai';
import { z } from 'zod';

export const logLessonLearnedTool = tool({
  description: `Log a lesson learned for a project. Use this when the user explicitly shares a lesson, insight, or takeaway from a project experience. This action requires user confirmation before executing.`,
  inputSchema: zodSchema(z.object({
    projectId: z.number().describe('The project ID'),
    title: z.string().describe('Short title for the lesson'),
    description: z.string().describe('Detailed description of the lesson learned'),
    focusArea: z
      .enum([
        'initiating',
        'planning',
        'executing',
        'monitoring_controlling',
        'closing',
      ])
      .optional()
      .describe('PMBOK focus area this lesson relates to'),
    category: z.string().optional().describe('Category or domain of the lesson'),
  })),
  // No execute — requires client-side confirmation before running
});