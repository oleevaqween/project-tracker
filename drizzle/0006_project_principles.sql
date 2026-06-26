-- 0006: add principles_reflection JSONB column to projects table
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS principles_reflection jsonb;
