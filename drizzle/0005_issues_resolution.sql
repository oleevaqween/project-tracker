-- Issue 6: stakeholder engagement date
ALTER TABLE stakeholders
  ADD COLUMN IF NOT EXISTS last_engaged_date timestamp;

-- Issue 8: per-user PMBOK 8 principles self-assessment
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS principles_reflection jsonb;

-- Issue 3: task checklist items (sub-activities from WBS children)
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS checklist_items jsonb DEFAULT '[]'::jsonb;

-- Issue 5: task start date for Gantt
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS start_date timestamp;
