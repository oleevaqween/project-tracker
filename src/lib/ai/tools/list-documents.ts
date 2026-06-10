import { tool, zodSchema } from 'ai';
import { z } from 'zod';
import { db } from '@/db';
import { documents, documentChunks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const listDocumentsTool = tool({
  description: `List all documents uploaded to a project's knowledge base and show a content preview of each. Use this whenever the user asks what files are in the knowledge base, wants a summary of uploaded documents, or asks "what do you know about this project" before doing a targeted search. Always call this before searching the knowledge base for a broad summary request.`,
  inputSchema: zodSchema(z.object({
    projectId: z.number().describe('The project ID to list documents for'),
  })),
  execute: async ({ projectId }) => {
    const docs = await db
      .select({
        id: documents.id,
        fileName: documents.fileName,
        fileType: documents.fileType,
        processingStatus: documents.processingStatus,
        createdAt: documents.createdAt,
      })
      .from(documents)
      .where(and(eq(documents.projectId, projectId), eq(documents.processingStatus, 'completed')));

    if (docs.length === 0) {
      return { found: false, message: 'No completed documents found in the knowledge base for this project.' };
    }

    const previews = await Promise.all(
      docs.map(async (doc) => {
        const chunks = await db
          .select({ content: documentChunks.content })
          .from(documentChunks)
          .where(and(eq(documentChunks.documentId, doc.id), eq(documentChunks.chunkIndex, 0)))
          .limit(1);

        return {
          id: doc.id,
          fileName: doc.fileName,
          fileType: doc.fileType.toUpperCase(),
          preview: chunks[0]?.content.slice(0, 600) ?? '(no preview)',
        };
      })
    );

    return {
      found: true,
      documentCount: docs.length,
      documents: previews,
      hint: 'Use searchKnowledgeBase with specific topics from these documents to retrieve detailed information.',
    };
  },
});
