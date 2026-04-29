CREATE TABLE IF NOT EXISTS mirofish_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  objective TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  owner_token_hash TEXT,
  source_mode TEXT NOT NULL DEFAULT 'prompt_only',
  source_reference TEXT,
  focus_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
  platforms JSONB NOT NULL DEFAULT '["twitter","reddit"]'::jsonb,
  latest_scenario_id UUID,
  report_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE mirofish_scenarios
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES mirofish_projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_mirofish_projects_user_id ON mirofish_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_mirofish_projects_owner_token_hash ON mirofish_projects(owner_token_hash);
CREATE INDEX IF NOT EXISTS idx_mirofish_projects_status ON mirofish_projects(status);
CREATE INDEX IF NOT EXISTS idx_mirofish_scenarios_project_id ON mirofish_scenarios(project_id);

DROP TRIGGER IF EXISTS mirofish_update_projects_updated_at ON mirofish_projects;
CREATE TRIGGER mirofish_update_projects_updated_at
  BEFORE UPDATE ON mirofish_projects
  FOR EACH ROW
  EXECUTE FUNCTION mirofish_update_updated_at_column();

ALTER TABLE mirofish_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own mirofish projects" ON mirofish_projects;
CREATE POLICY "Users can view own mirofish projects" ON mirofish_projects
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own mirofish projects" ON mirofish_projects;
CREATE POLICY "Users can insert own mirofish projects" ON mirofish_projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own mirofish projects" ON mirofish_projects;
CREATE POLICY "Users can update own mirofish projects" ON mirofish_projects
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own mirofish projects" ON mirofish_projects;
CREATE POLICY "Users can delete own mirofish projects" ON mirofish_projects
  FOR DELETE
  USING (auth.uid() = user_id);
