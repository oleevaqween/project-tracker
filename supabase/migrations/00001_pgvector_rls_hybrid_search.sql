-- ============================================================
-- Migration: pgvector extension, vector column, FTS trigger,
-- hybrid search RPC, and RLS policies
-- ============================================================

-- 1. Enable pgvector extension (must run before Drizzle migrate)
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- NOTE: The `embedding vector(1536)` column and its HNSW index are now managed by
-- the Drizzle ORM schema (src/db/schema.ts). Run `drizzle-kit generate` and
-- `drizzle-kit migrate` to apply those. This migration handles the remaining items
-- that Drizzle cannot express: the tsvector column, FTS trigger, hybrid_search RPC,
-- and RLS policies.

-- 2. Add search_vector column (tsvector — not expressible as a Drizzle column type)
ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 3. GIN index on search_vector for full-text search
CREATE INDEX IF NOT EXISTS document_chunks_search_vector_idx
  ON document_chunks USING gin (search_vector);

-- 4. Full-text search trigger — auto-populate search_vector from content
CREATE OR REPLACE FUNCTION document_chunks_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_document_chunks_search_vector ON document_chunks;
CREATE TRIGGER trg_document_chunks_search_vector
  BEFORE INSERT OR UPDATE OF content ON document_chunks
  FOR EACH ROW EXECUTE FUNCTION document_chunks_search_vector_update();

-- 5. Hybrid search RPC function (vector cosine + full-text with Reciprocal Rank Fusion)
CREATE OR REPLACE FUNCTION hybrid_search(
  query_embedding vector(1536),
  query_text text,
  match_project_id integer DEFAULT NULL,
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10,
  rrf_k int DEFAULT 60
)
RETURNS TABLE (
  id integer, document_id integer, project_id integer,
  content text, metadata jsonb, similarity float, rank_score float
) AS $$
WITH vector_results AS (
  SELECT dc.id, dc.document_id, dc.project_id, dc.content, dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity,
    ROW_NUMBER() OVER (ORDER BY dc.embedding <=> query_embedding) AS rank_ix
  FROM document_chunks dc
  WHERE dc.embedding IS NOT NULL
    AND (match_project_id IS NULL OR dc.project_id = match_project_id)
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count * 3
),
fts_results AS (
  SELECT dc.id, dc.document_id, dc.project_id, dc.content, dc.metadata,
    ts_rank_cd(dc.search_vector, websearch_to_tsquery('english', query_text)) AS fts_score,
    ROW_NUMBER() OVER (ORDER BY ts_rank_cd(dc.search_vector, websearch_to_tsquery('english', query_text)) DESC) AS rank_ix
  FROM document_chunks dc
  WHERE dc.search_vector @@ websearch_to_tsquery('english', query_text)
    AND (match_project_id IS NULL OR dc.project_id = match_project_id)
  LIMIT match_count * 3
),
combined AS (
  SELECT
    COALESCE(v.id, f.id) AS id,
    COALESCE(v.document_id, f.document_id) AS document_id,
    COALESCE(v.project_id, f.project_id) AS project_id,
    COALESCE(v.content, f.content) AS content,
    COALESCE(v.metadata, f.metadata) AS metadata,
    COALESCE(v.similarity, 0) AS similarity,
    COALESCE(1.0 / (rrf_k + v.rank_ix), 0) + COALESCE(1.0 / (rrf_k + f.rank_ix), 0) AS rank_score
  FROM vector_results v
  FULL OUTER JOIN fts_results f ON v.id = f.id
)
SELECT * FROM combined ORDER BY rank_score DESC LIMIT match_count;
$$ LANGUAGE sql STABLE;

-- ============================================================
-- 6. Row Level Security
-- ============================================================

-- Enable RLS on all data tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons_learned ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;

-- Development: permissive policy (tighten in Phase 5 for production)
-- These policies allow all access during development. Replace with owner-only policies before production.
CREATE POLICY "dev_all" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all" ON notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all" ON documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all" ON document_chunks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all" ON stakeholders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all" ON risks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all" ON change_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all" ON lessons_learned FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all" ON chat_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all" ON chat_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all" ON ai_usage_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all" ON activity_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all" ON tags FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all" ON project_tags FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all" ON task_tags FOR ALL USING (true) WITH CHECK (true);