-- ============================================================
-- PRODUCTION RLS POLICIES
-- Run this in Supabase SQL Editor when deploying to production.
-- Replace the dev permissive policy with owner-only access.
-- NOTE: user_id columns are varchar; auth.uid() is uuid — cast required.
-- ============================================================

-- ============ PROFILES ============
DROP POLICY IF EXISTS "dev_all" ON profiles;
CREATE POLICY "profiles_owner" ON profiles
  FOR ALL USING (id = auth.uid()::text);
CREATE POLICY "profiles_public_read" ON profiles
  FOR SELECT USING (true);

-- ============ PORTFOLIOS ============
DROP POLICY IF EXISTS "dev_all" ON portfolios;
CREATE POLICY "portfolios_owner" ON portfolios
  FOR ALL USING (user_id = auth.uid()::text);

-- ============ PROJECTS ============
DROP POLICY IF EXISTS "dev_all" ON projects;
CREATE POLICY "projects_owner" ON projects
  FOR ALL USING (user_id = auth.uid()::text);
CREATE POLICY "projects_public_read" ON projects
  FOR SELECT USING (is_public = true);

-- ============ TASKS ============
DROP POLICY IF EXISTS "dev_all" ON tasks;
CREATE POLICY "tasks_owner" ON tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = tasks.project_id AND p.user_id = auth.uid()::text
    )
  );
CREATE POLICY "tasks_public_read" ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = tasks.project_id AND p.is_public = true
    )
  );

-- ============ NOTES ============
DROP POLICY IF EXISTS "dev_all" ON notes;
CREATE POLICY "notes_owner" ON notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = notes.project_id AND p.user_id = auth.uid()::text
    )
  );

-- ============ DOCUMENTS ============
DROP POLICY IF EXISTS "dev_all" ON documents;
CREATE POLICY "documents_owner" ON documents
  FOR ALL USING (user_id = auth.uid()::text);

-- ============ DOCUMENT_CHUNKS ============
DROP POLICY IF EXISTS "dev_all" ON document_chunks;
CREATE POLICY "document_chunks_owner" ON document_chunks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = document_chunks.project_id AND p.user_id = auth.uid()::text
    )
  );

-- ============ TAGS ============
DROP POLICY IF EXISTS "dev_all" ON tags;
CREATE POLICY "tags_owner" ON tags
  FOR ALL USING (user_id = auth.uid()::text);

-- ============ PROJECT_TAGS ============
DROP POLICY IF EXISTS "dev_all" ON project_tags;
CREATE POLICY "project_tags_owner" ON project_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_tags.project_id AND p.user_id = auth.uid()::text
    )
  );

-- ============ TASK_TAGS ============
DROP POLICY IF EXISTS "dev_all" ON task_tags;
CREATE POLICY "task_tags_owner" ON task_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE t.id = task_tags.task_id AND p.user_id = auth.uid()::text
    )
  );

-- ============ ACTIVITY_LOG ============
DROP POLICY IF EXISTS "dev_all" ON activity_log;
CREATE POLICY "activity_log_owner" ON activity_log
  FOR ALL USING (user_id = auth.uid()::text);

-- ============ STAKEHOLDERS ============
DROP POLICY IF EXISTS "dev_all" ON stakeholders;
CREATE POLICY "stakeholders_owner" ON stakeholders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = stakeholders.project_id AND p.user_id = auth.uid()::text
    )
  );

-- ============ RISKS ============
DROP POLICY IF EXISTS "dev_all" ON risks;
CREATE POLICY "risks_owner" ON risks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = risks.project_id AND p.user_id = auth.uid()::text
    )
  );
CREATE POLICY "risks_public_read" ON risks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = risks.project_id AND p.is_public = true
    )
  );

-- ============ CHANGE_REQUESTS ============
DROP POLICY IF EXISTS "dev_all" ON change_requests;
CREATE POLICY "change_requests_owner" ON change_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = change_requests.project_id AND p.user_id = auth.uid()::text
    )
  );

-- ============ LESSONS_LEARNED ============
DROP POLICY IF EXISTS "dev_all" ON lessons_learned;
CREATE POLICY "lessons_learned_owner" ON lessons_learned
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = lessons_learned.project_id AND p.user_id = auth.uid()::text
    )
  );

-- ============ CHAT_SESSIONS ============
DROP POLICY IF EXISTS "dev_all" ON chat_sessions;
CREATE POLICY "chat_sessions_owner" ON chat_sessions
  FOR ALL USING (user_id = auth.uid()::text);

-- ============ CHAT_MESSAGES ============
DROP POLICY IF EXISTS "dev_all" ON chat_messages;
CREATE POLICY "chat_messages_owner" ON chat_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM chat_sessions cs
      WHERE cs.id = chat_messages.session_id AND cs.user_id = auth.uid()::text
    )
  );

-- ============ AI_USAGE_LOG ============
DROP POLICY IF EXISTS "dev_all" ON ai_usage_log;
CREATE POLICY "ai_usage_log_owner" ON ai_usage_log
  FOR ALL USING (user_id = auth.uid()::text);

-- ============ ISSUES ============
DROP POLICY IF EXISTS "dev_all" ON issues;
CREATE POLICY "issues_owner" ON issues
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = issues.project_id AND p.user_id = auth.uid()::text
    )
  );

-- ============ PROJECT_REPORTS ============
DROP POLICY IF EXISTS "dev_all" ON project_reports;
CREATE POLICY "project_reports_owner" ON project_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_reports.project_id AND p.user_id = auth.uid()::text
    )
  );
