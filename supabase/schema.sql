-- MiroFish Visualizer Database Schema

-- Enable RLS
alter table if exists scenarios enable row level security;

-- Scenarios table
CREATE TABLE IF NOT EXISTS scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  seed_text TEXT,
  uploaded_file JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  parameters JSONB NOT NULL DEFAULT '{"agentCount": 50, "simulationRounds": 100, "temperature": 0.7}',
  results JSONB,
  user_id UUID REFERENCES auth.users(id)
);

-- Create index for user queries
CREATE INDEX IF NOT EXISTS idx_scenarios_user_id ON scenarios(user_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_status ON scenarios(status);
CREATE INDEX IF NOT EXISTS idx_scenarios_created_at ON scenarios(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER IF NOT EXISTS update_scenarios_updated_at
  BEFORE UPDATE ON scenarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies

-- Allow users to view their own scenarios
CREATE POLICY "Users can view own scenarios" ON scenarios
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own scenarios
CREATE POLICY "Users can insert own scenarios" ON scenarios
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own scenarios
CREATE POLICY "Users can update own scenarios" ON scenarios
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own scenarios
CREATE POLICY "Users can delete own scenarios" ON scenarios
  FOR DELETE
  USING (auth.uid() = user_id);

-- Allow anonymous access for demo (optional - remove in production)
-- CREATE POLICY "Allow anonymous access" ON scenarios
--   FOR ALL
--   USING (true)
--   WITH CHECK (true);
