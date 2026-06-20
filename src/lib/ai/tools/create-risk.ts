import { tool, zodSchema } from 'ai';
import { z } from 'zod';

export const createRiskTool = tool({
  description: `Create a new risk in a project. Use this when the user explicitly asks to add or identify a new risk. This action requires user confirmation before executing.`,
  inputSchema: zodSchema(z.object({
    projectId: z.number().describe('The project ID to create the risk in'),
    title: z.string().describe('Risk title'),
    description: z.string().optional().describe('Risk description'),
    probability: z
      .enum(['very_low', 'low', 'medium', 'high', 'very_high'])
      .optional()
      .describe('Probability of occurrence (1-5 scale: very_low=1, low=2, medium=3, high=4, very_high=5)'),
    impact: z
      .enum(['very_low', 'low', 'medium', 'high', 'very_high'])
      .optional()
      .describe('Impact if the risk occurs (1-5 scale: very_low=1, low=2, medium=3, high=4, very_high=5)'),
    mitigationStrategy: z.string().optional().describe('How to mitigate this risk'),
  })),
  // No execute; requires client-side confirmation before running
});