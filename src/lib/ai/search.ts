import { generateQueryEmbedding } from './embeddings';
import { createAdminClient } from '@/lib/supabase/server';

// ---------- Types ----------

export interface SourceReference {
  chunkId: number;
  documentId: number;
  projectId: number;
  content: string;
  similarity: number;
  rankScore: number;
  metadata: Record<string, unknown> | null;
}

interface HybridSearchResult {
  id: number;
  document_id: number;
  project_id: number;
  content: string;
  metadata: Record<string, unknown> | null;
  similarity: number;
  rank_score: number;
}

/**
 * Hybrid search: calls the PostgreSQL hybrid_search RPC function
 * which combines vector cosine similarity + full-text search with Reciprocal Rank Fusion (RRF).
 */
export async function hybridSearch(params: {
  query: string;
  projectId?: number;
  matchThreshold?: number;
  matchCount?: number;
}): Promise<SourceReference[]> {
  const {
    query,
    projectId,
    matchThreshold = 0.3,
    matchCount = 8,
  } = params;

  // Refuse to search globally — always require a project scope
  if (projectId == null) {
    console.warn('[hybridSearch] called without projectId — returning empty to prevent cross-project data leak');
    return [];
  }

  const queryEmbedding = await generateQueryEmbedding(query);

  // Use Supabase admin client (bypasses RLS for vector operations)
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc('hybrid_search', {
    query_embedding: queryEmbedding,
    query_text: query,
    match_project_id: projectId ?? null,
    match_threshold: matchThreshold,
    match_count: matchCount * 3, // fetch more for reranking
  });

  if (error) {
    console.error('hybrid_search RPC error:', error);
    return [];
  }

  let results: SourceReference[] = (data as HybridSearchResult[]).map((r) => ({
    chunkId: r.id,
    documentId: r.document_id,
    projectId: r.project_id,
    content: r.content,
    similarity: r.similarity,
    rankScore: r.rank_score,
    metadata: r.metadata,
  }));

  // Rerank with Cohere if key is available
  if (process.env.COHERE_API_KEY && results.length > 0) {
    results = await rerankWithCohere(query, results, matchCount);
  }

  return results.slice(0, matchCount);
}

/**
 * Rerank results using Cohere rerank for better relevance.
 * Falls back to original ranking if Cohere fails.
 */
async function rerankWithCohere(
  query: string,
  results: SourceReference[],
  topN: number
): Promise<SourceReference[]> {
  try {
    const { CohereClientV2 } = await import('cohere-ai');
    const cohere = new CohereClientV2({ token: process.env.COHERE_API_KEY! });

    const response = await cohere.rerank({
      model: 'rerank-v3.5',
      query,
      documents: results.map((r) => r.content.slice(0, 1000)),
      topN,
    });

    // Reorder results by Cohere's relevance score
    const rerankedMap = new Map(
      response.results.map((r) => [r.index, r.relevanceScore])
    );

    return results
      .map((r, i) => ({
        ...r,
        rankScore: rerankedMap.get(i) ?? r.rankScore,
      }))
      .sort((a, b) => b.rankScore - a.rankScore);
  } catch (error) {
    console.error('Cohere rerank failed, using original ranking:', error);
    return results;
  }
}