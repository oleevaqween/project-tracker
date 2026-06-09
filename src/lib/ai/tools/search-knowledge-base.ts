import { tool, zodSchema } from 'ai';
import { z } from 'zod';
import { hybridSearch } from '../search';

export const searchKnowledgeBaseTool = tool({
  description: `Search the project's knowledge base for relevant information. Use this tool when the user asks questions about project documents, requirements, specifications, research, or any topic that might be documented in uploaded files. Also use when the user wants context about past decisions, lessons learned, or historical project information.`,
  inputSchema: zodSchema(z.object({
    query: z.string().describe('The search query to find relevant documents'),
    projectId: z.number().optional().describe('The project ID to search within. If not provided, searches across all projects.'),
  })),
  execute: async ({ query, projectId }) => {
    try {
      const results = await hybridSearch({
        query,
        projectId: projectId ?? undefined,
        matchThreshold: 0.3,
        matchCount: 6,
      });

      if (results.length === 0) {
        return { found: false, message: 'No relevant documents found in the knowledge base.' };
      }

      return {
        found: true,
        sources: results.map((r) => ({
          chunkId: r.chunkId,
          documentId: r.documentId,
          projectId: r.projectId,
          content: r.content.slice(0, 500),
          similarity: Math.round(r.similarity * 100) / 100,
          rankScore: Math.round(r.rankScore * 100) / 100,
        })),
      };
    } catch (error) {
      console.error('searchKnowledgeBase error:', error);
      return { found: false, message: 'Search failed due to an error. This may be because embeddings are not set up yet.' };
    }
  },
});