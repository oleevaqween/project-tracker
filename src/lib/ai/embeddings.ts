import { embed, embedMany } from 'ai';
import { getEmbeddingModel } from './models';
import { db } from '@/db';
import { documentChunks, documents } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 200;

/**
 * Split text into overlapping chunks for embedding.
 */
export function chunkText(
  text: string,
  chunkSize: number = CHUNK_SIZE,
  overlap: number = CHUNK_OVERLAP
): string[] {
  if (!text || text.trim().length === 0) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);
    if (chunk.trim().length > 0) {
      chunks.push(chunk);
    }
    start += chunkSize - overlap;
    if (start >= text.length) break;
  }

  return chunks;
}

/**
 * Generate embeddings for an array of text chunks using OpenAI text-embedding-3-small.
 */
export async function generateEmbeddings(texts: string[]) {
  if (texts.length === 0) return [];

  const model = getEmbeddingModel();
  const { embeddings } = await embedMany({ model, values: texts });

  return embeddings;
}

/**
 * Generate a single embedding for a query string.
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  const model = getEmbeddingModel();
  const { embedding } = await embed({ model, value: query });
  return embedding;
}

/**
 * Process a document: chunk it, embed chunks, store in documentChunks.
 * Updates document processingStatus to 'processing', then 'completed' or 'failed'.
 */
export async function processDocument(
  documentId: number,
  content: string,
  projectId: number
) {
  try {
    // Mark as processing
    await db
      .update(documents)
      .set({ processingStatus: 'processing' })
      .where(eq(documents.id, documentId));

    const chunks = chunkText(content);

    if (chunks.length === 0) {
      await db
        .update(documents)
        .set({ processingStatus: 'completed', processingError: null })
        .where(eq(documents.id, documentId));
      return;
    }

    // Generate embeddings in batches (max 100 per batch)
    const batchSize = 100;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const batchEmbeddings = await generateEmbeddings(batch);
      allEmbeddings.push(...batchEmbeddings);
    }

    // Insert chunks with embeddings
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const contentHash = crypto.createHash('sha256').update(chunk).digest('hex');
      const embedding = allEmbeddings[i];

      await db.insert(documentChunks).values({
        documentId,
        projectId,
        chunkIndex: i,
        content: chunk,
        contentHash,
        embeddingModel: 'text-embedding-3-small',
        embedding: embedding,
        tokenCount: null,
        metadata: { chunkIndex: i },
      });
    }

    await db
      .update(documents)
      .set({ processingStatus: 'completed', processingError: null })
      .where(eq(documents.id, documentId));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Document processing failed for id=${documentId}:`, errorMessage);

    await db
      .update(documents)
      .set({ processingStatus: 'failed', processingError: errorMessage })
      .where(eq(documents.id, documentId));

    throw error;
  }
}