-- ============================================================
-- RAG Setup — Run this in the Supabase SQL Editor
-- Project Tracker — RAG Pipeline Setup
-- ============================================================
-- Run each section in order. If a step fails, check the error
-- before continuing. Steps are idempotent (safe to re-run).
-- ============================================================


-- STEP 1: Enable pgvector extension
-- ============================================================
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;


-- STEP 2: Full-text search column + trigger on document_chunks
-- ============================================================
-- Add the search_vector column if it doesn't exist yet
ALTER TABLE document_chunks
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Populate existing rows
UPDATE document_chunks
  SET search_vector = to_tsvector('english', COALESCE(content, ''))
  WHERE search_vector IS NULL;

-- GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS document_chunks_fts_idx
  ON document_chunks USING GIN (search_vector);

-- Trigger function: keep search_vector in sync with content
CREATE OR REPLACE FUNCTION document_chunks_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger (drop first to make this re-runnable)
DROP TRIGGER IF EXISTS trg_document_chunks_search_vector ON document_chunks;
CREATE TRIGGER trg_document_chunks_search_vector
  BEFORE INSERT OR UPDATE OF content ON document_chunks
  FOR EACH ROW EXECUTE FUNCTION document_chunks_search_vector_update();


-- STEP 3: HNSW index for vector similarity search
-- ============================================================
-- This index makes cosine similarity search fast at scale.
-- Drop first to allow re-running.
DROP INDEX IF EXISTS document_chunks_embedding_idx;
CREATE INDEX document_chunks_embedding_idx
  ON document_chunks
  USING hnsw (embedding extensions.vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);


-- STEP 4: hybrid_search RPC function
-- ============================================================
-- Combines pgvector cosine similarity + full-text search
-- using Reciprocal Rank Fusion (RRF, k=60).
-- Returns results ranked by combined score.
CREATE OR REPLACE FUNCTION hybrid_search(
  query_embedding extensions.vector(1536),
  query_text       text,
  match_project_id integer  DEFAULT NULL,
  match_threshold  float    DEFAULT 0.3,
  match_count      integer  DEFAULT 30,
  rrf_k            integer  DEFAULT 60
)
RETURNS TABLE (
  id           integer,
  document_id  integer,
  project_id   integer,
  content      text,
  metadata     jsonb,
  similarity   float,
  rank_score   float
)
LANGUAGE sql STABLE
AS $$
WITH vector_results AS (
  SELECT
    dc.id,
    dc.document_id,
    dc.project_id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity,
    ROW_NUMBER() OVER (ORDER BY dc.embedding <=> query_embedding) AS rank_ix
  FROM document_chunks dc
  WHERE
    dc.embedding IS NOT NULL
    AND (match_project_id IS NULL OR dc.project_id = match_project_id)
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count * 3
),
fts_results AS (
  SELECT
    dc.id,
    dc.document_id,
    dc.project_id,
    dc.content,
    dc.metadata,
    ts_rank_cd(dc.search_vector, websearch_to_tsquery('english', query_text)) AS fts_score,
    ROW_NUMBER() OVER (
      ORDER BY ts_rank_cd(dc.search_vector, websearch_to_tsquery('english', query_text)) DESC
    ) AS rank_ix
  FROM document_chunks dc
  WHERE
    dc.search_vector @@ websearch_to_tsquery('english', query_text)
    AND (match_project_id IS NULL OR dc.project_id = match_project_id)
  LIMIT match_count * 3
),
combined AS (
  SELECT
    COALESCE(v.id,          f.id)          AS id,
    COALESCE(v.document_id, f.document_id) AS document_id,
    COALESCE(v.project_id,  f.project_id)  AS project_id,
    COALESCE(v.content,     f.content)     AS content,
    COALESCE(v.metadata,    f.metadata)    AS metadata,
    COALESCE(v.similarity,  0)             AS similarity,
    COALESCE(1.0 / (rrf_k + v.rank_ix), 0)
      + COALESCE(1.0 / (rrf_k + f.rank_ix), 0) AS rank_score
  FROM vector_results v
  FULL OUTER JOIN fts_results f ON v.id = f.id
)
SELECT * FROM combined
ORDER BY rank_score DESC
LIMIT match_count;
$$;


-- STEP 5: Storage bucket for documents
-- ============================================================
-- Run this only if the "documents" bucket does not yet exist.
-- (Check Storage → Buckets in the Supabase dashboard first.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760,  -- 10MB
  ARRAY[
    'application/pdf',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/csv'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: only owners can upload/read/delete their own documents
CREATE POLICY IF NOT EXISTS "documents_owner_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY IF NOT EXISTS "documents_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY IF NOT EXISTS "documents_owner_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);


-- ============================================================
-- Done. Verify with:
--   SELECT proname FROM pg_proc WHERE proname = 'hybrid_search';
--   SELECT * FROM pg_indexes WHERE tablename = 'document_chunks';
-- ============================================================
