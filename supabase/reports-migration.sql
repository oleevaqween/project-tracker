-- ============================================================
-- Reports Feature Migration
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. New columns on tasks
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS actual_hours   NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS actual_cost    NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS percent_complete INTEGER DEFAULT 0;

-- 2. New columns on projects
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS budget_spent        NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS baseline_start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS baseline_end_date   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS quality_metrics     JSONB;

-- 3. Issue log table
CREATE TABLE IF NOT EXISTS issues (
  id             SERIAL PRIMARY KEY,
  project_id     INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title          VARCHAR(500) NOT NULL,
  description    TEXT,
  impact         VARCHAR(20) DEFAULT 'medium',
  owner          VARCHAR(255),
  status         VARCHAR(50) NOT NULL DEFAULT 'open',
  resolved_date  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Project reports table
CREATE TABLE IF NOT EXISTS project_reports (
  id          SERIAL PRIMARY KEY,
  user_id     VARCHAR(36) NOT NULL,
  project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type        VARCHAR(100) NOT NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. RLS policies
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "issues_owner" ON issues
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()::text));

ALTER TABLE project_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_reports_owner" ON project_reports
  USING (user_id = auth.uid()::text);
